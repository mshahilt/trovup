const User = require('../models/userModel');
const OTP = require('../models/otpModels');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const sendMail = require('../config/sendMail');
const Products = require('../models/productModel');
const Category = require('../models/catogeryModel');

// Configure nodemailer transporter
const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.USER,
        pass: process.env.APP_PASSWORD,
    },
});

// Mail options template
const mailOptions = {
    from: {
        name: 'Trovup',
        address: process.env.USER
    },
    subject: "Verification code of Trovup",
    text: "", // This will be filled dynamically
};

// GET: Render registration page
exports.registerUserGet = async (req, res) => {
    res.render('user/register', {
        title: 'Register',
        messages: {
            error: req.flash('error'),
            success: req.flash('success')
        },
        layout: 'layouts/authLayout'
    });
};


// POST: Handle user registration
exports.registerUser = async (req, res) => {
    const { username, email, phone_number, password } = req.body;

    // Validate input fields
    if (!email || !password || !username || !phone_number) {
        req.flash('error', 'All fields are required');
        return res.render('user/register', {
            title: "Sign Up",
            messages: req.flash(),  // Pass all flash messages
            layout: 'layouts/authLayout'
        });
    }

    try {
        // Check if the user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash('error', 'User already exists');
            return res.render('user/register', {
                title: "Sign Up",
                messages: req.flash(),  // Pass all flash messages
                layout: 'layouts/authLayout'
            });
        }

        // Create a new user and hash the password
        const newUser = new User({
            username,
            email,
            phone_number,
            password: await bcrypt.hash(password, 10),
            is_verify: false
        });

        // Generate OTP and send email
        const otp = Math.floor(1000 + Math.random() * 9000);
        const otpExpiresAt = Date.now() + 180000; // OTP expires in 3 minutes

        console.log('sadsafds',otp);
        await sendMail(transporter, {
            ...mailOptions,
            to: newUser.email,
            text: `Your OTP is ${otp}`
        });

        // Save OTP in the database
        const newOTP = new OTP({
            userId: newUser._id,
            otp,
            expiresAt: otpExpiresAt
        });

        await newUser.save(); // Save the new user to the database
        await newOTP.save();  // Save the OTP to the database

        // Save user details to the session
        req.session.user = {
            id: newUser._id,
            username: newUser.username,
            email: newUser.email,
            phone_number: newUser.phone_number,
            is_verify: newUser.is_verify
        };

        req.flash('success', 'OTP sent to your email');
        res.render('user/otp_verification', {
            title: 'Verify OTP',
            messages: req.flash(),  // Pass all flash messages
            layout: 'layouts/authLayout'
        });

    } catch (error) {
        console.error(error);
        req.flash('error', 'Server Error. Please try again later.');
        res.render('user/register', {
            title: "Sign Up",
            messages: req.flash(),  // Pass all flash messages
            layout: 'layouts/authLayout'
        });
    }
};
exports.getVerifyOTP = (req, res) => {
    // Check if the user session exists
    if (!req.session.user) {
        req.flash('error', 'Session expired. Please register again.');
        return res.redirect('/register');
    }

    // Render the OTP verification page
    res.render('user/otp_verification', {
        title: 'Verify OTP',
        messages: req.flash(),
        layout: 'layouts/authLayout'
    });
};


// POST: Handle OTP verification
exports.verifyOTP = async (req, res) => {
    const { otp1, otp2, otp3, otp4 } = req.body;
    const otp = otp1 + otp2 + otp3 + otp4; // Concatenate the OTP parts
    const userId = req.session.user.id;

    try {
        // Retrieve OTP record from the database
        const otpRecord = await OTP.findOne({ userId });

        if (!otpRecord) {
            req.flash('error', 'OTP not found.');
            return res.redirect('/verifyOTP');
        }

        // Check if OTP has expired
        if (otpRecord.expiresAt < Date.now()) {
            await OTP.deleteOne({ userId });
            req.flash('error', 'OTP has expired.');
            return res.redirect('/verifyOTP');
        }

        // Debugging: Log the stored OTP and the input OTP for comparison
        console.log('Stored OTP:', otpRecord.otp);
        console.log('Input OTP:', otp);

        // Compare the stored OTP with the input OTP
        if (otpRecord.otp !== otp) {
            req.flash('error', 'Invalid OTP.');
            return res.redirect('/verifyOTP');
        }

        // OTP is correct, proceed with verification
        await OTP.deleteOne({ _id: otpRecord._id }); // Remove OTP record after successful verification
        await User.findByIdAndUpdate(userId, { is_verify: true }); // Mark user as verified

        req.flash('success', 'OTP verified successfully');
        res.redirect('/'); // Redirect to the homepage or dashboard after verification

    } catch (error) {
        console.error('Error during OTP verification:', error);
        req.flash('error', 'Server Error. Please try again later.');
        res.redirect('/register'); // Redirect to the registration page in case of an error
    }
};

exports.resendOTP = async (req,res) => {
    const userId = req.session.user.id;

    try {
        const user = await User.findById(userId);

        if (!user) {
            req.flash('error', 'User not found.');
            return res.redirect('/register');
        }

        const otp = Math.floor(1000 + Math.random() * 9000);
        const otpExpiresAt = Date.now() + 180000; 

        await OTP.findOneAndUpdate(
            { userId: userId },
            { otp: otp, expiresAt: otpExpiresAt },
            { upsert: true }
        );


        await sendMail(transporter, {
            ...mailOptions,
            to: user.email,
            text: `Your new OTP is ${otp}`
        });

        req.flash('success', 'A new OTP has been sent to your email.');
        res.redirect('/verifyOTP');
        
    } catch (error) {
        console.error(error);
        req.flash('error', 'Server error. Please try again later.');
        res.redirect('/verifyOTP');
    }
}

// POST: Handle user login
exports.loginUser = async (req, res) => {
    try {
        const { email, password } = req.body;
        console.log(`email ${email} password ${password}`);
        
        // Find user by email
        const user = await User.findOne({ $and: [{ email: email }, { googleId: null }] });

        if (user) {
            console.log(password, user.password);

            // Compare passwords
            const match = await bcrypt.compare(password, user.password);
            console.log(match);

            if (user.isBlock) {
                req.flash('error', 'Sorry, user is blocked by Admin!');
                return res.redirect('/login');
            }

            if (match) {
                console.log('ok');
                req.session.user = user._id;
                return res.redirect('/');
            } else {
                req.flash('error', 'Incorrect password!');
                return res.redirect('/login');
            }
        } else {
            console.log('User not found');
            req.flash('error', 'Invalid user!');
            return res.redirect('/login');
        }
    } catch (error) {
        console.error('Error during login:', error);
        req.flash('error', 'An error occurred during login. Please try again.');
        return res.redirect('/login');
    }
};


// GET: Render login page
exports.loginUserGet = async (req, res) => {
    res.render('user/login', {
        title: 'Login',
        layout: 'layouts/authLayout'
    });
};

// POST: Get home page data
exports.getHomePagePOST = async (req, res) => {
    try {
        const products = await Products.find({ isDelete: false });
        const categories = await Category.find({ isDeleted: false });

        // Check if the user is logged in (assuming user information is stored in the session)
        const isUserLoggedIn = req.session.user ? true : false;

        res.render('user/home', {
            title: 'Home',
            products,
            categories,
            isUserLoggedIn, // Pass the user status to the frontend
            layout: 'layouts/homeLayout'
        });
    } catch (error) {
        console.log('Error occurred when loading home page:', error);
        res.status(500).send('Server error');
    }
};


// GET: Render products page
exports.productPageGET = async (req, res) => {
    try {
        const products = await Products.find({ isDelete: false })
            .populate('category_id', 'category_name')
            .populate('brand_id', 'brand_name');
        const categories = await Category.find({ isDeleted: false });
        const isUserLoggedIn = req.session.user ? true : false;
        res.render('user/products', {
            products,
            categories,
            title: 'Shop Now',
            layout: 'layouts/homeLayout',
            isUserLoggedIn
        });
    } catch (error) {
        console.log('Error occurred when loading user product page:', error);
        res.status(500).send('An error occurred while loading the product page.');
    }
};

// GET: View a single product
exports.viewProductGET = async (req, res) => {
    try {
        const id = req.params.id;
        const product = await Products.findById(id)
            .populate('category_id', 'category_name')
            .populate('brand_id', 'brand_name');
        
        if (!product || product.isDelete) {
            return res.status(404).send('Product not found');
        }

        const relatedCategory = product.category_id._id;
        const relatedProducts = await Products.find({ category_id: relatedCategory, isDelete: false });
        const isUserLoggedIn = req.session.user ? true : false;

        res.render('user/product', {
            product,
            title: product.product_name,
            layout: 'layouts/homeLayout',
            related_products: relatedProducts,
            isUserLoggedIn
        });
    } catch (error) {
        console.log('Error occurred while loading single product view page:', error);
        res.status(500).send('Server error');
    }
};

// GET: Retrieve user profile
exports.getUserProfile = async (req, res) => {
    try {
        const user = await User.findById(req.params.id);
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
            }
    
            res.json(user);
        } catch (error) {
            console.error(error);
            res.status(500).json({ error: 'Server Error' });
        }
    };
    
exports.logout = (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log('Error destroying session:', err);
            return res.status(500).send('Server error during logout');
        }

       
        res.redirect('/');
    });
    };
    