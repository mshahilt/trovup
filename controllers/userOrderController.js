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

        // Validate the address
        const address = await Address.findById(addressId);
        if (!address) {
            return res.status(400).json({
                success: false,
                message: 'Invalid address ID',
            });
        }

        // Validate the cart and populate items
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

        // Calculate the total amount and prepare order items
        let totalAmount = 0;
        const orderItems = [];

        const productIds = cart.items.map(item => item.product._id);
        const products = await Products.find({ _id: { $in: productIds } });

        for (let item of cart.items) {
            const product = products.find(p => p._id.toString() === item.product._id.toString());
            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: 'Product not found',
                });
            }

            // Find the variant selected by the user
            let variant = product.variants.find(v => v._id.toString() === item.variantId.toString());
            if (variant) {
                let itemPrice = variant.discount_price * item.quantity; // Use the discount price
                totalAmount += itemPrice;

                orderItems.push({
                    product: item.product._id,
                    variantId: variant._id,
                    quantity: item.quantity,
                    price: variant.discount_price, // Save the discount price
                });

                // Update stock and save product
                variant.stock = Math.max(0, variant.stock - item.quantity);
                await product.save();
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Variant not found',
                });
            }
        }

        // Apply coupon logic
        let discountOnOrder = 0;
        const userId = req.session.user.user;

        const coupon = await Coupon.findOne({
            "users.userId": userId,
            "users.isBought": false
        });

        if (coupon) {
            const discountPercentage = coupon.discount;
            const discountAmount = (totalAmount * discountPercentage) / 100;
            discountOnOrder = Math.min(discountAmount, coupon.maximum_coupon_amount);
        }

        // Calculate the payable amount after discount
        const payableAmount = Math.max(0, totalAmount - discountOnOrder);

        // Adjust order items to include individual discounts
        for (let item of orderItems) {
            const itemTotal = item.price * item.quantity;
            const itemDiscount = (itemTotal / totalAmount) * discountOnOrder;
            item.discount = itemDiscount;
        }

        // Create the order
        const order = new Order({
            user: userId,
            address: addressId,
            items: orderItems,
            totalAmount: totalAmount,
            discountAmount: discountOnOrder,
            payableAmount,
            paymentMethod,
            paymentStatus: 'Pending', // Set the payment status for cash on delivery
            couponApplied: coupon ? coupon._id : null
        });

        await order.save();

        // Optionally, delete the cart after order confirmation
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

    const orders = await Order.find({ user: userId }).populate('items.product');

    const order_history = orders.map(order => {
      order.items = order.items.map(item => {

        const matchingVariant = item.product.variants.find(variant => variant._id.toString() === item.variantId.toString());

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

    const isUserLoggedIn = req.session.user;

    res.render('user/order_history', {
      order_history,
      title: 'Order History',
      layout: 'layouts/homeLayout',
      isUserLoggedIn
    });

    // res.json(order_history);
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

        order.items.forEach(item => {
            if (item.product && item.product.variants) {
                item.product.variants = item.product.variants.find(variant => 
                    variant._id.toString() === item.variantId.toString()
                );
                // Optionally log if no matching variant was found
                if (!item.product.variants) {
                    console.log(`No matching variant found for product ID: ${item.product._id}`);
                }
            }
        });
  
        const userId = req.session.user.user;
        const user = await User.findById(userId);
        const isUserLoggedIn = req.session.user;

        // res.json(order)
        res.render('user/orderDetails', { user, order, title: 'Order Details', layout: 'layouts/homeLayout', isUserLoggedIn });
    } catch (error) {
        console.log('Error occurred while loading order details page:', error);
        res.status(500).send('An error occurred while retrieving order details.');
    }
};

exports.create_razor_orderPOST = async (req, res) => {
    try {
        const { cartId, addressId } = req.body.orderData;
        const userId = req.session.user.user;

        if (!cartId || !addressId) {
            return res.status(400).json({ error: 'Missing cart or address information' });
        }

        const cart = await Cart.findById(cartId).populate('items.product');
        const address = await Address.findById(addressId);

        if (!cart) {
            return res.status(404).json({ error: 'Cart not found' });
        }
        if (!address) {
            return res.status(404).json({ error: 'Address not found' });
        }

        let totalAmount = 0;
        const orderItems = [];

        const productIds = cart.items.map(item => item.product._id);
        const products = await Products.find({ _id: { $in: productIds } });

        for (let item of cart.items) {
            const product = products.find(p => p._id.toString() === item.product._id.toString());
            if (!product) {
                return res.status(400).json({ error: 'Product not found' });
            }

            let variant = product.variants.find(v => v._id.toString() === item.variantId.toString());
            if (!variant) {
                return res.status(400).json({ error: 'Variant not found' });
            }

            totalAmount += variant.discount_price * item.quantity;

            orderItems.push({
                product: item.product._id,
                variantId: variant._id,
                quantity: item.quantity,
                price: variant.discount_price
            });

            variant.stock = Math.max(0, variant.stock - item.quantity);
            await product.save();
        }

        let discountOnOrder = 0;
        const coupon = await Coupon.findOne({
            "users.userId": userId,
            "users.isBought": false
        });

        if (coupon) {
            const discountPercentage = coupon.discount;
            const discountAmount = (totalAmount * discountPercentage) / 100;

            console.log(discountAmount,'insid coupon condition');
            discountOnOrder = Math.min(discountAmount, coupon.maximum_coupon_amount);
        }

        const payableAmount = Math.max(0, totalAmount - discountOnOrder);

        for (let item of orderItems) {
            const itemTotal = item.price * item.quantity;
            const itemDiscount = (itemTotal / totalAmount) * discountOnOrder;
            item.discount = itemDiscount;
        }

        const order = new Order({
            user: userId,
            address: addressId,
            items: orderItems,
            totalAmount: totalAmount,
            discountAmount: discountOnOrder,
            payableAmount,
            paymentMethod: 'Razorpay',
            razorpayOrderId: null,
            paymentStatus: 'Pending',
            cartId: cartId
        });

        console.log(payableAmount,'payable amount')

        const options = {
            amount:  Math.round(payableAmount * 100),
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
            console.log(error,'sdfho')
            return res.status(500).json({ status: false, message: "Razorpay order creation failed" });
        }

    } catch (error) {
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

exports.return_productPOST = async (req, res) => {
    try {
        const { orderId, itemId, reason, additionalReason } = req.body;
        const order = await Order.findOne({ orderId });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const item = order.items.find(item => item._id.toString() === itemId);

        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found in order' });
        }

        if (item.isReturnRequested) {
            return res.status(400).json({ success: false, message: 'Return request already submitted for this item' });
        }

        item.isReturnRequested = true;
        item.reasonOfReturn = reason;
        item.additionalReason = additionalReason;

        await order.save();

        res.status(200).json({ success: true, message: 'Return request submitted successfully' });
    } catch (error) {
        console.error('Error occurred while processing return product POST', error);
        res.status(500).json({ success: false, message: 'An error occurred while submitting your return request' });
    }
};

const Wallet = require('../models/walletModel'); 

exports.cancel_productPOST = async (req, res) => {
    try {
        const { orderId, itemId } = req.body;

        const order = await Order.findOne({ orderId });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const item = order.items.id(itemId);
        console.log(item, 'item founded')
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found in the order' });
        }


        if (item.orderStatus === 'Cancelled') {
            return res.status(400).json({ success: false, message: 'Item is already cancelled' });
        } else if (item.orderStatus === 'Delivered') {
            return res.status(400).json({ success: false, message: 'Delivered items cannot be cancelled' });
        }

        item.orderStatus = 'Cancelled';

        await order.save();

        if (order.paymentStatus === 'Paid') {
            const refundAmount = item.price - item.discount;

            // Find or create the user's wallet
            let wallet = await Wallet.findOne({ user: order.user });
            if (!wallet) {
                wallet = new Wallet({
                    user: order.user,
                    balance: 0,
                    wallet_history: []
                });
            }

            wallet.balance += refundAmount;

            wallet.wallet_history.push({
                date: new Date(),
                amount: refundAmount,
                description: `Refund for cancelled item (Order ID: ${order.orderId})`,
                transactionType: 'credited'
            });

            // Save the wallet
            await wallet.save();
        }

        res.status(200).json({ success: true, message: 'Item has been successfully cancelled' });
    } catch (error) {
        console.error('Error occurred while processing cancel product POST', error);
        res.status(500).json({ success: false, message: 'An error occurred while submitting your cancel request' });
    }
};
