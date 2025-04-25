import { Router } from 'express';
import { validate } from '../../../../shared/middlewares/validate.middleware';
import { authenticate } from '../../../../shared/middlewares/auth.middleware';

// Follow controllers
import { FollowUserController } from '../controllers/FollowUserController';
import { UnfollowUserController } from '../controllers/UnfollowUserController';
import { GetFollowStatusController } from '../controllers/GetFollowStatusController';
import { UpdateFollowNotificationController } from '../controllers/UpdateFollowNotificationController';
import { GetFollowersController } from '../controllers/GetFollowersController';
import { GetFollowingController } from '../controllers/GetFollowingController';

// Like controllers
import { ToggleLikeController } from '../controllers/ToggleLikeController';
import { GetPostLikesController } from '../controllers/GetPostLikesController';
import { GetCommentLikesController } from '../controllers/GetCommentLikesController';

// Comment controllers
import { CreateCommentController } from '../controllers/CreateCommentController';
import { UpdateCommentController } from '../controllers/UpdateCommentController';
import { DeleteCommentController } from '../controllers/DeleteCommentController';
import { GetPostCommentsController } from '../controllers/GetPostCommentsController';
import { GetCommentRepliesController } from '../controllers/GetCommentRepliesController';

// Save posts controllers
import { SavePostController } from '../controllers/SavePostController';
import { UnsavePostController } from '../controllers/UnsavePostController';
import { GetSavedPostsController } from '../controllers/GetSavedPostsController';
import { ToggleSavePostController } from '../controllers/ToggleSavePostController';
import { CheckSavedStatusController } from '../controllers/CheckSavedStatusController';

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
import { savePostSchema, getSavedPostsQuerySchema } from '../validators/savedPost.validator';

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

// Initialize Save Post controllers
const savePostController = new SavePostController();
const unsavePostController = new UnsavePostController();
const getSavedPostsController = new GetSavedPostsController();
const toggleSavePostController = new ToggleSavePostController();
const checkSavedStatusController = new CheckSavedStatusController();

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

// Save Post routes
router.post('/', authenticate, validate(savePostSchema), savePostController.execute);
router.delete('/:postId', authenticate, unsavePostController.execute);
router.post('/toggle', authenticate, validate(savePostSchema), toggleSavePostController.execute);
router.get(
  '/',
  authenticate,
  validate(getSavedPostsQuerySchema, 'query'),
  getSavedPostsController.execute,
);
router.get('/check/:postId', authenticate, checkSavedStatusController.execute);

export default router;
