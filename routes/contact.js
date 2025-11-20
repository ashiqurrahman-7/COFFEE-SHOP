const express = require('express');
const router = express.Router();
const Contact = require('../models/contact');

// POST /api/contact - submit contact message
router.post('/', async (req, res) => {
  try {
    const c = new Contact(req.body);
    await c.save();
    res.status(201).json({ message: 'Message received' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// GET /api/contact - list messages (admin)
router.get('/', async (req, res) => {
  try {
    // admin check via header ADMIN_KEY if set
    const adminKey = req.headers['x-admin-key'];
    if(process.env.ADMIN_KEY && adminKey !== process.env.ADMIN_KEY){
      return res.status(401).json({ error: 'Unauthorized' });
    }
    const msgs = await Contact.find().sort({ createdAt: -1 });
    res.json(msgs);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;
