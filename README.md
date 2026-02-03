# Burhani Collection - Production-Ready E-Commerce Platform

A modern, scalable e-commerce web application built with FastAPI (Python) and React, featuring JWT authentication, Razorpay payment integration, and WhatsApp order functionality.

## 🚀 Features

### Backend (FastAPI + PostgreSQL)
- ✅ **RESTful API** with automatic OpenAPI documentation
- ✅ **JWT Authentication** with access & refresh tokens
- ✅ **Email/Phone Login** - flexible user authentication
- ✅ **PostgreSQL Database** with SQLAlchemy ORM
- ✅ **Secure Payment Processing** - Razorpay integration with signature verification
- ✅ **WhatsApp Orders** - alternative ordering via WhatsApp
- ✅ **Rate Limiting** - protection against API abuse
- ✅ **Image Upload** - secure product image handling (up to 3 images per product)
- ✅ **Stock Management** - automatic inventory tracking with database transactions
- ✅ **Admin Panel APIs** - order management, product CRUD

### Frontend (React + Tailwind CSS)
- ✅ **Modern UI** - Tailwind CSS with custom color palette
- ✅ **Responsive Design** - mobile, tablet, desktop optimized
- ✅ **Smooth Animations** - Framer Motion for delightful interactions
- ✅ **Product Gallery** - 3-image display with thumbnail switching
- ✅ **Search & Filters** - advanced product discovery
- ✅ **Shopping Cart** - persistent cart with localStorage
- ✅ **Razorpay Checkout** - integrated payment gateway
- ✅ **Real-time Validation** - React Hook Form with error handling
- ✅ **State Management** - Zustand for auth and cart

## 📋 Prerequisites

- **Python 3.9+**
- **Node.js 18+** and npm
- **PostgreSQL 13+** (or use SQLite for development)
- **Razorpay Account** (for payment integration)

## 🛠️ Installation

### 1. Backend Setup

```bash
# Navigate to backend directory
cd backend

# Create virtual environment
python -m venv venv

# Activate virtual environment (Windows)
venv\Scripts\activate

# Install dependencies
pip install -r ../requirements.txt

# Create .env file from template
copy ..\.env.example .env
# Edit .env and configure (see Environment Variables section)
```

### 2. Database Setup

```bash
# Initialize database
python -c "from database import init_db; init_db()"
```

### 3. Frontend Setup

```bash
cd frontend
npm install
copy .env.example .env
# Edit .env and add Razorpay Key ID
```

## 🚀 Running the Application

### Start Backend
```bash
cd backend
uvicorn main:app --reload --port 8000
```
Access: http://localhost:8000/api/docs

### Start Frontend
```bash
cd frontend
npm run dev
```
Access: http://localhost:5173

## 📱 API Documentation

Full API docs available at: http://localhost:8000/api/docs

## 🔐 Environment Variables

See `.env.example` files in root and frontend directories.

## 📦 Deployment

- **Backend**: Railway, Render, or Heroku
- **Frontend**: Vercel or Netlify

## 📧 Support

For support: support@burhanicollection.com

---

**Built with ❤️ using FastAPI, React, and Tailwind CSS**
