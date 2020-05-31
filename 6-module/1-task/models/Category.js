const mongoose = require('mongoose');
const connection = require('../libs/connection');

const requiredTitle = {
  title: {
    type: String,
    required: true,
  },
}

const subCategorySchema = new mongoose.Schema({
  ...requiredTitle,
});

const categorySchema = new mongoose.Schema({
  ...requiredTitle,
  subcategories: [subCategorySchema],
});

module.exports = connection.model('Category', categorySchema);
