from fastapi import APIRouter, Depends, HTTPException
import schemas, auth, database
from typing import Any, List
from datetime import datetime

router = APIRouter(prefix="/api", tags=["Newsletter"])


def strip_oid(doc):
    if isinstance(doc, list):
        return [strip_oid(d) for d in doc]
    if isinstance(doc, dict):
        return {k: strip_oid(v) for k, v in doc.items() if k != "_id"}
    return doc


@router.post("/newsletter/subscribe")
async def subscribe(data: schemas.NewsletterSubscribe, db: Any = Depends(database.get_db)):
    email = data.email.lower().strip()
    existing = await db.newsletter.find_one({"email": email})
    if existing:
        if existing.get("is_active", True):
            raise HTTPException(status_code=400, detail="Email already subscribed")
        # Re-activate unsubscribed email
        await db.newsletter.update_one({"email": email}, {"$set": {"is_active": True}})
        return {"message": "Welcome back! You've been re-subscribed."}

    new_id = await database.get_next_id(db, "newsletter")
    sub = {
        "id": new_id,
        "email": email,
        "name": data.name,
        "is_active": True,
        "subscribed_at": datetime.utcnow()
    }
    await db.newsletter.insert_one(sub)
    return {"message": "Successfully subscribed! Thank you for joining us."}


@router.post("/newsletter/unsubscribe")
async def unsubscribe(data: schemas.NewsletterUnsubscribe, db: Any = Depends(database.get_db)):
    email = data.email.lower().strip()
    sub = await db.newsletter.find_one({"email": email})
    if not sub:
        raise HTTPException(status_code=404, detail="Email not found")
    await db.newsletter.update_one({"email": email}, {"$set": {"is_active": False}})
    return {"message": "You have been unsubscribed."}


@router.get("/admin/newsletter")
async def list_subscribers(
    admin: Any = Depends(auth.get_admin),
    db: Any = Depends(database.get_db)
):
    subs = await db.newsletter.find({"is_active": True}).sort("subscribed_at", -1).to_list(length=1000)
    total = await db.newsletter.count_documents({"is_active": True})
    return {"subscribers": strip_oid(subs), "total": total}
