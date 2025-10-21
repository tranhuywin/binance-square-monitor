#!/usr/bin/env node
const axios = require('axios');
require('dotenv').config();

async function testAPI() {
  console.log('🧪 Testing Binance API connection...\n');

  const headers = {
    'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/141.0.0.0 Safari/537.36 Edg/141.0.0.0',
    'Accept': '*/*',
    'Accept-Language': 'en-US,en;q=0.9',
    'Content-Type': 'application/json',
    'clienttype': 'web',
    'lang': 'en',
    'sec-fetch-dest': 'empty',
    'sec-fetch-mode': 'cors',
    'sec-fetch-site': 'same-origin',
  };

  if (process.env.COOKIES) headers.Cookie = process.env.COOKIES;
  if (process.env.CSRF_TOKEN) headers.csrftoken = process.env.CSRF_TOKEN;
  if (process.env.DEVICE_INFO) headers['device-info'] = process.env.DEVICE_INFO;
  if (process.env.FVIDEO_ID) headers['fvideo-id'] = process.env.FVIDEO_ID;
  if (process.env.FVIDEO_TOKEN) headers['fvideo-token'] = process.env.FVIDEO_TOKEN;
  if (process.env.BNC_UUID) headers['bnc-uuid'] = process.env.BNC_UUID;

  console.log('Target UID:', process.env.TARGET_UID);
  console.log('Headers configured:', Object.keys(headers).length);
  console.log('');

  try {
    const response = await axios.get(
      'https://www.binance.com/bapi/composite/v1/friendly/pgc/content/queryUserProfilePageContentsWithFilter',
      {
        params: {
          targetSquareUid: process.env.TARGET_UID,
          timeOffset: -1,
          filterType: 'ALL',
        },
        headers,
        timeout: 10000,
      }
    );

    console.log('✅ API Response Status:', response.status);
    console.log('✅ Success:', response.data.success);
    console.log('');

    if (response.data.success && response.data.data.userProfileDataDTOS) {
      const posts = response.data.data.userProfileDataDTOS;
      console.log(`📝 Found ${posts.length} posts`);
      
      if (posts.length > 0) {
        const latest = posts[0];
        console.log('\n📰 Latest Post:');
        console.log('  ID:', latest.id);
        console.log('  Content ID:', latest.contentId);
        console.log('  Title:', latest.title || '(no title)');
        console.log('  Summary:', (latest.summary || '').substring(0, 100));
        console.log('  Created:', new Date(latest.createTime).toISOString());
        console.log('  Author:', latest.author?.nickname || 'Unknown');
        console.log('  URL: https://www.binance.com/en/square/post/' + latest.contentId);
      }
    } else {
      console.log('⚠️  API returned success but no posts found');
    }

    console.log('\n✅ Test passed! The app should work correctly.');
  } catch (error) {
    console.error('❌ API Test Failed!\n');
    
    if (error.response) {
      console.error('Status:', error.response.status);
      console.error('Response:', JSON.stringify(error.response.data, null, 2));
    } else if (error.request) {
      console.error('No response received from server');
      console.error('Error:', error.message);
    } else {
      console.error('Error:', error.message);
    }
    
    console.error('\n💡 Troubleshooting:');
    console.error('1. Make sure your .env file has all required fields');
    console.error('2. Cookies and tokens may have expired - get fresh ones from browser');
    console.error('3. Check your internet connection');
    process.exit(1);
  }
}

testAPI();

