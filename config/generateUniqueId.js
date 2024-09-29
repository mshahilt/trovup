const Order = require('../models/orderModel');
const { v4: uuidv4 } = require('uuid');

const generateUniqueOrderId = async () => {
    let unique = false;
    let orderId;
    

    while (!unique) {
        orderId = uuidv4().split('-')[0];
        const existingOrder = await Order.findOne({ orderId });
        unique = !existingOrder;
    }
    return orderId;
};

module.exports = generateUniqueOrderId;
