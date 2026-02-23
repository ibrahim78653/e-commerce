import requests
import json

def test_register():
    url = "http://localhost:8000/api/auth/register"
    data = {
        "email": "test@example.com",
        "phone": "1234567890",
        "password": "Password@123",
        "full_name": "Test User"
    }
    try:
        print(f"Sending request to {url}...")
        response = requests.post(url, json=data, timeout=10)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {response.json()}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_register()
