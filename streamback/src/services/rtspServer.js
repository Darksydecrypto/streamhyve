import { createServer } from "net";

export class RTSPServer {
	constructor(port, streamHandler) {
		this.port = port;
		this.streamHandler = streamHandler;
		this.clients = new Set();
		this.streams = new Map();
		this.streamPrefix = "live";
		this.activeStreams = new Set();
	}

	getStreamPath(streamName) {
		return `/${this.streamPrefix}/${streamName}`;
	}

	parseStreamName(requestUrl) {
		const match = requestUrl.match(
			new RegExp(`/${this.streamPrefix}/([^/\\s]+)`)
		);
		return match ? match[1] : null;
	}

	logStreamStatus(streamName, action) {
		const timestamp = new Date().toISOString();
		console.log(`[${timestamp}] Stream ${streamName} ${action}`);
		console.log(`Active streams: ${Array.from(this.activeStreams).join(", ")}`);
	}

	start() {
		const server = createServer(socket => {
			let currentStreamName = null;

			console.log("New client connected");
			this.clients.add(socket);

			socket.on("data", data => {
				const request = data.toString();
				const streamName = this.parseStreamName(request);

				if (streamName && !currentStreamName) {
					currentStreamName = streamName;
					this.activeStreams.add(streamName);
					this.logStreamStatus(streamName, "connected");

					// Register stream with the streamHandler
					this.streamHandler.registerStream(
						streamName,
						`rtsp://192.168.1.30:${this.port}/live/${streamName}`
					);
				}

				if (request.startsWith("DESCRIBE")) {
					this.handleDescribe(socket, request, streamName);
				} else if (request.startsWith("SETUP")) {
					this.handleSetup(socket, request, streamName);
				} else if (request.startsWith("PLAY")) {
					this.handlePlay(socket, request, streamName);
				} else if (request.startsWith("TEARDOWN")) {
					this.handleTeardown(socket, request, streamName);
				}
			});

			socket.on("close", () => {
				if (currentStreamName) {
					this.activeStreams.delete(currentStreamName);
					this.logStreamStatus(currentStreamName, "disconnected");
					// Remove stream from streamHandler
					this.streamHandler.disconnectStream(currentStreamName);
				}
				console.log("Client disconnected");
				this.clients.delete(socket);
			});

			socket.on("error", err => {
				if (currentStreamName) {
					this.activeStreams.delete(currentStreamName);
					this.logStreamStatus(currentStreamName, "error: " + err.message);
					// Remove stream from streamHandler
					this.streamHandler.disconnectStream(currentStreamName);
				}
				console.error("Socket error:", err);
				this.clients.delete(socket);
			});
		});

		server.listen(this.port, () => {
			console.log(`RTSP Server listening on port ${this.port}`);
			console.log(
				`Stream URL format: rtsp://<ip>:${this.port}${this.getStreamPath(
					"<streamName>"
				)}`
			);
		});
	}

	handleDescribe(socket, request, streamName) {
		if (!streamName) {
			this.sendError(socket, 404, "Stream Not Found");
			return;
		}

		const response = [
			"RTSP/1.0 200 OK",
			"CSeq: 1",
			"Content-Type: application/sdp",
			"",
			"v=0",
			"o=- 1234567890 1234567890 IN IP4 127.0.0.1",
			`s=Stream ${streamName}`,
			"t=0 0",
			"m=video 0 RTP/AVP 96",
			"a=rtpmap:96 H264/90000",
			""
		].join("\r\n");

		socket.write(response);
	}

	handleSetup(socket, request, streamName) {
		if (!streamName) {
			this.sendError(socket, 404, "Stream Not Found");
			return;
		}

		const response = [
			"RTSP/1.0 200 OK",
			"CSeq: 2",
			"Session: 12345",
			"",
			""
		].join("\r\n");

		socket.write(response);
	}

	handlePlay(socket, request, streamName) {
		if (!streamName) {
			this.sendError(socket, 404, "Stream Not Found");
			return;
		}

		const response = [
			"RTSP/1.0 200 OK",
			"CSeq: 3",
			"Session: 12345",
			"Range: npt=0.000-",
			"",
			""
		].join("\r\n");

		socket.write(response);
		this.logStreamStatus(streamName, "started playing");
	}

	handleTeardown(socket, request, streamName) {
		if (!streamName) {
			this.sendError(socket, 404, "Stream Not Found");
			return;
		}

		const response = [
			"RTSP/1.0 200 OK",
			"CSeq: 4",
			"Session: 12345",
			"",
			""
		].join("\r\n");

		socket.write(response);
		this.logStreamStatus(streamName, "teardown requested");
	}

	sendError(socket, code, message) {
		const response = [`RTSP/1.0 ${code} ${message}`, "CSeq: 1", "", ""].join(
			"\r\n"
		);

		socket.write(response);
	}
}
