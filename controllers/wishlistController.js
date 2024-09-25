const Wishlist = require("../models/wishlistModel");
const User = require("../models/userModel");

// GET: Wishlist Page
exports.wishlistGET = async (req, res) => {
    try {
        if (req.session.user) {
            const userId = req.session.user.user;
            const wishlist = await Wishlist.findOne({ user_id: userId }).populate('items.product');

            if (wishlist && wishlist.items.length > 0) {
                for (let item of wishlist.items) {
                    // Find the variant based on variantId stored as a string
                    const variant = item.product.variants.find(v => v._id.toString() === item.variantId);

                    console.log(variant, 'from loop in wishlist');
                }
            }

            const isUserLoggedIn = req.session.user;
            // Render or send the data to the front-end
            // res.json(wishlist);
            res.render('user/wishlist', { wishListData: wishlist ? wishlist.items : [], title: 'Wishlist', isUserLoggedIn, layout: 'layouts/homeLayout' });
        } else {
            req.flash('error', 'You need to log in to access your wishlist.');
            res.redirect('/login');
        }
    } catch (error) {
        console.error("Error in wishlistGET:", error);
        res.status(500).send('An error occurred while loading the wishlist page.');
    }
};

// POST Add product to wishlist
exports.postWishlist = async (req, res) => {
    try {
        const userId = req.session.user.user; 
        const { variantId } = req.body;
        const productId = req.params.id;
    
        console.log(req.body, 'inside wishlist post function');
    
        const userData = await User.findById(userId);
        let wishlist = await Wishlist.findOne({ user_id: userData._id });
    
        if (!wishlist) {
            wishlist = new Wishlist({
                user_id: userData._id,
                items: [{
                    product: productId,
                    variantId: variantId
                }]
            });
        } else {

            const existingItem = wishlist.items.find(item => 
                item.product.toString() === productId && item.variantId === variantId
            );

            if (existingItem) {
                return res.status(400).json({ success: false, message: "Product variant is already in your wishlist" });
            }

            wishlist.items.push({
                product: productId,
                variantId: variantId
            });
        }

        await wishlist.save();
    
        res.status(200).json({ success: true, message: "Product variant added to wishlist" });
    
    } catch (error) {
        console.error("Error in postWishlist:", error);
        res.status(500).json({ success: false, message: "Something went wrong on the server" });
    }
};
// DELETE: Remove product from wishlist
exports.deleteWishlist = async (req, res) => {
    try {
      console.log('dlt function called in wishlist controller');
  
      const { wishlistItemId } = req.body; // Now we accept the item ID
      const user_id = req.session.user.user;
  
      if (!user_id) {
        return res.status(401).json({ success: false, message: 'User not logged in' });
      }
  
      const result = await Wishlist.updateOne(
        { user_id: user_id },
        { $pull: { items: { _id: wishlistItemId } } } // Use the item ID directly
      );
  
      console.log(result, 'result inside deleteWishlist');
  
      if (result.modifiedCount === 0) {
        return res.status(404).json({ success: false, message: 'Item not found in wishlist or already deleted' });
      }
  
      res.json({ success: true, message: 'Item removed from wishlist' });
    } catch (error) {
      console.error("Error in deleteWishlist:", error);
      res.status(500).json({ success: false, message: "Something went wrong on the server" });
    }
  };
  