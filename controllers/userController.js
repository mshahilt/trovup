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
    text: "",
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
        const otpExpiresAt = Date.now() + 180000;

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

        await newUser.save(); 
        await newOTP.save();

        // Save user details to the session
        req.session.user = {
            user: newUser._id,
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
    const otp = otp1 + otp2 + otp3 + otp4; 
    console.log('otp has reached', otp);

    const userId = req.session.user.user;

    try {
        const otpRecord = await OTP.findOne({ userId : userId });

        if (!otpRecord) {
            return res.status(404).json({ success: false, message: 'OTP not found.' });
        }

        if (otpRecord.expiresAt < Date.now()) {
            await OTP.deleteOne({ userId });
            return res.status(400).json({ success: false, message: 'OTP has expired.' });
        }

        // Compare the stored OTP with the input OTP
        if (otpRecord.otp !== otp) {
            return res.status(400).json({ success: false, message: 'Invalid OTP.' });
        }

        await OTP.deleteOne({ _id: otpRecord._id }); 
        await User.findByIdAndUpdate(userId, { is_verify: true }); 

        const newUser = await User.findById(req.session.user.user);

         req.session.user = {
            user:newUser._id,
            username: newUser.username,
            email: newUser.email,
            phone_number: newUser.phone_number,
            is_verify: newUser.is_verify
        };

        console.log('data stored to session',req.session.user);
        return res.status(200).json({ success: true, message: 'OTP verified successfully.' });

    } catch (error) {
        console.error('Error during OTP verification:', error);
        return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
};
      
exports.resendOTP = async (req, res) => {

    const userId = req.session.user.user;
    console.log(req.session)
    console.log(req.session.user)
    console.log(req.session.user.user)
    
    console.log("resendOTP/++-")
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


        console.log('new otp sented')
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
       
        const user = await User.findOne({ $and: [{ email: email }, { googleId: null }] });

        if (user) {

            const match = await bcrypt.compare(password, user.password);
            console.log(match);

            if (user.isBlock) {
                req.flash('error', 'Sorry, user is blocked by Admin!');
                return res.redirect('/login');
            }

            if (match) {
                if (!user.is_verify) {
                    const userId = user._id;
                    req.session.user = { user: { user: userId } }; 
                    
                    // Generate OTP and send email
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
                    return res.redirect('/verifyOTP');

                } else {
                    req.session.user = { user: user._id };
                    return res.redirect('/');
                }
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
        const products = await Products.aggregate([
            {
              $match: {
                isDelete: false
              }
            },
            {
              $unwind: "$variants" 
            },
            {
              $lookup: {
                from: "offers", 
                localField: "variants.offer", 
                foreignField: "_id", 
                as: "variants.offer" 
              }
            },
            {
              $unwind: {
                path: "$variants.offer",  
                preserveNullAndEmptyArrays: true 
              }
            },
          ]);

        // res.json(products)
        const categories = await Category.find({ isDeleted: false });
        
     
        const query = req.query.search || '';

        const isUserLoggedIn = req.session.user ? true : false;
        
        res.render('user/home', {
            title: 'Home',
            products,
            categories,
            isUserLoggedIn,
            query,
            layout: 'layouts/homeLayout'
        });
    } catch (error) {
        console.log('Error occurred when loading home page:', error);
        res.status(500).send('Server error');
    }
};

// GET: View a single product
exports.viewProductGET = async (req, res) => {
    try {
        const id = req.params.id;
        
        // Find the product by ID and populate related fields
        const product = await Products.findById(id)
            .populate({
                path: 'variants.offer',
                model: 'Offer',
            })
            .populate('brand_id')  
            .populate('category_id');

        // If product not found or marked as deleted, send a 404 response
        if (!product || product.isDelete) {
            return res.status(404).send('Product not found');
        }

        // Fetch related products based on the same category
        const relatedCategory = product.category_id._id;
        const relatedProducts = await Products.find({
            category_id: relatedCategory,
            isDelete: false,
            _id: { $ne: id }  // Exclude the current product
        });

        // Determine if the user is logged in
        const isUserLoggedIn = req.session.user ? true : false;

        // Set the default selected variant as the first variant in the product
        const selectedVariant = product.variants[0];

        // Render the product EJS page with the required data
        res.render('user/product', {
            product,
            selectedVariant,
            title: product.product_name,
            layout: 'layouts/homeLayout',
            related_products: relatedProducts,
            isUserLoggedIn
        });

    } catch (error) {
        console.error('Error occurred while loading single product view page:', error);
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
    
exports.logout = async (req, res) => {
    req.session.destroy((err) => {
        if (err) {
            console.log('Error destroying session:', err);
            return res.status(500).send('Server error during logout');
        }

       
        res.redirect('/');
    });
    };
    
        const sort = ''; 
        exports.searchPageGET = async (req, res) => {
            try {
              const searchQuery = req.query.query;
              const query = searchQuery ? searchQuery.trim() : '';
          
              let products = [];
              if (query) {
                products = await Products.find({
                  isDelete: false,
                  product_name: { $regex: query, $options: 'i' }
                })
                .populate('category_id', 'category_name')
                .populate('brand_id', 'brand_name');
              }
          
              res.status(200).json({
                success: true,
                products: products,  // Send the products array
                message: 'Search completed successfully.'
              });
            } catch (error) {
              console.error('Error occurred during product search:', error);
              res.status(500).json({
                success: false,
                message: 'An error occurred while searching for products.'
              });
            }
          };
          
  // Controller
exports.productPageGET = async (req, res) => {
    const { search, color, brand, category, minPrice, maxPrice, sort } = req.query;

    console.log('sort:', sort);
    // Build the query object for MongoDB
    let query = {};
    if (search) {
        query.product_name = { $regex: new RegExp(search, 'i') };
    }
    if (color) {
        query['variants.color'] = color;
    }
    if (brand) {
        query['brand_id.brand_name'] = brand;
    }
    if (category) {
        query['category_id.category_name'] = category;
    }
    if (minPrice || maxPrice) {
        query['variants.price'] = {};
        if (minPrice) query['variants.price'].$gte = Number(minPrice);
        if (maxPrice) query['variants.price'].$lte = Number(maxPrice);
    }

    // Sorting options
    let sortQuery = {};
    switch (sort) {
        case 'priceLowHigh':
            sortQuery['variants.price'] = 1;
            break;
        case 'priceHighLow':
            sortQuery['variants.price'] = -1;
            break;
        case 'nameAZ':
            sortQuery['product_name'] = 1;
            break;
        case 'nameZA':
            sortQuery['product_name'] = -1;
            break;
        default:
            sortQuery = {}; // Default sort (no specific sorting)
    }

    try {
        // Fetch products with filters and sorting
        const products = await Products.find(query)
            .sort(sortQuery)
            .populate('category_id', 'category_name') // Only populate category_name
            .populate('brand_id', 'brand_name'); // Only populate brand_name

        console.log('Products found:', products);

        // Check if the user is logged in
        const isUserLoggedIn = req.session.user;

        // Fetch distinct values for filters
        const colors = await Products.distinct('variants.color');
        const brands = await Products.distinct('brand_id.brand_name');
        const categories = await Products.distinct('category_id.category_name');

        // Render the products page with filters and product data
        res.render('user/products', {
            isUserLoggedIn,
            title: 'Shop',
            layout: 'layouts/homeLayout',
            products,
            search,
            colors,
            brands,
            categories,
            selectedColor: color,
            selectedBrand: brand,
            selectedCategory: category,
            minPrice,
            maxPrice,
            sort
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Server Error');
    }
};
