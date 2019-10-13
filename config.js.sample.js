/* Magic Mirror Config Sample
 *
 * By Michael Teeuw http://michaelteeuw.nl
 * MIT Licensed.
 *
 * For more information how you can configurate this file
 * See https://github.com/MichMich/MagicMirror#configuration
 *
 */

var config = {
        address: "0.0.0.0", // Address to listen on, can be:
        // - "localhost", "127.0.0.1", "::1" to listen on loopback interface
        // - another specific IPv4/6 to listen on a specific interface
        // - "", "0.0.0.0", "::" to listen on any interface
        // Default, when address config is left out, is "localhost"
        port: 8080,
        // ipWhitelist: ["127.0.0.1", "::ffff:127.0.0.1", "::1"], // Set [] to allow all IP addresses
        ipWhitelist: [], // Set [] to allow all IP addresses
        // or add a specific IPv4 of 192.168.1.5 :
        // ["127.0.0.1", "::ffff:127.0.0.1", "::1", "::ffff:192.168.1.5"],
        // or IPv4 range of 192.168.3.0 --> 192.168.3.15 use CIDR format :
        // ["127.0.0.1", "::ffff:127.0.0.1", "::1", "::ffff:192.168.3.0/28"],

        language: "en",
        timeFormat: 24,
        units: "metric",

        modules: [
                {
                        module: "MMM-MQTTfloorplan",
                        position: "bottom_left",
                        config: {
                                mqttServer: { url: '192.168.0.5' }, 
                                subscriptions: [
                                        {
                                                topic: 'devices/ground/porch/pir/status',
                                                label: 'Porch Presence',
                                                type: 'motion',
                                                display: { left: 50, top: 30 },
                                        },
                                        {
                                                topic: 'devices/ground/kitchen/pir/status',
                                                label: 'Kitchen Presence',
                                                type: 'motion',
                                                display: { left: 110, top: 350, tiny: false },
                                        },
                                        {
                                                topic: 'devices/ground/kitchen/lights/status',
                                                label: 'Kitchen Ceiling Lights',
                                                type: 'light',
                                                display: { left: 145, top: 350 },
                                        },
                                        {
                                                topic: 'devices/ground/kitchen/door/status',
                                                label: 'Kitchen Outside Door',
                                                type: 'door',
                                                display: { left: 220, top: 350 },
                                        },
                                        {
                                                topic: 'devices/ground/lounge/pir/status',
                                                label: 'Lounge Presence',
                                                type: 'motion',
                                                display: { left: 150, top: 60 },
                                        },
                                        {
                                                topic: 'devices/ground/hall/zone/status',
                                                label: 'Hallway Presence',
                                                type: 'motion',
                                                display: { left: 50, top: 120 },
                                        },
                                        {
                                                topic: 'devices/ground/hallway/temperature/status',
                                                label: 'Hallway Temp',
                                                type: 'label',
                                                display: { left: 60, top: 155, suffix: "°C", decimals: 1, size: "small", color: "red" },  //Default size > medium / color > grey 
                                        },
                                        {       topic: 'devices/outside/driveway/gates/status',
                                        	label: 'Driveway Gates',
                                        	type: 'gates',
                                        	display: { left: 255, top: 30 },
                                        },
                                        {       topic: 'devices/outside/driveway/gardengate/status',
                                        	label: 'Back Garden Gate',
                                                type: 'gates',
                                        	display: { left: 285, top: 250, tiny: true},
                                        },
                                ]

                        },
                },
        ]

};

/*************** DO NOT EDIT THE LINE BELOW ***************/
if (typeof module !== "undefined") { module.exports = config; }

