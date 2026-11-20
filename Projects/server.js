// server.js - Native Node.js REST API & Static Server for GramaGlow
const http = require('http');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');

const PORT = process.env.PORT || 3000;
const DB_PATH = path.join(__dirname, 'gramaglow.db');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Connect to SQLite
const db = new DatabaseSync(DB_PATH);

// Helper to evaluate and apply SLA escalations
function checkSlaEscalations() {
  try {
    const now = new Date();
    const openGrievances = db.prepare(`SELECT id, token, submitted_at, sla_days, status, is_escalated FROM grievances WHERE status != 'Resolved'`).all();
    
    for (const g of openGrievances) {
      const submittedDate = new Date(g.submitted_at.replace(' ', 'T'));
      const diffMs = now - submittedDate;
      const diffDays = diffMs / (1000 * 60 * 60 * 24);
      
      if (diffDays > g.sla_days && !g.is_escalated) {
        db.prepare(`
          UPDATE grievances 
          SET is_escalated = 1, 
              escalation_reason = 'SLA Exceeded: Auto-escalated to Block Development Officer (BDO)'
          WHERE id = ?
        `).run(g.id);
      }
    }
  } catch (err) {
    console.error('Error in checkSlaEscalations:', err.message);
  }
}

// Check SLA on startup and periodically
checkSlaEscalations();

// MIME Types Map
const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

// JSON helper response
function sendJson(res, statusCode, data) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type'
  });
  res.end(JSON.stringify(data));
}

// Parse request body
function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString();
      if (body.length > 5 * 1024 * 1024) { // 5MB limit
        reject(new Error('Payload too large'));
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        resolve(JSON.parse(body));
      } catch (err) {
        resolve({ raw: body });
      }
    });
    req.on('error', reject);
  });
}

const server = http.createServer(async (req, res) => {
  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.writeHead(204, {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type'
    });
    return res.end();
  }

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // ===================== REST API ROUTES =====================
  if (pathname.startsWith('/api/')) {
    checkSlaEscalations(); // Refresh SLAs

    // GET /api/village - Village demographic & leadership
    if (pathname === '/api/village' && method === 'GET') {
      const profile = db.prepare(`SELECT * FROM village_profile WHERE id = 1`).get();
      const wards = db.prepare(`SELECT * FROM ward_members ORDER BY ward_number ASC`).all();
      return sendJson(res, 200, { success: true, profile, wards });
    }

    // GET /api/stats - Dashboard analytics
    if (pathname === '/api/stats' && method === 'GET') {
      const profile = db.prepare(`SELECT population, households, wards_count FROM village_profile WHERE id = 1`).get();
      const projectStats = db.prepare(`
        SELECT 
          COUNT(*) as total_projects,
          SUM(sanctioned_budget) as total_budget,
          SUM(spent_amount) as total_spent,
          ROUND(AVG(completion_pct), 1) as avg_completion
        FROM projects
      `).get();
      
      const grievanceStats = db.prepare(`
        SELECT 
          COUNT(*) as total_grievances,
          SUM(CASE WHEN status = 'Submitted' THEN 1 ELSE 0 END) as submitted,
          SUM(CASE WHEN status = 'Assigned' THEN 1 ELSE 0 END) as assigned,
          SUM(CASE WHEN status = 'In Progress' THEN 1 ELSE 0 END) as in_progress,
          SUM(CASE WHEN status = 'Resolved' THEN 1 ELSE 0 END) as resolved,
          SUM(CASE WHEN is_escalated = 1 THEN 1 ELSE 0 END) as escalated
        FROM grievances
      `).get();

      const resolvedPct = grievanceStats.total_grievances > 0 
        ? Math.round((grievanceStats.resolved / grievanceStats.total_grievances) * 100) 
        : 100;
      
      const budgetPct = projectStats.total_budget > 0
        ? Math.round((projectStats.total_spent / projectStats.total_budget) * 100)
        : 0;

      return sendJson(res, 200, {
        success: true,
        stats: {
          village: profile,
          projects: {
            ...projectStats,
            budget_utilization_pct: budgetPct
          },
          grievances: {
            ...grievanceStats,
            resolved_pct: resolvedPct
          }
        }
      });
    }

    // GET /api/notices - List notices
    if (pathname === '/api/notices' && method === 'GET') {
      const category = parsedUrl.searchParams.get('category');
      let query = `SELECT * FROM notices ORDER BY issue_date DESC, id DESC`;
      let params = [];
      if (category && category !== 'all') {
        query = `SELECT * FROM notices WHERE category = ? ORDER BY issue_date DESC, id DESC`;
        params = [category];
      }
      const notices = db.prepare(query).all(...params);
      return sendJson(res, 200, { success: true, count: notices.length, notices });
    }

    // POST /api/notices - Create official notice (Admin action)
    if (pathname === '/api/notices' && method === 'POST') {
      try {
        const body = await parseBody(req);
        const {
          title_en, title_hi, category = 'general', priority = 'normal',
          authority_en = 'Office of the Sarpanch', authority_hi = 'कार्यालय ग्राम प्रधान/सरपंच',
          content_en, content_hi, meeting_datetime, venue_en, venue_hi, audio_text_en, audio_text_hi
        } = body;

        if (!title_en || !content_en) {
          return sendJson(res, 400, { success: false, error: 'Title and content in English are required.' });
        }

        const today = new Date().toISOString().split('T')[0];
        const stmt = db.prepare(`
          INSERT INTO notices (
            title_en, title_hi, category, priority, issue_date, authority_en, authority_hi,
            content_en, content_hi, meeting_datetime, venue_en, venue_hi, audio_text_en, audio_text_hi
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `);

        stmt.run(
          title_en, title_hi || title_en, category, priority, today,
          authority_en, authority_hi || authority_en,
          content_en, content_hi || content_en,
          meeting_datetime || null, venue_en || null, venue_hi || venue_en || null,
          audio_text_en || title_en, audio_text_hi || title_hi || title_en
        );

        return sendJson(res, 201, { success: true, message: 'Notice broadcasted successfully' });
      } catch (err) {
        return sendJson(res, 500, { success: false, error: err.message });
      }
    }

    // GET /api/projects - Development Projects and Budget Tracker
    if (pathname === '/api/projects' && method === 'GET') {
      const projects = db.prepare(`SELECT * FROM projects ORDER BY id ASC`).all();
      const enriched = projects.map(p => {
        let milestones = [];
        try {
          milestones = JSON.parse(p.milestones || '[]');
        } catch (e) {
          milestones = [];
        }
        const balance = p.sanctioned_budget - p.spent_amount;
        const spent_pct = Math.round((p.spent_amount / p.sanctioned_budget) * 100);
        return {
          ...p,
          milestones,
          balance_budget: balance,
          spent_percentage: spent_pct
        };
      });
      return sendJson(res, 200, { success: true, count: enriched.length, projects: enriched });
    }

    // PUT /api/projects/:id - Update project progress / expenditure (Admin action)
    if (pathname.match(/^\/api\/projects\/(\d+)$/) && method === 'PUT') {
      try {
        const id = parseInt(pathname.split('/')[3], 10);
        const body = await parseBody(req);
        const { spent_amount, completion_pct, status, milestones } = body;

        const current = db.prepare(`SELECT * FROM projects WHERE id = ?`).get(id);
        if (!current) {
          return sendJson(res, 404, { success: false, error: 'Project not found' });
        }

        const newSpent = spent_amount !== undefined ? spent_amount : current.spent_amount;
        const newPct = completion_pct !== undefined ? completion_pct : current.completion_pct;
        const newStatus = status || (newPct >= 100 ? 'Completed' : (newPct >= 90 ? 'Near Completion' : 'In Progress'));
        const newMilestones = milestones ? JSON.stringify(milestones) : current.milestones;

        db.prepare(`
          UPDATE projects 
          SET spent_amount = ?, completion_pct = ?, status = ?, milestones = ?
          WHERE id = ?
        `).run(newSpent, newPct, newStatus, newMilestones, id);

        return sendJson(res, 200, { success: true, message: 'Project updated successfully' });
      } catch (err) {
        return sendJson(res, 500, { success: false, error: err.message });
      }
    }

    // GET /api/grievances - Public ward resolution & status board
    if (pathname === '/api/grievances' && method === 'GET') {
      const ward = parsedUrl.searchParams.get('ward');
      const category = parsedUrl.searchParams.get('category');
      const status = parsedUrl.searchParams.get('status');
      const search = parsedUrl.searchParams.get('search');

      let query = `SELECT * FROM grievances WHERE 1=1`;
      const params = [];

      if (ward && ward !== 'all') {
        query += ` AND ward_number = ?`;
        params.push(parseInt(ward, 10));
      }
      if (category && category !== 'all') {
        query += ` AND category = ?`;
        params.push(category);
      }
      if (status && status !== 'all') {
        query += ` AND status = ?`;
        params.push(status);
      }
      if (search) {
        query += ` AND (token LIKE ? OR citizen_name LIKE ? OR landmark LIKE ? OR description LIKE ?)`;
        const s = `%${search}%`;
        params.push(s, s, s, s);
      }

      query += ` ORDER BY CASE WHEN is_escalated = 1 THEN 0 ELSE 1 END, submitted_at DESC`;
      const grievances = db.prepare(query).all(...params);
      return sendJson(res, 200, { success: true, count: grievances.length, grievances });
    }

    // GET /api/grievances/:token - Single grievance tracking
    if (pathname.match(/^\/api\/grievances\/([A-Za-z0-9\-]+)$/) && method === 'GET') {
      const token = pathname.split('/')[3];
      const g = db.prepare(`SELECT * FROM grievances WHERE token = ?`).get(token);
      if (!g) {
        return sendJson(res, 404, { success: false, error: 'Grievance ticket not found' });
      }
      return sendJson(res, 200, { success: true, grievance: g });
    }

    // POST /api/grievances - Citizen files a grievance
    if (pathname === '/api/grievances' && method === 'POST') {
      try {
        const body = await parseBody(req);
        const {
          citizen_name, phone, ward_number, category, landmark,
          description, photo_url, urgency = 'Normal'
        } = body;

        if (!citizen_name || !phone || !ward_number || !category || !landmark || !description) {
          return sendJson(res, 400, { success: false, error: 'Please provide all required fields.' });
        }

        // SLA by category (days)
        const slaMap = {
          'water': 2,
          'streetlights': 3,
          'health': 3,
          'sanitation': 4,
          'ration': 5,
          'roads': 7
        };
        const sla_days = slaMap[category] || 3;

        // Generate unique token: GP-PIPRI-2026-XXXX
        const randNum = Math.floor(1000 + Math.random() * 9000);
        const token = `GP-PIPRI-2026-${randNum}`;

        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);

        // Check ward member for auto-assignment suggestion
        const wardMember = db.prepare(`SELECT name_en FROM ward_members WHERE ward_number = ?`).get(parseInt(ward_number, 10));
        const assignedName = wardMember ? `${wardMember.name_en} (Ward ${ward_number})` : null;

        const stmt = db.prepare(`
          INSERT INTO grievances (
            token, citizen_name, phone, ward_number, category, landmark, description,
            photo_url, urgency, status, assigned_ward_member_id, assigned_to_name,
            submitted_at, updated_at, sla_days, is_escalated
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', ?, ?, ?, ?, ?, 0)
        `);

        stmt.run(
          token, citizen_name, phone, parseInt(ward_number, 10), category, landmark, description,
          photo_url || null, urgency, parseInt(ward_number, 10), assignedName,
          now, now, sla_days
        );

        const created = db.prepare(`SELECT * FROM grievances WHERE token = ?`).get(token);
        return sendJson(res, 201, {
          success: true,
          message: 'Grievance submitted successfully',
          token,
          grievance: created
        });
      } catch (err) {
        return sendJson(res, 500, { success: false, error: err.message });
      }
    }

    // PUT /api/grievances/:token/status - Admin updates grievance
    if (pathname.match(/^\/api\/grievances\/([A-Za-z0-9\-]+)\/status$/) && method === 'PUT') {
      try {
        const token = pathname.split('/')[3];
        const body = await parseBody(req);
        const { status, assigned_ward_member_id, resolution_remarks, resolution_photo_url } = body;

        const current = db.prepare(`SELECT * FROM grievances WHERE token = ?`).get(token);
        if (!current) {
          return sendJson(res, 404, { success: false, error: 'Grievance not found' });
        }

        let assignedName = current.assigned_to_name;
        if (assigned_ward_member_id) {
          const wm = db.prepare(`SELECT name_en, ward_number FROM ward_members WHERE id = ? OR ward_number = ?`).get(assigned_ward_member_id, assigned_ward_member_id);
          if (wm) assignedName = `${wm.name_en} (Ward ${wm.ward_number})`;
        }

        const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
        const newStatus = status || current.status;
        const newRemarks = resolution_remarks !== undefined ? resolution_remarks : current.resolution_remarks;
        const newPhoto = resolution_photo_url || current.resolution_photo_url;

        db.prepare(`
          UPDATE grievances 
          SET status = ?, 
              assigned_ward_member_id = ?, 
              assigned_to_name = ?, 
              resolution_remarks = ?, 
              resolution_photo_url = ?,
              updated_at = ?
          WHERE token = ?
        `).run(
          newStatus,
          assigned_ward_member_id || current.assigned_ward_member_id,
          assignedName,
          newRemarks,
          newPhoto,
          now,
          token
        );

        const updated = db.prepare(`SELECT * FROM grievances WHERE token = ?`).get(token);
        return sendJson(res, 200, { success: true, message: 'Status updated', grievance: updated });
      } catch (err) {
        return sendJson(res, 500, { success: false, error: err.message });
      }
    }

    // GET /api/schemes - Welfare schemes list
    if (pathname === '/api/schemes' && method === 'GET') {
      const schemes = db.prepare(`SELECT * FROM schemes ORDER BY id ASC`).all();
      return sendJson(res, 200, { success: true, count: schemes.length, schemes });
    }

    // GET /api/agenda-votes - Gram Sabha Digital Voting (Stretch)
    if (pathname === '/api/agenda-votes' && method === 'GET') {
      const agendas = db.prepare(`SELECT * FROM agenda_votes ORDER BY votes_count DESC, id ASC`).all();
      return sendJson(res, 200, { success: true, agendas });
    }

    // POST /api/agenda-votes - Suggest new agenda topic
    if (pathname === '/api/agenda-votes' && method === 'POST') {
      try {
        const body = await parseBody(req);
        const { title_en, title_hi, submitted_by, ward_number, description_en, description_hi } = body;
        if (!title_en || !description_en) {
          return sendJson(res, 400, { success: false, error: 'Title and description required' });
        }
        const today = new Date().toISOString().split('T')[0];
        const stmt = db.prepare(`
          INSERT INTO agenda_votes (title_en, title_hi, submitted_by, ward_number, description_en, description_hi, votes_count, status, created_at)
          VALUES (?, ?, ?, ?, ?, ?, 1, 'Open For Voting', ?)
        `);
        stmt.run(title_en, title_hi || title_en, submitted_by || 'Citizen', ward_number || 1, description_en, description_hi || description_en, today);
        return sendJson(res, 201, { success: true, message: 'Agenda item submitted' });
      } catch (err) {
        return sendJson(res, 500, { success: false, error: err.message });
      }
    }

    // POST /api/agenda-votes/:id/vote - Cast vote for community priority
    if (pathname.match(/^\/api\/agenda-votes\/(\d+)\/vote$/) && method === 'POST') {
      try {
        const id = parseInt(pathname.split('/')[3], 10);
        db.prepare(`UPDATE agenda_votes SET votes_count = votes_count + 1 WHERE id = ?`).run(id);
        const updated = db.prepare(`SELECT * FROM agenda_votes WHERE id = ?`).get(id);
        return sendJson(res, 200, { success: true, votes_count: updated.votes_count });
      } catch (err) {
        return sendJson(res, 500, { success: false, error: err.message });
      }
    }

    // GET /api/assets - Village Assets Geo-Inventory (Stretch)
    if (pathname === '/api/assets' && method === 'GET') {
      const assets = db.prepare(`SELECT * FROM village_assets ORDER BY id ASC`).all();
      return sendJson(res, 200, { success: true, assets });
    }

    // Unknown API
    return sendJson(res, 404, { success: false, error: 'API endpoint not found' });
  }

  // ===================== STATIC FILE SERVING =====================
  let safePath = path.normalize(pathname).replace(/^(\.\.[\/\\])+/, '');
  if (safePath === '/' || safePath === '\\') {
    safePath = '/index.html';
  } else if (safePath === '/static' || safePath === '/static/') {
    safePath = '/static.html';
  }

  const filePath = path.join(PUBLIC_DIR, safePath);

  // Check if file exists
  fs.stat(filePath, (err, stats) => {
    if (err || !stats.isFile()) {
      // Fallback for SPA routing: serve index.html if request accepts HTML
      if (req.headers.accept && req.headers.accept.includes('text/html')) {
        const fallbackPath = path.join(PUBLIC_DIR, 'index.html');
        fs.readFile(fallbackPath, (readErr, content) => {
          if (readErr) {
            res.writeHead(404, { 'Content-Type': 'text/plain' });
            return res.end('404 Not Found');
          }
          res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
          res.end(content);
        });
        return;
      }

      res.writeHead(404, { 'Content-Type': 'text/plain' });
      return res.end('File not found');
    }

    const ext = path.extname(filePath).toLowerCase();
    const contentType = MIME_TYPES[ext] || 'application/octet-stream';

    fs.readFile(filePath, (readErr, content) => {
      if (readErr) {
        res.writeHead(500, { 'Content-Type': 'text/plain' });
        return res.end('Server file read error');
      }
      res.writeHead(200, { 'Content-Type': contentType });
      res.end(content);
    });
  });
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🌾 GramaGlow: DigitalPanchayat Portal Server Running 🌾`);
  console.log(`🚀 URL: http://localhost:${PORT}`);
  console.log(`📄 Static Phase Showcase: http://localhost:${PORT}/static.html`);
  console.log(`💾 SQLite Database connected: ${DB_PATH}`);
  console.log(`=======================================================`);
});
