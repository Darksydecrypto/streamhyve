import { useState, useEffect } from 'react';
import axios from 'axios';

function StreamViewer() {
  const [streams, setStreams] = useState([]);
  const [error, setError] = useState('');

  const fetchStreams = async () => {
    try {
      const response = await axios.get('http://localhost:3000/streams');
      setStreams(response.data.streams);
      setError('');
    } catch (err) {
      setError('Failed to fetch streams');
      console.error('Error fetching streams:', err);
    }
  };

  useEffect(() => {
    fetchStreams();
    // Poll for updates every 5 seconds
    const interval = setInterval(fetchStreams, 5000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="stream-viewer">
      {error && <div className="error">{error}</div>}
      <div className="streams-list">
        <h2>Active Streams</h2>
        {streams.length === 0 ? (
          <p className="no-streams">No active streams</p>
        ) : (
          streams.map((stream) => (
            <div key={stream.id} className="stream-item">
              <code className="stream-url">{stream.url}</code>
            </div>
          ))
        )}
      </div>
    </div>
  );
}

export default StreamViewer;