import requests
import sys

BACKEND_URL = "http://localhost:8000"
FRONTEND_ORIGIN = "http://localhost:5174"

def check_local_cors():
    print(f"Checking LOCAL CORS for backend: {BACKEND_URL}")
    print(f"Origin: {FRONTEND_ORIGIN}")
    
    try:
        # Send a preflight OPTIONS request
        response = requests.options(
            f"{BACKEND_URL}/api/products",
            headers={
                "Origin": FRONTEND_ORIGIN,
                "Access-Control-Request-Method": "GET",
            },
            timeout=5
        )
        
        print(f"\nStatus Code: {response.status_code}")
        print("Headers:")
        for k, v in response.headers.items():
            if "access-control" in k.lower():
                print(f"  {k}: {v}")
        
        allow_origin = response.headers.get("access-control-allow-origin")
        
        if allow_origin == FRONTEND_ORIGIN or allow_origin == "*":
            print("\nSUCCESS: Local CORS is configured correctly.")
        else:
            print(f"\nFAILURE: 'Access-Control-Allow-Origin' header is incorrect. Got: {allow_origin}")

    except Exception as e:
        print(f"\nERROR: Failed to connect to local backend: {e}")

if __name__ == "__main__":
    check_local_cors()
