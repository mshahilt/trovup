const mongoose = require('mongoose');
const User = require('../models/userModel');
const Products = require('../models/productModel');
const Address = require('../models/addressModel');
const Cart = require('../models/cartModel');
const Order = require('../models/orderModel'); // Assuming you have an order model

exports.order_confirmPOST = async (req, res) => {
    try {
        const { addressId, cartId } = req.body;
        let {paymentMethod} = req.body;
        console.log('Order Confirmation Data:');
        console.log('Address ID:', addressId);
        console.log('Cart ID:', cartId);
        console.log('Payment Method:', paymentMethod);

        // Retrieve address and cart information
        const address = await Address.findById(addressId);
        if (!address) {
            return res.status(400).json({
                success: false,
                message: 'Invalid address ID'
            });
        }

        let cart = await Cart.findById(cartId).populate('items.product');
        console.log(cart);

        if (!cart) {
            return res.status(400).json({
                success: false,
                message: 'Invalid cart ID'
            });
        }

        if(paymentMethod === 'cod'){
            paymentMethod = 'Cash on Delivery'
        }
        // Create a new order with the retrieved data
        const order = new Order({
            user: req.session.user.user, // Assuming the user is authenticated and user ID is available in req.user
            address: addressId,
            cart: cartId,
            paymentMethod,
            items: cart.items,
            totalAmount: cart.total_price,
        });

        await order.save();

        // If order is successfully saved, return a success message
        return res.status(200).json({
            success: true,
            message: 'Order has been confirmed successfully!',
            orderId: order._id,
        });

    } catch (error) {
        console.error('Error occurred while confirming order:', error);

        // Respond with an error message
        return res.status(500).json({
            success: false,
            message: 'An unexpected error occurred. Please try again later.'
        });
    }
};


exports.order_historyGET = async (req, res) => {
    try {
      const userId = req.session.user.user;
  
      // Step 1: Fetch the order and populate the product field without variants
      const order_details = await Order.find({ user: userId }).populate('items.product');
  
      // Step 2: Manually filter variants for each item in the order
      const order_history = order_details.map(order => {
        order.items = order.items.map(item => {
          // Find the variant that matches the item.variantId
          const selectedVariant = item.product.variants.find(variant => variant._id.toString() === item.variantId.toString());
  
          // Replace the full variants array with only the matching variant
          if (selectedVariant) {
            item.product.variants = [selectedVariant];
          }
  
          return item;
        });
        return order;
      });

      const isUserLoggedIn = req.session.user;

      res.render('user/order_history',{order_history,title:'Order History',layout:'layouts/homeLayout',isUserLoggedIn});
    } catch (error) {
      console.log('Error occurred while loading order history page:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };