/**
 * Enum định nghĩa tất cả các loại sự kiện trong hệ thống
 */
export enum EventType {
  // User events
  USER_REGISTERED = 'user.registered',
  USER_LOGGED_IN = 'user.loggedIn',
  USER_UPDATED = 'user.updated',
  USER_DELETED = 'user.deleted',
  USER_EMAIL_VERIFIED = 'user.emailVerified',
  USER_PASSWORD_CHANGED = 'user.passwordChanged',
  USER_PASSWORD_RESET = 'user.passwordReset',

  // Post events
  POST_CREATED = 'post.created',
  POST_UPDATED = 'post.updated',
  POST_PUBLISHED = 'post.published',
  POST_ARCHIVED = 'post.archived',
  POST_DELETED = 'post.deleted',
  POST_LIKED = 'post.liked',
  POST_UNLIKED = 'post.unliked',
  POST_COMMENTED = 'post.commented',
  POST_SAVED = 'post.saved',
  POST_UNSAVED = 'post.unsaved',
  POST_VIEWED = 'post.viewed',

  // Social events
  USER_FOLLOWED = 'user.followed',
  USER_UNFOLLOWED = 'user.unfollowed',
  COMMENT_CREATED = 'comment.created',
  COMMENT_UPDATED = 'comment.updated',
  COMMENT_DELETED = 'comment.deleted',
  COMMENT_REPLIED = 'comment.replied',
  COMMENT_LIKED = 'comment.liked',
  COMMENT_UNLIKED = 'comment.unliked',

  // Artisan events
  ARTISAN_PROFILE_CREATED = 'artisan.profileCreated',
  ARTISAN_PROFILE_UPDATED = 'artisan.profileUpdated',
  UPGRADE_REQUEST_SUBMITTED = 'artisan.upgradeRequestSubmitted',
  UPGRADE_REQUEST_APPROVED = 'artisan.upgradeRequestApproved',
  UPGRADE_REQUEST_REJECTED = 'artisan.upgradeRequestRejected',
  TEMPLATE_GENERATED = 'artisan.templateGenerated',

  // Product events
  PRODUCT_CREATED = 'product.created',
  PRODUCT_UPDATED = 'product.updated',
  PRODUCT_DELETED = 'product.deleted',
  PRODUCT_VIEWED = 'product.viewed',
  PRODUCT_REVIEW_CREATED = 'product.reviewCreated',
  PRODUCT_REVIEW_UPDATED = 'product.reviewUpdated',
  PRODUCT_REVIEW_DELETED = 'product.reviewDeleted',

  // Quote & Order events
  QUOTE_REQUESTED = 'quote.requested',
  QUOTE_RESPONDED = 'quote.responded',
  QUOTE_ACCEPTED = 'quote.accepted',
  QUOTE_REJECTED = 'quote.rejected',
  QUOTE_EXPIRED = 'quote.expired',
  ORDER_CREATED = 'order.created',
  ORDER_PAID = 'order.paid',
  ORDER_STATUS_CHANGED = 'order.statusChanged',
  ORDER_COMPLETED = 'order.completed',
  ORDER_CANCELLED = 'order.cancelled',
  CART_ITEM_ADDED = 'cart.itemAdded',
  CART_ITEM_REMOVED = 'cart.itemRemoved',

  // Notification events
  NOTIFICATION_CREATED = 'notification.created',
  NOTIFICATION_READ = 'notification.read',
  NOTIFICATION_DELETED = 'notification.deleted',

  // Message events
  MESSAGE_SENT = 'message.sent',
  MESSAGE_READ = 'message.read',

  // System events
  ANALYTICS_UPDATED = 'system.analyticsUpdated',
  SYSTEM_ERROR = 'system.error',
}

/**
 * Interface định nghĩa kiểu dữ liệu cho từng loại sự kiện
 */
export interface EventData {
  // User events
  [EventType.USER_REGISTERED]: {
    userId: string;
    email: string;
    username: string;
  };

  [EventType.USER_LOGGED_IN]: {
    userId: string;
    username: string;
    ipAddress?: string;
    userAgent?: string;
  };

  [EventType.USER_UPDATED]: {
    userId: string;
    updatedFields: string[];
  };

  [EventType.USER_DELETED]: {
    userId: string;
  };

  [EventType.USER_EMAIL_VERIFIED]: {
    userId: string;
    email: string;
  };

  [EventType.USER_PASSWORD_CHANGED]: {
    userId: string;
  };

  [EventType.USER_PASSWORD_RESET]: {
    userId: string;
    email: string;
  };

  // Post events
  [EventType.POST_CREATED]: {
    postId: string;
    userId: string;
    title: string;
    type: string;
    status: string;
  };

  [EventType.POST_UPDATED]: {
    postId: string;
    userId: string;
    title: string;
    updatedFields: string[];
  };

  [EventType.POST_PUBLISHED]: {
    postId: string;
    authorId: string;
    authorName: string;
    title: string;
    slug?: string;
  };

  [EventType.POST_ARCHIVED]: {
    postId: string;
    userId: string;
    title: string;
  };

  [EventType.POST_DELETED]: {
    postId: string;
    userId: string;
    title: string;
  };

  [EventType.POST_LIKED]: {
    postId: string;
    postOwnerId: string;
    likerId: string;
    likerName: string;
    postTitle: string;
    reaction: string;
  };

  [EventType.POST_UNLIKED]: {
    postId: string;
    postOwnerId: string;
    userId: string;
    postTitle: string;
  };

  [EventType.POST_COMMENTED]: {
    postId: string;
    postOwnerId: string;
    commenterId: string;
    commenterName: string;
    commentId: string;
    postTitle: string;
    commentContent: string;
  };

  [EventType.POST_SAVED]: {
    postId: string;
    userId: string;
    postTitle: string;
  };

  [EventType.POST_UNSAVED]: {
    postId: string;
    userId: string;
  };

  [EventType.POST_VIEWED]: {
    postId: string;
    userId?: string;
    isAuthenticated: boolean;
  };

  // Social events
  [EventType.USER_FOLLOWED]: {
    followerId: string;
    followerName: string;
    followingId: string;
    followingName: string;
    notifyNewPosts: boolean;
  };

  [EventType.USER_UNFOLLOWED]: {
    followerId: string;
    followingId: string;
  };

  [EventType.COMMENT_CREATED]: {
    commentId: string;
    postId: string;
    userId: string;
    content: string;
    parentId?: string;
  };

  [EventType.COMMENT_UPDATED]: {
    commentId: string;
    userId: string;
    content: string;
  };

  [EventType.COMMENT_DELETED]: {
    commentId: string;
    postId: string;
    userId: string;
  };

  [EventType.COMMENT_REPLIED]: {
    parentCommentId: string;
    parentCommentOwnerId: string;
    replyId: string;
    replierId: string;
    replierName: string;
    postId: string;
    postTitle: string;
    replyContent: string;
  };

  [EventType.COMMENT_LIKED]: {
    commentId: string;
    commentOwnerId: string;
    likerId: string;
    likerName: string;
    postId: string;
    reaction: string;
  };

  [EventType.COMMENT_UNLIKED]: {
    commentId: string;
    commentOwnerId: string;
    userId: string;
  };

  // Artisan events
  [EventType.ARTISAN_PROFILE_CREATED]: {
    profileId: string;
    userId: string;
    shopName: string;
  };

  [EventType.ARTISAN_PROFILE_UPDATED]: {
    profileId: string;
    userId: string;
    shopName: string;
    updatedFields: string[];
  };

  [EventType.UPGRADE_REQUEST_SUBMITTED]: {
    requestId: string;
    userId: string;
    shopName: string;
  };

  [EventType.UPGRADE_REQUEST_APPROVED]: {
    requestId: string;
    userId: string;
    shopName: string;
    adminId?: string;
    adminNotes?: string;
  };

  [EventType.UPGRADE_REQUEST_REJECTED]: {
    requestId: string;
    userId: string;
    shopName: string;
    adminId?: string;
    adminNotes: string;
  };

  [EventType.TEMPLATE_GENERATED]: {
    userId: string;
    templateId: string;
    templateStyle: string;
  };

  // Product events
  [EventType.PRODUCT_CREATED]: {
    productId: string;
    sellerId: string;
    name: string;
    price: number;
  };

  [EventType.PRODUCT_UPDATED]: {
    productId: string;
    sellerId: string;
    name: string;
    updatedFields: string[];
  };

  [EventType.PRODUCT_DELETED]: {
    productId: string;
    sellerId: string;
    name: string;
  };

  [EventType.PRODUCT_VIEWED]: {
    productId: string;
    sellerId: string;
    userId?: string;
    isAuthenticated: boolean;
  };

  [EventType.PRODUCT_REVIEW_CREATED]: {
    reviewId: string;
    productId: string;
    sellerId: string;
    userId: string;
    rating: number;
    title?: string;
    comment?: string;
  };

  [EventType.PRODUCT_REVIEW_UPDATED]: {
    reviewId: string;
    productId: string;
    userId: string;
    rating: number;
    updatedFields: string[];
  };

  [EventType.PRODUCT_REVIEW_DELETED]: {
    reviewId: string;
    productId: string;
    sellerId: string;
    userId: string;
  };

  // Quote & Order events
  [EventType.QUOTE_REQUESTED]: {
    quoteId: string;
    productId: string;
    customerId: string;
    artisanId: string;
    requestedPrice?: number;
    specifications?: string;
  };

  [EventType.QUOTE_RESPONDED]: {
    quoteId: string;
    productId: string;
    customerId: string;
    artisanId: string;
    counterOffer?: number;
    status: string;
  };

  [EventType.QUOTE_ACCEPTED]: {
    quoteId: string;
    productId: string;
    customerId: string;
    artisanId: string;
    finalPrice: number;
  };

  [EventType.QUOTE_REJECTED]: {
    quoteId: string;
    productId: string;
    customerId: string;
    artisanId: string;
  };

  [EventType.QUOTE_EXPIRED]: {
    quoteId: string;
    productId: string;
    customerId: string;
    artisanId: string;
  };

  [EventType.ORDER_CREATED]: {
    orderId: string;
    orderNumber: string;
    customerId: string;
    totalAmount: number;
    items: {
      productId: string;
      sellerId: string;
      quantity: number;
      price: number;
    }[];
  };

  [EventType.ORDER_PAID]: {
    orderId: string;
    orderNumber: string;
    customerId: string;
    paymentMethod: string;
    totalAmount: number;
  };

  [EventType.ORDER_STATUS_CHANGED]: {
    orderId: string;
    orderNumber: string;
    customerId: string;
    oldStatus: string;
    newStatus: string;
    note?: string;
    changedBy?: string;
  };

  [EventType.ORDER_COMPLETED]: {
    orderId: string;
    orderNumber: string;
    customerId: string;
    totalAmount: number;
    items: {
      productId: string;
      sellerId: string;
    }[];
  };

  [EventType.ORDER_CANCELLED]: {
    orderId: string;
    orderNumber: string;
    customerId: string;
    reason?: string;
    cancelledBy: string;
  };

  [EventType.CART_ITEM_ADDED]: {
    userId: string;
    productId: string;
    sellerId: string;
    quantity: number;
  };

  [EventType.CART_ITEM_REMOVED]: {
    userId: string;
    productId: string;
    sellerId: string;
  };

  // Notification events
  [EventType.NOTIFICATION_CREATED]: {
    notificationId: string;
    userId: string;
    type: string;
    title: string;
    content: string;
    relatedUserId?: string;
    relatedEntityId?: string;
    relatedEntityType?: string;
  };

  [EventType.NOTIFICATION_READ]: {
    notificationId: string;
    userId: string;
  };

  [EventType.NOTIFICATION_DELETED]: {
    notificationId: string;
    userId: string;
  };

  // Message events
  [EventType.MESSAGE_SENT]: {
    messageId: string;
    senderId: string;
    recipientId: string;
    content: string;
    hasAttachments: boolean;
  };

  [EventType.MESSAGE_READ]: {
    messageId: string;
    senderId: string;
    recipientId: string;
  };

  // System events
  [EventType.ANALYTICS_UPDATED]: {
    entityType: string;
    entityId: string;
    metricType: string;
    value: number;
  };

  [EventType.SYSTEM_ERROR]: {
    errorCode: string;
    message: string;
    stackTrace?: string;
    moduleName?: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
  };
}

/**
 * Type helper để truy xuất dữ liệu sự kiện theo đúng kiểu
 */
export type EventDataType<T extends EventType> = EventData[T];

/**
 * Type helper để định nghĩa callback handler cho một sự kiện cụ thể
 */
export type EventHandler<T extends EventType> = (data: EventDataType<T>) => void | Promise<void>;
