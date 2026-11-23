// server.js - Native Node.js REST API & Static Server for GramaGlow
const http = require('http');
const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const crypto = require('node:crypto');
const { AdminUserRepository } = require('./src/repositories/adminUserRepository');
const { AuthService } = require('./src/services/authService');
const { GrievanceRepository } = require('./src/repositories/grievanceRepository');
const { GrievanceService } = require('./src/services/grievanceService');
const logger = require('./src/observability/logger');

const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.GRAMAGLOW_DB_PATH || path.join(__dirname, 'gramaglow.db');
const PUBLIC_DIR = path.join(__dirname, 'public');

// Connect to SQLite
const db = new DatabaseSync(DB_PATH);
const adminUserRepository = new AdminUserRepository(db);
const authService = new AuthService(adminUserRepository);
const grievanceRepository = new GrievanceRepository(db);
const grievanceService = new GrievanceService(grievanceRepository);

// Small, safe indexes improve common public-board lookups as the dataset grows.
db.exec(`
  CREATE INDEX IF NOT EXISTS idx_grievances_token ON grievances(token);
  CREATE INDEX IF NOT EXISTS idx_grievances_status_submitted ON grievances(status, submitted_at DESC);
  CREATE INDEX IF NOT EXISTS idx_notices_issue_date ON notices(issue_date DESC);
  CREATE INDEX IF NOT EXISTS idx_projects_category ON projects(category);
`);


// Domain logic lives in the grievance service/repository, not in HTTP handlers.
function checkSlaEscalations() {
  try {
    const escalated = grievanceService.refreshSla();
    if (escalated) logger.info('grievance.sla_escalated', { count: escalated });
  } catch (err) { logger.error('grievance.sla_check_failed', { message: err.message }); }
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

// Security and response helpers
const sessions = new Map();
const SESSION_TTL_MS = 8 * 60 * 60 * 1000;
const loginAttempts = new Map();
const MAX_BODY_BYTES = 1024 * 1024;

function sendJson(res, statusCode, data, extraHeaders = {}) {
  res.writeHead(statusCode, {
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
    ...extraHeaders
  });
  res.end(JSON.stringify(data));
}

function parseCookies(header = '') {
  return Object.fromEntries(header.split(';').map(part => {
    const index = part.indexOf('=');
    return index < 0 ? ['', ''] : [part.slice(0, index).trim(), decodeURIComponent(part.slice(index + 1).trim())];
  }).filter(([key]) => key));
}

function currentSession(req) {
  const token = parseCookies(req.headers.cookie).gramaglow_session;
  const session = token && sessions.get(token);
  if (!session) return null;
  if (session.expiresAt < Date.now()) {
    sessions.delete(token);
    return null;
  }
  session.expiresAt = Date.now() + SESSION_TTL_MS;
  return { token, ...session };
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a || ''));
  const right = Buffer.from(String(b || ''));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function isSameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true; // non-browser clients; authentication still required for admin writes
  try {
    return new URL(origin).host === (req.headers.host || '');
  } catch {
    return false;
  }
}

function cleanText(value, max = 500) {
  if (typeof value !== 'string') return '';
  return value.replace(/[\\u0000-\\u0008\\u000B\\u000C\\u000E-\\u001F]/g, '').trim().slice(0, max)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

function parseBody(req) {
  return new Promise((resolve, reject) => {
    let body = '';
    req.on('data', chunk => {
      body += chunk.toString('utf8');
      if (Buffer.byteLength(body, 'utf8') > MAX_BODY_BYTES) {
        reject(Object.assign(new Error('Payload too large'), { statusCode: 413 }));
        req.destroy();
      }
    });
    req.on('end', () => {
      if (!body) return resolve({});
      try {
        const parsed = JSON.parse(body);
        if (!parsed || typeof parsed !== 'object' || Array.isArray(parsed)) {
          return reject(Object.assign(new Error('JSON body must be an object'), { statusCode: 400 }));
        }
        resolve(parsed);
      } catch {
        reject(Object.assign(new Error('Malformed JSON request body'), { statusCode: 400 }));
      }
    });
    req.on('error', reject);
  });
}

function requireAdmin(req, res) {
  if (!currentSession(req)) {
    sendJson(res, 401, { success: false, error: 'Administrator sign-in required.' });
    return false;
  }
  return true;
}

function securityHeaders(res) {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Content-Security-Policy', "default-src 'self'; img-src 'self' data: https:; script-src 'self'; style-src 'self' 'unsafe-inline'; object-src 'none'; base-uri 'self'; frame-ancestors 'none'; form-action 'self'");
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
}

const server = http.createServer(async (req, res) => {
  securityHeaders(res);
  try {

  const parsedUrl = new URL(req.url, `http://${req.headers.host || 'localhost'}`);
  const pathname = parsedUrl.pathname;
  const method = req.method;

  // ===================== REST API ROUTES =====================
  if (pathname.startsWith('/api/')) {
    if (pathname === '/api/docs/openapi.json' && method === 'GET') {
      const spec = JSON.parse(fs.readFileSync(path.join(__dirname, 'docs/openapi.json'), 'utf8'));
      return sendJson(res, 200, spec);
    }
        if (pathname === '/api/health' && method === 'GET') {
      try {
        db.prepare('SELECT 1 AS ok').get();
        return sendJson(res, 200, { success: true, status: 'healthy', database: 'connected', version: '1.2.0' });
      } catch (err) {
        logger.error('health.database_failed', { message: err.message });
        return sendJson(res, 503, { success: false, status: 'degraded' });
      }
    }

    // Session endpoints
    if (pathname === '/api/auth/me' && method === 'GET') {
      const session = currentSession(req);
      return sendJson(res, 200, { success: true, authenticated: Boolean(session), role: session ? 'admin' : 'citizen' });
    }
    if (pathname === '/api/auth/login' && method === 'POST') {
      if (!isSameOrigin(req)) return sendJson(res, 403, { success: false, error: 'Cross-origin request rejected.' });
      const ip = req.socket.remoteAddress || 'unknown';
      const attempt = loginAttempts.get(ip) || { count: 0, blockedUntil: 0 };
      if (attempt.blockedUntil > Date.now()) return sendJson(res, 429, { success: false, error: 'Too many login attempts. Try again later.' });
      try {
        const body = await parseBody(req);
        if (!process.env.GRAMAGLOW_ADMIN_PASSWORD) {
          return sendJson(res, 503, { success: false, error: 'Admin login is not configured. Set GRAMAGLOW_ADMIN_PASSWORD and restart the server.' });
        }
        const username = typeof body.username === 'string' ? body.username : (process.env.GRAMAGLOW_ADMIN_USERNAME || 'admin');
        const user = authService.authenticate(username, body.password);
        if (!user) {
          attempt.count += 1;
          if (attempt.count >= 5) { attempt.count = 0; attempt.blockedUntil = Date.now() + 15 * 60 * 1000; }
          loginAttempts.set(ip, attempt);
          logger.warn('auth.login_failed', { ip, username: String(username).slice(0, 80) });
          return sendJson(res, 401, { success: false, error: 'Incorrect username or password.' });
        }
        loginAttempts.delete(ip);
        const token = crypto.randomBytes(32).toString('hex');
        sessions.set(token, { role: user.role, userId: user.id, username: user.username, expiresAt: Date.now() + SESSION_TTL_MS });
        logger.info('auth.login_succeeded', { userId: user.id, username: user.username });
        const secure = req.socket.encrypted ? '; Secure' : '';
        return sendJson(res, 200, { success: true, role: user.role, username: user.username }, {
          'Set-Cookie': `gramaglow_session=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=${SESSION_TTL_MS / 1000}${secure}`
        });
      } catch (err) {
        return sendJson(res, err.statusCode || 400, { success: false, error: err.message });
      }
    }
    if (pathname === '/api/auth/logout' && method === 'POST') {
      if (!isSameOrigin(req)) return sendJson(res, 403, { success: false, error: 'Cross-origin request rejected.' });
      const session = currentSession(req);
      if (session) sessions.delete(session.token);
      return sendJson(res, 200, { success: true }, { 'Set-Cookie': 'gramaglow_session=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0' });
    }

    // Browser writes must originate from this site. Admin mutations additionally require a valid session.
    const isWrite = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);
    if (isWrite && !isSameOrigin(req)) return sendJson(res, 403, { success: false, error: 'Cross-origin request rejected.' });
    const adminMutation =
      (pathname === '/api/notices' && method === 'POST') ||
      (/^\/api\/projects\/\d+$/.test(pathname) && method === 'PUT') ||
      (/^\/api\/grievances\/[A-Za-z0-9-]+\/status$/.test(pathname) && method === 'PUT');
    if (adminMutation && !requireAdmin(req, res)) return;

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

        if (!cleanText(title_en, 160) || !cleanText(content_en, 5000)) {
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
          cleanText(title_en, 160), cleanText(title_hi || title_en, 160), ['general','meeting','health','education','development','alert'].includes(category) ? category : 'general', ['normal','urgent','high'].includes(priority) ? priority : 'normal', today,
          cleanText(authority_en, 160), cleanText(authority_hi || authority_en, 160),
          cleanText(content_en, 5000), cleanText(content_hi || content_en, 5000),
          meeting_datetime || null, venue_en || null, venue_hi || venue_en || null,
          audio_text_en || title_en, audio_text_hi || title_hi || title_en
        );

        return sendJson(res, 201, { success: true, message: 'Notice broadcasted successfully' });
      } catch (err) {
        console.error('[api] Request failed:', err.message); return sendJson(res, err.statusCode || 500, { success: false, error: err.statusCode ? err.message : 'The request could not be completed. Please try again.' });
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

        if (spent_amount !== undefined && (!Number.isFinite(Number(spent_amount)) || Number(spent_amount) < 0 || Number(spent_amount) > current.sanctioned_budget)) {
          return sendJson(res, 400, { success: false, error: 'Spent amount must be between 0 and the sanctioned budget.' });
        }
        if (completion_pct !== undefined && (!Number.isFinite(Number(completion_pct)) || Number(completion_pct) < 0 || Number(completion_pct) > 100)) {
          return sendJson(res, 400, { success: false, error: 'Completion must be between 0 and 100.' });
        }
        const newSpent = spent_amount !== undefined ? Number(spent_amount) : current.spent_amount;
        const newPct = completion_pct !== undefined ? Number(completion_pct) : current.completion_pct;
        const newStatus = status || (newPct >= 100 ? 'Completed' : (newPct >= 90 ? 'Near Completion' : 'In Progress'));
        const newMilestones = milestones ? JSON.stringify(milestones) : current.milestones;

        db.prepare(`
          UPDATE projects 
          SET spent_amount = ?, completion_pct = ?, status = ?, milestones = ?
          WHERE id = ?
        `).run(newSpent, newPct, newStatus, newMilestones, id);

        return sendJson(res, 200, { success: true, message: 'Project updated successfully' });
      } catch (err) {
        console.error('[api] Request failed:', err.message); return sendJson(res, err.statusCode || 500, { success: false, error: err.statusCode ? err.message : 'The request could not be completed. Please try again.' });
      }
    }

    // GET /api/grievances - Public ward resolution & status board
    if (pathname === '/api/grievances' && method === 'GET') {
      const ward = parsedUrl.searchParams.get('ward');
      const category = parsedUrl.searchParams.get('category');
      const status = parsedUrl.searchParams.get('status');
      const search = parsedUrl.searchParams.get('search');
      const limit = Math.min(100, Math.max(1, Number.parseInt(parsedUrl.searchParams.get('limit') || '50', 10) || 50));
      const offset = Math.max(0, Number.parseInt(parsedUrl.searchParams.get('offset') || '0', 10) || 0);

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

      const countQuery = query.replace('SELECT * FROM grievances', 'SELECT COUNT(*) AS total FROM grievances');
      const total = db.prepare(countQuery).get(...params).total;
      query += ` ORDER BY CASE WHEN is_escalated = 1 THEN 0 ELSE 1 END, submitted_at DESC LIMIT ? OFFSET ?`;
      const grievances = db.prepare(query).all(...params, limit, offset);
      return sendJson(res, 200, { success: true, count: grievances.length, total, limit, offset, grievances });
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
        const created = grievanceService.create(body, cleanText);
        return sendJson(res, 201, {
          success: true,
          message: 'Grievance submitted successfully',
          token: created.token,
          grievance: created
        });
      } catch (err) {
        console.error('[api] Request failed:', err.message); return sendJson(res, err.statusCode || 500, { success: false, error: err.statusCode ? err.message : 'The request could not be completed. Please try again.' });
      }
    }

    // PUT /api/grievances/:token/status - Admin updates grievance
    if (pathname.match(/^\/api\/grievances\/([A-Za-z0-9\-]+)\/status$/) && method === 'PUT') {
      try {
        const token = pathname.split('/')[3];
        const body = await parseBody(req);
        const updated = grievanceService.update(token, body, cleanText);
        if (!updated) return sendJson(res, 404, { success: false, error: 'Grievance not found' });
        return sendJson(res, 200, { success: true, message: 'Status updated', grievance: updated });
      } catch (err) {
        console.error('[api] Request failed:', err.message); return sendJson(res, err.statusCode || 500, { success: false, error: err.statusCode ? err.message : 'The request could not be completed. Please try again.' });
      }
    }

    // GET /api/admin/audit - recent administrative and citizen ticket events
    if (pathname === '/api/admin/audit' && method === 'GET') {
      if (!requireAdmin(req, res)) return;
      const limit = Math.min(100, Math.max(1, Number(parsedUrl.searchParams.get('limit')) || 50));
      const events = db.prepare('SELECT id, entity_type, entity_key, action, actor, details_json, created_at FROM audit_logs ORDER BY id DESC LIMIT ?').all(limit);
      return sendJson(res, 200, { success: true, count: events.length, events });
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
        console.error('[api] Request failed:', err.message); return sendJson(res, err.statusCode || 500, { success: false, error: err.statusCode ? err.message : 'The request could not be completed. Please try again.' });
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
        console.error('[api] Request failed:', err.message); return sendJson(res, err.statusCode || 500, { success: false, error: err.statusCode ? err.message : 'The request could not be completed. Please try again.' });
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
  } else if (safePath === '/react' || safePath === '/react/') {
    safePath = '/react-dist/index.html';
  }

  const filePath = path.resolve(PUBLIC_DIR, '.' + safePath);
  if (!filePath.startsWith(PUBLIC_DIR + path.sep) && filePath !== path.join(PUBLIC_DIR, 'index.html')) {
    res.writeHead(403, { 'Content-Type': 'text/plain; charset=utf-8' });
    return res.end('Forbidden');
  }

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
  } catch (err) {
    logger.error('http.unhandled_request_error', {
      method: req.method,
      path: (() => { try { return new URL(req.url, 'http://localhost').pathname; } catch { return '/unknown'; } })(),
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
    if (!res.headersSent) {
      const status = Number.isInteger(err.statusCode) && err.statusCode >= 400 && err.statusCode < 600 ? err.statusCode : 500;
      sendJson(res, status, { success: false, error: status === 500 ? 'The request could not be completed. Please try again.' : err.message });
    } else if (!res.writableEnded) {
      res.end();
    }
  }
});

server.listen(PORT, () => {
  console.log(`=======================================================`);
  console.log(`🌾 GramaGlow: DigitalPanchayat Portal Server Running 🌾`);
  console.log(`🚀 URL: http://localhost:${PORT}`);
  console.log(`📄 Static Phase Showcase: http://localhost:${PORT}/static.html`);
  console.log(`💾 SQLite Database connected: ${DB_PATH}`);
  console.log(`🔐 Admin authentication: ${process.env.GRAMAGLOW_ADMIN_PASSWORD ? 'configured' : 'NOT CONFIGURED (set GRAMAGLOW_ADMIN_PASSWORD)'}`);
  console.log(`=======================================================`);
});
