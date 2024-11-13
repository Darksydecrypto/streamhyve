import express from "express";
import { RTSPStreamHandler } from "../services/streamHandler.js";
import cors from "cors";

const router = express.Router();
const streamHandler = new RTSPStreamHandler();

router.use(cors());

router.post("/connect", async (req, res) => {
	try {
		const { url } = req.body;
		if (!url) {
			return res.status(400).json({ error: "RTSP URL is required" });
		}

		const streamId = await streamHandler.connectToStream(url);
		res.json({ streamId, message: "Stream connected successfully" });
	} catch (error) {
		res.status(500).json({ error: error.message });
	}
});

router.get("/streams", (req, res) => {
	const streams = streamHandler.getActiveStreams();
	res.json({ streams });
});

router.delete("/disconnect/:streamId", (req, res) => {
	const { streamId } = req.params;
	streamHandler.disconnectStream(streamId);
	res.json({ message: "Stream disconnected successfully" });
});

export default router;
