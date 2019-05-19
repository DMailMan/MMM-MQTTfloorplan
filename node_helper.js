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
		console.log(self.name + ': Received notification from socket of type ' + notification);

		if (notification === 'MQTT_CONFIG') {
			self.config = payload;

			// Read topics to subscribe to from the subscriptions list
			for (i = 0; i < self.config.subscriptions.length; i++) {
				topics[i] = self.config.subscriptions[i].topic;
			}

			self.loaded = true;
			self.options = {};

			if (self.config.mqttServer.user)     self.options.username = self.config.mqttServer.user;
			if (self.config.mqttServer.password) self.options.password = self.config.mqttServer.password;

			var server = (self.config.mqttServer.url.match(/^mqtts?:\/\//) ? '' : 'mqtt://') + self.config.mqttServer.url;
			console.log(self.name + ': Connecting to ' + server);

			self.client = mqtt.connect(server, self.options);

			// console.log(self.name + ': Result of client after MQTT connection attempt is ' + String(self.client));

			self.client.on('error', function (err) {
				console.log(self.name + ': Error: ' + String(err));
			});

			self.client.on('reconnect', function (err) {
				self.value = 'reconnecting';
			});

			self.client.on('offline', function (err) {
				console.log(self.name + ' Client has gone offline from broker');
			});

			self.client.on('connect', function (connack) {
				console.log(self.name + ' connected to ' + self.config.mqttServer.url);
				console.log(self.name + ': subscribing to ' + topics);
				self.client.subscribe(topics, function(err) {
					if (err) { 
						console.log(self.name + ' Failed to subscribe to topics: ' + String(err) )
					}
				});
			});

			self.client.on('message', function (topic, payload) {
				// Only pass on messages in a topic that we know about
				console.log(self.name + ': Received MQTT message from topic ' + topic);

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
