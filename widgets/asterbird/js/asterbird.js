"use strict";

let sipCommunication;

console.log("start widget");

vis.binds.asterbird = {
	version: "0.9.0",
    init: function (adapterInstance, widgetId) {
		vis.binds.asterbird.adapterInstance = adapterInstance;

		console.log("Widget ID: ", widgetId);
		vis.binds.asterbird.widgetElement = document.getElementById(widgetId);

        if(vis.binds.asterbird.widgetElement){
			vis.binds.asterbird.widgetElement.style.visibility = "hidden";
			console.log("Visibility of Elment: ", vis.binds.asterbird.widgetElement.style.visibility);
		}

		console.log("Passed init method");
	},
	initSIP: function(audioElement) {
		vis.conn.getStates(null, (error, data) => {
			console.log("Start initSIP method");
			vis.updateStates(data);

			audioElement.volume = 0.5;

			const astersikConfJSON = vis.states[vis.binds.asterbird.adapterInstance + ".config.val"];
			const astersikConf = JSON.parse(astersikConfJSON);

			const realm = astersikConf.asteriskRealm;
			const websocket_proxy_url = astersikConf.websocketProxyUrl;

			const sipCommunicationAccount = new SIPCommunicationAccount();

			let privateIdentity = null;
			let publicIdentity = null;
			let password = null;
			let displayName = null;

			if(sipCommunicationAccount.IsCorrectInitialized()){
				privateIdentity = sipCommunicationAccount.PrivateIdentity;
				publicIdentity = sipCommunicationAccount.PublicIdentity;
				password = sipCommunicationAccount.Password;
				displayName = sipCommunicationAccount.DisplayName;
			} else {
				const privateIdentity = astersikConf.asteriskPrivateIdentity;
				const publicIdentity = astersikConf.asteriskPublicIdentity;
				const password = astersikConf.asteriskPassword;
				const displayName = 'ioBroker Doorbird Adapter';

				sipCommunicationAccount.setAccountData(privateIdentity, publicIdentity, password, displayName);
			}

			sipCommunication = new SIPCommunication(realm, privateIdentity, publicIdentity, password, displayName, websocket_proxy_url, audioElement);
			sipCommunication.onCallIncoming = vis.binds.asterbird.onCallIncoming;
			sipCommunication.onCallTerminated = vis.binds.asterbird.onCallTerminated;
			console.log("Passed initSIP method");
		});
	},
	onCallIncoming: function() {
		console.log("call incoming");
		var videoElement = document.getElementById("videoElement");
		vis.binds.asterbird.intervall = setInterval(()=> {
			console.log("update preview image");
			videoElement.src = undefined;
			videoElement.src = vis.states[vis.binds.asterbird.adapterInstance + ".imageSource.val"];
		}, 1000)
	},
	onCallTerminated: function() {
		console.log("call terminated");
		if(vis.binds.asterbird.intervall) {
			clearInterval(vis.binds.asterbird.intervall);
		 	vis.binds.asterbird.intervall = undefined;
		}
		var videoElement = document.getElementById("videoElement");
		videoElement.src = undefined;
	},
	acceptCall: function() {
		console.log("accept call");
		sipCommunication.acceptCall();
		console.log("show video stream");
		if(vis.binds.asterbird.intervall) {
			clearInterval(vis.binds.asterbird.intervall);
		 	vis.binds.asterbird.intervall = undefined;
		}
		var videoElement = document.getElementById("videoElement");
		videoElement.src = vis.states[vis.binds.asterbird.adapterInstance + ".videoSource.val"];
	},
	openDoor: function() {
		console.log("open door");
		vis.setValue(vis.binds.asterbird.adapterInstance + ".openDoorRequested", true);
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
