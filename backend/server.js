const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

const app = express();

// Enhanced CORS configuration
app.use(cors({
  origin: ['http://127.0.0.1:5500', 'http://localhost:5500', 'http://127.0.0.1:3000', 'http://localhost:3000'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-key']
}));

app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Create uploads directory if it doesn't exist
if (!fs.existsSync('uploads')) {
  fs.mkdirSync('uploads');
}

// Define all 6 products (PERMANENT LIST)
const ALL_PRODUCTS = [
  {
    _id: '1',
    name: "Strawberry Coffee",
    price: 39.99,
    category: "hot",
    description: "Freshly brewed strawberry infused coffee.",
    image: "/images/cup2-removebg-preview.png",
    createdAt: new Date()
  },
  {
    _id: '2',
    name: "Green Tea Coffee",
    price: 29.99,
    category: "hot",
    description: "Smooth matcha green tea latte.",
    image: "/images/cup3-removebg-preview.png",
    createdAt: new Date()
  },
  {
    _id: '3',
    name: "Chocolate Coffee",
    price: 34.99,
    category: "hot",
    description: "Velvety cocoa blended coffee.",
    image: "/images/cup4-removebg-preview.png",
    createdAt: new Date()
  },
  {
    _id: '4',
    name: "Caramel Sauce & Vanilla Cream",
    price: 42.99,
    category: "hot",
    description: "Rich caramel sauce with smooth vanilla cream.",
    image: "/images/caramel-sauce-and-vanilla-cream.png",
    createdAt: new Date()
  },
  {
    _id: '5',
    name: "Iced Mint Cookie Latte",
    price: 36.99,
    category: "iced",
    description: "Refreshing iced mint cookie latte.",
    image: "/images/icedmintcookielatte.png",
    createdAt: new Date()
  },
  {
    _id: '6',
    name: "Iced Caramel Mocha",
    price: 44.99,
    category: "iced",
    description: "Chilled caramel mocha delight.",
    image: "/images/iced-caramel-mocha.png",
    createdAt: new Date()
  }
];

// Simple in-memory database
let database = {
  users: [],
  products: [...ALL_PRODUCTS], // ALWAYS start with all products
  coupons: [],
  orders: []
};

// Load data from file if exists
function loadData() {
  try {
    if (fs.existsSync('data.json')) {
      const data = fs.readFileSync('data.json', 'utf8');
      const fileData = JSON.parse(data);
      
      // Keep users, coupons, and orders from file
      database.users = fileData.users || [];
      database.coupons = fileData.coupons || [];
      database.orders = fileData.orders || [];
      
      // BUT ALWAYS use all 6 products, never load from file
      database.products = [...ALL_PRODUCTS];
      
      console.log('📁 Loaded existing data (with all 6 products)');
    } else {
      console.log('📁 No existing data file, starting fresh with all 6 products');
    }
  } catch (error) {
    console.log('❌ Error loading data file, starting fresh with all 6 products');
    database.products = [...ALL_PRODUCTS];
  }
}

// Save data to file - but NEVER save products (always use the permanent list)
function saveData() {
  try {
    // Create a copy without products to save
    const dataToSave = {
      users: database.users,
      coupons: database.coupons,
      orders: database.orders
      // products are intentionally omitted - they always come from ALL_PRODUCTS
    };
    
    fs.writeFileSync('data.json', JSON.stringify(dataToSave, null, 2));
    console.log('💾 Data saved to file (products preserved separately)');
  } catch (error) {
    console.error('❌ Error saving data:', error);
  }
}

// Authentication middleware
const authenticateAdmin = (req, res, next) => {
  const token = req.headers['x-admin-key'];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'coffee-shop-secret');
    if (decoded.role !== 'admin') {
      return res.status(403).json({ error: 'Admin access required' });
    }
    next();
  } catch (error) {
    res.status(401).json({ error: 'Invalid token' });
  }
};

// Routes

// Test route
app.get('/api/test', (req, res) => {
  res.json({ 
    message: 'Backend is working!',
    totalProducts: database.products.length,
    products: database.products.map(p => p.name)
  });
});

// Get all products - ALWAYS return all 6
app.get('/api/products', (req, res) => {
  try {
    console.log(`📦 Returning ${database.products.length} products`);
    res.json(database.products);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User Registration
app.post('/api/signup', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    
    const existingUser = database.users.find(user => user.email === email);
    if (existingUser) {
      return res.status(400).json({ error: 'User already exists' });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const user = {
      _id: Date.now().toString(),
      name,
      email,
      password: hashedPassword,
      role: 'customer'
    };

    database.users.push(user);
    saveData();

    res.json({ success: true, message: 'User created successfully' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// User Login
app.post('/api/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    
    const user = database.users.find(u => u.email === email);
    if (!user) {
      return res.status(400).json({ error: 'User not found' });
    }

    const validPassword = await bcrypt.compare(password, user.password);
    if (!validPassword) {
      return res.status(400).json({ error: 'Invalid password' });
    }

    const token = jwt.sign(
      { userId: user._id, email: user.email, role: user.role },
      process.env.JWT_SECRET || 'coffee-shop-secret',
      { expiresIn: '24h' }
    );
    
    res.json({ 
      success: true, 
      token,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Admin Login
app.post('/api/admin/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    
    const adminUsername = process.env.ADMIN_USERNAME || 'admin';
    const adminPassword = process.env.ADMIN_PASSWORD || 'admin123';

    if (username === adminUsername && password === adminPassword) {
      const token = jwt.sign(
        { username, role: 'admin' },
        process.env.JWT_SECRET || 'coffee-shop-secret',
        { expiresIn: '24h' }
      );

      res.json({ 
        success: true, 
        token,
        user: {
          username,
          role: 'admin'
        }
      });
    } else {
      res.status(401).json({ error: 'Invalid admin credentials' });
    }
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Products CRUD - These will add temporary products during session
app.post('/api/products', authenticateAdmin, (req, res) => {
  try {
    const { name, price, category, description, image } = req.body;

    const product = {
      _id: Date.now().toString(),
      name,
      price: parseFloat(price),
      category,
      description,
      image: image || '',
      createdAt: new Date()
    };

    database.products.push(product);
    // Don't save products to file - they're temporary
    
    res.json(product);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Other routes remain the same...
app.put('/api/products/:id', authenticateAdmin, (req, res) => {
  try {
    const { name, price } = req.body;
    const productIndex = database.products.findIndex(p => p._id === req.params.id);
    
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    database.products[productIndex] = {
      ...database.products[productIndex],
      name,
      price: parseFloat(price)
    };
    
    res.json(database.products[productIndex]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.delete('/api/products/:id', authenticateAdmin, (req, res) => {
  try {
    const productIndex = database.products.findIndex(p => p._id === req.params.id);
    
    if (productIndex === -1) {
      return res.status(404).json({ error: 'Product not found' });
    }

    database.products.splice(productIndex, 1);
    res.json({ success: true });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Coupons CRUD
app.get('/api/coupons', authenticateAdmin, (req, res) => {
  try {
    res.json(database.coupons);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/coupons', authenticateAdmin, (req, res) => {
  try {
    const { code, discount, expiry, description } = req.body;

    const coupon = {
      _id: Date.now().toString(),
      code: code.toUpperCase(),
      discount: parseInt(discount),
      expiry: new Date(expiry),
      description,
      active: true,
      createdAt: new Date()
    };

    database.coupons.push(coupon);
    saveData();
    
    res.json(coupon);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/coupons/:id', authenticateAdmin, (req, res) => {
  try {
    const { code, discount, active } = req.body;
    const couponIndex = database.coupons.findIndex(c => c._id === req.params.id);
    
    if (couponIndex === -1) {
      return res.status(404).json({ error: 'Coupon not found' });
    }

    const updateData = {};
    if (code) updateData.code = code.toUpperCase();
    if (discount) updateData.discount = parseInt(discount);
    if (typeof active !== 'undefined') updateData.active = active;

    database.coupons[couponIndex] = {
      ...database.coupons[couponIndex],
      ...updateData
    };
    
    saveData();
    res.json(database.coupons[couponIndex]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Orders CRUD
app.get('/api/orders', authenticateAdmin, (req, res) => {
  try {
    res.json(database.orders);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.post('/api/orders', (req, res) => {
  try {
    const { items, total, customer, paymentMethod, paymentRef } = req.body;

    const order = {
      _id: Date.now().toString(),
      items,
      total: parseFloat(total),
      customer,
      paymentMethod,
      paymentRef,
      status: 'pending',
      createdAt: new Date()
    };

    database.orders.push(order);
    saveData();
    
    res.json(order);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

app.put('/api/orders/:id', authenticateAdmin, (req, res) => {
  try {
    const { status } = req.body;
    const orderIndex = database.orders.findIndex(o => o._id === req.params.id);
    
    if (orderIndex === -1) {
      return res.status(404).json({ error: 'Order not found' });
    }

    database.orders[orderIndex].status = status;
    saveData();
    
    res.json(database.orders[orderIndex]);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// File Upload
app.post('/api/upload', (req, res) => {
  try {
    res.json({ url: '/images/demo-product.jpg' });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});

// Load data and ALWAYS ensure we have all 6 products
loadData();

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📊 PERMANENTLY serving ${database.products.length} products`);
  console.log(`👤 Demo user: demo@user.com / password123`);
  console.log(`🔑 Admin: admin / admin123`);
  console.log(`📦 Products (always available):`);
  database.products.forEach((product, index) => {
    console.log(`   ${index + 1}. ${product.name} - $${product.price}`);
  });
});