"""
Comprehensive API test for the e-commerce application
Tests: Auth, Products, Categories endpoints
"""
import requests
import json
import sys

BASE = "http://localhost:8000/api"
PASS = True

def test(name, response, expected_status=200):
    global PASS
    ok = response.status_code == expected_status
    status = "✅" if ok else "❌"
    print(f"{status} {name}: HTTP {response.status_code} (expected {expected_status})")
    if not ok:
        PASS = False
        try:
            print(f"   Response: {response.json()}")
        except:
            print(f"   Response: {response.text[:200]}")
    return ok


def main():
    global PASS
    
    # 1. Test root endpoint
    r = requests.get("http://localhost:8000/", timeout=10)
    test("Root endpoint", r)

    # 2. Register a test user
    r = requests.post(f"{BASE}/auth/register", json={
        "email": f"apitest_{__import__('time').time_ns()}@test.com",
        "phone": None,
        "password": "TestPass@123",
        "full_name": "API Test User"
    }, timeout=10)
    if test("Register new user", r):
        data = r.json()
        assert "access_token" in data, "Missing access_token"
        assert "user" in data, "Missing user"
        assert data["user"]["role"] == "customer", f"Expected customer role, got {data['user']['role']}"
        print(f"   User ID: {data['user']['id']}, Role: {data['user']['role']}")

    # 3. Login with admin
    r = requests.post(f"{BASE}/auth/login", json={
        "identifier": "admin@burhani.com",
        "password": "Admin@123"
    }, timeout=10)
    if test("Admin login", r):
        admin_data = r.json()
        assert admin_data["user"]["role"] == "admin", f"Expected admin role, got {admin_data['user']['role']}"
        admin_token = admin_data["access_token"]
        print(f"   Admin role: {admin_data['user']['role']} ✅")
    else:
        print("   ⚠️ Admin login failed, skipping admin-dependent tests")
        admin_token = None

    # 4. Login with wrong password
    r = requests.post(f"{BASE}/auth/login", json={
        "identifier": "admin@burhani.com",
        "password": "WrongPassword"
    }, timeout=10)
    test("Login with wrong password (should 401)", r, expected_status=401)

    # 5. Get profile (/auth/me)
    if admin_token:
        headers = {"Authorization": f"Bearer {admin_token}"}
        r = requests.get(f"{BASE}/auth/me", headers=headers, timeout=10)
        if test("Get admin profile", r):
            me = r.json()
            print(f"   Profile: {me.get('email')}, Role: {me.get('role')}")

    # 6. Get products (public)
    r = requests.get(f"{BASE}/products", timeout=10)
    if test("Get products", r):
        products = r.json()
        print(f"   Total: {products['total']}, Items on page: {len(products['items'])}")

    # 7. Get categories
    r = requests.get(f"{BASE}/categories", timeout=10)
    if test("Get categories", r):
        cats = r.json()
        print(f"   Categories: {[c['name'] for c in cats]}")

    # 8. Get single product (if any exist)
    r = requests.get(f"{BASE}/products", timeout=10)
    if r.status_code == 200 and r.json()["items"]:
        pid = r.json()["items"][0]["id"]
        r2 = requests.get(f"{BASE}/products/{pid}", timeout=10)
        test(f"Get single product (ID: {pid})", r2)

    # 9. Admin: get all orders
    if admin_token:
        headers = {"Authorization": f"Bearer {admin_token}"}
        r = requests.get(f"{BASE}/admin/orders", headers=headers, timeout=10)
        if test("Admin: get orders", r):
            print(f"   Orders count: {len(r.json())}")

    # 10. Admin: get all users
    if admin_token:
        headers = {"Authorization": f"Bearer {admin_token}"}
        r = requests.get(f"{BASE}/admin/users/", headers=headers, timeout=10)
        if test("Admin: get users", r):
            print(f"   Users count: {len(r.json())}")

    # 11. Refresh token
    if admin_token:
        refresh_token = admin_data.get("refresh_token")
        if refresh_token:
            r = requests.post(f"{BASE}/auth/refresh", json={
                "refresh_token": refresh_token
            }, timeout=10)
            test("Token refresh", r)

    print("\n" + "="*50)
    if PASS:
        print("🎉 ALL TESTS PASSED!")
    else:
        print("⚠️  SOME TESTS FAILED - see above")
    print("="*50)

if __name__ == "__main__":
    main()
