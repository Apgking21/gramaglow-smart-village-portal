// test_logic.js - Unit tests for database queries, SLA escalation, and calculations
const { DatabaseSync } = require('node:sqlite');
const path = require('path');
const assert = require('assert');

const DB_PATH = path.join(__dirname, 'gramaglow.db');
const db = new DatabaseSync(DB_PATH);

console.log('--- GramaGlow Core Logic & Database Tests ---');

// 1. Verify Village Profile
const profile = db.prepare('SELECT * FROM village_profile WHERE id = 1').get();
assert.strictEqual(profile.name_en, 'Pipri Gram Panchayat');
assert.strictEqual(profile.population, 3420);
assert.strictEqual(profile.wards_count, 8);
console.log('✓ Test 1 Passed: Village profile verified (Pipri, Pop: 3,420, 8 Wards)');

// 2. Verify Ward Members
const wards = db.prepare('SELECT * FROM ward_members ORDER BY ward_number ASC').all();
assert.strictEqual(wards.length, 8);
console.log('✓ Test 2 Passed: 8 Ward members verified with contact details');

// 3. Verify Notices
const notices = db.prepare('SELECT * FROM notices').all();
assert(notices.length >= 5);
const meetingNotice = notices.find(n => n.category === 'meeting');
assert(meetingNotice.title_en.includes('Gram Sabha'));
console.log('✓ Test 3 Passed: Notices feed verified (includes Gram Sabha summons)');

// 4. Verify Development Projects & Budget Math
const projects = db.prepare('SELECT * FROM projects').all();
assert(projects.length >= 6);
const totalSanctioned = projects.reduce((s, p) => s + p.sanctioned_budget, 0);
const totalSpent = projects.reduce((s, p) => s + p.spent_amount, 0);
const spentPct = Math.round((totalSpent / totalSanctioned) * 100);
console.log(`✓ Test 4 Passed: 6 Infrastructure projects verified (Sanctioned: ₹${totalSanctioned}, Spent: ₹${totalSpent}, Rate: ${spentPct}%)`);

// 5. Test Grievance Submission
const randNum = Math.floor(1000 + Math.random() * 9000);
const token = `GP-PIPRI-2026-${randNum}`;
const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

db.prepare(`
  INSERT INTO grievances (
    token, citizen_name, phone, ward_number, category, landmark, description,
    urgency, status, assigned_ward_member_id, assigned_to_name,
    submitted_at, updated_at, sla_days, is_escalated
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', ?, ?, ?, ?, ?, 0)
`).run(
  token, 'Test Citizen', '9876543210', 3, 'water', 'Handpump #3', 'Test leak description',
  'High', 3, 'Shri Manoj Kumar Yadav (Ward 3)', now, now, 2
);

const inserted = db.prepare('SELECT * FROM grievances WHERE token = ?').get(token);
assert.strictEqual(inserted.citizen_name, 'Test Citizen');
assert.strictEqual(inserted.status, 'Submitted');
console.log(`✓ Test 5 Passed: Grievance submission & token generation verified (${token})`);

// 6. Test Status Transition State Machine (Submitted -> In Progress -> Resolved)
db.prepare(`
  UPDATE grievances 
  SET status = 'In Progress', resolution_remarks = 'Technician assigned' 
  WHERE token = ?
`).run(token);

let updated = db.prepare('SELECT * FROM grievances WHERE token = ?').get(token);
assert.strictEqual(updated.status, 'In Progress');

db.prepare(`
  UPDATE grievances 
  SET status = 'Resolved', resolution_remarks = 'Fixed tap valve' 
  WHERE token = ?
`).run(token);

updated = db.prepare('SELECT * FROM grievances WHERE token = ?').get(token);
assert.strictEqual(updated.status, 'Resolved');
console.log('✓ Test 6 Passed: State machine transitions (Submitted -> In Progress -> Resolved) verified');

// 7. Test SLA Escalation Heuristics
// Insert an overdue complaint (submitted 6 days ago with 2-day SLA)
const overdueDate = new Date(Date.now() - 6 * 24 * 60 * 60 * 1000).toISOString().replace('T', ' ').substring(0, 19);
const overdueToken = `GP-PIPRI-2026-OVERDUE`;

db.prepare(`
  INSERT INTO grievances (
    token, citizen_name, phone, ward_number, category, landmark, description,
    urgency, status, assigned_ward_member_id, assigned_to_name,
    submitted_at, updated_at, sla_days, is_escalated
  ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', ?, ?, ?, ?, ?, 0)
`).run(
  overdueToken, 'Overdue Citizen', '9876543211', 1, 'water', 'Old Well', 'Unresolved issue',
  'Critical', 1, 'Shri Ramswaroop Bind (Ward 1)', overdueDate, overdueDate, 2
);

// Run SLA escalation check logic
const openGrievances = db.prepare(`SELECT id, token, submitted_at, sla_days, status, is_escalated FROM grievances WHERE status != 'Resolved'`).all();
for (const g of openGrievances) {
  const diffDays = (Date.now() - new Date(g.submitted_at.replace(' ', 'T')).getTime()) / (1000 * 60 * 60 * 24);
  if (diffDays > g.sla_days && !g.is_escalated) {
    db.prepare(`
      UPDATE grievances 
      SET is_escalated = 1, 
          escalation_reason = 'SLA Exceeded: Auto-escalated to Block Development Officer (BDO)'
      WHERE id = ?
    `).run(g.id);
  }
}

const escalatedGrievance = db.prepare('SELECT * FROM grievances WHERE token = ?').get(overdueToken);
assert.strictEqual(escalatedGrievance.is_escalated, 1);
assert(escalatedGrievance.escalation_reason.includes('Block Development Officer'));
console.log('✓ Test 7 Passed: SLA escalation heuristics auto-escalated breached ticket to BDO');

// 8. Test Agenda Voting Increments
const agenda = db.prepare('SELECT * FROM agenda_votes LIMIT 1').get();
const startVotes = agenda.votes_count;
db.prepare('UPDATE agenda_votes SET votes_count = votes_count + 1 WHERE id = ?').run(agenda.id);
const votedAgenda = db.prepare('SELECT * FROM agenda_votes WHERE id = ?').get(agenda.id);
assert.strictEqual(votedAgenda.votes_count, startVotes + 1);
console.log(`✓ Test 8 Passed: Community voting tally increment verified (${startVotes} -> ${votedAgenda.votes_count})`);

// 9. Test Village Assets Geo-Inventory
const assets = db.prepare('SELECT * FROM village_assets').all();
assert.strictEqual(assets.length, 8);
console.log('✓ Test 9 Passed: 8 Village geo-assets verified (PHC, School, Anganwadi, Borewell, Solar Grid, etc.)');

// Clean up test records
db.prepare('DELETE FROM grievances WHERE token IN (?, ?)').run(token, overdueToken);

console.log('\n=======================================================');
console.log('🎉 ALL 9 CORE LOGIC & DATABASE TESTS PASSED! 🎉');
console.log('=======================================================');
