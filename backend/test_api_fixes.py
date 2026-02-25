import httpx
import time
import asyncio

BASE_URL = "http://localhost:8000/api"

async def test_full_flow():
    timestamp = int(time.time())
    email = f"user_{timestamp}@test.com"
    password = "SecurePassword123!"
    phone = f"80000{timestamp}"[-10:]
    
    async with httpx.AsyncClient() as client:
        # 1. Register
        print(f"\n--- Testing Registration for {email} ---")
        reg_resp = await client.post(f"{BASE_URL}/auth/register", json={
            "email": email,
            "password": password,
            "full_name": "Test User",
            "phone": phone
        })
        print(f"Registration Status: {reg_resp.status_code}")
        if reg_resp.status_code != 200:
            print(f"Registration Error: {reg_resp.text}")
            return
        
        # 2. Login
        print(f"\n--- Testing Login for {email} ---")
        login_resp = await client.post(f"{BASE_URL}/auth/login", json={
            "identifier": email,
            "password": password
        })
        print(f"Login Status: {login_resp.status_code}")
        if login_resp.status_code == 200:
            print("SUCCESS: Login worked for the new user!")
            token = login_resp.json()["access_token"]
            
            # 3. Create Product (Requires Admin, but let's see if we can at least hit it)
            # Actually, the user's error was when *trying* to create a product.
            # I need an admin token to test product creation.
            # Since I saw ID 1 is administrative, maybe I can find its password or reset it?
            # Or perhaps 'test@example.com' with ID 5 is an admin too.
        else:
            print(f"Login Error: {login_resp.text}")

if __name__ == "__main__":
    asyncio.run(test_full_flow())
