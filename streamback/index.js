// // import express from "express";
// // import { getServerAddress } from "./src/utils/network.js";
// // import { RTSPStreamHandler } from "./src/services/streamHandler.js";
// // import { RTSPServer } from "./src/services/rtspServer.js";
// // import cors from "cors";

// // const app = express();
// // // const httpPort = 3000;
// // const httpPort = process.env.PORT || 3000;

// // const rtspPort = 1935;

// // // Create instances at the top level, but don't initialize rtspServer yet
// // const streamHandler = new RTSPStreamHandler();
// // let rtspServer; // Change from const to let

// // // Middleware
// // app.use(cors());
// // app.use(express.json());

// // const init = async () => {
// // 	const serverAddress = await getServerAddress();

// // 	// Initialize RTSP server with streamHandler
// // 	rtspServer = new RTSPServer(rtspPort, streamHandler);
// // 	rtspServer.start();

// // 	// Stream endpoints
// // 	app.get("/api/streams", (req, res) => {
// // 		const streams = streamHandler.getActiveStreams();
// // 		console.log("Active streams:", streams);
// // 		res.json({ streams });
// // 	});

// // 	// Connect new stream endpoint
// // 	app.post("/api/streams/connect", async (req, res) => {
// // 		try {
// // 			const { url } = req.body;
// // 			if (!url) {
// // 				return res.status(400).json({ error: "RTSP URL is required" });
// // 			}
// // 			const streamId = await streamHandler.connectToStream(url);

// // 			console.log(`Stream connected: ${streamId} - ${url}`);

// // 			res.json({
// // 				streamId,
// // 				message: "Stream connected successfully",
// // 				url: url
// // 			});
// // 		} catch (error) {
// // 			console.error("Stream connection error:", error);
// // 			res.status(500).json({ error: error.message });
// // 		}
// // 	});

// // 	app.get("/", (req, res) => {
// // 		const streams = streamHandler.getActiveStreams();

// // 		res.json({
// // 			message: "RTSP Server",
// // 			status: "running",
// // 			activeStreams: streams.length,
// // 			streamFormat: `rtsp://${serverAddress}:${rtspPort}/live/<streamName>`,
// // 			rtspPort: rtspPort,
// // 			httpPort: httpPort
// // 		});
// // 	});

// // 	// HTTP server for status and monitoring
// // 	app.listen(httpPort, () => {
// // 		console.log(`\nServer Info:`);
// // 		console.log(`- HTTP API: http://${serverAddress}:${httpPort}`);
// // 		console.log(`- RTSP Port: ${rtspPort}`);
// // 		console.log(
// // 			`- Stream format: rtsp://${serverAddress}:${rtspPort}/live/<streamName>`
// // 		);
// // 		console.log("\nReady to accept connections...\n");
// // 	});
// // };

// // // Add error handling
// // process.on("uncaughtException", error => {
// // 	console.error("Uncaught Exception:", error);
// // });

// // process.on("unhandledRejection", (reason, promise) => {
// // 	console.error("Unhandled Rejection at:", promise, "reason:", reason);
// // });

// // init().catch(error => {
// // 	console.error("Initialization error:", error);
// // 	process.exit(1);
// // });

// import express from "express";
// import { getServerAddress } from "./src/utils/network.js";
// import { RTSPStreamHandler } from "./src/services/streamHandler.js";
// import { RTSPServer } from "./src/services/rtspServer.js";
// import cors from "cors";
// import dotenv from "express";

// const app = express();

// // Environment variables with defaults
// const httpPort = process.env.PORT || 3000;
// const rtspPort = process.env.RTSP_PORT || 1935;
// const host = process.env.HOST || "0.0.0.0";

// // Create instances at the top level
// const streamHandler = new RTSPStreamHandler();
// let rtspServer;

// // Middleware
// app.use(cors());
// app.use(express.json());

// const init = async () => {
// 	try {
// 		const serverAddress = await getServerAddress();

// 		// Initialize RTSP server with streamHandler
// 		rtspServer = new RTSPServer(rtspPort, streamHandler);
// 		await rtspServer.start();

// 		// Stream endpoints
// 		app.get("/api/streams", (req, res) => {
// 			try {
// 				const streams = streamHandler.getActiveStreams();
// 				console.log("Active streams:", streams);
// 				res.json({ streams });
// 			} catch (error) {
// 				console.error("Error getting streams:", error);
// 				res.status(500).json({ error: "Failed to get active streams" });
// 			}
// 		});

// 		// Connect new stream endpoint
// 		app.post("/api/streams/connect", async (req, res) => {
// 			try {
// 				const { url } = req.body;

// 				if (!url) {
// 					return res.status(400).json({ error: "RTSP URL is required" });
// 				}

// 				const streamId = await streamHandler.connectToStream(url);
// 				console.log(`Stream connected: ${streamId} - ${url}`);

// 				res.json({
// 					streamId,
// 					message: "Stream connected successfully",
// 					url: url
// 				});
// 			} catch (error) {
// 				console.error("Stream connection error:", error);
// 				res.status(500).json({ error: error.message });
// 			}
// 		});

// 		// Root endpoint for server status
// 		app.get("/", (req, res) => {
// 			try {
// 				const streams = streamHandler.getActiveStreams();
// 				res.json({
// 					message: "RTSP Server",
// 					status: "running",
// 					activeStreams: streams.length,
// 					streamFormat: `rtsp://${serverAddress}:${rtspPort}/live/<streamName>`,
// 					rtspPort: rtspPort,
// 					httpPort: httpPort
// 				});
// 			} catch (error) {
// 				console.error("Error getting server status:", error);
// 				res.status(500).json({ error: "Failed to get server status" });
// 			}
// 		});

// 		// Disconnect stream endpoint
// 		app.post("/api/streams/disconnect", async (req, res) => {
// 			try {
// 				const { streamId } = req.body;

// 				if (!streamId) {
// 					return res.status(400).json({ error: "Stream ID is required" });
// 				}

// 				await streamHandler.disconnectStream(streamId);
// 				res.json({ message: "Stream disconnected successfully" });
// 			} catch (error) {
// 				console.error("Stream disconnection error:", error);
// 				res.status(500).json({ error: error.message });
// 			}
// 		});

// 		// Health check endpoint
// 		app.get("/health", (req, res) => {
// 			res.json({
// 				status: "healthy",
// 				timestamp: new Date().toISOString()
// 			});
// 		});

// 		// HTTP server for status and monitoring
// 		app.listen(httpPort, host, () => {
// 			console.log(`\nServer Info:`);
// 			console.log(`- HTTP API: http://${serverAddress}:${httpPort}`);
// 			console.log(`- RTSP Port: ${rtspPort}`);
// 			console.log(`- Listening on: ${host}`);
// 			console.log(
// 				`- Stream format: rtsp://${serverAddress}:${rtspPort}/live/<streamName>`
// 			);
// 			console.log("\nReady to accept connections...\n");
// 		});
// 	} catch (error) {
// 		console.error("Server initialization error:", error);
// 		process.exit(1);
// 	}
// };

// // Graceful shutdown handler
// const shutdown = async () => {
// 	console.log("\nShutting down server...");

// 	try {
// 		if (rtspServer) {
// 			await rtspServer.stop();
// 		}

// 		// Close any other resources here

// 		console.log("Server shutdown complete");
// 		process.exit(0);
// 	} catch (error) {
// 		console.error("Error during shutdown:", error);
// 		process.exit(1);
// 	}
// };

// // Error handling
// process.on("uncaughtException", error => {
// 	console.error("Uncaught Exception:", error);
// 	shutdown();
// });

// process.on("unhandledRejection", (reason, promise) => {
// 	console.error("Unhandled Rejection at:", promise, "reason:", reason);
// });

// // Graceful shutdown signals
// process.on("SIGTERM", shutdown);
// process.on("SIGINT", shutdown);

// // Initialize server
// init().catch(error => {
// 	console.error("Initialization error:", error);
// 	process.exit(1);
// });

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
