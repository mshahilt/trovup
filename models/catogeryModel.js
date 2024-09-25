const mongoose = require('mongoose');

const categorySchema = new mongoose.Schema({
    category_name: { type: String, required: true },
    isDeleted: { type: Boolean, default: false },
    offer: { type: mongoose.Schema.Types.ObjectId, ref: 'Offer' } 
}, {
    timestamps: true
});

const Category = mongoose.model('Category', categorySchema);

module.exports = Category;
