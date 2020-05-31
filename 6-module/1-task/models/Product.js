const mongoose = require('mongoose');
const connection = require('../libs/connection');

const requiredString = {
  type: String,
  required: true,
};

const productSchema = new mongoose.Schema({
  title: requiredString,
  description: requiredString,
  price: {
    type: Number,
    required: true,
  },
  category: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Category',
    required: true,
  },
  subcategory: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
  },
  images: [String]
});

module.exports = connection.model('Product', productSchema);
