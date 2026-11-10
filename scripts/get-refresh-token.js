/**
 * Run this ONCE to get a Google OAuth2 refresh token.
 * Usage: node scripts/get-refresh-token.js
 *
 * Steps:
 *  1. It prints a URL — open it in your browser and sign in with your Google account.
 *  2. After you allow access, Google redirects to localhost with a `code=...` in the URL.
 *  3. Copy that code and paste it here when prompted.
 *  4. It prints your GOOGLE_OAUTH_REFRESH_TOKEN — copy it into your .env file.
 */

const { google } = require('googleapis');
const readline = require('readline');
const fs = require('fs');
const path = require('path');

// Load OAuth2 credentials
const credPath = path.join(__dirname, '..', 'oauth-credentials.json');
if (!fs.existsSync(credPath)) {
  console.error('❌ oauth-credentials.json not found at:', credPath);
  process.exit(1);
}

const creds = JSON.parse(fs.readFileSync(credPath, 'utf-8'));
const { client_id, client_secret, redirect_uris } = creds.installed || creds.web;

const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris[0]);

// Scopes needed for Drive upload/download
const SCOPES = ['https://www.googleapis.com/auth/drive'];

const authUrl = oAuth2Client.generateAuthUrl({
  access_type: 'offline',
  prompt: 'consent', // forces refresh_token to be returned even if already authorized
  scope: SCOPES,
});

console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('  Google Drive OAuth2 Setup');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
console.log('Step 1: Open this URL in your browser and sign in:\n');
console.log(authUrl);
console.log('\nStep 2: After signing in, copy the "code" from the redirect URL.');
console.log('  The URL will look like: http://localhost/?code=4/0AX...&scope=...');
console.log('  Copy everything after "code=" and before "&scope"\n');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');

const rl = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

rl.question('Paste the authorization code here: ', async (code) => {
  rl.close();
  try {
    const { tokens } = await oAuth2Client.getToken(code.trim());

    if (!tokens.refresh_token) {
      console.error('\n❌ No refresh_token received.');
      console.log('   This can happen if you already authorized this app before.');
      console.log('   Fix: Go to https://myaccount.google.com/permissions, revoke access');
      console.log('   for this app, then run this script again.\n');
      process.exit(1);
    }

    console.log('\n✅ Success! Add these to your .env file:\n');
    console.log(`GOOGLE_OAUTH_CLIENT_ID="${client_id}"`);
    console.log(`GOOGLE_OAUTH_CLIENT_SECRET="${client_secret}"`);
    console.log(`GOOGLE_OAUTH_REFRESH_TOKEN="${tokens.refresh_token}"`);
    console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
    console.log('  Copy the three lines above into your .env file, then restart the app.');
    console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n');
  } catch (err) {
    console.error('\n❌ Failed to exchange code for tokens:', err.message);
    if (err.message.includes('invalid_grant')) {
      console.log('   The code may have expired (they expire in ~10 minutes).');
      console.log('   Run the script again and paste the code quickly.\n');
    }
    process.exit(1);
  }
});
