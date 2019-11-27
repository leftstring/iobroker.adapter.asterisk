"use strict";

document.onload = function () {
	vis.registerOnChange(function () {
		// var request = new XMLHttpRequest();
		// request.open("GET", "http://192.168.178.63/bha-api/image.cgi?http-user=ghdggd0002&http-password=3pjUcjaUNA", true);
		// //request.setRequestHeader("Authorization", "Basic " + btoa("ghdggd0002:3pjUcjaUNA"));
		// request.responseType = "arraybuffer";
		// request.onload = function (e) {
		//   var arrayBuffer = request.response;
		//   if (arrayBuffer) {
		// 	var u8 = new Uint8Array(arrayBuffer);
		// 	var b64encoded = btoa(String.fromCharCode.apply(null, u8));
		// 	var mimetype="image/jpeg";
		// 	document.getElementById("image").src="data:"+mimetype+";base64,"+b64encoded;
		//   }
		// };
		// request.send();
		console.log("update image...");
		document.getElementById("image").src = undefined;
		document.getElementById("image").src = vis.states["doorbird.0.image.val"];
	}, "doorbird.0.image");
	document.getElementById("image").src = vis.states["doorbird.0.image.val"];

	const astersikConfJSON = vis.states["doorbird.0.config.val"];
	const astersikConf = JSON.parse(astersikConfJSON);

	const realm = astersikConf.asteriskRealm;
	const privateIdentity = astersikConf.asteriskPrivateIdentity;
	const publicIdentity = astersikConf.asteriskPublicIdentity;
	const password = astersikConf.asteriskPassword;
	const displayName = 'ioBroker Doorbird Adapter';
	const audioElement = document.getElementById('audio_remote');

	sipCommunication = new SIPCommunication(realm, impi, publicIdentity, password, displayName, audioElement);
};

function openDoor() {
	console.log("open door...");
	vis.setValue("doorbird.0.testVariable", true);
}

function call() {
	sipCommunication.call('6002');
}
