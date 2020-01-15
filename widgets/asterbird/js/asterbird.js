"use strict";

let sipCommunication;
let sipCommunicationAccount;

console.log("ASTERBIRD ", "start widget");

vis.binds.asterbird = {
	version: "0.9.0",
    isCallIncoming: false,
    isInCall: false,
    init: function (adapterInstance) {
		vis.binds.asterbird.adapterInstance = adapterInstance;

		console.log("ASTERBIRD ","Passed init method");

	},
	initSIP: function(audioElement) {
		if(!vis.editMode) {
			console.log("ASTERBIRD ","Join initSIP method");
			var dps= [vis.binds.asterbird.adapterInstance + '.videoSource',vis.binds.asterbird.adapterInstance + '.imageSource',vis.binds.asterbird.adapterInstance + '.openDoorRequested',vis.binds.asterbird.adapterInstance + '.config'];
			vis.conn.getStates(dps, (error, data) => {
				console.log("ASTERBIRD ","Start initSIP method");
				vis.updateStates(data);
				console.log("ASTERBIRD ","Updated states.");

				audioElement.volume = 0.5;

				if(!sipCommunication) {

					const astersikConfJSON = vis.states[vis.binds.asterbird.adapterInstance + ".config.val"];
					const astersikConf = JSON.parse(astersikConfJSON);

					const realm = astersikConf.asteriskRealm;
					const websocket_proxy_url = astersikConf.websocketProxyUrl;

					sipCommunicationAccount = new SIPCommunicationAccount();




					if (sipCommunicationAccount.IsCorrectInitialized()) {
							console.log("ASTERBIRD ","Create new SIP comm.");
							sipCommunication = new SIPCommunication(realm, sipCommunicationAccount, websocket_proxy_url, audioElement);
							sipCommunication.onCallIncoming = vis.binds.asterbird.onCallIncoming;
							sipCommunication.onCallTerminated = vis.binds.asterbird.onCallTerminated;
					} else {
						vis.binds.asterbird.requestAsteriskAccountData(realm, websocket_proxy_url, audioElement);
					}

				} else {
					console.log("ASTERBIRD ","Sip comm already there.");
				}

				console.log("ASTERBIRD ","Passed initSIP method");
			});
		}
	},
	initWidgetElement: function(widgetElement) {
		if(!vis.editMode){
			widgetElement.style.visibility = "hidden";

			vis.binds.asterbird.widgetElement = widgetElement;
		}
	},
	initAcceptCallBtn: function(element) {
		if(!vis.editMode){
			element.disabled = true;
		}
	},
	initEndCallBtn: function(element) {
		if(!vis.editMode){
			element.disabled = true;
		}
	},

	onCallIncoming: function() {
		console.log("ASTERBIRD ","call incoming");
        vis.binds.asterbird.isCallIncoming = true;
		vis.binds.asterbird.widgetElement.style.visibility = "visible";
		document.getElementById("acceptCallBtn").disabled = false;
		document.getElementById("endCallBtn").disabled = true;

		var videoElement = document.getElementById("videoElement");
		vis.binds.asterbird.intervall = setInterval(()=> {
			console.log("ASTERBIRD ","update preview image");
			videoElement.src = undefined;
			videoElement.src = vis.states[vis.binds.asterbird.adapterInstance + ".imageSource.val"];
		}, 1000)
	},
	onCallTerminated: function() {
		console.log("ASTERBIRD ","call terminated");

		vis.binds.asterbird.widgetElement.style.visibility = "hidden";
		document.getElementById("acceptCallBtn").disabled = true;
		document.getElementById("endCallBtn").disabled = true;

		if(vis.binds.asterbird.intervall) {
			clearInterval(vis.binds.asterbird.intervall);
		 	vis.binds.asterbird.intervall = undefined;
		}
		var videoElement = document.getElementById("videoElement");
		videoElement.src = undefined;

        vis.binds.asterbird.isCallIncoming = false;
        vis.binds.asterbird.isInCall = false;
	},
	acceptCall: function() {
		console.log("ASTERBIRD ","accept call");
		sipCommunication.acceptCall();
		document.getElementById("acceptCallBtn").disabled = true;
		document.getElementById("endCallBtn").disabled = false;
        vis.binds.asterbird.isInCall = true;
        vis.binds.asterbird.isCallIncoming = false;
		console.log("ASTERBIRD ","show video stream");
		if(vis.binds.asterbird.intervall) {
			clearInterval(vis.binds.asterbird.intervall);
		 	vis.binds.asterbird.intervall = undefined;
		}
		var videoElement = document.getElementById("videoElement");
		videoElement.src = vis.states[vis.binds.asterbird.adapterInstance + ".videoSource.val"];
	},
    endCall: function() {
		console.log("end call");

		if(vis.binds.asterbird.isInCall)
		    sipCommunication.hangupCall();

        if(vis.binds.asterbird.isCallIncoming)
		    sipCommunication.rejectCall();

		document.getElementById("acceptCallBtn").disabled = true;
		document.getElementById("endCallBtn").disabled = true;
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
	},
	requestAsteriskAccountData: function (realm, websocket_proxy_url, audioElement) {
		console.log("ASTERBIRD ","Open dialog for asterisk account data.")
		const accountDataDialog = document.getElementById("accountDataDialog");
		dialogPolyfill.registerDialog(accountDataDialog);

        var cancelButton = document.getElementById('cancel');
        var confirmButton = document.getElementById('confirm');

        cancelButton.addEventListener('click', function() {
            accountDataDialog.close();
        });

        confirmButton.addEventListener('click', function() {
            vis.binds.asterbird.onAccountDataDialogSubmit(realm, websocket_proxy_url, audioElement);
            accountDataDialog.close();
        });

		accountDataDialog.showModal();
	},
    onAccountDataDialogSubmit(realm, websocket_proxy_url, audioElement){
        const privateIdentityElement = document.getElementById("accountDataDialogPrivateIdentity");
        const publicIdentityElement = document.getElementById("accountDataDialogPublicIdentity");
        const passwordElement = document.getElementById("accountDataDialogPassword");
        const displayNameElement = document.getElementById("accountDataDialogDisplayName");

        const privateIdentity = privateIdentityElement.value;
        const publicIdentity = publicIdentityElement.value;
        const password = passwordElement.value;
        const displayName = displayNameElement.value;

        sipCommunicationAccount.setAccountData(privateIdentity, publicIdentity, password, displayName);

        sipCommunication = new SIPCommunication(realm, sipCommunicationAccount, websocket_proxy_url, audioElement);
        sipCommunication.onCallIncoming = vis.binds.asterbird.onCallIncoming;
        sipCommunication.onCallTerminated = vis.binds.asterbird.onCallTerminated;
    }
};
