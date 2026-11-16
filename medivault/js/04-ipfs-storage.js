/* MediVault ? Step 4 ? IPFS upload and QR helper. */
'use strict';

// ════════════════════════════════════════
//  IPFS UPLOAD
// ════════════════════════════════════════
function _ipfsStatus(msg, type) {
  const el = document.getElementById('ipfs-status-badge');
  if (!el) return;
  const colors = { info: '#1D4ED8', success: '#16A34A', error: '#DC2626', warning: '#B45309' };
  el.style.display      = 'block';
  el.style.color        = colors[type] || colors.info;
  el.style.borderColor  = colors[type] || colors.info;
  el.textContent        = msg;
}

async function uploadViaPinata(blob, filename, metadata) {
  const jwtInput = document.getElementById('pinata-jwt');
  const jwt = jwtInput ? jwtInput.value.trim() : '';
  if (!jwt) throw new Error('Pinata JWT missing!');

  _ipfsStatus('📡 Connecting to Pinata IPFS…', 'info');

  const form = new FormData();
  form.append('file', blob, filename);

  const pinataMetadata = {
    name: filename,
    keyvalues: {
      imageType:  metadata.imageType  || 'unknown',
      sha256:     metadata.hash       || '',
      timestamp:  metadata.timestamp  || new Date().toISOString(),
      encrypted:  String(metadata.encrypted),
    }
  };
  form.append('pinataMetadata', JSON.stringify(pinataMetadata));
  form.append('pinataOptions',  JSON.stringify({ cidVersion: 1 }));

  _ipfsStatus('⬆️ Uploading encrypted image to Pinata…', 'info');

  let res;
  try {
    res = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method:  'POST',
      headers: { Authorization: 'Bearer ' + jwt },
      body:    form,
    });
  } catch(e) {
    throw new Error('Network error — check internet connection. ' + e.message);
  }

  if (!res.ok) {
    let errText = '';
    try { errText = await res.text(); } catch(_) {}
    if (res.status === 401) throw new Error('Pinata 401 Unauthorized — JWT expired or invalid.');
    if (res.status === 403) throw new Error('Pinata 403 Forbidden — insufficient permissions.');
    throw new Error('Pinata error ' + res.status + ': ' + errText);
  }

  const json = await res.json();
  const cid  = json.IpfsHash;

  // Also upload metadata JSON
  const metaToggle = document.getElementById('ipfs-meta');
  if (!metaToggle || metaToggle.checked) {
    try {
      const metaBlob = new Blob([JSON.stringify(metadata, null, 2)], { type: 'application/json' });
      const metaForm = new FormData();
      metaForm.append('file', metaBlob, filename.replace('.enc','-metadata.json'));
      metaForm.append('pinataMetadata', JSON.stringify({ name: filename + '-metadata' }));
      metaForm.append('pinataOptions',  JSON.stringify({ cidVersion: 1 }));
      await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
        method:  'POST',
        headers: { Authorization: 'Bearer ' + jwt },
        body:    metaForm,
      });
    } catch(_) {}
  }

  _ipfsStatus('✅ Successfully pinned to IPFS via Pinata!', 'success');
  return { cid, url: 'https://gateway.pinata.cloud/ipfs/' + cid };
}

async function uploadViaWeb3Storage(blob, filename, metadata) {
  const tokenInput = document.getElementById('web3storage-token');
  const token = tokenInput ? tokenInput.value.trim() : '';
  if (!token) throw new Error('web3.storage token is required. Get one free at web3.storage/account/');

  _ipfsStatus('📡 Connecting to web3.storage…', 'info');
  _ipfsStatus('⬆️ Uploading to web3.storage…', 'info');

  const res = await fetch('https://api.web3.storage/upload', {
    method:  'POST',
    headers: { Authorization: 'Bearer ' + token, 'X-NAME': encodeURIComponent(filename) },
    body:    blob,
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error('web3.storage error ' + res.status + ': ' + err);
  }

  const json = await res.json();
  const cid  = json.cid;
  _ipfsStatus('✅ Stored on web3.storage!', 'success');
  return { cid, url: 'https://' + cid + '.ipfs.w3s.link' };
}

async function uploadViaLocalNode(blob, filename) {
  _ipfsStatus('📡 Connecting to local IPFS node…', 'info');

  const form = new FormData();
  form.append('file', blob, filename);

  const res = await fetch('http://localhost:5001/api/v0/add?cid-version=1&hash=sha2-256', {
    method: 'POST',
    body:   form,
  });

  if (!res.ok) throw new Error('Local IPFS node error ' + res.status + '. Is your daemon running?');

  const text = await res.text();
  const json = JSON.parse(text.trim().split('\n').pop());
  const cid  = json.Hash;
  _ipfsStatus('✅ Added to local node!', 'success');
  return { cid, url: 'http://localhost:8080/ipfs/' + cid };
}

async function uploadToIPFS(encryptedData, metadata) {
  const providerEl = document.getElementById('ipfs-provider');
  const provider   = providerEl ? providerEl.value : 'pinata';
  const filename   = 'medimage-' + Date.now() + '.enc';
  const blob       = new Blob([encryptedData], { type: 'application/octet-stream' });

  switch (provider) {
    case 'pinata':       return uploadViaPinata(blob, filename, metadata);
    case 'web3storage':  return uploadViaWeb3Storage(blob, filename, metadata);
    case 'local':        return uploadViaLocalNode(blob, filename);
    default: throw new Error('Unknown IPFS provider: ' + provider);
  }
}

// ════════════════════════════════════════
//  QR CODE
// ════════════════════════════════════════
function drawSimpleQR(text, containerId) {
  const container = document.getElementById(containerId);
  if (!container || typeof QRCode === 'undefined') return;
  container.innerHTML = '';
  new QRCode(container, {
    text,
    width:        160,
    height:       160,
    colorDark:    '#1E293B',
    colorLight:   '#ffffff',
    correctLevel: QRCode.CorrectLevel.M,
  });
}
