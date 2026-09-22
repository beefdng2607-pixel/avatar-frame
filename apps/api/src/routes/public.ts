import { Router } from 'express';
import { getCampaignBySlug } from '../controllers/publicCampaignController.js';

const router = Router();

router.get('/:slug', getCampaignBySlug);

export default router;
