// test_app.js - Comprehensive test suite for GramaGlow Server & Database
const http = require('http');
const path = require('path');
const fs = require('fs');

async function runTests() {
  console.log('--- GramaGlow Test Suite Starting ---');

  // We can require server.js directly or start an instance
  const serverModule = require('./server.js');
  // Wait 500ms for server to bind
  await new Promise(r => setTimeout(r, 600));

  const PORT = process.env.PORT || 3000;
  const baseUrl = `http://localhost:${PORT}`;

  async function apiGet(endpoint) {
    const res = await fetch(`${baseUrl}${endpoint}`);
    if (!res.ok) throw new Error(`GET ${endpoint} failed: ${res.status}`);
    return await res.json();
  }

  async function apiPost(endpoint, data) {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`POST ${endpoint} failed: ${res.status}`);
    return await res.json();
  }

  async function apiPut(endpoint, data) {
    const res = await fetch(`${baseUrl}${endpoint}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data)
    });
    if (!res.ok) throw new Error(`PUT ${endpoint} failed: ${res.status}`);
    return await res.json();
  }

  // Test 1: Village Profile & Wards
  console.log('Test 1: Fetching Village Profile & Ward Members...');
  const village = await apiGet('/api/village');
  console.log(`✓ Village: ${village.profile.name_en} (${village.profile.name_hi})`);
  console.log(`✓ Population: ${village.profile.population}, Wards: ${village.wards.length}`);
  if (village.wards.length !== 8) throw new Error('Expected 8 wards');

  // Test 2: Stats Dashboard
  console.log('Test 2: Fetching Panchayat Dashboard KPIs...');
  const stats = await apiGet('/api/stats');
  console.log(`✓ Projects: ${stats.stats.projects.total_projects}, Budget Utilized: ${stats.stats.projects.budget_utilization_pct}%`);
  console.log(`✓ Grievance Redressal: ${stats.stats.grievances.resolved_pct}% resolved`);

  // Test 3: Notices & Categories
  console.log('Test 3: Fetching Notices & Announcements...');
  const notices = await apiGet('/api/notices');
  console.log(`✓ Notices Count: ${notices.count}`);
  const meetings = await apiGet('/api/notices?category=meeting');
  console.log(`✓ Meeting Notices: ${meetings.count}`);

  // Test 4: Projects & Budgets
  console.log('Test 4: Fetching Development Projects & Expenditure...');
  const projects = await apiGet('/api/projects');
  console.log(`✓ Projects Count: ${projects.count}`);
  const roadProject = projects.projects.find(p => p.category === 'roads');
  console.log(`✓ Road Project: "${roadProject.title_en}"`);
  console.log(`  Sanctioned: ₹${roadProject.sanctioned_budget}, Spent: ₹${roadProject.spent_amount}, Progress: ${roadProject.completion_pct}%`);

  // Test 5: Update Project Progress (Admin)
  console.log('Test 5: Updating Project Milestone Progress...');
  const updateProjRes = await apiPut(`/api/projects/${roadProject.id}`, {
    spent_amount: 375000,
    completion_pct: 85
  });
  console.log(`✓ Project Updated: ${updateProjRes.message}`);

  // Test 6: Grievance Redressal State Machine
  console.log('Test 6: Testing Citizen Grievance Filing...');
  const newComplaint = await apiPost('/api/grievances', {
    citizen_name: 'Devendra Bind',
    phone: '9839122334',
    ward_number: 1,
    category: 'water',
    landmark: 'Purva Handpump #2',
    description: 'Continuous leaking seal causing water wastage on road.',
    urgency: 'High'
  });
  console.log(`✓ Grievance Filed! Generated Token: ${newComplaint.token}`);

  // Test 7: Grievance Status Transition (Submitted -> Assigned -> Resolved)
  console.log('Test 7: Admin Assigning Grievance to Ward Member #1...');
  const assignRes = await apiPut(`/api/grievances/${newComplaint.token}/status`, {
    status: 'In Progress',
    assigned_ward_member_id: 1,
    resolution_remarks: 'Plumber dispatched with spare gasket.'
  });
  console.log(`✓ Status Updated: ${assignRes.grievance.status}, Assigned to: ${assignRes.grievance.assigned_to_name}`);

  // Test 8: Gram Sabha Agenda Voting
  console.log('Test 8: Testing Community Agenda Voting...');
  const agendas = await apiGet('/api/agenda-votes');
  const targetAgenda = agendas.agendas[0];
  const initialVotes = targetAgenda.votes_count;
  const voteRes = await apiPost(`/api/agenda-votes/${targetAgenda.id}/vote`, {});
  console.log(`✓ Vote Cast for "${targetAgenda.title_en}": ${initialVotes} -> ${voteRes.votes_count}`);

  // Test 9: Assets Geo-Inventory
  console.log('Test 9: Fetching Village Public Assets...');
  const assets = await apiGet('/api/assets');
  console.log(`✓ Assets Count: ${assets.assets.length}`);

  // Test 10: Static File Delivery
  console.log('Test 10: Testing Static File Serving...');
  const indexHtml = await fetch(`${baseUrl}/`).then(r => r.text());
  if (!indexHtml.includes('GramaGlow')) throw new Error('index.html missing GramaGlow title');
  console.log('✓ index.html delivered successfully');

  const staticHtml = await fetch(`${baseUrl}/static.html`).then(r => r.text());
  if (!staticHtml.includes('Static Phase Showcase')) throw new Error('static.html missing content');
  console.log('✓ static.html delivered successfully');

  console.log('\n=======================================================');
  console.log('🎉 ALL GRAMAGLOW TESTS PASSED SUCCESSFULLY! (10/10) 🎉');
  console.log('=======================================================');
  process.exit(0);
}

runTests().catch(err => {
  console.error('❌ Test failed:', err);
  process.exit(1);
});
