import sys
import os

# Add the backend directory to the Python path
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
backend_path = os.path.join(BASE_DIR, "backend")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Import the FastAPI instance from backend/main.py
# Vercel expects an 'app' object in app.py, index.py, or similar.
from main import app

# The 'app' instance is now available for Vercel's Python runtime
