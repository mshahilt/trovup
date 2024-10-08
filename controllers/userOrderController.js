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
const pdf = require('html-pdf');
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

        let cart = await Cart.findById(cartId).populate('items.product');
        if (!cart) {
            return res.status(400).json({
                success: false,
                message: 'Invalid cart ID',
            });
        }
        if (paymentMethod === 'cod') {
            paymentMethod = 'Cash on Delivery';
        }

        let totalAmount = 0;
        const orderItems = [];

        const productIds = cart.items.map(item => item.product._id);
        const products = await Products.find({ _id: { $in: productIds } });

        // Calculate total amount and prepare order items
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
            return res.status(400).json({success: false, message: 'Orders below Rs 3000 are not allowed for Cash On Delivery',})
        }
        const orderId = await generateUniqueOrderId();

        if(totalAmount < 1000){
            deliveryCharge = 50;
        }
        const order = new Order({
            orderId,
            user: userId,
            address: addressId,
            items: orderItems,
            totalAmount,
            discountAmount: discountOnOrder,
            payableAmount,
            deliveryCharge,
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
            console.log('Cart not found');
            return res.status(404).json({ error: 'Cart not found' });
        }

        if (!address) {
            console.log('Address not found');
            return res.status(404).json({ error: 'Address not found' });
        }

        console.log('Cart and address found:', { cart, address });

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
                console.log('Product not found');
                return res.status(400).json({ error: 'Product not found' });
            }

            let variant = product.variants.find(v => v._id.toString() === item.variantId.toString());
            if (!variant) {
                console.log('Variant not found');
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

        if(deliveryCharge < 3000){
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
            paymentStatus: 'Pending', 
            cartId: cart._id
        });

        await order.save();

        if (!signature || !payment_id) {
            console.log('Payment not completed (user closed Razorpay or canceled)');

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
            console.log('Successful payment');

            order.paymentStatus = 'Paid';
            await order.save();

            console.log('Order created and saved:', order);

            await Cart.findByIdAndDelete(cart._id);

            return res.json({
                status: true,
                message: "Payment verified, order created",
                order
            });
        } else {
            console.log('Payment verification failed (signature mismatch)');

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

        const order = await Order.findOne({ orderId }).populate('address items.product');

        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        const address = order.address;

        let itemsHtml = '';
        let totalAmount = 0;
        let totalDiscount = 0;

        order.items.forEach(item => {
            const product = item.product;
            const specificVariant = product.variants.find(v => v._id.toString() === item.variantId);
            const itemTotal = (item.price - item.discount) * item.quantity;

            totalAmount += itemTotal;
            totalDiscount += item.discount * item.quantity;

            itemsHtml += `
            <tr>
                <td>${product.product_name}</td>
                <td>Color: ${specificVariant.color}<br>Storage: ${specificVariant.storage_size}</td>
                <td>${item.quantity}</td>
                <td>${item.price}</td>
                <td>${item.discount.toFixed(2)}</td>
                <td>${itemTotal.toFixed(2)}</td>
            </tr>
            `;
        });

        const payableAmount = totalAmount;

        const html = `
                    <html>
                        <head>
                        <style>
                            body { font-family: Arial, sans-serif; background-color: #f4f4f4; }
                            .invoice-box { max-width: 800px; margin: auto; padding: 30px; border: 1px solid #eee; background: white; box-shadow: 0 0 10px rgba(0, 0, 0, 0.15); }
                            .invoice-box h2 { text-align: center; margin: 0 0 20px; color: #333; }
                            .invoice-table { width: 100%; border-collapse: collapse; margin-bottom: 20px; }
                            .invoice-table th, .invoice-table td { border: 1px solid #eee; padding: 10px; text-align: left; }
                            .invoice-table th { background-color: #f2f2f2; }
                            .totals { text-align: right; margin-top: 20px; }
                            .seal { text-align: center; margin-top: 30px; border: 2px dashed red; padding: 20px; display: inline-block; }
                            .seal img { width: 100px; }
                            .seal h4 { margin: 5px 0; }
                            .seal p { font-size: 12px; color: #777; }
                        </style>
                        </head>
                        <body>
                        <div class="invoice-box">
                            <h2>Invoice</h2>
                            <p><strong>Order ID:</strong> ${order.orderId}</p>
                            <p><strong>Payment Status:</strong> ${order.paymentStatus}</p>
                            <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>
                            
                            <h3>Shipping Address</h3>
                            <p>${address.fullName}</p>
                            <p>${address.streetAddress}, ${address.city}</p>
                            <p>${address.phoneNumber}</p>
                            <p>${address.emailAddress}</p>
                            
                            <h3>Order Details</h3>
                            <table class="invoice-table">
                            <tr>
                                <th>Product Name</th>
                                <th>Variant Details</th>
                                <th>Quantity</th>
                                <th>Price</th>
                                <th>Discount</th>
                                <th>Total</th>
                            </tr>
                            ${itemsHtml}
                            </table>
                            
                            <div class="totals">
                            <p><strong>Total Amount:</strong> ${order.totalAmount.toFixed(2)}</p>
                            <p><strong>Total Discount:</strong> ${totalDiscount.toFixed(2)}</p>
                            <p><strong>Payable Amount:</strong> ${payableAmount.toFixed(2)}</p>
                            </div>
                            <div class="seal">
                            <h4>Trovup</h4>
                            <p>Your trusted partner in quality.</p>
                            </div>

                        </div>
                        </body>
                    </html>
                    `;

        // Create the PDF file from the HTML
        const options = { format: 'A4' };
        const pdfFilePath = `./invoices/invoice_${orderId}.pdf`;

        pdf.create(html, options).toFile(pdfFilePath, (err, result) => {
            if (err) {
                console.error('PDF generation error:', err);
                return res.status(500).json({ success: false, message: 'Error generating invoice PDF' });
            }

            // Send the PDF as response
            res.setHeader('Content-Disposition', `attachment; filename=invoice_${orderId}.pdf`);
            fs.createReadStream(result.filename).pipe(res);
        });

    } catch (error) {
        console.log('Error occurred while downloading invoice for the order', error);
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

        console.log('expectedSignature', expectedSignature);
        console.log('razorpay_signature', razorpay_signature);
        if (expectedSignature === razorpay_signature) {

            const order = await Order.findById(orderId);
            order.paymentStatus = 'Paid';
            order.razorpayOrderId = razorpay_order_id;
            await order.save();

            console.log('func called', order)
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

        console.log('orderItems 1', orderItems);
        for (let item of orderItems) {
            const itemTotal = item.price * item.quantity;
            const itemDiscount = (itemTotal / totalAmount) * discountOnOrder;
            item.discount = itemDiscount;
        }
        console.log('orderItems 2', orderItems);
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
        console.log(deliveryCharge)
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
        console.log('wallet balance', wallet.balance);
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
