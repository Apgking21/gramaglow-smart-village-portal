// Run the suites against an isolated temporary copy of the project database.
const fs = require('fs');
const os = require('os');
const path = require('path');
const { spawnSync } = require('child_process');

const tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gramaglow-tests-'));
const testDb = path.join(tempDir, 'gramaglow-test.db');
fs.copyFileSync(path.join(__dirname, 'gramaglow.db'), testDb);
const env = { ...process.env, GRAMAGLOW_DB_PATH: testDb, GRAMAGLOW_ADMIN_PASSWORD: 'test-only-gramaglow-password' };

try {
  for (const file of ['test_logic.js', 'test_security.js', 'test_app.js']) {
    const result = spawnSync(process.execPath, [path.join(__dirname, file)], { stdio: 'inherit', env });
    if (result.status !== 0) process.exitCode = result.status || 1;
    if (process.exitCode) break;
  }
} finally {
  fs.rmSync(tempDir, { recursive: true, force: true });
}
