# Burhani Collection - Project Blueprint

## 🌟 Project Overview
Burhani Collection is a production-ready e-commerce platform designed for high performance and scalability. It features a modern tech stack with a clean separation of concerns between its FastAPI backend and React frontend.

## 🛠 Technology Stack

### Backend
- **Language:** Python 3.9+
- **Framework:** FastAPI
- **Database:** SQLite (Development) / PostgreSQL (Production)
- **ORM:** SQLAlchemy with Alembic migrations
- **Authentication:** JWT (JSON Web Tokens) with Access & Refresh tokens
- **Security:** Passlib (Bcrypt) for password hashing
- **Payment:** Razorpay Integration
- **API Docs:** Swagger (OpenAPI)

### Frontend
- **Framework:** React 18+ (Vite)
- **Styling:** Tailwind CSS
- **State Management:** Zustand (Auth & Cart)
- **Animations:** Framer Motion
- **Form Handling:** React Hook Form + Zod/Validation
- **Icons:** Lucide-react

---

## 📂 Directory Structure

```text
e-commerce/
├── app.py                  # Root entrypoint (Vercel/Local bridge)
├── backend/                # FastAPI Application
│   ├── main.py             # Application factory & router configuration
│   ├── models.py           # SQLAlchemy database models
│   ├── schemas.py          # Pydantic models for validation
│   ├── database.py         # Database connection & session management
│   ├── config.py           # Settings management (Pydantic-Settings)
│   ├── auth.py             # Authentication & Security logic
│   ├── routers/            # API Route definitions
│   │   ├── auth.py         # Login/Register
│   │   ├── products.py     # Product listing/CRUD
│   │   ├── orders.py       # Order processing
│   │   └── admin.py        # Administrative controls
│   ├── middleware/         # Custom Middlewares (Rate limiting, etc.)
│   └── static/             # Static assets & Uploads
├── frontend/               # React Application
│   ├── src/
│   │   ├── components/     # Reusable UI components
│   │   ├── context/        # React Context (Cart, Auth)
│   │   ├── pages/          # Page-level components
│   │   ├── api/            # API client (Axios)
│   │   ├── store/          # Zustand stores
│   │   └── assets/         # CSS & Images
│   └── vite.config.js      # Vite configuration
└── .env                    # Environment variables
```

---

## 🗄 Database Schema (Core Models)

### 1. User
- `id`, `email`, `phone`, `full_name`, `hashed_password`, `role`, `is_active`, `created_at`

### 2. Category
- `id`, `name`, `slug`

### 3. Product
- `id`, `name`, `slug`, `description`, `original_price`, `discounted_price`, `stock`, `category_id`, `is_featured`, `is_active`

### 4. ProductColorVariant
- `id`, `product_id`, `color_name`, `color_code`, `stock`, `is_active`, `show_in_carousel`

### 5. ProductImage
- `id`, `product_id`, `color_variant_id`, `image_url`, `is_primary`

### 6. Order & OrderItem
- `Order`: `id`, `user_id`, `customer_info`, `total_amount`, `status`, `payment_method`, `razorpay_order_id`, `razorpay_payment_id`
- `OrderItem`: `order_id`, `product_id`, `color_variant_id`, `price`, `quantity`, `selected_color`, `selected_size`

---

## 🔄 Core Workflows

### Authentication Flow
1. User registers/logs in via `/api/auth/login`.
2. Backend validates credentials and issues JWT Access & Refresh tokens.
3. Frontend stores tokens in `localStorage` and `Zustand` state.
4. Axios interceptors automatically attach the token to future requests.

### Product & Variant Management
- Products can have a base inventory or be split into **Color Variants**.
- Each variant has its own stock tracking and image gallery.
- The Admin Panel allows real-time updates to stock and pricing.

### Checkout & Payment (Razorpay)
1. User initiates checkout from the Cart.
2. Backend creates a Razorpay Order and returns the `order_id`.
3. Frontend triggers the Razorpay Checkout Modal.
4. After payment, the callback sends the `payment_id` and `signature` to the backend.
5. Backend verifies the signature and confirms the order status.

---

## 🚀 Key Implementation Notes
- **Root Entrypoint:** The `app.py` in the root is specifically designed to allow Vercel and local Uvicorn instances to run correctly while maintaining the project's internal directory structure.
- **Stock Integrity:** Database transactions ensure that stock is only deducted after successful payment creation or verification.
- **Image Handling:** Secure uploads with file type and size validation are implemented via the `/api/upload/image` endpoint.

---

## 📍 API Endpoints Summary
- **Auth:** `POST /api/auth/register`, `POST /api/auth/login`
- **Products:** `GET /api/products`, `GET /api/products/{id}`, `POST /api/products` (Admin)
- **Orders:** `POST /api/orders`, `GET /api/orders/my-orders`
- **Admin:** `GET /api/admin/stats`, `PUT /api/admin/orders/{id}`
