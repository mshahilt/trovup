const Cart = require('../models/cartModel');
const Wishlist = require('../models/wishlistModel');

const cartMiddleware = async (req, res, next) => {
    try {
        const user = req.session?.user?.user || req.session?.user;

        res.locals.user = user;

        if (user) {
            const cart = await Cart.findOne({ user: user });
            res.locals.cart = cart;
            res.locals.cartCount = cart ? cart.items.length : 0;
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


const wishlistMiddleware = async (req, res, next) => {
    try {

        const user = req.session?.user?.user || req.session?.user;

        res.locals.user = user;

        if (user) {
            const wishlist = await Wishlist.findOne({ user_id: user });
            res.locals.wishlist = wishlist;
            res.locals.wishlistCount = wishlist ? wishlist.items.length : 0;
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