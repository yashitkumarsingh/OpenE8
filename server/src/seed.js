import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { fileURLToPath } from 'url';
import { hashPassword } from './authMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const prisma = new PrismaClient();

async function main() {
  console.log('Clearing database tables...');
  await prisma.user.deleteMany({});
  await prisma.auditLog.deleteMany({});
  await prisma.remediationTask.deleteMany({});
  await prisma.exception.deleteMany({});
  await prisma.evidence.deleteMany({});
  await prisma.controlTest.deleteMany({});
  await prisma.assessment.deleteMany({});
  await prisma.controlCatalogVersion.deleteMany({});
  await prisma.system.deleteMany({});

  console.log('Creating default user accounts...');
  const passHash = await hashPassword('Password123');
  await prisma.user.createMany({
    data: [
      { email: 'assessor@opene8.gov.au', passwordHash: passHash, name: 'Lead Security Assessor', role: 'ASSESSOR' },
      { email: 'owner@opene8.gov.au', passwordHash: passHash, name: 'RMS System Owner', role: 'SYSTEM_OWNER' },
      { email: 'auditor@opene8.gov.au', passwordHash: passHash, name: 'Internal Auditor', role: 'AUDITOR' }
    ]
  });

  console.log('Writing mock evidence documents to disk...');
  const evidenceDir = path.join(__dirname, '../../evidence');
  if (!fs.existsSync(evidenceDir)) {
    fs.mkdirSync(evidenceDir, { recursive: true });
  }

  const entraReportContent = JSON.stringify({
    entra_mfa_status: "ENFORCED",
    conditional_access_policies: [
      { id: "cap-001", name: "Require MFA for Admins", state: "enabled" },
      { id: "cap-002", name: "Require MFA for All Users", state: "enabled" }
    ],
    last_compliance_scan: new Date().toISOString()
  }, null, 2);

  const backupScheduleContent = `Veeam Backup & Replication Job Schedule
System Scope: OpenE8 Records Management System (RMS)
Execution: Daily at 23:00 AEST
Target: Air-gapped immutable storage vault (WORM enabled)
Retention: 365 Days
Validation: Verification scripts check block integrity daily.`;

  fs.writeFileSync(path.join(evidenceDir, 'azure-entra-mfa-report.json'), entraReportContent);
  fs.writeFileSync(path.join(evidenceDir, 'backup-schedules.txt'), backupScheduleContent);

  const entraHash = crypto.createHash('sha256').update(entraReportContent).digest('hex');
  const backupHash = crypto.createHash('sha256').update(backupScheduleContent).digest('hex');

  console.log('Seeding database with default governance data...');

  // Read controls catalog and compute its hash for tamper-check
  const catalogPath = path.join(__dirname, '../../data/essential-eight/controls.json');
  const catalogRaw = fs.readFileSync(catalogPath, 'utf8');
  const catalog = JSON.parse(catalogRaw);
  const catalogHash = crypto.createHash('sha256').update(catalogRaw).digest('hex');

  // Seed the catalog version record (Essential Eight October 2024)
  const catalogVersion = await prisma.controlCatalogVersion.create({
    data: {
      name: 'Starter Catalogue (Inspired by ASD Essential 8 October 2024)',
      source: 'https://www.cyber.gov.au/resources-business-and-government/essential-cyber-security/essential-eight/essential-eight-maturity-model',
      versionDate: new Date('2024-10-01'),
      hash: catalogHash,
    }
  });
  console.log(`Seeded catalog version: ${catalogVersion.name} (hash: ${catalogHash.substring(0, 12)}...)`);

  // ==========================================
  // SYSTEM 1: Records Management System (RMS)
  // Target: ML2. Has a compensating control exception.
  // ==========================================
  const sys1 = await prisma.system.create({
    data: {
      name: 'Records Management System (RMS)',
      businessOwner: 'Corporate Services',
      technicalOwner: 'ICT Operations',
      environment: 'Prod',
      platform: 'Azure & M365',
      dataSensitivity: 'Protected',
      targetMaturity: 'ML2',
      outOfScopeItems: 'Legacy archival storage',
      scopeJustification: 'Legacy archival segment is isolated via hardware firewall rules with no egress routes.',
    },
  });
  console.log(`Created System 1: ${sys1.name}`);

  const asm1 = await prisma.assessment.create({
    data: {
      systemId: sys1.id,
      catalogVersionId: catalogVersion.id,
      status: 'REVIEWING_CONTROLS',
      createdBy: 'Lead Security Assessor',
    },
  });

  // Seed Control Tests for RMS
  for (const strategy of catalog) {
    for (const req of strategy.requirements) {
      let status = 'NOT_APPLICABLE';
      let notes = 'Meets requirement baseline.';

      if (req.level === 'ML1') {
        status = 'PASSED';
        notes = 'Verified fully operational and automated.';
      } else if (req.level === 'ML2') {
        if (strategy.slug === 'restrict-admin-privileges') {
          // Technical failure, but met via compensating control
          status = 'MET_VIA_COMPENSATING_CONTROL';
          notes = 'Technical check failed (manual list audit is overdue), but Sentinel daily audit alerts are active.';
        } else {
          status = 'PASSED';
          notes = 'Configuration checks successfully parsed.';
        }
      }

      const ct = await prisma.controlTest.create({
        data: {
          assessmentId: asm1.id,
          requirementId: req.id,
          status,
          notes,
          reviewedBy: 'Security Lead',
          reviewedAt: new Date(),
        },
      });

      if (status === 'PASSED') {
        await prisma.evidence.create({
          data: {
            controlTestId: ct.id,
            name: `${req.id} Azure Policy Logs`,
            type: 'API_EXPORT',
            urlOrPath: '/evidence/azure-entra-mfa-report.json',
            contentHash: entraHash,
            owner: 'ICT Operations',
            sourceSystem: 'Microsoft Entra ID',
            confidenceLevel: 'HIGH',
            reviewer: 'Security Lead',
            reviewDecision: 'ACCEPTED',
            reviewDecisionBy: 'Security Lead',
            reviewedAt: new Date(),
            notes: 'Microsoft Entra ID conditional access properties verified.',
          },
        });
      }
    }
  }

  // Create approved exception compensating control for RMS
  const exception1 = await prisma.exception.create({
    data: {
      systemId: sys1.id,
      requirementId: 'E8-RP-ML2-01',
      status: 'APPROVED',
      riskStatement: '6-monthly formal audit checklist of all local administrative groups has not been automated.',
      compensatingControl: 'Sentinel alerting rules configured to notify Security Operations Centre (SOC) of any local administrative group adjustments within 15 minutes. LAPS is enforced.',
      residualRisk: 'MEDIUM',
      approvedBy: 'CISO Office',
      reviewDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000),
      auditTrace: 'Approved by CISO on 2026-06-15. Logged by Security Lead.',
    },
  });

  // Create remediation task for RMS
  await prisma.remediationTask.create({
    data: {
      systemId: sys1.id,
      requirementId: 'E8-RP-ML2-01',
      title: 'Automate Privilege Audits',
      description: 'Deploy Azure Logic App to query server local administrators groups and output dashboard reports monthly.',
      status: 'IN_PROGRESS',
      assignedTo: 'Lead DevOps Engineer',
      dueDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      ticketLink: 'https://jira.internal/browse/SEC-412',
    },
  });

  // Seed Audit Logs for RMS
  await prisma.auditLog.create({
    data: {
      userId: 'System Owner',
      action: 'CREATE',
      entityType: 'System',
      entityId: sys1.id,
      comment: 'Created RMS Scope Boundary.',
    },
  });
  await prisma.auditLog.create({
    data: {
      userId: 'CISO Office',
      action: 'UPDATE',
      entityType: 'Exception',
      entityId: exception1.id,
      comment: 'Approved compensating control exception for local admin audits (E8-RP-ML2-01).',
    },
  });


  // ==========================================
  // SYSTEM 2: HR Core Portal
  // Target: ML3. Legacy stack with active failures, no exceptions.
  // ==========================================
  const sys2 = await prisma.system.create({
    data: {
      name: 'HR Core Portal',
      businessOwner: 'People & Culture',
      technicalOwner: 'ICT Operations',
      environment: 'Prod',
      platform: 'IIS & Active Directory',
      dataSensitivity: 'Protected',
      targetMaturity: 'ML3',
      outOfScopeItems: 'None',
      scopeJustification: 'Handles employee files, PII, and payroll configurations. Strictly in scope.',
    },
  });
  console.log(`Created System 2: ${sys2.name}`);

  const asm2 = await prisma.assessment.create({
    data: {
      systemId: sys2.id,
      catalogVersionId: catalogVersion.id,
      status: 'COLLECTING_EVIDENCE',
      createdBy: 'Lead Security Assessor',
    },
  });

  // Seed Control Tests for HR Core Portal
  for (const strategy of catalog) {
    for (const req of strategy.requirements) {
      let status = 'FAILED';
      let notes = 'Unconfigured. Evidence verification failed.';

      // Make Daily Backups Pass
      if (strategy.slug === 'daily-backups') {
        status = 'PASSED';
        notes = 'Nightly full backups verify restoration schedules.';
      } else if (strategy.slug === 'restrict-admin-privileges' && req.level === 'ML1') {
        status = 'PASSED';
        notes = 'Local admin rights restricted on member server hosts.';
      }

      const ct = await prisma.controlTest.create({
        data: {
          assessmentId: asm2.id,
          requirementId: req.id,
          status,
          notes,
          reviewedBy: 'Security Lead',
          reviewedAt: new Date(),
        },
      });

      if (status === 'PASSED') {
        await prisma.evidence.create({
          data: {
            controlTestId: ct.id,
            name: `${req.id} Backup Verification logs`,
            type: 'FILE',
            urlOrPath: '/evidence/backup-schedules.txt',
            contentHash: backupHash,
            owner: 'Backup Admin',
            sourceSystem: 'Veeam Backup',
            confidenceLevel: 'MEDIUM',
            reviewer: 'Security Lead',
            reviewDecision: 'ACCEPTED',
            reviewDecisionBy: 'Security Lead',
            reviewedAt: new Date(),
            notes: 'Veeam restore tests verify recovery parameters.',
          },
        });
      }
    }
  }

  // Create unresolved pending exception for HR Core
  await prisma.exception.create({
    data: {
      systemId: sys2.id,
      requirementId: 'E8-MFA-ML1-01',
      status: 'PENDING',
      riskStatement: 'Legacy database engine does not support MFA plugins, exposing raw SQL access pathways.',
      compensatingControl: 'Access locked behind static client-to-site VPN. Working on OIDC federation integration.',
      residualRisk: 'HIGH',
      approvedBy: 'Pending CISO Sign-off',
      reviewDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      expiryDate: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
      auditTrace: 'Created pending exception request on 2026-07-01.',
    },
  });

  // Create remediation tasks for HR Core Portal
  await prisma.remediationTask.create({
    data: {
      systemId: sys2.id,
      requirementId: 'E8-MFA-ML1-01',
      title: 'Deploy MFA for HR Core Portal',
      description: 'Integrate Entra ID Application Proxy with MFA constraints on the legacy IIS server.',
      status: 'BACKLOG',
      assignedTo: 'App Team',
      dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
      ticketLink: 'https://jira.internal/browse/HR-882',
    },
  });

  await prisma.remediationTask.create({
    data: {
      systemId: sys2.id,
      requirementId: 'E8-PA-ML1-01',
      title: 'Patch Critical CVE-2024-38140 print spooler',
      description: 'Nessus scan flagged print spooler vulnerability on HR-IIS-01 server. Patch immediately.',
      status: 'BACKLOG',
      assignedTo: 'SysAdmin Team',
      dueDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
      ticketLink: 'https://jira.internal/browse/HR-891',
    },
  });

  // Seed Audit Logs for HR Core Portal
  await prisma.auditLog.create({
    data: {
      userId: 'System Owner',
      action: 'CREATE',
      entityType: 'System',
      entityId: sys2.id,
      comment: 'Created HR Core Portal System scope.',
    },
  });
  await prisma.auditLog.create({
    data: {
      userId: 'Nessus Importer',
      action: 'IMPORT',
      entityType: 'ControlTest',
      entityId: 'Nessus Scan',
      comment: 'Vulnerability scan imported. Critical print spooler CVE-2024-38140 unpatched. Updated: E8-PA-ML1-01 = FAIL.',
    },
  });

  console.log('Database seeding finished successfully!');
}

main()
  .catch((e) => {
    console.error('Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
