import { useState, useEffect } from "react";
import axios from "axios";
import "../App.css";

const StreamPage = () => {
	const [streams, setStreams] = useState([]);
	const [error, setError] = useState(null);
	const [lastUpdated, setLastUpdated] = useState(null);
	const [ws, setWs] = useState(null);

	useEffect(() => {
		fetchStreams();
		setupWebSocket();

		return () => {
			if (ws) ws.close();
		};
	}, []);

	const setupWebSocket = () => {
		const socket = new WebSocket(`ws://${window.location.hostname}:3000/ws`);
		// const socket = new WebSocket("ws://localhost:3000/ws");

		socket.onmessage = event => {
			const data = JSON.parse(event.data);
			if (data.type === "streams-update") {
				setStreams(data.streams || []);
				setLastUpdated(new Date().toLocaleTimeString());
			}
		};

		socket.onopen = () => {
			console.log("WebSocket connected");
		};

		socket.onerror = error => {
			console.error("WebSocket error:", error);
			setError("WebSocket connection failed");
			// Fallback to polling on WebSocket failure
			const pollInterval = setInterval(fetchStreams, 5000);
			return () => clearInterval(pollInterval);
		};

		socket.onclose = () => {
			console.log("WebSocket disconnected");
			// Attempt to reconnect
			setTimeout(setupWebSocket, 5000);
		};

		setWs(socket);
	};

	const fetchStreams = async () => {
		try {
			// const response = await axios.get(
			// 	`http://${window.location.hostname}:3000/api/streams`
			// );
			const response = await axios.get(`http://localhost:3000/api/streams`);
			setStreams(response.data.streams || []);
			setLastUpdated(new Date().toLocaleTimeString());
		} catch (err) {
			console.error("Error fetching streams:", err);
			setError(err.message || "Failed to fetch streams");
		}
	};

	const formatTime = timeString => {
		const date = new Date(timeString);
		return date.toLocaleString();
	};
	return (
		<>
			<div>
				<h1 className="title text-3xl font-bold">Stream Hyve</h1>
			</div>
			<div className="min-h-screen w-full flex flex-col items-center justify-center gap-4">
				{/* Streams Container */}
				<div className="bg-blue-500 p-6 rounded-lg w-full max-w-2xl">
					{error ? (
						<div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
							{/* {error} */}
							<p>No Active Streams</p>
						</div>
					) : (
						<>
							<h2 className="text-white text-xl font-semibold mb-4">
								Active Streams
							</h2>
							{streams.length > 0 ? (
								<div className="space-y-4">
									{streams.map(stream => (
										<div
											key={stream.id}
											className="bg-white rounded-lg p-4 shadow"
										>
											<p className="font-bold text-lg text-gray-800">
												Stream ID: {stream.id}
											</p>
											<p className="text-gray-600">URL: {stream.url}</p>
											<p className="text-gray-600">Status: {stream.status}</p>
											{stream.startTime && (
												<p className="text-gray-600 text-sm">
													Started: {formatTime(stream.startTime)}
												</p>
											)}
											<div className="mt-2">
												<span
													className={`px-2 py-1 rounded text-sm ${
														stream.status === "connected"
															? "bg-green-100 text-green-800"
															: stream.status === "connecting"
															? "bg-yellow-100 text-yellow-800"
															: "bg-red-100 text-red-800"
													}`}
												>
													{stream.status}
												</span>
											</div>
										</div>
									))}
								</div>
							) : (
								<div className="text-white text-center py-8">
									No active streams found
								</div>
							)}

							{/* Last Updated Timestamp */}
							{lastUpdated && (
								<div className="mt-4 text-xs text-white text-right">
									Last updated: {lastUpdated}
								</div>
							)}
						</>
					)}
				</div>
			</div>
		</>
	);
};

export default StreamPage;
