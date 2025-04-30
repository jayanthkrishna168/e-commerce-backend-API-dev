const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();
const winston = require('winston');
const expressWinston = require('express-winston');

// Routes
const userRoutes = require('./routes/userRoutes');
const productRoutes = require('./routes/productRoutes');
const orderRoutes = require('./routes/orderRoutes');
const categoryRoutes = require('./routes/categoryRoutes');

// Swagger
const { swaggerSpec, swaggerUi } = require('./swagger');

const app = express();

// Configure logger
const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.json()
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'combined.log' })
  ]
});

// Middleware
app.use(cors());
app.use(express.json());

// Request logging middleware
app.use(expressWinston.logger({
  winstonInstance: logger,
  meta: true,
  msg: 'HTTP {{req.method}} {{req.url}}',
  expressFormat: true,
  colorize: false,
}));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ecommerce')
  .then(() => logger.info('Connected to MongoDB'))
  .catch(err => logger.error('MongoDB connection error:', err));

// Routes
app.use('/api/users', userRoutes);
app.use('/api/products', productRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/categories', categoryRoutes);

// Swagger Docs
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerSpec));

// Basic route
app.get('/', (req, res) => {
  res.send('E-Commerce Weather API');
});

// Error logging middleware
app.use(expressWinston.errorLogger({
  winstonInstance: logger
}));

if (process.env.NODE_ENV !== 'test') {
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => logger.info(`Server running on port ${PORT}`));
}
module.exports = app; // Export for testing