import { get } from 'lodash';
import { Router } from 'express';
import { authenticate, authorize } from '../../../../shared/middlewares/auth.middleware';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { validateIdParam } from '../../../../shared/middlewares/request-validation.middleware';
import { GetAllPostsController } from '../controllers/admin/GetAllPostsController';
import { UpdatePostStatusController } from '../controllers/admin/UpdatePostStatusController';
import { DeletePostController } from '../controllers/admin/DeletePostController';
import { getPostsQuerySchema } from '../validators/post.validator';
import Joi from 'joi';

const router = Router();

// Initialize controllers
const getAllPostsController = new GetAllPostsController();
const updatePostStatusController = new UpdatePostStatusController();
const deletePostController = new DeletePostController();

// Validation schema
const updatePostStatusSchema = Joi.object({
  status: Joi.string().valid('PUBLISHED', 'ARCHIVED', 'DELETED').required(),
});

// Apply authentication and authorization middleware
router.use(authenticate);
router.use(authorize(['ADMIN']));

// Routes
router.get('/', validate(getPostsQuerySchema, 'query'), getAllPostsController.execute);

router.patch(
  '/:id/status',
  validateIdParam(),
  validate(updatePostStatusSchema),
  updatePostStatusController.execute,
);

router.delete('/:id', validateIdParam(), deletePostController.execute);

export default router;
