import { Router } from 'express';
import multer from 'multer';
import { authenticate } from '../../../../shared/middlewares/auth.middleware';
import { UploadController } from '../controllers/UploadController';

const router = Router();
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png',
      'image/webp',
      'image/gif',
      'video/mp4',
      'video/webm',
      'video/quicktime',
    ];

    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type'), false);
    }
  },
});

const uploadController = new UploadController();

// Upload image
router.post('/image', authenticate, upload.single('file'), uploadController.execute);

// Upload video
router.post('/video', authenticate, upload.single('file'), uploadController.execute);

// Upload multiple files
router.post('/multiple', authenticate, upload.array('files', 10), async (req, res, next) => {
  try {
    // Handle multiple file uploads
    res.json({ success: true, message: 'Multiple upload endpoint' });
  } catch (error) {
    next(error);
  }
});

export default router;
