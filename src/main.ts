// The adapter-core module gives you access to the core ioBroker functions
import * as utils from "@iobroker/adapter-core";

import http = require("http");

// Augment the adapter.config object with the actual types
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
			// websocketProxyUrl: string;
		}
	}
}

class DoorbirdAdapter extends utils.Adapter {

	static readonly CONFIG_VAR = "config"
	static readonly OPEN_DOOR_REQUESTED_VAR = "openDoorRequested"
	static readonly IMAGE_SOURCE_VAR = "imageSource"
	static readonly VIDEO_SOURCE_VAR = "videoSource"

	public constructor(options: Partial<ioBroker.AdapterOptions> = {}) {
		super({
			...options,
			name: "asterbird",
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

		await this.setUpVariables();

		await this.setStateAsync(DoorbirdAdapter.CONFIG_VAR, {val: JSON.stringify(this.config)});

		var auth = "?http-user=" + this.config.username + "&http-password=" + this.config.password;
		await this.setStateAsync(DoorbirdAdapter.IMAGE_SOURCE_VAR, "http://" + this.config.ipAddress + "/bha-api/image.cgi" + auth);
		await this.setStateAsync(DoorbirdAdapter.VIDEO_SOURCE_VAR, "http://" + this.config.ipAddress + "/bha-api/video.cgi" + auth);
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

		await this.setObjectAsync(DoorbirdAdapter.IMAGE_SOURCE_VAR, {
			type: "state",
			common: {
				name: DoorbirdAdapter.IMAGE_SOURCE_VAR,
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
		await this.sendRequestToDoorbird("GET", "/bha-api/open-door.cgi");
		await this.setStateAsync("openDoorRequested", false);
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
