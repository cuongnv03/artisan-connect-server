import { Router } from 'express';
import { validate } from '../middlewares/validate.middleware';
import { authenticate } from '../middlewares/auth.middleware';

// Follow controllers
import { FollowUserController } from '../controllers/social/FollowUserController';
import { UnfollowUserController } from '../controllers/social/UnfollowUserController';
import { GetFollowStatusController } from '../controllers/social/GetFollowStatusController';
import { UpdateFollowNotificationController } from '../controllers/social/UpdateFollowNotificationController';
import { GetFollowersController } from '../controllers/social/GetFollowersController';
import { GetFollowingController } from '../controllers/social/GetFollowingController';

// Like controllers
import { ToggleLikeController } from '../controllers/social/ToggleLikeController';
import { GetPostLikesController } from '../controllers/social/GetPostLikesController';
import { GetCommentLikesController } from '../controllers/social/GetCommentLikesController';

// Comment controllers
import { CreateCommentController } from '../controllers/social/CreateCommentController';
import { UpdateCommentController } from '../controllers/social/UpdateCommentController';
import { DeleteCommentController } from '../controllers/social/DeleteCommentController';
import { GetPostCommentsController } from '../controllers/social/GetPostCommentsController';
import { GetCommentRepliesController } from '../controllers/social/GetCommentRepliesController';

// Validators
import {
  followUserSchema,
  updateNotificationSchema,
  followQuerySchema,
} from '../validators/follow.validator';

import { likeToggleSchema, likeQuerySchema } from '../validators/like.validator';
import {
  createCommentSchema,
  updateCommentSchema,
  commentQuerySchema,
} from '../validators/comment.validator';

const router = Router();

// Initialize Follow controllers
const followUserController = new FollowUserController();
const unfollowUserController = new UnfollowUserController();
const getFollowStatusController = new GetFollowStatusController();
const updateFollowNotificationController = new UpdateFollowNotificationController();
const getFollowersController = new GetFollowersController();
const getFollowingController = new GetFollowingController();

// Initialize Like controllers
const toggleLikeController = new ToggleLikeController();
const getPostLikesController = new GetPostLikesController();
const getCommentLikesController = new GetCommentLikesController();

// Initialize Comment controllers
const createCommentController = new CreateCommentController();
const updateCommentController = new UpdateCommentController();
const deleteCommentController = new DeleteCommentController();
const getPostCommentsController = new GetPostCommentsController();
const getCommentRepliesController = new GetCommentRepliesController();

// Follow routes
router.post('/follow', authenticate, validate(followUserSchema), followUserController.execute);

router.delete('/follow/:userId', authenticate, unfollowUserController.execute);

router.get('/follow/:userId/status', authenticate, getFollowStatusController.execute);

router.patch(
  '/follow/:userId/notification',
  authenticate,
  validate(updateNotificationSchema),
  updateFollowNotificationController.execute,
);

router.get(
  '/users/:userId/followers',
  validate(followQuerySchema, 'query'),
  getFollowersController.execute,
);

router.get(
  '/users/:userId/following',
  validate(followQuerySchema, 'query'),
  getFollowingController.execute,
);

// Like routes
router.post('/like', authenticate, validate(likeToggleSchema), toggleLikeController.execute);

router.get(
  '/posts/:postId/likes',
  validate(likeQuerySchema, 'query'),
  getPostLikesController.execute,
);

router.get(
  '/comments/:commentId/likes',
  validate(likeQuerySchema, 'query'),
  getCommentLikesController.execute,
);

// Comment routes
router.post(
  '/comments',
  authenticate,
  validate(createCommentSchema),
  createCommentController.execute,
);

router.patch(
  '/comments/:id',
  authenticate,
  validate(updateCommentSchema),
  updateCommentController.execute,
);

router.delete('/comments/:id', authenticate, deleteCommentController.execute);

router.get(
  '/posts/:postId/comments',
  validate(commentQuerySchema, 'query'),
  getPostCommentsController.execute,
);

router.get(
  '/comments/:commentId/replies',
  validate(commentQuerySchema, 'query'),
  getCommentRepliesController.execute,
);

export default router;
