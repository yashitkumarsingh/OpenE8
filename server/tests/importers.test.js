import { importEvidence } from '../src/controllers/importersController.js';
import { prisma } from '../src/db.js';

// Simple assertion helper
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

// Mock express response generator
function mockResponse() {
  const res = {};
  res.statusCode = 200;
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.body = data;
    return res;
  };
  return res;
}

async function runImporterTests() {
  console.log('\nRunning Importers Unit & Integration Tests...');
  let testSystemId = null;
  let testAssessmentId = null;

  try {
    // 0. Setup a test System & Assessment
    const system = await prisma.system.create({
      data: {
        name: 'Importer Test Scope',
        businessOwner: 'DevOps',
        technicalOwner: 'Eng Lead',
        environment: 'Dev',
        platform: 'Azure Workspaces',
        dataSensitivity: 'Official',
        targetMaturity: 'ML2'
      }
    });
    testSystemId = system.id;

    const assessment = await prisma.assessment.create({
      data: {
        systemId: testSystemId,
        status: 'PLANNING',
        createdBy: 'QA Importer Test'
      }
    });
    testAssessmentId = assessment.id;

    // Seed empty control tests for this assessment
    const catalogPath = '../../data/essential-eight/controls.json';
    // We can manually create required control tests records for MFA and Patching
    const reqIds = ['E8-MFA-ML1-01', 'E8-MFA-ML2-01', 'E8-PA-ML1-01', 'E8-PO-ML1-01'];
    for (const rid of reqIds) {
      await prisma.controlTest.create({
        data: {
          assessmentId: testAssessmentId,
          requirementId: rid,
          status: 'NOT_APPLICABLE',
          notes: ''
        }
      });
    }

    // 1. Test Entra MFA Parser (Enforced MFA CA policies found)
    const mockEntraJson = JSON.stringify([
      {
        displayName: 'Enforce MFA for Global Admin access',
        state: 'enabled',
        grantControls: {
          builtInControls: ['mfa']
        }
      },
      {
        displayName: 'MFA for all users policy',
        state: 'enabled',
        grantControls: {
          controls: ['multifactorauthentication']
        }
      }
    ]);
    const base64Entra = Buffer.from(mockEntraJson).toString('base64');
    
    const reqEntra = {
      params: { assessmentId: testAssessmentId },
      body: {
        fileType: 'ENTRA_MFA',
        fileData: base64Entra,
        filename: 'entra-export.json'
      }
    };
    const resEntra = mockResponse();

    await importEvidence(reqEntra, resEntra);
    assert(resEntra.statusCode === 200, 'importEvidence (Entra) should return status 200');
    assert(resEntra.body.summary.includes('E8-MFA-ML1-01 (Admin MFA) = PASS_CANDIDATE'), 'Admin MFA should be set as PASS_CANDIDATE');
    assert(resEntra.body.summary.includes('E8-MFA-ML2-01 (All Users MFA) = PASS_CANDIDATE'), 'All Users MFA should be set as PASS_CANDIDATE');

    // 2. Test Nessus CSV Parser with active vulnerabilities
    const mockNessusCsv = [
      'Plugin ID,CVE,Severity,Host,Description,Solution',
      '102143,CVE-2024-38140,Critical,win-server-01,"Critical RCE vulnerability in Windows","Apply patch KB5041580"',
      '102144,CVE-2024-21306,High,win-workstation-02,"Privilege escalation in Windows Kernel","Apply patch KB5034441"'
    ].join('\n');
    const base64Nessus = Buffer.from(mockNessusCsv).toString('base64');

    const reqNessus = {
      params: { assessmentId: testAssessmentId },
      body: {
        fileType: 'NESSUS_PATCH',
        fileData: base64Nessus,
        filename: 'scan-report.csv'
      }
    };
    const resNessus = mockResponse();

    await importEvidence(reqNessus, resNessus);
    assert(resNessus.statusCode === 200, 'importEvidence (Nessus) should return status 200');
    assert(resNessus.body.summary.includes('FAIL_CANDIDATE'), 'Compliance control results should be FAIL_CANDIDATE');
    assert(resNessus.body.summary.includes('Created 2 backlog remediation tasks'), 'Remediation tasks should be auto-created');

    // Verify task insertion
    const tasks = await prisma.remediationTask.findMany({ where: { systemId: testSystemId } });
    assert(tasks.length === 2, 'Two remediation tasks should exist in DB');
    assert(tasks.some(t => t.title.includes('CVE-2024-38140')), 'Remediation task for CVE-2024-38140 should exist');

    // 3. Test Nessus CSV Parser with clean scan results (0 vulnerabilities)
    const mockCleanCsv = 'Plugin ID,CVE,Severity,Host,Description,Solution\n';
    const base64Clean = Buffer.from(mockCleanCsv).toString('base64');

    const reqClean = {
      params: { assessmentId: testAssessmentId },
      body: {
        fileType: 'NESSUS_PATCH',
        fileData: base64Clean,
        filename: 'clean-scan.csv'
      }
    };
    const resClean = mockResponse();

    await importEvidence(reqClean, resClean);
    assert(resClean.statusCode === 200, 'importEvidence (Clean Scan) should return status 200');
    assert(resClean.body.summary.includes('PASS_CANDIDATE'), 'Compliance control results should be PASS_CANDIDATE');

    // 4. Test validation error handling
    const reqInvalid = {
      params: { assessmentId: testAssessmentId },
      body: {
        fileType: 'INVALID_TYPE',
        fileData: base64Clean
      }
    };
    const resInvalid = mockResponse();
    await importEvidence(reqInvalid, resInvalid);
    assert(resInvalid.statusCode === 400, 'Invalid fileType should return status 400');

    // 5. Test Defender Vulnerabilities Parser (Active high/critical vulnerabilities found)
    const mockDefenderJson = JSON.stringify([
      {
        cveId: 'CVE-2024-38140',
        severity: 'Critical',
        machineName: 'DESKTOP-QA-01',
        softwareName: 'MS Office 365',
        fixingKbId: 'KB5041585'
      }
    ]);
    const base64Defender = Buffer.from(mockDefenderJson).toString('base64');
    const reqDefender = {
      params: { assessmentId: testAssessmentId },
      body: {
        fileType: 'DEFENDER_VULN',
        fileData: base64Defender,
        filename: 'defender-export.json'
      }
    };
    const resDefender = mockResponse();
    await importEvidence(reqDefender, resDefender);
    assert(resDefender.statusCode === 200, 'importEvidence (Defender) should return status 200');
    assert(resDefender.body.summary.includes('FAIL_CANDIDATE') && resDefender.body.summary.includes('E8-PA-ML1-01'), 'Defender vulnerabilities should fail patch controls');

    // 6. Test AWS Config Rules Compliance Parser (Non-compliant rules mapping to MFA/RP/PA controls)
    const mockAwsConfigJson = JSON.stringify([
      {
        ConfigRuleName: 'iam-user-mfa-enabled',
        Compliance: {
          ComplianceType: 'NON_COMPLIANT'
        }
      }
    ]);
    const base64Aws = Buffer.from(mockAwsConfigJson).toString('base64');
    const reqAws = {
      params: { assessmentId: testAssessmentId },
      body: {
        fileType: 'AWS_CONFIG',
        fileData: base64Aws,
        filename: 'aws-config.json'
      }
    };
    const resAws = mockResponse();
    await importEvidence(reqAws, resAws);
    assert(resAws.statusCode === 200, 'importEvidence (AWS Config) should return status 200');
    assert(resAws.body.summary.includes('FAIL_CANDIDATE') && resAws.body.summary.includes('E8-MFA-ML1-01'), 'AWS Config non-compliant rules should trigger FAIL_CANDIDATE');

    // 7. Test Custom CSV Importer with valid column mappings
    const mockCustomCsv = [
      'Vuln_ID,Target_IP,Danger_Rank,Details,Fix',
      'CVE-2026-9999,10.0.0.5,Critical,"Custom critical exploit","Rebuild server"',
      'CVE-2026-8888,10.0.0.6,High,"Privilege escalation","Update kernel"'
    ].join('\n');
    const base64Custom = Buffer.from(mockCustomCsv).toString('base64');
    
    const reqCustom = {
      params: { assessmentId: testAssessmentId },
      body: {
        fileType: 'CUSTOM_CSV',
        fileData: base64Custom,
        filename: 'custom-scan.csv',
        mapping: {
          severity: 'Danger_Rank',
          host: 'Target_IP',
          cve: 'Vuln_ID',
          description: 'Details',
          solution: 'Fix'
        }
      }
    };
    const resCustom = mockResponse();
    await importEvidence(reqCustom, resCustom);
    assert(resCustom.statusCode === 200, 'importEvidence (Custom CSV) should return status 200');
    assert(resCustom.body.summary.includes('FAIL_CANDIDATE') && resCustom.body.summary.includes('E8-PA-ML1-01'), 'Custom CSV parser should trigger FAIL_CANDIDATE on matched patching controls');
    assert(resCustom.body.summary.includes('Created 2 backlog remediation tasks'), 'Custom CSV parser should create remediation tasks');

    // 8. Test Custom CSV Parser error when severity mapping is missing
    const reqCustomError = {
      params: { assessmentId: testAssessmentId },
      body: {
        fileType: 'CUSTOM_CSV',
        fileData: base64Custom,
        filename: 'custom-scan.csv',
        mapping: {
          host: 'Target_IP'
        }
      }
    };
    const resCustomError = mockResponse();
    await importEvidence(reqCustomError, resCustomError);
    assert(resCustomError.statusCode === 500, 'Custom CSV missing severity mapping should return status 500');

    console.log('All Importer Tests passed successfully!');
  } catch (err) {
    console.error('Importer Test Failed with error:', err);
    throw err;
  } finally {
    // Clean up created entities
    if (testSystemId) {
      try {
        await prisma.system.delete({ where: { id: testSystemId } });
      } catch (e) {
        // Ignored
      }
    }
    await prisma.$disconnect();
  }
}

// Support running directly
if (process.argv[1] && process.argv[1].endsWith('importers.test.js')) {
  runImporterTests();
}

export { runImporterTests };
