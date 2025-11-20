const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const bodyParser = require('body-parser');

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Serve static frontend files from project root so API and UI share origin
const path = require('path');
app.use(express.static(path.join(__dirname)));

const PORT = process.env.PORT || 5000;

// connect to MongoDB
const mongoUri = process.env.MONGO_URI;
if(!mongoUri){
  console.error('MONGO_URI not set. Copy .env.example to .env and set MONGO_URI');
  // we continue so user can still run the server without DB for frontend dev
}
mongoose.connect(mongoUri || '', {
  autoIndex: true
}).then(()=> console.log('Connected to MongoDB'))
.catch(err => console.warn('MongoDB connection warning:', err && err.message));

// Models
const Product = require('./models/product');
const Order = require('./models/order');
const Contact = require('./models/contact');

// Routes
const productsRouter = require('./routes/products');
const ordersRouter = require('./routes/orders');
const contactRouter = require('./routes/contact');
const adminRouter = require('./routes/admin');
const couponsRouter = require('./routes/coupons');

app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/contact', contactRouter);
app.use('/api/admin', adminRouter);
app.use('/api/coupons', couponsRouter);

app.get('/', (req, res) => {
  res.json({ message: 'Coffee Shop API' });
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
