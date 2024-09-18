const User = require('../models/userModel');

// Middleware to check if the user is logged in
exports.isLoggedIn = async (req, res, next) => {
  try {
    if (req.session.user) {
      const userId = req.session.user.user;
      const user = await User.findOne({ _id: userId });

      if (user && user.isBlock) {
        req.session.destroy();
        return res.redirect('/login');
      } 
      
      return next();
    } else {
      return res.redirect('/login');
    }
  } catch (error) {
    console.error(error.message);
    return res.redirect('/error'); // Redirect to an error page
  }
};

// Middleware to check if the user is blocked for accessing the home page
exports.isBlockForHome = async (req, res, next) => {
  try {
    if (req.session.user && req.session.user.user) {
      const userId = req.session.user.user;
      const user = await User.findOne({ _id: userId });

      if (user && user.isBlock) {
        req.session.destroy();
        return res.redirect('/login');
      }
    }
    
    return next();
  } catch (error) {
    console.error(error.message);
    return res.redirect('/error'); // Add error handling
  }
};

// Middleware to check if the user is logged out
exports.isLoggedOut = async (req, res, next) => {
  try {
    if (req.session.user) {
      return res.redirect('/');
    } else {
      return next();
    }
  } catch (error) {
    console.error(error.message);
    return res.redirect('/error'); // Add error handling
  }
};

// Middleware to confirm if the OTP session exists
exports.otpConfirm = async (req, res, next) => {
  try {
    if (req.session.email) {
      return next();
    } else {
      return res.redirect('/login');
    }
  } catch (error) {
    console.error(error.message);
    return res.redirect('/error'); // Add error handling
  }
};
