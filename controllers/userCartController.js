const User = require('../models/userModel');
const Category = require('../models/catogeryModel');
const Brand = require('../models/brandModel');
const Cart = require('../models/cartModel');
const flash = require('connect-flash');
const Products = require('../models/productModel');
const Addresses = require('../models/addressModel');
const { isLoggedIn } = require('../middleware/userAuth');
const { storeUserSession } = require('../utility/sessionUtil');
const Coupon = require('../models/coupenModel');
// GET: Add to Cart Page
exports.addToCartGET = async (req, res) => {
    try {
        if (req.session.user) {
            const userId = req.session.user.user;
            const cart = await Cart.findOne({ user: userId }).populate('items.product');

            if (cart && cart.items.length > 0) {
                for (let item of cart.items) {
                    const variant = item.product.variants.find(v => v._id.toString() === item.variantId);
                    if (variant) {
                        item.variantImage = variant.images[0];
                        item.price = variant.discount_price ? variant.discount_price : variant.price; 
                        console.log(item.price, 'from loop in cart');
                    }
                }
            }

            const isUserLoggedIn = req.session.user;
            res.render('user/cart', { cart, title: 'Cart', isUserLoggedIn, layout: 'layouts/homeLayout' });
        } else {
            req.flash('error', 'You need to log in to access the cart.');
            res.redirect('/login');
        }
    } catch (err) {
        console.log('Error occurred while loading the cart page:', err);
        res.status(500).send('An error occurred');
    }
};
// POST: Add Product Variant to Cart
exports.addToCartPost = async (req, res) => {
    try {
        const product_Id = req.params.id;
        const userSession = req.session.user;
        const user_Id = req.session.user.user;
        const { variantId } = req.body;

        if (!userSession) {
            return res.status(401).json({ success: false, message: 'User not logged in' });
        }

        const product = await Products.findById(product_Id);
        if (!product) {
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const variant = product.variants.find(v => v._id.toString() === variantId);
        if (!variant) {
            return res.status(404).json({ success: false, message: 'Variant not found' });
        }

        if (variant.stock <= 0) {
            return res.status(400).json({ success: false, message: 'Variant is out of stock' });
        }

        let cart = await Cart.findOne({ user: user_Id });
        if (!cart) {
            cart = new Cart({ user: user_Id, items: [] });
        }

        const existingItemIndex = cart.items.findIndex(item => item.product.toString() === product_Id && item.variantId === variantId);
        const maxQuantity = 5;

        if (existingItemIndex > -1) {
            const currentQuantity = cart.items[existingItemIndex].quantity;

            // Check if adding another item exceeds the maximum quantity allowed
            if (currentQuantity >= maxQuantity) {
                return res.status(400).json({ success: false, message: 'Cannot add more than 5 of the same item' });
            }

            cart.items[existingItemIndex].quantity += 1;
        } else {
            // Check if adding this new item exceeds the maximum quantity allowed
            if (1 > maxQuantity) {
                return res.status(400).json({ success: false, message: 'Cannot add more than 5 of the same item' });
            }

            cart.items.push({ product: product_Id, variantId, quantity: 1 });
        }

        await cart.save();
        res.json({ success: true, message: 'Product variant added to cart', redirectUrl: '/' });
    } catch (error) {
        console.log('Error occurred while adding product to cart:', error);
        res.status(500).json({ success: false, message: 'An error occurred' });
    }
};

// PUT: Update Cart Quantity
exports.updateCartQuantity = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        const cart = await Cart.findOne({ 'items._id': id });
        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart item not found' });
        }

        const item = cart.items.id(id);
        const product = await Products.findById(item.product._id);

        const variant = product.variants.find(v => v._id.toString() === item.variantId);
        if (!variant) {
            return res.status(404).json({ success: false, message: 'Variant not found' });
        }

        if (variant.stock < quantity) {
            return res.status(400).json({ success: false, message: `Only ${variant.stock} items are available in stock.` });
        }

        if (item) {
            item.quantity = quantity;
            await cart.save();
            return res.status(200).json({ success: true, message: 'Cart updated successfully' });
        } else {
            return res.status(404).json({ success: false, message: 'Item not found in cart' });
        }
    } catch (err) {
        console.error('Error updating cart quantity:', err);
        return res.status(500).json({ success: false, message: 'An error occurred while updating cart quantity' });
    }
};
exports.cartCheckout = async (req, res) => {
    try {
        const userId = req.session.user.user;

        const cart = await Cart.findOne({ user: userId }).populate('items.product');

        if (!cart || cart.items.length === 0) {
            return res.redirect('/');
        }

        // Fetch all available coupons
        const coupons = await Coupon.find();

        // Check for any coupon applied by the user
        const appliedCoupon = await Coupon.findOne({
            "users.userId": userId,
            "users.isBought": false
        });

        // Calculate total cart value
        let cartTotal = 0;
        for (let item of cart.items) {
            const variant = item.product.variants.find(v => v._id.toString() === item.variantId);
            if (variant) {
                const priceToUse = variant.discount_price || variant.price; 
                item.price = priceToUse;
                cartTotal += priceToUse * item.quantity;
            }
        }

        const applicableCoupons = coupons.filter(coupon => {
            return cartTotal >= coupon.minimum_purchase_amount;
        });
        console.log(cartTotal);

        const addresses = await Addresses.find({ userId });
        const isUserLoggedIn = !!req.session.user;

        res.render('user/checkout', {
            title: 'Checkout',
            isUserLoggedIn,
            coupons: applicableCoupons,
            cart,
            addresses,
            cartTotal,
            appliedCoupon,
            layout: 'layouts/homeLayout',
        });

    } catch (error) {
        console.log('Error occurred while loading proceed to checkout page:', error);
        res.redirect('/');
    }
};



// POST: Save Address for Checkout
exports.save_addressPOST = async (req, res) => {
    try {
        const userId = req.session.user.user;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { firstName, streetAddress, apartment, city, phoneNumber, emailAddress, saveInfo } = req.body;

        const newAddress = new Addresses({
            userId,
            fullName: firstName,
            streetAddress,
            apartment,
            city,
            phoneNumber,
            emailAddress,
            saveInfo
        });

        await newAddress.save();
        res.status(200).json({ message: 'Address saved successfully' });
    } catch (error) {
        console.error('Error occurred while posting address:', error);
        res.status(500).json({ error: 'An error occurred while saving the address. Please try again later.' });
    }
};

// POST: Place an Order
exports.place_orderPOST = async (req, res) => {
    try {
        const userId = req.session.user.user;
        const { firstName, streetAddress, apartment, city, phoneNumber, emailAddress, paymentMethod } = req.body;

        if (!userId) {
            return res.status(400).json({ message: 'User not authenticated' });
        }

        const newAddress = new Addresses({
            fullName: firstName,
            streetAddress,
            apartment,
            city,
            phoneNumber,
            emailAddress,
            saveInfo: req.body.saveInfo || false,
            paymentMethod,
            user: userId
        });

        await newAddress.save();
        console.log('Order and address saved successfully');
        return res.status(200).json({ message: 'Order placed successfully!' });
    } catch (error) {
        console.log('Error occurred while placing the order:', error);
        return res.status(500).json({ message: 'Failed to place order' });
    }
};


exports.deleteCart = async (req, res) => {
    try {
        const { id: itemId } = req.params;
        const userId = req.session.userId;

        console.log('cart function delete called')
        const cart = await Cart.findOneAndUpdate(
            { userId }, 
            { $pull: { items: { _id: itemId } } },
            { new: true } 
        );

        if (cart) {
            return res.status(200).json({ success: true, cart });
        } else {
            return res.status(404).json({ success: false, message: 'Cart not found' });
        }
    } catch (error) {
        console.log('Error occurred while deleting cart items:', error);
        return res.status(500).json({ success: false, message: 'Server error' });
    }
};

exports.apply_couponPOST = async (req, res) => {
    try {
        const { coupon_code } = req.body;

        const userId = req.session.user.user;

        const coupon = await Coupon.findOne({ coupon_code: coupon_code });

        if (!coupon) {
            return res.status(400).json({ error: 'Invalid coupon code' });
        }

        const now = new Date();
        if (now < coupon.start_date || now > coupon.expiry_date) {
            return res.status(400).json({ error: 'Coupon has expired' });
        }
        const cart = await Cart.findOne({ user: userId }).populate('items.product');
        if (!cart || cart.items.length === 0) {
            return res.status(400).json({ error: 'Cart is empty' });
        }

        let cartTotal = 0;
        for (let item of cart.items) {
            const variant = item.product.variants.find(v => v._id.toString() === item.variantId);
            if (variant) {
                if(variant.offer){
                    cartTotal += variant.discount_price * item.quantity
                }else{
                    cartTotal += variant.price * item.quantity
                }                
            }
        }

        if (cartTotal < coupon.minimum_purchase_amount) {
            return res.status(400).json({ error: `Minimum purchase amount for this coupon is ₹${coupon.minimum_purchase_amount}` });
        }

        let discount = (cartTotal * coupon.discount) / 100;
        discount = Math.min(discount, coupon.maximum_coupon_amount);

        res.json({ discount: discount });
    } catch (error) {
        console.log('Error occurred while applying coupon:', error);
        res.status(500).json({ error: 'An error occurred while applying the coupon' });
    }
}
exports.apply_coupon_to_userPOST = async (req, res) => {
    const { coupon_code } = req.body; 
    const userId = req.session.user.user;
  
    try {
        const result = await Coupon.findOneAndUpdate(
            { coupon_code: coupon_code },
            { $addToSet: { users: { userId: userId } } },
            { new: true, upsert: false }
        );

        if (!result) {
            return res.status(404).json({ coupon: false, message: "Coupon not found" });
        }

        return res.status(200).json({
            coupon: true,
            message: "Coupon applied successfully",
            discountAmount: result.discount,
            coupon_code: result.coupon_code
        });
    } catch (error) {
        return res.status(500).json({ coupon: false, message: "An error occurred while applying the coupon" });
    }
};
exports.remove_coupon_from_userPOST = async (req, res) => {
    const { coupon_code } = req.body;
    const userId = req.session.user.user;
  
    try {
        // Remove the user from the coupon's users array
        const result = await Coupon.findOneAndUpdate(
            { coupon_code: coupon_code },
            { $pull: { users: { userId: userId } } },
            { new: true }
        );

        if (!result) {
            return res.status(404).json({ coupon: false, message: "Coupon not found" });
        }

        return res.status(200).json({
            coupon: true,
            message: "Coupon removed successfully",
            coupon_code: result.coupon_code
        });
    } catch (error) {
        console.log('Error occurred while removing coupon:', error);
        return res.status(500).json({ coupon: false, message: "An error occurred while removing the coupon" });
    }
};
