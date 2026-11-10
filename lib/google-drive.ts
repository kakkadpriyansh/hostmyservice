import { google } from 'googleapis';
import { Readable } from 'stream';
import { readFileSync } from 'fs';

/**
 * Initialize Google Drive API.
 *
 * Authentication strategy (tried in order):
 *
 *  1. OAuth2 with refresh token (GOOGLE_OAUTH_REFRESH_TOKEN is set)
 *     → Authenticates as your real Google account.
 *     → Uses YOUR personal Drive storage quota.
 *     → Works with a regular Google Drive folder — no Shared Drive needed.
 *     → Run `node scripts/get-refresh-token.js` once to obtain the token.
 *
 *  2. Service account (GOOGLE_SERVICE_ACCOUNT_KEY_PATH only)
 *     → REQUIRES a Shared Drive (Team Drive) with supportsAllDrives: true.
 *     → Service accounts have NO personal Drive quota, so uploading to a
 *       regular "My Drive" folder will fail with a 403 storageQuota error.
 */
function getDriveService() {
  const refreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;
  const clientId = process.env.GOOGLE_OAUTH_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_OAUTH_CLIENT_SECRET;

  // --- Strategy 1: OAuth2 with your real Google account ---
  if (refreshToken && clientId && clientSecret) {
    const oAuth2Client = new google.auth.OAuth2(clientId, clientSecret, 'http://localhost');
    oAuth2Client.setCredentials({ refresh_token: refreshToken });
    return { drive: google.drive({ version: 'v3', auth: oAuth2Client }), isSharedDrive: false };
  }

  // --- Strategy 2: Try to load from oauth-credentials.json automatically ---
  try {
    const oauthPath = process.env.GOOGLE_OAUTH_CREDENTIALS_PATH || './oauth-credentials.json';
    const creds = JSON.parse(readFileSync(oauthPath, 'utf-8'));
    const { client_id, client_secret } = creds.installed || creds.web;
    const storedRefreshToken = process.env.GOOGLE_OAUTH_REFRESH_TOKEN;

    if (storedRefreshToken && client_id && client_secret) {
      const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, 'http://localhost');
      oAuth2Client.setCredentials({ refresh_token: storedRefreshToken });
      return { drive: google.drive({ version: 'v3', auth: oAuth2Client }), isSharedDrive: false };
    }
  } catch {
    // oauth-credentials.json not found or missing token — fall through to service account
  }

  // --- Strategy 3: Service account (Shared Drive only) ---
  const keyPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
  if (!keyPath) {
    throw new Error(
      'Google Drive is not configured. ' +
        'Either set GOOGLE_OAUTH_REFRESH_TOKEN + GOOGLE_OAUTH_CLIENT_ID + GOOGLE_OAUTH_CLIENT_SECRET ' +
        '(run `node scripts/get-refresh-token.js` to get these), ' +
        'or set GOOGLE_SERVICE_ACCOUNT_KEY_PATH for Shared Drive mode.'
    );
  }

  let keyJson: Record<string, string>;
  try {
    keyJson = JSON.parse(readFileSync(keyPath, 'utf-8'));
  } catch (err) {
    throw new Error(`Failed to read service account key file at "${keyPath}": ${err}`);
  }

  const auth = new google.auth.GoogleAuth({
    credentials: keyJson,
    scopes: ['https://www.googleapis.com/auth/drive'],
  });

  return { drive: google.drive({ version: 'v3', auth }), isSharedDrive: true };
}

/**
 * Upload a file buffer to Google Drive.
 * Returns the Google Drive file ID.
 */
export async function uploadToGoogleDrive(buffer: Buffer, fileName: string): Promise<string> {
  try {
    const { drive, isSharedDrive } = getDriveService();
    const stream = Readable.from(buffer);

    const fileMetadata: Record<string, unknown> = { name: fileName };

    const folderId = process.env.GOOGLE_DRIVE_FOLDER_ID;
    if (folderId) {
      fileMetadata.parents = [folderId];
    }

    const response = await drive.files.create({
      requestBody: fileMetadata,
      media: { mimeType: 'application/zip', body: stream },
      fields: 'id',
      // supportsAllDrives is required when targeting a Shared Drive folder.
      // Harmless (but not needed) for personal Drive folders.
      supportsAllDrives: isSharedDrive,
    });

    if (!response.data.id) {
      throw new Error('No file ID returned from Google Drive');
    }

    console.log(`[Google Drive] Uploaded "${fileName}" → fileId: ${response.data.id}`);
    return response.data.id;
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);

    if (msg.includes('storage quota') || msg.includes('storageQuota')) {
      throw new Error(
        'Google Drive upload failed: service accounts have no personal Drive storage quota.\n' +
          'Fix: run `node scripts/get-refresh-token.js` to generate an OAuth2 refresh token,\n' +
          'then add GOOGLE_OAUTH_REFRESH_TOKEN, GOOGLE_OAUTH_CLIENT_ID and\n' +
          'GOOGLE_OAUTH_CLIENT_SECRET to your .env file.'
      );
    }

    console.error('[Google Drive] Upload error:', error);
    throw new Error(`Failed to upload file to Google Drive: ${msg}`);
  }
}

/**
 * Download a file from Google Drive by its file ID.
 * Returns the file contents as a Buffer.
 */
export async function downloadFromGoogleDrive(fileId: string): Promise<Buffer> {
  try {
    const { drive, isSharedDrive } = getDriveService();

    const response = await drive.files.get(
      {
        fileId,
        alt: 'media',
        supportsAllDrives: isSharedDrive,
      },
      { responseType: 'stream' }
    );

    const chunks: Buffer[] = [];
    return new Promise<Buffer>((resolve, reject) => {
      (response.data as NodeJS.ReadableStream).on('data', (chunk: Buffer) =>
        chunks.push(Buffer.isBuffer(chunk) ? chunk : Buffer.from(chunk))
      );
      (response.data as NodeJS.ReadableStream).on('end', () => resolve(Buffer.concat(chunks)));
      (response.data as NodeJS.ReadableStream).on('error', reject);
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : String(error);
    console.error('[Google Drive] Download error:', error);
    throw new Error(`Failed to download file from Google Drive: ${msg}`);
  }
}