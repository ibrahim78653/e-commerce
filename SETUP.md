# Quick Setup Guide

## 🚀 Quick Start

### 1. Install Frontend Dependencies
```bash
cd frontend
npm install
```

### 2. Create Environment Files

**Backend `.env`** (in root directory):
```env
DATABASE_URL=sqlite:///./ecommerce.db
JWT_SECRET_KEY=your_secret_key_change_this_in_production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
APP_NAME=Burhani Collection E-Commerce
DEBUG=True
CORS_ORIGINS=http://localhost:5173
RAZORPAY_KEY_ID=rzp_test_your_key_id
RAZORPAY_KEY_SECRET=your_key_secret
WHATSAPP_BUSINESS_NUMBER=917869622753
UPLOAD_DIR=static/uploads
```

**Frontend `.env`** (in `frontend/` directory):
```env
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
```

### 3. Install Backend Dependencies
```bash
# From root directory
pip install -r requirements.txt
```

### 4. Initialize Database
```bash
cd backend
python -c "from database import init_db; init_db()"
```

### 5. Run the Application

**Terminal 1 - Backend:**
```bash
cd backend
uvicorn main:app --reload --port 8000
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev
```

### 6. Access the Application
- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000
- **API Docs**: http://localhost:8000/api/docs

## 📝 Next Steps

1. Register as a user
2. Browse products (you'll need to add some via API or admin)
3. Test cart functionality
4. Test checkout with Razorpay test mode
5. Test WhatsApp order flow

## 🧪 Test Razorpay

Use these test cards:
- **Card**: 4111 1111 1111 1111
- **CVV**: 123
- **Expiry**: Any future date

## 📦 Project Structure

```
e-commerce/
├── backend/          # FastAPI backend
├── frontend/         # React frontend
│   ├── src/
│   │   ├── components/   # Reusable UI components
│   │   ├── pages/        # Page components
│   │   ├── context/      # Context providers
│   │   ├── services/     # API services
│   │   └── store/        # State management
│   └── package.json
├── static/           # Static files (uploads)
└── requirements.txt  # Python dependencies
```

## ✅ Features Completed

- ✅ User authentication (email/phone)
- ✅ Product listing with search & filters
- ✅ Product details with image gallery
- ✅ Shopping cart with persistence
- ✅ Checkout with Razorpay
- ✅ WhatsApp order integration
- ✅ Responsive design
- ✅ Modern UI with animations

Enjoy building! 🎉
