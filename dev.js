#!/usr/bin/env node
/**
 * Power Gym — Development Orchestrator
 * ─────────────────────────────────────
 * Single-command startup for the entire stack.
 *
 * Usage:  npm run dev:all   (from project root)
 *
 * What it does:
 *   1. Detects port conflicts on 3000 / 3001 and explains how to fix them.
 *   2. Starts the NestJS backend (npm run start:dev in ./backend).
 *   3. Waits until the backend health endpoint responds.
 *   4. Starts the Next.js frontend (npm run dev in ./frontend).
 *   5. Waits until the frontend responds.
 *   6. Detects the current LAN IPv4 automatically.
 *   7. Generates a terminal QR code for the mobile URL.
 *   8. Opens the browser at http://localhost:3000.
 *   9. Runs all health checks and prints a startup summary.
 *
 * No manual steps, no .env editing, no hardcoded IPs.
 */

'use strict';

const { spawn, execSync } = require('child_process');
const http = require('http');
const net = require('net');
const os = require('os');
const path = require('path');

// ── ANSI colours ──────────────────────────────────────────────────────────────
const C = {
  reset: '\x1b[0m',
  bold:  '\x1b[1m',
  green: '\x1b[32m',
  yellow:'\x1b[33m',
  red:   '\x1b[31m',
  cyan:  '\x1b[36m',
  white: '\x1b[37m',
  dim:   '\x1b[2m',
};

const ok  = (msg) => console.log(`${C.green}  ✅ ${msg}${C.reset}`);
const warn= (msg) => console.log(`${C.yellow}  ⚠️  ${msg}${C.reset}`);
const err = (msg) => console.log(`${C.red}  ❌ ${msg}${C.reset}`);
const info= (msg) => console.log(`${C.cyan}  ℹ  ${msg}${C.reset}`);
const sep = ()    => console.log(`${C.dim}${'─'.repeat(60)}${C.reset}`);

// ── LAN IP detection ──────────────────────────────────────────────────────────
function getLanIp() {
  const nets = os.networkInterfaces();
  // Prefer Wi-Fi, then any private-range IP
  const candidates = [];
  for (const [name, ifaces] of Object.entries(nets)) {
    for (const iface of (ifaces || [])) {
      if (iface.family === 'IPv4' && !iface.internal) {
        const ip = iface.address;
        if (
          ip.startsWith('192.168.') ||
          ip.startsWith('10.')       ||
          /^172\.(1[6-9]|2\d|3[01])\./.test(ip)
        ) {
          candidates.push({ name, ip });
        }
      }
    }
  }
  if (candidates.length === 0) return null;
  // Prefer Wi-Fi adapter
  const wifi = candidates.find(c => /wi[-]?fi|wlan|wlp/i.test(c.name));
  return (wifi || candidates[0]).ip;
}

// ── Port conflict check ────────────────────────────────────────────────────────
function isPortInUse(port) {
  return new Promise(resolve => {
    const server = net.createServer();
    server.once('error', () => resolve(true));
    server.once('listening', () => { server.close(); resolve(false); });
    server.listen(port, '127.0.0.1');
  });
}

function getPortProcess(port) {
  try {
    // Windows: netstat
    const out = execSync(
      `netstat -ano | findstr :${port}`,
      { encoding: 'utf8', stdio: ['pipe','pipe','pipe'] }
    );
    const lines = out.trim().split('\n').filter(l => l.includes('LISTENING'));
    if (lines.length) {
      const pid = lines[0].trim().split(/\s+/).pop();
      try {
        const proc = execSync(
          `tasklist /FI "PID eq ${pid}" /FO CSV /NH`,
          { encoding: 'utf8', stdio: ['pipe','pipe','pipe'] }
        ).trim();
        return { pid, name: proc.split(',')[0]?.replace(/"/g,'') || 'unknown' };
      } catch { return { pid, name: 'unknown' }; }
    }
  } catch { /* ignore */ }
  return null;
}

async function checkPortConflicts() {
  const conflicts = [];
  for (const port of [3001, 3000]) {
    if (await isPortInUse(port)) {
      const proc = getPortProcess(port);
      conflicts.push({ port, proc });
    }
  }
  if (conflicts.length === 0) return true;

  console.log('');
  err(`Port conflict detected!`);
  for (const { port, proc } of conflicts) {
    if (proc) {
      err(`  Port ${port} is already in use by: ${proc.name} (PID ${proc.pid})`);
      err(`  To free it:  taskkill /PID ${proc.pid} /F`);
    } else {
      err(`  Port ${port} is already in use.`);
    }
  }
  console.log('');
  process.exit(1);
}

// ── HTTP polling ───────────────────────────────────────────────────────────────
function pollHttp(url, { timeoutMs = 60000, intervalMs = 1000 } = {}) {
  return new Promise((resolve, reject) => {
    const start = Date.now();
    function attempt() {
      http.get(url, res => {
        res.resume(); // drain
        resolve(res.statusCode);
      }).on('error', () => {
        if (Date.now() - start > timeoutMs) {
          reject(new Error(`Timed out waiting for ${url}`));
        } else {
          setTimeout(attempt, intervalMs);
        }
      });
    }
    attempt();
  });
}

// ── QR Code ───────────────────────────────────────────────────────────────────
async function printQr(url) {
  try {
    // qrcode is already in backend/node_modules
    const qrcode = require(path.join(__dirname, 'backend', 'node_modules', 'qrcode'));
    const qr = await qrcode.toString(url, { type: 'terminal', small: true });
    console.log(qr);
  } catch {
    warn('QR code library not found — skipping QR display.');
  }
}

// ── Open browser ──────────────────────────────────────────────────────────────
function openBrowser(url) {
  try {
    // Windows
    execSync(`start "" "${url}"`, { stdio: 'ignore', shell: true });
  } catch {
    try { execSync(`xdg-open "${url}"`, { stdio: 'ignore' }); } catch {
      try { execSync(`open "${url}"`, { stdio: 'ignore' }); } catch { /* give up */ }
    }
  }
}

// ── Spawn process with streaming logs ─────────────────────────────────────────
function spawnService(label, command, cwd, color) {
  const [cmd, ...args] = command.split(' ');
  const prefix = `${color}[${label}]${C.reset} `;

  const child = spawn(cmd, args, {
    cwd,
    shell: true,
    env: { ...process.env },
  });

  child.stdout.on('data', d => {
    d.toString().split('\n').filter(Boolean).forEach(line => {
      process.stdout.write(prefix + line + '\n');
    });
  });

  child.stderr.on('data', d => {
    d.toString().split('\n').filter(Boolean).forEach(line => {
      process.stdout.write(prefix + C.yellow + line + C.reset + '\n');
    });
  });

  child.on('exit', (code) => {
    if (code !== 0 && code !== null) {
      err(`${label} process exited with code ${code}`);
    }
  });

  return child;
}

// ── Health checks ─────────────────────────────────────────────────────────────
async function runHealthChecks() {
  const results = [];

  // 1. Backend root
  try {
    await pollHttp('http://localhost:3001', { timeoutMs: 5000 });
    results.push({ name: 'Backend API', ok: true });
  } catch {
    results.push({ name: 'Backend API', ok: false, detail: 'Not responding on :3001' });
  }

  // 2. Database + Prisma
  try {
    await new Promise((resolve, reject) => {
      http.get('http://localhost:3001/health/db', res => {
        let body = '';
        res.on('data', d => body += d);
        res.on('end', () => {
          try {
            const json = JSON.parse(body);
            if (json.status === 'ok') resolve(json);
            else reject(new Error(body));
          } catch { reject(new Error(body)); }
        });
      }).on('error', reject);
    });
    results.push({ name: 'Database + Prisma', ok: true });
  } catch (e) {
    const detail = e.message.includes('ECONNREFUSED')
      ? 'Cannot reach PostgreSQL. Is the DB running? Check DATABASE_URL in backend/.env'
      : `DB check failed: ${e.message}`;
    results.push({ name: 'Database + Prisma', ok: false, detail });
  }

  // 3. Login endpoint (405 = endpoint exists; 401/200 also fine)
  try {
    await new Promise((resolve, reject) => {
      const req = http.request(
        { hostname: 'localhost', port: 3001, path: '/auth/login', method: 'POST',
          headers: { 'Content-Type': 'application/json' } },
        res => { res.resume(); resolve(res.statusCode); }
      );
      req.on('error', reject);
      req.write(JSON.stringify({ email: '__health__', password: '__health__' }));
      req.end();
    });
    results.push({ name: 'Login Endpoint', ok: true });
  } catch (e) {
    results.push({ name: 'Login Endpoint', ok: false, detail: e.message });
  }

  // 4. Frontend
  try {
    await pollHttp('http://localhost:3000', { timeoutMs: 5000 });
    results.push({ name: 'Frontend (Next.js)', ok: true });
  } catch {
    results.push({ name: 'Frontend (Next.js)', ok: false, detail: 'Not responding on :3000' });
  }

  // 5. API Proxy
  try {
    await new Promise((resolve, reject) => {
      http.get('http://localhost:3000/api/auth/me', res => {
        res.resume();
        // 401 = proxy is working (not authenticated is expected); 404 = broken
        if (res.statusCode === 401 || res.statusCode === 200) resolve(res.statusCode);
        else reject(new Error(`Unexpected status ${res.statusCode} from API proxy`));
      }).on('error', reject);
    });
    results.push({ name: 'Next.js API Proxy', ok: true });
  } catch (e) {
    results.push({ name: 'Next.js API Proxy', ok: false, detail: e.message });
  }

  return results;
}

// ── Firewall hint ──────────────────────────────────────────────────────────────
function printFirewallHint(lanIp) {
  console.log('');
  warn('If your phone cannot reach the frontend, run this in an admin PowerShell:');
  console.log(`${C.yellow}  netsh advfirewall firewall add rule name="Power Gym Frontend" protocol=TCP dir=in localport=3000 action=allow${C.reset}`);
  console.log(`${C.yellow}  netsh advfirewall firewall add rule name="Power Gym Backend"  protocol=TCP dir=in localport=3001 action=allow${C.reset}`);
  console.log('');
}

// ── Main ───────────────────────────────────────────────────────────────────────
async function main() {
  console.log('');
  console.log(`${C.bold}${C.cyan}${'═'.repeat(60)}${C.reset}`);
  console.log(`${C.bold}${C.cyan}  ⚡  Power Gym — Starting Development Environment${C.reset}`);
  console.log(`${C.bold}${C.cyan}${'═'.repeat(60)}${C.reset}`);
  console.log('');

  // 1. Port conflict check
  info('Checking port availability…');
  await checkPortConflicts();
  ok('Ports 3000 and 3001 are free');

  // 2. Start backend
  sep();
  info('Starting NestJS backend…');
  const backendDir = path.join(__dirname, 'backend');
  const backend = spawnService('BACKEND', 'npm run start:dev', backendDir, C.green);

  // 3. Wait for backend
  info('Waiting for backend to become healthy (up to 60 s)…');
  try {
    await pollHttp('http://localhost:3001', { timeoutMs: 60000 });
    ok('Backend is up');
  } catch (e) {
    err('Backend did not start within 60 seconds.');
    err('Check the logs above for errors.');
    err('Common cause: PostgreSQL is unreachable — verify DATABASE_URL in backend/.env');
    backend.kill();
    process.exit(1);
  }

  // 4. Start frontend
  sep();
  info('Starting Next.js frontend…');
  const frontendDir = path.join(__dirname, 'frontend');
  const frontend = spawnService('FRONTEND', 'npm run dev', frontendDir, C.cyan);

  // 5. Wait for frontend
  info('Waiting for frontend to become healthy (up to 60 s)…');
  try {
    await pollHttp('http://localhost:3000', { timeoutMs: 60000 });
    ok('Frontend is up');
  } catch (e) {
    err('Frontend did not start within 60 seconds.');
    err('Check the logs above for errors.');
    backend.kill();
    frontend.kill();
    process.exit(1);
  }

  // 6. Run health checks
  sep();
  info('Running health checks…');
  const checks = await runHealthChecks();
  let allOk = true;
  for (const c of checks) {
    if (c.ok) {
      ok(c.name);
    } else {
      err(`${c.name} — ${c.detail || 'FAILED'}`);
      allOk = false;
    }
  }

  // 7. LAN detection
  const lanIp = getLanIp();

  // 8. Open browser
  setTimeout(() => openBrowser('http://localhost:3000'), 500);

  // 9. Startup summary
  sep();
  console.log('');
  console.log(`${C.bold}${C.green}${'═'.repeat(60)}${C.reset}`);
  console.log(`${C.bold}${C.green}  ⚡  Power Gym — Ready!${C.reset}`);
  console.log(`${C.bold}${C.green}${'═'.repeat(60)}${C.reset}`);
  console.log('');
  console.log(`${C.bold}  Frontend (Local)${C.reset}`);
  console.log(`  ${C.cyan}http://localhost:3000${C.reset}`);
  console.log('');
  if (lanIp) {
    console.log(`${C.bold}  Frontend (Mobile / LAN)${C.reset}`);
    console.log(`  ${C.cyan}http://${lanIp}:3000${C.reset}`);
    console.log('');
  }
  console.log(`${C.bold}  Backend (Local)${C.reset}`);
  console.log(`  ${C.cyan}http://localhost:3001${C.reset}`);
  console.log('');
  if (lanIp) {
    console.log(`${C.bold}  Backend (LAN)${C.reset}`);
    console.log(`  ${C.cyan}http://${lanIp}:3001${C.reset}`);
    console.log('');
  }
  console.log(`${C.bold}  Database${C.reset}`);
  const dbOk = checks.find(c => c.name === 'Database + Prisma');
  console.log(`  ${dbOk?.ok ? C.green + '● Connected' : C.red + '● Not connected'}${C.reset}`);
  console.log('');
  console.log(`${C.bold}  Authentication${C.reset}`);
  const authOk = checks.find(c => c.name === 'Login Endpoint');
  console.log(`  ${authOk?.ok ? C.green + '● Healthy' : C.red + '● Unhealthy'}${C.reset}`);
  console.log('');
  console.log(`${C.bold}  API Proxy${C.reset}`);
  const proxyOk = checks.find(c => c.name === 'Next.js API Proxy');
  console.log(`  ${proxyOk?.ok ? C.green + '● Healthy' : C.red + '● Unhealthy'}${C.reset}`);
  console.log('');

  if (lanIp) {
    console.log(`${C.bold}${'═'.repeat(60)}${C.reset}`);
    console.log(`${C.bold}  Scan from your phone:${C.reset}`);
    console.log('');
    await printQr(`http://${lanIp}:3000`);
    console.log(`${C.bold}${'═'.repeat(60)}${C.reset}`);
    console.log('');
    printFirewallHint(lanIp);
  }

  if (!allOk) {
    warn('Some health checks failed — see details above.');
    warn('The app may still be partially usable.');
  }

  // Keep alive — forward SIGINT to children
  process.on('SIGINT', () => {
    console.log('\n');
    info('Shutting down…');
    backend.kill('SIGINT');
    frontend.kill('SIGINT');
    process.exit(0);
  });
}

main().catch(e => {
  err(`Fatal error: ${e.message}`);
  process.exit(1);
});
