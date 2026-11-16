/* MediVault ? Step 7 ? Reports and audit log. */
'use strict';

// ════════════════════════════════════════
//  DOWNLOAD REPORT
// ════════════════════════════════════════
function downloadReport() {
  const mv = window.MediVault;
  const report = {
    cid:        mv.ipfsCID,
    ipfsUrl:    mv.ipfsUrl,
    sha256:     mv.sha256Hash,
    encryption: mv.encryptionKey ? { algorithm: 'AES-256-GCM', iv: mv.encryptionIV, keyHint: mv.encryptionKey.slice(0,8) + '...' } : 'None',
    metadata:   mv.metadata,
    blockchain: mv.blockchainTx || null,
  };
  const blob = new Blob([JSON.stringify(report, null, 2)], { type: 'application/json' });
  const a    = document.createElement('a');
  a.href     = URL.createObjectURL(blob);
  a.download = 'medivault-report-' + Date.now() + '.json';
  a.click();
}

// ════════════════════════════════════════
//  AUDIT LOG
// ════════════════════════════════════════
function addAuditLog(action, details, status = 'success') {
  try {
    const logs = JSON.parse(localStorage.getItem('mv_audit') || '[]');
    logs.unshift({ id: Date.now(), ts: new Date().toISOString(), action, details, status });
    if (logs.length > 500) logs.splice(500);
    localStorage.setItem('mv_audit', JSON.stringify(logs));
  } catch(e) {}
}

function getAuditLogs() {
  try { return JSON.parse(localStorage.getItem('mv_audit') || '[]'); }
  catch(e) { return []; }
}
