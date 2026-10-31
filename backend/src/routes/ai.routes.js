// AI routes — Developer 3
// Mount in app.js with: app.use('/api/ai', require('./routes/ai.routes'));
const express = require('express');
const multer = require('multer');
const ai = require('../controllers/ai.controller');

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

// Turn multer errors (e.g. file too large) into our standard error shape
const uploadImage = (req, res, next) =>
  upload.single('image')(req, res, (err) => {
    if (err) return res.status(400).json({ success: false, data: null, message: err.message });
    next();
  });

router.post('/analyze-product', uploadImage, ai.analyzeProduct);
router.post('/recommend-plan', ai.recommendPlan);

module.exports = router;
