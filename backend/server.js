const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

// Read your data.json file
const loadData = () => {
  try {
    const dataPath = path.join(process.cwd(), 'data.json');
    const rawData = fs.readFileSync(dataPath, 'utf8');
    return JSON.parse(rawData);
  } catch (error) {
    console.error('Error loading data:', error);
    return {};
  }
};

// Basic route
app.get('/', (req, res) => {
  res.json({ 
    message: 'Coffee Shop Backend API is running!',
    status: 'success',
    timestamp: new Date().toISOString()
  });
});

// API routes
app.get('/api/products', (req, res) => {
  const data = loadData();
  res.json(data.products || []);
});

app.get('/api/menu', (req, res) => {
  const data = loadData();
  res.json(data.menu || []);
});

app.get('/api/orders', (req, res) => {
  const data = loadData();
  res.json(data.orders || []);
});

// Add more API endpoints as needed
app.post('/api/order', (req, res) => {
  const { items, customerName } = req.body;
  // Process order logic here
  res.json({ 
    message: 'Order received', 
    orderId: Date.now(),
    items,
    customerName 
  });
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Something went wrong!' });
});

// 404 handler
app.use('*', (req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// Vercel-compatible export
module.exports = app;

// Local development server (only runs when not on Vercel)
if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`🚀 Server running locally on port ${PORT}`);
    console.log(`📊 Health check: http://localhost:${PORT}/health`);
  });
}