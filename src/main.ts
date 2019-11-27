/*
 * Created with @iobroker/create-adapter v1.17.0
 */

// The adapter-core module gives you access to the core ioBroker functions
// you need to create an adapter
import * as utils from "@iobroker/adapter-core";

import http = require("http");

// Load your modules here, e.g.:
// import * as fs from "fs";

// Augment the adapter.config object with the actual types
// TODO: delete this in the next version
declare global {
	// eslint-disable-next-line @typescript-eslint/no-namespace
	namespace ioBroker {
		interface AdapterConfig {
			ipAddress: string;
			username: string;
			password: string;
			asteriskPrivateIdentity: string;
			asteriskPasword: string;
			asteriskPublicIdentity: string;
			asteriskRealm: string;
		}
	}
}

class DoorbirdAdapter extends utils.Adapter {

	public constructor(options: Partial<ioBroker.AdapterOptions> = {}) {
		super({
			...options,
			name: "doorbird",
		});
		this.on("ready", this.onReady.bind(this));
		this.on("objectChange", this.onObjectChange.bind(this));
		this.on("stateChange", this.onStateChange.bind(this));
		this.on("unload", this.onUnload.bind(this));
	}

	/**
	 * Is called when databases are connected and adapter received configuration.
	 */
	private async onReady(): Promise<void> {
		// var io = socketio.listen(8083, { handlePreflightRequest: (req, res) => {
		// 	const headers = {
		// 		"Access-Control-Allow-Headers": "Content-Type, Authorization",
		// 		"Access-Control-Allow-Origin": req.headers.origin,
		// 		"Access-Control-Allow-Credentials": true
		// 	};
		// 	res.writeHead(200, headers);
		// 	res.end();
		// } });

		// // Socket.io-Events
		// io.sockets.on('connection', function (socket: SocketIO.Server) {
		// 	console.log('[socket.io] Ein neuer Client (Browser) hat sich verbunden.\n');
		
		//  	console.log('[socket.io] SENDE "welcome"-Event an den Client.\n');
		//  	socket.emit('welcome', "Hello world");
		
		//  	socket.on('user agent', function (data: any) {
		//  	console.log('[socket.io] EMPFANGE "user agent"-Event vom Client:');
		// 	console.log(data, '\n');
		// 	});
		// });
		
		// Initialize your adapter here

		// The adapters config (in the instance object everything under the attribute "native") is accessible via
		// this.config:
		//this.log.info("config option1: " + this.config.option1);
		//this.log.info("config option2: " + this.config.option2);

		/*
		For every state in the system there has to be also an object of type state
		Here a simple template for a boolean variable named "testVariable"
		Because every adapter instance uses its own unique namespace variable names can't collide with other adapters variables
		*/
		await this.setObjectAsync("testVariable", {
			type: "state",
			common: {
				name: "testVariable",
				type: "boolean",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectAsync("image", {
			type: "state",
			common: {
				name: "image",
				type: "string",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectAsync("config", {
			type: "state",
			common: {
				name: "config",
				type: "object",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		// in this template all states changes inside the adapters namespace are subscribed
		this.subscribeStates("*");

		/*
		setState examples
		you will notice that each setState will cause the stateChange event to fire (because of above subscribeStates cmd)
		*/
		// the variable testVariable is set to true as command (ack=false)
		await this.setStateAsync("testVariable", true);

		// same thing, but the value is flagged "ack"
		// ack should be always set to true if the value is received from or acknowledged from the target system
		await this.setStateAsync("testVariable", { val: true, ack: true });

		// same thing, but the state is deleted after 30s (getState will return null afterwards)
		await this.setStateAsync("testVariable", { val: true, ack: true, expire: 30 });

		try {
			var img = await this.fetchImage();
			this.log.info("set image...");
			await this.setStateAsync("image", img);
			this.log.info("set image successfull");
		}
		catch(e)
		{
			this.log.error(e);
		}

		// examples for the checkPassword/checkGroup functions
		let result = await this.checkPasswordAsync("admin", "iobroker");
		this.log.info("check user admin pw ioboker: " + result);

		result = await this.checkGroupAsync("admin", "admin");
		this.log.info("check group user admin group admin: " + result);
	}

	/**
	 * Is called when adapter shuts down - callback has to be called under any circumstances!
	 */
	private onUnload(callback: () => void): void {
		try {
			this.log.info("cleaned everything up...");
		} finally {
			callback();
		}
	}

	/**
	 * Is called if a subscribed object changes
	 */
	private onObjectChange(id: string, obj: ioBroker.Object | null | undefined): void {
		if (obj) {
			// The object was changed
			this.log.info(`object ${id} changed: ${JSON.stringify(obj)}`);
		} else {
			// The object was deleted
			this.log.info(`object ${id} deleted`);
		}
	}

	/**
	 * Is called if a subscribed state changes
	 */
	private onStateChange(id: string, state: ioBroker.State | null | undefined): void {
		if (state) {
			// The state was changed
			this.log.info(`state ${id} changed: ${state.val} (ack = ${state.ack})`);
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}
	private async openDoor(): Promise<void> {		
		this.log.info("Open door");
		await this.sendRequestToDoorbird("GET", "/bha-api/open-door.cgi");		
	}

	private async fetchImage(): Promise<string> {	
		this.log.info("Fetch image");	
		var response = await this.sendRequestToDoorbird("GET", "/bha-api/image.cgi");
		this.log.info("Fetched image successfull");
		var b64encoded = response.toString('base64');
		var mimetype="image/jpeg"; 
		return "data:" + mimetype+ ";base64," + b64encoded;			
	}

	private sendRequestToDoorbird(method: string, path: string): Promise<Buffer> {
		var ipAddress =  this.config.ipAddress;
		var username =  this.config.username;
		var password =  this.config.password;

		var options: http.RequestOptions = { method: method, host: "192.168.178.63", path: path + "?http-user=ghdggd0002&http-password=3pjUcjaUNA" }
		// TODO user "Authorization" header with "Basic " + btoa("ghdggd0002:3pjUcjaUNA")

		return new Promise((resolve, reject) => {
			var request = http.request(options, (response) => {
				var body: Buffer [] = [];				
				response.on('data', (chunk: Buffer ) => {
					body.push(chunk);
				});		
				response.on('end', () => {
					if (response.statusCode == 200) {
						resolve(Buffer.concat(body));
					} else {							
						reject(new Error("" + response.statusCode));
					}	
				});
			}).on("error", (err) => {
				reject(new Error("Error: " + err.message));
			});
			request.end();
		});	
		
	}

}

if (module.parent) {
	// Export the constructor in compact mode
	module.exports = (options: Partial<ioBroker.AdapterOptions> | undefined) => new DoorbirdAdapter(options);
} else {
	// otherwise start the instance directly
	(() => new DoorbirdAdapter())();
}