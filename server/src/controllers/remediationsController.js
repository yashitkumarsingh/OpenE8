import { prisma, logAudit } from '../db.js';

export async function getRemediations(req, res) {
  try {
    const remediations = await prisma.remediationTask.findMany({
      where: { systemId: req.params.systemId }
    });
    res.json(remediations);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createRemediation(req, res) {
  try {
    const { requirementId, title, description, status, assignedTo, dueDate, ticketLink } = req.body;
    const remediation = await prisma.remediationTask.create({
      data: {
        systemId: req.params.systemId,
        requirementId,
        title,
        description,
        status: status || 'BACKLOG',
        assignedTo,
        dueDate: dueDate ? new Date(dueDate) : null,
        ticketLink
      }
    });
    
    await logAudit(assignedTo || 'SysAdmin', 'CREATE', 'RemediationTask', remediation.id, null, remediation, `Created remediation task for ${requirementId}`);
    res.status(201).json(remediation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function updateRemediation(req, res) {
  try {
    const current = await prisma.remediationTask.findUnique({ where: { id: req.params.id } });
    if (!current) {
      return res.status(404).json({ error: 'Remediation task not found' });
    }
    const remediation = await prisma.remediationTask.update({
      where: { id: req.params.id },
      data: {
        ...req.body,
        dueDate: req.body.dueDate ? new Date(req.body.dueDate) : undefined
      }
    });
    
    await logAudit(remediation.assignedTo || 'SysAdmin', 'UPDATE', 'RemediationTask', remediation.id, current, remediation, `Updated status to ${remediation.status}`);
    res.json(remediation);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteRemediation(req, res) {
  try {
    const current = await prisma.remediationTask.findUnique({ where: { id: req.params.id } });
    if (!current) {
      return res.status(404).json({ error: 'Remediation task not found' });
    }
    await prisma.remediationTask.delete({ where: { id: req.params.id } });
    await logAudit('SysAdmin', 'DELETE', 'RemediationTask', req.params.id, current, null, `Deleted remediation: ${current.title}`);
    res.json({ message: 'Remediation task deleted' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
