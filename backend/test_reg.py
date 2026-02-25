import requests
import time

def test_register():
    url = "http://localhost:8000/api/auth/register"
    email = f"test_{int(time.time())}@example.com"
    payload = {
        "email": email,
        "password": "password123",
        "full_name": "Test User",
        "phone": str(int(time.time()))
    }
    try:
        response = requests.post(url, json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_register()
