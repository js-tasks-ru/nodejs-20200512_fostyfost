const CategoryModel = require('../models/Category')

const normalizeCategory = category => {
  return {
    id: category._id,
    title: category.title,
    subcategories: category.subcategories.map(subcategory => ({
      id: subcategory._id,
    })),
  }
}

module.exports.categoryList = async ctx => {
  const categories = await CategoryModel.find()

  ctx.body = {
    categories: categories.map(normalizeCategory)
  }
}
