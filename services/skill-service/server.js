const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3002;

app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));
app.use(express.json());

// MongoDB connection
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/skillswap-skills';
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

// Skill Listing Schema
const skillSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  title: { type: String, required: true },
  description: { type: String, required: true },
  category: { type: String, required: true },
  level: { type: String, enum: ['Beginner', 'Intermediate', 'Advanced'], default: 'Intermediate' },
  tags: [{ type: String }],
  availableForSwap: { type: Boolean, default: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

const Skill = mongoose.model('Skill', skillSchema);

// Category Schema
const categorySchema = new mongoose.Schema({
  name: { type: String, required: true, unique: true },
  description: { type: String },
});

const Category = mongoose.model('Category', categorySchema);

// Initialize default categories
const initializeCategories = async () => {
  const categories = [
    { name: 'Programming', description: 'Software development and coding' },
    { name: 'Design', description: 'Graphic design, UI/UX' },
    { name: 'Marketing', description: 'Digital marketing, SEO, content' },
    { name: 'Language', description: 'Language learning and teaching' },
    { name: 'Music', description: 'Music production, instruments' },
    { name: 'Photography', description: 'Photography and editing' },
    { name: 'Writing', description: 'Content writing, copywriting' },
    { name: 'Business', description: 'Business strategy, entrepreneurship' },
    { name: 'Other', description: 'Other skills' },
  ];

  for (const cat of categories) {
    await Category.findOneAndUpdate({ name: cat.name }, cat, { upsert: true });
  }
};

initializeCategories();

// Routes
// Get all categories
app.get('/api/categories', async (req, res) => {
  try {
    const categories = await Category.find();
    res.json(categories);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Create a skill listing
app.post('/api/skills', async (req, res) => {
  console.log('[SKILL-SERVICE] Create skill request received');
  console.log('[SKILL-SERVICE] Request body:', JSON.stringify(req.body, null, 2));
  try {
    const { userId, title, description, category, level, tags } = req.body;

    console.log('[SKILL-SERVICE] Extracted fields:', {
      userId: userId ? 'present' : 'missing',
      title: title ? 'present' : 'missing',
      description: description ? 'present' : 'missing',
      category: category ? 'present' : 'missing',
    });

    if (!userId || !title || !description || !category) {
      const missing = [];
      if (!userId) missing.push('userId');
      if (!title) missing.push('title');
      if (!description) missing.push('description');
      if (!category) missing.push('category');
      console.log('[SKILL-SERVICE] Validation failed - missing fields:', missing);
      return res.status(400).json({ 
        error: 'Required fields missing',
        missing: missing 
      });
    }

    console.log('[SKILL-SERVICE] Creating skill...');
    const skill = new Skill({
      userId,
      title,
      description,
      category,
      level: level || 'Intermediate',
      tags: tags || [],
    });

    await skill.save();
    console.log('[SKILL-SERVICE] Skill saved successfully:', skill._id);
    // Normalize skill object to use 'id' instead of '_id'
    const skillObj = skill.toObject();
    skillObj.id = skillObj._id;
    delete skillObj._id;
    res.status(201).json(skillObj);
  } catch (error) {
    console.error('[SKILL-SERVICE] Error creating skill:', error);
    res.status(500).json({ error: error.message });
  }
});

// Get all skills
app.get('/api/skills', async (req, res) => {
  try {
    const { category, userId, search } = req.query;
    let query = { availableForSwap: true };

    if (category) query.category = category;
    if (userId) query.userId = userId;
    if (search) {
      query.$or = [
        { title: { $regex: search, $options: 'i' } },
        { description: { $regex: search, $options: 'i' } },
        { tags: { $in: [new RegExp(search, 'i')] } },
      ];
    }

    const skills = await Skill.find(query).sort({ createdAt: -1 });
    // Normalize skills to use 'id' instead of '_id'
    const normalizedSkills = skills.map(skill => {
      const skillObj = skill.toObject();
      skillObj.id = skillObj._id;
      delete skillObj._id;
      return skillObj;
    });
    res.json(normalizedSkills);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Get skill by ID
app.get('/api/skills/:id', async (req, res) => {
  try {
    const skill = await Skill.findById(req.params.id);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    // Normalize skill object to use 'id' instead of '_id'
    const skillObj = skill.toObject();
    skillObj.id = skillObj._id;
    delete skillObj._id;
    res.json(skillObj);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Update skill
app.put('/api/skills/:id', async (req, res) => {
  try {
    const skill = await Skill.findByIdAndUpdate(
      req.params.id,
      { ...req.body, updatedAt: new Date() },
      { new: true, runValidators: true }
    );

    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }

    res.json(skill);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Delete skill
app.delete('/api/skills/:id', async (req, res) => {
  try {
    const skill = await Skill.findByIdAndDelete(req.params.id);
    if (!skill) {
      return res.status(404).json({ error: 'Skill not found' });
    }
    res.json({ message: 'Skill deleted successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', service: 'skill-service' });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`Skill Service running on port ${PORT}`);
  console.log(`Listening on 0.0.0.0:${PORT}`);
});

