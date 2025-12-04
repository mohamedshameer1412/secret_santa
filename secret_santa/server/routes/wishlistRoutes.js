const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/auth');
const asyncHandler = require('../utils/asyncHandler');
const AppError = require('../utils/AppError');
const Wishlist = require('../models/Wishlist');

// @route   GET /api/wishlist
// @desc    Get user's wishlist
// @access  Private
router.get('/', protect, asyncHandler(async (req, res) => {
  let wishlist = await Wishlist.findOne({ userId: req.user.id });
  
  // Create wishlist with sample data if doesn't exist
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
  
  res.json({
    success: true,
    items: wishlist.items
  });
}));

// @route   POST /api/wishlist
// @desc    Add item to wishlist
// @access  Private
router.post('/', protect, asyncHandler(async (req, res) => {
  const { title, description, link, image, important } = req.body;
  
  if (!title || !title.trim()) {
    throw new AppError('Title is required', 400);
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
    success: true,
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
}));

// @route   PUT /api/wishlist/:itemId
// @desc    Update wishlist item
// @access  Private
router.put('/:itemId', protect, asyncHandler(async (req, res) => {
  const { title, description, link, image, important } = req.body;
  
  const wishlist = await Wishlist.findOne({ userId: req.user.id });
  
  if (!wishlist) {
    throw new AppError('Wishlist not found', 404);
  }
  
  const item = wishlist.items.id(req.params.itemId);
  
  if (!item) {
    throw new AppError('Item not found', 404);
  }
  
  // Update fields only if provided
  if (title !== undefined) item.title = title.trim();
  if (description !== undefined) item.description = description;
  if (link !== undefined) item.link = link;
  if (image !== undefined) item.image = image;
  if (important !== undefined) item.important = important;
  
  await wishlist.save();
  
  res.json({
    success: true,
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
}));

// @route   DELETE /api/wishlist/:itemId
// @desc    Delete wishlist item
// @access  Private
router.delete('/:itemId', protect, asyncHandler(async (req, res) => {
  const wishlist = await Wishlist.findOne({ userId: req.user.id });
  
  if (!wishlist) {
    throw new AppError('Wishlist not found', 404);
  }
  
  const item = wishlist.items.id(req.params.itemId);
  
  if (!item) {
    throw new AppError('Item not found', 404);
  }
  
  wishlist.items.pull(req.params.itemId);
  await wishlist.save();
  
  res.json({
    success: true,
    message: 'Item deleted successfully'
  });
}));

module.exports = router;