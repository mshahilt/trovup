const Product = require('../models/productModel');

async function restoreStock(item) {
  try {
    const product = await Product.findById(item.product);
    if (!product) {
      console.error(`Product not found for item ${item.product}`);
      return false;
    }

    const variant = product.variants.id(item.variantId);
    if (!variant) {
      console.error(`Variant not found for product ${item.product}`);
      return false;
    }

    variant.stock += item.quantity;
    await product.save();

    return true;
  } catch (error) {
    console.error("Error in restoreStock:", error);
    return false;
  }
}

module.exports = restoreStock;