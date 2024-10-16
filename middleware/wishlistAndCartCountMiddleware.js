const mongoose = require('mongoose');
const Cart = require('../models/cartModel');
const Wishlist = require('../models/wishlistModel');
const ObjectId = mongoose.Types.ObjectId;

// Cart Middleware
const cartMiddleware = async (req, res, next) => {
    try {
        const user = req.session?.user?.user || req.session?.user;

        res.locals.user = user;

        if (user) {
            // Convert the user ID to an ObjectId if it's a valid string
            const userObjectId = ObjectId.isValid(user) ? new ObjectId(user) : null;

            if (userObjectId) {
                // Check if the user has a cart
                const cart = await Cart.findOne({ user: userObjectId });
                res.locals.cart = cart;
                res.locals.cartCount = cart && cart.items ? cart.items.length : 0;
            } else {
                res.locals.cart = null;
                res.locals.cartCount = 0;
            }
        } else {
            res.locals.cart = null;
            res.locals.cartCount = 0;
        }

        next();
    } catch (err) {
        console.error("Error in cart middleware:", err);
        next(err);
    }
};

// Wishlist Middleware
const wishlistMiddleware = async (req, res, next) => {
    try {
        const user = req.session?.user?.user || req.session?.user;

        res.locals.user = user;

        if (user) {
            // Convert the user ID to an ObjectId if it's a valid string
            const userObjectId = ObjectId.isValid(user) ? new ObjectId(user) : null;

            if (userObjectId) {
                // Check if the user has a wishlist
                const wishlist = await Wishlist.findOne({ user_id: userObjectId });
                res.locals.wishlist = wishlist;
                res.locals.wishlistCount = wishlist && wishlist.items ? wishlist.items.length : 0;
            } else {
                res.locals.wishlist = null;
                res.locals.wishlistCount = 0;
            }
        } else {
            res.locals.wishlist = null;
            res.locals.wishlistCount = 0;
        }

        next();
    } catch (err) {
        console.error("Error in wishlist middleware:", err);
        next(err);
    }
};

module.exports = { cartMiddleware, wishlistMiddleware };
