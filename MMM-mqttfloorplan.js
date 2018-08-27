Module.register("MMM-mqttfloorplan", {
	defaults: {
		mqttServer: {
			url: "http://jeeves.local:1880", // must not have trailing slash!
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
			image: "light.png", // located in subfolder 'images'
			width: 19, // image width
			height: 19, // image height
		},
		window: {
			defaultColor: "blue", // css format, i.e. color names or color codes
		},
		label: {
			defaultColor: "grey", // css format
			defaultSize: "medium", // value of font-size style, e.g. xx-small, x-small, small, medium, large, x-large, xx-large, 1.2em, 20px
		},
		lights: {
			/* list all light items to be shown, examples below. */
			// Light_Kitchen: { left: 50, top: 50 }, // name must match MQTT topic name (case sensitive!)
			// Example of complex payload structure: lighting/status,{"room":"Hall","channel":0,"command":"off"}
			// Ideally you will have a separate topic per light, with an ON/OFF or 0/255 code to show the status
			'devices/ground/kitchen/lights/status': { left: 50, top: 50 },
		},
		windows: {
			/* list all window / door contacts to be shown, examples below. */
			/* name must match MQTT topic name (case sensitive!) */
			/* Supported formats are rectangles, single wings, and wings with counterwindow. */
			// Reed_Front_Door: { left: 100, top: 20, width: 26, height: 35 }, // rectangular drawing
			// Reed_Back_Door: { left: 100, top: 50, width: 26, height: 35, color: "orange", }, // color may optionally be overwritten
			// Reed_Kitchen_Window: { left: 100, top: 100, radius: 30, midPoint: "top-left" }, // wing with specified radius and mid-point location
			// Reed_Livingroom_Window: { left: 100, top: 150, radius: 25, midPoint: "top-left", counterwindow: "horizontal" }, // wing with counterwindow
			'devices/ground/kitchen/pir/status': { left: 100, top: 150, radius: 25, midPoint: "top-left", counterwindow: "horizontal" },
		},
		labels: {
			/* list all strings to be shown, examples below. */
			// Temperature_Kitchen: { left: 200, top: 50 }, // label with default color and size
			// Temperature_Livingroom: { left: 200, top: 100, color: "white", size: "x-small" }, // small and white label
			// Temperature_Front_Door: { left: 200, top: 150, color: "white", decimals: 2 }, // small and show two decimal places of float value
			// Temperature_Back_Door: { left: 200, top: 200, prefix: "outside: ", postfix: "°C" }, // label with prefix and postfix
		},
		subscriptions: [
			{
				topic: 'sensor/1/temperature',
				label: 'Temperature',
				decimals: 1,
				suffix: '°C',
				location: { left: 100, top: 150, radius: 25, midPoint: "top-left", counterwindow: "horizontal" },
			},
			{
				topic: 'devices/ground/kitchen/pir/status',
				label: 'Kitchen PIR',
				decimals: 0,
				location: { left: 100, top: 150, radius: 25, midPoint: "top-left", counterwindow: "horizontal" },
			},
			{
				topic: 'guests',
				label: 'First guest',
				jsonpointer: '/people/0/name'
			}
		]
	},

	getScripts: function () {
		return [
			this.file('node_modules/jsonpointer/jsonpointer.js')
		];
	},

	start: function() {
		Log.info("Starting module: " + this.name);

		if (this.config.draft) {
			Log.info("Item states are not loaded because this module is in draft mode");
		} else if (this.valuesExist(this.config.windows) || this.valuesExist(this.config.lights) || this.valuesExist(this.config.labels)) {
			// Log.info("Requesting initial item states...");
			this.sendSocketNotification("GET_MQTT_ITEMS", this.config.mqtt); // request initial item states
		} else {
			Log.info("No items configured.");
		}

		this.subscriptions = [];

		console.log(this.name + ': Setting up ' + this.config.subscriptions.length + ' topics');

		for (i = 0; i < this.config.subscriptions.length; i++) {
			console.log(this.name + ': Adding config ' + this.config.subscriptions[i].label + ' = ' + this.config.subscriptions[i].topic);

			this.subscriptions[i] = {
				label: this.config.subscriptions[i].label,
				topic: this.config.subscriptions[i].topic,
				decimals: this.config.subscriptions[i].decimals,
				jsonpointer: this.config.subscriptions[i].jsonpointer,
				suffix: typeof (this.config.subscriptions[i].suffix) == 'undefined' ? '' : this.config.subscriptions[i].suffix,
				value: ''
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
        // Log.info("Notification received: " + notification);
        // Might only ever receive/process one message at a time 
        // In which case we don't need the array processing

		if (notification == "MQTT_ITEMS") {
			// Log.info("MQTT items received: " + JSON.stringify(payload)); // this may be huge!
            
            // Figure out structure of JSON format for MQTT messages here
            var items = this.config.openhab.version === 1 ? payload.item : payload;
			for (var key in items) {
				var item = items[key];
				this.updateDivForItem(item.name, item.state);
			}
		} else if (notification == "MQTT_ITEM") {
			// Log.info("MQTT item received: " + payload.item);
			this.updateDivForItem(payload.item, payload.state);
		}

		if(notification === 'MQTT_PAYLOAD'){
			if(payload != null) {
                for(i = 0; i < this.subscriptions.length; i++){
                    if(this.subscriptions[i].topic == payload.topic){
                        var value = payload.value;
                        // Extract value if JSON Pointer is configured
                        if(this.subscriptions[i].jsonpointer) {
                            value = get(JSON.parse(value), this.subscriptions[i].jsonpointer);
                        }
                        // Round if decimals is configured
                        if(isNaN(this.subscriptions[i].decimals) == false) {
                            if (isNaN(value) == false){
                                value = Number(value).toFixed(this.subscriptions[i].decimals);
                            }
                        }
                        this.subscriptions[i].value = value;
                    }
                }
				this.updateDom();
				this.updateDivForItem(payload.item, payload.state); // This bit from floorplan
			} else {
                console.log(this.name + ': MQTT_PAYLOAD - No payload');
            }
		}
	},

	updateDivForItem: function(item, state) {
		if (item in this.config.lights) {
			var visible = state == "ON" || (!isNaN(parseInt(state)) && parseInt(state) > 0);
			this.setVisible("mqtt_" + item, visible);
		} else if (item in this.config.windows) {
            // TODO: Seems to conflate Off with Open ? Surely they are opposites
			var visible = state == "OFF" || state == "OPEN";
			this.setVisible("mqtt_" + item, visible);
			if (this.config.windows[item].counterwindow !== 'undefined' && this.config.windows[item].radius !== 'undefined') {
				this.setVisible("mqtt_" + item + "_counterwindow", visible);
			}
		} else if (item in this.config.labels) {
			var element = document.getElementById("mqtt_" + item);
			if (element != null) {
				element.innerHTML = this.formatLabel(state, this.config.labels[item]);
			}
		}
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
		return (typeof config.prefix !== 'undefined' ? config.prefix : "") + formattedValue + (typeof config.postfix !== 'undefined' ? config.postfix : "");
	},

	getDom: function () {
		var floorplan = document.createElement("div");
		floorplan.style.cssText = "background-image:url(" + this.file("/images/" + this.config.floorplan.image) + ");"
			+ "top:-" + this.config.floorplan.height + "px;width:" + this.config.floorplan.width + "px;height:" + this.config.floorplan.height + "px;";
		this.appendWindows(floorplan);
		this.appendLights(floorplan);
		this.appendLabels(floorplan);
		return floorplan;
	},

	appendLights: function(floorplan) {
		for (var item in this.config.lights) {
			var position = this.config.lights[item];
			floorplan.appendChild(this.getLightDiv(item, position));
		}
	},
	getLightDiv: function(item, position) {
		// set style: location
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

	appendLabels: function(floorplan) {
		for (var item in this.config.labels) {
			var labelConfig = this.config.labels[item];
			floorplan.appendChild(this.getLabelDiv(item, labelConfig));
		}
	},
	getLabelDiv: function(item, labelConfig) {
		// default color and size, but may be overridden for each label
		var color = this.getSpecificOrDefault(labelConfig.color, this.config.label.defaultColor);
		var size  = this.getSpecificOrDefault(labelConfig.size,  this.config.label.defaultSize);

		// set style: location, color, font size
		var style = "margin-left:" + labelConfig.left + "px;margin-top:" + labelConfig.top + "px;position:absolute;";
		style += "color:" + color + ";font-size:" + size + ";";

		// create div, set style and text
		var labelDiv = document.createElement("div");
		labelDiv.id = 'mqtt_' + item;
		labelDiv.style.cssText = style;
		labelDiv.innerHTML = "&lt;" + item + "&gt;";
		return labelDiv;
	},

	appendWindows: function(floorplan) {
		for (var item in this.config.windows) {
			// get config for this window, create div, and append it to the floorplan
			var windowConfig = this.config.windows[item];
			floorplan.appendChild(this.getWindowDiv(item, windowConfig));

			// if 'counterwindow' is set, we must append another one according to given direction
			if (windowConfig.counterwindow !== 'undefined' && windowConfig.radius !== 'undefined') {
				// clone given window config for other wing of counterwindow: http://stackoverflow.com/questions/728360/how-do-i-correctly-clone-a-javascript-object
				var counterwindowConfig = JSON.parse(JSON.stringify(windowConfig));
				if (windowConfig.counterwindow == 'horizontal') {
					counterwindowConfig.left += windowConfig.radius
					counterwindowConfig.midPoint = this.getMirroredMidPoint(windowConfig.midPoint, true);
					floorplan.appendChild(this.getWindowDiv(item + "_counterwindow", counterwindowConfig));
				} else if (windowConfig.counterwindow == 'vertical') {
					counterwindowConfig.top += windowConfig.radius
					counterwindowConfig.midPoint = this.getMirroredMidPoint(windowConfig.midPoint, false);
					floorplan.appendChild(this.getWindowDiv(item + "_counterwindow", counterwindowConfig));
				}
			}
		}
	},
	getMirroredMidPoint: function(midPoint, horizontal) {
		if (horizontal  && midPoint.endsWith  ("left"))   return midPoint.slice(0, midPoint.indexOf('-')) + "-right";
		if (horizontal  && midPoint.endsWith  ("right"))  return midPoint.slice(0, midPoint.indexOf('-')) + "-left";
		if (!horizontal && midPoint.startsWith("top"))    return "bottom" + midPoint.slice(midPoint.indexOf('-'));
		if (!horizontal && midPoint.startsWith("bottom")) return "top"    + midPoint.slice(midPoint.indexOf('-'));
	},
	getWindowDiv: function(item, windowConfig) {
		// default color, but may be overridden for each window
		var color = this.getSpecificOrDefault(windowConfig.color, this.config.window.defaultColor);

		// prepare style with location and hide it!
		var style = "margin-left:" + windowConfig.left + "px;margin-top:" + windowConfig.top + "px;position:absolute;";
		if (!this.config.draft)
			style += "display:none;"; // hide by default, do not hide if all items should be shown

		// if radius is set, it's a wing with a radius
		if (typeof windowConfig.radius !== 'undefined') {
			var radius = windowConfig.radius;
			style += this.getRadiusStyle(radius, windowConfig.midPoint) + "height:" + radius + "px;width:" + radius + "px;";
		} else {
			// otherwise it's a rectengular window with width and height
			style += "height:" + windowConfig.height + "px;width:" + windowConfig.width + "px;";
		}

		// create div representing the window
		var windowDiv = document.createElement("div");
		windowDiv.id = 'mqtt_' + item;
		windowDiv.style.cssText = "background:" + color + ";" + style; // set color, location, and type-specific style
		return windowDiv
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

