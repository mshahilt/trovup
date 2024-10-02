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

        // Calculate total amount and prepare order items
        for (let item of cart.items) {
            const product = products.find(p => p._id.toString() === item.product._id.toString());
            if (!product) {
                return res.status(400).json({
                    success: false,
                    message: 'Product not found',
                });
            }

            // Find matching variant
            let variant = product.variants.find(v => v._id.toString() === item.variantId.toString());
            if (variant) {
                let itemPrice = variant.discount_price * item.quantity; // Use discount price for calculation
                totalAmount += itemPrice;

                // Push item into orderItems array
                orderItems.push({
                    product: item.product._id,
                    variantId: variant._id,
                    quantity: item.quantity,
                    price: variant.discount_price,
                });

                // Deduct stock from the variant
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

        // Adjust discount for each item proportionally
        for (let item of orderItems) {
            const itemTotal = item.price * item.quantity;
            const itemDiscount = (itemTotal / totalAmount) * discountOnOrder;
            item.discount = itemDiscount;
        }

        // Generate unique orderId
        const orderId = await generateUniqueOrderId();

        // Create new order document
        const order = new Order({
            orderId,  // Use the generated orderId
            user: userId,
            address: addressId,
            items: orderItems,
            totalAmount,
            discountAmount: discountOnOrder,
            payableAmount,
            paymentMethod,
            paymentStatus: 'Pending',
            couponApplied: coupon ? coupon._id : null
        });

        // Save the order
        await order.save();

        // Clear the cart after order is placed
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

        const options = {
            amount: Math.round(payableAmount * 100),
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
        const body = `${order_id}|${payment_id}`;
        const crypto = require("crypto");
        const expectedSignature = crypto
            .createHmac('sha256', process.env.RAZOR_PAY_KEY_SECRET)
            .update(body)
            .digest('hex');

        if (expectedSignature === signature) {
            console.log('Successful payment');

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

            for (let item of orderItems) {
                const itemTotal = item.price * item.quantity;
                const itemDiscount = (itemTotal / totalAmount) * discountOnOrder;
                item.discount = itemDiscount;
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
                paymentMethod: 'Razorpay',
                razorpayOrderId: order_id,
                paymentStatus: 'Paid',
                cartId: cart._id
            });

            await order.save();

            console.log('Order created and saved:', order);

            await Cart.findByIdAndDelete(cart._id);

            return res.json({ status: true, message: "Payment verified, order created", order });
        } else {
            console.log('Payment verification failed');
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
        const { orderId, itemId } = req.body;

        // Fetch order and populate address details
        const order = await Order.findOne({ orderId }).populate('address')
        
        if (!order) {
            return res.status(404).json({ success: false, message: 'Order not found' });
        }

        // Find the specific item in the order
        const item = order.items.id(itemId);
        const product = await Products.findOne({_id: item.product});
        const specificVariant = product.variants.find( v => v._id.toString() === item.variantId);

        console.log(specificVariant,'dsfhjkagshjke')
        if (!item) {
            return res.status(404).json({ success: false, message: 'Item not found in the order' });
        }

        const address = order.address;
// Create the HTML for the invoice
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
        
        <h3>Item Details</h3>
        <table class="invoice-table">
        <tr>
            <th>Product Name</th>
            <th>Variant Details</th>
            <th>Quantity</th>
            <th>Price</th>
            <th>Discount</th>
            <th>Total</th>
        </tr>
        <tr>
            <td>${product.product_name}</td>
            <td>Color: ${specificVariant.color}<br>Storage: ${specificVariant.storage_size}</td>
            <td>${item.quantity}</td>
            <td>${item.price}</td>
            <td>${item.discount}</td>
            <td>${((item.price - item.discount).toFixed(2))*item.quantity}</td>
        </tr>
        </table>
        
        <div class="totals">
        <p><strong>Total Amount:</strong> ${(item.price + item.discount).toFixed(2)}</p>
        <p><strong>Discount Amount:</strong> ${item.discount.toFixed(2)}</p>
        <p><strong>Payable Amount:</strong> ${(item.price - item.discount).toFixed(2)}</p>
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
        const pdfFilePath = `./invoices/invoice_${orderId}_${itemId}.pdf`;

        pdf.create(html, options).toFile(pdfFilePath, (err, result) => {
            if (err) {
                console.error('PDF generation error:', err);
                return res.status(500).json({ success: false, message: 'Error generating invoice PDF' });
            }

            // Send the PDF as response
            res.setHeader('Content-Disposition', `attachment; filename=invoice_${orderId}_${itemId}.pdf`);
            fs.createReadStream(result.filename).pipe(res);
        });

    } catch (error) {
        console.log('Error occurred while downloading invoice for single product', error);
        res.status(500).json({ success: false, message: 'Server error occurred' });
    }
};