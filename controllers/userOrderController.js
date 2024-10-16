const mongoose = require('mongoose');
const User = require('../models/userModel');
const Products = require('../models/productModel');
const Address = require('../models/addressModel');
const Cart = require('../models/cartModel');
const Order = require('../models/orderModel');
const razorpay = require('../config/razorPay');
const crypto = require('crypto');
const Coupon = require('../models/coupenModel');
const generateUniqueOrderId = require('../config/generateUniqueId');
const PDFDocument = require('pdfkit');
const path = require('path')
const fs = require('fs');

exports.order_confirmPOST = async (req, res) => {
    try {
        const { addressId, cartId } = req.body;
        let { paymentMethod } = req.body;
        let deliveryCharge = 0;
        // Validate address
        const address = await Address.findById(addressId);
        if (!address) {
            return res.status(400).json({
                success: false,
                message: 'Invalid address ID',
            });
        }

        // Fetch the cart and populate items with products
        let cart = await Cart.findById(cartId).populate('items.product');
        if (!cart) {
            return res.status(400).json({
                success: false,
                message: 'Invalid cart ID',
            });
        }

        // Convert payment method for COD
        if (paymentMethod === 'cod') {
            paymentMethod = 'Cash on Delivery';
        }

        let totalAmount = 0;
        const orderItems = [];

        // Get products from cart
        const productIds = cart.items.map(item => item.product._id);
        const products = await Products.find({ _id: { $in: productIds } });


        for (const product of products) {
            if (product.isDelete) {
                return res.status(400).json({
                    success: false,
                    message: 'Product not found',
                });
            }
        }

        for (let item of cart.items) {
            const product = products.find(p => p._id.toString() === item.product._id.toString());
            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: 'Product not found',
                });
            }

            let variant = product.variants.find(v => v._id.toString() === item.variantId.toString());
            if (variant) {
                let itemPrice = variant.discount_price || variant.price * item.quantity; 
                totalAmount += itemPrice;

                orderItems.push({
                    product: item.product._id,
                    variantId: variant._id,
                    quantity: item.quantity,
                    price: variant.discount_price || variant.price,
                });

                variant.stock = Math.max(0, variant.stock - item.quantity);
                await product.save();
            } else {
                return res.status(400).json({
                    success: false,
                    message: 'Variant not found',
                });
            }
        }

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

        const payableAmount = Math.max(0, totalAmount - discountOnOrder);

        for (let item of orderItems) {
            const itemTotal = item.price * item.quantity;
            const itemDiscount = (itemTotal / totalAmount) * discountOnOrder;
            item.discount = itemDiscount;
        }
        if(totalAmount < 3000){
            deliveryCharge = 50
        }
        if(totalAmount > 3000){
            return res.status(400).json({success: false, message: 'Orders above Rs 3000 are not allowed for Cash On Delivery',})
        }
        const orderId = await generateUniqueOrderId();

        const order = new Order({
            orderId,
            user: userId,
            address: addressId,
            items: orderItems,
            totalAmount,
            discountAmount: discountOnOrder,
            payableAmount,
            paymentMethod,
            deliveryCharge,
            paymentStatus: 'Pending',
            couponApplied: coupon ? coupon._id : null
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

    const order_history = await Order.find({ user: userId }).populate('items.product').sort({createdAt: -1})
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

        order.items = order.items.map(item => {
            const product = item.product;
            if (item.product && item.product.variants) {
                const specificVariant = item.product.variants.find(
                    (variant) => variant._id.toString() === item.variantId.toString()
                );

                if (!specificVariant) {
                    console.log(`No matching variant found for product ID: ${item.product._id}`);
                }

                return {
                    ...item,
                    product: {
                        ...product._doc,
                        variants: specificVariant,
                    }
                    
                };
            }
            return item;
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

        let deliveryCharge = 0;
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

        // Check if all products exist and are not deleted
        for (const product of products) {
            if (product.isDelete) {
                return res.status(400).json({
                    success: false,
                    message: 'Product not found',
                });
            }
        }

        // Loop through cart items to calculate total and check stock
        for (let item of cart.items) {
            const product = products.find(p => p._id.toString() === item.product._id.toString());
            if (!product) {
                return res.status(400).json({ error: 'Product not found' });
            }

            let variant = product.variants.find(v => v._id.toString() === item.variantId.toString());
            if (!variant) {
                return res.status(400).json({ error: 'Variant not found' });
            }

            // Check if the variant has sufficient stock
            if (variant.stock < item.quantity) {
                return res.status(400).json({
                    success: false,
                    message: `Insufficient stock for product ${product.product_name}, variant ${variant.name}. Available stock: ${variant.stock}`
                });
            }

            // Calculate price and total
            const variantPrice = variant.discount_price || variant.price;
            totalAmount += variantPrice * item.quantity;

            orderItems.push({
                product: item.product._id,
                variantId: variant._id,
                quantity: item.quantity,
                price: variantPrice
            });
        }

        let discountOnOrder = 0;
        const coupon = await Coupon.findOne({
            "users.userId": userId,
            "users.isBought": false
        });

        if (coupon) {
            const discountPercentage = coupon.discount;
            const discountAmount = (totalAmount * discountPercentage) / 100;
            discountOnOrder = Math.min(discountAmount, coupon.maximum_coupon_amount);
        }

        const payableAmount = Math.max(0, totalAmount - discountOnOrder);

        if (totalAmount < 3000) {
            deliveryCharge = 50;
        }

        const options = {
            amount: Math.round((payableAmount + deliveryCharge) * 100),
            currency: "INR",
            receipt: `receipt#${cartId}`,
            payment_capture: 1
        };

        try {
            const razorpayOrder = await razorpay.orders.create(options);

            return res.json({
                status: true,
                data: {
                    razorpayOrder,
                    totalAmount,
                    discountOnOrder,
                    payableAmount
                }
            });
        } catch (error) {
            console.log(error, 'Error creating Razorpay order');
            return res.status(500).json({ status: false, message: "Razorpay order creation failed" });
        }

    } catch (error) {
        console.error('Error:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};


exports.verify_razorpay_paymentPOST = async (req, res) => {
    try {
        const { payment_id, order_id, signature } = req.body;
    
        const { cartId, addressId } = req.body.orderData;
        let deliveryCharge = 0;
        const body = `${order_id}|${payment_id}`;
        const crypto = require("crypto");
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZOR_PAY_KEY_SECRET)
            .update(body)
            .digest('hex');

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
        for (const product of products) {
            if (product.isDelete) {
                return res.status(400).json({
                    success: false,
                    message: 'Product not found',
                });
            }
        }
        for (let item of cart.items) {
            const product = products.find(p => p._id.toString() === item.product._id.toString());
            if (!product) {
                return res.status(400).json({ error: 'Product not found' });
            }

            let variant = product.variants.find(v => v._id.toString() === item.variantId.toString());
            if (!variant) {
                return res.status(400).json({ error: 'Variant not found' });
            }

            const variantPrice = variant.discount_price || variant.price;
            totalAmount += variantPrice * item.quantity;

            variant.stock = Math.max(0, variant.stock - item.quantity);
            await product.save();

            orderItems.push({
                product: item.product._id,
                variantId: variant._id,
                quantity: item.quantity,
                price: variantPrice
            });
        }

        // Handle discount coupon
        let discountOnOrder = 0;
        const coupon = await Coupon.findOne({
            "users.userId": cart.user,
            "users.isBought": false
        });

        if (coupon) {
            const discountPercentage = coupon.discount;
            const discountAmount = (totalAmount * discountPercentage) / 100;
            discountOnOrder = Math.min(discountAmount, coupon.maximum_coupon_amount);

            await Coupon.findOneAndUpdate(
                { "users.userId": cart.user, "users.isBought": false },
                { $set: { "users.$.isBought": true } },
                { new: true }
            );
        }

        const payableAmount = Math.max(0, totalAmount - discountOnOrder);

        // Calculate individual item discount
        for (let item of orderItems) {
            const itemTotal = item.price * item.quantity;
            const itemDiscount = (itemTotal / totalAmount) * discountOnOrder;
            item.discount = itemDiscount;
        }

        if(totalAmount < 3000){
            deliveryCharge = 50;
        }
        const generatedOrderId = await generateUniqueOrderId();
        const order = new Order({
            orderId: generatedOrderId,
            user: cart.user,
            address: addressId,
            items: orderItems,
            totalAmount,
            discountAmount: discountOnOrder,
            payableAmount,
            deliveryCharge,
            paymentMethod: 'Razorpay',
            razorpayOrderId: order_id,
            paymentStatus: 'Pending', // Set to pending initially
            cartId: cart._id
        });

        await order.save();

        if (!signature || !payment_id) {
            order.paymentStatus = 'Failed';
            await order.save();

            const responseUrl = `/order/order-details/${order._id}`;

            await Cart.findByIdAndDelete(cart._id);

            return res.json({
                status: false,
                message: "Payment failed or canceled, order created but payment incomplete",
                order,
                response: responseUrl
            });
        }

        if (expectedSignature === signature) {

            order.paymentStatus = 'Paid';
            await order.save();


            await Cart.findByIdAndDelete(cart._id);

            return res.json({
                status: true,
                message: "Payment verified, order created",
                order
            });
        } else {
            order.paymentStatus = 'Failed';
            await order.save();

            const responseUrl = `/order/order-details/${order._id}`;

            await Cart.findByIdAndDelete(cart._id);

            return res.json({
                status: false,
                message: "Payment verification failed, order created but payment incomplete",
                order,
                response: responseUrl
            });
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
        const refundAmount = (item.price * item.quantity) - item.discount ;
  
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
  
        await wallet.save();
      }
  
      // Handle inventory management for the canceled item
      const product = await Products.findById(item.product);
      if (product) {
        const variant = product.variants.id(item.variantId);
        if (variant) {
          variant.stock += item.quantity;
          await product.save();
        }
      }
  
      res.status(200).json({ success: true, message: 'Item has been successfully cancelled' });
    } catch (error) {
      console.error('Error occurred while processing cancel product POST', error);
      res.status(500).json({ success: false, message: 'An error occurred while submitting your cancel request' });
    }
  };
exports.download_invoicePOST = async (req, res) => {
try {
    const { orderId } = req.body;

    // Find the order and populate necessary fields
    const order = await Order.findOne({ orderId }).populate('address items.product');

    if (!order) {
    return res.status(404).json({ success: false, message: 'Order not found' });
    }

    const address = order.address;
    const items = order.items;

    const doc = new PDFDocument({ size: 'A4', margin: 40 });

    res.setHeader('Content-Disposition', `attachment; filename=invoice_${orderId}.pdf`);

    doc.pipe(res);

    // Header Section: Title and Branding
    doc.fontSize(16).text('Trovup', { align: 'center' });
    doc.fontSize(8).text('Your trusted partner in quality.', { align: 'center' });
    doc.moveDown(1);
    doc.fontSize(14).text('Invoice', { align: 'center' });
    doc.moveDown(2);

    // Order Information
    doc.fontSize(10).text(`Order ID: ${order.orderId}`);
    doc.text(`Payment Status: ${order.paymentStatus}`);
    doc.text(`Payment Method: ${order.paymentMethod}`);
    doc.moveDown(1);

    // Shipping Address Section
    doc.fontSize(12).text('Shipping Address', { underline: true });
    doc.fontSize(10).text(`${address.fullName}`);
    doc.text(`${address.streetAddress}, ${address.city}`);
    doc.text(`Phone: ${address.phoneNumber}`);
    doc.text(`Email: ${address.emailAddress}`);
    doc.moveDown(1);

    // Draw a line for separation
    doc.moveTo(40, doc.y).lineTo(550, doc.y).stroke();
    doc.moveDown(1);

    // Order Details Table
    doc.fontSize(12).text('Order Details', { underline: true });
    doc.moveDown(0.5);

    // Table Header
    const drawTableHeaders = (headers, y) => {
    doc.font('Helvetica-Bold').fontSize(10);
    let x = doc.page.margins.left;

    headers.forEach(header => {
        doc.text(header.text, x + 5, y + 5, { width: header.width, align: header.align || 'left' });
        doc.rect(x, y, header.width, 20).stroke();
        x += header.width;
    });
    };

    // Table Row
    const drawTableRow = (row, y) => {
    doc.font('Helvetica').fontSize(9);
    let x = doc.page.margins.left;

    row.forEach(cell => {
        doc.text(cell.text, x + 5, y + 5, { width: cell.width, align: cell.align || 'left' });
        doc.rect(x, y, cell.width, 20).stroke();
        x += cell.width;
    });
    };

    const headers = [
    { text: 'Product Name', width: 140 },
    { text: 'Variant Details', width: 140 },
    { text: 'Quantity', width: 60, align: 'left' },
    { text: 'Price', width: 60, align: 'left' },
    { text: 'Discount', width: 60, align: 'left' },
    { text: 'Total', width: 70, align: 'left' }
    ];

    drawTableHeaders(headers, doc.y);
    let y = doc.y + 20;

    let totalAmount = 0;
    let totalDiscount = 0;

    // Table Rows for Each Item
    items.forEach(item => {
    const product = item.product;
    const variant = product.variants.find(v => v._id.toString() === item.variantId);
    const itemTotal = (item.price * item.quantity)- item.discount;

    totalAmount += itemTotal;
    totalDiscount += item.discount;

    const itemRow = [
        { text: product.product_name, width: 140 },
        { text: `Color: ${variant.color}, Storage: ${variant.storage_size}`, width: 140 },
        { text: item.quantity.toString(), width: 60, align: 'left' },
        { text: item.price.toFixed(2), width: 60, align: 'left' },
        { text: item.discount.toFixed(2), width: 60, align: 'left' },
        { text: itemTotal.toFixed(2), width: 70, align: 'left' }
    ];
    drawTableRow(itemRow, y);
    y += 20;

    // Add page if content exceeds the page height
    if (y > doc.page.height - doc.page.margins.bottom - 100) {
        doc.addPage();
        y = doc.page.margins.top;
        drawTableHeaders(headers, y);
        y += 20;
    }
    });

    // Add Delivery Charge and Total Payable Amount
    const deliveryCharge = order.deliveryCharge || 0;
    const payableAmount = totalAmount + deliveryCharge;

    // Align total section properly with the table
    doc.moveDown(1.5);
    doc.fontSize(10);
    const totalSectionX = doc.page.width - doc.page.margins.right - 200; // Adjust the X position for the total section

    doc.text(`Total Amount: ${totalAmount.toFixed(2)}`, totalSectionX, y + 20, { align: 'right' });
    doc.text(`Total Discount: ${totalDiscount.toFixed(2)}`, totalSectionX, y + 40, { align: 'right' });
    doc.text(`Delivery Charge: ${deliveryCharge.toFixed(2)}`, totalSectionX, y + 60, { align: 'right' });
    doc.text(`Payable Amount: ${payableAmount.toFixed(2)}`, totalSectionX, y + 80, { align: 'right' });

    // Footer Section: Branding
    doc.moveDown(3);
    doc.fontSize(8).text('Thank you for your purchase!', { align: 'center' });
    doc.text('Trovup - Your trusted partner in quality.', { align: 'center' });

    // Finalize the PDF
    doc.end();

} catch (error) {
    console.error('Error occurred while generating invoice:', error);
    res.status(500).json({ success: false, message: 'Server error occurred' });
}
};
    

exports.repayment_razorpayPOST = async (req, res) => {
    try {
        const { orderId } = req.body;
        const order = await Order.findOne({ _id: orderId });

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const payment_capture = 1; 
        const amount = order.payableAmount * 100; 
        const currency = 'INR';

        const options = {
            amount,
            currency,
            receipt: `receipt_${orderId}`,
            payment_capture
        };

        const response = await razorpay.orders.create(options);

        res.status(200).json({
            success: true,
            orderId: response.id,
            amount: response.amount,
            currency: response.currency,
            key: process.env.RAZOR_PAY_KEY_ID,
            name: 'Trovup', 
            description: 'Repayment for Order',
            orderReceipt: orderId 
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error occurred' });
    }
};

exports.verifyRepaymentPOST = async (req, res) => {
    try {
        const { razorpay_payment_id, razorpay_order_id, razorpay_signature, orderId } = req.body;

        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZOR_PAY_KEY_SECRET)
            .update(body.toString())
            .digest('hex');

        if (expectedSignature === razorpay_signature) {

            const order = await Order.findById(orderId);
            order.paymentStatus = 'Paid';
            order.razorpayOrderId = razorpay_order_id;
            await order.save();

            res.status(200).json({ success: true, message: 'Payment successful' });
        } else {
            res.status(400).json({ success: false, message: 'Invalid signature' });
        }


    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: 'Server error' });
    }
}

// pay_with_walletPOST: Handles wallet and Razorpay payments
exports.pay_with_walletPOST = async (req, res) => {
    try {
        const { cartId, addressId } = req.body.orderData;
        const userId = req.session.user.user;
        let deliveryCharge = 0;
        if (!cartId || !addressId) {
            return res.status(400).json({ error: 'Missing cart or address information' });
        }

        const cart = await Cart.findById(cartId).populate('items.product');
        const address = await Address.findById(addressId);
        const wallet = await Wallet.findOne({ user: userId });

        if (!cart) return res.status(404).json({ error: 'Cart not found' });
        if (!address) return res.status(404).json({ error: 'Address not found' });
        if (!wallet) return res.status(400).json({ error: 'Wallet not found for user' });

        let totalAmount = 0;
        const orderItems = [];

        const productIds = cart.items.map(item => item.product._id);
        const products = await Products.find({ _id: { $in: productIds } });

        for (let item of cart.items) {
            const product = products.find(p => p._id.toString() === item.product._id.toString());
            if (!product) return res.status(400).json({ error: 'Product not found' });

            const variant = product.variants.find(v => v._id.toString() === item.variantId.toString());
            if (!variant) return res.status(400).json({ error: 'Variant not found' });

            const variantPrice = variant.discount_price || variant.price;
            totalAmount += variantPrice * item.quantity;

            orderItems.push({
                product: item.product._id,
                variantId: variant._id,
                quantity: item.quantity,
                price: variantPrice
            });
        }


        let discountOnOrder = 0;
        const coupon = await Coupon.findOne({
            "users.userId": cart.user,
            "users.isBought": false
        });

        if (coupon) {
            const discountPercentage = coupon.discount;
            const discountAmount = (totalAmount * discountPercentage) / 100;
            discountOnOrder = Math.min(discountAmount, coupon.maximum_coupon_amount);

            await Coupon.findOneAndUpdate(
                { "users.userId": cart.user, "users.isBought": false },
                { $set: { "users.$.isBought": true } },
                { new: true }
            );
        }
        

        // Adjust total amount after applying the discount
        const discountedTotalAmount = totalAmount - discountOnOrder;

        for (let item of orderItems) {
            const itemTotal = item.price * item.quantity;
            const itemDiscount = (itemTotal / totalAmount) * discountOnOrder;
            item.discount = itemDiscount;
        }
        // Apply wallet balance
        const walletBalance = wallet.balance || 0;
        let walletUsedAmount = Math.min(walletBalance, discountedTotalAmount);
        let payableAmount = discountedTotalAmount - walletUsedAmount;

        if (payableAmount <= 0) {
            const generatedOrderId = await generateUniqueOrderId();

            // Create and save the order in the database
            const newOrder = new Order({
                orderId: generatedOrderId,
                user: userId,
                cartId,
                address: addressId,
                items: orderItems,
                totalAmount,
                discountAmount: discountOnOrder,
                payableAmount: 0,
                walletUsedAmount,
                paymentMethod: 'Wallet',
                paymentStatus: 'Paid',
                placedAt: new Date()
            });

            await newOrder.save();

            // Deduct the wallet balance and save the wallet
            wallet.balance -= walletUsedAmount;
            wallet.wallet_history.push({
                date: new Date(),
                amount: walletUsedAmount,
                description: 'Order payment using wallet',
                transactionType: 'debited'
            });
            await wallet.save();

            // Delete the cart
            await Cart.findByIdAndDelete(cartId);

            return res.json({
                status: true,
                message: "Fully paid using wallet and order saved successfully.",
                orderData: {
                    orderId: generatedOrderId,
                    user: userId,
                    cartId,
                    addressId,
                    items: orderItems,
                    totalAmount,
                    discountAmount: discountOnOrder,
                    payableAmount: 0,
                    walletUsedAmount,
                    paymentMethod: 'Wallet'
                }
            });
        }

        // Razorpay order creation for remaining payable amount
        if(totalAmount < 3000){
            deliveryCharge = 50;
        }
        const options = {
            amount: Math.round((payableAmount + deliveryCharge) * 100),
            currency: "INR",
            receipt: `receipt#${cartId}`,
            payment_capture: 1
        };

        const razorpayOrder = await razorpay.orders.create(options);

        return res.json({
            status: true,
            message: "Proceed with Razorpay for remaining payment",
            data: {
                razorpayOrder,
                totalAmount,
                discountAmount: discountOnOrder,
                walletUsedAmount,
                payableAmount
            },
            orderData: {
                user: userId,
                cartId,
                addressId,
                items: orderItems,
                totalAmount,
                discountAmount: discountOnOrder,
                payableAmount,
                walletUsedAmount
            }
        });
    } catch (error) {
        console.error('Error in pay_with_walletPOST:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};

// verifyWalletPaymentPOST: Verifies Razorpay payment and processes order
exports.verifyWalletPaymentPOST = async (req, res) => {
    try {
        const { paymentId, orderId, signature } = req.body;
        const { addressId, cartId } = req.body.orderData;

        if (!paymentId || !orderId || !signature || !addressId || !cartId) {
            return res.status(400).json({ error: 'Missing payment or order information' });
        }
        let deliveryCharge = 0;

        // Verify payment signature
        const generatedSignature = crypto.createHmac('sha256', process.env.RAZOR_PAY_KEY_SECRET)
            .update(`${orderId}|${paymentId}`)
            .digest('hex');

        if (signature !== generatedSignature) {
            return res.status(400).json({ error: 'Payment verification failed' });
        }

        const razorpayOrder = await razorpay.orders.fetch(orderId);
        if (!razorpayOrder || razorpayOrder.status !== 'paid') {
            return res.status(400).json({ error: 'Payment not completed' });
        }

        const cart = await Cart.findById(cartId).populate('items.product');
        const address = await Address.findById(addressId);
        const wallet = await Wallet.findOne({ user: req.session.user.user });
        const walletBalance = wallet.balance || 0;

        if (!cart) return res.status(404).json({ error: 'Cart not found' });
        if (!address) return res.status(404).json({ error: 'Address not found' });
        if (!wallet) return res.status(400).json({ error: 'Wallet not found' });

        let totalAmount = 0;
        const orderItems = [];

        const productIds = cart.items.map(item => item.product._id);
        const products = await Products.find({ _id: { $in: productIds } });

        for (let item of cart.items) {
            const product = products.find(p => p._id.toString() === item.product._id.toString());
            if (!product) return res.status(400).json({ error: 'Product not found' });

            const variant = product.variants.find(v => v._id.toString() === item.variantId.toString());
            if (!variant) return res.status(400).json({ error: 'Variant not found' });

            const variantPrice = variant.discount_price || variant.price;
            totalAmount += variantPrice * item.quantity;

            orderItems.push({
                product: item.product._id,
                variantId: variant._id,
                quantity: item.quantity,
                price: variantPrice
            });
        }

        // Handle discount from coupon
        let discountOnOrder = 0;
        const coupon = await Coupon.findOne({
            "users.userId": cart.user,
            "users.isBought": false
        });

        if (coupon) {
            const discountPercentage = coupon.discount;
            const discountAmount = (totalAmount * discountPercentage) / 100;
            discountOnOrder = Math.min(discountAmount, coupon.maximum_coupon_amount);

            await Coupon.findOneAndUpdate(
                { "users.userId": cart.user, "users.isBought": false },
                { $set: { "users.$.isBought": true } },
                { new: true }
            );
        }

        const discountedTotalAmount = totalAmount - discountOnOrder;
         // Calculate individual item discount
         for (let item of orderItems) {
            const itemTotal = item.price * item.quantity;
            const itemDiscount = (itemTotal / totalAmount) * discountOnOrder;
            item.discount = itemDiscount;
        }
        let payableAmount = discountedTotalAmount;
        if (wallet.balance > 0) {
            const walletUsedAmount = wallet.balance;
            payableAmount -= walletUsedAmount;
            wallet.balance -= walletUsedAmount;

            wallet.wallet_history.push({
                date: new Date(),
                amount: walletUsedAmount,
                description: 'Order payment using wallet',
                transactionType: 'debited'
            });
            await wallet.save();
        }

        const generatedOrderId = await generateUniqueOrderId();
        if(totalAmount < 3000){
            deliveryCharge = 50;
        }
        const newOrder = new Order({
            orderId: generatedOrderId,
            user: req.session.user.user,
            cartId,
            deliveryCharge,
            address: addressId,
            items: orderItems,
            totalAmount,
            discountAmount: discountOnOrder,
            payableAmount: payableAmount > 0 ? payableAmount : 0,
            walletUsedAmount: walletBalance,
            paymentMethod: 'Razorpay',
            paymentStatus: 'Paid',
            placedAt: new Date()
        });

        await newOrder.save();

        await Cart.findByIdAndDelete(cartId);

        return res.json({
            status: true,
            message: "Order verified and saved successfully",
            orderData: newOrder
        });

    } catch (error) {
        console.error('Error in verifyWalletPaymentPOST:', error);
        return res.status(500).json({ error: 'Internal Server Error' });
    }
};
