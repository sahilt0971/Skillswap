const express = require('express');
const mongoose = require('mongoose');
const axios = require('axios');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3003;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillswap-exchanges';
console.log('Connecting to MongoDB:', MONGODB_URI.replace(/\/\/.*@/, '//***@'));

mongoose.connect(MONGODB_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

mongoose.connection.on('connected', () => {
  console.log('MongoDB connected successfully');
});

mongoose.connection.on('error', (err) => {
  console.error('MongoDB connection error:', err);
});

mongoose.connection.on('disconnected', () => {
  console.log('MongoDB disconnected');
});

// Exchange Request Schema
const exchangeSchema = new mongoose.Schema({
  requesterId: { type: String, required: true },
  providerId: { type: String, required: true },
  requestedSkillId: { type: String, required: true },
  offeredSkillId: { type: String },
  status: {
    type: String,
    enum: ['pending', 'accepted', 'rejected', 'completed', 'cancelled'],
    default: 'pending',
  },
  message: { type: String, default: '' },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Exchange = mongoose.model('Exchange', exchangeSchema);

// Routes
// Create exchange request
app.post('/api/exchanges', async (req, res) => {
  console.log('[EXCHANGE-SERVICE] Create exchange request received');
  console.log('[EXCHANGE-SERVICE] Request body:', JSON.stringify(req.body, null, 2));
  try {
    const { requesterId, providerId, requestedSkillId, offeredSkillId, message } = req.body;

    console.log('[EXCHANGE-SERVICE] Extracted fields:', {
      requesterId: requesterId ? 'present' : 'missing',
      providerId: providerId ? 'present' : 'missing',
      requestedSkillId: requestedSkillId ? 'present' : 'missing',
    });

    if (!requesterId || !providerId || !requestedSkillId) {
      const missing = [];
      if (!requesterId) missing.push('requesterId');
      if (!providerId) missing.push('providerId');
      if (!requestedSkillId) missing.push('requestedSkillId');
      console.log('[EXCHANGE-SERVICE] Validation failed - missing fields:', missing);
      return res.status(400).json({ 
        error: 'Required fields missing',
        missing: missing 
      });
    }

    // Check if exchange already exists
    const existingExchange = await Exchange.findOne({
      requesterId,
      providerId,
      requestedSkillId,
      status: { $in: ['pending', 'accepted'] },
    });

    if (existingExchange) {
      return res.status(400).json({ error: 'Exchange request already exists' });
    }

    const exchange = new Exchange({
      requesterId,
      providerId,
      requestedSkillId,
      offeredSkillId,
      message: message || '',
    });

    console.log('[EXCHANGE-SERVICE] Saving exchange to database...');
    await exchange.save();
    console.log('[EXCHANGE-SERVICE] Exchange saved successfully:', exchange._id);

    // Notify notification service
    try {
      const notificationUrl = process.env.NOTIFICATION_SERVICE_URL || 'http://notification-service:3004';
      console.log('[EXCHANGE-SERVICE] Sending notification to:', notificationUrl);
      await axios.post(`${notificationUrl}/api/notifications`, {
        userId: providerId,
        type: 'exchange_request',
        title: 'New Skill Swap Request',
        message: `You have received a new skill swap request`,
        exchangeId: exchange._id,
      });
      console.log('[EXCHANGE-SERVICE] Notification sent successfully');
    } catch (err) {
      console.error('[EXCHANGE-SERVICE] Failed to send notification:', err.message);
    }

    console.log('[EXCHANGE-SERVICE] Sending response...');
    res.status(201).json(exchange);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get exchanges for a user
app.get('/api/exchanges', async (req, res) => {
  try {
    const { userId, status } = req.query;
    let query = {};

    if (userId) {
      query.$or = [{ requesterId: userId }, { providerId: userId }];
    }
    if (status) {
      query.status = status;
    }

    const exchanges = await Exchange.find(query)
      .sort({ createdAt: -1 })
      .populate('requestedSkillId')
      .populate('offeredSkillId');

    res.json(exchanges);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get exchange by ID
app.get('/api/exchanges/:id', async (req, res) => {
  try {
    const exchange = await Exchange.findById(req.params.id);
    if (!exchange) {
      return res.status(404).json({ error: 'Exchange not found' });
    }
    res.json(exchange);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update exchange status
app.put('/api/exchanges/:id/status', async (req, res) => {
  try {
    const { status } = req.body;
    const validStatuses = ['pending', 'accepted', 'rejected', 'completed', 'cancelled'];

    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status' });
    }

    const exchange = await Exchange.findById(req.params.id);
    if (!exchange) {
      return res.status(404).json({ error: 'Exchange not found' });
    }

    exchange.status = status;
    exchange.updatedAt = new Date();
    await exchange.save();

    // Notify users
    try {
      const notifyUserId = status === 'accepted' ? exchange.requesterId : exchange.providerId;
      await axios.post(`${process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:3004'}/api/notifications`, {
        userId: notifyUserId,
        type: 'exchange_update',
        title: `Exchange ${status}`,
        message: `Your skill swap request has been ${status}`,
        exchangeId: exchange._id,
      });
    } catch (err) {
      console.error('Failed to send notification:', err.message);
    }

    res.json(exchange);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'exchange-service' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Exchange Service running on port ${PORT}`);
  console.log(`Listening on 0.0.0.0:${PORT}`);
});

