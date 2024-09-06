const mongoose = require('mongoose');
const User = require('../models/userModel');
const Products = require('../models/productModel');
const Address = require('../models/addressModel');
const Cart = require('../models/cartModel');
const bcrypt = require('bcrypt');   
const Order = require('../models/orderModel'); 

// GET user profile
exports.user_profileGET = async (req, res) => {
    try {
        const userId = req.session.user.user;
        const user = await User.findOne({_id: userId});
        const isUserLoggedIn = req.session.user;
        res.render('user/profile', { user , title:'Profile Info', layout:'layouts/homeLayout',isUserLoggedIn});
    } catch (error) {
        console.log('Error occurred while loading user profile', error);
        res.status(500).send('Error occurred');
    }
};

// POST update user profile
exports.user_profileEditPOST = async (req, res) => {
    try {
        const { firstName, lastName, phone } = req.body;
        const userId = req.session.user.user;

        await User.updateOne({ _id: userId }, {
            $set: {
                username: firstName,
                phone_number: phone
            }
        });

        res.status(200).json({ success: true, message: 'Profile updated successfully!' });
    } catch (error) {
        console.log('Error occurred while updating profile', error);
        res.status(500).json({ success: false, message: 'Error updating profile' });
    }
};

exports.user_password_change = async (req,res) => {
    const { oldPassword, newPassword } = req.body;
    const userId = req.session.user.user;
  
    if (!oldPassword || !newPassword) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
  
    try {
      const user = await User.findById(userId);
  
      if (!user) {
        return res.status(404).json({ success: false, message: 'User not found' });
      }
  
      const isMatch = await bcrypt.compare(oldPassword, user.password);
      if (!isMatch) {
        return res.status(400).json({ success: false, message: 'Old password is incorrect' });
      }

      const salt = await bcrypt.genSalt(10);
      const hashedPassword = await bcrypt.hash(newPassword, salt);

      user.password = hashedPassword;
      await user.save();
  
      res.json({ success: true, message: 'Password successfully changed' });
    } catch (error) {
      console.error(error);
      res.status(500).json({ success: false, message: 'Server error' });
    }
}