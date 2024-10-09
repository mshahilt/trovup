const mongoose = require('mongoose');
const User = require('../models/userModel');
const Products = require('../models/productModel');
const Address = require('../models/addressModel');
const Cart = require('../models/cartModel');
const sendMail = require('../config/sendMail');
const nodemailer = require('nodemailer');
const bcrypt = require('bcrypt');   
const OTP = require('../models/otpModels');
const Order = require('../models/orderModel'); 


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

async function resendOTP(userId) {
    try {
        const user = await User.findById(userId);

        if (!user) {
            throw new Error('User not found');
        }

        const otp = Math.floor(1000 + Math.random() * 9000); // Generate a random 4-digit OTP
        const otpExpiresAt = Date.now() + 180000; // Set OTP expiration time (3 minutes)

        // Store the OTP and expiration in the database
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

        return true;

    } catch (error) {
        console.error('Error while resending OTP:', error);
        throw new Error('Server error while resending OTP');
    }
}
exports.forgot_password = async (req, res) => {
    try {
        if (!req.session || !req.session.user) {
            return res.status(401).json({ success: false, message: 'Unauthorized. Please log in again.' });
        }

        const userId = req.session.user.user;
        const user = await User.findById(userId);
        const { email } = req.body;
        if (email === user.email) {
            await resendOTP(userId);
            return res.status(200).json({ success: true, message: 'OTP sent successfully to your email.' });
        } else {
            return res.status(400).json({ success: false, message: 'Email does not match with our records.' });
        }
    } catch (error) {
        console.error('Error occurred while processing forgot password:', error);
        return res.status(500).json({ success: false, message: 'An error occurred while processing your request. Please try again later.' });
    }
};

    exports.verifyOtpPOST = async (req,res) => {
        const{otp1, otp2, otp3, otp4} = req.body;
        const otp = otp1 + otp2 + otp3 + otp4;

        const userId = req.session.user.user;
        try{
            const otpRecord = await OTP.findOne({userId})

            if(!otpRecord){
                return res.status(404).json({success:false, message:'OTP not found'})
            }
            if (otpRecord.expiresAt < Date.now()) {
                await OTP.deleteOne({ userId });
                return res.status(400).json({ success: false, message: 'OTP has expired.' });
            }
            if (otpRecord.otp !== otp) {
                return res.status(400).json({ success: false, message: 'Invalid OTP.' });
            }
            await OTP.deleteOne({ _id: otpRecord._id });

            req.session.user = {
                ...req.session.user,
                verifiedByOtp: true
            };
            return res.status(200).json({
                success: true,
                message: 'OTP verified successfully!',
            });

        }catch(error){
            console.log('erroc occured while verifying otp post')
        }
    }
exports.forgetPassVerifyOtpGET = async (req,res) => {
    try{
         // Check if the user session exists
        if (!req.session.user) {
            req.flash('error', 'Session expired. Please register again.');
            return res.redirect('/register');
        }

        res.render('user/forgetPasswordOtpVerification', {
            title: 'Verify OTP',
            messages: req.flash(),
            layout: 'layouts/authLayout'
        });
    }catch(error){
        console.log('error occured while loading forget pass in user side')
    }
}

exports.changePasswordGET = async (req,res) => {
    try{
        const isUserLoggedIn = req.session.user;
        if(req.session?.user?.verifiedByOtp === true){
        res.render('user/changePassword',{title:'Change Password',layout:'layouts/homeLayout',isUserLoggedIn});
        }else{
            res.redirect('/');
        }
       
    }catch(error){
        console.log('error occured while changing forgotten password',error)
    }
}
exports.changePasswordPOST = async (req, res) => {
    try {
        const { password } = req.body; 
        const userId = req.session.user?.user; 
        
        if (!userId) {
            return res.status(400).json({ success: false, message: 'User not logged in or session expired' });
        }

        if (!password || password.length < 6) {
            return res.status(400).json({ success: false, message: 'Password must be at least 6 characters long' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.findByIdAndUpdate(userId, { password: hashedPassword }, { new: true });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        req.session.user = {
            ...req.session.user,
            verifiedByOtp: false
        };

        return res.status(200).json({ success: true, message: 'Password updated successfully' });
    } catch (error) {
        console.error('Error occurred while posting new forgotten password:', error);
        return res.status(500).json({ success: false, message: 'An error occurred while updating the password' });
    }
};

let isUserLoggedIn;
exports.addressBookGET = async (req, res) => {
    try {
        isUserLoggedIn = req.session.user;
        const address = await Address.find({ userId: req.session.user.user });
        const addresses = address.filter((address)=>{
            if(address.isDelete === false){
                return address
            }
        })
        res.render('user/addressBook', { addresses , title: 'Adress Book', layout:'layouts/homeLayout',isUserLoggedIn});
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}

exports.addressEditGET = async (req, res) => {
    try{
        const address = await Address.findById(req.params.id);
        if (!address) {
            return res.status(404).send('Address not found');
        }
        res.render('user/editAddress', { address , title: 'Adress Book', layout:'layouts/homeLayout',isUserLoggedIn});
    }catch(error){
        console.error(err);
        res.status(500).send('Server Error');
    }
}

exports.addressEditPOST = async (req, res) => {
    try{
        await Address.findByIdAndUpdate(req.params.id, {
            fullName: req.body.fullName,
            streetAddress: req.body.streetAddress,
            apartment: req.body.apartment,
            city: req.body.city,
            phoneNumber: req.body.phoneNumber,
            emailAddress: req.body.emailAddress
        });
        res.redirect('/profile/addresses');
    }catch(error){
        console.error(err);
        res.status(500).send('Server Error');
    }
}

exports.deleteAddressPOST = async (req, res) => {
    try {
        const address = await Address.findById(req.params.id);
        address.isDelete = true;
        await address.save();
        res.redirect('/profile/addresses');
    } catch (err) {
        console.error(err);
        res.status(500).send('Server Error');
    }
}