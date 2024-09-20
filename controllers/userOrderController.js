const mongoose = require('mongoose');
const User = require('../models/userModel');
const Products = require('../models/productModel');
const Address = require('../models/addressModel');
const Cart = require('../models/cartModel');
const Order = require('../models/orderModel');
const razorpay = require('../config/razorPay');
const crypto = require('crypto');
const Coupon = require('../models/coupenModel');

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
  
             
                let itemPrice = variant.price * item.quantity;
                totalAmount += itemPrice;
  
                orderItems.push({
                    product: item.product._id,
                    variantId: variant._id,
                    quantity: item.quantity,
                    price: variant.price
                });
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
  
        const order = new Order({
            user: req.session.user.user,
            address: addressId,
            paymentMethod,
            items: orderItems,
            totalAmount: totalAmount
        });
  
        await order.save();

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
exports.create_razor_orderPOST = async (req, res) => {
    try {
        const { cartId, addressId } = req.body.orderData;
        const userId = req.session.user.user;

        // Validate input
        if (!cartId || !addressId) {
            return res.status(400).json({ error: 'Missing cart or address information' });
        }

        // Fetch cart and address details
        const cart = await Cart.findById(cartId).populate('items.product');
        const address = await Address.findById(addressId);

        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }
        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }

        // Calculate total amount and prepare order items
        let totalAmount = 0;
        const orderItems = [];

        const productIds = cart.items.map(item => item.product._id);
        const products = await Products.find({ _id: { $in: productIds } });

        for (let item of cart.items) {
            const product = products.find(p => p._id.toString() === item.product._id.toString());
            if (!product) {
                return res.status(400).json({ error: 'Product not found' });
            }

            // Find the matching variant
            let variant = product.variants.find(v => v._id.toString() === item.variantId.toString());
            if (!variant) {
                return res.status(400).json({ error: 'Variant not found' });
            }

            // Calculate total price for the current item
            totalAmount += variant.price * item.quantity;

            // Add item to orderItems array
            orderItems.push({
                product: item.product._id,
                variantId: variant._id,
                quantity: item.quantity,
                price: variant.price
            });

            // Update stock for the variant
            variant.stock = Math.max(0, variant.stock - item.quantity);
            await product.save();
        }

        // Fetch all coupons for debugging purposes
        let allCoupons = await Coupon.find({});
        console.log("Available Coupons:", allCoupons);

        // Check for applicable discount
        let discountOnOrder = 0;
        const coupon = await Coupon.findOne({
            "users.userId": userId, 
            "users.isBought": false
        });

        // Log coupon details if found
        if (coupon) {
            console.log("Coupon Found:", coupon);

            const discountPercentage = coupon.discount; // Discount percentage from the coupon
            const discountAmount = (totalAmount * discountPercentage) / 100; // Calculate discount amount

            // Apply the discount, ensuring it doesn't exceed the maximum coupon limit
            discountOnOrder = Math.min(discountAmount, coupon.maximum_coupon_amount);

            // Log discount calculations for debugging
            console.log("Discount Percentage:", discountPercentage);
            console.log("Calculated Discount Amount:", discountAmount);
            console.log("Discount on Order:", discountOnOrder);
        } else {
            console.log("No coupon found or coupon not applicable.");
        }

        // Calculate payable amount after applying discount
        const payableAmount = totalAmount - discountOnOrder;

        console.log(payableAmount, 'Payable Amount', totalAmount, 'Total Amount', discountOnOrder, 'Discount on Order');

        // Create the order object
        const order = new Order({
            user: userId,
            address: addressId,
            items: orderItems,
            totalAmount: totalAmount, // Original total amount
            discountAmount: discountOnOrder,
            payableAmount ,
            paymentMethod: 'Razorpay',
            razorpayOrderId: null,
            paymentStatus: 'Pending',
            cartId: cartId
        });

        const options = {
            amount: payableAmount * 100,  // Razorpay accepts the amount in paise, hence multiplying by 100
            currency: "INR",
            receipt: `receipt#${order._id}`,
            payment_capture: 1
        };

        try {
            const razorpayOrder = await razorpay.orders.create(options);
            order.razorpayOrderId = razorpayOrder.id;
            await order.save();

            return res.json({
                status: true,
                data: {
                    razorpayOrder,
                    totalAmount: totalAmount,
                    discountOnOrder: discountOnOrder,
                    payableAmount: payableAmount
                }
            });
        } catch (error) {
            console.error('Error creating Razorpay order:', error);
            return res.status(500).json({ status: false, message: "Razorpay order creation failed" });
        }

    } catch (error) {
        console.error('Error in create_razor_orderPOST:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};
exports.verify_razorpay_paymentPOST = async (req, res) => {
    try {
        const { payment_id, order_id, signature } = req.body;

        const body = `${order_id}|${payment_id}`;
        const crypto = require("crypto");
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZOR_PAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        console.log("Expected Signature:", expectedSignature);
        console.log("Actual Signature:", signature);
        if (expectedSignature === signature) {
            console.log('Successful payment');

            // Find and update the order's payment status
            const order = await Order.findOneAndUpdate(
                { razorpayOrderId: order_id },
                { paymentStatus: 'Paid' },
                { new: true }
            );

            if (!order) {
                return res.status(404).json({ error: "Order not found" });
            }

            // Delete the cart after successful payment
            await Cart.findByIdAndDelete(order.cartId);

            // Remove cartId from the order after cart is deleted
            order.cartId = undefined;
            await order.save();

            // Update the coupon's isBought field to true for this user
            const userId = order.user; // Assuming the user ID is in the order
            const coupon = await Coupon.findOneAndUpdate(
                { "users.user_Id": userId, "users.isBought": false },
                { $set: { "users.$.isBought": true } },
                { new: true }
            );

            if (coupon) {
                console.log('Coupon marked as used:', coupon);
            } else {
                console.log('No applicable coupon found for the user.');
            }

            console.log('Order updated and cart deleted:', order);
            return res.json({ status: true, message: "Payment verified, cart deleted", order });
        } else {
            console.log('Failed payment');
            return res.status(400).json({ status: false, message: "Payment verification failed" });
        }
    } catch (error) {
        console.error('Error in verify_razorpay_payment:', error);
        res.status(500).json({ error: 'Internal Server Error' });
    }
};

