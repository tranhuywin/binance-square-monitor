# How to Test the Monitor

## Quick Test (With Your Real Account)

1. **Set up your UID:**
   ```bash
   cat > .env << 'END'
   TARGET_UID=SaUTNWi0AVKU44TzuPF4dQ
   POLLING_INTERVAL_MS=10000
   LOG_LEVEL=info
   END
   ```

2. **Start the monitor:**
   ```bash
   npm run dev
   ```

3. **In another terminal or browser:**
   - Go to https://www.binance.com/en/square
   - Create a new post
   - Within 10 seconds, you should get a notification!

## What You'll See

When you start the app:
```
=== Binance Square Monitor ===
Starting application...
Configuration loaded successfully
State loaded from file
Application started successfully
Monitoring user: SaUTNWi0AVKU44TzuPF4dQ
Polling interval: 10000ms
Press Ctrl+C to stop
```

On first run:
- It will see your existing posts but **won't notify** (by design)
- State file will be created with the latest post ID

When you create a new post:
- Within 10 seconds: Desktop notification appears
- Log shows: "New post detected!"
- State file updates with new post ID

## Testing Notifications

The app already sent you a test notification during `npm test`.
If you didn't see it, check:
- System Preferences → Notifications → Terminal
- Make sure notifications are enabled

## Changing the Polling Interval

Edit `.env` and change `POLLING_INTERVAL_MS`:
- `5000` = 5 seconds (faster, but may hit rate limits)
- `60000` = 60 seconds = 1 minute (recommended)
- `300000` = 5 minutes (slower, more conservative)

## Stopping the Monitor

Press `Ctrl+C` in the terminal running the app.

## Real-World Usage

For 24/7 monitoring:
```bash
npm run build
pm2 start npm --name "binance-monitor" -- start
pm2 save
```

Then you can close your terminal and it will keep running!
