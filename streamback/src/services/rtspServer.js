// import { createServer } from "net";
// import RTPHandler from "./rtpHandler.js";
// import { getServerAddress } from "../utils/network.js";

// export class RTSPServer {
// 	constructor(port, streamHandler) {
// 		this.port = port;
// 		this.streamHandler = streamHandler;
// 		this.clients = new Map(); // Map of clientId -> {socket, session, streamName}
// 		this.streams = new Map(); // Map of streamName -> {clients, rtpHandler}
// 		this.streamPrefix = "live";
// 		this.sessionTimeout = 60000; // 60 seconds
// 	}

// 	async start() {
// 		this.serverAddress = await getServerAddress();
// 		const server = createServer(socket => this.handleConnection(socket));

// 		server.listen(this.port, "0.0.0.0", () => {
// 			console.log(`RTSP Server listening on port ${this.port}`);
// 			console.log(
// 				`Stream URL format: rtsp://${this.serverAddress}:${this.port}/${this.streamPrefix}/<streamName>`
// 			);
// 		});

// 		// Session cleanup interval
// 		setInterval(() => this.cleanupSessions(), this.sessionTimeout);
// 	}

// 	handleConnection(socket) {
// 		const clientId = `${socket.remoteAddress}:${socket.remotePort}`;
// 		console.log(`New RTSP client connected: ${clientId}`);

// 		socket.on("data", data => {
// 			const request = data.toString();
// 			console.log("Received RTSP data:", request);
// 			console.log("Raw data length:", data.length);

// 			if (request.startsWith("OPTIONS")) {
// 				const response = [
// 					"RTSP/1.0 200 OK",
// 					"CSeq: 1",
// 					"Public: DESCRIBE, SETUP, TEARDOWN, PLAY, PAUSE, ANNOUNCE",
// 					"",
// 					""
// 				].join("\r\n");
// 				socket.write(response);
// 			} else if (request.startsWith("DESCRIBE")) {
// 				const sdp = [
// 					"v=0",
// 					"o=- 1 1 IN IP4 127.0.0.1",
// 					"s=Stream",
// 					"c=IN IP4 127.0.0.1",
// 					"t=0 0",
// 					"m=video 0 RTP/AVP 96",
// 					"a=rtpmap:96 H264/90000",
// 					"a=control:trackID=1",
// 					""
// 				].join("\r\n");

// 				const response = [
// 					"RTSP/1.0 200 OK",
// 					"CSeq: 2",
// 					"Content-Type: application/sdp",
// 					`Content-Length: ${sdp.length}`,
// 					"",
// 					sdp
// 				].join("\r\n");
// 				socket.write(response);
// 			} else if (request.startsWith("ANNOUNCE")) {
// 				const response = ["RTSP/1.0 200 OK", "CSeq: 2", "", ""].join("\r\n");
// 				socket.write(response);

// 				const streamName = this.parseStreamName(request);
// 				if (streamName) {
// 					this.streamHandler.registerStream(
// 						streamName,
// 						`rtsp://localhost:${this.port}/live/${streamName}`
// 					);
// 				}
// 			}
// 		});

// 		this.clients.set(clientId, { socket });

// 		socket.on("close", () => this.handleDisconnect(clientId));
// 		socket.on("error", err => this.handleError(clientId, err));
// 	}

// 	handleData(clientId, data) {
// 		const request = this.parseRequest(data.toString());
// 		const client = this.clients.get(clientId);

// 		if (!request) return;

// 		switch (request.method) {
// 			case "OPTIONS":
// 				this.handleOptions(client, request);
// 				break;
// 			case "DESCRIBE":
// 				this.handleDescribe(client, request);
// 				break;
// 			case "SETUP":
// 				this.handleSetup(client, request);
// 				break;
// 			case "PLAY":
// 				this.handlePlay(client, request);
// 				break;
// 			case "TEARDOWN":
// 				this.handleTeardown(client, request);
// 				break;
// 			case "GET_PARAMETER":
// 				this.handleGetParameter(client, request);
// 				break;
// 		}
// 	}

// 	parseRequest(data) {
// 		const lines = data.split("\r\n");
// 		const [method, url] = lines[0].split(" ");

// 		const headers = {};
// 		let currentLine = 1;
// 		while (currentLine < lines.length && lines[currentLine]) {
// 			const [name, value] = lines[currentLine].split(": ");
// 			headers[name.toLowerCase()] = value;
// 			currentLine++;
// 		}

// 		return {
// 			method,
// 			url,
// 			streamName: this.parseStreamName(url),
// 			headers,
// 			sequence: parseInt(headers["cseq"] || "0")
// 		};
// 	}

// 	parseStreamName(url) {
// 		const match = url.match(new RegExp(`/${this.streamPrefix}/([^/\\s]+)`));
// 		return match ? match[1] : null;
// 	}

// 	handleOptions(client, request) {
// 		this.sendResponse(client.socket, request.sequence, {
// 			headers: {
// 				Public: "OPTIONS, DESCRIBE, SETUP, PLAY, TEARDOWN, GET_PARAMETER"
// 			}
// 		});
// 	}

// 	handleDescribe(client, request) {
// 		if (!request.streamName) {
// 			return this.sendError(
// 				client.socket,
// 				request.sequence,
// 				404,
// 				"Stream Not Found"
// 			);
// 		}

// 		const sdp = this.generateSDP(request.streamName);
// 		this.sendResponse(client.socket, request.sequence, {
// 			headers: {
// 				"Content-Type": "application/sdp",
// 				"Content-Length": sdp.length
// 			},
// 			body: sdp
// 		});
// 	}

// 	handleSetup(client, request) {
// 		if (!request.streamName) {
// 			return this.sendError(
// 				client.socket,
// 				request.sequence,
// 				404,
// 				"Stream Not Found"
// 			);
// 		}

// 		const transport = request.headers["transport"];
// 		if (!transport) {
// 			return this.sendError(
// 				client.socket,
// 				request.sequence,
// 				400,
// 				"Transport header required"
// 			);
// 		}

// 		const sessionId = Math.random().toString(36).substring(2, 15);
// 		const rtpHandler = new RTPHandler();

// 		this.clients.set(client.id, {
// 			...client,
// 			session: { id: sessionId, lastActivity: Date.now() },
// 			streamName: request.streamName,
// 			rtpHandler
// 		});

// 		let stream = this.streams.get(request.streamName);
// 		if (!stream) {
// 			stream = { clients: new Set(), rtpHandler };
// 			this.streams.set(request.streamName, stream);
// 		}
// 		stream.clients.add(client.id);

// 		this.sendResponse(client.socket, request.sequence, {
// 			headers: {
// 				Session: `${sessionId};timeout=${this.sessionTimeout / 1000}`,
// 				Transport: transport
// 			}
// 		});
// 	}

// 	handlePlay(client, request) {
// 		const streamName = request.streamName;
// 		if (!streamName || !this.streams.has(streamName)) {
// 			return this.sendError(
// 				client.socket,
// 				request.sequence,
// 				404,
// 				"Stream Not Found"
// 			);
// 		}

// 		const session = client.session;
// 		if (!session) {
// 			return this.sendError(
// 				client.socket,
// 				request.sequence,
// 				454,
// 				"Session Not Found"
// 			);
// 		}

// 		session.lastActivity = Date.now();
// 		this.streamHandler.registerStream(
// 			streamName,
// 			`rtsp://${this.serverAddress}:${this.port}/${this.streamPrefix}/${streamName}`
// 		);

// 		this.sendResponse(client.socket, request.sequence, {
// 			headers: {
// 				Session: session.id,
// 				Range: "npt=0.000-"
// 			}
// 		});
// 	}

// 	handleTeardown(client, request) {
// 		this.disconnectClient(client.id);
// 		this.sendResponse(client.socket, request.sequence, {});
// 	}

// 	handleGetParameter(client, request) {
// 		if (client.session) {
// 			client.session.lastActivity = Date.now();
// 		}
// 		this.sendResponse(client.socket, request.sequence, {});
// 	}

// 	sendResponse(socket, sequence, { headers = {}, body = "" }) {
// 		const response = [
// 			"RTSP/1.0 200 OK",
// 			`CSeq: ${sequence}`,
// 			...Object.entries(headers).map(([k, v]) => `${k}: ${v}`),
// 			"",
// 			body
// 		].join("\r\n");

// 		socket.write(response);
// 	}

// 	sendError(socket, sequence, code, message) {
// 		const response = [
// 			`RTSP/1.0 ${code} ${message}`,
// 			`CSeq: ${sequence}`,
// 			"",
// 			""
// 		].join("\r\n");

// 		socket.write(response);
// 	}

// 	generateSDP(streamName) {
// 		return [
// 			"v=0",
// 			`o=- ${Date.now()} ${Date.now()} IN IP4 ${this.serverAddress}`,
// 			`s=Stream ${streamName}`,
// 			"t=0 0",
// 			"m=video 0 RTP/AVP 96",
// 			"a=rtpmap:96 H264/90000",
// 			"a=control:trackID=1",
// 			""
// 		].join("\r\n");
// 	}

// 	// handleDisconnect(clientId) {
// 	// 	this.disconnectClient(clientId);
// 	// }
// 	handleDisconnect(clientId) {
// 		const client = this.clients.get(clientId);
// 		if (client) {
// 			const streamName = client.streamName;
// 			if (streamName) {
// 				this.streamHandler.disconnectStream(streamName);
// 				console.log(`Stream disconnected: ${streamName}`);
// 			}
// 			this.clients.delete(clientId);
// 			console.log(`Client disconnected: ${clientId}`);
// 		}
// 	}

// 	handleError(clientId, error) {
// 		console.error(`Client ${clientId} error:`, error);
// 		this.disconnectClient(clientId);
// 	}

// 	disconnectClient(clientId) {
// 		const client = this.clients.get(clientId);
// 		if (client?.streamName) {
// 			const stream = this.streams.get(client.streamName);
// 			if (stream) {
// 				stream.clients.delete(clientId);
// 				if (stream.clients.size === 0) {
// 					this.streamHandler.disconnectStream(client.streamName);
// 					this.streams.delete(client.streamName);
// 				}
// 			}
// 		}
// 		this.clients.delete(clientId);
// 	}

// 	cleanupSessions() {
// 		const now = Date.now();
// 		for (const [clientId, client] of this.clients.entries()) {
// 			if (
// 				client.session &&
// 				now - client.session.lastActivity > this.sessionTimeout
// 			) {
// 				this.disconnectClient(clientId);
// 			}
// 		}
// 	}
// }

import { createServer } from "net";
import RTPHandler from "./rtpHandler.js";
import { getServerAddress } from "../utils/network.js";

export class RTSPServer {
	constructor(port, streamHandler) {
		this.port = port;
		this.streamHandler = streamHandler;
		this.clients = new Map();
		this.streams = new Map();
		this.streamPrefix = "live";
		this.sessionTimeout = 60000;
	}

	async start() {
		this.serverAddress = await getServerAddress();
		const server = createServer(socket => this.handleConnection(socket));

		server.listen(this.port, "0.0.0.0", () => {
			console.log(`RTSP Server listening on port ${this.port}`);
			console.log(
				`Stream URL format: rtsp://${this.serverAddress}:${this.port}/${this.streamPrefix}/<streamName>`
			);
		});

		setInterval(() => this.cleanupSessions(), this.sessionTimeout);
	}

	handleConnection(socket) {
		const clientId = `${socket.remoteAddress}:${socket.remotePort}`;
		let currentStreamName = null;
		console.log(`New RTSP client connected: ${clientId}`);

		socket.on("data", data => {
			const request = data.toString();
			console.log("Received RTSP data:", request);
			console.log("Raw data length:", data.length);

			if (request.startsWith("OPTIONS")) {
				const response = [
					"RTSP/1.0 200 OK",
					"CSeq: 1",
					"Public: DESCRIBE, SETUP, TEARDOWN, PLAY, PAUSE, ANNOUNCE",
					"",
					""
				].join("\r\n");
				socket.write(response);
			} else if (request.startsWith("DESCRIBE")) {
				const sdp = [
					"v=0",
					"o=- 1 1 IN IP4 127.0.0.1",
					"s=Stream",
					"c=IN IP4 127.0.0.1",
					"t=0 0",
					"m=video 0 RTP/AVP 96",
					"a=rtpmap:96 H264/90000",
					"a=control:trackID=1",
					""
				].join("\r\n");

				const response = [
					"RTSP/1.0 200 OK",
					"CSeq: 2",
					"Content-Type: application/sdp",
					`Content-Length: ${sdp.length}`,
					"",
					sdp
				].join("\r\n");
				socket.write(response);
			} else if (request.startsWith("ANNOUNCE")) {
				currentStreamName = this.parseStreamName(request);
				if (currentStreamName) {
					this.clients.set(clientId, { socket, streamName: currentStreamName });
					this.streamHandler.registerStream(
						currentStreamName,
						`rtsp://localhost:${this.port}/live/${currentStreamName}`
					);
				}
				const response = ["RTSP/1.0 200 OK", "CSeq: 2", "", ""].join("\r\n");
				socket.write(response);
			}
		});

		socket.on("close", () => {
			const client = this.clients.get(clientId);
			if (client?.streamName) {
				this.streamHandler.disconnectStream(client.streamName);
				this.streams.delete(client.streamName);
				console.log(`Stream disconnected: ${client.streamName}`);
			}
			this.clients.delete(clientId);
			console.log(`Client disconnected: ${clientId}`);
		});

		socket.on("error", err => {
			console.error(`Client ${clientId} error:`, err);
			const client = this.clients.get(clientId);
			if (client?.streamName) {
				this.streamHandler.disconnectStream(client.streamName);
				this.streams.delete(client.streamName);
			}
			this.clients.delete(clientId);
		});
	}

	parseStreamName(url) {
		const match = url.match(new RegExp(`/${this.streamPrefix}/([^/\\s]+)`));
		return match ? match[1] : null;
	}

	cleanupSessions() {
		const now = Date.now();
		for (const [clientId, client] of this.clients.entries()) {
			if (
				client.session &&
				now - client.session.lastActivity > this.sessionTimeout
			) {
				const streamName = client.streamName;
				if (streamName) {
					this.streamHandler.disconnectStream(streamName);
					this.streams.delete(streamName);
				}
				this.clients.delete(clientId);
			}
		}
	}
}
