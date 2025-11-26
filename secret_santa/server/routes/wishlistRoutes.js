const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const Wishlist = require('../models/Wishlist');

// @route   GET /api/wishlist
// @desc    Get user's wishlist
// @access  Private
router.get('/', protect, async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ userId: req.user.id });
    
    if (!wishlist) {
      wishlist = new Wishlist({
        userId: req.user.id,
        items: [
          {
            title: "A Good Book",
            description: "Any motivational or fiction novel.",
            link: "https://www.goodreads.com/",
            image: "https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400&q=80",
            important: false
          },
          {
            title: "Cozy Socks",
            description: "Warm and soft socks for winter.",
            link: "",
            image: "https://images.unsplash.com/photo-1586350977771-b3b0abd50c82?w=400&q=80",
            important: false
          }
        ]
      });
      await wishlist.save();
    }
    
    res.json({ items: wishlist.items });
  } catch (error) {
    console.error('Error fetching wishlist:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   POST /api/wishlist
// @desc    Add item to wishlist
// @access  Private
router.post('/', protect, async (req, res) => {
  try {
    const { title, description, link, image, important } = req.body;
    
    if (!title || !title.trim()) {
      return res.status(400).json({ message: 'Title is required' });
    }
    
    let wishlist = await Wishlist.findOne({ userId: req.user.id });
    
    if (!wishlist) {
      wishlist = new Wishlist({ userId: req.user.id, items: [] });
    }
    
    const newItem = {
      title: title.trim(),
      description: description || '',
      link: link || '',
      image: image || '',
      important: important || false
    };
    
    wishlist.items.push(newItem);
    await wishlist.save();
    
    const addedItem = wishlist.items[wishlist.items.length - 1];
    res.status(201).json({ 
      message: 'Item added successfully',
      item: {
        _id: addedItem._id,
        title: addedItem.title,
        description: addedItem.description,
        link: addedItem.link,
        image: addedItem.image,
        important: addedItem.important
      }
    });
  } catch (error) {
    console.error('Error adding item:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   PUT /api/wishlist/:itemId
// @desc    Update wishlist item
// @access  Private
router.put('/:itemId', protect, async (req, res) => {
  try {
    const { title, description, link, image, important } = req.body;
    
    const wishlist = await Wishlist.findOne({ userId: req.user.id });
    
    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }
    
    const item = wishlist.items.id(req.params.itemId);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    // Update fields only if provided
    if (title !== undefined) item.title = title.trim();
    if (description !== undefined) item.description = description;
    if (link !== undefined) item.link = link;
    if (image !== undefined) item.image = image;
    if (important !== undefined) item.important = important;
    
    await wishlist.save();
    
    res.json({ 
      message: 'Item updated successfully',
      item: {
        _id: item._id,
        title: item.title,
        description: item.description,
        link: item.link,
        image: item.image,
        important: item.important
      }
    });
  } catch (error) {
    console.error('Error updating item:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

// @route   DELETE /api/wishlist/:itemId
// @desc    Delete wishlist item
// @access  Private
router.delete('/:itemId', protect, async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ userId: req.user.id });
    
    if (!wishlist) {
      return res.status(404).json({ message: 'Wishlist not found' });
    }
    
    const item = wishlist.items.id(req.params.itemId);
    
    if (!item) {
      return res.status(404).json({ message: 'Item not found' });
    }
    
    wishlist.items.pull(req.params.itemId);
    await wishlist.save();
    
    res.json({ message: 'Item deleted successfully' });
  } catch (error) {
    console.error('Error deleting item:', error);
    res.status(500).json({ message: 'Server error', error: error.message });
  }
});

module.exports = router;