from fastapi import APIRouter, Depends, HTTPException
import schemas, auth, database
from typing import List, Any
from datetime import datetime

router = APIRouter(prefix="/api", tags=["Addresses"])


def strip_oid(doc):
    if isinstance(doc, list):
        return [strip_oid(d) for d in doc]
    if isinstance(doc, dict):
        return {k: strip_oid(v) for k, v in doc.items() if k != "_id"}
    return doc


@router.get("/users/addresses")
async def get_addresses(
    current_user: Any = Depends(auth.get_current_user),
    db: Any = Depends(database.get_db)
):
    addresses = await db.addresses.find({"user_id": current_user.id}).sort("is_default", -1).to_list(length=20)
    return strip_oid(addresses)


@router.post("/users/addresses")
async def create_address(
    data: schemas.AddressCreate,
    current_user: Any = Depends(auth.get_current_user),
    db: Any = Depends(database.get_db)
):
    new_id = await database.get_next_id(db, "addresses")

    # If this is set as default, unset all others first
    if data.is_default:
        await db.addresses.update_many(
            {"user_id": current_user.id},
            {"$set": {"is_default": False}}
        )

    address = data.dict()
    address["id"] = new_id
    address["user_id"] = current_user.id
    address["created_at"] = datetime.utcnow()

    await db.addresses.insert_one(address)
    return strip_oid(address)


@router.put("/users/addresses/{address_id}")
async def update_address(
    address_id: int,
    data: schemas.AddressCreate,
    current_user: Any = Depends(auth.get_current_user),
    db: Any = Depends(database.get_db)
):
    address = await db.addresses.find_one({"id": address_id, "user_id": current_user.id})
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    if data.is_default:
        await db.addresses.update_many(
            {"user_id": current_user.id},
            {"$set": {"is_default": False}}
        )

    update = data.dict()
    await db.addresses.update_one({"id": address_id}, {"$set": update})
    updated = await db.addresses.find_one({"id": address_id})
    return strip_oid(updated)


@router.delete("/users/addresses/{address_id}")
async def delete_address(
    address_id: int,
    current_user: Any = Depends(auth.get_current_user),
    db: Any = Depends(database.get_db)
):
    address = await db.addresses.find_one({"id": address_id, "user_id": current_user.id})
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")
    await db.addresses.delete_one({"id": address_id})
    return {"message": "Address deleted"}


@router.patch("/users/addresses/{address_id}/set-default")
async def set_default_address(
    address_id: int,
    current_user: Any = Depends(auth.get_current_user),
    db: Any = Depends(database.get_db)
):
    address = await db.addresses.find_one({"id": address_id, "user_id": current_user.id})
    if not address:
        raise HTTPException(status_code=404, detail="Address not found")

    await db.addresses.update_many({"user_id": current_user.id}, {"$set": {"is_default": False}})
    await db.addresses.update_one({"id": address_id}, {"$set": {"is_default": True}})
    return {"message": "Default address updated"}
