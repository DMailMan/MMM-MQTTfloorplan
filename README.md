# Magic Mirror Module: MMM-MQTTfloorplan

This [MagicMirror2](https://github.com/MichMich/MagicMirror) module allows you to show a floorplan of your house / apartment with the current state of PIR motion sensors, lights, door/window contacts, gates and labels provided by messages on a series of MQTT message queues.
The display is updated as soon as the MQTT message is seen on the queue.

Most other floorplan modules require a very specific back-end server such as piMatic or openhab. This module is intended to provide a single front end that can be fed data from any server backend that is able to generate MQTT messages. This visual display is otherwise very similar to the OpenHab original floorplan module, with a couple of additions.

One addition is support for a type of object labelled as a 'gate', which can be either the default size (64x64 pixels) or 'tiny' which is 32x32. Open doors and gates are coloured red, and are white when closed.

Another addition is motion-capture objects. These are designed to be fed status updates from passive infrared (PIR) sensors, and will display a red figure in motion when triggered. They will also fade to black over time (default is 20 seconds) after motion is last seen, thus providing a simple 'heat map' of activity in your home.

Finally, this module uses images for open doors/windows, rather than drawing quadrants, as the Openhab module did.

![Example floorplan](https://github.com/DMailMan/MMM-MQTTfloorplan/blob/master/example-floorplan.PNG "Example floorplan")

## Installation

In your terminal, go to your MagicMirror's Module folder:
````
cd ~/MagicMirror/modules
````

Clone this repository:
````
git clone https://github.com/DMailMan/MMM-MQTTfloorplan.git
cd MMM-MQTTfloorplan
npm install
````

## Preparing the Floorplan

First of all, you should create an image showing your individual floorplan.
You can use `MMM-MQTTfloorplan/images/floorplan-default.png` as template (shown [here](images/README.md)) and use an image editor like [paint.net](http://www.getpaint.net/index.html) to change it as you like.
Save it as `MMM-MQTTfloorplan/images/floorplan.png` or change the image name in the defaults.floorplan.image setting as appropriate (best to leave `floorplan-default.png` untouched).

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
				url: "mqtt-broker", // must not have a trailing slash. Might need to use an IP address 
									// to avoid name lookup problems (e.g. if running in a Docker container)
				user: "", // only if you have authentication enabled
				password: "", // only if you have authentication enabled
			},
			floorplan: {
				image: "floorplan-default.png", // image in subfolder 'images'; change to floorplan.png to avoid git repository changes
				width: 400, // this must be the width of the image above
				height: 333, // this must be the height of the image above
			},
			subscriptions: [
			{
				topic: 'devices/ground/kitchen/lights/status', // MQTT Topic name
				label: 'Ceiling Lights',	// Not displayed anywhere, but handy for you to know what you're doing !
				type: 'light',
				display: { left: 50, top: 50 },
			},
			{
				topic: 'devices/ground/kitchen/pir/status',
				label: 'Kitchen Presence',
				type: 'motion',		
				display: { left: 100, top: 150 },
			},
			{
				topic: 'devices/ground/kitchen/door/status',
				label: 'Kitchen Outside Door',
				type: 'door',
				display: { left: 220, top: 350 },
			},
			{
				topic: 'devices/gate/tempC',
				label: 'Gate Box Temp',
				type: 'label',
				display: { left: 265, top: 0, prefix: "", suffix: "°C", decimals: 0 },
			},
			{   topic: 'devices/outside/driveway/gardengate/status',
				label: 'Back Garden Gate',
				type: 'gates',
				display: { left: 285, top: 250, tiny: true}, // Tiny is optional - toggles 64 or 32 px images
			},
			]
		}
	},
]
````

## Credits
This module is a hybrid of both  https://github.com/ottopaulsen/MMM-MQTT and https://github.com/paphko/mmm-openhabfloorplan and wouldn't exist without them.
