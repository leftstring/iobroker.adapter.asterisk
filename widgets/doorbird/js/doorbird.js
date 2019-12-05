"use strict";

let sipCommunication;

console.log("start widget");

vis.binds.doorbird = {
	version: "0.9.0",
    init: function (adapterInstance) {   
		vis.binds.doorbird.adapterInstance = adapterInstance;
	},
	initPreview: function(previewImage) {
		//vis.states.bind(adapterInstance + ".previewImage.val", (e, val) => {	});
		setInterval(()=> {
			console.log("update preview image");
			vis.conn.getStates(null, (error, data)=>{vis.updateStates(data);})
			previewImage.src = vis.states[vis.binds.doorbird.adapterInstance + ".previewImage.val"];
		}, 1000)		

		console.log("init preview image");
		vis.conn.getStates(null, (error, data)=>{vis.updateStates(data);})
		previewImage.src = vis.states[vis.binds.doorbird.adapterInstance + ".previewImage.val"];
	},
	initSIP: function(audioElement) {
		// currently raises an error:
		// SyntaxError: Unexpected token u in JSON at position 0SyntaxError: Unexpected token u in JSON at position 0

		//vis.conn.getStates(null, (error, data)=>{vis.updateStates(data);})
		
		//const astersikConfJSON = vis.states[vis.binds.doorbird.adapterInstance + ".config.val"];
		//const astersikConf = JSON.parse(astersikConfJSON);

		//const realm = astersikConf.asteriskRealm;
		//const privateIdentity = astersikConf.asteriskPrivateIdentity;
		//const publicIdentity = astersikConf.asteriskPublicIdentity;
		//const password = astersikConf.asteriskPassword;
		//const displayName = 'ioBroker Doorbird Adapter';

		//sipCommunication = new SIPCommunication(realm, impi, publicIdentity, password, displayName, audioElement);
	},
	openDoor: function() {
		console.log("open door...");
		vis.setValue(vis.binds.doorbird.adapterInstance + ".openDoorRequested", true);
	},	
	call: function() {
		console.log("call...");
		var previewImage = document.getElementById("preview-img");
		previewImage.style.display = "none";
		var videoElement = document.getElementById("video_remote");
		videoElement.style.display = "block";
		videoElement.src = vis.states[vis.binds.doorbird.adapterInstance + ".videoSource.val"];

		sipCommunication.call('6002');
	}	
};