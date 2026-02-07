from passlib.context import CryptContext
import traceback

try:
    pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")
    hash = pwd_context.hash("secret")
    print(f"Hash: {hash}")
    verify = pwd_context.verify("secret", hash)
    print(f"Verify: {verify}")
except Exception:
    traceback.print_exc()
