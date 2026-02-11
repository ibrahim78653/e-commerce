import sys
import os

# Add the backend directory to the Python path
# This allows imports like 'import models', 'from database import ...' 
# inside backend/main.py to work correctly even when run from the root directory.
backend_path = os.path.join(os.path.dirname(__file__), "backend")
if backend_path not in sys.path:
    sys.path.insert(0, backend_path)

# Import the FastAPI instance from backend/main.py
# Vercel expects an 'app' object in app.py, index.py, or similar.
from main import app

# The 'app' instance is now available for Vercel's Python runtime
