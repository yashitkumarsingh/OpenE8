import { prisma, logAudit } from '../db.js';

export async function getExceptions(req, res) {
  try {
    const exceptions = await prisma.exception.findMany({
      where: { systemId: req.params.systemId }
    });
    res.json(exceptions);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createException(req, res) {
  try {
    const { 
      requirementId, 
      status, 
      riskStatement, 
      compensatingControl, 
      residualRisk, 
      approvedBy, 
      reviewDate, 
      expiryDate,
      compensatingControlEfficacy,
      temporaryOrPermanent,
      affectedUserCount,
      nextReviewOwner,
      riskAcceptedBy,
      approvalReason
    } = req.body;
    
    const exception = await prisma.exception.create({
      data: {
        systemId: req.params.systemId,
        requirementId,
        status: status || 'PENDING',
        riskStatement,
        compensatingControl,
        residualRisk,
        approvedBy,
        reviewDate: new Date(reviewDate),
        expiryDate: new Date(expiryDate),
        compensatingControlEfficacy,
        temporaryOrPermanent: temporaryOrPermanent || 'TEMPORARY',
        affectedUserCount: affectedUserCount ? parseInt(affectedUserCount, 10) : null,
        nextReviewOwner,
        riskAcceptedBy,
        riskAcceptedAt: riskAcceptedBy ? new Date() : null,
        approvalReason,
        approvedAt: new Date(),
        auditTrace: `Created exception request for ${requirementId} by security portal.`
      }
    });
    
    await logAudit(approvedBy, 'CREATE', 'Exception', exception.id, null, exception, `Requested exception for ${requirementId}`);
    res.status(201).json(exception);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function updateException(req, res) {
  try {
    const { 
      status, 
      riskStatement, 
      compensatingControl, 
      residualRisk, 
      approvedBy, 
      reviewDate, 
      expiryDate, 
      auditComment,
      compensatingControlEfficacy,
      temporaryOrPermanent,
      affectedUserCount,
      nextReviewOwner,
      riskAcceptedBy,
      approvalReason
    } = req.body;
    
    const current = await prisma.exception.findUnique({ where: { id: req.params.id } });
    if (!current) {
      return res.status(404).json({ error: 'Exception not found' });
    }
    const auditTrace = `${current.auditTrace || ''}\n[${new Date().toISOString()}] Updated: ${auditComment || 'Generic edit'}`;

    const exception = await prisma.exception.update({
      where: { id: req.params.id },
      data: {
        status,
        riskStatement,
        compensatingControl,
        residualRisk,
        approvedBy,
        reviewDate: reviewDate ? new Date(reviewDate) : undefined,
        expiryDate: expiryDate ? new Date(expiryDate) : undefined,
        compensatingControlEfficacy,
        temporaryOrPermanent,
        affectedUserCount: affectedUserCount ? parseInt(affectedUserCount, 10) : undefined,
        nextReviewOwner,
        riskAcceptedBy,
        riskAcceptedAt: riskAcceptedBy ? new Date() : undefined,
        approvalReason,
        auditTrace
      }
    });
    
    await logAudit(approvedBy || exception.approvedBy, 'UPDATE', 'Exception', exception.id, current, exception, auditComment || 'Updated exception parameters.');
    res.json(exception);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteException(req, res) {
  try {
    const current = await prisma.exception.findUnique({ where: { id: req.params.id } });
    if (!current) {
      return res.status(404).json({ error: 'Exception not found' });
    }
    await prisma.exception.delete({ where: { id: req.params.id } });
    await logAudit('Assessor', 'DELETE', 'Exception', req.params.id, current, null, `Deleted exception for ${current.requirementId}`);
    res.json({ message: 'Exception deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
