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

// Wishlist controllers
import { AddToWishlistController } from '../controllers/wishlist/AddToWishlistController';
import { RemoveFromWishlistController } from '../controllers/wishlist/RemoveFromWishlistController';
import { ToggleWishlistController } from '../controllers/wishlist/ToggleWishlistController';
import { GetWishlistController } from '../controllers/wishlist/GetWishlistController';
import { CheckWishlistStatusController } from '../controllers/wishlist/CheckWishlistStatusController';

// Validators
import { likeToggleSchema, likeQuerySchema } from '../validators/like.validator';
import {
  createCommentSchema,
  updateCommentSchema,
  commentQuerySchema,
} from '../validators/comment.validator';
import {
  addToWishlistSchema,
  getWishlistSchema,
  wishlistItemParamsSchema,
} from '../validators/wishlist.validator';

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

// THAY ĐỔI: Wishlist controllers thay vì SavedPost
const addToWishlistController = new AddToWishlistController();
const removeFromWishlistController = new RemoveFromWishlistController();
const toggleWishlistController = new ToggleWishlistController();
const getWishlistController = new GetWishlistController();
const checkWishlistStatusController = new CheckWishlistStatusController();

// LIKE ROUTES
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

// COMMENT ROUTES
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

// WISHLIST ROUTES
// Add to wishlist
router.post(
  '/wishlist',
  authenticate,
  validate(addToWishlistSchema),
  addToWishlistController.execute,
);

// Remove from wishlist
router.delete(
  '/wishlist/:itemType/:itemId',
  authenticate,
  validate(wishlistItemParamsSchema, 'params'),
  removeFromWishlistController.execute,
);

// Toggle wishlist item
router.post(
  '/wishlist/toggle',
  authenticate,
  validate(addToWishlistSchema),
  toggleWishlistController.execute,
);

// Get wishlist items
router.get(
  '/wishlist',
  authenticate,
  validate(getWishlistSchema, 'query'),
  getWishlistController.execute,
);

// Check wishlist status
router.get(
  '/wishlist/check/:itemType/:itemId',
  authenticate,
  validate(wishlistItemParamsSchema, 'params'),
  checkWishlistStatusController.execute,
);

export default router;
