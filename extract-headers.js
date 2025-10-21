#!/usr/bin/env node
/**
 * Helper script to extract headers from a cURL command
 * Usage: node extract-headers.js
 * Then paste your cURL command and press Ctrl+D
 */

const fs = require('fs');
const readline = require('readline');

console.log('Paste your cURL command here (press Ctrl+D when done):');
console.log('');

let curlCommand = '';

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
  terminal: false,
});

rl.on('line', (line) => {
  curlCommand += line + '\n';
});

rl.on('close', () => {
  try {
    // Extract TARGET_UID from URL
    const uidMatch = curlCommand.match(/targetSquareUid=([^&'\s]+)/);
    const targetUid = uidMatch ? uidMatch[1] : '';

    // Extract cookies
    const cookieMatch = curlCommand.match(/-b\s+'([^']+)'/);
    const cookies = cookieMatch ? cookieMatch[1] : '';

    // Extract specific headers
    const csrfMatch = curlCommand.match(/-H\s+'csrftoken:\s*([^']+)'/);
    const csrfToken = csrfMatch ? csrfMatch[1] : '';

    const deviceInfoMatch = curlCommand.match(/-H\s+'device-info:\s*([^']+)'/);
    const deviceInfo = deviceInfoMatch ? deviceInfoMatch[1] : '';

    const fvideoIdMatch = curlCommand.match(/-H\s+'fvideo-id:\s*([^']+)'/);
    const fvideoId = fvideoIdMatch ? fvideoIdMatch[1] : '';

    const fvideoTokenMatch = curlCommand.match(/-H\s+'fvideo-token:\s*([^']+)'/);
    const fvideoToken = fvideoTokenMatch ? fvideoTokenMatch[1] : '';

    const bncUuidMatch = curlCommand.match(/-H\s+'bnc-uuid:\s*([^']+)'/);
    const bncUuid = bncUuidMatch ? bncUuidMatch[1] : '';

    // Generate .env content
    const envContent = `# Required: The target user's Square UID to monitor
TARGET_UID=${targetUid}

# Required for Binance API: Cookies from your browser
COOKIES=${cookies}

# Optional but recommended: Additional headers from browser
CSRF_TOKEN=${csrfToken}
DEVICE_INFO=${deviceInfo}
FVIDEO_ID=${fvideoId}
FVIDEO_TOKEN=${fvideoToken}
BNC_UUID=${bncUuid}

# Optional: Polling interval in milliseconds (default: 60000 = 1 minute)
POLLING_INTERVAL_MS=60000

# Optional: Request timeout in milliseconds (default: 10000)
REQUEST_TIMEOUT_MS=10000

# Optional: Maximum retry attempts (default: 3)
MAX_RETRIES=3

# Optional: Log level (default: info)
LOG_LEVEL=info
`;

    // Write to .env file
    fs.writeFileSync('.env', envContent);

    console.log('\n✅ Successfully extracted headers and created .env file!');
    console.log('\nExtracted values:');
    console.log(`  TARGET_UID: ${targetUid || '(not found)'}`);
    console.log(`  COOKIES: ${cookies ? '✓ Found' : '✗ Not found'}`);
    console.log(`  CSRF_TOKEN: ${csrfToken ? '✓ Found' : '✗ Not found'}`);
    console.log(`  DEVICE_INFO: ${deviceInfo ? '✓ Found' : '✗ Not found'}`);
    console.log(`  FVIDEO_ID: ${fvideoId ? '✓ Found' : '✗ Not found'}`);
    console.log(`  FVIDEO_TOKEN: ${fvideoToken ? '✓ Found' : '✗ Not found'}`);
    console.log(`  BNC_UUID: ${bncUuid ? '✓ Found' : '✗ Not found'}`);
    console.log('\n⚠️  Note: These tokens may expire. You may need to refresh them periodically.');
    console.log('\n📝 Your .env file has been created. Run: npm run dev');
  } catch (error) {
    console.error('\n❌ Error parsing cURL command:', error.message);
    process.exit(1);
  }
});

