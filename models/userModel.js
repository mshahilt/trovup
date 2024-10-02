const mongoose = require('mongoose');
const bcrypt = require('bcrypt')

const userSchema = new mongoose.Schema({
    username: {
        type: String,
        required: function() {
            return !this.googleId;
        }
    },
    referralId: {
        type: String,
        unique: true
    },
    refferedById: {
        type: String,
    },
    email: {
        type: String,
        required: true,
        unique: true,
        validate: {
            validator: function(v) {
                return /^\S+@\S+\.\S+$/.test(v);
            },
            message: props => `${props.value} is not a valid email!`
        },
    },
    phone_number: {
        type: String,
        required: function() {
            return !this.googleId;
        },
        validate: {
            validator: function(v) {
                return /\d{10}/.test(v);
            },
            message: props => `${props.value} is not a valid phone number!`
        },
    },
    password: {
        type: String,
        
    },
    googleId: {
        type: String,
        default: null,
        sparse: true,
    },
    isAdmin: {
        type: Boolean,
        default: false,
    },
    isBlock: {
        type: Boolean,
        default: false,
    },
    is_verify: {
        type: Boolean,
        default: false,
    },
    is_deleted: {
        type: Boolean,
        default: false,
    }
}, { timestamps: true });



const User = mongoose.model('User', userSchema);
module.exports = User;
