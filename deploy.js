/**
 * deploy.js — Compiles & Deploys MedImageRegistry to Ganache
 * Run: node deploy.js
 */

const { ethers } = require('ethers');
const solc       = require('solc');
const fs         = require('fs');
const path       = require('path');

// ── Load .env ──────────────────────────────────────────────────
function loadEnv() {
  const envPath = path.join(__dirname, '.env');
  if (!fs.existsSync(envPath)) return;
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
}
loadEnv();

// ── Compile Solidity ──
function compileContract() {
  const source = fs.readFileSync(path.join(__dirname, 'MedImageRegistry.sol'), 'utf8');
  const input = {
    language: 'Solidity',
    sources:  { 'MedImageRegistry.sol': { content: source } },
    settings: { outputSelection: { '*': { '*': ['abi', 'evm.bytecode'] } } }
  };

  console.log('🔧 Compiling MedImageRegistry.sol...');
  const output = JSON.parse(solc.compile(JSON.stringify(input)));

  if (output.errors) {
    const errs = output.errors.filter(e => e.severity === 'error');
    if (errs.length > 0) {
      errs.forEach(e => console.error('❌', e.formattedMessage));
      process.exit(1);
    }
  }

  const contract  = output.contracts['MedImageRegistry.sol']['MedImageRegistry'];
  const bytecode  = contract.evm.bytecode.object;
  const abi       = contract.abi;

  console.log('✅ Compilation OK — bytecode length:', bytecode.length);
  return { abi, bytecode: '0x' + bytecode };
}

// ── Deploy ──
async function deploy() {
  const { abi, bytecode } = compileContract();

  // Connect to Ganache
  let provider, portUsed;
  for (const port of [7545, 8545]) {
    try {
      const p = new ethers.JsonRpcProvider(`http://127.0.0.1:${port}`);
      await p.getNetwork();
      provider = p;
      portUsed = port;
      console.log(`\n✅ Ganache connected on port ${port}`);
      break;
    } catch (_) {
      console.log(`   port ${port} — not available`);
    }
  }

  if (!provider) {
    console.error('\n❌ Ganache not running! Open Ganache app first.');
    process.exit(1);
  }

  const signer          = await provider.getSigner(0);
  const deployerAddress = await signer.getAddress();
  const balance         = await provider.getBalance(deployerAddress);
  const network         = await provider.getNetwork();

  console.log(`\n📋 Deployer : ${deployerAddress}`);
  console.log(`💰 Balance  : ${ethers.formatEther(balance)} ETH`);
  console.log(`🌐 Chain ID : ${network.chainId}`);

  console.log('\n🚀 Deploying...');

  const factory = new ethers.ContractFactory(abi, bytecode, signer);

  // Use fixed high gasLimit — Ganache estimateGas fails with newer solc bytecode
  const contract = await factory.deploy({ gasLimit: 3000000n });
  await contract.waitForDeployment();

  const contractAddress = await contract.getAddress();
  const receipt         = await provider.getTransactionReceipt(contract.deploymentTransaction().hash);

  console.log(`\n✅ Contract Address : ${contractAddress}`);
  console.log(`📦 Tx Hash          : ${receipt.hash}`);
  console.log(`⛽ Gas Used         : ${receipt.gasUsed.toString()}`);

  // Save config
  const config = {
    contractAddress,
    rpcUrl:      `http://127.0.0.1:${portUsed}`,
    chainId:     Number(network.chainId),
    networkPort: portUsed,
    deployedAt:  new Date().toISOString(),
    txHash:      receipt.hash,
    abi
  };

  fs.writeFileSync(path.join(__dirname, 'contract-config.json'), JSON.stringify(config, null, 2));

  console.log('\n📄 contract-config.json saved');
  console.log('🎉 Done! Refresh http://localhost:3000\n');
}

deploy().catch(err => {
  console.error('\n❌ Deploy failed:', err.message);
  process.exit(1);
});
