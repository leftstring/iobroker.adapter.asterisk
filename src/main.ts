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
			asteriskPassword: string;
			asteriskPublicIdentity: string;
			asteriskRealm: string;
		}
	}
}

class DoorbirdAdapter extends utils.Adapter {

	static readonly CONFIG_VAR = "config"
	static readonly OPEN_DOOR_REQUESTED_VAR = "openDoorRequested"
	static readonly PREVIEW_IMAGE_VAR = "previewImage"
	static readonly VIDEO_SOURCE_VAR = "videoSource"

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
		this.log.info("start doorbird adapter");
		// for test only:
		this.config.ipAddress = "192.168.178.63";
		this.config.username = "ghdggd0002";
		this.config.password = "3pjUcjaUNA";

		await this.setUpVariables();

		await this.setStateAsync(DoorbirdAdapter.CONFIG_VAR, {val: JSON.stringify(this.config)});

		try {
			var img = await this.fetchPreviewImage();
			this.log.info("set preview image...");
			await this.setStateAsync(DoorbirdAdapter.PREVIEW_IMAGE_VAR, img);
			this.log.info("set preview image successfull");
		}
		catch(e)
		{
			this.log.error(e);
		}

		setInterval(async()=> {
			try {
				var img = await this.fetchPreviewImage();
				this.log.info("set preview image...");
				await this.setStateAsync(DoorbirdAdapter.PREVIEW_IMAGE_VAR, img);
				this.log.info("set preview image successfull");
			}
			catch(e)
			{
				this.log.error(e);
			}
		}, 2000)

		var auth = "?http-user=" + this.config.username + "&http-password=" + this.config.password;
		await this.setStateAsync("videoSource", "http://" + this.config.ipAddress + "/bha-api/video.cgi" + auth);

		// examples for the checkPassword/checkGroup functions
		//let result = await this.checkPasswordAsync("admin", "iobroker");
		//this.log.info("check user admin pw ioboker: " + result);
		//result = await this.checkGroupAsync("admin", "admin");
		//this.log.info("check group user admin group admin: " + result);
	}

	private async setUpVariables() {
		await this.setObjectAsync(DoorbirdAdapter.CONFIG_VAR, {
			type: "state",
			common: {
				name: DoorbirdAdapter.CONFIG_VAR,
				type: "object",
				role: "json",
				read: true,
				write: true,
			},
			native: {},
		});
		
		await this.setObjectAsync(DoorbirdAdapter.OPEN_DOOR_REQUESTED_VAR, {
			type: "state",
			common: {
				name: DoorbirdAdapter.OPEN_DOOR_REQUESTED_VAR,
				type: "boolean",
				role: "indicator",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectAsync(DoorbirdAdapter.PREVIEW_IMAGE_VAR, {
			type: "state",
			common: {
				name: DoorbirdAdapter.PREVIEW_IMAGE_VAR,
				type: "string",
				role: "text",
				read: true,
				write: true,
			},
			native: {},
		});

		await this.setObjectAsync(DoorbirdAdapter.VIDEO_SOURCE_VAR, {
			type: "state",
			common: {
				name: DoorbirdAdapter.VIDEO_SOURCE_VAR,
				type: "string",
				role: "text",
				read: true,
				write: true,
			},
			native: {},
		});

		// in this template all states changes inside the adapters namespace are subscribed
		this.subscribeStates("*");
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

			if(id === this.getFullVariableName(DoorbirdAdapter.OPEN_DOOR_REQUESTED_VAR) && state.val) {
				this.openDoor();
			}
		} else {
			// The state was deleted
			this.log.info(`state ${id} deleted`);
		}
	}

	private getFullVariableName(variableName: string) {
		return this.name + "." + this.instance + "." + variableName;
	}

	private async openDoor(): Promise<void> {		
		this.log.info("Open door");		
		//await this.sendRequestToDoorbird("GET", "/bha-api/open-door.cgi");
		await this.setStateAsync("openDoorRequested", false);
	}

	private async fetchPreviewImage(): Promise<string> {
		this.log.info("Fetch preview image");
		var response = await this.sendRequestToDoorbird("GET", "/bha-api/image.cgi");
		this.log.info("Fetched preview image successfull");
		var b64encoded = response.toString('base64');
		var mimetype="image/jpeg";
		return "data:" + mimetype+ ";base64," + b64encoded;
	}

	private sendRequestToDoorbird(method: string, path: string): Promise<Buffer> {
		var auth = "?http-user="+ this.config.username + "&http-password=" + this.config.password
		var options: http.RequestOptions = { method: method, host: this.config.ipAddress, path: path + auth }
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
