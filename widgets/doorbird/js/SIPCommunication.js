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
                    listener: this._callEventsListener
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
            events_listener: {events: '*', listener: this._stackEventsListener}
        });

        this._sipStack.start();
    }

    _login(){
        this._registerSession = this._sipStack.newSession(
            'register',
            {events_listener: {events: '*', listener: this._sessionEventsListener}
            });

        this._registerSession.register();
    }

    /*
     * EVENTHANDLER
     */
    _stackEventsListener(event) {
        if(event.type == 'started'){
            console.log('Stack Event.', 'Started.');
            this._login();
        }
    }

    _sessionEventsListener(event) {
        if(event.type == 'connected'){
            console.log('Session Event.', 'Connected.');
        }
    }

    _callEventsListener(event) {
        console.log('Call Event.', event.type);
    }

}
