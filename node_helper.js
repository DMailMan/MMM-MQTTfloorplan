var mqtt = require('mqtt');
var NodeHelper = require("node_helper");

var topics = [];

module.exports = NodeHelper.create({

	start: function () {
		console.log('Starting node helper for: ' + this.name);
		this.loaded = false;
	},

	socketNotificationReceived: function (notification, payload) {
		var self = this;

		if (notification === 'MQTT_CONFIG') {
			self.config = payload;

			// Read topics to subscribe to.
			// Could be either lights or windows, but both represent topic names
			// Maybe just use a lambda iterator here, not a for loop ?
			for (i = 0; i < self.config.lights.length; i++) {
				// Topic names will be the key of the JSON so need different approach to original
				for (var key in self.config.lights) {
					var topic = items[key];
				}
				topics[i] = self.config.lights[i].topic;
			}

			// TODO: Will have to simply append to the end of the topics list, rather than address by number
			for (i = 0; i < self.config.windows.length; i++) {
				topics[i] = self.config.windows[i].topic;
			}

			self.loaded = true;
			self.options = {};

			if (self.config.mqttServer.user)     self.options.username = self.config.mqttServer.user;
			if (self.config.mqttServer.password) self.options.password = self.config.mqttServer.password;

			var server = (self.config.mqttServer.url.match(/^mqtts?:\/\//) ? '' : 'mqtt://') + self.config.mqttServer.url;
			console.log(self.name + ': Connecting to ' + server);

			self.client = mqtt.connect(server, self.options);

			self.client.on('error', function (err) {
				console.log(self.name + ': Error: ' + err);
			});

			self.client.on('reconnect', function (err) {
				self.value = 'reconnecting';
			});

			self.client.on('connect', function (connack) {
				console.log(self.name + ' connected to ' + self.config.mqttServer.url);
				console.log(self.name + ': subscribing to ' + topics);
				self.client.subscribe(topics);
			});

			self.client.on('message', function (topic, payload) {
				// Find correct topic
				if (topics.includes(topic)) {
					var value = payload.toString();
					self.sendSocketNotification('MQTT_PAYLOAD', {
						topic: topic,
						value: value
					});
				}
			});
		}
	},
});