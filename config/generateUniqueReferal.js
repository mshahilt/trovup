const User = require('../models/userModel');
const { v4: uuidv4 } = require('uuid');

const generateUniqueRefferalId = async () => {
    let unique = false;
    let referralId;
    
    while (!unique) {
        referralId = uuidv4().split('-')[0]; 
        const existingReferralId = await User.findOne({ referralId }); 
        unique = !existingReferralId; 
    }
    return referralId;
};

module.exports = generateUniqueRefferalId;
