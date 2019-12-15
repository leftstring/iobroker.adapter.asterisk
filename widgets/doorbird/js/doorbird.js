"use strict";

let sipCommunication;

console.log("start widget");

vis.binds.doorbird = {
	version: "0.9.0",
    init: function (adapterInstance) {   
		vis.binds.doorbird.adapterInstance = adapterInstance;
	},
	initSIP: function(audioElement) {
		vis.conn.getStates(null, (error, data) => {
			vis.updateStates(data);
		
			const astersikConfJSON = vis.states[vis.binds.doorbird.adapterInstance + ".config.val"];
			const astersikConf = JSON.parse(astersikConfJSON);

			const realm = astersikConf.asteriskRealm;
			const privateIdentity = astersikConf.asteriskPrivateIdentity;
			const publicIdentity = astersikConf.asteriskPublicIdentity;
			const password = astersikConf.asteriskPassword;
			const displayName = 'ioBroker Doorbird Adapter';		

			sipCommunication = new SIPCommunication(realm, privateIdentity, publicIdentity, password, displayName, audioElement);
			sipCommunication.onCallIncoming = vis.binds.doorbird.onCallIncoming;
			sipCommunication.onCallEnded = vis.binds.doorbird.onCallEnded;
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
	onCallEnded: function() {		
		console.log("call ended");	
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
		var videoElement = document.getElementById("videoElement");			
		videoElement.src = vis.states[vis.binds.doorbird.adapterInstance + ".videoSource.val"];		
	},
	openDoor: function() {
		console.log("open door");
		vis.setValue(vis.binds.doorbird.adapterInstance + ".openDoorRequested", true);
	}
};