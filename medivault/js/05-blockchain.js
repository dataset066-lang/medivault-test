/* MediVault ? Step 5 ? Blockchain and wallet. */
'use strict';

// ════════════════════════════════════════
//  BLOCKCHAIN / METAMASK
// ════════════════════════════════════════
// ── Embedded contract config (works on Netlify / any static host) ──
const _EMBEDDED_CONFIG = {
  "contractAddress": "0x482091b73484C94F7cC2Db30fA8Fa8c30801FE41",
  "rpcUrl": "http://127.0.0.1:7545",
  "chainId": 1337,
  "networkPort": 7545,
  "deployedAt": "2026-11-13T11:36:46.998Z",
  "txHash": "0x7b16d9332805ace3094e0116787a229d697dadc6d7e5d60847e131f4cdf5ac57",
  "abi": [{"anonymous":false,"inputs":[{"indexed":true,"internalType":"uint256","name":"recordId","type":"uint256"},{"indexed":true,"internalType":"address","name":"uploader","type":"address"},{"indexed":false,"internalType":"string","name":"cid","type":"string"},{"indexed":false,"internalType":"string","name":"imageType","type":"string"},{"indexed":false,"internalType":"uint256","name":"timestamp","type":"uint256"}],"name":"ImageStored","type":"event"},{"inputs":[],"name":"getMyRecords","outputs":[{"internalType":"uint256[]","name":"","type":"uint256[]"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"_id","type":"uint256"}],"name":"getRecord","outputs":[{"internalType":"string","name":"cid","type":"string"},{"internalType":"string","name":"sha256Hash","type":"string"},{"internalType":"string","name":"imageType","type":"string"},{"internalType":"string","name":"filename","type":"string"},{"internalType":"uint256","name":"timestamp","type":"uint256"},{"internalType":"address","name":"uploader","type":"address"},{"internalType":"bool","name":"encrypted","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"address","name":"","type":"address"},{"internalType":"uint256","name":"","type":"uint256"}],"name":"ownerRecords","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"uint256","name":"","type":"uint256"}],"name":"records","outputs":[{"internalType":"string","name":"cid","type":"string"},{"internalType":"string","name":"sha256Hash","type":"string"},{"internalType":"string","name":"imageType","type":"string"},{"internalType":"string","name":"filename","type":"string"},{"internalType":"uint256","name":"timestamp","type":"uint256"},{"internalType":"address","name":"uploader","type":"address"},{"internalType":"bool","name":"encrypted","type":"bool"}],"stateMutability":"view","type":"function"},{"inputs":[{"internalType":"string","name":"_cid","type":"string"},{"internalType":"string","name":"_sha256Hash","type":"string"},{"internalType":"string","name":"_imageType","type":"string"},{"internalType":"string","name":"_filename","type":"string"},{"internalType":"bool","name":"_encrypted","type":"bool"}],"name":"storeImage","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"nonpayable","type":"function"},{"inputs":[],"name":"totalRecords","outputs":[{"internalType":"uint256","name":"","type":"uint256"}],"stateMutability":"view","type":"function"}]
};

async function loadContractConfig() {
  // 1. Try local server API first (works when running locally with node server.js)
  try {
    const res = await fetch('/api/config', { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const cfg = await res.json();
      if (cfg && cfg.contractAddress && cfg.contractAddress !== '') return cfg;
    }
  } catch(_) {}

  // 2. Try loading contract-config.json as a static file (works on Netlify)
  try {
    const res = await fetch('/contract-config.json', { signal: AbortSignal.timeout(2000) });
    if (res.ok) {
      const cfg = await res.json();
      if (cfg && cfg.contractAddress && cfg.contractAddress !== '') return cfg;
    }
  } catch(_) {}

  // 3. Fallback: use embedded config (always works, no server needed)
  console.log('[MediVault] Using embedded contract config (static deployment)');
  return _EMBEDDED_CONFIG;
}

function _updateWalletUI(connected, address, ethBal) {
  // topbar wallet pill
  const bar  = document.getElementById('wallet-status-bar');
  if (!bar) return;
  if (connected) {
    bar.innerHTML = `
      <div class="wallet-pill">
        <span class="wallet-dot connected"></span>
        <span>${address.slice(0,6)}…${address.slice(-4)}</span>
        <span style="color:#64748B;">|</span>
        <span style="color:#16A34A;">${parseFloat(ethBal).toFixed(4)} ETH</span>
      </div>`;
  } else {
    bar.innerHTML = `
      <div class="wallet-pill">
        <span class="wallet-dot"></span>
        <span>Not Connected</span>
      </div>`;
  }
  // sidebar dots
  const bcDot = document.getElementById('conn-blockchain');
  if (bcDot) bcDot.classList.toggle('connected', connected);
}

async function connectWallet() {
  if (typeof window.ethereum === 'undefined') {
    toast('MetaMask not found. Install the MetaMask extension.', 'error');
    return false;
  }
  try {
    // Request accounts — this triggers MetaMask popup
    await window.ethereum.request({ method: 'eth_requestAccounts' });

    const ch         = window._mvChain;
    ch.provider      = new ethers.BrowserProvider(window.ethereum);
    ch.signer        = await ch.provider.getSigner();
    ch.walletAddress = await ch.signer.getAddress();

    const network = await ch.provider.getNetwork();
    const balance = await ch.provider.getBalance(ch.walletAddress);
    _updateWalletUI(true, ch.walletAddress, ethers.formatEther(balance));

    ch.contractConfig = await loadContractConfig();
    if (ch.contractConfig) {
      ch.contract = new ethers.Contract(
        ch.contractConfig.contractAddress,
        ch.contractConfig.abi,
        ch.signer
      );
      toast('Wallet connected! Chain: ' + network.chainId.toString(), 'success');
      addAuditLog('WALLET_CONNECT', ch.walletAddress, 'success');
    } else {
      toast('Wallet connected. Run: node deploy.js to deploy contract.', 'warning');
    }

    // Listen for changes — without triggering Blockaid
    if (!window._mvEthListeners) {
      window._mvEthListeners = true;
      window.ethereum.on('accountsChanged', (accounts) => {
        if (!accounts || accounts.length === 0) {
          disconnectWallet();
        } else {
          location.reload();
        }
      });
      window.ethereum.on('chainChanged', () => {
        // Re-init provider on chain change instead of full reload
        const ch2 = window._mvChain;
        if (ch2.walletAddress) {
          ch2.provider = new ethers.BrowserProvider(window.ethereum);
          ch2.provider.getSigner().then(s => {
            ch2.signer = s;
            toast('Network changed — wallet re-synced.', 'info');
          }).catch(() => {});
        }
      });
    }
    return true;
  } catch(err) {
    if (err.code === 4001) {
      toast('MetaMask: connection request rejected.', 'warning');
    } else {
      toast('MetaMask error: ' + err.message, 'error');
    }
    return false;
  }
}

function disconnectWallet() {
  const ch = window._mvChain;
  ch.provider = null;
  ch.signer   = null;
  ch.walletAddress = null;
  ch.contract = null;
  _updateWalletUI(false, '', '');
  toast('Wallet disconnected.', 'info');
  addAuditLog('WALLET_DISCONNECT', '', 'success');
}

async function onWalletToggle(checkbox) {
  if (checkbox.checked) {
    const ok = await connectWallet();
    if (!ok) checkbox.checked = false;
  } else {
    disconnectWallet();
  }
}

async function switchChain(chainIdHex, chainName, rpcUrl, currency) {
  if (!window.ethereum) return false;
  try {
    await window.ethereum.request({
      method: 'wallet_switchEthereumChain',
      params: [{ chainId: chainIdHex }],
    });
    return true;
  } catch(err) {
    if (err.code === 4902) {
      // Network not in MetaMask — add it
      try {
        await window.ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [{
            chainId:         chainIdHex,
            chainName:       chainName,
            nativeCurrency:  { name: currency, symbol: currency, decimals: 18 },
            rpcUrls:         [rpcUrl],
          }],
        });
        return true;
      } catch(addErr) {
        toast('Could not add network: ' + addErr.message, 'error');
        return false;
      }
    } else if (err.code === 4001) {
      toast('Network switch cancelled.', 'warning');
      return false;
    } else {
      toast('Network switch failed: ' + err.message, 'error');
      return false;
    }
  }
}

async function storeOnBlockchain() {
  const mv  = window.MediVault;
  const ch  = window._mvChain;

  if (!mv.ipfsCID) {
    toast('Upload to IPFS first!', 'error');
    return;
  }

  const btn    = document.getElementById('store-chain-btn');
  const status = document.getElementById('bc-status');
  if (btn) btn.disabled = true;
  if (status) {
    status.style.display = 'block';
    status.style.color   = '#92400E';
    status.style.border  = '1px solid #FDE68A';
    status.style.background = '#FFF7ED';
    status.style.padding = '10px 14px';
    status.style.borderRadius = '6px';
    status.style.fontSize = '13px';
    status.textContent   = 'Initializing...';
  }

  try {
    // Step 1: Load contract config
    if (!ch.contractConfig) {
      ch.contractConfig = await loadContractConfig();
      if (!ch.contractConfig) throw new Error('Contract not deployed. Run: node deploy.js');
    }

    // Step 2: Connect wallet if not connected
    if (!ch.signer) {
      if (status) status.textContent = 'Connecting MetaMask...';
      const ok = await connectWallet();
      if (!ok) throw new Error('MetaMask connection failed or was rejected.');
    }

    // Step 3: Check current chain vs target
    const currentNetwork = await ch.provider.getNetwork();
    const currentChainId = Number(currentNetwork.chainId);
    const targetChainId  = ch.contractConfig._targetChainId || ch.contractConfig.chainId;
    const targetHex      = ch.contractConfig._targetChainHex || ('0x' + targetChainId.toString(16));

    if (currentChainId !== targetChainId) {
      if (status) status.textContent = 'Switching network in MetaMask...';
      const switched = await switchChain(
        targetHex,
        targetChainId === 1337 ? 'Ganache Local' : 'Sepolia Testnet',
        ch.contractConfig.rpcUrl,
        targetChainId === 1337 ? 'ETH' : 'SepoliaETH'
      );
      if (!switched) throw new Error('Network switch failed. Please switch manually in MetaMask.');
      // Re-init provider after switch
      ch.provider = new ethers.BrowserProvider(window.ethereum);
      ch.signer   = await ch.provider.getSigner();
    }

    // Step 4: Build contract instance with current signer
    const contract = new ethers.Contract(
      ch.contractConfig.contractAddress,
      ch.contractConfig.abi,
      ch.signer
    );

    if (status) status.textContent = 'Confirm the transaction in MetaMask...';

    // Step 5: Send transaction
    const imgType  = mv.metadata?.imageType || mv.currentImageType || 'Unknown';
    const filename = mv.metadata?.filename  || (mv.ipfsCID ? mv.ipfsCID.slice(0,20) : 'unknown');

    const tx = await contract.storeImage(
      mv.ipfsCID,
      mv.sha256Hash || '',
      imgType,
      filename,
      true,
      { gasLimit: 500000 }
    );

    const netName = targetChainId === 1337 ? 'Ganache Local' : 'Sepolia Testnet';
    if (status) status.textContent = 'Mining transaction on ' + netName + '...';

    const receipt = await tx.wait();

    // Step 6: Extract record ID from event logs
    let recordId = '0';
    try {
      for (const log of receipt.logs) {
        try {
          const parsed = contract.interface.parseLog(log);
          if (parsed && parsed.name === 'ImageStored') {
            recordId = parsed.args.recordId.toString();
            break;
          }
        } catch(_) {}
      }
    } catch(_) {}

    // Step 7: Save result
    const txData = {
      txHash:          receipt.hash,
      blockNumber:     receipt.blockNumber,
      recordId,
      gasUsed:         receipt.gasUsed?.toString(),
      contractAddress: ch.contractConfig.contractAddress,
      network:         netName,
      wallet:          ch.walletAddress,
    };
    mv.blockchainTx = txData;
    // Save key alongside this specific transaction for retrieval
    txData.encryptionKey = mv.encryptionKey || null;
    txData.encryptionIV  = mv.encryptionIV  || null;
    txData.ipfsCID       = mv.ipfsCID       || null;
    txData.sha256Hash    = mv.sha256Hash    || null;
    mv.blockchainTx = txData;
    // Also persist per-network key to localStorage for retrieval page
    try {
      const networkKey = 'mv_key_' + (txData.network || 'ganache').replace(/\s+/g,'_').toLowerCase();
      localStorage.setItem(networkKey, JSON.stringify({
        key:     mv.encryptionKey,
        iv:      mv.encryptionIV,
        cid:     mv.ipfsCID,
        hash:    mv.sha256Hash,
        recordId: recordId,
        network:  txData.network,
        ts:       new Date().toISOString()
      }));
    } catch(_) {}
    mv.save();
    addAuditLog('BLOCKCHAIN_STORE',
      'TX:' + receipt.hash.slice(0,18) + '... Record:#' + recordId + ' Net:' + netName,
      'success'
    );

    // Step 8: Update UI
    if (status) {
      status.style.color      = '#15803D';
      status.style.border     = '1px solid #86EFAC';
      status.style.background = '#F0FDF4';
      status.textContent      = 'Stored on ' + netName + '! Record #' + recordId;
    }

    _fillBlockchainResult(txData, ch.contractConfig.contractAddress);
    const bcResult = document.getElementById('bc-result');
    if (bcResult) {
      bcResult.style.display = 'block';
      bcResult.scrollIntoView({ behavior: 'smooth' });
    }

    const bal = await ch.provider.getBalance(ch.walletAddress);
    _updateWalletUI(true, ch.walletAddress, ethers.formatEther(bal));
    toast('Blockchain record saved! Record #' + recordId, 'success');

  } catch(err) {
    const isReject = err.code === 4001
      || (err.message && (err.message.includes('rejected') || err.message.includes('denied')));

    if (status) {
      status.style.color      = isReject ? '#92400E' : '#DC2626';
      status.style.border     = isReject ? '1px solid #FDE68A' : '1px solid #FECACA';
      status.style.background = isReject ? '#FFF7ED' : '#FEF2F2';
      status.textContent      = isReject
        ? 'Transaction cancelled in MetaMask.'
        : 'Error: ' + (err.reason || err.message);
    }
    toast(isReject ? 'Transaction cancelled.' : 'Error: ' + (err.reason || err.message),
          isReject ? 'warning' : 'error');
    addAuditLog('BLOCKCHAIN_STORE', err.message, 'error');
    console.error('[storeOnBlockchain]', err);
  } finally {
    if (btn) btn.disabled = false;
  }
}

function _fillBlockchainResult(txData, contractAddress) {
  const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
  set('bc-tx-hash',   txData.txHash);
  set('bc-record-id', '#' + txData.recordId);
  set('bc-block',     txData.blockNumber?.toString() || '---');
  set('bc-gas',       txData.gasUsed || '---');
  set('bc-contract',  contractAddress || '---');
}
