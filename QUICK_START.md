# Quick Start Guide

## ✅ Good News: Cookies Are NOT Required!

The Binance API works without authentication for most public profiles.

## Step 1: Install Dependencies

```bash
npm install
```

## Step 2: Create .env File

```bash
cp .env.example .env
```

Edit `.env` and set only the `TARGET_UID`:

```env
TARGET_UID=MQ7pqFO2JxnDK7CF8TEd7w
POLLING_INTERVAL_MS=60000
LOG_LEVEL=info
```

## Step 3: Test the Connection

```bash
node test-api.js
```

You should see: `✅ Test passed! The app should work correctly.`

## Step 4: Run the Monitor

**Development mode:**
```bash
npm run dev
```

**Production mode:**
```bash
npm run build
npm start
```

## Finding a User's TARGET_UID

Method 1: From Browser DevTools
1. Go to https://www.binance.com/en/square
2. Visit the user's profile
3. Open DevTools (F12 or Cmd+Opt+I)
4. Go to Network tab
5. Look for `queryUserProfilePageContentsWithFilter` request
6. Find `targetSquareUid` parameter in the URL

Method 2: Use the extract-headers.js Helper
```bash
node extract-headers.js
# Paste your cURL command (from DevTools: right-click request -> Copy as cURL)
# Press Ctrl+D when done
```

## When Do You Need Cookies?

Only if you get errors like:
- "Access denied"
- "Authentication required"
- Empty response when you know the user has posts

If that happens, copy ALL headers from your browser:
1. In DevTools Network tab, find the API request
2. Right-click -> Copy as cURL
3. Run: `node extract-headers.js`
4. Paste the cURL command

## Troubleshooting

**"No posts found" but user has posts?**
- The user might have no public posts
- Try a different user UID
- Check if cookies are needed for this specific user

**API errors?**
- Check your internet connection
- Verify the TARGET_UID is correct
- Try adding cookies (see above)

**No notifications?**
- Check System Preferences -> Notifications -> Terminal
- Make sure notifications are enabled

## Running 24/7

Use PM2:
```bash
npm install -g pm2
pm2 start npm --name "binance-monitor" -- start
pm2 startup
pm2 save
```

See README.md for full documentation.
