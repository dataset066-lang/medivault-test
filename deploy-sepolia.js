/**
 * deploy-sepolia.js — Deploys MedImageRegistry to Sepolia Testnet
 *
 * Requirements:
 *   1. SepoliaETH in your wallet (get from https://sepoliafaucet.com)
 *   2. Your wallet PRIVATE KEY set below or in .env
 *
 * Run:  node deploy-sepolia.js
 */

const { ethers } = require('ethers');
const solc       = require('solc');
const fs         = require('fs');
const path       = require('path');

// ══════════════════════════════════════════════════
//  LOAD .env FILE AUTOMATICALLY
// ══════════════════════════════════════════════════
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) {
    console.log('  .env not found — using defaults / process.env');
    return;
  }
  const lines = fs.readFileSync(envPath, 'utf8').split('\n');
  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx < 0) continue;
    const key = trimmed.substring(0, eqIdx).trim();
    const val = trimmed.substring(eqIdx + 1).trim();
    if (key && !process.env[key]) process.env[key] = val;
  }
  console.log('  .env loaded');
}
loadEnv();

// ══════════════════════════════════════════════════
//  CONFIG — reads from .env automatically
// ══════════════════════════════════════════════════
const ALCHEMY_RPC  = process.env.SEPOLIA_RPC_URL  || 'https://ethereum-sepolia-rpc.publicnode.com';
const CHAIN_ID     = parseInt(process.env.SEPOLIA_CHAIN_ID || '11155111');

// PRIVATE KEY — set in .env file as PRIVATE_KEY=0x...
// MetaMask → Account → 3 dots → Account Details → Show Private Key
const PRIVATE_KEY  = process.env.PRIVATE_KEY || 'PASTE_YOUR_PRIVATE_KEY_HERE';

// ══════════════════════════════════════════════════
//  COMPILE
// ══════════════════════════════════════════════════
function compileContract() {
  const source = fs.readFileSync(path.join(__dirname, 'MedImageRegistry.sol'), 'utf8');
  const input  = {
    language: 'Solidity',
    sources:  { 'MedImageRegistry.sol': { content: source } },
    settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } } }
  };

  console.log('\n  Compiling MedImageRegistry.sol...');
  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    const errs = output.errors.filter(e => e.severity === 'error');
    if (errs.length > 0) {
      errs.forEach(e => console.error('  ERROR:', e.formattedMessage));
      process.exit(1);
    }
  }

  const contract = output.contracts['MedImageRegistry.sol']['MedImageRegistry'];
  console.log('  Compilation OK — bytecode:', contract.evm.bytecode.object.length, 'chars');
  return {
    abi:      contract.abi,
    bytecode: '0x' + contract.evm.bytecode.object
  };
}

// ══════════════════════════════════════════════════
//  DEPLOY
// ══════════════════════════════════════════════════
async function deploy() {
  console.log('');
  console.log('  =====================================================');
  console.log('  MediVault — Sepolia Testnet Deployment');
  console.log('  =====================================================');

  // Validate private key
  if (!PRIVATE_KEY || PRIVATE_KEY === 'PASTE_YOUR_PRIVATE_KEY_HERE') {
    console.error('\n  ERROR: Private key not set!');
    console.error('  Edit deploy-sepolia.js and set PRIVATE_KEY');
    console.error('  OR run:  set PRIVATE_KEY=0x... && node deploy-sepolia.js');
    process.exit(1);
  }

  // Compile
  const { abi, bytecode } = compileContract();

  // Connect to Sepolia via Alchemy
  console.log('\n  Connecting to Sepolia via Alchemy...');
  const provider = new ethers.JsonRpcProvider(ALCHEMY_RPC);

  let network;
  try {
    network = await provider.getNetwork();
    console.log('  Connected — Chain ID:', network.chainId.toString());
  } catch(e) {
    console.error('  Connection failed:', e.message);
    process.exit(1);
  }

  // Setup wallet
  const wallet  = new ethers.Wallet(PRIVATE_KEY, provider);
  const address = await wallet.getAddress();
  const balance = await provider.getBalance(address);
  const ethBal  = parseFloat(ethers.formatEther(balance));

  console.log('\n  Deployer Address:', address);
  console.log('  Balance         :', ethBal.toFixed(6), 'SepoliaETH');

  if (ethBal < 0.001) {
    console.error('\n  ERROR: Insufficient SepoliaETH!');
    console.error('  Get free SepoliaETH from: https://sepoliafaucet.com');
    console.error('  Minimum needed: ~0.001 ETH');
    process.exit(1);
  }

  // Get current gas price
  const feeData    = await provider.getFeeData();
  const gasPrice   = feeData.gasPrice;
  console.log('  Gas Price       :', ethers.formatUnits(gasPrice, 'gwei'), 'Gwei');

  // Deploy
  console.log('\n  Deploying to Sepolia...');
  const factory  = new ethers.ContractFactory(abi, bytecode, wallet);
  const contract = await factory.deploy({ gasLimit: 3000000n });

  console.log('  Tx sent         :', contract.deploymentTransaction().hash);
  console.log('  Waiting for confirmation...');

  await contract.waitForDeployment();
  const contractAddress = await contract.getAddress();
  const receipt         = await provider.getTransactionReceipt(contract.deploymentTransaction().hash);

  console.log('\n  =====================================================');
  console.log('  DEPLOYMENT SUCCESSFUL');
  console.log('  =====================================================');
  console.log('  Contract Address :', contractAddress);
  console.log('  Tx Hash          :', receipt.hash);
  console.log('  Block Number     :', receipt.blockNumber);
  console.log('  Gas Used         :', receipt.gasUsed.toString());
  console.log('  Etherscan        : https://sepolia.etherscan.io/address/' + contractAddress);

  // Save Sepolia config (separate file — does not overwrite Ganache config)
  const sepoliaConfig = {
    contractAddress,
    // Keep published config free of provider API keys; the public RPC is enough
    // for the browser UI. The deployment provider above may still use .env.
    rpcUrl:      'https://ethereum-sepolia-rpc.publicnode.com',
    chainId:     CHAIN_ID,
    networkPort: 443,
    deployedAt:  new Date().toISOString(),
    txHash:      receipt.hash,
    network:     'Sepolia Testnet',
    explorer:    'https://sepolia.etherscan.io',
    abi
  };

  fs.writeFileSync(
    path.join(__dirname, 'contract-config-sepolia.json'),
    JSON.stringify(sepoliaConfig, null, 2)
  );

  // Also update the embedded Sepolia config in the blockchain workflow step.
  updateSharedJsSepoliaConfig(sepoliaConfig);

  console.log('\n  contract-config-sepolia.json saved');
  console.log('  blockchain step Sepolia config updated');
  console.log('\n  Open MediVault -> Blockchain Network -> Select Sepolia');
  console.log('  =====================================================\n');
}

// ══════════════════════════════════════════════════
//  AUTO-UPDATE the blockchain step with the Sepolia contract address
// ══════════════════════════════════════════════════
function updateSharedJsSepoliaConfig(cfg) {
  const blockchainStepPath = path.join(__dirname, 'medivault', 'js', '05-blockchain.js');
  if (!fs.existsSync(blockchainStepPath)) return;

  let js = fs.readFileSync(blockchainStepPath, 'utf8');

  // Update the _EMBEDDED_CONFIG with Sepolia as secondary option
  // Add SEPOLIA_CONFIG constant after _EMBEDDED_CONFIG
  const sepoliaConst = `\n// Sepolia contract config (auto-updated by deploy-sepolia.js)\nconst _SEPOLIA_CONFIG = ${JSON.stringify(cfg)};\n`;

  if (js.includes('const _SEPOLIA_CONFIG')) {
    // Replace existing
    const start = js.indexOf('// Sepolia contract config');
    const end   = js.indexOf(';\n', start) + 2;
    js = js.substring(0, start) + sepoliaConst.trim() + '\n' + js.substring(end);
  } else {
    // Insert after _EMBEDDED_CONFIG block
    const insertAfter = js.indexOf('const _EMBEDDED_CONFIG = {');
    const insertEnd   = js.indexOf('\n};\n', insertAfter) + 4;
    js = js.substring(0, insertEnd) + sepoliaConst + js.substring(insertEnd);
  }

  // Also update loadContractConfig to check Sepolia config
  if (!js.includes('_SEPOLIA_CONFIG')) {
    js = js.replace(
      '// 3. Fallback: use embedded config (always works, no server needed)',
      '// 3. Try Sepolia config if window says so\n  if (window._useSepoliaConfig && typeof _SEPOLIA_CONFIG !== "undefined") {\n    return _SEPOLIA_CONFIG;\n  }\n  // 4. Fallback: use embedded config (always works, no server needed)'
    );
  }

  fs.writeFileSync(blockchainStepPath, js, 'utf8');
}

deploy().catch(err => {
  console.error('\n  Deploy failed:', err.message);
  if (err.message.includes('invalid private key')) {
    console.error('  Hint: Make sure your private key starts with 0x');
  }
  if (err.message.includes('insufficient funds')) {
    console.error('  Hint: Get SepoliaETH from https://sepoliafaucet.com');
  }
  process.exit(1);
});
