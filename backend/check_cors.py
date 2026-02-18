import requests
import sys

BACKEND_URL = "https://e-commerce-1-pldj.onrender.com"
FRONTEND_ORIGIN = "https://burhanicollection.vercel.app"

def check_cors():
    print(f"Checking CORS for backend: {BACKEND_URL}")
    print(f"Origin: {FRONTEND_ORIGIN}")
    
    try:
        # Send a preflight OPTIONS request
        response = requests.options(
            f"{BACKEND_URL}/",
            headers={
                "Origin": FRONTEND_ORIGIN,
                "Access-Control-Request-Method": "GET",
            },
            timeout=10
        )
        
        print(f"\nStatus Code: {response.status_code}")
        print("Headers:")
        for k, v in response.headers.items():
            if "access-control" in k.lower():
                print(f"  {k}: {v}")
        
        allow_origin = response.headers.get("access-control-allow-origin")
        
        if allow_origin == FRONTEND_ORIGIN or allow_origin == "*":
            print("\nSUCCESS: CORS is configured correctly for this origin.")
        else:
            print(f"\nFAILURE: 'Access-Control-Allow-Origin' header is missing or incorrect. Got: {allow_origin}")
            print("Make sure the backend is deployed with the latest environment variables.")

    except Exception as e:
        print(f"\nERROR: Failed to connect to backend: {e}")

if __name__ == "__main__":
    check_cors()
