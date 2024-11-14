import net from "net";

class RTSPStreamHandler {
	// constructor() {
	// 	this.streams = new Map();
	// 	this.onUpdate = null;
	// 	console.log("RTSPStreamHandler initialized");
	// }
	constructor() {
		this.streams = new Map();
		this.onUpdate = null;
		console.log("RTSPStreamHandler initialized");
		// Add cleanup interval
		setInterval(() => this.cleanupInactiveStreams(), 10000);
	}

	cleanupInactiveStreams() {
		let updated = false;
		for (const [id, stream] of this.streams.entries()) {
			if (stream.socket?.destroyed || !stream.lastActivity) {
				this.streams.delete(id);
				updated = true;
			}
		}
		if (updated && this.onUpdate) this.onUpdate();
	}

	// Update handleStreamData to include lastActivity
	handleStreamData(streamId, data) {
		const stream = this.streams.get(streamId);
		if (stream) {
			stream.lastActivity = Date.now();
			console.log(
				`Received data from stream ${streamId}, length: ${data.length} bytes`
			);
		}
	}

	registerStream(streamName, url) {
		console.log(`Registering stream: ${streamName}`);
		this.streams.set(streamName, {
			id: streamName,
			url: url,
			status: "connected",
			startTime: new Date().toISOString(),
			socket: { destroyed: false, connecting: false }
		});

		if (this.onUpdate) this.onUpdate();
		console.log(`Stream registered: ${streamName}`);
		return streamName;
	}

	async connectToStream(url) {
		const streamId = `stream_${this.streams.size + 1}`;
		console.log(`Attempting to connect to stream: ${url} with ID: ${streamId}`);

		try {
			const [host, port] = this.parseRTSPUrl(url);
			const socket = new net.Socket();

			socket.connect(port, host, () => {
				console.log(`Connected to RTSP stream: ${url}`);
				const optionsRequest =
					"OPTIONS rtsp://" +
					host +
					":" +
					port +
					" RTSP/1.0\r\n" +
					"CSeq: 1\r\n" +
					"User-Agent: Node.js RTSP Client\r\n\r\n";
				socket.write(optionsRequest);
			});

			socket.on("data", data => {
				this.handleStreamData(streamId, data);
			});

			socket.on("error", error => {
				console.error(`Stream ${streamId} error:`, error);
				this.streams.delete(streamId);
				if (this.onUpdate) this.onUpdate();
			});

			this.streams.set(streamId, {
				socket,
				url,
				id: streamId,
				status: "connected",
				startTime: new Date().toISOString()
			});

			if (this.onUpdate) this.onUpdate();
			console.log("Current streams:", this.getActiveStreams());
			return streamId;
		} catch (error) {
			console.error("Failed to connect to stream:", error);
			throw error;
		}
	}

	parseRTSPUrl(url) {
		const rtspUrl = new URL(url);
		return [rtspUrl.hostname, rtspUrl.port || 554];
	}

	handleStreamData(streamId, data) {
		const stream = this.streams.get(streamId);
		if (stream) {
			stream.lastActivity = new Date().toISOString();
			console.log(
				`Received data from stream ${streamId}, length: ${data.length} bytes`
			);
		}
	}

	disconnectStream(streamId) {
		const stream = this.streams.get(streamId);
		if (stream) {
			if (stream.socket) {
				stream.socket.destroy();
			}
			this.streams.delete(streamId);
			if (this.onUpdate) this.onUpdate();
			console.log(`Disconnected stream: ${streamId}`);
		}
	}

	getActiveStreams() {
		const activeStreams = [];
		this.streams.forEach((stream, id) => {
			activeStreams.push({
				id: id,
				url: stream.url,
				status: stream.socket?.destroyed
					? "disconnected"
					: stream.socket?.connecting
					? "connecting"
					: "connected",
				startTime: stream.startTime,
				lastActivity: stream.lastActivity
			});
		});
		console.log("Active streams:", activeStreams);
		return activeStreams;
	}
}

export default RTSPStreamHandler;
