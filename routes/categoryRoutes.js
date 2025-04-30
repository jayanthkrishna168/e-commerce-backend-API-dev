const express = require('express');
const Category = require('../models/Category');
const router = express.Router();
const auth = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Categories
 *   description: Category management
 */

/**
 * @swagger
 * /api/categories:
 *   get:
 *     summary: Get all categories
 *     tags: [Categories]
 *     responses:
 *       200:
 *         description: List of categories
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   description:
 *                     type: string
 */
router.get('/', async (req, res) => {
    try {
      const categories = await Category.find();
      res.send(categories);
    } catch (err) {
      res.status(500).send();
    }
  });
  
  /**
   * @swagger
   * /api/categories:
   *   post:
   *     summary: Create a new category
   *     tags: [Categories]
   *     security:
   *       - bearerAuth: []
   *     requestBody:
   *       required: true
   *       content:
   *         application/json:
   *           schema:
   *             type: object
   *             properties:
   *               name:
   *                 type: string
   *               description:
   *                 type: string
   *     responses:
   *       201:
   *         description: Category created
   *       400:
   *         description: Bad request
   */
  router.post('/', auth, async (req, res) => {
    try {
      const category = new Category(req.body);
      await category.save();
      res.status(201).send(category);
    } catch (err) {
      res.status(400).send(err);
    }
  });
  
  module.exports = router;
  