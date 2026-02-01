// Utility to test API connectivity
export const testAPIConnection = async () => {
  const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  
  try {
    console.log('Testing API connection to:', API_URL);
    const response = await fetch(`${API_URL}/health`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });
    
    if (response.ok) {
      const data = await response.json();
      console.log('API Gateway is accessible!', data);
      return { success: true, data };
    } else {
      console.error('API Gateway returned error:', response.status, response.statusText);
      return { success: false, error: `HTTP ${response.status}` };
    }
  } catch (error) {
    console.error('API Gateway connection failed:', error);
    return { success: false, error: error.message };
  }
};



