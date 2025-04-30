const express = require('express');
const Product = require('../models/Product');
const router = express.Router();
const auth = require('../middleware/auth')
const axios = require('axios');
/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management
 */

/**
 * @swagger
 * /api/products:
 *   get:
 *     summary: Get all products
 *     tags: [Products]
 *     responses:
 *       200:
 *         description: List of products
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Product'
 */
router.get('/', async (req, res) => {
    const products = await Product.find().populate('categories');
    res.send(products);
  });
  
  /**
   * @swagger
   * /api/products/{id}:
   *   get:
   *     summary: Get a product by ID
   *     tags: [Products]
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *     responses:
   *       200:
   *         description: Product details
   *         content:
   *           application/json:
   *             schema:
   *               $ref: '#/components/schemas/Product'
   *       404:
   *         description: Product not found
   */
  router.get('/:id', async (req, res) => {
    try {
      const product = await Product.findById(req.params.id).populate('categories');
      if (!product) return res.status(404).send();
      res.send(product);
    } catch (err) {
      res.status(500).send();
    }
  });
  
  // Integrated weather recommendations endpoint
/**
 * @swagger
 * /api/products/recommendations/weather:
 *   get:
 *     summary: Get weather-based product recommendations
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: lat
 *         schema:
 *           type: number
 *         required: true
 *         description: Latitude coordinate
 *       - in: query
 *         name: lon
 *         schema:
 *           type: number
 *         required: true
 *         description: Longitude coordinate
 *     responses:
 *       200:
 *         description: Returns weather data and product recommendations
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 weather:
 *                   type: object
 *                   properties:
 *                     condition:
 *                       type: string
 *                     temperature:
 *                       type: number
 *                     description:
 *                       type: string
 *                 dbProducts:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Product'
 *                 externalProducts:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       id:
 *                         type: string
 *                       name:
 *                         type: string
 *                       price:
 *                         type: number
 *                       source:
 *                         type: string
 *                       link:
 *                         type: string
 */
router.get('/recommendations/weather', async (req, res) => {
  try {
    const { lat, lon } = req.query;
    
    if (!lat || !lon) {
      return res.status(400).json({ 
        success: false,
        message: 'Latitude and longitude are required' 
      });
    }

    // Verify OpenWeather API key is set
    if (!process.env.OPENWEATHER_API_KEY) {
      return res.status(500).json({
        success: false,
        message: 'Weather service configuration error'
      });
    }

    const weatherResponse = await axios.get(
      `https://api.openweathermap.org/data/2.5/weather?lat=${lat}&lon=${lon}&appid=${process.env.OPENWEATHER_API_KEY}&units=metric`
    );
    
    const weatherCondition = weatherResponse.data.weather[0].main.toLowerCase();
    const dbProducts = await Product.find({ weatherTags: weatherCondition });

    res.json({
      success: true,
      weather: {
        condition: weatherCondition,
        temp: weatherResponse.data.main.temp,
        description: weatherResponse.data.weather[0].description
      },
      products: dbProducts,
      externalProducts: getExternalRecommendations(weatherCondition) // Helper function
    });

  } catch (error) {
    console.error('Weather API error:', error.response?.data || error.message);
    res.status(500).json({
      success: false,
      message: 'Failed to get weather data',
      details: error.response?.data?.message || error.message
    });
  }
});

// Helper function for external products
function getExternalRecommendations(weather) {
  const recommendations = {
    rainy: [
      {
        id: 'ext-umbrella',
        name: 'Premium Umbrella',
        price: 29.99,
        source: 'RainyDays.com',
        link: 'https://rainydays.com/umbrellas'
      }
    ],
    sunny: [
      {
        id: 'ext-sunscreen',
        name: 'SPF 50 Sunscreen',
        price: 15.99,
        source: 'SunSafe.com',
        link: 'https://sunsafe.com/spf50'
      }
    ]
  };
  return recommendations[weather] || [];
}

  /**
   * @swagger
   * /api/products:
   *   post:
   *     summary: Create a new product
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Product'
   *     responses:
   *       201:
   *         description: Product created
   *       400:
   *         description: Bad request
   */
  router.post('/', auth, async (req, res) => {
    try {
      const product = new Product(req.body);
      await product.save();
      res.status(201).send(product);
    } catch (err) {
      res.status(400).send(err);
    }
  });
  
  /**
   * @swagger
   * /api/products/{id}:
   *   patch:
   *     summary: Update a product
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             $ref: '#/components/schemas/Product'
   *     responses:
   *       200:
   *         description: Updated product
   *       404:
   *         description: Product not found
   */
  router.patch('/:id', auth, async (req, res) => {
    try {
      const product = await Product.findByIdAndUpdate(req.params.id, req.body, { new: true });
      if (!product) return res.status(404).send();
      res.send(product);
    } catch (err) {
      res.status(400).send(err);
    }
  });
  
  /**
   * @swagger
   * /api/products/{id}:
   *   delete:
   *     summary: Delete a product
   *     tags: [Products]
   *     security:
   *       - bearerAuth: []
   *     parameters:
   *       - in: path
   *         name: id
   *         schema:
   *           type: string
   *         required: true
   *     responses:
   *       200:
   *         description: Product deleted
   *       404:
   *         description: Product not found
   */
  router.delete('/:id', auth, async (req, res) => {
    try {
      const product = await Product.findByIdAndDelete(req.params.id);
      if (!product) return res.status(404).send();
      res.send(product);
    } catch (err) {
      res.status(500).send();
    }
  });
  
  module.exports = router;