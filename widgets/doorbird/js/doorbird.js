"use strict";

window.onload = function () {	
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
};

function openDoor() {
	console.log("open door...");
	vis.setValue("doorbird.0.testVariable", true);
}