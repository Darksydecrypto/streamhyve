import express from "express";
import { getServerAddress } from "./src/utils/network.js";
import { RTSPStreamHandler } from "./src/services/streamHandler.js";
import cors from "cors";
import net from "net";

const app = express();
const httpPort = process.env.PORT || 3000;
const rtspPort = 1935;

// Create the RTSPServer class directly since we're not importing it
class CustomRTSPServer {
	constructor(port, streamHandler) {
		this.port = port;
		this.streamHandler = streamHandler;
		this.server = net.createServer();

		this.server.on("connection", socket => {
			////////
			const clientId = `${socket.remoteAddress}:${socket.remotePort}`;
			console.log("Connection ID:", clientId);
			////////
			console.log("New client connected:", socket.remoteAddress);

			socket.setKeepAlive(true, 30000);
			socket.setTimeout(60000);

			socket.on("error", error => {
				console.error("Socket error:", error);
			});

			socket.on("close", () => {
				console.log("Client disconnected");
			});
		});

		this.server.on("error", error => {
			console.error("Server error:", error);
		});
	}

	start() {
		return new Promise((resolve, reject) => {
			try {
				const options = {
					host: "0.0.0.0", // Force IPv4
					port: this.port,
					exclusive: true,
					ipv6Only: false
				};

				this.server.listen(options, () => {
					console.log(`RTSP Server listening on port ${this.port}`);
					resolve();
				});
			} catch (error) {
				console.error("Failed to start RTSP server:", error);
				reject(error);
			}
		});
	}

	stop() {
		return new Promise(resolve => {
			this.server.close(() => {
				console.log("RTSP Server stopped");
				resolve();
			});
		});
	}
}

// Create instances at the top level
const streamHandler = new RTSPStreamHandler();
let rtspServer;

// Middleware
app.use(cors());
app.use(express.json());

const init = async () => {
	const serverAddress = await getServerAddress();

	// Initialize RTSP server with streamHandler
	rtspServer = new CustomRTSPServer(rtspPort, streamHandler);
	await rtspServer.start();

	// Stream endpoints
	app.get("/api/streams", (req, res) => {
		const streams = streamHandler.getActiveStreams();
		console.log("Active streams:", streams);
		res.json({ streams });
	});

	// Connect new stream endpoint
	app.post("/api/streams/connect", async (req, res) => {
		try {
			const { url } = req.body;
			if (!url) {
				return res.status(400).json({ error: "RTSP URL is required" });
			}

			const streamId = await streamHandler.connectToStream(url);
			console.log(`Stream connected: ${streamId} - ${url}`);

			res.json({
				streamId,
				message: "Stream connected successfully",
				url: url
			});
		} catch (error) {
			console.error("Stream connection error:", error);
			res.status(500).json({ error: error.message });
		}
	});

	app.get("/", (req, res) => {
		const streams = streamHandler.getActiveStreams();
		res.json({
			message: "RTSP Server",
			status: "running",
			activeStreams: streams.length,
			streamFormat: `rtsp://${serverAddress}:${rtspPort}/live/<streamName>`,
			rtspPort: rtspPort,
			httpPort: httpPort
		});
	});

	// HTTP server for status and monitoring
	app.listen(httpPort, "0.0.0.0", () => {
		console.log(`\nServer Info:`);
		console.log(`- HTTP API: http://${serverAddress}:${httpPort}`);
		console.log(`- RTSP Port: ${rtspPort}`);
		console.log(
			`- Stream format: rtsp://${serverAddress}:${rtspPort}/live/<streamName>`
		);
		console.log("\nReady to accept connections...\n");
	});
};
// New
// Error handling
process.on("uncaughtException", error => {
	console.error("Uncaught Exception:", error);
});

process.on("unhandledRejection", (reason, promise) => {
	console.error("Unhandled Rejection at:", promise, "reason:", reason);
});

init().catch(error => {
	console.error("Initialization error:", error);
	process.exit(1);
});
