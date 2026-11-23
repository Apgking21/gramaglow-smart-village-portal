const assert = require('node:assert/strict');
const { DatabaseSync } = require('node:sqlite');
const { AdminUserRepository, verifyPassword } = require('./src/repositories/adminUserRepository');
const { AuthService } = require('./src/services/authService');

process.env.GRAMAGLOW_ADMIN_USERNAME = 'test-admin';
process.env.GRAMAGLOW_ADMIN_PASSWORD = 'a-long-test-password-123';
const db = new DatabaseSync(':memory:');
const repo = new AdminUserRepository(db);
const auth = new AuthService(repo);

const stored = repo.findActiveByUsername('test-admin');
assert.ok(stored, 'environment admin should be provisioned');
assert.notEqual(stored.password_hash, process.env.GRAMAGLOW_ADMIN_PASSWORD, 'password must not be stored in plaintext');
assert.ok(stored.password_salt, 'password salt must be stored');
assert.equal(verifyPassword(process.env.GRAMAGLOW_ADMIN_PASSWORD, stored.password_salt, stored.password_hash), true);
assert.equal(auth.authenticate('test-admin', process.env.GRAMAGLOW_ADMIN_PASSWORD).role, 'admin');
assert.equal(auth.authenticate('test-admin', 'incorrect-password'), null);
assert.equal(auth.authenticate('unknown-user', process.env.GRAMAGLOW_ADMIN_PASSWORD), null);
console.log('✓ Security tests passed: salted password hashing, username lookup and invalid credentials');
db.close();
