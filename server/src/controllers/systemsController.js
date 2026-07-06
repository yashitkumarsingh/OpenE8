import { prisma, logAudit } from '../db.js';
import { calculateMaturity } from '../maturityEngine.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read catalog from data directory
const catalogPath = path.join(__dirname, '../../../data/essential-eight/controls.json');
let catalog = [];
try {
  catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));
} catch (err) {
  console.error('Error loading controls catalog in systemsController:', err);
}

export async function getSystems(req, res) {
  try {
    const systems = await prisma.system.findMany({
      include: {
        assessments: {
          orderBy: { createdAt: 'desc' },
          take: 1
        },
        exceptions: true,
        remediations: true
      }
    });
    res.json(systems);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function createSystem(req, res) {
  try {
    const { name, businessOwner, technicalOwner, environment, platform, dataSensitivity, targetMaturity, outOfScopeItems, scopeJustification } = req.body;
    const system = await prisma.system.create({
      data: {
        name,
        businessOwner,
        technicalOwner,
        environment,
        platform,
        dataSensitivity,
        targetMaturity,
        outOfScopeItems,
        scopeJustification
      }
    });
    // Create an initial assessment
    const assessment = await prisma.assessment.create({
      data: {
        systemId: system.id,
        status: 'PLANNING',
        createdBy: 'System Owner'
      }
    });

    // Populate control tests based on catalog requirements
    const controlTestsData = [];
    catalog.forEach(strategy => {
      strategy.requirements.forEach(req => {
        controlTestsData.push({
          assessmentId: assessment.id,
          requirementId: req.id,
          status: 'NOT_APPLICABLE',
          notes: ''
        });
      });
    });

    await prisma.controlTest.createMany({
      data: controlTestsData
    });

    await logAudit('System Owner', 'CREATE', 'System', system.id, null, system, `Created system scope profile: ${system.name}`);
    res.status(201).json(system);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function getSystemById(req, res) {
  try {
    const system = await prisma.system.findUnique({
      where: { id: req.params.id },
      include: {
        assessments: {
          orderBy: { createdAt: 'desc' },
          include: {
            testResults: {
              include: {
                evidenceList: true
              }
            }
          }
        },
        exceptions: true,
        remediations: true
      }
    });
    if (!system) return res.status(404).json({ error: 'System not found' });
    
    // Add calculated maturity info
    const latestAssessment = system.assessments[0];
    let maturity = null;
    if (latestAssessment) {
      maturity = calculateMaturity(catalog, latestAssessment, system.exceptions, system.targetMaturity);
    }

    // Fetch system audit logs
    const auditLogs = await prisma.auditLog.findMany({
      orderBy: { createdAt: 'desc' },
      take: 50
    });

    res.json({ ...system, maturity, auditLogs });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateSystem(req, res) {
  try {
    const current = await prisma.system.findUnique({ where: { id: req.params.id } });
    if (!current) {
      return res.status(404).json({ error: 'System not found' });
    }
    const system = await prisma.system.update({
      where: { id: req.params.id },
      data: req.body
    });
    await logAudit('System Owner', 'UPDATE', 'System', system.id, current, system, 'Updated system scope configurations.');
    res.json(system);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function deleteSystem(req, res) {
  try {
    const current = await prisma.system.findUnique({ where: { id: req.params.id } });
    if (!current) {
      return res.status(404).json({ error: 'System not found' });
    }
    await prisma.system.delete({ where: { id: req.params.id } });
    await logAudit('System Owner', 'DELETE', 'System', req.params.id, current, null, `Deleted system scope: ${current.name}`);
    res.json({ message: 'System deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function getSystemReport(req, res) {
  try {
    const system = await prisma.system.findUnique({
      where: { id: req.params.id },
      include: {
        assessments: {
          orderBy: { createdAt: 'desc' },
          include: {
            testResults: {
              include: {
                evidenceList: true
              }
            }
          }
        },
        exceptions: true,
        remediations: true
      }
    });

    if (!system) return res.status(404).json({ error: 'System not found' });
    const latestAssessment = system.assessments[0];
    if (!latestAssessment) return res.status(400).json({ error: 'No assessments available' });

    const maturity = calculateMaturity(catalog, latestAssessment, system.exceptions, system.targetMaturity);

    // Build Markdown Report
    let markdown = `# ASD Essential Eight Governance Report\n`;
    markdown += `**System**: ${system.name}\n`;
    markdown += `**Generated**: ${new Date().toLocaleDateString()}\n`;
    markdown += `**Target Maturity Level**: ${system.targetMaturity}\n`;
    markdown += `**Technical Maturity Level (Raw Status)**: ${maturity.technicalMaturity}\n`;
    markdown += `**Assessed Maturity Level (With Compensating Controls)**: ${maturity.overallMaturity}\n\n`;

    markdown += `## Scope Boundary\n`;
    markdown += `- **Business Owner**: ${system.businessOwner}\n`;
    markdown += `- **Technical Owner**: ${system.technicalOwner}\n`;
    markdown += `- **Environment**: ${system.environment}\n`;
    markdown += `- **Platform**: ${system.platform}\n`;
    markdown += `- **Data Sensitivity**: ${system.dataSensitivity}\n`;
    markdown += `- **Out of Scope**: ${system.outOfScopeItems || 'None'}\n`;
    markdown += `- **Scope Justification**: ${system.scopeJustification || 'N/A'}\n\n`;

    markdown += `## Strategy Maturity Posture\n`;
    Object.entries(maturity.strategyScores).forEach(([strat, score]) => {
      markdown += `- **${strat}**: ${score}\n`;
    });
    markdown += `\n`;

    if (maturity.blockingStrategies.length > 0) {
      markdown += `### Blocking Strategies (Failed to meet ${system.targetMaturity})\n`;
      maturity.blockingStrategies.forEach(s => {
        markdown += `- ${s}\n`;
      });
      markdown += `\n`;
    }

    markdown += `## Active Exceptions & Compensating Controls\n`;
    const activeEx = system.exceptions.filter(ex => ex.status === 'APPROVED');
    if (activeEx.length === 0) {
      markdown += `No active exceptions registered.\n\n`;
    } else {
      activeEx.forEach(ex => {
        markdown += `### Exception for ${ex.requirementId}\n`;
        markdown += `- **Risk Statement**: ${ex.riskStatement}\n`;
        markdown += `- **Compensating Control**: ${ex.compensatingControl}\n`;
        markdown += `- **Residual Risk**: ${ex.residualRisk}\n`;
        markdown += `- **Approved By**: ${ex.approvedBy}\n`;
        markdown += `- **Review Date**: ${new Date(ex.reviewDate).toLocaleDateString()}\n`;
        markdown += `- **Expiry Date**: ${new Date(ex.expiryDate).toLocaleDateString()}\n\n`;
      });
    }

    markdown += `## Open Remediation Board\n`;
    const openRem = system.remediations.filter(r => r.status !== 'DONE');
    if (openRem.length === 0) {
      markdown += `All remediation tasks completed!\n\n`;
    } else {
      openRem.forEach(r => {
        markdown += `### [${r.status}] ${r.title}\n`;
        markdown += `- **Requirement**: ${r.requirementId}\n`;
        markdown += `- **Description**: ${r.description}\n`;
        markdown += `- **Assigned To**: ${r.assignedTo || 'Unassigned'}\n`;
        markdown += `- **Due Date**: ${r.dueDate ? new Date(r.dueDate).toLocaleDateString() : 'N/A'}\n`;
        markdown += `- **Ticket**: ${r.ticketLink || 'None'}\n\n`;
      });
    }

    res.json({
      systemName: system.name,
      maturity,
      markdown,
      json: {
        systemName: system.name,
        targetMaturity: system.targetMaturity,
        calculatedMaturity: maturity.overallMaturity,
        strategyScores: maturity.strategyScores,
        exceptions: system.exceptions,
        remediations: system.remediations
      }
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function exportAuditLogs(req, res) {
  try {
    const system = await prisma.system.findUnique({
      where: { id: req.params.id },
      include: {
        assessments: {
          include: {
            testResults: {
              include: {
                evidenceList: true
              }
            }
          }
        },
        exceptions: true,
        remediations: true
      }
    });

    if (!system) return res.status(404).json({ error: 'System not found' });

    const assessmentIds = system.assessments.map(a => a.id);
    const controlTestIds = system.assessments.flatMap(a => a.testResults.map(t => t.id));
    const evidenceIds = system.assessments.flatMap(a => a.testResults.flatMap(t => t.evidenceList.map(ev => ev.id)));
    const exceptionIds = system.exceptions.map(e => e.id);
    const remediationIds = system.remediations.map(r => r.id);

    const auditLogs = await prisma.auditLog.findMany({
      where: {
        OR: [
          { entityType: 'System', entityId: system.id },
          { entityType: 'Assessment', entityId: { in: assessmentIds } },
          { entityType: 'ControlTest', entityId: { in: controlTestIds } },
          { entityType: 'Evidence', entityId: { in: evidenceIds } },
          { entityType: 'Exception', entityId: { in: exceptionIds } },
          { entityType: 'RemediationTask', entityId: { in: remediationIds } }
        ]
      },
      orderBy: { createdAt: 'desc' }
    });

    function escapeCSV(val) {
      if (val === null || val === undefined) return '';
      let str = String(val);
      str = str.replace(/"/g, '""');
      if (str.includes(',') || str.includes('"') || str.includes('\n') || str.includes('\r')) {
        return `"${str}"`;
      }
      return str;
    }

    let csv = 'Timestamp,Operator,Action,Component,Resource ID,Details,Old Value,New Value\n';
    for (const log of auditLogs) {
      csv += `${escapeCSV(log.createdAt.toISOString())},` +
             `${escapeCSV(log.userId)},` +
             `${escapeCSV(log.action)},` +
             `${escapeCSV(log.entityType)},` +
             `${escapeCSV(log.entityId)},` +
             `${escapeCSV(log.comment)},` +
             `${escapeCSV(log.oldValue)},` +
             `${escapeCSV(log.newValue)}\n`;
    }

    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=audit-log-${system.id}.csv`);
    res.send(csv);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
