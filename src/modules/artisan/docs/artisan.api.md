/\*\*

- Artisan Profile Management API Endpoints
-
- Base URL: /api/artisans
  \*/

// GET /api/artisans/search
/\*\*

- @api {get} /artisans/search Search Artisans
- @apiName SearchArtisans
- @apiGroup Artisan Management
-
- @apiParam {String} [search] Search query (shop name, description, user name)
- @apiParam {String} [specialties] Comma-separated list of specialties
- @apiParam {Number} [minRating] Minimum rating (0-5)
- @apiParam {Boolean} [isVerified] Filter by verification status
- @apiParam {String} [location] Location filter
- @apiParam {String="rating","reviewCount","createdAt","followCount"} [sortBy] Sort field
- @apiParam {String="asc","desc"} [sortOrder] Sort direction
- @apiParam {Number} [page=1] Page number
- @apiParam {Number} [limit=10] Items per page (max 100)
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object} data Search results
- @apiSuccess {Object[]} data.data Array of artisan profiles
- @apiSuccess {Object} data.meta Pagination metadata
  \*/

// GET /api/artisans/top
/\*\*

- @api {get} /artisans/top Get Top Artisans
- @apiName GetTopArtisans
- @apiGroup Artisan Management
-
- @apiParam {Number} [limit=10] Maximum number of artisans to return
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object[]} data Array of top artisan profiles
  \*/

// GET /api/artisans/featured
/\*\*

- @api {get} /artisans/featured Get Featured Artisans
- @apiName GetFeaturedArtisans
- @apiGroup Artisan Management
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object[]} data Array of featured artisan profiles
  \*/

// GET /api/artisans/specialty/:specialty
/\*\*

- @api {get} /artisans/specialty/:specialty Get Artisans by Specialty
- @apiName GetArtisansBySpecialty
- @apiGroup Artisan Management
-
- @apiParam {String} specialty Specialty name
- @apiParam {Number} [limit=10] Maximum number of artisans to return
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object[]} data Array of artisan profiles
  \*/

// GET /api/artisans/profile/:id
/\*\*

- @api {get} /artisans/profile/:id Get Artisan Profile by ID
- @apiName GetArtisanProfile
- @apiGroup Artisan Management
-
- @apiParam {String} id Artisan profile ID
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object} data Artisan profile data
- @apiSuccess {String} data.id Profile ID
- @apiSuccess {String} data.userId User ID
- @apiSuccess {String} data.shopName Shop name
- @apiSuccess {String} data.shopDescription Shop description
- @apiSuccess {String} data.shopLogoUrl Shop logo URL
- @apiSuccess {String} data.shopBannerUrl Shop banner URL
- @apiSuccess {String[]} data.specialties Array of specialties
- @apiSuccess {Number} data.experience Years of experience
- @apiSuccess {String} data.website Website URL
- @apiSuccess {String} data.contactEmail Contact email
- @apiSuccess {String} data.contactPhone Contact phone
- @apiSuccess {Object} data.socialMedia Social media links
- @apiSuccess {Boolean} data.isVerified Verification status
- @apiSuccess {Number} data.rating Average rating
- @apiSuccess {Number} data.reviewCount Number of reviews
- @apiSuccess {Object} data.user User information
  \*/

// GET /api/artisans/profile/user/:userId
/\*\*

- @api {get} /artisans/profile/user/:userId Get Artisan Profile by User ID
- @apiName GetArtisanProfileByUserId
- @apiGroup Artisan Management
-
- @apiParam {String} userId User ID
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object} data Artisan profile data
  \*/

// POST /api/artisans/profile
/\*\*

- @api {post} /artisans/profile Create Artisan Profile
- @apiName CreateArtisanProfile
- @apiGroup Artisan Management
- @apiHeader {String} Authorization Bearer token
-
- @apiParam {String} shopName Shop name (3-100 characters)
- @apiParam {String} [shopDescription] Shop description (max 1000 characters)
- @apiParam {String[]} [specialties] Array of specialties (max 5)
- @apiParam {Number} [experience] Years of experience (0-100)
- @apiParam {String} [website] Website URL
- @apiParam {String} [contactEmail] Contact email
- @apiParam {String} [contactPhone] Contact phone
- @apiParam {Object} [socialMedia] Social media links
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object} data Created artisan profile
  \*/

// GET /api/artisans/profile/me
/\*\*

- @api {get} /artisans/profile/me Get My Artisan Profile
- @apiName GetMyArtisanProfile
- @apiGroup Artisan Management
- @apiHeader {String} Authorization Bearer token
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object} data Artisan profile data
  \*/

// PATCH /api/artisans/profile
/\*\*

- @api {patch} /artisans/profile Update Artisan Profile
- @apiName UpdateArtisanProfile
- @apiGroup Artisan Management
- @apiHeader {String} Authorization Bearer token (Artisan role required)
-
- @apiParam {String} [shopName] Shop name
- @apiParam {String} [shopDescription] Shop description
- @apiParam {String} [shopLogoUrl] Shop logo URL
- @apiParam {String} [shopBannerUrl] Shop banner URL
- @apiParam {String[]} [specialties] Array of specialties
- @apiParam {Number} [experience] Years of experience
- @apiParam {String} [website] Website URL
- @apiParam {String} [contactEmail] Contact email
- @apiParam {String} [contactPhone] Contact phone
- @apiParam {Object} [socialMedia] Social media links
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object} data Updated artisan profile
  \*/

// DELETE /api/artisans/profile
/\*\*

- @api {delete} /artisans/profile Delete Artisan Profile
- @apiName DeleteArtisanProfile
- @apiGroup Artisan Management
- @apiHeader {String} Authorization Bearer token (Artisan role required)
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
  \*/

// GET /api/artisans/templates
/\*\*

- @api {get} /artisans/templates Get Available Templates
- @apiName GetAvailableTemplates
- @apiGroup Artisan Management
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object[]} data Array of available templates
  \*/

// POST /api/artisans/templates/customize
/\*\*

- @api {post} /artisans/templates/customize Customize Template
- @apiName CustomizeTemplate
- @apiGroup Artisan Management
- @apiHeader {String} Authorization Bearer token (Artisan role required)
-
- @apiParam {String} templateId Template ID
- @apiParam {String} [colorScheme] Color scheme
- @apiParam {String} [fontFamily] Font family
- @apiParam {String} [layout] Layout type
- @apiParam {String} [customCss] Custom CSS
- @apiParam {String[]} [showSections] Sections to show
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object} data Template customization result
  \*/

// POST /api/artisans/upgrade-request
/\*\*

- @api {post} /artisans/upgrade-request Request Artisan Upgrade
- @apiName RequestUpgrade
- @apiGroup Artisan Management
- @apiHeader {String} Authorization Bearer token
-
- @apiParam {String} shopName Shop name
- @apiParam {String} [shopDescription] Shop description
- @apiParam {String[]} [specialties] Array of specialties
- @apiParam {Number} [experience] Years of experience
- @apiParam {String} [website] Website URL
- @apiParam {Object} [socialMedia] Social media links
- @apiParam {String} [reason] Reason for upgrade request
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object} data Upgrade request data
  \*/

// GET /api/artisans/upgrade-request/status
/\*\*

- @api {get} /artisans/upgrade-request/status Get Upgrade Request Status
- @apiName GetUpgradeRequestStatus
- @apiGroup Artisan Management
- @apiHeader {String} Authorization Bearer token
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object} data Upgrade request status
  \*/

// GET /api/artisans/stats
/\*\*

- @api {get} /artisans/stats Get Artisan Statistics
- @apiName GetArtisanStats
- @apiGroup Artisan Management
- @apiHeader {String} Authorization Bearer token (Artisan role required)
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object} data Artisan statistics
  \*/

// GET /api/artisans/admin/upgrade-requests
/\*\*

- @api {get} /artisans/admin/upgrade-requests Get Upgrade Requests (Admin)
- @apiName GetUpgradeRequests
- @apiGroup Artisan Management
- @apiHeader {String} Authorization Bearer token (Admin role required)
-
- @apiParam {String} [status] Filter by status (PENDING, APPROVED, REJECTED)
- @apiParam {Number} [page=1] Page number
- @apiParam {Number} [limit=10] Items per page
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object} data Paginated upgrade requests
  \*/

// POST /api/artisans/admin/upgrade-requests/:id/approve
/\*\*

- @api {post} /artisans/admin/upgrade-requests/:id/approve Approve Upgrade Request (Admin)
- @apiName ApproveUpgradeRequest
- @apiGroup Artisan Management
- @apiHeader {String} Authorization Bearer token (Admin role required)
-
- @apiParam {String} id Upgrade request ID
- @apiParam {String} [adminNotes] Admin notes
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object} data Updated upgrade request
  \*/

// POST /api/artisans/admin/upgrade-requests/:id/reject
/\*\*

- @api {post} /artisans/admin/upgrade-requests/:id/reject Reject Upgrade Request (Admin)
- @apiName RejectUpgradeRequest
- @apiGroup Artisan Management
- @apiHeader {String} Authorization Bearer token (Admin role required)
-
- @apiParam {String} id Upgrade request ID
- @apiParam {String} adminNotes Admin notes (required for rejection)
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object} data Updated upgrade request
  \*/

// PATCH /api/artisans/admin/verify/:profileId
/\*\*

- @api {patch} /artisans/admin/verify/:profileId Verify/Unverify Artisan (Admin)
- @apiName VerifyArtisan
- @apiGroup Artisan Management
- @apiHeader {String} Authorization Bearer token (Admin role required)
-
- @apiParam {String} profileId Artisan profile ID
- @apiParam {Boolean} isVerified Verification status
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object} data Updated artisan profile
  \*/
