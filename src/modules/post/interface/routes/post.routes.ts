import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate } from '../../../../shared/middlewares/auth.middleware';
import { validateIdParam } from '../../../../shared/middlewares/request-validation.middleware';

// Controllers
import { CreatePostController } from '../controllers/CreatePostController';
import { UpdatePostController } from '../controllers/UpdatePostController';
import { GetPostController } from '../controllers/GetPostController';
import { GetPostBySlugController } from '../controllers/GetPostBySlugController';
import { DeletePostController } from '../controllers/DeletePostController';
import { PublishPostController } from '../controllers/PublishPostController';
import { ArchivePostController } from '../controllers/ArchivePostController';
import { RepublishPostController } from '../controllers/RepublishPostController';
import { GetPostsController } from '../controllers/GetPostsController';
import { GetMyPostsController } from '../controllers/GetMyPostsController';
import { GetFollowedPostsController } from '../controllers/GetFollowedPostsController';

// Validators
import {
  createPostSchema,
  updatePostSchema,
  getPostsQuerySchema,
  getMyPostsQuerySchema,
} from '../validators/post.validator';

const router = Router();

// Initialize controllers
const createPostController = new CreatePostController();
const updatePostController = new UpdatePostController();
const getPostController = new GetPostController();
const getPostBySlugController = new GetPostBySlugController();
const deletePostController = new DeletePostController();
const publishPostController = new PublishPostController();
const archivePostController = new ArchivePostController();
const republishPostController = new RepublishPostController();
const getPostsController = new GetPostsController();
const getMyPostsController = new GetMyPostsController();
const getFollowedPostsController = new GetFollowedPostsController();

// === PUBLIC ROUTES ===
// Get posts (public with optional filtering)
router.get('/', validate(getPostsQuerySchema, 'query'), getPostsController.execute);

// Get post by slug (public)
router.get('/slug/:slug', getPostBySlugController.execute);

// Get post by ID (public)
router.get('/:id', validateIdParam(), getPostController.execute);

// === PROTECTED ROUTES ===
// Create post
router.post('/', authenticate, validate(createPostSchema), createPostController.execute);

// Update post
router.patch(
  '/:id',
  authenticate,
  validateIdParam(),
  validate(updatePostSchema),
  updatePostController.execute,
);

// Delete post
router.delete('/:id', authenticate, validateIdParam(), deletePostController.execute);

// Publish post
router.post('/:id/publish', authenticate, validateIdParam(), publishPostController.execute);

// Archive post
router.post('/:id/archive', authenticate, validateIdParam(), archivePostController.execute);

// Republish post
router.post('/:id/republish', authenticate, validateIdParam(), republishPostController.execute);

// Get my posts
router.get(
  '/user/me',
  authenticate,
  validate(getMyPostsQuerySchema, 'query'),
  getMyPostsController.execute,
);

// Get followed posts (feed)
router.get(
  '/feed/followed',
  authenticate,
  validate(getPostsQuerySchema, 'query'),
  getFollowedPostsController.execute,
);

export default router;
