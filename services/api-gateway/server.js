const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');
const cors = require('cors');
const axios = require('axios');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// Request logging middleware
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// Service URLs
const USER_SERVICE = process.env.USER_SERVICE_URL || 'http://user-service:3001';
const SKILL_SERVICE = process.env.SKILL_SERVICE_URL || 'http://skill-service:3002';
const EXCHANGE_SERVICE = process.env.EXCHANGE_SERVICE_URL || 'http://exchange-service:3003';
const NOTIFICATION_SERVICE = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3004';

console.log('API Gateway Service URLs:', {
  USER_SERVICE,
  SKILL_SERVICE,
  EXCHANGE_SERVICE,
  NOTIFICATION_SERVICE
});

// Proxy middleware
app.use(
  '/api/users',
  createProxyMiddleware({
    target: USER_SERVICE,
    changeOrigin: true,
    timeout: 30000, // 30 second timeout
    pathRewrite: {
      '^/api/users': '/api/users',
    },
    onError: (err, req, res) => {
      console.error('[PROXY ERROR] User Service Proxy Error:', err.message);
      console.error('[PROXY ERROR] Error code:', err.code);
      console.error('[PROXY ERROR] Request URL:', req.url);
      console.error('[PROXY ERROR] Target:', USER_SERVICE);
      console.error('[PROXY ERROR] Full error:', err);
      if (!res.headersSent) {
        res.status(500).json({ error: 'User service unavailable', details: err.message, code: err.code });
      }
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[PROXY] ${req.method} ${req.url} -> ${USER_SERVICE}${req.url}`);
      if (req.body) {
        const bodyData = JSON.stringify(req.body);
        console.log(`[PROXY] Forwarding body:`, bodyData);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`[PROXY] Response from ${USER_SERVICE}: ${proxyRes.statusCode}`);
    },
    logLevel: 'debug',
  })
);

app.use(
  '/api/skills',
  createProxyMiddleware({
    target: SKILL_SERVICE,
    changeOrigin: true,
    timeout: 30000,
    pathRewrite: {
      '^/api/skills': '/api/skills',
    },
    onError: (err, req, res) => {
      console.error('[PROXY ERROR] Skill Service Proxy Error:', err.message);
      console.error('[PROXY ERROR] Error code:', err.code);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Skill service unavailable', details: err.message });
      }
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[PROXY] ${req.method} ${req.url} -> ${SKILL_SERVICE}${req.url}`);
      if (req.body) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`[PROXY] Response from ${SKILL_SERVICE}: ${proxyRes.statusCode}`);
    },
  })
);

app.use(
  '/api/categories',
  createProxyMiddleware({
    target: SKILL_SERVICE,
    changeOrigin: true,
    pathRewrite: {
      '^/api/categories': '/api/categories',
    },
  })
);

app.use(
  '/api/exchanges',
  createProxyMiddleware({
    target: EXCHANGE_SERVICE,
    changeOrigin: true,
    timeout: 30000,
    pathRewrite: {
      '^/api/exchanges': '/api/exchanges',
    },
    onError: (err, req, res) => {
      console.error('[PROXY ERROR] Exchange Service Proxy Error:', err.message);
      console.error('[PROXY ERROR] Error code:', err.code);
      if (!res.headersSent) {
        res.status(500).json({ error: 'Exchange service unavailable', details: err.message });
      }
    },
    onProxyReq: (proxyReq, req, res) => {
      console.log(`[PROXY] ${req.method} ${req.url} -> ${EXCHANGE_SERVICE}${req.url}`);
      if (req.body) {
        const bodyData = JSON.stringify(req.body);
        proxyReq.setHeader('Content-Type', 'application/json');
        proxyReq.setHeader('Content-Length', Buffer.byteLength(bodyData));
        proxyReq.write(bodyData);
      }
    },
    onProxyRes: (proxyRes, req, res) => {
      console.log(`[PROXY] Response from ${EXCHANGE_SERVICE}: ${proxyRes.statusCode}`);
    },
  })
);

app.use(
  '/api/notifications',
  createProxyMiddleware({
    target: NOTIFICATION_SERVICE,
    changeOrigin: true,
    pathRewrite: {
      '^/api/notifications': '/api/notifications',
    },
  })
);

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({
    status: 'ok',
    service: 'api-gateway',
    services: {
      user: USER_SERVICE,
      skill: SKILL_SERVICE,
      exchange: EXCHANGE_SERVICE,
      notification: NOTIFICATION_SERVICE,
    },
  });
});

// Test endpoint
app.get('/api/test', (req, res) => {
  res.json({ message: 'API Gateway is working!', timestamp: new Date().toISOString() });
});

// Test user-service connectivity
app.get('/api/test-user-service', async (req, res) => {
  try {
    console.log('Testing connectivity to user-service at:', USER_SERVICE);
    const response = await axios.get(`${USER_SERVICE}/health`, { timeout: 5000 });
    res.json({ 
      success: true, 
      message: 'User service is reachable',
      response: response.data 
    });
  } catch (error) {
    console.error('User service connectivity test failed:', error.message);
    console.error('Error code:', error.code);
    res.status(500).json({ 
      success: false, 
      error: error.message,
      code: error.code,
      target: USER_SERVICE
    });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`API Gateway running on port ${PORT}`);
  console.log(`Listening on 0.0.0.0:${PORT}`);
  console.log(`Service URLs configured:`, {
    USER_SERVICE,
    SKILL_SERVICE,
    EXCHANGE_SERVICE,
    NOTIFICATION_SERVICE,
  });
});

