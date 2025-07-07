# Artisan Connect - Backend API

## 📋 Table of Contents

- [Overview](#overview)
- [Architecture](#architecture)
- [Business Model](#business-model)
- [Key Features](#key-features)
- [Complex Workflows](#complex-workflows)
- [Module Structure](#module-structure)
- [Tech Stack](#tech-stack)
- [Getting Started](#getting-started)
- [API Documentation](#api-documentation)
- [Database Schema](#database-schema)
- [Real-time Features](#real-time-features)
- [Development](#development)
- [Deployment](#deployment)
- [Contributing](#contributing)

## Overview

**Artisan Connect** is a comprehensive social commerce platform specifically designed for artisans and craftspeople. It bridges the gap between social media engagement and e-commerce functionality, creating a unique ecosystem where artisans can build their brand, showcase their creative journey, and sell both ready-made and custom handcrafted products.

The platform emphasizes **storytelling**, **community building**, and **flexible commerce** - features particularly valuable in the handcraft industry where products are often unique, customizable, and pricing can be negotiable.

### Core Value Propositions

- **Social Commerce**: Combines social media features with e-commerce capabilities
- **Flexible Pricing**: Supports price negotiation and custom quotes
- **Artisan-Centric**: Designed specifically for the unique needs of craftspeople
- **Community Building**: Follow system and engagement features for artisan discovery
- **Custom Orders**: Full workflow for bespoke product creation
- **Real-time Communication**: Integrated messaging with quote discussions

## Architecture

Artisan Connect follows **Clean Architecture** principles with a modular, domain-driven design:

```
┌─────────────────────────────────────────┐
│             Interface Layer             │
│   (Controllers, Routes, Validators)     │
├─────────────────────────────────────────┤
│            Application Layer            │
│         (Services, Use Cases)           │
├─────────────────────────────────────────┤
│              Domain Layer               │
│       (Entities, Interfaces)            │
├─────────────────────────────────────────┤
│           Infrastructure Layer          │
│  (Database, External Services, Events)  │
└─────────────────────────────────────────┘
```

### Key Architectural Patterns

- **Dependency Injection**: Custom DI container for loose coupling
- **Repository Pattern**: Data access abstraction
- **Service Layer**: Business logic encapsulation
- **Event-Driven**: Pub/sub system for cross-cutting concerns
- **Error Chaining**: Comprehensive error handling with context
- **Socket.io Integration**: Real-time features throughout the system

## Business Model

### User Roles & Permissions

1. **CUSTOMER**: Can browse, purchase, follow artisans, negotiate prices
2. **ARTISAN**: Can create products/posts, receive orders, manage shop
3. **ADMIN**: Full system access and management capabilities

### Key Business Rules

- **Artisan-Only Content**: Only artisans can create products and posts
- **Follow Restrictions**: Users can only follow artisans (not other customers)
- **Pricing Flexibility**: Support for fixed prices, negotiations, and custom quotes
- **Order Types**: Regular orders from cart + custom orders from accepted quotes

## Key Features

### 🔐 Authentication & Authorization

- JWT-based authentication with refresh tokens
- Role-based access control (Customer/Artisan/Admin)
- Email verification and password reset
- Secure session management

### 👤 User Management

- Comprehensive user profiles with preferences
- Multi-address management for shipping
- Follow system (customers can follow artisans)
- Activity tracking and analytics

### 🎨 Artisan Ecosystem

- Rich artisan profiles with shop customization
- Customer-to-artisan upgrade requests with admin approval
- Artisan verification system
- Business analytics and performance metrics

### 📝 Content & Social Features

- Rich blog-style posts with media support
- Social engagement (likes, comments, follows)
- Content types: tutorials, showcases, behind-the-scenes
- Wishlist system for products and posts

### 🛍️ E-commerce Core

- Product catalog with categories and variants
- Shopping cart with multi-seller support
- Comprehensive order management
- Inventory tracking and availability

### 💰 Flexible Pricing System

- **Fixed Pricing**: Standard product pricing
- **Price Negotiation**: Customers can negotiate prices for existing products
- **Custom Orders**: Full quote system for bespoke items
- **Dynamic Cart**: Supports both regular and negotiated items

### 🔄 Order Management

- Order creation from cart or accepted quotes
- Status tracking with detailed history
- Dispute resolution system
- Return/refund management
- Multi-seller order handling

### 💬 Real-time Communication

- Socket.io-powered messaging system
- Quote discussions integrated with chat
- Custom order negotiations in real-time
- Typing indicators and read receipts
- Online/offline status

### 🔔 Notification System

- Real-time notifications via Socket.io
- Comprehensive notification types
- Email notifications (configurable)
- Push notification support ready

### ⭐ Review & Rating System

- Product reviews with media support
- Purchase verification
- Review statistics and analytics
- Helpful review voting

### 📊 Analytics & Reporting

- User engagement analytics
- Business performance metrics
- Platform-wide statistics
- Custom reporting capabilities

## Complex Workflows

### 1. Price Negotiation Flow

```mermaid
sequenceDiagram
    participant C as Customer
    participant S as System
    participant A as Artisan
    participant N as Notification

    C->>S: Request price negotiation
    S->>S: Validate product & permissions
    S->>N: Notify artisan
    A->>S: Respond (Accept/Reject/Counter)
    S->>N: Notify customer
    alt Accepted
        C->>S: Add to cart with negotiated price
    else Counter Offer
        C->>S: Accept/Reject counter
    end
```

### 2. Custom Order Workflow

```mermaid
sequenceDiagram
    participant C as Customer
    participant M as Chat/Messaging
    participant Q as Quote System
    participant A as Artisan
    participant O as Order System

    C->>M: Send custom order request in chat
    M->>Q: Create quote request
    Q->>A: Notify new quote request
    
    alt Accept Quote
        A->>M: Accept via chat
        M->>Q: Update status to ACCEPTED
        Q->>O: Create order
        O->>C: Order confirmation
        
    else Counter Offer
        A->>M: Send counter-offer
        M->>Q: Update with counter-offer
        Q->>C: Notify counter-offer
        
        alt Customer Accepts
            C->>M: Accept counter-offer
            M->>Q: Update to ACCEPTED
            Q->>O: Create order
        else Customer Rejects
            C->>M: Reject offer
            M->>Q: Update to REJECTED
        end
        
    else Reject Quote
        A->>M: Reject via chat
        M->>Q: Update to REJECTED
        Q->>C: Notify rejection
    end
```

### 3. Multi-Seller Cart & Checkout

```mermaid
sequenceDiagram
    participant C as Customer
    participant Cart as Cart System
    participant V as Validation
    participant O as Order
    participant P as Payment

    C->>Cart: Add items from multiple sellers
    C->>Cart: Proceed to checkout
    Cart->>V: Validate cart items
    V->>V: Check stock, pricing, negotiations
    V->>O: Create order with multiple sellers
    O->>P: Process payment
    P->>O: Confirm payment
    O->>O: Notify all sellers
```

## Module Structure

### Core Infrastructure Modules

- **`core/`**: Infrastructure services, DI, error handling, events
- **`shared/`**: Common utilities, base classes, interfaces

### Business Domain Modules

- **`auth/`**: Authentication, authorization, user management
- **`user/`**: User profiles, addresses, follow relationships
- **`artisan/`**: Artisan profiles, shop management, upgrade requests
- **`post/`**: Content creation and blog functionality
- **`product/`**: Product catalog, categories, inventory
- **`social/`**: Likes, comments, wishlist, social interactions
- **`cart/`**: Shopping cart with negotiation support
- **`price-negotiation/`**: Price negotiation for existing products
- **`custom-order/`**: Quote requests and custom order management
- **`order/`**: Order processing, disputes, returns
- **`review/`**: Product reviews and ratings
- **`messaging/`**: Real-time chat with quote integration
- **`notification/`**: Real-time notification system
- **`analytics/`**: Business intelligence and reporting

Each module follows consistent structure:

```
module/
├── models/           # Domain entities and DTOs
├── repositories/     # Data access layer
├── services/         # Business logic
├── interface/
│   ├── controllers/  # Request handlers
│   ├── routes/       # Route definitions
│   └── validators/   # Input validation
└── index.ts         # Module exports
```

## Tech Stack

### Backend Core

- **Node.js 18+** - JavaScript runtime
- **TypeScript** - Type-safe development
- **Express.js** - Web framework
- **Prisma ORM** - Database toolkit with migrations
- **PostgreSQL** - Primary database

### Real-time & Communication

- **Socket.io** - Real-time bidirectional communication
- **Nodemailer** - Email service integration

### Authentication & Security

- **JWT** - JSON Web Tokens
- **Bcrypt** - Password hashing
- **Helmet** - Security headers
- **CORS** - Cross-origin resource sharing
- **Rate Limiting** - API protection

### Storage & Media

- **Cloudinary** - Cloud media storage and transformation
- **Multer** - File upload handling

### Validation & Error Handling

- **Joi** - Schema validation
- **Custom error chaining** - Comprehensive error context

### Development & Quality

- **ESLint** - Code linting
- **Prettier** - Code formatting
- **Custom logging** - Structured logging system

## Getting Started

### Prerequisites

- Node.js (v18.x or later)
- npm (v9.x or later)
- PostgreSQL (v14.x or later)
- Git

### Installation

1. **Clone the repository:**

   ```bash
   git clone https://github.com/your-organization/artisan-connect-backend.git
   cd artisan-connect-backend
   ```

2. **Install dependencies:**

   ```bash
   npm install
   ```

3. **Environment setup:**

   ```bash
   cp .env.example .env
   # Edit .env with your configuration
   ```

4. **Database setup:**

   ```bash
   # Generate Prisma client
   npx prisma generate

   # Run migrations
   npx prisma migrate dev

   # (Optional) Seed data
   npm run seed
   ```

5. **Start development server:**
   ```bash
   npm run dev
   ```

### Environment Variables

```env
# Server Configuration
PORT=5000
NODE_ENV=development
API_PREFIX=/api

# Database
DATABASE_URL="postgresql://user:password@localhost:5432/artisan_connect"

# JWT Secrets
JWT_ACCESS_SECRET=your_access_secret_key
JWT_REFRESH_SECRET=your_refresh_secret_key
JWT_ACCESS_EXPIRATION=24h
JWT_REFRESH_EXPIRATION=7d

# Security
COOKIE_SECRET=your_cookie_secret
CORS_ORIGIN=http://localhost:3000

# External Services
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email Configuration
EMAIL_HOST=smtp.gmail.com
EMAIL_PORT=465
EMAIL_SECURE=true
EMAIL_USER=your_email@gmail.com
EMAIL_PASSWORD=your_email_password
EMAIL_FROM_NAME=Artisan Connect
EMAIL_FROM_ADDRESS=noreply@artisanconnect.com

# Client URLs
CLIENT_URL=http://localhost:3000
```

## API Documentation

### Base URL

```
http://localhost:5000/api
```

### Authentication Endpoints

| Method | Endpoint              | Description          |
| ------ | --------------------- | -------------------- |
| POST   | `/auth/register`      | Register new user    |
| POST   | `/auth/login`         | User authentication  |
| POST   | `/auth/logout`        | End session          |
| POST   | `/auth/refresh-token` | Refresh access token |
| GET    | `/auth/me`            | Get current user     |

### Core Business Endpoints

#### User & Profile Management

| Method | Endpoint           | Description               |
| ------ | ------------------ | ------------------------- |
| GET    | `/users/:id`       | Get user profile (public) |
| PATCH  | `/users/profile`   | Update user details       |
| GET    | `/users/addresses` | Get user addresses        |
| POST   | `/users/addresses` | Create new address        |

#### Artisan Management

| Method | Endpoint                    | Description             |
| ------ | --------------------------- | ----------------------- |
| POST   | `/artisans/profile`         | Create artisan profile  |
| GET    | `/artisans/profile/me`      | Get own artisan profile |
| POST   | `/artisans/upgrade-request` | Request artisan upgrade |
| GET    | `/artisans/search`          | Search artisans         |

#### Product & Commerce

| Method | Endpoint        | Description                   |
| ------ | --------------- | ----------------------------- |
| GET    | `/products`     | Get products with filtering   |
| POST   | `/products`     | Create product (artisan only) |
| GET    | `/products/:id` | Get product details           |
| GET    | `/categories`   | Get product categories        |

#### Shopping & Orders

| Method | Endpoint            | Description            |
| ------ | ------------------- | ---------------------- |
| GET    | `/cart`             | Get cart items         |
| POST   | `/cart`             | Add item to cart       |
| POST   | `/orders/from-cart` | Create order from cart |
| GET    | `/orders/my-orders` | Get user orders        |

#### Price Negotiation

| Method | Endpoint                        | Description              |
| ------ | ------------------------------- | ------------------------ |
| POST   | `/negotiations`                 | Create price negotiation |
| POST   | `/negotiations/:id/respond`     | Artisan response         |
| GET    | `/negotiations/my-negotiations` | Get user negotiations    |

#### Custom Orders

| Method | Endpoint               | Description                 |
| ------ | ---------------------- | --------------------------- |
| POST   | `/customs`             | Create custom order request |
| POST   | `/customs/:id/respond` | Artisan response to quote   |
| GET    | `/customs/my-orders`   | Get custom orders           |

#### Social Features

| Method | Endpoint           | Description                 |
| ------ | ------------------ | --------------------------- |
| POST   | `/social/like`     | Toggle like on post/comment |
| POST   | `/social/comments` | Create comment              |
| GET    | `/social/wishlist` | Get wishlist items          |

#### Real-time Communication

| Method | Endpoint                  | Description               |
| ------ | ------------------------- | ------------------------- |
| GET    | `/messages/conversations` | Get conversations         |
| POST   | `/messages`               | Send message              |
| POST   | `/messages/custom-order`  | Send custom order in chat |

## Database Schema

### Core User Tables

- **User**: Authentication and basic user info
- **Profile**: Extended user profile information
- **Address**: Multiple shipping addresses per user
- **ArtisanProfile**: Specialized profile for artisan users

### Social & Content Tables

- **Post**: Content creation (blog-style posts)
- **Follow**: User following relationships (customers → artisans)
- **Like**: Social engagement on posts/comments
- **Comment**: Threaded comments on posts
- **Wishlist**: Saved products and posts

### Commerce Tables

- **Product**: Product catalog with variants
- **Category**: Hierarchical product categorization
- **CartItem**: Shopping cart with negotiation support
- **Order**: Order management with status tracking
- **OrderItem**: Order line items (supports custom orders)

### Pricing & Negotiation Tables

- **PriceNegotiation**: Price negotiations for existing products
- **QuoteRequest**: Custom order quotes and negotiations
- **PriceHistory**: Product price change tracking

### Communication Tables

- **Message**: Real-time messaging with quote integration
- **Notification**: System notifications

### Business Support Tables

- **Review**: Product reviews and ratings
- **OrderDispute**: Dispute resolution system
- **OrderReturn**: Return/refund management

## Real-time Features

### Socket.io Integration

The platform extensively uses Socket.io for real-time features:

#### Connection Management

- Authenticated connections with JWT verification
- User presence tracking (online/offline)
- Automatic reconnection handling

#### Real-time Notifications

```javascript
// Server emits notification
socketService.sendNotification(userId, {
  type: 'PRICE_NEGOTIATION',
  title: 'New Price Negotiation',
  message: 'Someone wants to negotiate...',
  data: { productId, negotiationId },
});

// Client receives
socket.on('notification', (notification) => {
  // Handle notification
});
```

#### Live Messaging

```javascript
// Real-time message delivery
socketService.sendMessage(receiverId, messageData);

// Typing indicators
socketService.updateTypingStatus(roomId, userId, true);

// Read receipts
socketService.broadcastToUser(senderId, 'message-read', {
  messageId,
  readBy: userId,
});
```

#### Business Event Broadcasting

- Order status updates
- Negotiation responses
- Custom order updates
- Payment confirmations

## Development

### Code Organization

#### Base Classes

- **BaseController**: Standard request/response handling
- **BaseService**: Error handling and logging
- **BasePrismaRepository**: Common database operations

#### Error Handling

- **AppError**: Structured error class with chaining
- **ErrorHandler**: Global error processing middleware
- **Error Context**: Rich error information for debugging

#### Validation

- **Joi Schemas**: Input validation
- **Custom Validators**: Business rule validation
- **Request Sanitization**: Data cleaning and normalization

### Development Workflow

1. **Module Development**:

   ```bash
   # Create new module structure
   mkdir src/modules/new-module/{models,repositories,services,interface}
   ```

2. **Database Changes**:

   ```bash
   # Create migration
   npx prisma migrate dev --name add_new_feature

   # Generate client
   npx prisma generate
   ```

3. **Testing**:

   ```bash
   # Run tests (when implemented)
   npm test

   # Lint code
   npm run lint

   # Format code
   npm run format
   ```

### API Testing

Use the provided Postman collection or test with curl:

```bash
# Login
curl -X POST http://localhost:5000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"emailOrUsername": "user@example.com", "password": "password"}'

# Create product (with auth token)
curl -X POST http://localhost:5000/api/products \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{"name": "Handmade Vase", "price": 50, "categoryIds": ["cat-id"]}'
```

## Deployment

### Production Setup

1. **Build the application**:

   ```bash
   npm run build
   ```

2. **Environment Configuration**:

   - Set production environment variables
   - Configure database connection
   - Set up external services (Cloudinary, Email)

3. **Database Migration**:

   ```bash
   npx prisma migrate deploy
   ```

4. **Start Production Server**:
   ```bash
   npm start
   ```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY . .
RUN npx prisma generate
EXPOSE 5000
CMD ["npm", "start"]
```

### Health Monitoring

The application provides health check endpoints:

- `/health` - Basic health status
- `/socket-status` - Socket.io connection info

## Contributing

### Development Guidelines

1. **Code Style**: Follow TypeScript and ESLint configurations
2. **Module Structure**: Maintain consistent module organization
3. **Error Handling**: Use AppError for business logic errors
4. **Documentation**: Comment complex business logic
5. **Testing**: Write tests for critical business flows

### Pull Request Process

1. Fork the repository
2. Create feature branch: `git checkout -b feature/amazing-feature`
3. Implement changes following project conventions
4. Add tests for new functionality
5. Update documentation as needed
6. Submit pull request with detailed description

### Architecture Decisions

When extending the system:

- Follow Clean Architecture principles
- Maintain module independence
- Use dependency injection for services
- Implement proper error handling
- Consider real-time requirements
- Maintain backward compatibility

---

## License

This project is licensed under the MIT License - see the LICENSE file for details.

---

© 2025 Artisan Connect. All rights reserved.

**Built with ❤️ for the artisan community**
