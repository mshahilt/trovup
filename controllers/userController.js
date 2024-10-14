const User = require('../models/userModel');
const OTP = require('../models/otpModels');
const bcrypt = require('bcrypt');
const nodemailer = require('nodemailer');
const sendMail = require('../config/sendMail');
const Products = require('../models/productModel');
const Category = require('../models/catogeryModel');
const Brands = require('../models/brandModel');
const generateUniqueRefferalId = require('../config/generateUniqueReferal');
const Wallet = require('../models/walletModel');

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
    const {refer_code} = req.query;
    if (!email || !password || !username || !phone_number) {
        req.flash('error', 'All fields are required');
        return res.render('user/register', {
            refer_code,
            title: "Sign Up",
            messages: req.flash(), 
            layout: 'layouts/authLayout'
        });
    }

    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            req.flash('error', 'User already exists');
            return res.render('user/register', {
                title: "Sign Up",
                messages: req.flash(),
                layout: 'layouts/authLayout'
            });
        }

        const newUser = new User({
            username,
            refferedById: refer_code,
            email,
            phone_number,
            password: await bcrypt.hash(password, 10),
            is_verify: false
        });

        const otp = Math.floor(1000 + Math.random() * 9000);
        const otpExpiresAt = Date.now() + 180000;

        await sendMail({
            ...mailOptions,
            to: newUser.email,
            text: `Your OTP is ${otp}`
        });

        const newOTP = new OTP({
            userId: newUser._id,
            otp,
            expiresAt: otpExpiresAt
        });

        await newUser.save(); 
        await newOTP.save();

        req.session.user = {
            user: newUser._id,
            is_verify: newUser.is_verify
        };

        req.flash('success', 'OTP sent to your email');
        res.render('user/otp_verification', {
            title: 'Verify OTP',
            messages: req.flash(),
            layout: 'layouts/authLayout'
        });

    } catch (error) {
        console.error(error);
        req.flash('error', 'Server Error. Please try again later.',error);
        res.render('user/register', {
            title: "Sign Up",
            messages: req.flash(), 
            layout: 'layouts/authLayout'
        });
    }
};
exports.getVerifyOTP = (req, res) => {
    if (!req.session.user) {
        req.flash('error', 'Session expired. Please register again.');
        return res.redirect('/register');
    }

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
        const user = await User.findById(userId)

        if (user.refferedById) {
            const referredUser = await User.findOne({ referralId: user.refferedById });
            if (referredUser) {
                const referredUserWallet = await Wallet.findOne({ user: referredUser._id }); 
                
                if (referredUserWallet) {
                    referredUserWallet.balance += 500;
        
                    referredUserWallet.wallet_history.push({
                        amount: 500,
                        description: `Referral bonus credited by referring ${user.username}`,
                        transactionType: 'credited'
                    });
                    await referredUserWallet.save();
                } else {
                    const newWallet = new Wallet({
                        user: referredUser._id,
                        balance: 500,
                        wallet_history: [{
                            amount: 500,
                            description: 'Referral bonus credited',
                            transactionType: 'credited'
                        }]
                    });
        
                    await newWallet.save(); 
                }
            } else {
                console.log('Referred user not found');
            }
        }
        
            req.session.user = {
            user:user._id,
            username: user.username,
            email: user.email,
            phone_number: user.phone_number,
            is_verify: user.is_verify
        };
        return res.status(200).json({ success: true, message: 'OTP verified successfully.' });

    } catch (error) {
        console.error('Error during OTP verification:', error);
        return res.status(500).json({ success: false, message: 'Server error. Please try again later.' });
    }
};
      
exports.resendOTP = async (req, res) => {

    const userId = req.session.user.user;

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


        await sendMail( {
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
       
        const user = await User.findOne({ $and: [{ email: email }, { googleId: null }] });

        if (user) {

            const match = await bcrypt.compare(password, user.password);
    
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
            {
                $limit: 8
            }
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

exports.viewProductGET = async (req, res) => {
    try {
        const id = req.params.id;
        
        const product = await Products.findById(id)
            .populate({
                path: 'variants.offer',
                model: 'Offer',
            })
            .populate('brand_id')  
            .populate('category_id');

        if (!product || product.isDelete) {
            return res.status(404).send('Product not found');
        }

        const relatedCategory = product.category_id._id;
        const relatedProducts = await Products.find({
            category_id: relatedCategory,
            isDelete: false,
            _id: { $ne: id } 
        });

        const isUserLoggedIn = req.session.user ? true : false;

        const selectedVariant = product.variants[0];

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
exports.productPageGET = async (req, res) => {
    const { search, color, brand, category, minPrice, maxPrice, sort, page = 1, limit = 6 } = req.query;

    try {
        let query = {
            isDelete: false,
        };

        // Search filter
        if (search) {
            query.product_name = { $regex: new RegExp(search, 'i') };
        }

        // Brand filter
        if (brand) {
            const brandDoc = await Brands.findOne({ brand_name: brand });
            if (brandDoc) {
                query.brand_id = brandDoc._id;
            }
        }

        // Category filter
        if (category) {
            const categoryDoc = await Category.findOne({ category_name: category });
            if (categoryDoc) {
                query.category_id = categoryDoc._id;
            }
        }

        // Create pipeline
        const pipeline = [
            { $match: query },
            { $unwind: "$variants" },
        ];

        // Color filter
        if (color) {
            pipeline.push({
                $match: {
                    "variants.color": color
                }
            });
        }

        // Price filter
        if (minPrice || maxPrice) {
            let priceMatch = {};
            if (minPrice) priceMatch.$gte = Number(minPrice);
            if (maxPrice) priceMatch.$lte = Number(maxPrice);

            pipeline.push({
                $match: {
                    "variants.price": priceMatch
                }
            });
        }

        // Sorting logic
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
                sortQuery = {};
        }
        if (Object.keys(sortQuery).length > 0) {
            pipeline.push({ $sort: sortQuery });
        }

        // Pagination setup
        const skip = (page - 1) * limit;
        const totalProducts = await Products.countDocuments(query);
        const totalPages = Math.ceil(totalProducts / limit);

        // Add pagination to pipeline
        pipeline.push(
            { $skip: skip },
            { $limit: Number(limit) }
        );

        pipeline.push({
            $lookup: {
                from: "offers",
                localField: "variants.offer",
                foreignField: "_id",
                as: "variants.offer"
            }
        });

        pipeline.push({
            $unwind: {
                path: "$variants.offer",
                preserveNullAndEmptyArrays: true
            }
        });

        const products = await Products.aggregate(pipeline);
        const colors = await Products.distinct('variants.color', query);
        const brandsData = await Brands.find({}, 'brand_name');
        const categoriesData = await Category.find({}, 'category_name');

        const brands = brandsData.map(brand => brand.brand_name);
        const categories = categoriesData.map(category => category.category_name);

        res.render('user/products', {
            isUserLoggedIn: req.session.user,
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
            sort,
            noProducts: products.length === 0,
            currentPage: Number(page),
            totalPages,
            limit: Number(limit),
        });
    } catch (error) {
        console.error('Error fetching products:', error);
        res.status(500).send('Server Error');
    }
};


exports.getReferralCode = async (req, res) => {
    try {
        const userId = req.session.user.user;
        const user = await User.findById(userId);

        let referralCode;

        if (user.referralId) {
            referralCode = user.referralId;
        } else {

            referralCode = await generateUniqueRefferalId();
            user.referralId = referralCode;
            await user.save(); 
        }

        const referralUrl = `http://localhost:5000/register?refer_code=${referralCode}`;

        res.json({ referralUrl });
    } catch (error) {
        console.error('Error fetching referral code:', error);
        res.status(500).json({ message: 'Error fetching referral code' });
    }
};