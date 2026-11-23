const SLA_DAYS = Object.freeze({ water: 2, streetlights: 3, health: 3, sanitation: 4, ration: 5, roads: 7 });
const CATEGORIES = Object.keys(SLA_DAYS);
const STATUSES = ['Submitted', 'Assigned', 'In Progress', 'Resolved'];

class GrievanceService {
  constructor(repository) { this.repository = repository; }

  create(input, cleanText) {
    const citizenName = cleanText(input.citizen_name, 100);
    const phone = String(input.phone || '').replace(/[^0-9+]/g, '').slice(0, 15);
    const ward = Number(input.ward_number);
    const landmark = cleanText(input.landmark, 160);
    const description = cleanText(input.description, 2000);
    if (!citizenName || !/^\+?[0-9\s-]{10,15}$/.test(String(input.phone || '')) ||
        !Number.isInteger(ward) || ward < 1 || ward > 8 || !landmark || !description ||
        !CATEGORIES.includes(input.category)) {
      const error = new Error('Please provide all required fields.'); error.statusCode = 400; throw error;
    }
    const member = this.repository.findWardMember(ward);
    // Random token plus a repository uniqueness check avoids relying on a four-digit guess alone.
    let token;
    for (let attempt = 0; attempt < 12; attempt++) {
      token = `GP-PIPRI-${new Date().getFullYear()}-${String(require('node:crypto').randomInt(1000, 10000))}`;
      if (!this.repository.findByToken(token)) break;
      token = null;
    }
    if (!token) throw new Error('Could not allocate a ticket number. Please retry.');
    const now = new Date().toISOString().replace('T', ' ').substring(0, 19);
    return this.repository.create({
      token, citizen_name: citizenName, phone, ward_number: ward, category: input.category,
      landmark, description, photo_url: input.photo_url ? cleanText(input.photo_url, 500) : null,
      urgency: ['Low', 'Normal', 'High', 'Critical'].includes(input.urgency) ? input.urgency : 'Normal',
      assigned_to_name: member ? `${member.name_en} (Ward ${ward})` : null,
      sla_days: SLA_DAYS[input.category], now
    });
  }

  update(token, input, cleanText) {
    if (input.status !== undefined && !STATUSES.includes(input.status)) {
      const error = new Error('Invalid grievance status.'); error.statusCode = 400; throw error;
    }
    if (input.assigned_ward_member_id !== undefined &&
        (!Number.isInteger(Number(input.assigned_ward_member_id)) || Number(input.assigned_ward_member_id) < 1 || Number(input.assigned_ward_member_id) > 8)) {
      const error = new Error('Invalid ward member.'); error.statusCode = 400; throw error;
    }
    return this.repository.updateStatus(token, {
      status: input.status,
      assigned_ward_member_id: input.assigned_ward_member_id === undefined ? undefined : Number(input.assigned_ward_member_id),
      resolution_remarks: input.resolution_remarks === undefined ? undefined : cleanText(input.resolution_remarks, 1000),
      resolution_photo_url: input.resolution_photo_url ? cleanText(input.resolution_photo_url, 500) : undefined
    });
  }

  refreshSla(now) { return this.repository.escalateOverdue(now); }
}
module.exports = { GrievanceService, SLA_DAYS, CATEGORIES, STATUSES };
