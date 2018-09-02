Module.register("MMM-MQTTloorplan", {
	defaults: {
		mqttServer: {
			url: "http://jeeves.local:1880", // must not have trailing slash! Replace with your MQTT broker address
			user: "",
			password: ""
		},
		floorplan: {
			/* store your image as 'floorplan.png' to avoid git repository changes. */
			image: "floorplan-default.png", // located in subfolder 'images'
			width: 400, // image width
			height: 333, // image height
		},
		light: {
			// Default display settings for objects of this type
			image: "light.png", // located in subfolder 'images'
			width: 19, // image width
			height: 19, // image height
		},
		door: {
			// Default display settings for objects of this type
			defaultColor: "blue", // css format, i.e. color names or color codes
		},
		label: {
			// Default display settings for objects of this type
			defaultColor: "grey", // css format
			defaultSize: "medium", // value of font-size style, e.g. xx-small, x-small, small, medium, large, x-large, xx-large, 1.2em, 20px
		},
			/* Examples of possible Label display settings below. */
				//  { left: 200, top: 50 }, // label with default color and size
				//  { left: 200, top: 100, color: "white", size: "x-small" }, // small and white label
				//  { left: 200, top: 150, color: "white", decimals: 2 }, // small and show two decimal places of float value
				//  { left: 200, top: 200, prefix: "outside: ", postfix: "°C" }, // label with prefix and postfix
			// For Lights, only a position is needed, so display format: " { left, top }"
				//  { left: 80,  top: 110 },
			// For Doors/Windows, format is left, top, radius (draws quadrant), midPoint, and optionally counterwindow and color
				//  { left: 232, top: 289, radius: 32, midPoint: "bottom-right", color: "orange" },
				//  { left: 188, top: 298, radius: 23, midPoint: "bottom-left" },
				//  { left: 12,  top: 106, radius: 29, midPoint: "top-left", counterwindow: "vertical" },
				// 	{ left: 90,  top: 301, width: 37, height: 20 }, // Simple rectangle
			// Not yet implemented Motion type yet, so no examples to offer
		subscriptions: [
			{
				topic: 'devices/ground/kitchen/lights/status',
				label: 'Ceiling Lights',
				type: 'light',
				decimals: 1,
				// suffix: '°C',
				display: { left: 50, top: 50 },
			},
			{
				topic: 'devices/ground/kitchen/pir/status',
				label: 'Kitchen Presence',
				type: 'motion',		// Not yet implemented
				decimals: 0,
				display: { left: 100, top: 150, radius: 25, midPoint: "top-left", counterwindow: "horizontal" },
			},
			{
				topic: 'devices/ground/lounge/pir/status',
				label: 'Lounge presence',
				type: 'motion',		// Not yet implemented
//				jsonpointer: '/people/0/name',
			},
			{
				topic: 'devices/ground/kitchen/door/status',
				label: 'Kitchen patio door',
				type: 'door',		// Also used for Windows - display options are the same
//				jsonpointer: '/people/0/name',
				display: { left: 90,  top: 301, width: 37, height: 20 },
			},
		]
	},

	getScripts: function () {
		return [
			this.file('node_modules/jsonpointer/jsonpointer.js')
		];
	},

	start: function() {
		Log.info("Starting module: " + this.name);

		this.subscriptions = [];

		console.log(this.name + ': Setting up ' + this.config.subscriptions.length + ' topics');

		for (i = 0; i < this.config.subscriptions.length; i++) {
			console.log(this.name + ': Adding config ' + this.config.subscriptions[i].label + ' = ' + this.config.subscriptions[i].label);

			// Copy the specific config into local storage for this module
			// Protect against missing entries for optional values to simplify usage later
			this.subscriptions[i] = {
				label: this.config.subscriptions[i].label,
				topic: this.config.subscriptions[i].topic,
				type: this.config.subscriptions[i].type,
				decimals: typeof (this.config.subscriptions[i].decimals) == 'undefined' ? '' : this.config.subscriptions[i].decimals,
				jsonpointer: typeof (this.config.subscriptions[i].jsonpointer) == 'undefined' ? '' : this.config.subscriptions[i].jsonpointer,
				suffix: typeof (this.config.subscriptions[i].suffix) == 'undefined' ? '' : this.config.subscriptions[i].suffix,
				value: '',
				display: this.config.subscriptions[i].display,
			}
		}

		this.openMqttConnection();
		var self = this;
		setInterval(function () {
			self.updateDom(1000);
		}, 10000);
	},

	openMqttConnection: function () {
		this.sendSocketNotification('MQTT_CONFIG', this.config);
	},

	valuesExist: function(obj) { return obj !== 'undefined' && Object.keys(obj).length > 0; },

	socketNotificationReceived: function(notification, payload) {
        console.log("Notification received: " + notification + " with payload " + payload);

		if(notification === 'MQTT_PAYLOAD'){
			if(payload != null) {
				var config = {};
                for(i = 0; i < this.subscriptions.length; i++){
                    if(this.subscriptions[i].topic == payload.topic){
                        var value = payload.value;
                        // Extract value if JSON Pointer is configured
                        if(this.subscriptions[i].jsonpointer != '') {
                            value = get(JSON.parse(value), this.subscriptions[i].jsonpointer);
                        }
                        // Round if decimals is configured
                        if(isNaN(this.subscriptions[i].decimals) == false) {
                            if (isNaN(value) == false){
                                value = Number(value).toFixed(this.subscriptions[i].decimals);
                            }
                        }
						this.subscriptions[i].value = value;
						config = this.subscriptions[i];
                    }
                }
				this.updateDom(); // Not sure if we need this here ?
				// Not sure if you can use the topic as the item name due to the slashes in it
				// TODO check this out
				this.updateDivForItem(
					payload.topic, 
					payload.value.toUpperCase(), 
					config);
			} else {
                console.log(this.name + ': MQTT_PAYLOAD - No payload');
            }
		}
	},

	updateDivForItem: function(item, state, config) {
		// Adjust display acccording to the type of thing that we're dealing with

		if (config.type == 'light') {
			var visible = state.includes("ON") || state.includes("OPEN") || (!isNaN(parseInt(state)) && parseInt(state) > 0);
			this.setVisible("mqtt_" + item, visible);

		} else if (config.type == 'door') {
			var visible = state.includes("OFF") || state.includes("CLOSED") || (!isNaN(parseInt(state)) && parseInt(state) == 0);
			this.setVisible("mqtt_" + item, visible);
			if (config.display.counterwindow !== 'undefined' && config.display.radius !== 'undefined') {
				this.setVisible("mqtt_" + item + "_counterwindow", visible);
			}

		} else if (config.type == 'label') {
			var element = document.getElementById("mqtt_" + item);
			if (element != null) {
				element.innerHTML = this.formatLabel(state, config.suffix);
			}
		}
		// TODO: config.type == 'motion'
	},

	setVisible: function(id, value) {
		var element = document.getElementById(id);
		if (element != null) {
			element.style.display = value ? "block" : "none";
		}
	},

	formatLabel: function(value, config) {
		var formattedValue = value;
		if (!isNaN(config.decimals) && !isNaN(value)) {
			formattedValue = parseFloat(value).toFixed(config.decimals);
		}
		return  (typeof config.prefix !== 'undefined' ? config.prefix : "") + 
				formattedValue + 
				(typeof config.suffix !== 'undefined' ? config.suffix : "");
	},

	getDom: function () {
		var floorplan = document.createElement("div");
		floorplan.style.cssText = "background-image:url(" + this.file("/images/" + this.config.floorplan.image) + ");"
			+ "top:-" + this.config.floorplan.height + "px;width:" + this.config.floorplan.width + "px;height:" + this.config.floorplan.height + "px;";
		
		this.appendSensors(floorplan);
		return floorplan;
	},

	appendSensors: function(floorplan) {
		for (var item in this.subscriptions) {
			var display = this.subscriptions[item].display;
			var type    = this.subscriptions[item].type;

			if(type == 'light') floorplan.appendChild(this.getLightDiv(item, display));
			if(type == 'label') floorplan.appendChild(this.getLabelDiv(item, display));
			if(type == 'door')  floorplan.appendChild(this.getDoorDiv(item,  display));
			// TODO: if(type == 'motion')  floorplan.appendChild(this.getDoorDiv(item,  display));

			// if a 'counterwindow' is set, we must append another one according to given direction
			if (display.counterwindow !== 'undefined' && display.radius !== 'undefined') {
				// clone given window config for other wing of counterwindow: http://stackoverflow.com/questions/728360/how-do-i-correctly-clone-a-javascript-object
				var counterdisplayConfig = JSON.parse(JSON.stringify(display));

				if (displayConfig.counterwindow == 'horizontal') {
					counterdisplayConfig.left += displayConfig.radius;
					counterdisplayConfig.midPoint = this.getMirroredMidPoint(displayConfig.midPoint, true);
					floorplan.appendChild(this.getDoorDiv(item + "_counterwindow", counterdisplayConfig));

				} else if (displayConfig.counterwindow == 'vertical') {
					counterdisplayConfig.top += displayConfig.radius;
					counterdisplayConfig.midPoint = this.getMirroredMidPoint(displayConfig.midPoint, false);
					floorplan.appendChild(this.getDoorDiv(item + "_counterwindow", counterdisplayConfig));
				}
			}
			
		}
	},

	getLightDiv: function(item, position) {
		// set style: display
		var style = "margin-left:" + position.left + "px;margin-top:" + position.top + "px;position:absolute;"
			+ "height:" + this.config.light.height + "px;width:" + this.config.light.width + "px;";
		if (!this.config.draft)
			style += "display:none;"; // hide by default, do not hide if all items should be shown

		// create div, set style and text
		var lightDiv = document.createElement("div");
		lightDiv.id = 'mqtt_' + item;
		lightDiv.style.cssText = style;
		lightDiv.innerHTML = "<img src='" + this.file("/images/" + this.config.light.image) + "' style='"
			+ "height:" + this.config.light.height + "px;width:" + this.config.light.width + "px;'/>";
		return lightDiv;
	},

	getLabelDiv: function(item, labelConfig) {
		// default color and size, but may be overridden for each label
		var color = this.getSpecificOrDefault(labelConfig.color, this.config.label.defaultColor);
		var size  = this.getSpecificOrDefault(labelConfig.size,  this.config.label.defaultSize);

		// set style: display, color, font size
		var style = "margin-left:" + labelConfig.left + "px;margin-top:" + labelConfig.top + "px;position:absolute;";
		style += "color:" + color + ";font-size:" + size + ";";

		// create div, set style and text
		var labelDiv = document.createElement("div");
		labelDiv.id = 'mqtt_' + item;
		labelDiv.style.cssText = style;
		labelDiv.innerHTML = "&lt;" + item + "&gt;";
		return labelDiv;
	},

	getDoorDiv: function(item, doorConfig) {
		// default color, but may be overridden for each door
		var color = this.getSpecificOrDefault(doorConfig.color, this.config.door.defaultColor);

		// prepare style with display 
		var style = "margin-left:" + doorConfig.left + "px;margin-top:" + doorConfig.top + "px;position:absolute;";

		// if radius is set, it's a wing with a radius
		if (typeof doorConfig.radius !== 'undefined') {
			var radius = doorConfig.radius;
			style += this.getRadiusStyle(radius, doorConfig.midPoint) + "height:" + radius + "px;width:" + radius + "px;";
		} else {
			// otherwise it's a rectangular door with width and height
			style += "height:" + doorConfig.height + "px;width:" + doorConfig.width + "px;";
		}

		// create div representing the door
		var doorDiv = document.createElement("div");
		doorDiv.id = 'mqtt_' + item;
		doorDiv.style.cssText = "background:" + color + ";" + style; // set color, display, and type-specific style
		return doorDiv
	},


	getMirroredMidPoint: function(midPoint, horizontal) {
		if (horizontal  && midPoint.endsWith  ("left"))   return midPoint.slice(0, midPoint.indexOf('-')) + "-right";
		if (horizontal  && midPoint.endsWith  ("right"))  return midPoint.slice(0, midPoint.indexOf('-')) + "-left";
		if (!horizontal && midPoint.startsWith("top"))    return "bottom" + midPoint.slice(midPoint.indexOf('-'));
		if (!horizontal && midPoint.startsWith("bottom")) return "top"    + midPoint.slice(midPoint.indexOf('-'));
	},

	getRadiusStyle: function(radius, midPoint) {
		// example from: http://1stwebmagazine.com/css-quarter-circle
		var radiusBounds = "0 0 " + radius + "px 0;"; // default: top-left
		if (midPoint == "top-right") {
			radiusBounds = "0 0 0 " + radius + "px;";
		} else if (midPoint == "bottom-left") {
			radiusBounds = "0 " + radius + "px 0 0;";
		} else if (midPoint == "bottom-right") {
			radiusBounds = radius + "px 0 0 0;";
		}
		return "border-radius: " + radiusBounds + " -moz-border-radius: " + radiusBounds + " -webkit-border-radius: " + radiusBounds;
	},

	getSpecificOrDefault: function(specificValue, defaultValue) {
		if (typeof specificValue !== 'undefined')
			return specificValue; // specific value is defined, so use that one!
		return defaultValue; // no specific value defined, use default value
	},
});

