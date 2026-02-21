import traceback
import sys

try:
    from config import settings
    print("Success")
except Exception:
    err = traceback.format_exc()
    lines = err.splitlines()
    for line in lines[-10:]:
        print(line)
