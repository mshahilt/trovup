const User = require('../models/userModel');
const Category = require('../models/catogeryModel');
const Brand = require('../models/brandModel');
const Cart = require('../models/cartModel')
const flash = require('connect-flash');
const Products = require('../models/productModel');
const Addresses = require('../models/addressModel');
const { isLoggedIn } = require('../middleware/userAuth');

exports.addToCartGET = async (req, res) => {
    try {
        if (req.session.user) {
            const userId = req.session.user;
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

exports.addToCartPost = async (req, res) => {
    try {
        const product_Id = req.params.id;
        const user_Id = req.session.user;
        const { variantId } = req.body;

        if (!user_Id) {
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

        let cart = await Cart.findOne({ user: user_Id });
        if (!cart) {
            cart = new Cart({
                user: user_Id,
                items: []
            });
            console.log('New cart created');
        }

        // Check if the exact product variant is already in the cart
        const existingItemIndex = cart.items.findIndex(item => 
            item.product.toString() === product_Id && item.variantId === variantId
        );
        
        if (existingItemIndex > -1) {
            cart.items[existingItemIndex].quantity += 1;
            console.log('Product variant quantity increased');
        } else {
            cart.items.push({
                product: product_Id,
                variantId: variantId,
                quantity: 1,
                price: variant.price  
            });
            console.log('Product variant added to cart');
        }

        await cart.save();
        console.log('Cart saved successfully');

        res.json({ success: true, message: 'Product variant added to cart', redirectUrl: '/' });
    } catch (error) {
        console.log('Error occurred while adding product to cart:', error);
        res.status(500).json({ success: false, message: 'An error occurred' });
    }
};

exports.updateCartQuantity = async (req, res) => {
    try {
        const { id } = req.params;
        const { quantity } = req.body;

        const cart = await Cart.findOne({ 'items._id': id });

        if (!cart) {
            return res.status(404).json({ success: false, message: 'Cart item not found' });
        }

        const item = cart.items.id(id);
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
        const userId = req.session.user;
        const cart = await Cart.findOne({ user: userId }).populate('items.product');
        console.log('session',userId)
        const addresses = await Addresses.find({ userId: userId });
        console.log('address data for checkout:', addresses);
        const isUserLoggedIn = req.session.user ? true : false;
        res.render('user/checkout', { 
            title: 'Checkout', 
            isUserLoggedIn, 
            cart, 
            addresses,
            layout:'layouts/homeLayout'
        });
    } catch (error) {
        console.log('Error occurred while loading proceed to checkout page', error);
    }
};

exports.save_addressPOST = async (req, res) => {
    try {
        const userId = req.session.user;

        if (!userId) {
            return res.status(401).json({ error: 'Unauthorized' });
        }

        const { firstName, streetAddress, apartment, city, phoneNumber, emailAddress, saveInfo } = req.body;

        const newAddress = new Addresses({
            userId: userId,
            fullName: firstName,
            streetAddress: streetAddress,
            apartment: apartment,
            city: city,
            phoneNumber: phoneNumber,
            emailAddress: emailAddress,
            saveInfo: saveInfo
        });

        await newAddress.save();

        res.status(200).json({ message: 'Address saved successfully' });
    } catch (error) {
        console.error('Error occurred while posting address:', error);
        res.status(500).json({ error: 'An error occurred while saving the address. Please try again later.' });
    }
};


exports.place_orderPOST = async (req, res) => {
    try {
        const userId = req.session.user;
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

        // Send an error response if something goes wrong
        return res.status(500).json({ message: 'Failed to place order' });
    }
};

