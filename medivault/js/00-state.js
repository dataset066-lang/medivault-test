/* MediVault ? Step 0 ? Shared application state. */
'use strict';

// ════════════════════════════════════════
//  APP STATE
// ════════════════════════════════════════
window.MediVault = {
  currentFile:          null,
  currentImageType:     'CT Scan',
  preprocessedDataUrl:  null,
  encryptionKey:        null,
  encryptionIV:         null,
  sha256Hash:           null,
  encryptedData:        null,
  ipfsCID:              null,
  ipfsUrl:              null,
  metadata:             null,
  blockchainTx:         null,
  pipelineResult:       null,
  history:              [],

  save() {
    try {
      const data = {
        currentImageType:    this.currentImageType,
        encryptionKey:       this.encryptionKey,
        encryptionIV:        this.encryptionIV,
        sha256Hash:          this.sha256Hash,
        ipfsCID:             this.ipfsCID,
        ipfsUrl:             this.ipfsUrl,
        metadata:            this.metadata,
        blockchainTx:        this.blockchainTx,
        history:             this.history,
      };
      localStorage.setItem('mv_state', JSON.stringify(data));
    } catch(e) {}
  },

  load() {
    try {
      const d = JSON.parse(localStorage.getItem('mv_state') || '{}');
      Object.assign(this, d);
    } catch(e) {}
    // Restore preprocessed dataUrl from sessionStorage
    try {
      const pu = sessionStorage.getItem('mv_preprocessedDataUrl');
      if (pu) this.preprocessedDataUrl = pu;
      const eu = sessionStorage.getItem('mv_encryptedDataB64');
      if (eu) {
        const bin = atob(eu);
        const arr = new Uint8Array(bin.length);
        for (let i = 0; i < bin.length; i++) arr[i] = bin.charCodeAt(i);
        this.encryptedData = arr;
      }
    } catch(e) {}
  },

  saveSession() {
    try {
      if (this.preprocessedDataUrl)
        sessionStorage.setItem('mv_preprocessedDataUrl', this.preprocessedDataUrl);
      if (this.encryptedData) {
        let bin = '';
        this.encryptedData.forEach(b => bin += String.fromCharCode(b));
        sessionStorage.setItem('mv_encryptedDataB64', btoa(bin));
      }
    } catch(e) {}
  }
};

// ════════════════════════════════════════
//  BLOCKCHAIN STATE
// ════════════════════════════════════════
window._mvChain = {
  provider:       null,
  signer:         null,
  contractConfig: null,
  contract:       null,
  walletAddress:  null,
};
