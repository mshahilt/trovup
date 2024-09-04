const mongoose = require('mongoose');

// Define the schema for Products
const productSchema = new mongoose.Schema({
    product_name: {
        type: String,
        required: true,
        unique: true,
    },
    category_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Category',
        required: true,
    },
    brand_id: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Brand',
        required: true,
    },
    images: {
        type: [String], 
        default: [], 
    },
    product_description: {
        type: String,
        required: true
    },
    product_highlights: {
        type: String,
        required: true
    },
    isDelete: {
        type: Boolean,
        default: false
    },
    variants: [{
        price: {
            type: Number,
            required: true,
        },
        storage_size: {
            type: String,
            default:null,
            required: true,
        },
        stock: {
            type: Number,
            required: true,
        },
        color: {
            type: String,
            required: true
        },
        images: [{ // Array to handle multiple images for each variant
            type: String,
            required: false
        }]
    }]
}, {
    timestamps: true,
});

// Create and export the model
const Products = mongoose.model('Products', productSchema);

module.exports = Products;
