import asyncio
import httpx
import sys

BASE_URL = "http://localhost:8000/api"
ADMIN_EMAIL = "admin@example.com"
ADMIN_PASSWORD = "adminpassword"
TEST_USER_EMAIL = "test_user_e2e@example.com"
TEST_USER_PASSWORD = "Password123"
PROMO_CODE = "TEST10"

async def test_newsletter():
    print("\n--- Testing Newsletter ---")
    async with httpx.AsyncClient() as client:
        res = await client.post(f"{BASE_URL}/newsletter/subscribe", json={
            "email": "news_tester@example.com",
            "name": "News Tester"
        })
        if res.status_code in [200, 400]:
            print("[OK] Newsletter Subscribe OK (or already subscribed)")
        else:
            print(f"[FAIL] Newsletter Subscribe Failed: {res.text}")

async def test_auth_and_address():
    print("\n--- Testing Auth & Address Book ---")
    async with httpx.AsyncClient() as client:
        # Register user
        res = await client.post(f"{BASE_URL}/auth/register", json={
            "full_name": "E2E Test User",
            "email": TEST_USER_EMAIL,
            "phone": "9999999999",
            "password": TEST_USER_PASSWORD
        })
        # Login
        res = await client.post(f"{BASE_URL}/auth/login", data={
            "username": TEST_USER_EMAIL,
            "password": TEST_USER_PASSWORD
        })
        if res.status_code != 200:
            print("[FAIL] User login failed. Check database.")
            return None
        
        token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # Add address
        res = await client.post(f"{BASE_URL}/users/addresses", json={
            "label": "Work",
            "full_name": "E2E Test User",
            "phone": "9999999999",
            "address_line1": "123 Test St",
            "city": "Test City",
            "state": "TS",
            "pincode": "123456",
            "is_default": True
        }, headers=headers)
        
        if res.status_code == 200:
            print("[OK] Address added successfully")
        else:
            print(f"[FAIL] Address creation failed: {res.text}")
            
        return headers

async def test_promos_and_analytics():
    print("\n--- Testing Promos & Analytics (Admin) ---")
    async with httpx.AsyncClient() as client:
        # Admin Login
        res = await client.post(f"{BASE_URL}/auth/login", data={
            "username": ADMIN_EMAIL,
            "password": ADMIN_PASSWORD
        })
        if res.status_code != 200:
            print("[WARN] Admin login failed (skipping promo creation)")
            return
            
        admin_token = res.json()["access_token"]
        headers = {"Authorization": f"Bearer {admin_token}"}
        
        # Create Promo
        res = await client.post(f"{BASE_URL}/admin/promos", json={
            "code": PROMO_CODE,
            "description": "Test Promo",
            "discount_type": "percentage",
            "discount_value": 10,
            "min_order_value": 500,
            "is_active": True
        }, headers=headers)
        
        if res.status_code == 200 or "already exists" in res.text:
            print("[OK] Promo code created or already exists")
        else:
            print(f"[FAIL] Promo code creation failed: {res.text}")

        # Validate Promo
        res = await client.post(f"{BASE_URL}/promos/validate", json={
            "code": PROMO_CODE,
            "order_value": 1000
        })
        if res.status_code == 200 and res.json().get("valid"):
            print("[OK] Promo validation OK (Discount applied)")
        else:
            print(f"[FAIL] Promo validation failed: {res.text}")
            
        # Analytics
        res = await client.get(f"{BASE_URL}/admin/stats", headers=headers)
        if res.status_code == 200:
            stats = res.json()
            print(f"[OK] Admin Stats fetched OK. Total Orders: {stats.get('total_orders')}")
        else:
            print(f"[FAIL] Admin Stats failed: {res.text}")

async def test_related_products():
    print("\n--- Testing Related Products ---")
    async with httpx.AsyncClient() as client:
        # Get any product
        res = await client.get(f"{BASE_URL}/products", params={"page_size": 1})
        products = res.json().get("items", [])
        if not products:
            print("[WARN] No products found to test related endpoint.")
            return
            
        product_id = products[0]["id"]
        res = await client.get(f"{BASE_URL}/products/{product_id}/related")
        
        if res.status_code == 200:
            related = res.json().get("items", [])
            print(f"[OK] Related products fetched OK ({len(related)} found)")
        else:
            print(f"[FAIL] Related products failed: {res.text}")

async def run_all():
    print("Starting E2E Backend Tests for Phase 3 & 4...\n")
    await test_newsletter()
    await test_auth_and_address()
    await test_promos_and_analytics()
    await test_related_products()
    print("\nTests complete.")

if __name__ == "__main__":
    asyncio.run(run_all())
