import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate } from '../../../../shared/middlewares/auth.middleware';
import { validateIdParam } from '../../../../shared/middlewares/request-validation.middleware';

// Like controllers
import { ToggleLikeController } from '../controllers/like/ToggleLikeController';
import { GetPostLikesController } from '../controllers/like/GetPostLikesController';
import { GetCommentLikesController } from '../controllers/like/GetCommentLikesController';

// Comment controllers
import { CreateCommentController } from '../controllers/comment/CreateCommentController';
import { UpdateCommentController } from '../controllers/comment/UpdateCommentController';
import { DeleteCommentController } from '../controllers/comment/DeleteCommentController';
import { GetPostCommentsController } from '../controllers/comment/GetPostCommentsController';
import { GetCommentRepliesController } from '../controllers/comment/GetCommentRepliesController';

// SavedPost controllers
import { SavePostController } from '../controllers/savedPost/SavePostController';
import { UnsavePostController } from '../controllers/savedPost/UnsavePostController';
import { GetSavedPostsController } from '../controllers/savedPost/GetSavedPostsController';
import { ToggleSavePostController } from '../controllers/savedPost/ToggleSavePostController';
import { CheckSavedStatusController } from '../controllers/savedPost/CheckSavedStatusController';

// Validators
import { likeToggleSchema, likeQuerySchema } from '../validators/like.validator';
import {
  createCommentSchema,
  updateCommentSchema,
  commentQuerySchema,
} from '../validators/comment.validator';
import { savePostSchema, getSavedPostsQuerySchema } from '../validators/savedPost.validator';

const router = Router();

// Initialize controllers
const toggleLikeController = new ToggleLikeController();
const getPostLikesController = new GetPostLikesController();
const getCommentLikesController = new GetCommentLikesController();

const createCommentController = new CreateCommentController();
const updateCommentController = new UpdateCommentController();
const deleteCommentController = new DeleteCommentController();
const getPostCommentsController = new GetPostCommentsController();
const getCommentRepliesController = new GetCommentRepliesController();

const savePostController = new SavePostController();
const unsavePostController = new UnsavePostController();
const getSavedPostsController = new GetSavedPostsController();
const toggleSavePostController = new ToggleSavePostController();
const checkSavedStatusController = new CheckSavedStatusController();

// === LIKE ROUTES ===
// Toggle like (post or comment)
router.post('/like', authenticate, validate(likeToggleSchema), toggleLikeController.execute);

// Get post likes
router.get(
  '/posts/:postId/likes',
  validateIdParam('postId'),
  validate(likeQuerySchema, 'query'),
  getPostLikesController.execute,
);

// Get comment likes
router.get(
  '/comments/:commentId/likes',
  validateIdParam('commentId'),
  validate(likeQuerySchema, 'query'),
  getCommentLikesController.execute,
);

// === COMMENT ROUTES ===
// Create comment
router.post(
  '/comments',
  authenticate,
  validate(createCommentSchema),
  createCommentController.execute,
);

// Update comment
router.patch(
  '/comments/:id',
  authenticate,
  validateIdParam(),
  validate(updateCommentSchema),
  updateCommentController.execute,
);

// Delete comment
router.delete('/comments/:id', authenticate, validateIdParam(), deleteCommentController.execute);

// Get post comments
router.get(
  '/posts/:postId/comments',
  validateIdParam('postId'),
  validate(commentQuerySchema, 'query'),
  getPostCommentsController.execute,
);

// Get comment replies
router.get(
  '/comments/:commentId/replies',
  validateIdParam('commentId'),
  validate(commentQuerySchema, 'query'),
  getCommentRepliesController.execute,
);

// === SAVED POSTS ROUTES ===
// Save post
router.post('/saved-posts', authenticate, validate(savePostSchema), savePostController.execute);

// Unsave post
router.delete(
  '/saved-posts/:postId',
  authenticate,
  validateIdParam('postId'),
  unsavePostController.execute,
);

// Toggle save post
router.post(
  '/saved-posts/toggle',
  authenticate,
  validate(savePostSchema),
  toggleSavePostController.execute,
);

// Get saved posts
router.get(
  '/saved-posts',
  authenticate,
  validate(getSavedPostsQuerySchema, 'query'),
  getSavedPostsController.execute,
);

// Check saved status
router.get(
  '/saved-posts/check/:postId',
  authenticate,
  validateIdParam('postId'),
  checkSavedStatusController.execute,
);

export default router;
