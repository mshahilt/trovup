const mongoose = require('mongoose');

// Define the schema for Brand
const brandSchema = new mongoose.Schema({
    brand_name: {
        type: String,
        required: true,
        unique: true,
    },
    categories: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    }],
    isDeleted: {
        type: Boolean,
        default: false,
    },
}, {
    timestamps: true,
});

// Create the Brand model
const Brand = mongoose.model('Brand', brandSchema);

module.exports = Brand;
