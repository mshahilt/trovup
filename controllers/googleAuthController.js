const User = require('../models/userModel');

exports.callBackSuccess = (req, res) => {
    res.redirect('/')
};

exports.callBackFailure = (req,res) => {
    res.send('Failed to authanticate with google')
}