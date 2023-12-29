import express from 'express';

import { scheduleUpdate } from '../controllers/scheduleController.js';

const router = express.Router();

router.post('/', scheduleUpdate);

export default router;