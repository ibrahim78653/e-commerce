import requests
import json

BASE = "http://localhost:8000/api"

# Test 1: Login
print("--- Test 1: Admin Login ---")
r = requests.post(BASE + "/auth/login", json={"identifier": "admin@burhani.com", "password": "Admin@123"}, timeout=10)
print("Status:", r.status_code)
data = r.json()
print("Role:", data["user"]["role"])
print("User keys:", list(data["user"].keys()))
token = data["access_token"]

# Test 2: Get profile
print("\n--- Test 2: Get Profile ---")
r = requests.get(BASE + "/auth/me", headers={"Authorization": "Bearer " + token}, timeout=10)
print("Status:", r.status_code)
print("Response:", r.json())

# Test 3: Products
print("\n--- Test 3: Products ---")
r = requests.get(BASE + "/products", timeout=10)
print("Status:", r.status_code)
d = r.json()
print("Total products:", d["total"])
if d["items"]:
    print("First product keys:", list(d["items"][0].keys()))

# Test 4: Categories
print("\n--- Test 4: Categories ---")
r = requests.get(BASE + "/categories", timeout=10)
print("Status:", r.status_code)
print("Response:", r.json())

# Test 5: Admin orders
print("\n--- Test 5: Admin Orders ---")
r = requests.get(BASE + "/admin/orders", headers={"Authorization": "Bearer " + token}, timeout=10)
print("Status:", r.status_code)
print("Orders count:", len(r.json()))

# Test 6: Admin users
print("\n--- Test 6: Admin Users ---")
r = requests.get(BASE + "/admin/users/", headers={"Authorization": "Bearer " + token}, timeout=10)
print("Status:", r.status_code)
print("Users count:", len(r.json()))

print("\n=== ALL TESTS COMPLETE ===")
