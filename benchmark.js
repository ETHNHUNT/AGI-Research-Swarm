#!/usr/bin/env node
// benchmark.js — Run on your Dell Inspiron 7567
// Fetches scripts from the server, runs them via ollama, auto-reports results.
// Usage: SERVER_URL=https://your-server.com node benchmark.js

const https = require('https');
const http = require('http');
const { execSync } = require('child_process');
const readline = require('readline');
const os = require('os');
const fs = require('fs');
const path = require('path');

const SERVER_URL = process.env.SERVER_URL || 'http://localhost:3000';
const HARDWARE = {
  cpu: 'Intel Core i7-7700HQ', ramGB: 16,
  gpuVramGB: 4, storageType: 'hdd', os: 'Windows'
};

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = q => new Promise(r => rl.question(q, r));

function fetchJSON(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => { try { resolve(JSON.parse(d)); } catch(e) { reject(e); } });
    }).on('error', reject);
  });
}

function fetchText(url) {
  return new Promise((resolve, reject) => {
    const lib = url.startsWith('https') ? https : http;
    lib.get(url, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(d));
    }).on('error', reject);
  });
}

function postJSON(url, body) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const u = new URL(url);
    const lib = u.protocol === 'https:' ? https : http;
    const req = lib.request({
      hostname: u.hostname, port: u.port, path: u.pathname,
      method: 'POST',
      headers: { 'Content-Type': 'application/json', 'Content-Length': Buffer.byteLength(data) }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => resolve(JSON.parse(d)));
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

async function main() {
  console.log('\n🔬 AGI Research Swarm — Dell Benchmark Runner');
  console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
  console.log(`Hardware: ${HARDWARE.cpu} | ${HARDWARE.ramGB}GB RAM | GTX 1050 4GB VRAM | HDD`);
  console.log(`Server:   ${SERVER_URL}\n`);

  // Check ollama is installed
  try {
    execSync('ollama --version', { stdio: 'pipe' });
    console.log('✅ Ollama detected\n');
  } catch {
    console.log('⚠️  Ollama not found. Install from https://ollama.ai first.\n');
  }

  // Fetch Dell queue
  let queue = [];
  try {
    const result = await fetchJSON(`${SERVER_URL}/api/v1/dell-queue`);
    queue = result.items || [];
    console.log(`📋 ${queue.length} script(s) in Dell queue\n`);
  } catch (err) {
    console.log(`Could not reach server: ${err.message}`);
    console.log('Check SERVER_URL and try again.\n');
    rl.close(); return;
  }

  if (queue.length === 0) {
    console.log('No scripts queued. Agent C hasn\'t flagged any hardware claims yet.');
    rl.close(); return;
  }

  // Show queue
  queue.forEach((item, i) => {
    console.log(`[${i + 1}] ${item.claim}`);
    console.log(`    Model: ${item.model_to_test} | ~${item.estimated_runtime || '10min'}`);
    if (item.agent_c_notes) console.log(`    Note: ${item.agent_c_notes}`);
    console.log('');
  });

  const choice = await ask(`Run script number (1-${queue.length}) or 'q' to quit: `);
  if (choice.toLowerCase() === 'q') { rl.close(); return; }

  const idx = parseInt(choice) - 1;
  if (idx < 0 || idx >= queue.length) { console.log('Invalid choice.'); rl.close(); return; }

  const item = queue[idx];
  console.log(`\n📥 Downloading script: ${item.script_name}`);

  // Download the script
  const scriptContent = await fetchText(`${SERVER_URL}/api/v1/scripts/${item.script_id}`);
  const scriptPath = path.join(process.cwd(), item.script_name);
  fs.writeFileSync(scriptPath, scriptContent);
  console.log(`✅ Saved to: ${scriptPath}`);

  // Pull the model first
  console.log(`\n⬇️  Pulling model: ${item.model_to_test} (may take a few minutes on HDD)...`);
  try {
    execSync(`ollama pull ${item.model_to_test}`, { stdio: 'inherit', timeout: 600000 });
  } catch (err) {
    console.log(`⚠️  Could not pull model automatically. Run: ollama pull ${item.model_to_test}`);
    await ask('Press Enter when model is ready...');
  }

  // Run the script
  console.log(`\n🚀 Running benchmark script...`);
  console.log('━'.repeat(50));
  try {
    execSync(`SERVER_URL=${SERVER_URL} python "${scriptPath}"`, {
      stdio: 'inherit',
      timeout: 900000, // 15 min max
      env: { ...process.env, SERVER_URL }
    });
  } catch (err) {
    console.log(`\n⚠️  Script exited with error: ${err.message}`);
    console.log('Results may have been saved to dell-results.jsonl');
  }

  console.log('\n✅ Benchmark complete. Results submitted to server.');
  console.log(`   View at: ${SERVER_URL}\n`);
  rl.close();
}

main().catch(err => { console.error(err); rl.close(); });
