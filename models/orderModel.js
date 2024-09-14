const mongoose = require('mongoose');
const { v4: uuidv4 } = require('uuid');

const generateShortUUID = () => uuidv4().split('-')[0];

const orderSchema = new mongoose.Schema({
    orderId: {
        type: String,
        default: generateShortUUID, // Use the shortened UUID function
        unique: true,
        required: true
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
        }
    }],
    paymentMethod: {
        type: String,
        required: true,
        enum: ['Cash on Delivery', 'Bank Transfer']
    },
    totalAmount: {
        type: Number,
        required: true
    },
    orderStatus: {
        type: String,
        default: 'Pending',
        enum: ['Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled']
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
