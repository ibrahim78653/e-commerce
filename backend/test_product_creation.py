import httpx
import asyncio

BASE_URL = "http://localhost:8000/api"

async def test_create_product():
    async with httpx.AsyncClient() as client:
        # 1. Login as admin
        print("\n--- Logging in as Admin ---")
        login_resp = await client.post(f"{BASE_URL}/auth/login", json={
            "identifier": "admin@burhani.com",
            "password": "admin123"
        })
        
        if login_resp.status_code != 200:
            print(f"Admin Login Failed: {login_resp.text}")
            return
        
        token = login_resp.json()["access_token"]
        headers = {"Authorization": f"Bearer {token}"}
        
        # 2. Get categories to use a valid category_id
        cat_resp = await client.get(f"{BASE_URL}/categories")
        categories = cat_resp.json()
        category_id = categories[0]["id"] if categories else 1
        
        # 3. Create Product
        print("\n--- Attempting to create a product ---")
        product_payload = {
            "name": "Test Product Fix",
            "slug": "test-product-fix",
            "description": "Verification product",
            "original_price": 999.0,
            "discount_price": 899.0,
            "stock": 10,
            "category_id": category_id,
            "is_active": True,
            "is_featured": False,
            "image_urls": ["https://via.placeholder.com/400"],
            "color_variants": []
        }
        
        prod_resp = await client.post(f"{BASE_URL}/products", json=product_payload, headers=headers)
        
        print(f"Product Creation Status: {prod_resp.status_code}")
        if prod_resp.status_code == 200:
            print("SUCCESS: Product created successfully! The write concern error is FIXED.")
            # Cleanup: Delete the product if possible (though we don't have a direct delete endpoint shown in products.py besides deactivation)
            prod_id = prod_resp.json()["id"]
            print(f"Created Product ID: {prod_id}")
        else:
            print(f"FAILURE: {prod_resp.text}")

if __name__ == "__main__":
    asyncio.run(test_create_product())
