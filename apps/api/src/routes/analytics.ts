import { Router } from 'express';
import { trackEvent } from '../controllers/analyticsController.js';

const router = Router();

router.post('/', trackEvent);

export default router;
