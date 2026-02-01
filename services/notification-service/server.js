const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3004;

app.use(cors());
app.use(express.json());

// MongoDB connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/skillswap-notifications', {
  useNewUrlParser: true,
  useUnifiedTopology: true,
});

// Notification Schema
const notificationSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  type: { type: String, required: true },
  title: { type: String, required: true },
  message: { type: String, required: true },
  read: { type: Boolean, default: false },
  exchangeId: { type: String },
  createdAt: { type: Date, default: Date.now },
});

const Notification = mongoose.model('Notification', notificationSchema);

// Routes
// Create notification
app.post('/api/notifications', async (req, res) => {
  try {
    const { userId, type, title, message, exchangeId } = req.body;

    if (!userId || !type || !title || !message) {
      return res.status(400).json({ error: 'Required fields missing' });
    }

    const notification = new Notification({
      userId,
      type,
      title,
      message,
      exchangeId,
    });

    await notification.save();
    res.status(201).json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get notifications for a user
app.get('/api/notifications/:userId', async (req, res) => {
  try {
    const { read } = req.query;
    let query = { userId: req.params.userId };

    if (read !== undefined) {
      query.read = read === 'true';
    }

    const notifications = await Notification.find(query).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark notification as read
app.put('/api/notifications/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(
      req.params.id,
      { read: true },
      { new: true }
    );

    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }

    res.json(notification);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Mark all notifications as read
app.put('/api/notifications/user/:userId/read-all', async (req, res) => {
  try {
    await Notification.updateMany({ userId: req.params.userId }, { read: true });
    res.json({ message: 'All notifications marked as read' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete notification
app.delete('/api/notifications/:id', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndDelete(req.params.id);
    if (!notification) {
      return res.status(404).json({ error: 'Notification not found' });
    }
    res.json({ message: 'Notification deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'notification-service' });
});

app.listen(PORT, () => {
  console.log(`Notification Service running on port ${PORT}`);
});



