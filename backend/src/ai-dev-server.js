// Standalone server for testing the AI routes before the main backend (Developer 2) is ready.
// Run: npm run dev:ai   — delete this file once ai.routes.js is mounted in app.js.
require('dotenv').config();
const express = require('express');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());
app.use('/api/ai', require('./routes/ai.routes'));

const port = process.env.PORT || 4000;
app.listen(port, () =>
  console.log(`AI dev server on http://localhost:${port} (mock mode: ${process.env.AI_MOCK === 'true' || !process.env.GEMMA_API_KEY})`)
);
