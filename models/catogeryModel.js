const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    category_name: { type: String, required: true },
    isDeleted: { type: Boolean, default: false }
}, {
    timestamps: true // Add timestamps option
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
