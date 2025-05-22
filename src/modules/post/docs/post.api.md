GET /api/posts # Get all posts (public, with filters)
GET /api/posts/slug/:slug # Get post by slug
GET /api/posts/:id # Get post by ID
POST /api/posts # Create post (auth required)
PATCH /api/posts/:id # Update post (auth required)
DELETE /api/posts/:id # Delete post (auth required)
POST /api/posts/:id/publish # Publish draft post (auth required)
POST /api/posts/:id/archive # Archive published post (auth required)
GET /api/posts/user/me # Get my posts (auth required)
GET /api/posts/feed/followed # Get followed posts feed (auth required)
