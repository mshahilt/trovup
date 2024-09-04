const mongoose = require('mongoose');

const cartSchema = mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Products'
        },
        variantId: {
            type: String
        },
        quantity: {
            type: Number,
            default: 1
        },
        price: {
            type: Number
        }
    }],
    total_price: {
        type: Number
    }
}, { timestamps: true });


const Cart = mongoose.model('Cart', cartSchema);
module.exports = Cart;
