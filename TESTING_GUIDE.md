# Color Variant Feature - Quick Testing Guide

## 🚀 Servers Running
- **Backend**: http://localhost:8000
- **Frontend**: http://localhost:5174
- **API Docs**: http://localhost:8000/docs

## 📝 Testing Steps

### 1. Admin Login
1. Navigate to: http://localhost:5174/admin/login
2. Login with:
   - Email: `admin@burhani.com`
   - Password: `Admin@123`

### 2. View Products with Variant Management
1. Go to Admin Dashboard → Products
2. You'll see an **Eye icon** (👁️) next to each product
3. Click the Eye icon to open the Product Detail Modal

### 3. Add Color Variants to a Product
1. In the Product Detail Modal, scroll to "Color Variants" section
2. Click **"Add Color"** button
3. Fill in the form:
   - **Color Name**: e.g., "Royal Blue"
   - **Color Code**: Click color picker or enter hex code (e.g., #0066CC)
   - **Stock Quantity**: e.g., 50
   - **Images**: Upload 1-3 images for this color
   - **Active**: Check to make variant available
4. Click **"Add Variant"**
5. Repeat for other colors (e.g., "Black", "Red", "White")

### 4. Edit/Delete Variants
- **Edit**: Click the pencil icon on any variant card
- **Delete**: Click the trash icon on any variant card

### 5. Test Customer View
1. Open a new tab: http://localhost:5174
2. Click on a product that has color variants
3. **Observe:**
   - Color selector shows color swatches with hex codes
   - Stock count displayed for each color
   - Main product image changes when you select different colors
   - Thumbnail gallery updates to show variant-specific images
   - "Add to Cart" button disabled if variant is out of stock

### 6. Test Cart & Checkout
1. Select a color variant
2. Click "Add to Cart"
3. Go to cart page
4. Verify:
   - Selected color is displayed
   - Correct variant stock is checked
   - Can add multiple colors of same product as separate items
5. Proceed to checkout
6. Complete order
7. Check admin orders to verify variant info is saved

### 7. Test Stock Management
1. Add a product to cart with a specific color
2. Complete the order
3. Go back to admin → View product details
4. Verify stock decreased for that specific color variant only

## 🎨 Example Product to Test

### Create a "Premium T-Shirt" with variants:
1. **Base Product:**
   - Name: Premium Cotton T-Shirt
   - Price: ₹999
   - Category: Clothing
   - Sizes: S, M, L, XL

2. **Color Variants:**
   - **Navy Blue** (#001F3F) - Stock: 50
   - **Charcoal Gray** (#3D3D3D) - Stock: 30
   - **Forest Green** (#228B22) - Stock: 25
   - **Burgundy** (#800020) - Stock: 40

3. Upload different images for each color showing the t-shirt in that color

## ✅ What to Verify

### Admin Side:
- [ ] Can add color variants with images
- [ ] Can edit variant details
- [ ] Can delete variants
- [ ] Color picker works correctly
- [ ] Image upload works for variants
- [ ] Variant list displays correctly

### Customer Side:
- [ ] Color swatches display with hex codes
- [ ] Images change when selecting colors
- [ ] Stock count shows per color
- [ ] Out-of-stock variants disable cart button
- [ ] Selected color saved in cart
- [ ] Different colors treated as separate cart items

### Checkout & Orders:
- [ ] Order includes variant information
- [ ] Stock deducted from correct variant
- [ ] Admin can see which color was ordered
- [ ] Inventory management works per variant

## 🐛 Common Issues & Solutions

### Issue: "Color variant not showing"
**Solution**: Make sure the variant is marked as "Active" when creating it

### Issue: "Images not updating"
**Solution**: Ensure each variant has at least one image uploaded

### Issue: "Stock not decreasing"
**Solution**: Check that the variant ID is being passed correctly in the cart

### Issue: "Can't see Eye icon in admin"
**Solution**: Refresh the page or clear browser cache

## 📊 API Testing (Optional)

Use the Swagger docs at http://localhost:8000/docs to test:
- `POST /api/products/{product_id}/variants` - Add variant
- `PUT /api/products/{product_id}/variants/{variant_id}` - Update variant
- `DELETE /api/products/{product_id}/variants/{variant_id}` - Delete variant
- `GET /api/products/{product_id}` - View product with variants

## 🎯 Success Indicators
- ✅ Admin can manage variants easily
- ✅ Customer sees beautiful color selection UI
- ✅ Images dynamically update
- ✅ Stock managed accurately per variant
- ✅ Orders track which variant was purchased
- ✅ No errors in browser console
- ✅ Smooth user experience

## 📸 Screenshots to Take
1. Admin product detail modal with variants
2. Color variant manager interface
3. Customer product page with color swatches
4. Image changing when color selected
5. Cart with different color variants
6. Order confirmation with variant info

Happy Testing! 🎉
