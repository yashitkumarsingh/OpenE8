import { prisma, logAudit } from '../db.js';
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
  console.error('Error loading controls catalog in assessmentsController:', err);
}

export async function createAssessment(req, res) {
  try {
    const { createdBy } = req.body;
    const systemId = req.params.systemId;

    // Auto-attach the most recent catalog version for reproducibility
    const latestCatalog = await prisma.controlCatalogVersion.findFirst({
      orderBy: { versionDate: 'desc' }
    });

    const assessment = await prisma.assessment.create({
      data: {
        systemId,
        catalogVersionId: latestCatalog?.id || null,
        status: 'PLANNING',
        createdBy: createdBy || 'System Owner'
      }
    });

    // Populate control tests based on catalog requirements
    const controlTestsData = [];
    catalog.forEach(strategy => {
      strategy.requirements.forEach(r => {
        controlTestsData.push({
          assessmentId: assessment.id,
          requirementId: r.id,
          status: 'NOT_APPLICABLE',
          notes: ''
        });
      });
    });

    await prisma.controlTest.createMany({
      data: controlTestsData
    });

    await logAudit(createdBy, 'CREATE', 'Assessment', assessment.id, null, assessment, `Created initial assessment package.`);
    res.status(201).json(assessment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function updateAssessment(req, res) {
  try {
    const current = await prisma.assessment.findUnique({ where: { id: req.params.id } });
    if (!current) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    const assessment = await prisma.assessment.update({
      where: { id: req.params.id },
      data: { status: req.body.status }
    });

    await logAudit(assessment.createdBy || 'System Owner', 'UPDATE', 'Assessment', assessment.id, current, assessment, `Assessment phase updated to ${assessment.status}`);
    res.json(assessment);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function signOffAssessment(req, res) {
  try {
    const { role, signature } = req.body;
    
    // Validating required body params
    if (!role || !signature) {
      return res.status(400).json({ error: 'Role and signature are required for sign-off' });
    }

    const current = await prisma.assessment.findUnique({ where: { id: req.params.id } });
    if (!current) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Role-based auth validation:
    // User role in request context must match the role being signed
    if (role === 'ASSESSOR' && req.user.role !== 'ASSESSOR') {
      return res.status(403).json({ error: 'Only a Lead Security Assessor can sign as ASSESSOR' });
    }
    if (role === 'SYSTEM_OWNER' && req.user.role !== 'SYSTEM_OWNER') {
      return res.status(403).json({ error: 'Only a System Owner can sign as SYSTEM_OWNER' });
    }

    // Prepare update data based on role
    const updateData = {};
    if (role === 'ASSESSOR') {
      updateData.assessorSignature = signature;
      updateData.assessorSignedAt = new Date();
    } else if (role === 'SYSTEM_OWNER') {
      updateData.ownerSignature = signature;
      updateData.ownerSignedAt = new Date();
    }

    // Determine if both signatures are now present
    const hasAssessor = updateData.assessorSignature || current.assessorSignature;
    const hasOwner = updateData.ownerSignature || current.ownerSignature;
    
    if (hasAssessor && hasOwner) {
      updateData.status = 'COMPLETED'; // Lock the assessment!
    }

    const assessment = await prisma.assessment.update({
      where: { id: req.params.id },
      data: updateData
    });

    await logAudit(
      req.user.name || 'User',
      'UPDATE',
      'Assessment',
      assessment.id,
      current,
      assessment,
      `Signed off as ${role}. Assessment completed: ${assessment.status === 'COMPLETED'}`
    );

    res.json(assessment);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
