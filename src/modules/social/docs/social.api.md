# Like endpoints

POST /api/social/like # Toggle like post/comment (auth required)
GET /api/social/posts/:postId/likes # Get post likes
GET /api/social/comments/:commentId/likes # Get comment likes

# Comment endpoints

POST /api/social/comments # Create comment (auth required)
PATCH /api/social/comments/:id # Update comment (auth required)
DELETE /api/social/comments/:id # Delete comment (auth required)
GET /api/social/posts/:postId/comments # Get post comments
GET /api/social/comments/:commentId/replies # Get comment replies

# Saved posts endpoints

POST /api/social/saved-posts # Save post (auth required)
DELETE /api/social/saved-posts/:postId # Unsave post (auth required)
POST /api/social/saved-posts/toggle # Toggle save post (auth required)
GET /api/social/saved-posts # Get saved posts (auth required)
GET /api/social/saved-posts/check/:postId # Check saved status (auth required)
