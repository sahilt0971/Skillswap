import React, { useState, useEffect } from 'react';
import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';

function Diagnostics() {
  const [results, setResults] = useState({});

  const testConnection = async () => {
    const tests = {
      health: null,
      test: null,
      register: null,
    };

    // Test 1: Health endpoint
    try {
      const start = Date.now();
      const response = await axios.get(`${API_URL}/health`, { timeout: 5000 });
      const duration = Date.now() - start;
      tests.health = { success: true, status: response.status, duration, data: response.data };
    } catch (error) {
      tests.health = { success: false, error: error.message, code: error.code };
    }

    // Test 2: Test endpoint
    try {
      const start = Date.now();
      const response = await axios.get(`${API_URL}/api/test`, { timeout: 5000 });
      const duration = Date.now() - start;
      tests.test = { success: true, status: response.status, duration, data: response.data };
    } catch (error) {
      tests.test = { success: false, error: error.message, code: error.code };
    }

    // Test 3: Register endpoint (should fail with validation, not timeout)
    try {
      const start = Date.now();
      const response = await axios.post(`${API_URL}/api/users/register`, {
        username: 'test',
        email: 'test@test.com',
        password: 'test123',
        firstName: 'Test',
        lastName: 'User'
      }, { timeout: 5000 });
      const duration = Date.now() - start;
      tests.register = { success: true, status: response.status, duration, data: response.data };
    } catch (error) {
      const duration = error.response ? Date.now() - (Date.now() - 100) : 'timeout';
      tests.register = { 
        success: false, 
        error: error.message, 
        code: error.code,
        status: error.response?.status,
        duration: error.code === 'ECONNABORTED' ? 'timeout' : duration
      };
    }

    setResults(tests);
  };

  useEffect(() => {
    testConnection();
  }, []);

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <h1>API Connection Diagnostics</h1>
      <p>API URL: <strong>{API_URL}</strong></p>
      <button onClick={testConnection} style={{ padding: '0.5rem 1rem', marginBottom: '1rem' }}>
        Run Tests Again
      </button>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
        <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
          <h3>Health Endpoint: /health</h3>
          {results.health ? (
            results.health.success ? (
              <div style={{ color: 'green' }}>
                ✓ Success ({results.health.duration}ms) - Status: {results.health.status}
                <pre>{JSON.stringify(results.health.data, null, 2)}</pre>
              </div>
            ) : (
              <div style={{ color: 'red' }}>
                ✗ Failed: {results.health.error} ({results.health.code})
              </div>
            )
          ) : (
            <div>Testing...</div>
          )}
        </div>

        <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
          <h3>Test Endpoint: /api/test</h3>
          {results.test ? (
            results.test.success ? (
              <div style={{ color: 'green' }}>
                ✓ Success ({results.test.duration}ms) - Status: {results.test.status}
                <pre>{JSON.stringify(results.test.data, null, 2)}</pre>
              </div>
            ) : (
              <div style={{ color: 'red' }}>
                ✗ Failed: {results.test.error} ({results.test.code})
              </div>
            )
          ) : (
            <div>Testing...</div>
          )}
        </div>

        <div style={{ border: '1px solid #ccc', padding: '1rem', borderRadius: '8px' }}>
          <h3>Register Endpoint: /api/users/register</h3>
          {results.register ? (
            results.register.success ? (
              <div style={{ color: 'green' }}>
                ✓ Success ({results.register.duration}ms) - Status: {results.register.status}
              </div>
            ) : (
              <div style={{ color: results.register.status ? 'orange' : 'red' }}>
                {results.register.status ? (
                  <>⚠ Validation Error (Expected): {results.register.error} - Status: {results.register.status}</>
                ) : (
                  <>✗ Failed: {results.register.error} ({results.register.code})</>
                )}
              </div>
            )
          ) : (
            <div>Testing...</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Diagnostics;

