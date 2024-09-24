const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const generateShortUUID = () => uuidv4().split('-')[0];

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        default: generateShortUUID,
        unique: true,
        required: true
    },
    cartId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Cart',
        required: false
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    address: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Address'
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Products',
            required: true
        },
        variantId: {
            type: String
        },
        quantity: {
            type: Number,
            required: true,
            default: 1
        },
        price: {
            type: Number,
            required: true
        },
        discount: {
            type: Number,
            default: 0 
        },
        orderStatus: {  
            type: String,
            default: 'Pending',
            enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
        },
        isReturnRequested: {
            type: Boolean,
            default: false
        },
        isAdminAcceptedReturn: {
            type: String,
            default: 'Pending',
            enum: ['Pending', 'Accepted', 'Rejected']
        },
        reasonOfReturn: {
            type: String
        },
        additionalReason : {
            type: String
        }
    }],
    paymentMethod: {
        type: String,
        required: true,
        enum: ['Cash on Delivery', 'Razorpay']
    },
    razorpayOrderId: {
        type: String,
        required: function() { return this.paymentMethod === 'Razorpay'; },
        default: null
    },
    paymentStatus: {
        type: String,
        default: 'Pending',
        enum: ['Pending', 'Paid', 'Failed'] 
    },
    totalAmount: {
        type: Number,
        required: true
    },
    discountAmount: {  
        type: Number,
        default: 0
    },
    payableAmount: {
        type: Number,
        required: true
    },
    couponApplied: {  
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Coupon',
        required: false
    },
    placedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

const Order = mongoose.model('Order', orderSchema);

module.exports = Order;
