const mongoose = require('mongoose');
const User = require('../models/userModel');
const Products = require('../models/productModel');
const Address = require('../models/addressModel');
const Cart = require('../models/cartModel');
const Order = require('../models/orderModel');

const razorpay = require('../config/razorPay');

exports.order_confirmPOST = async (req, res) => {
  try {
      const { addressId, cartId } = req.body;
      let { paymentMethod } = req.body;
      console.log('Order Confirmation Data:');
      console.log('Address ID:', addressId);
      console.log('Cart ID:', cartId);
      console.log('Payment Method:', paymentMethod);

      // Fetch the address
      const address = await Address.findById(addressId);
      if (!address) {
          return res.status(400).json({
              success: false,
              message: 'Invalid address ID',
          });
      }

      // Fetch the cart and populate items
      let cart = await Cart.findById(cartId).populate('items.product');
      if (!cart) {
          return res.status(400).json({
              success: false,
              message: 'Invalid cart ID',
          });
      }

      // Handle payment method
      if (paymentMethod === 'cod') {
          paymentMethod = 'Cash on Delivery';
      }

      if (paymentMethod === 'razorpay') {
          
      }

      // Calculate the total amount dynamically
      let totalAmount = 0;
      const orderItems = [];

      for (let item of cart.items) {
          const product = await Products.findById(item.product._id);
          if (!product) {
              return res.status(400).json({
                  success: false,
                  message: 'Product not found',
              });
          }

          // Find the variant selected by the user
          let variant = product.variants.find(v => v._id.toString() === item.variantId.toString());
          if (variant) {
              console.log('Variant found:', variant);

              // Calculate the price for this item
              let itemPrice = variant.price * item.quantity;
              totalAmount += itemPrice;

              // Add the item details to the orderItems array
              orderItems.push({
                  product: item.product._id,
                  variantId: variant._id, // Store the variant ID
                  quantity: item.quantity,
                  price: variant.price // Store the price per unit
              });

              // Deduct the stock for the variant
              variant.stock -= item.quantity;
              if (variant.stock < 0) {
                  variant.stock = 0;
              }

              console.log('Updated variant stock:', variant.stock);
              await product.save();
          } else {
              return res.status(400).json({
                  success: false,
                  message: 'Variant not found',
              });
          }
      }

      // Create the new order with the dynamically calculated total amount
      const order = new Order({
          user: req.session.user.user, // Assuming req.session holds the logged-in user
          address: addressId,
          paymentMethod,
          items: orderItems, // Pass the items array with product, variantId, quantity, and price
          totalAmount: totalAmount, // Dynamically calculated total amount
      });

      await order.save();

      // Delete the cart after the order is confirmed
      await Cart.findByIdAndDelete(cartId);

      return res.status(200).json({
          success: true,
          message: 'Order has been confirmed successfully!',
          orderId: order._id,
          uniqueOrderId: order.orderId, // Shortened UUID
      });

  } catch (error) {
      console.error('Error occurred while confirming order:', error);

      return res.status(500).json({
          success: false,
          message: 'An unexpected error occurred. Please try again later.',
      });
  }
};

exports.order_historyGET = async (req, res) => {
  try {
    const userId = req.session.user.user;

    // Fetch orders for the logged-in user and populate product details
    const orders = await Order.find({ user: userId }).populate('items.product');

    // Iterate through each order and its items to find matching variant details
    const order_history = orders.map(order => {
      order.items = order.items.map(item => {
        // Find the variant that matches the variantId in the item
        const matchingVariant = item.product.variants.find(variant => variant._id.toString() === item.variantId.toString());

        // Append the variant details to the item if found
        if (matchingVariant) {
          item.variantDetails = {
            price: matchingVariant.price,
            storage_size: matchingVariant.storage_size,
            color: matchingVariant.color,
            images: matchingVariant.images,
          };
        }

        return item;
      });

      return order;
    });

    // Check if the user is logged in
    const isUserLoggedIn = req.session.user;

    // Render the order history page with filtered order data
    res.render('user/order_history', {
      order_history,
      title: 'Order History',
      layout: 'layouts/homeLayout',
      isUserLoggedIn
    });

  } catch (error) {
    console.log('Error occurred while loading order history page:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
};

  
  
exports.order_detailsGET = async (req, res) => {
  try {
      const order = await Order.findById(req.params.id)
          .populate('items.product')
          .populate('address');

      // Filtering the correct variant based on variantId in each item
      order.items.forEach(item => {
          item.variant = item.product.variants.find(variant => variant._id.toString() === item.variantId.toString());
      });

      const isUserLoggedIn = req.session.user;
      res.render('user/orderDetails', { order, title: 'Order Details', layout: 'layouts/homeLayout', isUserLoggedIn });
  } catch (error) {
      console.log('Error occurred while loading order details page:', error);
  }
};
