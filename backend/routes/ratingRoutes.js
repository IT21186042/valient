import express from 'express';
import { submitRating } from '../controllers/ratingController.js';

const router = express.Router();

router.post('/submit', submitRating); // Matches the Unity URL

export default router;
