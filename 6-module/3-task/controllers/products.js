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

module.exports.productsByQuery = async ctx => {
  const searchString = ctx.query?.query || ''

  const products = await ProductModel
    .find(
      { $text : { $search : searchString } },
      { score : { $meta: 'textScore' } }
    )
    .sort({ score : { $meta : 'textScore' } })

  ctx.body = {products: products.map(normalizeProduct) }
}
