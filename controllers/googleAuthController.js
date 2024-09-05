const User = require('../models/userModel');

exports.callBackSuccess = (req, res) => {
    
    const userSession = req.session.passport.user;
    req.session.user = {
     user:userSession._id,
        username: userSession.username,
        email: userSession.email,
    };
    console.log(req.session.user.user,'sfajfsahfd');
    console.log(req.session.user,'prrrr');

    console.log(req.session.user,'dasasfdasfasfa');
    res.redirect('/')
};

exports.callBackFailure = (req,res) => {
    res.send('Failed to authanticate with google')
}