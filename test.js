const request = require('supertest');
const mongoose = require('mongoose');
const dotenv = require('dotenv');

// Load test environment variables
dotenv.config({ path: '.env.test' });

// Import models
const Product = require('./models/Product');
const User = require('./models/User');
const Order = require('./models/Order');
const Category = require('./models/Category');

// Will be initialized after DB connection
let app;
let server;

describe('E-Commerce Weather API Tests', () => {
  let authToken;
  let testUser;
  let testProduct;
  let testCategory;

  beforeAll(async () => {
    try {
      // Connect to test database
      await mongoose.connect(process.env.MONGODB_URI);
      await mongoose.connection.dropDatabase();
      
      // Initialize app after DB connection
      app = require('./app');
      server = app.listen(0); // Random port for tests
      
      // Create test user
      testUser = await User.create({
        email: 'test@example.com',
        password: 'password123',
        name: 'Test User'
      });
      
      // Login to get token
      const loginRes = await request(app)
        .post('/api/users/login')
        .send({ email: 'test@example.com', password: 'password123' });
      authToken = loginRes.body.token;

      // Create test category
      testCategory = await Category.create({
        name: 'Test Category',
        description: 'Test Description'
      });
    } catch (err) {
      console.error('Test setup error:', err);
      throw err;
    }
  }, 15000); // Increased timeout for DB operations

  afterAll(async () => {
    try {
      await mongoose.connection.close();
      await server.close();
    } catch (err) {
      console.error('Test teardown error:', err);
    }
  });

  beforeEach(async () => {
    try {
      // Create test product before each test
      testProduct = await Product.create({
        name: 'Test Product',
        price: 100,
        description: 'Test Description',
        weatherTags: ['sunny'],
        categories: [testCategory._id]
      });
    } catch (err) {
      console.error('BeforeEach error:', err);
      throw err;
    }
  });

  afterEach(async () => {
    try {
      await Product.deleteMany({});
      await Order.deleteMany({});
    } catch (err) {
      console.error('AfterEach error:', err);
    }
  });

  // Unit Tests
  describe('Unit Tests - Models', () => {
    it('User Model - should hash password before saving', async () => {
      const user = new User({
        email: 'unit@test.com',
        password: 'plainpassword',
        name: 'Unit Test User'
      });
      const savedUser = await user.save();
      expect(savedUser.password).not.toBe('plainpassword');
      expect(savedUser.password).toMatch(/^\$2[aby]\$\d+\$/); // bcrypt hash format
    });

    it('Product Model - should require name and price', async () => {
      const product = new Product({ description: 'Missing fields' });
      await expect(product.save()).rejects.toThrow(mongoose.Error.ValidationError);
    });

    it('Order Model - should calculate total automatically', async () => {
      const order = new Order({
        userId: testUser._id,
        products: [{
          productId: testProduct._id,
          quantity: 2
        }]
      });
      const savedOrder = await order.save();
      expect(savedOrder.totalAmount).toBe(testProduct.price * 2);
    });
  });

  // Integration Tests
  describe('Integration Tests - API Endpoints', () => {
    describe('User Endpoints', () => {
      it('POST /api/users/register - should register new user', async () => {
        const res = await request(app)
          .post('/api/users/register')
          .send({
            email: 'new@example.com',
            password: 'ValidPass123!',
            name: 'New User'
          });
        expect(res.statusCode).toBe(201);
        expect(res.body).toHaveProperty('token');
      });

      it('GET /api/users/me - should get user profile', async () => {
        const res = await request(app)
          .get('/api/users/me')
          .set('Authorization', `Bearer ${authToken}`);
        expect(res.statusCode).toBe(200);
        expect(res.body.email).toBe('test@example.com');
      });
    });

    describe('Product Endpoints', () => {
      it('GET /api/products - should return all products', async () => {
        const res = await request(app).get('/api/products');
        expect(res.statusCode).toBe(200);
        expect(Array.isArray(res.body)).toBe(true);
        expect(res.body[0].name).toBe('Test Product');
      });

      it('GET /api/products/recommendations/weather - should return weather recommendations', async () => {
        const res = await request(app)
          .get('/api/products/recommendations/weather?lat=35&lon=139');
        expect(res.statusCode).toBe(200);
        expect(res.body).toHaveProperty('weather');
        expect(res.body).toHaveProperty('products');
      });
    });

    describe('Order Endpoints', () => {
      it('POST /api/orders - should create order', async () => {
        const res = await request(app)
          .post('/api/orders')
          .set('Authorization', `Bearer ${authToken}`)
          .send({
            products: [{
              productId: testProduct._id,
              quantity: 2
            }]
          });
        expect(res.statusCode).toBe(201);
        expect(res.body.totalAmount).toBe(200);
      });
    });

    describe('Category Endpoints', () => {
      it('GET /api/categories - should return all categories', async () => {
        const res = await request(app).get('/api/categories');
        expect(res.statusCode).toBe(200);
        expect(res.body[0].name).toBe('Test Category');
      });
    });
  });
});