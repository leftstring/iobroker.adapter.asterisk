import { isNullOrUndefined } from "util";

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

    acceptCall() {
        this.incomingCallEvent.newSession.accept();
    }

    /*
    * PRIVATE METHODS
    */
    _init(realm, privateIdentity, publicIdentity, password, displayName){
        let readyCallback = (e) => {
            this._createSipStack(realm, privateIdentity, publicIdentity, password, displayName);
        }

        let errorCallback = (e) => {
            console.error (e.message);
        }

        SIPml.init(readyCallback, errorCallback);
    }

    _createSipStack(realm, privateIdentity, publicIdentity, password, displayName){
        this._sipStack = new SIPml.Stack({
            realm: realm,
            impi: privateIdentity, //private
            impu: publicIdentity, //public
            password: password,
            display_name: displayName,
            websocket_proxy_url: "wss://192.168.11.31:8089/ws",
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
            this.incomingCallEvent = event;
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
    }

}
