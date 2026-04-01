import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import http from 'node:http';
import { google } from 'googleapis';
import open from 'open';

const CONFIG_DIR = path.join(os.homedir(), '.config', 'parrotube');
const CLIENT_SECRET_PATH = path.join(CONFIG_DIR, 'client_secret.json');
const TOKEN_PATH = path.join(CONFIG_DIR, 'token.json');

export const SCOPES = [
  'https://www.googleapis.com/auth/yt-analytics.readonly',
  'https://www.googleapis.com/auth/youtube.readonly',
];

interface ClientSecretFile {
  installed: {
    client_id: string;
    client_secret: string;
    redirect_uris: string[];
  };
}

export function loadClientSecret(): ClientSecretFile {
  const raw = fs.readFileSync(CLIENT_SECRET_PATH, 'utf-8');
  return JSON.parse(raw) as ClientSecretFile;
}

export function loadToken(): Record<string, unknown> | null {
  try {
    const raw = fs.readFileSync(TOKEN_PATH, 'utf-8');
    return JSON.parse(raw) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export function saveToken(token: Record<string, unknown>): void {
  fs.mkdirSync(CONFIG_DIR, { recursive: true });
  fs.writeFileSync(TOKEN_PATH, JSON.stringify(token, null, 2));
}

export async function authenticate(): Promise<void> {
  const { installed } = loadClientSecret();
  const oauth2 = new google.auth.OAuth2(
    installed.client_id,
    installed.client_secret,
    'http://localhost:3210',
  );

  const authorizeUrl = oauth2.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
  });

  const codePromise = listenForCode(3210);
  process.stderr.write('Waiting for authorization...\n');
  await open(authorizeUrl);

  const code = await codePromise;
  const { tokens } = await oauth2.getToken(code);
  saveToken(tokens as Record<string, unknown>);
  process.stderr.write('Authentication successful. Token saved.\n');
}

export async function getAuthClient() {
  const { installed } = loadClientSecret();
  const oauth2 = new google.auth.OAuth2(
    installed.client_id,
    installed.client_secret,
    'http://localhost:3210',
  );

  const token = loadToken();
  if (!token) {
    throw new Error(
      'Not authenticated. Run `parrotube auth` first.',
    );
  }

  oauth2.setCredentials(token);
  return oauth2;
}

function listenForCode(port: number): Promise<string> {
  return new Promise((resolve, reject) => {
    const server = http.createServer((req, res) => {
      const url = new URL(req.url ?? '', `http://localhost:${port}`);
      const code = url.searchParams.get('code');

      if (code) {
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end('<h1>Authentication successful!</h1><p>You can close this tab.</p>');
        server.close();
        resolve(code);
      } else {
        res.writeHead(400);
        res.end('Missing code parameter');
      }
    });

    server.listen(port);
    server.on('error', reject);
  });
}
