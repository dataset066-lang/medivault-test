/* MediVault ? Step 6 ? Retrieval, verification, and decryption. */
'use strict';

// ════════════════════════════════════════
//  DECRYPTION
// ════════════════════════════════════════
let _decryptedBlob = null;

function dataURLtoBlob(dataURL) {
  const [header, data] = dataURL.split(',');
  const mime           = header.match(/:(.*?);/)[1];
  const binary         = atob(data);
  const arr            = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) arr[i] = binary.charCodeAt(i);
  return new Blob([arr], { type: mime });
}

function detectMime(bytes) {
  if (bytes[0] === 0x89 && bytes[1] === 0x50) return 'image/png';
  if (bytes[0] === 0xFF && bytes[1] === 0xD8) return 'image/jpeg';
  if (bytes[0] === 0x42 && bytes[1] === 0x4D) return 'image/bmp';
  return 'image/png';
}

async function startDecryption() {
  const mv = window.MediVault;

  const cidEl     = document.getElementById('dec-cid');
  const keyEl     = document.getElementById('dec-key');
  const ivEl      = document.getElementById('dec-iv');
  const gwEl      = document.getElementById('dec-gateway');
  const progressEl = document.getElementById('dec-progress');
  const resultEl  = document.getElementById('dec-result');
  const errorEl   = document.getElementById('dec-error');

  const cid    = cidEl    ? cidEl.value.trim()   : '';
  const keyHex = keyEl    ? keyEl.value.trim()   : '';
  const ivHex  = ivEl     ? ivEl.value.trim()    : '';
  const gateway = gwEl    ? gwEl.value           : 'https://gateway.pinata.cloud/ipfs/';

  if (!cid)                       { toast('CID required!', 'error'); return; }
  if (keyHex.length !== 64)       { toast('AES key must be 64 hex chars (256-bit)!', 'error'); return; }
  if (ivHex.length  !== 24)       { toast('IV must be 24 hex chars (12 bytes)!', 'error'); return; }

  if (progressEl) progressEl.style.display = 'block';
  if (resultEl)   resultEl.style.display   = 'none';
  if (errorEl)    errorEl.style.display    = 'none';
  _decryptedBlob = null;

  setElProgress('dec-bar', 0);
  ['fetch','verify','decrypt','render'].forEach(s => setStepStatus('dps-' + s + '-s', 'pending'));

  try {
    // Step 1: Download from IPFS
    setStepStatus('dps-fetch-s', 'running');
    setStepDesc('dps-fetch-d', 'Connecting to ' + gateway + '…');
    setElProgress('dec-bar', 10);

    let encryptedBytes;
    try {
      const res = await fetch(gateway + cid);
      if (!res.ok) throw new Error('Gateway returned ' + res.status);
      encryptedBytes = new Uint8Array(await res.arrayBuffer());
      setStepDesc('dps-fetch-d', 'Downloaded ' + formatBytes(encryptedBytes.length) + ' from IPFS');
    } catch(fetchErr) {
      setStepDesc('dps-fetch-d', 'Primary gateway failed, trying fallback…');
      const fallbacks = [
        'https://ipfs.io/ipfs/',
        'https://cloudflare-ipfs.com/ipfs/',
        'https://dweb.link/ipfs/',
        'https://gateway.pinata.cloud/ipfs/',
      ].filter(g => g !== gateway);

      let downloaded = false;
      for (const fb of fallbacks) {
        try {
          const r = await fetch(fb + cid);
          if (r.ok) {
            encryptedBytes = new Uint8Array(await r.arrayBuffer());
            setStepDesc('dps-fetch-d', 'Downloaded via ' + fb);
            downloaded = true;
            break;
          }
        } catch(_) {}
      }
      if (!downloaded) throw new Error('All IPFS gateways failed. CID: ' + cid);
    }

    setStepStatus('dps-fetch-s', 'done');
    setElProgress('dec-bar', 35);

    // Step 2: SHA-256 Verify
    setStepStatus('dps-verify-s', 'running');
    setElProgress('dec-bar', 50);

    const computedHash = await sha256(encryptedBytes);
    const expHash      = mv.sha256Hash || '';
    const integrityEl  = document.getElementById('dec-integrity');

    if (expHash && expHash.length === 64) {
      if (computedHash.toLowerCase() === expHash.toLowerCase()) {
        setStepDesc('dps-verify-d', '✅ Hash matches — file is intact');
        if (integrityEl) { integrityEl.textContent = '✅ Verified'; integrityEl.style.color = 'var(--success)'; }
      } else {
        setStepDesc('dps-verify-d', '⚠️ Hash mismatch — file may be tampered!');
        if (integrityEl) { integrityEl.textContent = '⚠️ MISMATCH'; integrityEl.style.color = 'var(--danger)'; }
      }
    } else {
      setStepDesc('dps-verify-d', 'Hash not in session — skipping verify');
      if (integrityEl) { integrityEl.textContent = '⏭️ Skipped'; integrityEl.style.color = 'var(--text-muted)'; }
    }

    setStepStatus('dps-verify-s', 'done');
    setElProgress('dec-bar', 65);

    // Step 3: AES-256-GCM Decrypt
    setStepStatus('dps-decrypt-s', 'running');
    setElProgress('dec-bar', 75);

    const keyBytes  = new Uint8Array(keyHex.match(/.{1,2}/g).map(b => parseInt(b, 16)));
    const ivBytes   = new Uint8Array(ivHex.match(/.{1,2}/g).map(b => parseInt(b, 16)));

    const cryptoKey = await crypto.subtle.importKey('raw', keyBytes, { name: 'AES-GCM' }, false, ['decrypt']);

    let decryptedBuffer;
    try {
      decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-GCM', iv: ivBytes }, cryptoKey, encryptedBytes);
    } catch(decErr) {
      throw new Error('Decryption failed — wrong key or IV. ' + decErr.message);
    }

    setStepStatus('dps-decrypt-s', 'done');
    setElProgress('dec-bar', 90);

    // Step 4: Render
    setStepStatus('dps-render-s', 'running');

    const decBytes  = new Uint8Array(decryptedBuffer);
    const decString = new TextDecoder().decode(decBytes);

    let imgSrc;
    if (decString.startsWith('data:image')) {
      imgSrc         = decString;
      _decryptedBlob = dataURLtoBlob(decString);
    } else {
      const mime     = detectMime(decBytes);
      _decryptedBlob = new Blob([decryptedBuffer], { type: mime });
      imgSrc         = URL.createObjectURL(_decryptedBlob);
    }

    const decImg = document.getElementById('dec-img');
    if (decImg) decImg.src = imgSrc;

    const sizeEl = document.getElementById('dec-size');
    const gwEl2  = document.getElementById('dec-gw-used');
    if (sizeEl) sizeEl.textContent = formatBytes(decryptedBuffer.byteLength);
    if (gwEl2)  gwEl2.textContent  = gateway.replace('https://','').split('/')[0];

    setStepStatus('dps-render-s', 'done');
    setElProgress('dec-bar', 100);

    if (resultEl) { resultEl.style.display = 'block'; resultEl.scrollIntoView({ behavior: 'smooth' }); }

    addAuditLog('DECRYPTION', 'CID:' + cid.slice(0,20) + '…', 'success');
    toast('🔓 Image decrypted successfully!', 'success');

  } catch(err) {
    ['fetch','verify','decrypt','render'].forEach(s => {
      const el = document.getElementById('dps-' + s + '-s');
      if (el && el.classList.contains('running')) setStepStatus('dps-' + s + '-s', 'error');
    });
    if (errorEl) { errorEl.style.display = 'block'; errorEl.textContent = '❌ ' + err.message; }
    addAuditLog('DECRYPTION', err.message, 'error');
    toast('Decryption error: ' + err.message, 'error');
    console.error(err);
  }
}

function downloadDecrypted() {
  if (!_decryptedBlob) { toast('No decrypted image to download.', 'error'); return; }
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(_decryptedBlob);
  a.download = 'decrypted-medimage-' + Date.now() + '.png';
  a.click();
}
