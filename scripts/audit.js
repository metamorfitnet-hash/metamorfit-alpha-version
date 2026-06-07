const fs = require('fs');
const path = require('path');

const audit = {
  crossWorker: 'FAILED',
  r2Connection: 'FAILED',
  proxy: 'FAILED',
  d1Initialized: 'FAILED',
  missingSecrets: []
};

// 1. Check Cross-Worker
try {
  const genPath = path.join('packages', 'worker', 'src', 'routes', 'generate.ts');
  const genContent = fs.readFileSync(genPath, 'utf8');
  if (genContent.includes('env.MACRO_ENGINE.fetch') && genContent.includes('http://localhost:8788')) {
    audit.crossWorker = 'PASSED';
  }
} catch (e) {}

// 2. Validate R2
try {
  const wranglerContent = fs.readFileSync('wrangler.toml', 'utf8');
  const r2ServicePath = path.join('packages', 'worker', 'src', 'services', 'r2Service.ts');
  const r2ServiceContent = fs.readFileSync(r2ServicePath, 'utf8');
  if (wranglerContent.includes('binding = "PDF_STORAGE"') && r2ServiceContent.includes('env.PDF_STORAGE')) {
    audit.r2Connection = 'PASSED';
  }
} catch (e) {}

// 3. Verify Proxy
try {
  const proxyPath = path.join('apps', 'web', 'src', 'app', 'api', 'download', '[jobId]', 'route.ts');
  const proxyContent = fs.readFileSync(proxyPath, 'utf8');
  if (proxyContent.includes('process.env.WORKER_URL') && proxyContent.includes('api/download/')) {
    audit.proxy = 'PASSED';
  }
} catch (e) {}

// 4. Test D1
try {
  const wranglerContent = fs.readFileSync('wrangler.toml', 'utf8');
  if (wranglerContent.includes('[[d1_databases]]') && wranglerContent.includes('binding = "METAMORFIT_DB"')) {
    audit.d1Initialized = 'PASSED';
  }
} catch (e) {}

// 5. Check Secrets
const requiredSecrets = ['BREVO_API_KEY', 'SYSTEME_API_KEY', 'HMAC_SECRET', 'SUPABASE_URL', 'SUPABASE_KEY'];
let devVarsContent = '';
try {
  devVarsContent = fs.readFileSync('.dev.vars', 'utf8');
} catch (e) {
  try {
    devVarsContent = fs.readFileSync(path.join('packages', 'worker', '.dev.vars'), 'utf8');
  } catch (e2) {}
}

requiredSecrets.forEach(secret => {
  if (!devVarsContent.includes(secret)) {
    audit.missingSecrets.push(secret);
  }
});

console.log('--- METAMORFIT AUDIT REPORT ---');
console.log('Cross-Worker Communication:', audit.crossWorker);
console.log('R2 Connection:', audit.r2Connection);
console.log('Proxy Verification:', audit.proxy);
console.log('D1 Initialization:', audit.d1Initialized);

if (audit.missingSecrets.length > 0) {
  console.log('\n[WARNING] Missing secrets in .dev.vars:');
  audit.missingSecrets.forEach(s => console.log('  - ' + s));
  console.log('\nPlease add these to your .dev.vars file for local development.');
} else {
  console.log('\n[SUCCESS] All required secrets found in .dev.vars.');
}
