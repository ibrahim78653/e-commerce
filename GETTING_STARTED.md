# 🚀 Getting Started - Step by Step

## ⚠️ Windows PowerShell Issue?

If you get "scripts disabled" error, see **WINDOWS_SETUP.md** first.

---

## 📋 Complete Setup Steps

### 1️⃣ Create Environment Files

**Create `.env` in root directory:**
```env
DATABASE_URL=sqlite:///./ecommerce.db
JWT_SECRET_KEY=your-super-secret-key-change-this-in-production
JWT_ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_MINUTES=30
REFRESH_TOKEN_EXPIRE_DAYS=7
APP_NAME=Burhani Collection E-Commerce
DEBUG=True
CORS_ORIGINS=http://localhost:5173
RAZORPAY_KEY_ID=rzp_test_your_key_id_here
RAZORPAY_KEY_SECRET=your_razorpay_secret_here
WHATSAPP_BUSINESS_NUMBER=917869622753
UPLOAD_DIR=static/uploads
```

**Create `frontend/.env`:**
```env
VITE_RAZORPAY_KEY_ID=rzp_test_your_key_id_here
```

### 2️⃣ Install Backend Dependencies
```bash
pip install -r requirements.txt
```

### 3️⃣ Initialize & Seed Database
```bash
cd backend
python seed_db.py
```

This creates:
- Admin user: `admin@burhani.com` / `Admin@123`
- Customer: `customer@example.com` / `Customer@123`
- 4 categories
- 6 sample products

### 4️⃣ Install Frontend Dependencies

**Using Command Prompt (recommended for Windows):**
```cmd
cd frontend
npm install
```

### 5️⃣ Start Backend Server

**Terminal 1:**
```bash
cd backend
uvicorn main:app --reload --port 8000
```

Wait for: `Application startup complete.`

### 6️⃣ Start Frontend Server

**Terminal 2:**
```bash
cd frontend
npm run dev
```

Wait for: `Local: http://localhost:5173/`

---

## 🎉 Access Your Application

- **Website**: http://localhost:5173
- **API Docs**: http://localhost:8000/api/docs

---

## 🧪 Quick Test

1. Open http://localhost:5173
2. Login with: `customer@example.com` / `Customer@123`
3. Browse the 6 sample products
4. Add items to cart
5. Go to checkout
6. Test Razorpay (test mode) or WhatsApp order

---

## 🔑 Admin Access

Login with `admin@burhani.com` / `Admin@123` to:
- Add/edit/delete products
- Manage orders
- Upload product images

---

## ❓ Troubleshooting

**PowerShell Error?** → See WINDOWS_SETUP.md

**Database Error?** → Delete `backend/ecommerce.db` and run `python seed_db.py` again

**Port Already in Use?** → Change port in backend or frontend config

**Module Not Found?** → Make sure you ran `pip install -r requirements.txt`

---

**🎊 You're all set! Enjoy your e-commerce platform!**
