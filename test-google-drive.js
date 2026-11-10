/**
 * Test Google Drive upload/download using OAuth2 (real user account).
 * Run: node test-google-drive.js
 */

// Load .env manually (dotenv may not be installed as a direct dep)
const fs = require('fs');
const envPath = require('path').join(__dirname, '.env');
if (fs.existsSync(envPath)) {
  const lines = fs.readFileSync(envPath, 'utf-8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    const val = trimmed.substring(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (!process.env[key]) process.env[key] = val;
  }
}

const { google } = require('googleapis');

async function testGoogleDrive() {
  console.log('🚀 Testing Google Drive Integration (OAuth2)...\n');

  try {
    const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
    const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;
    const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;

    if (!clientId || !clientSecret || !refreshToken) {
      throw new Error(
        'Missing OAuth2 credentials. Make sure GOOGLE_OAUTH_CLIENT_ID, ' +
        'GOOGLE_OAUTH_CLIENT_SECRET, and GOOGLE_OAUTH_REFRESH_TOKEN are set in .env'
      );
    }

    console.log('✅ OAuth2 credentials found');
    console.log(`   Client ID: ${clientId.substring(0, 20)}...`);
    console.log(`   Refresh token: ${refreshToken.substring(0, 20)}...`);
    if (folderId) console.log(`   Folder ID: ${folderId}`);

    // Initialize OAuth2 client
    const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, 'http://localhost');
    oAuth2Client.setCredentials({ refresh_token: refreshToken });

    const drive = google.drive({ version: 'v3', auth: oAuth2Client });
    console.log('\n✅ Google Drive service initialized with OAuth2 (your Google account)\n');

    // --- Upload test ---
    const testContent = Buffer.from('HostMyService OAuth2 Drive test - ' + new Date().toISOString());
    const fileName = `test_oauth2_${Date.now()}.zip`;
    const { Readable } = require('stream');

    console.log(`📤 Testing Upload...`);
    console.log(`   File: ${fileName}`);
    console.log(`   Size: ${testContent.length} bytes`);

    const fileMetadata = { name: fileName };
    if (folderId) fileMetadata.parents = [folderId];

    const uploadResponse = await drive.files.create({
      requestBody: fileMetadata,
      media: {
        mimeType: 'application/zip',
        body: Readable.from(testContent),
      },
      fields: 'id, name, size',
    });

    const fileId = uploadResponse.data.id;
    console.log(`✅ Upload successful!`);
    console.log(`   File ID: ${fileId}`);
    console.log(`   File Name: ${uploadResponse.data.name}\n`);

    // --- Download test ---
    console.log(`📥 Testing Download...`);
    const downloadResponse = await drive.files.get(
      { fileId, alt: 'media' },
      { responseType: 'stream' }
    );

    const chunks = [];
    await new Promise((resolve, reject) => {
      downloadResponse.data.on('data', (chunk) => chunks.push(chunk));
      downloadResponse.data.on('end', resolve);
      downloadResponse.data.on('error', reject);
    });

    const downloadedContent = Buffer.concat(chunks);
    console.log(`✅ Download successful! Size: ${downloadedContent.length} bytes`);

    // --- Verify content ---
    if (testContent.equals(downloadedContent)) {
      console.log('✅ Content verification passed!\n');
    } else {
      console.log('❌ Content mismatch!');
      console.log('   Original:', testContent.toString());
      console.log('   Downloaded:', downloadedContent.toString());
    }

    // --- Cleanup ---
    await drive.files.delete({ fileId });
    console.log(`🧹 Test file deleted from Drive\n`);

    console.log('🎉 All Google Drive tests passed! Upload and download are working correctly.');
    console.log('\nYour .env is correctly configured. Restart the Next.js app to apply the changes.');

  } catch (err) {
    console.error('❌ Test failed:', err.message);

    if (err.message.includes('invalid_grant')) {
      console.log('\n💡 The refresh token is invalid or expired.');
      console.log('   Run `node scripts/get-refresh-token.js` again to get a new one.');
    } else if (err.message.includes('OAuth2')) {
      console.log('\n💡 Missing OAuth2 environment variables.');
      console.log('   Run `node scripts/get-refresh-token.js` to set them up.');
    } else {
      console.error('\nFull error:', err);
    }
    process.exit(1);
  }
}

testGoogleDrive();