import asyncHandler from 'express-async-handler';
import Rating from '../models/Rating.js';

// @desc    Submit a new rating
// @route   POST /submit
// @access  Public (called by Unity)
const submitRating = asyncHandler(async (req, res) => {
  const { sessionToken, userId, sceneId, imageId, rate } = req.body;

  if (!sessionToken || !userId || !sceneId || !imageId || rate === undefined) {
    res.status(400);
    throw new Error('Missing required rating fields');
  }

  const newRating = await Rating.create({
    sessionToken,
    userId,
    sceneId,
    imageId,
    rate
  });

  res.status(201).json({ message: 'Rating submitted successfully', ratingId: newRating._id });
});

export { submitRating };
