# Quick Setup Guide

## 1. Install Dependencies

```bash
npm install
```

## 2. Configure Environment

Create a `.env` file from the example:

```bash
cp .env.example .env
```

Edit `.env` and set your `TARGET_UID`:

```env
TARGET_UID=123456789  # Replace with actual Binance Square user UID
```

## 3. Build & Run

**Development mode** (with auto-reload):
```bash
npm run dev
```

**Production mode**:
```bash
npm run build
npm start
```

## 4. Finding the TARGET_UID

1. Open Binance Square in browser: https://www.binance.com/en/square
2. Navigate to the user's profile you want to monitor
3. Open Browser DevTools (F12 or Cmd+Opt+I)
4. Go to Network tab, filter by "Fetch/XHR"
5. Refresh the page
6. Look for request: `queryUserProfilePageContentsWithFilter`
7. Find `targetSquareUid` parameter in the URL

## 5. Testing

Set a short polling interval in `.env` for testing:

```env
POLLING_INTERVAL_MS=10000  # 10 seconds
```

Watch the logs:
```bash
tail -f logs/combined.log
```

## Common Commands

```bash
npm run dev        # Run in development mode
npm run build      # Build for production
npm start          # Run built version
npm run lint       # Check code quality
npm run lint:fix   # Auto-fix linting issues
npm run clean      # Remove build artifacts
```

## Troubleshooting

**No notifications?**
- Check System Preferences → Notifications → Terminal
- Ensure notifications are enabled for your terminal app

**Errors in logs?**
- Verify `TARGET_UID` is correct
- Check internet connection
- Ensure Binance API is accessible
- Try increasing `POLLING_INTERVAL_MS`

**Rate limiting?**
- Increase `POLLING_INTERVAL_MS` (recommended: 60000 or higher)
- Add cookies if the endpoint requires authentication

## Running 24/7

**Option 1: PM2 (Recommended)**
```bash
npm install -g pm2
pm2 start npm --name "binance-monitor" -- start
pm2 startup  # Auto-start on boot
pm2 save
```

**Option 2: macOS launchd**
See README.md for detailed instructions.

## Support

- **Logs**: Check `logs/combined.log` and `logs/error.log`
- **Config**: Review `.env` settings
- **Docs**: See README.md for detailed documentation

