class SIPCommunication {

    constructor(realm,sipCommunicationAccount, websocket_proxy_url, audioElement){
        this._init(realm, sipCommunicationAccount.PrivateIdentity, sipCommunicationAccount.PublicIdentity, sipCommunicationAccount.Password, sipCommunicationAccount.DisplayName, websocket_proxy_url);
        this._audioRemoteElement = audioElement;

        this._incomingCallCallback = null;
    }

    /*
    * PUBLIC METHODS
    */
    call(identity) {
        let callSession = this._sipStack.newSession(
            'call-audio', {
                events_listener: {
                    events: '*',
                    listener: (e) => this._callEventsListener(e)
                },
                audio_remote: this._audioRemoteElement
            });

        callSession.call(identity);
    }

    acceptCall() {
        if (this.incomingCallSession) {
            this.incomingCallSession.accept();
        }
    }

    rejectCall() {
        if (this.incomingCallSession) {
            this.incomingCallSession.reject();
        }
    }

    hangupCall() {
        if (this.incomingCallSession) {
            this.incomingCallSession.hangup();
        }
    }

    registerIncomingCallCallback(callback) {
        this._incomingCallCallback = callback;
    }

    /*
    * PRIVATE METHODS
    */
    _init(realm, privateIdentity, publicIdentity, password, displayName, websocket_proxy_url){
        let readyCallback = (e) => {
            this._createSipStack(realm, privateIdentity, publicIdentity, password, displayName, websocket_proxy_url);
        }

        let errorCallback = (e) => {
            console.error (e.message);
        }

        SIPml.init(readyCallback, errorCallback);
    }

    _createSipStack(realm, privateIdentity, publicIdentity, password, displayName, websocket_proxy_url){
        try {
            this._sipStack = new SIPml.Stack({
                realm: realm,
                impi: privateIdentity, //private
                impu: publicIdentity, //public
                password: password,
                display_name: displayName,
                websocket_proxy_url: websocket_proxy_url,
                outbound_proxy_url: null,
                ice_servers: "[]",
                enable_rtcweb_breaker: false,
                enable_early_ims: true, // Must be true unless you're using a real IMS network
                enable_media_stream_cache: true,
                events_listener: {events: '*', listener: (e) => this._stackEventsListener(e)}
            });

            this._sipStack.start();
        } catch(e) {
            console.error(e);
        }
    }

    _login(){
        this._registerSession = this._sipStack.newSession(
            'register',
            {
                events_listener: {events: '*', listener: (e) => this._sessionEventsListener(e)}
            });

        this._registerSession.register();
    }

    /*
     * EVENT HANDLER
     */
    _stackEventsListener(event) {
        console.log('Stack Event.', event.type);
        if(event.type == 'started'){
            this._login();
        }
        else if(event.type == 'i_new_call'){
            // incoming audio/video call
            this.incomingCallSession = event.newSession;
            this.incomingCallSession.setConfiguration({
                audio_remote:  this._audioRemoteElement,
                events_listener: { events: '*', listener: (e) => this._callEventsListener(e)},
            });
            if(this.onCallIncoming){
                this.onCallIncoming();
            }
        }
    }

    _sessionEventsListener(event) {
        console.log('Session Event.', event.type);
    }

    _callEventsListener(event) {
        console.log('Call Event.', event.type);
        if(event.type == 'connected'){
            this._audioRemoteElement.play();
        }
        if(event.type == 'terminated'){
            if(this.onCallTerminated){
                this.onCallTerminated();
            }
        }
    }

}
