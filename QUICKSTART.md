# E-Commerce Platform - Quick Start

## 🎯 Current Status: Ready to Run!

All code is complete. Follow these steps to start the application.

---

## Step 1: Install Backend Dependencies

```bash
pip install -r requirements.txt
```

## Step 2: Create Environment Files

### Backend `.env` (in root directory)
```env
DATABASE_URL=sqlite:///./ecommerce.db
JWT_SECRET_KEY=your-super-secret-key-change-in-production
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

### Frontend `.env` (in frontend directory)
```env
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id
```

## Step 3: Initialize Database

```bash
cd backend
python -c "from database import init_db; init_db()"
```

## Step 4: Run Both Servers

### Terminal 1 - Backend
```bash
cd backend
uvicorn main:app --reload --port 8000
```

### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

## Step 5: Access Application

- **Frontend**: http://localhost:5173
- **Backend API**: http://localhost:8000/api/docs

---

## 🧪 Quick Test

1. Open http://localhost:5173
2. Click "Sign In" → "Create Account"
3. Register with email or phone
4. Browse products (you'll need to add some via API first)

---

## 📝 Adding Sample Products

Use the API docs at http://localhost:8000/api/docs:

1. Register an admin user (see README.md)
2. Login to get JWT token
3. Use "Authorize" button in API docs
4. Upload 3 images via `/api/upload/image`
5. Create product with image URLs

---

## 🎉 You're All Set!

Frontend dependencies are installing. Once complete, follow the steps above.
