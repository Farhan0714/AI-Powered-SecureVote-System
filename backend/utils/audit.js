const AuditLog = require('../models/AuditLog');

async function logAction(actor, action, { targetType, targetId, metadata } = {}) {
  try {
    await AuditLog.create({
      actorUsername: actor.username,
      actorRole: actor.role,
      action,
      targetType,
      targetId: targetId ? String(targetId) : undefined,
      metadata
    });
  } catch (err) {
    // Audit logging failures shouldn't break the primary action - just log to console.
    console.error('⚠️  Failed to write audit log:', err.message);
  }
}

module.exports = { logAction };
