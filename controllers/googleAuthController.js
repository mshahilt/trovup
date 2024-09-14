const User = require('../models/userModel');

exports.callBackSuccess = (req, res) => {
    
    const userSession = req.session.passport.user;
    req.session.user = {
     user:userSession._id,
        username: userSession.username,
        email: userSession.email,
    };
    res.redirect('/')
};

exports.callBackFailure = (req,res) => {
    res.send('Failed to authanticate with google')
}