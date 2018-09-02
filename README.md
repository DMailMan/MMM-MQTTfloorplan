# Magic Mirror Module: MMM-MQTTfloorplan

## Untested: this module is still in the very early stages of development and doesn't work yet !

This [MagicMirror2](https://github.com/MichMich/MagicMirror) module allows you to show a floorplan of your house / apartment with the current state of lights, door/window contacts, and labels provided by messages on a series of MQTT message queues.
Unlike most other modules, the data is frequently read from the queue, so state changes are quickly shown.

Most other floorplan modules require a very specific back-end server such as piMatic or openhab. This module is intended to provide a single front end that can be fed data from any server backend that is able to generate MQTT messages. This visual display is otherwise the same as the OpenHab original floorplan module.

![Example floorplan](https://forum.magicmirror.builders/uploads/files/1473878353822-openhabfloorplan-running.png "Example floorplan")

## Installation

In your terminal, go to your MagicMirror's Module folder:
````
cd ~/MagicMirror/modules
````

Clone this repository:
````
git clone https://github.com/DMailMan/MMM-MQTTfloorplan.git
````

## Preparing the Floorplan

First of all, you should create an image showing your individual floorplan.
You can use `MMM-MQTTfloorplan/images/floorplan-default.png` as template (shown [here](images/README.md)) and use an image editor like [paint.net](http://www.getpaint.net/index.html) to change it as you like.
Save it as `MMM-MQTTfloorplan/images/floorplan.png` (leave `floorplan-default.png` untouched).

## Configuring the Module

Now add the module to the modules array in the `config/config.js` file.
Yes, the configuration looks complicated, but there is quite a lot that can be configured.
The in-line comments should explain everything you need to know, so copy this sample configuration and adjust it to your individual MQTT server, MQTT topics & devices, and your floorplan.
````javascript
modules: [
	{
		module: 'MMM-MQTTfloorplan',
		position: 'bottom_left', // this can be any of the regions
		config: {
			mqttServer: {
				url: "http://mqtt-broker:1880", // must not have a trailing slash!
				user: "", // only if you have authentication enabled
				password: "", // only if you have authentication enabled
			},
			floorplan: {
				image: "floorplan-default.png", // image in subfolder 'images'; change to floorplan.png to avoid git repository changes
				width: 400, // this must be the width of the image above
				height: 333, // this must be the height of the image above
			},
			// lights: { // this part shows default settings for lights; may optionally be overwritten
			//	image: "light.png", // located in subfolder 'images'
			//	width: 19, // image width
			//	height: 19, // image height
			// },
			// window: { // this part shows default settings for windows; may optionally be overwritten
			//	defaultColor: "red", // css format, i.e. color names or color codes
			// },
			// label: { // this part shows default settings for labels; may optionally be overwritten
			//	defaultColor: "grey", // css format
			//	defaultSize: "medium", // value of font-size style, e.g. xx-small, small, medium, large, x-large, 1.2em, 20px
			// },
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
			]
			// Replace the below with better examples of Subs types
			windows: { // list all window / door contacts to be shown 
				// 'topic name': left, top, radius (draws quadrant), midPoint, and optionally counterwindow and color
				Reed_Door:           { left: 232, top: 289, radius: 32, midPoint: "bottom-right", color: "orange" },
				Reed_Entry:          { left: 188, top: 298, radius: 23, midPoint: "bottom-left" },
				Reed_Living:         { left: 12,  top: 106, radius: 29, midPoint: "top-left", counterwindow: "vertical" },
				Reed_Dining_right:   { left: 170, top: 12,  radius: 29, midPoint: "top-left", counterwindow: "horizontal" },
				Reed_Dining_left:    { left: 141, top: 12,  radius: 29, midPoint: "top-left" },
				Reed_Kitchen:        { left: 283, top: 44,  radius: 30, midPoint: "top-right", color: "orange" },
				Reed_Utility:        { left: 359, top: 180, radius: 29, midPoint: "bottom-right" },
				Reed_Sleeping_right: { left: 12,  top: 231, radius: 30, midPoint: "top-left" },
				// 'topic name': left, top, width, height (draws rectangle), and optionally color
				Reed_Sleeping_left:  { left: 90,  top: 301, width: 37, height: 20 },
				Reed_Bath:           { left: 275, top: 301, width: 37, height: 20 },
			},
			labels: { // list all strings to be shown (may probably be any openhab type, resonable for String and Number)
				// 'topic name': left, top, and optionally color, font size, prefix, postfix, and number of decimals for floating numbers
				Temperature_Entry:          { left: 162, top: 280 },
				Temperature_Living:         { left: 22,  top: 72,  decimals: 1 },
				Temperature_Dining_right:   { left: 200, top: 25,  color: "white", size: "x-small" },
				Temperature_Dining_left:    { left: 135, top: 25,  color: "white", size: "x-small" },
				Temperature_Utility:        { left: 345, top: 220, color: "green", decimals: 2 },
				Temperature_Sleeping_right: { left: 22,  top: 242, prefix: "outside: ", postfix: "°C" },
				Temperature_Sleeping_left:  { left: 58,  top: 280, prefix: "inside: ", postfix: "°C" },
				Temperature_Bath:           { left: 277, top: 280, postfix: "°C", decimals: 1 },
			}
		}
	},
]
````

## Credits
This module is a hybrid of both  https://github.com/ottopaulsen/MMM-MQTT and https://github.com/paphko/mmm-openhabfloorplan and wouldn't exist without them.