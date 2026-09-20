import asyncio
import re
from collections import defaultdict
from datetime import datetime, timezone

from app.services.database import interviews_collection, users_collection


def normalize_email(email: str) -> str:
    return (email or "").strip().lower()


def created_at_sort_key(user_document):
    created_at = user_document.get("created_at")
    if isinstance(created_at, datetime):
        return created_at

    return datetime.max.replace(tzinfo=timezone.utc)


async def lowercase_all_emails():
    if users_collection is None or interviews_collection is None:
        raise RuntimeError("Database is not configured")

    user_documents = await users_collection.find({}).to_list(length=None)
    interview_documents = await interviews_collection.find({}).to_list(length=None)

    grouped_users = defaultdict(list)
    for user_document in user_documents:
        grouped_users[normalize_email(user_document.get("email", ""))].append(user_document)

    merged_groups = []
    updated_users = 0
    updated_interviews = 0
    deleted_users = 0

    for normalized_email, group in grouped_users.items():
        if not normalized_email:
            continue

        sorted_group = sorted(
            group,
            key=lambda document: (
                created_at_sort_key(document),
                normalize_email(document.get("email", "")),
                str(document.get("_id", "")),
            ),
        )
        keeper = sorted_group[0]
        keeper_id = keeper["_id"]
        keeper_email = normalize_email(keeper.get("email", ""))

        if keeper.get("email", "") != keeper_email:
            await users_collection.update_one(
                {"_id": keeper_id},
                {"$set": {"email": keeper_email}},
            )
            updated_users += 1

        duplicate_entries = sorted_group[1:]
        if duplicate_entries:
            merged_groups.append(
                {
                    "kept_email": keeper_email,
                    "duplicates": [normalize_email(item.get("email", "")) for item in duplicate_entries],
                }
            )

        for duplicate in duplicate_entries:
            duplicate_email = normalize_email(duplicate.get("email", ""))
            if not duplicate_email:
                continue

            interview_filter = {
                "user_email": {"$regex": f"^{re.escape(duplicate_email)}$", "$options": "i"}
            }
            interview_update_result = await interviews_collection.update_many(
                interview_filter,
                {"$set": {"user_email": keeper_email}},
            )
            updated_interviews += interview_update_result.modified_count

            delete_result = await users_collection.delete_one({"_id": duplicate["_id"]})
            deleted_users += delete_result.deleted_count

    remaining_users = await users_collection.find({}).to_list(length=None)
    for user_document in remaining_users:
        normalized_email = normalize_email(user_document.get("email", ""))
        if normalized_email and user_document.get("email", "") != normalized_email:
            result = await users_collection.update_one(
                {"_id": user_document["_id"]},
                {"$set": {"email": normalized_email}},
            )
            updated_users += result.modified_count

    remaining_interviews = await interviews_collection.find({}).to_list(length=None)
    for interview_document in remaining_interviews:
        normalized_email = normalize_email(interview_document.get("user_email", ""))
        if normalized_email and interview_document.get("user_email", "") != normalized_email:
            result = await interviews_collection.update_one(
                {"_id": interview_document["_id"]},
                {"$set": {"user_email": normalized_email}},
            )
            updated_interviews += result.modified_count

    print("Email migration complete.")
    print(f"Lowercased/updated user documents: {updated_users}")
    print(f"Updated interview documents: {updated_interviews}")
    print(f"Deleted duplicate user records: {deleted_users}")

    if merged_groups:
        print("Merged duplicate groups:")
        for group in merged_groups:
            print(f"  Kept {group['kept_email']} | merged duplicates: {group['duplicates']}")
    else:
        print("No duplicate user groups were found.")


if __name__ == "__main__":
    asyncio.run(lowercase_all_emails())
