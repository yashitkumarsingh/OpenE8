import { PrismaClient } from '@prisma/client';

export const prisma = new PrismaClient();

export async function logAudit(userId, action, entityType, entityId, oldValue = null, newValue = null, comment = null) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: userId || 'System User',
        action,
        entityType,
        entityId,
        oldValue: oldValue ? (typeof oldValue === 'object' ? JSON.stringify(oldValue) : String(oldValue)) : null,
        newValue: newValue ? (typeof newValue === 'object' ? JSON.stringify(newValue) : String(newValue)) : null,
        comment
      }
    });
  } catch (err) {
    console.error('Audit Logging failed:', err);
  }
}
