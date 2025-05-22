# Product endpoints

GET /api/products # Get all products (public, with filters)
GET /api/products/slug/:slug # Get product by slug
GET /api/products/:id # Get product by ID
GET /api/products/featured/list # Get featured products
GET /api/products/:id/related # Get related products
GET /api/products/search/query # Search products
GET /api/products/:id/price-history # Get price history
GET /api/products/my/products # Get my products (artisan auth)
GET /api/products/my/stats # Get product stats (artisan auth)
POST /api/products # Create product (artisan auth)
PATCH /api/products/:id # Update product (artisan auth)
DELETE /api/products/:id # Delete product (artisan auth)
PATCH /api/products/:id/price # Update price (artisan auth)
POST /api/products/:id/publish # Publish product (artisan auth)
POST /api/products/:id/unpublish # Unpublish product (artisan auth)

# Category endpoints

GET /api/categories # Get all categories (public)
GET /api/categories/tree # Get category tree (public)
GET /api/categories/slug/:slug # Get category by slug (public)
GET /api/categories/:id # Get category by ID (public)
GET /api/categories/:id/products # Get products by category (public)
POST /api/categories # Create category (admin auth)
PATCH /api/categories/:id # Update category (admin auth)
DELETE /api/categories/:id # Delete category (admin auth)
POST /api/categories/reorder # Reorder categories (admin auth)
POST /api/categories/:id/move # Move category (admin auth)
