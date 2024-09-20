const mongoose = require('mongoose');

const couponSchema = new mongoose.Schema({
    coupon_code: {
        type: String,
        required: true,
        unique: true
    },
    discount: {
        type: Number,
        required: true
    },
    start_date: {
        type: Date,
        required: true
    },
    expiry_date: {
        type: Date,
        required: true
    },
    users: [{    
        userId: {        
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User',
            },    
            isBought: {        
                type: Boolean,        
                default: false    
            }
        }],

    minimum_purchase_amount: {
        type: Number,
        default: 0
    },
    maximum_coupon_amount: {
        type: Number,
        default: 0
    },
    coupon_description : {
        type: 'string',
        required: true
    }
});

const Coupon = mongoose.model('Coupon', couponSchema);

module.exports = Coupon;
