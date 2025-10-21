#!/usr/bin/env node
/**
 * Complete integration test
 */
const { loadConfig } = require('./dist/config');
const { BinanceClient } = require('./dist/services/binance-client');
const { NotificationService } = require('./dist/services/notification-service');
const { StateManager } = require('./dist/services/state-manager');

async function test() {
  console.log('🧪 Running Complete Integration Test\n');
  
  try {
    // Test 1: Configuration
    console.log('1️⃣  Testing configuration loading...');
    const config = loadConfig();
    console.log(`   ✅ Config loaded for UID: ${config.targetUid}`);
    console.log(`   ✅ Polling interval: ${config.pollingIntervalMs}ms`);
    console.log('');

    // Test 2: State Manager
    console.log('2️⃣  Testing state manager...');
    const stateManager = new StateManager('./test-state.json');
    await stateManager.load();
    console.log('   ✅ State manager initialized');
    console.log('');

    // Test 3: Binance Client
    console.log('3️⃣  Testing Binance API client...');
    const binanceClient = new BinanceClient(config);
    const posts = await binanceClient.fetchLatestPosts();
    console.log(`   ✅ API call successful, found ${posts.length} posts`);
    
    if (posts.length > 0) {
      const latest = posts[0];
      console.log('   📰 Latest post:');
      console.log(`      - ID: ${latest.id}`);
      console.log(`      - Title: ${latest.title || '(no title)'}`);
      console.log(`      - Created: ${new Date(latest.createTime).toISOString()}`);
      console.log(`      - URL: ${binanceClient.getPostUrl(latest.contentId)}`);
    } else {
      console.log('   ℹ️  No posts found for this user (user may have no public posts)');
    }
    console.log('');

    // Test 4: Notification Service
    console.log('4️⃣  Testing notification service...');
    const notificationService = new NotificationService();
    console.log('   ⏳ Sending test notification...');
    await notificationService.send({
      title: '✅ Binance Monitor Test',
      message: 'If you see this, notifications are working!',
      sound: false,
    });
    console.log('   ✅ Test notification sent');
    console.log('');

    // Clean up test state
    const fs = require('fs');
    if (fs.existsSync('./test-state.json')) {
      fs.unlinkSync('./test-state.json');
    }

    console.log('🎉 All tests passed!');
    console.log('');
    console.log('✨ Your application is ready to use!');
    console.log('   Run: npm run dev (for development)');
    console.log('   Or:  npm start (for production)');
    
  } catch (error) {
    console.error('\n❌ Test failed:', error.message);
    if (error.stack) {
      console.error('\nStack trace:');
      console.error(error.stack);
    }
    process.exit(1);
  }
}

test();

