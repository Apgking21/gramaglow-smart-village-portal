class GrievanceRepository {
  constructor(db) {
    this.db = db;
    db.exec(`CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_key TEXT NOT NULL,
      action TEXT NOT NULL,
      actor TEXT NOT NULL DEFAULT 'system',
      details_json TEXT NOT NULL DEFAULT '{}',
      created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
    );
    CREATE INDEX IF NOT EXISTS idx_audit_entity ON audit_logs(entity_type, entity_key, created_at DESC);`);
  }

  findByToken(token) {
    return this.db.prepare('SELECT * FROM grievances WHERE token = ?').get(token);
  }

  findWardMember(wardNumber) {
    return this.db.prepare('SELECT id, name_en, ward_number FROM ward_members WHERE ward_number = ?').get(wardNumber);
  }

  create(record) {
    // The ticket and its audit event must either both persist or neither persist.
    this.db.exec('BEGIN IMMEDIATE');
    try {
      this.db.prepare(`INSERT INTO grievances (
        token, citizen_name, phone, ward_number, category, landmark, description,
        photo_url, urgency, status, assigned_ward_member_id, assigned_to_name,
        submitted_at, updated_at, sla_days, is_escalated
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 'Submitted', ?, ?, ?, ?, ?, 0)`).run(
        record.token, record.citizen_name, record.phone, record.ward_number,
        record.category, record.landmark, record.description, record.photo_url,
        record.urgency, record.ward_number, record.assigned_to_name,
        record.now, record.now, record.sla_days
      );
      this.db.prepare(`INSERT INTO audit_logs (entity_type, entity_key, action, actor, details_json)
        VALUES ('grievance', ?, 'created', 'citizen', ?)`)
        .run(record.token, JSON.stringify({ category: record.category, ward_number: record.ward_number }));
      const created = this.findByToken(record.token);
      this.db.exec('COMMIT');
      return created;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  updateStatus(token, update) {
    this.db.exec('BEGIN IMMEDIATE');
    try {
      const current = this.findByToken(token);
      if (!current) { this.db.exec('ROLLBACK'); return null; }
      const wardMember = update.assigned_ward_member_id
        ? this.db.prepare('SELECT name_en, ward_number FROM ward_members WHERE id = ? OR ward_number = ?')
            .get(update.assigned_ward_member_id, update.assigned_ward_member_id)
        : null;
      const assignedName = wardMember ? `${wardMember.name_en} (Ward ${wardMember.ward_number})` : current.assigned_to_name;
      const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
      this.db.prepare(`UPDATE grievances SET status = ?, assigned_ward_member_id = ?,
        assigned_to_name = ?, resolution_remarks = ?, resolution_photo_url = ?, updated_at = ?
        WHERE token = ?`).run(
        update.status || current.status,
        update.assigned_ward_member_id || current.assigned_ward_member_id,
        assignedName,
        update.resolution_remarks !== undefined ? update.resolution_remarks : current.resolution_remarks,
        update.resolution_photo_url || current.resolution_photo_url,
        now, token
      );
      this.db.prepare(`INSERT INTO audit_logs (entity_type, entity_key, action, actor, details_json)
        VALUES ('grievance', ?, 'status_updated', 'admin', ?)`)
        .run(token, JSON.stringify({ from: current.status, to: update.status || current.status,
          assigned_ward_member_id: update.assigned_ward_member_id || current.assigned_ward_member_id }));
      const updated = this.findByToken(token);
      this.db.exec('COMMIT');
      return updated;
    } catch (error) {
      this.db.exec('ROLLBACK');
      throw error;
    }
  }

  escalateOverdue(now = new Date()) {
    const rows = this.db.prepare(`SELECT id, submitted_at, sla_days FROM grievances
      WHERE status != 'Resolved' AND is_escalated = 0`).all();
    const update = this.db.prepare(`UPDATE grievances SET is_escalated = 1,
      escalation_reason = 'SLA Exceeded: Auto-escalated to Block Development Officer (BDO)' WHERE id = ?`);
    let count = 0;
    this.db.exec('BEGIN IMMEDIATE');
    try {
      for (const row of rows) {
        const submitted = new Date(String(row.submitted_at).replace(' ', 'T'));
        if (Number.isFinite(submitted.getTime()) && (now - submitted) / 86400000 > row.sla_days) {
          const result = update.run(row.id);
          if (result.changes) count++;
        }
      }
      this.db.exec('COMMIT');
      return count;
    } catch (error) { this.db.exec('ROLLBACK'); throw error; }
  }
}
module.exports = { GrievanceRepository };
