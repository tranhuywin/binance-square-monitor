# Binance Square Monitor

A production-ready Node.js + TypeScript application that monitors Binance Square for new posts from specified users and sends desktop notifications on macOS.

## Features

- 🔔 **Real-time Monitoring**: Polls Binance Square endpoint for new posts
- 👥 **Multi-User Support**: Monitor multiple users simultaneously
- 📱 **Desktop Notifications**: Native macOS notifications with post title and link
- 💾 **State Persistence**: Tracks seen posts per user to avoid duplicate notifications
- 🔄 **Retry Logic**: Exponential backoff with configurable retries
- ⚠️ **Error Handling**: Graceful error handling and rate-limit detection
- 📊 **Comprehensive Logging**: Winston-based logging with file output
- 🛡️ **Type Safety**: Full TypeScript implementation with strict mode
- ⚙️ **Configurable**: Environment-based configuration

## Prerequisites

- **Node.js**: >= 18.0.0
- **npm** or **yarn**
- **macOS**: Required for desktop notifications (uses `node-notifier`)

## Installation

1. **Clone or download the repository**:
   ```bash
   cd /path/to/binance-square-monitor
   ```

2. **Install dependencies**:
   ```bash
   npm install
   ```

3. **Create environment configuration**:
   ```bash
   cp .env.example .env
   ```

4. **Edit `.env` file** with your configuration:
   ```env
   # Required: Target user(s) Square UID to monitor
   # Multiple users (comma-separated):
   TARGET_UIDS=uid1,uid2,uid3
   # Or single user (backward compatible):
   # TARGET_UID=your_target_uid_here

   # Optional: Polling interval in milliseconds (default: 60000 = 1 minute)
   POLLING_INTERVAL_MS=60000

   # Optional: Request timeout in milliseconds (default: 10000)
   REQUEST_TIMEOUT_MS=10000

   # Optional: Maximum retry attempts (default: 3)
   MAX_RETRIES=3

   # Optional: Initial backoff time in milliseconds (default: 1000)
   INITIAL_BACKOFF_MS=1000

   # Optional: Maximum backoff time in milliseconds (default: 60000)
   MAX_BACKOFF_MS=60000

   # Optional: Path to state file (default: ./state.json)
   STATE_FILE_PATH=./state.json

   # Optional: Custom User-Agent header
   USER_AGENT=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36

   # Optional: Cookies for authentication (if needed)
   # COOKIES=cookie1=value1; cookie2=value2

   # Optional: Log level (default: info)
   # Options: error, warn, info, debug
   LOG_LEVEL=info
   ```

## Finding the TARGET_UID

To find a user's Square UID:

1. Go to the user's Binance Square profile in your browser
2. Open browser developer tools (F12 or Cmd+Opt+I)
3. Go to Network tab and filter by "Fetch/XHR"
4. Refresh the page
5. Look for requests to `queryUserProfilePageContentsWithFilter`
6. Find the `targetSquareUid` parameter in the request URL

Alternatively, you can inspect the page source or profile URL for the UID.

## Usage

### Development Mode

Run with `ts-node` for development:

```bash
npm run dev
```

### Production Build

1. **Build the application**:
   ```bash
   npm run build
   ```

2. **Run the compiled version**:
   ```bash
   npm start
   ```

### Linting

```bash
npm run lint        # Check for linting errors
npm run lint:fix    # Auto-fix linting errors
```

### Clean Build

```bash
npm run clean       # Remove dist folder
```

## Project Structure

```
binance-square-monitor/
├── src/
│   ├── config/
│   │   └── index.ts              # Configuration management
│   ├── services/
│   │   ├── binance-client.ts     # Binance API client with retry logic
│   │   ├── notification-service.ts # macOS notification service
│   │   ├── poll-service.ts       # Polling orchestration with backoff
│   │   └── state-manager.ts      # State persistence
│   ├── types/
│   │   └── index.ts              # TypeScript interfaces and types
│   ├── utils/
│   │   └── logger.ts             # Winston logger configuration
│   └── index.ts                  # Application entry point
├── logs/                         # Log files (auto-generated)
├── dist/                         # Compiled JavaScript (auto-generated)
├── .env                          # Environment configuration (create this)
├── .env.example                  # Example environment file
├── .gitignore                    # Git ignore rules
├── .eslintrc.json                # ESLint configuration
├── package.json                  # Project dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
└── README.md                     # This file
```

## How It Works

1. **Initialization**: 
   - Loads configuration from environment variables
   - Initializes state manager to track last seen post
   - Sets up Binance API client and notification service

2. **Polling Loop**:
   - Fetches latest posts from Binance Square endpoint
   - Compares with last seen post ID and timestamp
   - If new post detected, sends desktop notification
   - Updates state file with latest post information
   - Schedules next poll after configured interval

3. **Error Handling**:
   - Implements exponential backoff on failures
   - Detects and handles rate limiting (HTTP 429)
   - Stops after 5 consecutive errors and sends alert notification
   - Logs all errors to file for debugging

4. **State Management**:
   - Persists last seen post to `state.json`
   - On first run, initializes without triggering notifications for existing posts
   - Gracefully handles state file corruption

## Configuration Options

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `TARGET_UIDS` | Yes* | - | Comma-separated list of Binance Square user UIDs to monitor |
| `TARGET_UID` | Yes* | - | Single Binance Square user UID (backward compatible) |
| `POLLING_INTERVAL_MS` | No | 60000 | Time between polls (milliseconds) |
| `REQUEST_TIMEOUT_MS` | No | 10000 | HTTP request timeout |
| `MAX_RETRIES` | No | 3 | Maximum retry attempts per request |
| `INITIAL_BACKOFF_MS` | No | 1000 | Initial backoff delay |
| `MAX_BACKOFF_MS` | No | 60000 | Maximum backoff delay |
| `STATE_FILE_PATH` | No | ./state.json | Path to state persistence file |
| `USER_AGENT` | No | Chrome UA | Custom User-Agent header |
| `COOKIES` | No | - | Cookies for authentication |
| `LOG_LEVEL` | No | info | Logging level (error/warn/info/debug) |

\* Either `TARGET_UIDS` or `TARGET_UID` must be provided.

> **📘 Multi-User Monitoring**: See [MULTI_USER_GUIDE.md](./MULTI_USER_GUIDE.md) for detailed information about monitoring multiple users.

## Logging

Logs are written to:
- **Console**: Colored output with timestamps
- **logs/combined.log**: All logs
- **logs/error.log**: Error logs only

Log levels: `error`, `warn`, `info`, `debug`

## Running as a Background Service

### Using PM2 (Recommended)

1. **Install PM2 globally**:
   ```bash
   npm install -g pm2
   ```

2. **Start the application**:
   ```bash
   pm2 start npm --name "binance-monitor" -- start
   ```

3. **Manage the service**:
   ```bash
   pm2 status                  # Check status
   pm2 logs binance-monitor    # View logs
   pm2 restart binance-monitor # Restart
   pm2 stop binance-monitor    # Stop
   pm2 delete binance-monitor  # Remove
   ```

4. **Auto-start on system boot**:
   ```bash
   pm2 startup
   pm2 save
   ```

### Using macOS launchd

1. **Create a launch agent plist** at `~/Library/LaunchAgents/com.binance.monitor.plist`:
   ```xml
   <?xml version="1.0" encoding="UTF-8"?>
   <!DOCTYPE plist PUBLIC "-//Apple//DTD PLIST 1.0//EN" "http://www.apple.com/DTDs/PropertyList-1.0.dtd">
   <plist version="1.0">
   <dict>
       <key>Label</key>
       <string>com.binance.monitor</string>
       <key>ProgramArguments</key>
       <array>
           <string>/usr/local/bin/node</string>
           <string>/path/to/binance-square-monitor/dist/index.js</string>
       </array>
       <key>RunAtLoad</key>
       <true/>
       <key>KeepAlive</key>
       <true/>
       <key>StandardOutPath</key>
       <string>/path/to/binance-square-monitor/logs/stdout.log</string>
       <key>StandardErrorPath</key>
       <string>/path/to/binance-square-monitor/logs/stderr.log</string>
       <key>WorkingDirectory</key>
       <string>/path/to/binance-square-monitor</string>
   </dict>
   </plist>
   ```

2. **Load the launch agent**:
   ```bash
   launchctl load ~/Library/LaunchAgents/com.binance.monitor.plist
   ```

3. **Manage the service**:
   ```bash
   launchctl start com.binance.monitor   # Start
   launchctl stop com.binance.monitor    # Stop
   launchctl unload ~/Library/LaunchAgents/com.binance.monitor.plist  # Unload
   ```

## Troubleshooting

### No notifications appearing

1. **Check notification permissions**: 
   - System Preferences → Notifications → Terminal (or your terminal app)
   - Ensure notifications are enabled

2. **Check logs**:
   ```bash
   tail -f logs/combined.log
   ```

### Rate limiting errors

- Increase `POLLING_INTERVAL_MS` to reduce request frequency
- Check `logs/error.log` for rate limit details
- Consider adding cookies if the endpoint requires authentication

### Connection errors

1. **Check internet connection**
2. **Verify the Binance API is accessible**:
   ```bash
   curl "https://www.binance.com/bapi/composite/v1/friendly/pgc/content/queryUserProfilePageContentsWithFilter?targetSquareUid=YOUR_UID&timeOffset=-1&filterType=ALL"
   ```
3. **Try adding custom User-Agent or cookies in `.env`**

### Application stops after errors

- The app stops after 5 consecutive errors
- Check `logs/error.log` for root cause
- Fix the issue and restart the application

## Security Considerations

- **Never commit `.env` file** to version control
- **Keep cookies secure** if using authentication
- The application makes **read-only requests** to public Binance endpoints
- **No sensitive data** is stored except cookies (if provided)

## Development

### Adding Features

1. Modify the appropriate service file in `src/services/`
2. Update types in `src/types/index.ts`
3. Run linter: `npm run lint:fix`
4. Test with: `npm run dev`
5. Build: `npm run build`

### Testing

Manual testing:
1. Set a short polling interval (e.g., `10000` for 10 seconds)
2. Watch logs: `tail -f logs/combined.log`
3. Monitor notifications

## License

MIT

## Support

For issues or questions:
1. Check the logs in `logs/` directory
2. Review this README
3. Check your configuration in `.env`

## Changelog

### v2.0.0
- **Multi-User Support**: Monitor multiple users simultaneously
- **Enhanced State Management**: Per-user state tracking
- **Backward Compatibility**: Still supports single-user mode with `TARGET_UID`
- **Improved Logging**: User-specific logging for better debugging
- **Automatic Migration**: Seamlessly migrates from v1.0.0 state format

### v1.0.0
- Initial release
- Binance Square monitoring
- macOS desktop notifications
- State persistence
- Retry logic with exponential backoff
- Rate limit handling
- Comprehensive logging
- TypeScript implementation
- ESLint configuration

