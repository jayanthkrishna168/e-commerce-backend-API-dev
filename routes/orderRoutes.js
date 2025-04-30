const express = require('express');
const Order = require('../models/Order');
const auth = require('../middleware/auth');
const router = express.Router();

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Create a new order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Order'
 *     responses:
 *       201:
 *         description: Order created
 *       400:
 *         description: Bad request
 */
router.post('/', auth, async (req, res) => {
    try {
      const order = new Order({
        ...req.body,
        userId: req.user.id
      });
      await order.save();
      res.status(201).send(order);
    } catch (err) {
      res.status(400).send(err);
    }
  });
  
  /**
   * @swagger
   * /api/orders/me:
   *   get:
   *     summary: Get current user's orders
   *     tags: [Orders]
   *     security:
   *       - bearerAuth: []
   *     responses:
   *       200:
   *         description: List of orders
   *         content:
   *           application/json:
   *             schema:
   *               type: array
   *               items:
   *                 $ref: '#/components/schemas/Order'
   */
  router.get('/me', auth, async (req, res) => {
    try {
      const orders = await Order.find({ userId: req.user.id }).populate('products.productId');
      res.send(orders);
    } catch (err) {
      res.status(500).send();
    }
  });
  
  module.exports = router;