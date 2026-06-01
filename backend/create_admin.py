"""
Creates (or resets) the Burhani Collection admin account.
Run: python create_admin.py
"""
import asyncio
from motor.motor_asyncio import AsyncIOMotorClient
from config import settings
from auth import get_password_hash
from database import get_next_id

# ── Credentials ──────────────────────────────
ADMIN_EMAIL    = "admin@burhani.com"
ADMIN_PASSWORD = "admin123"
ADMIN_NAME     = "Burhani Admin"
# ─────────────────────────────────────────────

async def create_or_reset_admin():
    client = AsyncIOMotorClient(settings.MONGODB_URL)
    db = client[settings.DB_NAME]

    hashed_pw = get_password_hash(ADMIN_PASSWORD)

    existing = await db.users.find_one({"email": ADMIN_EMAIL})

    if existing:
        # Reset password & ensure role is admin
        await db.users.update_one(
            {"email": ADMIN_EMAIL},
            {"$set": {
                "hashed_password": hashed_pw,
                "role": "admin",
                "is_active": True,
                "full_name": ADMIN_NAME,
            }}
        )
        print("[OK] Admin account updated.")
    else:
        # Create new admin
        count_doc = await db.counters.find_one({"_id": "users"})
        if not count_doc:
            max_user = await db.users.find_one(sort=[("id", -1)])
            start_val = max_user.get("id", 0) if max_user else 0
            await db.counters.update_one(
                {"_id": "users"},
                {"$set": {"seq": start_val}},
                upsert=True
            )

        new_id_result = await db.counters.find_one_and_update(
            {"_id": "users"},
            {"$inc": {"seq": 1}},
            upsert=True,
            return_document=True
        )
        new_id = new_id_result["seq"]

        await db.users.insert_one({
            "id": new_id,
            "email": ADMIN_EMAIL,
            "phone": None,
            "full_name": ADMIN_NAME,
            "hashed_password": hashed_pw,
            "role": "admin",
            "is_active": True,
        })
        print(f"[OK] Admin account created with ID: {new_id}")

    print()
    print("=" * 45)
    print("  ADMIN LOGIN CREDENTIALS")
    print("=" * 45)
    print(f"  URL      : http://localhost:5180/admin/login")
    print(f"  Email    : {ADMIN_EMAIL}")
    print(f"  Password : {ADMIN_PASSWORD}")
    print("=" * 45)

    client.close()

if __name__ == "__main__":
    asyncio.run(create_or_reset_admin())
