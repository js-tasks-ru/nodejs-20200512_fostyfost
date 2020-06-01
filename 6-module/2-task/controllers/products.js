const mongoose = require('mongoose')

const ProductModel = require('../models/Product')

const normalizeProduct = product => {
  return {
    id: product._id,
    title: product.title,
    description: product.description,
    price: product.price,
    category: product.category,
    subcategory: product.subcategory,
    images: product.images,
  }
}

const isValidObjectId = id => {
  return mongoose.Types.ObjectId.isValid(id) && (new mongoose.Types.ObjectId(id)).toString() === id
}

module.exports.productsBySubcategory = async (ctx, next) => {
  if (!ctx.query.subcategory) {
    return next()
  }

  if (isValidObjectId(ctx.query.subcategory)) {
    const products = await ProductModel.find({ subcategory: ctx.query.subcategory })

    ctx.body = {
      products: products.map(normalizeProduct)
    }
  } else {
    ctx.status = 400
  }
}

module.exports.productList = async ctx => {
  const products = await ProductModel.find()

  ctx.body = {
    products: products.map(normalizeProduct)
  }
}

module.exports.productById = async ctx => {
  if (!isValidObjectId(ctx.params.id)) {
    ctx.status = 400
    return;
  }

  const product = await ProductModel.findById(ctx.params.id)

  if (product) {
    ctx.body = {
      product: normalizeProduct(product),
    }
  } else {
    ctx.status = 404
  }
}

