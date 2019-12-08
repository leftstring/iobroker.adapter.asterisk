class SIPCommunication {

    constructor(realm, privateIdentity, publicIdentity, password, displayName, audioElement){             
        this._init(realm, privateIdentity, publicIdentity, password, displayName);
        this._audioRemoteElement = audioElement;
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

    /*
    * PRIVATE METHODS
    */
    _init(realm, impi, impu, password, displayName){
        let readyCallback = (e) => {
            this._createSipStack(realm, impi, impu, password, displayName);
        }

        let errorCallback = (e) => {
            console.error (e.message);
        }

        navigator.webkitGetUserMedia = true;
        SIPml.init(readyCallback, errorCallback);
    }

    _createSipStack(realm, impi, impu, password, displayName){
        this._sipStack = new SIPml.Stack({
            realm: realm,
            impi: impi, //private
            impu: impu, //public
            password: password,
            display_name: displayName,
            websocket_proxy_url: "ws://192.168.11.31:8088/ws",
            outbound_proxy_url: null,
            ice_servers: null,
            enable_rtcweb_breaker: false,
            enable_early_ims: true, // Must be true unless you're using a real IMS network
            enable_media_stream_cache: true,
            events_listener: {events: '*', listener: (e) => this._stackEventsListener(e)}
        });

        this._sipStack.start();
    }

    _login(){
        this._registerSession = this._sipStack.newSession(
            'register',
            {
                events_listener: {events: '*', listener: (e) => this._sessionEventsListener(e)}
            });

        this._registerSession.register();
    }

    _acceptCall(event) {
        event.newSession.accept();
    }

    /*
     * EVENTHANDLER
     */
    _stackEventsListener(event) {
        console.log('Stack Event.', event.type);
        if(event.type == 'started'){        
            this._login();
        }
        else if(event.type == 'i_new_call'){ 
            // incoming audio/video call
            this._acceptCall(event);
        }
    }

    _sessionEventsListener(event) {
        console.log('Session Event.', event.type);
    }

    _callEventsListener(event) {
        console.log('Call Event.', event.type);
    }

}
