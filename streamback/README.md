# Node.js RTSP Server

A lightweight RTSP (Real Time Streaming Protocol) server implementation in Node.js for handling video streams. This server supports multiple concurrent RTSP streams and provides a REST API for stream management.

## Features

- Pure Node.js implementation without external RTSP dependencies
- Support for multiple concurrent RTSP streams
- Automatic IP detection (localhost/public)
- REST API for stream management
- Stream connection logging
- Port 1935 for RTSP traffic
- H.264 video stream support

## Installation

```bash
npm install
```

## Usage

Start the server:

```bash
npm start
```

The server will start with:
- RTSP server on port 1935
- HTTP management API on port 3000

### RTSP Stream URL Format

```
rtsp://<server-ip>:1935/live/<stream-name>
```

Example:
```
rtsp://192.168.1.100:1935/live/stream1
```

### Streaming with FFmpeg

To stream video to the server using FFmpeg:

```bash
# Stream from a video file
ffmpeg -re -i video.mp4 -c:v h264 -f rtsp rtsp://<server-ip>:1935/live/stream1

# Stream from a camera
ffmpeg -f v4l2 -i /dev/video0 -c:v h264 -f rtsp rtsp://<server-ip>:1935/live/stream1
```

## API Endpoints

### Get Server Status
```
GET http://<server-ip>:3000/
```

### List Active Streams
```
GET http://<server-ip>:3000/api/streams/streams
```

### Connect to Stream
```
POST http://<server-ip>:3000/api/streams/connect
Content-Type: application/json

{
    "url": "rtsp://source-ip:554/live/stream1"
}
```

### Disconnect Stream
```
DELETE http://<server-ip>:3000/api/streams/disconnect/:streamId
```

## Project Structure

```
├── index.js                    # Main application entry
├── src/
│   ├── routes/
│   │   └── streamRoutes.js     # API route handlers
│   ├── services/
│   │   ├── rtspServer.js       # RTSP server implementation
│   │   └── streamHandler.js    # Stream management logic
│   └── utils/
│       └── network.js          # Network utility functions
```

## Features

- **Stream Management**: Connect, disconnect, and list active streams
- **Auto IP Detection**: Automatically detects and uses the appropriate IP address
- **Connection Logging**: Logs stream connections, disconnections, and errors
- **RTSP Protocol Support**: Handles basic RTSP commands (DESCRIBE, SETUP, PLAY, TEARDOWN)
- **Multiple Stream Support**: Handles multiple concurrent streams

## Limitations

- Basic RTSP implementation
- H.264 video codec support only
- No authentication mechanism implemented
- No TLS/RTSPS support

## Contributing

Feel free to submit issues and enhancement requests.

## License

