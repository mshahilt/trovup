const User = require('../models/userModel');
const Category = require('../models/catogeryModel');
const Brand = require('../models/brandModel');
const Cart = require('../models/cartModel');
const flash = require('connect-flash');
const Products = require('../models/productModel');
const Addresses = require('../models/addressModel');
const { isLoggedIn } = require('../middleware/userAuth');
const { storeUserSession } = require('../utility/sessionUtil');

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
                        item.variantImage = variant.images[0];  // Store the variant image in the cart item
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
            console.log('User not logged in');
            return res.status(401).json({ success: false, message: 'User not logged in' });
        }

        const product = await Products.findById(product_Id);
        if (!product) {
            console.log('Product not found');
            return res.status(404).json({ success: false, message: 'Product not found' });
        }

        const variant = product.variants.find(v => v._id.toString() === variantId);
        if (!variant) {
            console.log('Variant not found');
            return res.status(404).json({ success: false, message: 'Variant not found' });
        }

        // Inventory management check: Ensure variant has stock left
        if (variant.stock <= 0) {
            console.log('Variant out of stock');
            return res.status(400).json({ success: false, message: 'Variant is out of stock' });
        }

        let cart = await Cart.findOne({ user: user_Id });
        if (!cart) {
            cart = new Cart({ user: user_Id, items: [], total_price: 0 });
            console.log('New cart created');
        }

        const existingItemIndex = cart.items.findIndex(item => item.product.toString() === product_Id && item.variantId === variantId);

        if (existingItemIndex > -1) {
            // Check if adding more will exceed stock
            if (cart.items[existingItemIndex].quantity + 1 > variant.stock) {
                console.log('Not enough stock available');
                return res.status(400).json({ success: false, message: 'Not enough stock available' });
            }

            cart.items[existingItemIndex].quantity += 1;
            cart.items[existingItemIndex].price += variant.price;
        } else {
            if (variant.stock < 1) {
                console.log('Variant is out of stock');
                return res.status(400).json({ success: false, message: 'Variant is out of stock' });
            }
            cart.items.push({ product: product_Id, variantId, quantity: 1, price: variant.price });
        }

        // Update total price
        cart.total_price = cart.items.reduce((total, item) => total + item.price, 0);

        // Save cart changes
        await cart.save();

        res.json({ success: true, message: 'Product variant added to cart', redirectUrl: '/' });
    } catch (error) {
        console.log('Error occurred while adding product to cart:', error);
        res.status(500).json({ success: false, message: 'An error occurred' });
    }
};


// PUT: Update Cart Quantity with Inventory Check
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
        
        // Find the variant in the product to check its stock
        const variant = product.variants.find(variant => variant._id.toString() === item.variantId);
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


// GET: Proceed to Checkout Page
exports.cartCheckout = async (req, res) => {
    try {
        const userId = req.session.user.user;
        const cart = await Cart.findOne({ user: userId }).populate('items.product');
        const addresses = await Addresses.find({ userId });
        const isUserLoggedIn = !!req.session.user;

        res.render('user/checkout', {
            title: 'Checkout',
            isUserLoggedIn,
            cart,
            addresses,
            layout: 'layouts/homeLayout',
        });
    } catch (error) {
        console.log('Error occurred while loading proceed to checkout page:', error);
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
