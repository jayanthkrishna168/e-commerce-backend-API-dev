const mongoose = require('mongoose');

const productSchema = new mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  price: { type: Number, required: true },
  categories: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Category' }],
  inventory: { type: Number, default: 0 },
  weatherTags: [{ type: String }] // e.g., ["rainy", "cold"]
});

module.exports = mongoose.model('Product', productSchema);