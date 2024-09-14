const mongoose = require('mongoose');
const User = require('../models/userModel');
const Products = require('../models/productModel');
const Address = require('../models/addressModel');
const Cart = require('../models/cartModel');
const Order = require('../models/orderModel');

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
              message: 'Invalid address ID'
          });
      }

      // Fetch the cart and populate items
      let cart = await Cart.findById(cartId).populate('items.product');
      if (!cart) {
          return res.status(400).json({
              success: false,
              message: 'Invalid cart ID'
          });
      }

      // Handle payment method
      if (paymentMethod === 'cod') {
          paymentMethod = 'Cash on Delivery';
      }

      // Create the new order
      const order = new Order({
          user: req.session.user.user,
          address: addressId,
          paymentMethod,
          items: cart.items,
          totalAmount: cart.total_price,
      });


      await order.save();

      for (let item of cart.items) {
          const product = await Products.findById(item.product._id);

          let variant = product.variants.find(v => v._id.toString() === item.variantId.toString());
          if (variant) {
            console.log('varian found', variant)
              variant.stock -= item.quantity;

              console.log('variant stock', variant.stock)
              if (variant.stock < 0) {
                  variant.stock = 0;
              }

              await product.save();
          }
      }

      await Cart.findByIdAndDelete(cartId);

      return res.status(200).json({
          success: true,
          message: 'Order has been confirmed successfully!',
          orderId: order._id,
          uniqueOrderId: order.orderId, 
      });

  } catch (error) {
      console.error('Error occurred while confirming order:', error);

      return res.status(500).json({
          success: false,
          message: 'An unexpected error occurred. Please try again later.'
      });
  }
};


exports.order_historyGET = async (req, res) => {
    try {
      const userId = req.session.user.user;

      const orders = await Order.find({ user: userId }).populate('items.product');
    //   res.json(orders)

      const order_history = orders.map(order => {
        order.items = order.items.map(item => {
          const product = item.product;
          const specificVariant = product.variants.find(variant => variant._id.toString() === item.variantId.toString());
  
          return {
            ...item,
            product: {
              ...product._doc,
              variants: specificVariant 
            }
          };
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
  
  
  exports.order_detailsGET = async (req, res) => {
    try{
        console.log('order in details page worked')
        const order = await Order.findById(req.params.id).populate('items.product').populate('address');
        const isUserLoggedIn = req.session.user;
        res.render('user/orderDetails',{order,title:'Order Details',layout:'layouts/homeLayout',isUserLoggedIn});
    }catch(error){
        console.log('error occured while loading order details page',error)
    }
  }