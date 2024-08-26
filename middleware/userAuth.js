const User = require('../models/userModel');
exports.isLoggedIn = async(req,res,next) => {
  try {
       
      if (req.session.user)  {
      const userId = req.session.userId
     
        const user = await User.findOne({_id : userId})
        console.log('sdewirohfjkds',user)
        if (user.isBlock) {
            req.session.destroy();
            res.redirect('/login')
        }else{
            next();
        }
      
      }else{
          res.redirect('/login')
      }
  } catch (error) {
      console.log(error.message);
  }
}

exports.isLoggedOut = async(req, res, next) =>{
  try {
      if (req.session.user ) {
          res.redirect('/');
      } else {
          next()
      }
  } catch (error) {
      console.log(error.message);
  }
}

exports.otpConfirm = async (req, res,next) =>{
    try {
        if(req.session.email){
           next()
        }else{
         res.redirect('/login')   
        }
    } catch (error) {
        console.log(error.message);
    }
}