# Artisan Connect - Backend API

## 📋 Table of Contents

- [Overview](#overview)
- [Features](#features)
- [Architecture](#architecture)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
  - [Prerequisites](#prerequisites)
  - [Installation](#installation)
  - [Environment Variables](#environment-variables)
  - [Database Setup](#database-setup)
- [Project Structure](#project-structure)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Core Concepts](#core-concepts)
  - [Dependency Injection](#dependency-injection)
  - [Error Handling](#error-handling)
  - [Event System](#event-system)
- [Development](#development)
  - [Coding Standards](#coding-standards)
  - [Testing](#testing)
- [Deployment](#deployment)
- [Contributing](#contributing)
- [License](#license)

## Overview

Artisan Connect is a specialized social commerce platform designed specifically for artisans and craftspeople. It combines the best aspects of social media and e-commerce to create a unique ecosystem where artisans can build their brand, share their creative journey, and sell their handcrafted products with flexible pricing and customization options.

The platform focuses on storytelling, artisan branding, and dynamic negotiation - features particularly valuable in the handcraft industry where products are often unique and pricing can be flexible.

## Features

### User & Authentication
- Complete user authentication flow (register, login, refresh token)
- Password management (change, reset, forgot)
- Email verification
- Profile management with detailed user information
- Multi-role support (Customer, Artisan, Admin)

### Artisan Profiles
- Customizable shop profiles with templates
- Template generation with AI assistance
- Artisan-specific information (specialties, experience, etc.)
- Upgrade request system (Customer → Artisan)

### Social Features
- Follow system for users and artisans
- Rich content posting with structured blog-style content
- Social engagement (likes, comments, saves)
- Notifications for social interactions

### E-commerce
- Product catalog management
- Category organization
- Flexible pricing system
- Quote request system for price negotiation
- Cart and checkout process
- Order management
- Product reviews and ratings

### Address & Shipping
- Multiple address management
- Default shipping address
- Address validation

### Real-time Features
- Real-time notifications
- Messaging system
- Live status updates

### Analytics
- View tracking
- Engagement metrics
- Performance analytics

## Architecture

Artisan Connect follows a modular architecture pattern, organized by domain with clear separation of concerns. The application is structured following clean architecture principles:

- **Domain Layer**: Core business entities and interfaces
- **Application Layer**: Business logic and use cases
- **Infrastructure Layer**: External services and database interactions
- **Interface Layer**: Controllers, routes, and validators

This design facilitates:
- Independent development of modules
- Maintainability and testability
- Potential transition to microservices

## Tech Stack

### Core
- **Node.js** - JavaScript runtime
- **Express** - Web framework
- **TypeScript** - Type-safe JavaScript
- **Prisma ORM** - Database toolkit
- **PostgreSQL** - Primary database

### Authentication & Security
- **JWT** - JSON Web Tokens for authentication
- **Bcrypt** - Password hashing
- **Helmet** - HTTP security headers
- **Cors** - Cross-Origin Resource Sharing

### Validation & Error Handling
- **Joi** - Schema validation
- **Custom error handling middleware**

### Storage & Media
- **Cloudinary** - Cloud media storage and transformation

### Communication
- **Nodemailer** - Email service integration

### Performance & Logging
- **Redis** (planned) - Caching and real-time features
- **Custom logging system**

### Development & Quality
- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Jest** (planned) - Testing

## Getting Started

### Prerequisites

- Node.js (v18.x or later)
- npm (v9.x or later)
- PostgreSQL (v14.x or later)
- Git

### Installation

1. Clone the repository:
   ```bash
   git clone https://github.com/your-organization/artisan-connect-backend.git
   cd artisan-connect-backend
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Set up environment variables (see [Environment Variables](#environment-variables) section)

4. Generate Prisma client:
   ```bash
   npx prisma generate
   ```

5. Run database migrations:
   ```bash
   npx prisma migrate dev
   ```

6. Start the development server:
   ```bash
   npm run dev
   ```

### Environment Variables

Create a `.env` file in the root directory with the following variables:

```
# Server
PORT=5000
NODE_ENV=development
API_PREFIX=/api

# Database
DATABASE_URL="postgresql://postgres:password@localhost:5432/artisan_connect?schema=public"

# JWT
JWT_ACCESS_SECRET=your_access_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_ACCESS_EXPIRATION=15m
JWT_REFRESH_EXPIRATION=7d

# Cookie
COOKIE_SECRET=your_cookie_secret

# CORS
CORS_ORIGIN=http://localhost:3000

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM_NAME=Artisan Connect
EMAIL_FROM_ADDRESS=noreply@artisanconnect.com
CLIENT_URL=http://localhost:3000
```

Adjust values according to your development environment.

### Database Setup

1. Create a PostgreSQL database:
   ```sql
   CREATE DATABASE artisan_connect;
   ```

2. Run Prisma migrations to set up the schema:
   ```bash
   npx prisma migrate dev
   ```

3. (Optional) Seed the database with initial data:
   ```bash
   npm run seed
   ```

4. (Optional) Explore your database with Prisma Studio:
   ```bash
   npx prisma studio
   ```

## Project Structure

```
src/
├── config/                 # Configuration settings
├── core/                   # Core functionality
│   ├── database/           # Database connections
│   ├── di/                 # Dependency injection
│   ├── errors/             # Error handling
│   ├── events/             # Event system
│   ├── infrastructure/     # External services
│   │   ├── ai/             # AI features
│   │   ├── email/          # Email services
│   │   ├── security/       # Authentication & security
│   │   └── storage/        # Storage services
│   ├── logging/            # Logging system
│   └── schedulers/         # Scheduled tasks
├── modules/                # Business modules
│   ├── analytics/          # Analytics module
│   ├── artisanProfile/     # Artisan profile module
│   ├── cart/               # Shopping cart module
│   ├── notification/       # Notifications module
│   ├── order/              # Order management module
│   ├── post/               # Content posting module
│   ├── product/            # Product module
│   ├── profile/            # User profile module
│   ├── quote/              # Quote negotiations module
│   ├── review/             # Reviews module
│   ├── social/             # Social features module
│   ├── system/             # System settings module
│   └── user/               # User & authentication module
└── shared/                 # Shared code
    ├── baseClasses/        # Base abstract classes
    ├── interfaces/         # Common interfaces
    ├── middlewares/        # Express middlewares
    └── utils/              # Utility functions
app.ts                      # Express application setup
index.ts                    # Entry point
routes.ts                   # Route registration
```

Each module typically contains:
- `models/` - Domain entities and DTOs
- `repositories/` - Data access layer
- `services/` - Business logic
- `interface/` - Controllers, routes, and validators

## API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| POST | /auth/register | Register new user |
| POST | /auth/login | Authenticate user |
| POST | /auth/logout | End user session |
| POST | /auth/refresh-token | Refresh access token |
| POST | /auth/forgot-password | Request password reset |
| POST | /auth/reset-password | Reset password with token |
| GET | /auth/verify-email/:token | Verify email address |
| POST | /auth/send-verification-email | Request new verification email |
| GET | /auth/me | Get current user |
| POST | /auth/change-password | Change password |

### User Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /users/:id | Get user profile |
| PATCH | /users/profile | Update user details |
| DELETE | /users/account | Delete account |
| GET | /users/search | Search users |

### Profile Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /profiles/me | Get own profile |
| PATCH | /profiles/me | Update profile |
| GET | /profiles/users/:userId | Get profile by user ID |
| GET | /profiles/addresses | Get user addresses |
| POST | /profiles/addresses | Create address |
| PATCH | /profiles/addresses/:id | Update address |
| DELETE | /profiles/addresses/:id | Delete address |
| POST | /profiles/addresses/:id/default | Set address as default |
| GET | /profiles/addresses/default | Get default address |

### Artisan Profile Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | /artisan-profiles/templates | Get template options |
| GET | /artisan-profiles/:id | Get artisan profile |
| GET | /artisan-profiles/user/:userId | Get artisan profile by user ID |
| POST | /artisan-profiles | Create artisan profile |
| GET | /artisan-profiles | Get own artisan profile |
| PATCH | /artisan-profiles | Update artisan profile |
| POST | /artisan-profiles/generate-template | Generate custom template |
| POST | /artisan-profiles/upgrade-request | Request artisan upgrade |
| GET | /artisan-profiles/upgrade-request/status | Check upgrade request status |
| GET | /artisan-profiles/upgrade-requests | List upgrade requests (admin) |
| POST | /artisan-profiles/upgrade-requests/:id/approve | Approve upgrade request |
| POST | /artisan-profiles/upgrade-requests/:id/reject | Reject upgrade request |

For complete API documentation, refer to the Postman collection (link) when running the development server.

## Database Schema

Artisan Connect uses a relational database schema with the following core entities:

- **User**: Core user information and authentication
- **Profile**: Extended user information
- **Address**: Shipping and billing addresses
- **ArtisanProfile**: Specialized profile for artisan users
- **Post**: Content creation and sharing
- **Product**: Items for sale
- **Category**: Product categorization
- **Order**: Purchase transactions
- **Quote**: Custom quote negotiations
- **Review**: Product reviews and ratings
- **Follow**: Social connections
- **Comment**: Social interactions on posts
- **Like**: Social engagement
- **Notification**: User notifications
- **Message**: User-to-user communication

For detailed schema information, see the `prisma/schema.prisma` file.

## Core Concepts

### Dependency Injection

Artisan Connect uses a custom dependency injection container to manage service and repository dependencies:

```typescript
// Register a dependency
container.register('userRepository', new UserRepository(prisma));

// Resolve a dependency
const userRepository = container.resolve<IUserRepository>('userRepository');
```

This promotes:
- Loose coupling between components
- Testability with mock implementations
- Centralized dependency management

### Error Handling

The application implements a comprehensive error handling strategy:

- **AppError**: Custom error class with standardized structure
- **Error Middleware**: Centralized error processing
- **Error Context**: Rich error information including cause chain
- **Operational vs Programmer Errors**: Distinction between expected and unexpected errors

Example:

```typescript
// Creating an error
throw AppError.notFound('User not found', 'USER_NOT_FOUND');

// With error chaining
throw AppError.internal('Failed to process payment', 'PAYMENT_ERROR', {
  cause: error,
  metadata: { orderId, amount },
});
```

### Event System

A publish-subscribe event system handles cross-cutting concerns:

```typescript
// Subscribe to an event
eventBus.subscribe('user.registered', this.handleUserRegistered.bind(this));

// Publish an event
eventBus.publish('post.published', { 
  postId, 
  authorId,
  title 
});
```

This enables:
- Decoupling services
- Asynchronous processing
- Extensibility without modifying core code

## Development

### Coding Standards

- **TypeScript**: Strict typing for all code
- **ESLint**: Code linting with custom rules
- **Prettier**: Consistent code formatting
- **Error Handling**: Proper error propagation and handling
- **Documentation**: JSDoc comments for public APIs
- **Layer Separation**: Clear boundaries between layers

### Testing

(Coming soon)

## Deployment

### Production Setup

1. Build the application:
   ```bash
   npm run build
   ```

2. Set production environment variables

3. Start the application:
   ```bash
   npm start
   ```

### Docker Deployment

A Dockerfile is provided to containerize the application:

```bash
# Build the Docker image
docker build -t artisan-connect-backend .

# Run the container
docker run -p 5000:5000 --env-file .env.production artisan-connect-backend
```

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Commit your changes: `git commit -m 'Add some amazing feature'`
4. Push to the branch: `git push origin feature/amazing-feature`
5. Open a pull request

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

© 2025 Artisan Connect. All rights reserved.
