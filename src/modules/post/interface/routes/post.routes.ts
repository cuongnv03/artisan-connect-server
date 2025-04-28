import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate } from '../../../../shared/middlewares/auth.middleware';

// Controllers
import { CreatePostController } from '../controllers/CreatePostController';
import { UpdatePostController } from '../controllers/UpdatePostController';
import { GetPostController } from '../controllers/GetPostController';
import { GetPostBySlugController } from '../controllers/GetPostBySlugController';
import { DeletePostController } from '../controllers/DeletePostController';
import { PublishPostController } from '../controllers/PublishPostController';
import { ArchivePostController } from '../controllers/ArchivePostController';
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
const getPostsController = new GetPostsController();
const getMyPostsController = new GetMyPostsController();
const getFollowedPostsController = new GetFollowedPostsController();

// Public routes
router.get('/', validate(getPostsQuerySchema, 'query'), getPostsController.execute);
router.get('/slug/:slug', getPostBySlugController.execute);
router.get('/:id', getPostController.execute);

// Protected routes - require authentication
router.post('/', authenticate, validate(createPostSchema), createPostController.execute);

router.patch('/:id', authenticate, validate(updatePostSchema), updatePostController.execute);

router.delete('/:id', authenticate, deletePostController.execute);

router.post('/:id/publish', authenticate, publishPostController.execute);

router.post('/:id/archive', authenticate, archivePostController.execute);

router.get(
  '/feed/followed',
  authenticate,
  validate(getPostsQuerySchema, 'query'),
  getFollowedPostsController.execute,
);

router.get(
  '/user/me',
  authenticate,
  validate(getMyPostsQuerySchema, 'query'),
  getMyPostsController.execute,
);

export default router;
