/* MediVault ? Step 3 ? Encryption and integrity hashing. */
'use strict';

// ════════════════════════════════════════
//  ENCRYPTION (Web Crypto API)
// ════════════════════════════════════════
async function encryptData(dataUrl, opts) {
  const {
    enabled  = true,
    kdfMode  = 'random',
    password = '',
  } = opts || {};

  const binary = atob(dataUrl.split(',')[1]);
  const bytes  = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);

  if (!enabled) {
    return { encrypted: bytes, key: null, iv: null, encEnabled: false };
  }

  let key;
  if (kdfMode === 'pbkdf2') {
    const enc         = new TextEncoder();
    const pwd         = password || 'default-passphrase';
    const keyMaterial = await crypto.subtle.importKey('raw', enc.encode(pwd), 'PBKDF2', false, ['deriveKey']);
    const salt        = crypto.getRandomValues(new Uint8Array(16));
    key = await crypto.subtle.deriveKey(
      { name: 'PBKDF2', salt, iterations: 100000, hash: 'SHA-256' },
      keyMaterial,
      { name: 'AES-GCM', length: 256 },
      true,
      ['encrypt', 'decrypt']
    );
  } else {
    key = await crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, ['encrypt', 'decrypt']);
  }

  const iv        = crypto.getRandomValues(new Uint8Array(12));
  const encrypted = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, bytes);
  const rawKey    = await crypto.subtle.exportKey('raw', key);
  const keyHex    = Array.from(new Uint8Array(rawKey)).map(b => b.toString(16).padStart(2,'0')).join('');
  const ivHex     = Array.from(iv).map(b => b.toString(16).padStart(2,'0')).join('');

  return {
    encrypted:  new Uint8Array(encrypted),
    key:        keyHex,
    iv:         ivHex,
    encEnabled: true,
  };
}

// ════════════════════════════════════════
//  SHA-256 HASH
// ════════════════════════════════════════
async function sha256(data) {
  const hash = await crypto.subtle.digest('SHA-256', data);
  return Array.from(new Uint8Array(hash)).map(b => b.toString(16).padStart(2,'0')).join('');
}
