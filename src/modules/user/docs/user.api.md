/\*\*

- User Management API Endpoints
-
- Base URL: /api/users
  \*/

// GET /api/users/search
/\*\*

- @api {get} /users/search Search Users
- @apiName SearchUsers
- @apiGroup User Management
-
- @apiParam {String} [query] Search query (name, username, email)
- @apiParam {Number} [page=1] Page number
- @apiParam {Number} [limit=10] Items per page (max 100)
- @apiParam {String="ADMIN","ARTISAN","CUSTOMER"} [role] Filter by user role
- @apiParam {String="ACTIVE","INACTIVE","SUSPENDED","DELETED"} [status] Filter by user status
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object} data Search results
- @apiSuccess {Object[]} data.users Array of users
- @apiSuccess {String} data.users.id User ID
- @apiSuccess {String} data.users.username Username
- @apiSuccess {String} data.users.firstName First name
- @apiSuccess {String} data.users.lastName Last name
- @apiSuccess {String} data.users.avatarUrl Avatar URL
- @apiSuccess {String} data.users.role User role
- @apiSuccess {Number} data.total Total users found
- @apiSuccess {Number} data.page Current page
- @apiSuccess {Number} data.limit Items per page
- @apiSuccess {Number} data.totalPages Total pages
  \*/

// GET /api/users/:id
/\*\*

- @api {get} /users/:id Get User Profile
- @apiName GetUserProfile
- @apiGroup User Management
-
- @apiParam {String} id User ID
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object} data User profile data
- @apiSuccess {String} data.id User ID
- @apiSuccess {String} data.email Email address
- @apiSuccess {String} data.username Username
- @apiSuccess {String} data.firstName First name
- @apiSuccess {String} data.lastName Last name
- @apiSuccess {String} data.role User role
- @apiSuccess {String} data.status User status
- @apiSuccess {String} data.bio User bio
- @apiSuccess {String} data.avatarUrl Avatar URL
- @apiSuccess {Boolean} data.isVerified Is user verified
- @apiSuccess {Boolean} data.emailVerified Is email verified
- @apiSuccess {String} data.phone Phone number
- @apiSuccess {Number} data.followerCount Follower count
- @apiSuccess {Number} data.followingCount Following count
- @apiSuccess {Date} data.createdAt Account creation date
- @apiSuccess {Date} data.updatedAt Last update date
- @apiSuccess {Object} data.profile Extended profile information
- @apiSuccess {Object} data.artisanProfile Artisan profile (if applicable)
  \*/

// PATCH /api/users/profile
/\*\*

- @api {patch} /users/profile Update Basic Profile
- @apiName UpdateProfile
- @apiGroup User Management
- @apiHeader {String} Authorization Bearer token
-
- @apiParam {String} [firstName] First name
- @apiParam {String} [lastName] Last name
- @apiParam {String} [bio] User bio
- @apiParam {String} [phone] Phone number
- @apiParam {String} [avatarUrl] Avatar URL
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object} data Updated user data
  \*/

// GET /api/users/profile/me
/\*\*

- @api {get} /users/profile/me Get My Extended Profile
- @apiName GetMyProfile
- @apiGroup User Management
- @apiHeader {String} Authorization Bearer token
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object} data Profile data with user info
- @apiSuccess {String} data.id Profile ID
- @apiSuccess {String} data.userId User ID
- @apiSuccess {String} data.coverUrl Cover image URL
- @apiSuccess {String} data.location Location
- @apiSuccess {String} data.website Website URL
- @apiSuccess {Date} data.dateOfBirth Date of birth
- @apiSuccess {String} data.gender Gender
- @apiSuccess {Object} data.socialLinks Social media links
- @apiSuccess {Object} data.preferences User preferences
- @apiSuccess {Object} data.user User basic information
  \*/

// PATCH /api/users/profile/extended
/\*\*

- @api {patch} /users/profile/extended Update Extended Profile
- @apiName UpdateExtendedProfile
- @apiGroup User Management
- @apiHeader {String} Authorization Bearer token
-
- @apiParam {String} [coverUrl] Cover image URL
- @apiParam {String} [location] Location
- @apiParam {String} [website] Website URL
- @apiParam {Date} [dateOfBirth] Date of birth
- @apiParam {String="male","female","other","prefer_not_to_say"} [gender] Gender
- @apiParam {Object} [socialLinks] Social media links
- @apiParam {Object} [preferences] User preferences
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object} data Updated profile data
  \*/

// GET /api/users/addresses
/\*\*

- @api {get} /users/addresses Get User Addresses
- @apiName GetAddresses
- @apiGroup User Management
- @apiHeader {String} Authorization Bearer token
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object[]} data Array of addresses
- @apiSuccess {String} data.id Address ID
- @apiSuccess {String} data.fullName Full name
- @apiSuccess {String} data.phone Phone number
- @apiSuccess {String} data.street Street address
- @apiSuccess {String} data.city City
- @apiSuccess {String} data.state State
- @apiSuccess {String} data.zipCode ZIP code
- @apiSuccess {String} data.country Country
- @apiSuccess {Boolean} data.isDefault Is default address
- @apiSuccess {Date} data.createdAt Creation date
- @apiSuccess {Date} data.updatedAt Update date
  \*/

// POST /api/users/addresses
/\*\*

- @api {post} /users/addresses Create Address
- @apiName CreateAddress
- @apiGroup User Management
- @apiHeader {String} Authorization Bearer token
-
- @apiParam {String} fullName Full name
- @apiParam {String} [phone] Phone number
- @apiParam {String} street Street address
- @apiParam {String} city City
- @apiParam {String} state State
- @apiParam {String} zipCode ZIP code
- @apiParam {String} country Country
- @apiParam {Boolean} [isDefault=false] Set as default address
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object} data Created address data
  \*/

// PATCH /api/users/addresses/:id
/\*\*

- @api {patch} /users/addresses/:id Update Address
- @apiName UpdateAddress
- @apiGroup User Management
- @apiHeader {String} Authorization Bearer token
-
- @apiParam {String} id Address ID
- @apiParam {String} [fullName] Full name
- @apiParam {String} [phone] Phone number
- @apiParam {String} [street] Street address
- @apiParam {String} [city] City
- @apiParam {String} [state] State
- @apiParam {String} [zipCode] ZIP code
- @apiParam {String} [country] Country
- @apiParam {Boolean} [isDefault] Set as default address
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object} data Updated address data
  \*/

// DELETE /api/users/addresses/:id
/\*\*

- @api {delete} /users/addresses/:id Delete Address
- @apiName DeleteAddress
- @apiGroup User Management
- @apiHeader {String} Authorization Bearer token
-
- @apiParam {String} id Address ID
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
  \*/

// POST /api/users/addresses/:id/default
/\*\*

- @api {post} /users/addresses/:id/default Set Default Address
- @apiName SetDefaultAddress
- @apiGroup User Management
- @apiHeader {String} Authorization Bearer token
-
- @apiParam {String} id Address ID
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object} data Updated address data
  \*/

// GET /api/users/addresses/default
/\*\*

- @api {get} /users/addresses/default Get Default Address
- @apiName GetDefaultAddress
- @apiGroup User Management
- @apiHeader {String} Authorization Bearer token
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object} data Default address data
  \*/

// POST /api/users/:userId/follow
/\*\*

- @api {post} /users/:userId/follow Follow User
- @apiName FollowUser
- @apiGroup User Management
- @apiHeader {String} Authorization Bearer token
-
- @apiParam {String} userId User ID to follow
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object} data Follow relationship data
  \*/

// DELETE /api/users/:userId/follow
/\*\*

- @api {delete} /users/:userId/follow Unfollow User
- @apiName UnfollowUser
- @apiGroup User Management
- @apiHeader {String} Authorization Bearer token
-
- @apiParam {String} userId User ID to unfollow
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
  \*/

// GET /api/users/:userId/followers
/\*\*

- @api {get} /users/:userId/followers Get User Followers
- @apiName GetFollowers
- @apiGroup User Management
-
- @apiParam {String} userId User ID
- @apiParam {Number} [page=1] Page number
- @apiParam {Number} [limit=10] Items per page
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object} data Paginated followers data
- @apiSuccess {Object[]} data.data Array of followers
- @apiSuccess {Object} data.meta Pagination metadata
  \*/

// GET /api/users/:userId/following
/\*\*

- @api {get} /users/:userId/following Get User Following
- @apiName GetFollowing
- @apiGroup User Management
-
- @apiParam {String} userId User ID
- @apiParam {Number} [page=1] Page number
- @apiParam {Number} [limit=10] Items per page
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object} data Paginated following data
- @apiSuccess {Object[]} data.data Array of following
- @apiSuccess {Object} data.meta Pagination metadata
  \*/

// GET /api/users/:userId/follow-stats
/\*\*

- @api {get} /users/:userId/follow-stats Get Follow Statistics
- @apiName GetFollowStats
- @apiGroup User Management
-
- @apiParam {String} userId User ID
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object} data Follow statistics
- @apiSuccess {Number} data.followersCount Number of followers
- @apiSuccess {Number} data.followingCount Number of following
- @apiSuccess {Boolean} [data.isFollowing] Is current user following this user
- @apiSuccess {Boolean} [data.isFollowedBy] Is this user following current user
  \*/

// GET /api/users/activities
/\*\*

- @api {get} /users/activities Get User Activities
- @apiName GetUserActivities
- @apiGroup User Management
- @apiHeader {String} Authorization Bearer token
-
- @apiParam {String} [types] Comma-separated activity types to filter
- @apiParam {Number} [page=1] Page number
- @apiParam {Number} [limit=20] Items per page
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object} data Paginated activities data
- @apiSuccess {Object[]} data.data Array of activities
- @apiSuccess {Object} data.meta Pagination metadata
  \*/

// GET /api/users/activities/stats
/\*\*

- @api {get} /users/activities/stats Get Activity Statistics
- @apiName GetActivityStats
- @apiGroup User Management
- @apiHeader {String} Authorization Bearer token
-
- @apiParam {Number} [days=30] Number of days to analyze
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object} data Activity statistics by type
  \*/

// DELETE /api/users/account
/\*\*

- @api {delete} /users/account Delete Account
- @apiName DeleteAccount
- @apiGroup User Management
- @apiHeader {String} Authorization Bearer token
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
  \*/
