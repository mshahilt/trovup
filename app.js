const express = require('express');
const connectDB = require('./config/db');
const userRoutes = require('./routes/userRoutes');
const adminRoutes = require('./routes/adminRoutes');
const userCartRoutes = require('./routes/userCartRoutes')
const googleAuth = require('./routes/googleRoutes');
const userOrderRoutes = require('./routes/userOrderRoutes');
const userProfileRoutes = require('./routes/userProfileRoutes');
const wishlistRoutes = require('./routes/userWishlistRoutes');
const walletRoutes = require('./routes/walletRoutes');
const expressLayouts = require('express-ejs-layouts');
const session = require('express-session');
const flash = require('connect-flash');
const passport = require('passport');
const nochache = require('nocache');
const { isLoggedIn } = require('./middleware/userAuth');
const {cartMiddleware, wishlistMiddleware} = require('./middleware/wishlistAndCartCountMiddleware');
require('dotenv').config();

require('./config/auth');

const app = express();

// Connect to MongoDB
connectDB();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Initialize session
app.use(session({
    secret: process.env.SESSION_SECRET || 'your_secret_key',
    resave: false,
    saveUninitialized: false,
    cookie: {
        maxAge: 1000 * 60 * 60 * 24,
        secure: false
    }
}));

// Initialize Passport and manage sessions
app.use(passport.initialize());
app.use(passport.session());

// Initialize flash
app.use(flash());
app.use(nochache());

app.use(cartMiddleware);
app.use(wishlistMiddleware);

// Use express-ejs-layouts for layout management
app.use(expressLayouts);
app.set('view engine', 'ejs');

// Set default layout
app.set('layout', 'layouts/layout');

// Serve static files
app.use(express.static('public'));
app.use("/uploads", express.static('uploads'));

// Middleware to make flash messages available globally in views
app.use((req, res, next) => {
    res.locals.messages = req.flash();
    next();
});

// Routes
app.use('/', userRoutes);
app.use('/admin', adminRoutes);
app.use('/cart', userCartRoutes);
app.use('/auth/google',googleAuth);
app.use('/order',userOrderRoutes);
app.use('/profile',userProfileRoutes);
app.use('/wishlist',wishlistRoutes);
app.use('/wallet',walletRoutes);

// Start the server
const PORT = process.env.PORT;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server is running on port ${PORT}`);
});