# Database Setup Guide

## Finding Your Database ID

The database ID in Appwrite is **NOT** the display name. It's an auto-generated ID that looks like:
- `database-6937a9c0002084d4728c`

### How to Find It:

1. **From Appwrite Console URL:**
   - When viewing a collection, look at the URL
   - Example: `.../databases/database-6937a9c0002084d4728c/table-sites_collection`
   - The part after `/databases/` is your Database ID

2. **From Database Settings:**
   - Go to your database in Appwrite console
   - Click on the database name
   - The Database ID is shown in the settings page

3. **From Collection Settings:**
   - Go to any collection (like `sites_collection`)
   - The URL will show: `/databases/[DATABASE_ID]/table-[COLLECTION_ID]`

## Update Your .env File

Once you have the correct Database ID, update your `.env` file:

```env
VITE_APPWRITE_DATABASE_ID=database-6937a9c0002084d4728c
```

Replace `database-6937a9c0002084d4728c` with your actual database ID.

## Quick Check

After updating, restart your dev server and run the verification again at `/sites/verify`.






