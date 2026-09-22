import { Router } from 'express';
import multer from 'multer';
import { requireAuth } from '../middleware/auth.js';
import {
  listCampaigns,
  createCampaign,
  getCampaignById,
  updateCampaign,
  deleteCampaign,
  uploadFrame,
  deleteFrame,
} from '../controllers/adminCampaignController.js';
import { getAnalyticsSummary } from '../controllers/analyticsController.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

// Protect all admin routes with auth middleware
router.use(requireAuth);

// Configure multer for frame upload (10MB limit, memory storage)
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10 MB
  },
  fileFilter(_req: unknown, file: Express.Multer.File, cb: multer.FileFilterCallback) {
    if (file.mimetype !== 'image/png') {
      return cb(new AppError(400, 'Invalid file format: Frame file must be a PNG image'));
    }
    cb(null, true);
  },
});

// ─── Campaigns CRUD ──────────────────────────────────────────────────────────
router.get('/campaigns', listCampaigns);
router.post('/campaigns', createCampaign);
router.get('/campaigns/:id', getCampaignById);
router.put('/campaigns/:id', updateCampaign);
router.delete('/campaigns/:id', deleteCampaign);

// ─── Campaign Frame Upload ───────────────────────────────────────────────────
router.post('/campaigns/:id/frame', upload.single('frame'), uploadFrame);
router.delete('/campaigns/:id/frame', deleteFrame);

// ─── Analytics Summary ───────────────────────────────────────────────────────
router.get('/analytics/summary', getAnalyticsSummary);

export default router;
