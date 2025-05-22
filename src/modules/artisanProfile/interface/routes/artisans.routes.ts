import { Router } from 'express';
import { GetArtisansController } from '../controllers/GetArtisansController';

const router = Router();
const getArtisansController = new GetArtisansController();

// Route to get artisans with pagination and filtering
router.get('/', getArtisansController.execute);

export default router;
