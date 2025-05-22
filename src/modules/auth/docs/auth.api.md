/\*\*

- Authentication API Endpoints
-
- Base URL: /api/auth
  \*/

// POST /api/auth/register
/\*\*

- @api {post} /auth/register Register User
- @apiName RegisterUser
- @apiGroup Authentication
-
- @apiParam {String} email User's email address
- @apiParam {String} [username] User's username (optional, auto-generated if not provided)
- @apiParam {String} password User's password (min 8 characters)
- @apiParam {String} firstName User's first name
- @apiParam {String} lastName User's last name
- @apiParam {String="CUSTOMER","ARTISAN"} [role=CUSTOMER] User's role
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object} data User data (without password)
- @apiSuccess {String} data.id User ID
- @apiSuccess {String} data.email User email
- @apiSuccess {String} data.username User username
- @apiSuccess {String} data.firstName User first name
- @apiSuccess {String} data.lastName User last name
- @apiSuccess {String} data.role User role
- @apiSuccess {String} data.status User status
- @apiSuccess {Boolean} data.isVerified Is user verified
- @apiSuccess {Boolean} data.emailVerified Is email verified
- @apiSuccess {Date} data.createdAt Account creation date
-
- @apiError {Boolean} success=false Error status
- @apiError {String} error Error code
- @apiError {String} message Error message
  \*/

// POST /api/auth/login
/\*\*

- @api {post} /auth/login Login User
- @apiName LoginUser
- @apiGroup Authentication
-
- @apiParam {String} emailOrUsername User's email or username
- @apiParam {String} password User's password
- @apiParam {Boolean} [rememberMe=false] Remember user for extended period
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object} data Login data
- @apiSuccess {Object} data.user User information
- @apiSuccess {String} data.user.id User ID
- @apiSuccess {String} data.user.email User email
- @apiSuccess {String} data.user.username User username
- @apiSuccess {String} data.user.firstName User first name
- @apiSuccess {String} data.user.lastName User last name
- @apiSuccess {String} data.user.role User role
- @apiSuccess {String} data.user.avatarUrl User avatar URL
- @apiSuccess {String} data.accessToken JWT access token
-
- @apiError {Boolean} success=false Error status
- @apiError {String} error Error code
- @apiError {String} message Error message
  \*/

// POST /api/auth/logout
/\*\*

- @api {post} /auth/logout Logout User
- @apiName LogoutUser
- @apiGroup Authentication
-
- @apiParam {String} [refreshToken] Refresh token (optional if sent via cookie)
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
  \*/

// POST /api/auth/refresh-token
/\*\*

- @api {post} /auth/refresh-token Refresh Access Token
- @apiName RefreshToken
- @apiGroup Authentication
-
- @apiParam {String} [refreshToken] Refresh token (optional if sent via cookie)
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object} data Token data
- @apiSuccess {String} data.accessToken New access token
-
- @apiError {Boolean} success=false Error status
- @apiError {String} error Error code
- @apiError {String} message Error message
  \*/

// POST /api/auth/forgot-password
/\*\*

- @api {post} /auth/forgot-password Request Password Reset
- @apiName ForgotPassword
- @apiGroup Authentication
-
- @apiParam {String} email User's email address
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
  \*/

// POST /api/auth/reset-password
/\*\*

- @api {post} /auth/reset-password Reset Password
- @apiName ResetPassword
- @apiGroup Authentication
-
- @apiParam {String} token Password reset token
- @apiParam {String} newPassword New password (min 8 characters)
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
-
- @apiError {Boolean} success=false Error status
- @apiError {String} error Error code
- @apiError {String} message Error message
  \*/

// GET /api/auth/verify-email/:token
/\*\*

- @api {get} /auth/verify-email/:token Verify Email
- @apiName VerifyEmail
- @apiGroup Authentication
-
- @apiParam {String} token Email verification token
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
-
- @apiError {Boolean} success=false Error status
- @apiError {String} error Error code
- @apiError {String} message Error message
  \*/

// POST /api/auth/send-verification-email
/\*\*

- @api {post} /auth/send-verification-email Send Verification Email
- @apiName SendVerificationEmail
- @apiGroup Authentication
- @apiHeader {String} Authorization Bearer token
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
-
- @apiError {Boolean} success=false Error status
- @apiError {String} error Error code
- @apiError {String} message Error message
  \*/

// GET /api/auth/me
/\*\*

- @api {get} /auth/me Get Current User
- @apiName GetCurrentUser
- @apiGroup Authentication
- @apiHeader {String} Authorization Bearer token
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
- @apiSuccess {Object} data User data
- @apiSuccess {String} data.id User ID
- @apiSuccess {String} data.email User email
- @apiSuccess {String} data.username User username
- @apiSuccess {String} data.firstName User first name
- @apiSuccess {String} data.lastName User last name
- @apiSuccess {String} data.role User role
- @apiSuccess {String} data.status User status
- @apiSuccess {String} data.bio User bio
- @apiSuccess {String} data.avatarUrl User avatar URL
- @apiSuccess {Boolean} data.isVerified Is user verified
- @apiSuccess {Boolean} data.emailVerified Is email verified
- @apiSuccess {String} data.phone User phone
- @apiSuccess {Number} data.followerCount Follower count
- @apiSuccess {Number} data.followingCount Following count
- @apiSuccess {Date} data.createdAt Account creation date
- @apiSuccess {Date} data.updatedAt Last update date
-
- @apiError {Boolean} success=false Error status
- @apiError {String} error Error code
- @apiError {String} message Error message
  \*/

// POST /api/auth/change-password
/\*\*

- @api {post} /auth/change-password Change Password
- @apiName ChangePassword
- @apiGroup Authentication
- @apiHeader {String} Authorization Bearer token
-
- @apiParam {String} currentPassword Current password
- @apiParam {String} newPassword New password (min 8 characters)
-
- @apiSuccess {Boolean} success Success status
- @apiSuccess {String} message Success message
-
- @apiError {Boolean} success=false Error status
- @apiError {String} error Error code
- @apiError {String} message Error message
  \*/
