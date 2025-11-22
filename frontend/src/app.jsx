import { useEffect, useState } from 'react';

function App() {
  const [healthStatus, setHealthStatus] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetch('http://localhost:3001/api/health')
      .then((res) => res.json())
      .then((data) => setHealthStatus(data))
      .catch((err) => setError(err.toString()));
  }, []);

  return (
    <div style={{ padding: '2rem', fontFamily: 'sans-serif' }}>
      <h1>CIS 5500 Health Risk App</h1>

      <h2>Backend status</h2>
      {error && <p style={{ color: 'red' }}>Error: {error}</p>}
      {healthStatus ? (
        <pre>{JSON.stringify(healthStatus, null, 2)}</pre>
      ) : (
        <p>Loading...</p>
      )}
    </div>
  );
}

export default App;
