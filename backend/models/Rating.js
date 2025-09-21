import mongoose from 'mongoose';

const ratingSchema = new mongoose.Schema({
  sessionToken: { type: String, required: true },
  userId: { type: String, required: true },
  sceneId: { type: String, required: true },
  imageId: { type: String, required: true },
  rate: { type: Number, required: true },
  submittedAt: { type: Date, default: Date.now }
});

const Rating = mongoose.model('Rating', ratingSchema);

export default Rating;
