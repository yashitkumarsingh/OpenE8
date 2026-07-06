import { prisma, logAudit } from '../db.js';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '../../uploads');

export async function updateControlTest(req, res) {
  try {
    const { status, notes, reviewedBy } = req.body;
    const current = await prisma.controlTest.findUnique({
      where: { id: req.params.id },
      include: { assessment: true }
    });
    if (!current) {
      return res.status(404).json({ error: 'Control test not found' });
    }

    if (current.assessment.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot modify control test: Assessment is signed off and locked.' });
    }

    const controlTest = await prisma.controlTest.update({
      where: { id: req.params.id },
      data: {
        status,
        notes,
        reviewedBy,
        reviewedAt: new Date()
      }
    });

    await logAudit(reviewedBy || 'Assessor', 'UPDATE', 'ControlTest', controlTest.id, current, controlTest, `Reviewed control ${controlTest.requirementId}: Status changed to ${status}`);
    res.json(controlTest);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
}

export async function addEvidence(req, res) {
  try {
    const { name, type, owner, sourceSystem, confidenceLevel, notes, fileData } = req.body;
    
    const controlTest = await prisma.controlTest.findUnique({
      where: { id: req.params.testId },
      include: { assessment: true }
    });
    if (!controlTest) {
      return res.status(404).json({ error: 'Control test not found' });
    }
    if (controlTest.assessment.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot add evidence: Assessment is signed off and locked.' });
    }

    let urlOrPath = '';
    let contentHash = null;

    if (fileData && fileData.base64 && fileData.filename) {
      const buffer = Buffer.from(fileData.base64, 'base64');
      const filename = `${Date.now()}-${fileData.filename.replace(/[^a-zA-Z0-9.-]/g, '_')}`;
      const filePath = path.join(uploadsDir, filename);
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      fs.writeFileSync(filePath, buffer);
      urlOrPath = `/uploads/${filename}`;
      // Calculate SHA-256 baseline checksum
      contentHash = crypto.createHash('sha256').update(buffer).digest('hex');
    }

    const evidence = await prisma.evidence.create({
      data: {
        controlTestId: req.params.testId,
        name,
        type,
        urlOrPath,
        contentHash,
        owner,
        sourceSystem,
        confidenceLevel,
        notes
      }
    });

    await logAudit(owner || 'Assessor', 'CREATE', 'Evidence', evidence.id, null, evidence, `Added evidence resource: ${name} (Confidence: ${confidenceLevel})`);
    res.status(201).json(evidence);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function deleteEvidence(req, res) {
  try {
    const evidence = await prisma.evidence.findUnique({
      where: { id: req.params.id },
      include: {
        controlTest: {
          include: { assessment: true }
        }
      }
    });
    if (!evidence) {
      return res.status(404).json({ error: 'Evidence not found' });
    }

    if (evidence.controlTest.assessment.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot delete evidence: Assessment is signed off and locked.' });
    }

    if (evidence.urlOrPath && evidence.urlOrPath.startsWith('/uploads/')) {
      const filePath = path.join(__dirname, '../..', evidence.urlOrPath);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    }
    
    await prisma.evidence.delete({ where: { id: req.params.id } });
    await logAudit('Assessor', 'DELETE', 'Evidence', req.params.id, evidence, null, `Deleted evidence resource: ${evidence.name}`);
    res.json({ message: 'Evidence deleted successfully' });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

export async function verifyEvidenceIntegrity(req, res) {
  try {
    const evidence = await prisma.evidence.findUnique({ where: { id: req.params.id } });
    if (!evidence) {
      return res.status(404).json({ error: 'Evidence not found' });
    }

    if (!evidence.urlOrPath) {
      return res.status(400).json({ error: 'No file associated with this evidence resource' });
    }

    const filePath = path.join(__dirname, '../..', evidence.urlOrPath);
    if (!fs.existsSync(filePath)) {
      return res.status(400).json({
        verified: false,
        error: 'Evidence file is missing on disk'
      });
    }

    // Read and compute hash of file on disk
    const fileBuffer = fs.readFileSync(filePath);
    const calculatedHash = crypto.createHash('sha256').update(fileBuffer).digest('hex');

    if (!evidence.contentHash) {
      return res.status(400).json({
        verified: false,
        error: 'No baseline content hash registered for this evidence'
      });
    }

    // Constant-time comparison to prevent side-channel timing exploits
    // Reference: https://nodejs.org/api/crypto.html#cryptotimingsafeequala-b
    const storedHashBuf = Buffer.from(evidence.contentHash, 'utf8');
    const calculatedHashBuf = Buffer.from(calculatedHash, 'utf8');

    let verified = false;
    if (storedHashBuf.length === calculatedHashBuf.length) {
      verified = crypto.timingSafeEqual(storedHashBuf, calculatedHashBuf);
    }

    if (verified) {
      res.json({
        verified: true,
        storedHash: evidence.contentHash,
        calculatedHash,
        message: 'Evidence integrity verified. No post-assessment modifications detected.'
      });
    } else {
      res.json({
        verified: false,
        storedHash: evidence.contentHash,
        calculatedHash,
        error: 'INTEGRITY BREACH: File content hash does not match baseline!'
      });
    }
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
