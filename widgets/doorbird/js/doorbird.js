"use strict";

let sipCommunication;

console.log("start widget");

vis.binds.doorbird = {
	version: "0.9.0",
    init: function (adapterInstance, adapterWidget) {
		vis.binds.doorbird.adapterInstance = adapterInstance;
	},
	initSIP: function(audioElement) {
		vis.conn.getStates(null, (error, data) => {
			vis.updateStates(data);

			audioElement.volume = 0.5;

			const astersikConfJSON = vis.states[vis.binds.doorbird.adapterInstance + ".config.val"];
			const astersikConf = JSON.parse(astersikConfJSON);

			const realm = astersikConf.asteriskRealm;
			const privateIdentity = astersikConf.asteriskPrivateIdentity;
			const publicIdentity = astersikConf.asteriskPublicIdentity;
			const password = astersikConf.asteriskPassword;
			const displayName = 'ioBroker Doorbird Adapter';
			// const websocket_proxy_url = "wss://192.168.2.106:8089/ws";
			const websocket_proxy_url = astersikConf.websocketProxyUrl;

			sipCommunication = new SIPCommunication(realm, privateIdentity, publicIdentity, password, displayName, websocket_proxy_url, audioElement);
			sipCommunication.onCallIncoming = vis.binds.doorbird.onCallIncoming;
			sipCommunication.onCallTerminated = vis.binds.doorbird.onCallTerminated;
		});
	},
	onCallIncoming: function() {
		console.log("call incoming");
		var videoElement = document.getElementById("videoElement");
		vis.binds.doorbird.intervall = setInterval(()=> {
			console.log("update preview image");
			videoElement.src = undefined;
			videoElement.src = vis.states[vis.binds.doorbird.adapterInstance + ".imageSource.val"];
		}, 1000)
	},
	onCallTerminated: function() {
		console.log("call terminated");
		if(vis.binds.doorbird.intervall) {
			clearInterval(vis.binds.doorbird.intervall);
		 	vis.binds.doorbird.intervall = undefined;
		}
		var videoElement = document.getElementById("videoElement");
		videoElement.src = undefined;
	},
	acceptCall: function() {
		console.log("accept call");
		sipCommunication.acceptCall();
		console.log("show video stream");
		if(vis.binds.doorbird.intervall) {
			clearInterval(vis.binds.doorbird.intervall);
		 	vis.binds.doorbird.intervall = undefined;
		}
		var videoElement = document.getElementById("videoElement");
		videoElement.src = vis.states[vis.binds.doorbird.adapterInstance + ".videoSource.val"];
	},
	openDoor: function() {
		console.log("open door");
		vis.setValue(vis.binds.doorbird.adapterInstance + ".openDoorRequested", true);
	},
	volumeDown: function() {
		console.log("volume down");
		var audioElement = document.getElementById("audioRemote");
		var volumeSlider = document.getElementById("volume-slider");
		var volume = Math.max(audioElement.volume - 0.1, 0.1);
		audioElement.volume = volume;
		volumeSlider.value = volume;
	},
	volumeUp: function() {
		console.log("volume up");
		var audioElement = document.getElementById("audioRemote");
		var volumeSlider = document.getElementById("volume-slider");
		var volume = Math.min(audioElement.volume + 0.1, 1.0);;
		audioElement.volume = volume;
		volumeSlider.value = volume;
	},
	onVolumeChanged: function() {
		var audioElement = document.getElementById("audioRemote");
		var volumeSlider = document.getElementById("volume-slider");
		audioElement.volume = volumeSlider.value;
	}
};
