import { prisma } from '../db.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(__dirname, '../../uploads');

// Simple CSV Line Parser to handle quoted fields safely without heavy csv-parse dependency
function parseCsvContent(csvText) {
  const lines = csvText.split(/\r?\n/);
  const result = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const row = [];
    let insideQuote = false;
    let currentField = '';
    
    for (let j = 0; j < line.length; j++) {
      const char = line[j];
      
      if (char === '"') {
        insideQuote = !insideQuote;
      } else if (char === ',' && !insideQuote) {
        row.push(currentField.trim());
        currentField = '';
      } else {
        currentField += char;
      }
    }
    row.push(currentField.trim());
    result.push(row);
  }
  return result;
}

export async function importEvidence(req, res) {
  const { assessmentId } = req.params;
  const { fileType, fileData, filename } = req.body;
  
  if (!fileData || !fileType) {
    return res.status(400).json({ error: 'Missing fileData or fileType parameters' });
  }

  try {
    const assessment = await prisma.assessment.findUnique({
      where: { id: assessmentId },
      include: { system: true, testResults: true }
    });

    if (!assessment) {
      return res.status(404).json({ error: 'Assessment not found' });
    }

    // Block imports on signed-off assessments — same lockout pattern as addEvidence / updateControlTest
    if (assessment.status === 'COMPLETED') {
      return res.status(400).json({ error: 'Cannot import evidence: Assessment is signed off and locked.' });
    }

    // Decode file data
    const fileContent = Buffer.from(fileData, 'base64').toString('utf8');
    
    // Save file to uploads folder safely
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }
    const cleanFilename = path.basename(filename || 'upload.txt').replace(/[^a-zA-Z0-9.-]/g, '_');
    const savedFilename = `${Date.now()}-${cleanFilename}`;
    const savedPath = path.join(uploadsDir, savedFilename);
    fs.writeFileSync(savedPath, Buffer.from(fileData, 'base64'));
    const relativeUrl = `/uploads/${savedFilename}`;

    let summaryResult = '';

    if (fileType === 'ENTRA_MFA') {
      summaryResult = await parseEntraMfa(fileContent, assessment, relativeUrl);
    } else if (fileType === 'NESSUS_PATCH') {
      summaryResult = await parseNessusCsv(fileContent, assessment, relativeUrl);
    } else if (fileType === 'DEFENDER_VULN') {
      summaryResult = await parseDefenderVulnerabilities(fileContent, assessment, relativeUrl);
    } else if (fileType === 'AWS_CONFIG') {
      summaryResult = await parseAwsConfigCompliance(fileContent, assessment, relativeUrl);
    } else if (fileType === 'CUSTOM_CSV') {
      summaryResult = await parseCustomCsv(fileContent, assessment, relativeUrl, req.body.mapping);
    } else {
      return res.status(400).json({ error: `Unsupported fileType: ${fileType}` });
    }

    res.json({ message: 'Technical file successfully processed.', summary: summaryResult });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}

async function parseEntraMfa(jsonText, assessment, fileUrl) {
  let policies = [];
  try {
    const parsed = JSON.parse(jsonText);
    policies = Array.isArray(parsed) ? parsed : (parsed.value || [parsed]);
  } catch (err) {
    throw new Error('Failed to parse JSON configuration file: ' + err.message);
  }

  let mfaAdminPassed = false;
  let mfaAllUsersPassed = false;
  let matchingPolicies = [];

  policies.forEach(policy => {
    const name = (policy.displayName || '').toLowerCase();
    const grant = policy.grantControls || {};
    const controls = grant.builtInControls || grant.controls || [];
    
    // Check if policy requires MFA
    const requiresMfa = controls.some(ctrl => 
      ctrl.toLowerCase() === 'mfa' || 
      ctrl.toLowerCase() === 'multifactorauthentication'
    );

    if (requiresMfa && policy.state === 'enabled') {
      matchingPolicies.push(policy.displayName);
      if (name.includes('admin') || name.includes('privilege') || name.includes('global')) {
        mfaAdminPassed = true;
      }
      if (name.includes('all') || name.includes('staff') || name.includes('users') || name.includes('enforce')) {
        mfaAllUsersPassed = true;
      }
    }
  });

  // Always pass admin if all users are covered
  if (mfaAllUsersPassed) {
    mfaAdminPassed = true;
  }

  // Update assessment test results
  const testResults = assessment.testResults;
  
  if (mfaAdminPassed) {
    const testAdmin = testResults.find(t => t.requirementId === 'E8-MFA-ML1-01');
    if (testAdmin) {
      await prisma.controlTest.update({
        where: { id: testAdmin.id },
        data: {
          status: 'PASS_CANDIDATE',
          notes: `CANDIDATE FINDING: Automated policy scan detected MFA Conditional Access rule(s) that may satisfy this control. Enforcing policies found: ${matchingPolicies.join(', ')}. Reviewer confirmation required before marking as PASSED — verify exclusions, report-only mode, break-glass accounts, and legacy auth bypass are not present.`,
          reviewedBy: null,
          reviewedAt: new Date()
        }
      });
      
      // Store evidence
      await prisma.evidence.create({
        data: {
          controlTestId: testAdmin.id,
          name: 'Entra CA Policy Export',
          type: 'API_EXPORT',
          urlOrPath: fileUrl,
          owner: 'SecOps Auto Importer',
          sourceSystem: 'Microsoft Entra ID',
          confidenceLevel: 'MEDIUM',
          notes: 'CANDIDATE FINDING: Parsed conditional access rules suggesting administrative MFA. Machine-parsed only — human review required.'
        }
      });
    }
  }

  if (mfaAllUsersPassed) {
    const testAll = testResults.find(t => t.requirementId === 'E8-MFA-ML2-01');
    if (testAll) {
      await prisma.controlTest.update({
        where: { id: testAll.id },
        data: {
          status: 'PASS_CANDIDATE',
          notes: `CANDIDATE FINDING: Automated policy scan detected MFA Conditional Access rule(s) that may satisfy this control for all users. Enforcing policies found: ${matchingPolicies.join(', ')}. Reviewer confirmation required before marking as PASSED — verify exclusions, report-only mode, break-glass accounts, and legacy auth bypass are not present.`,
          reviewedBy: null,
          reviewedAt: new Date()
        }
      });

      await prisma.evidence.create({
        data: {
          controlTestId: testAll.id,
          name: 'Entra CA Policy Export',
          type: 'API_EXPORT',
          urlOrPath: fileUrl,
          owner: 'SecOps Auto Importer',
          sourceSystem: 'Microsoft Entra ID',
          confidenceLevel: 'MEDIUM',
          notes: 'CANDIDATE FINDING: Parsed conditional access rules suggesting user-wide MFA. Machine-parsed only — human review required.'
        }
      });
    }
  }

  return `Parsed ${policies.length} Entra policies. Found ${matchingPolicies.length} active MFA rules. Set candidate findings: E8-MFA-ML1-01 (Admin MFA) = ${mfaAdminPassed ? 'PASS_CANDIDATE' : 'NO CHANGE'}, E8-MFA-ML2-01 (All Users MFA) = ${mfaAllUsersPassed ? 'PASS_CANDIDATE' : 'NO CHANGE'}. Assessor review required to confirm.`;
}

async function parseNessusCsv(csvText, assessment, fileUrl) {
  const parsedData = parseCsvContent(csvText);
  if (parsedData.length < 1) {
    throw new Error('CSV file is empty.');
  }

  const headers = parsedData[0].map(h => h.toLowerCase());
  const severityIndex = headers.indexOf('severity');
  const cveIndex = headers.indexOf('cve');
  const descIndex = headers.indexOf('description') !== -1 ? headers.indexOf('description') : headers.indexOf('name');
  const hostIndex = headers.indexOf('host');
  const solutionIndex = headers.indexOf('solution');

  if (severityIndex === -1) {
    throw new Error('Invalid scan file. Column "Severity" is missing.');
  }

  const criticalIssues = [];
  
  for (let i = 1; i < parsedData.length; i++) {
    const row = parsedData[i];
    if (row.length <= severityIndex) continue;
    
    const severity = row[severityIndex].toLowerCase();
    if (severity === 'critical' || severity === 'high') {
      const cve = cveIndex !== -1 ? row[cveIndex] : 'N/A';
      const host = hostIndex !== -1 ? row[hostIndex] : 'Unknown Host';
      const desc = descIndex !== -1 ? row[descIndex] : 'Vulnerability';
      const sol = solutionIndex !== -1 ? row[solutionIndex] : 'Apply vendor security updates.';
      criticalIssues.push({ cve, host, desc, severity, sol });
    }
  }

  const testResults = assessment.testResults;
  const systemId = assessment.systemId;

  if (criticalIssues.length > 0) {
    const patchReqs = ['E8-PA-ML1-01', 'E8-PO-ML1-01'];
    const summaryNotes = `CANDIDATE FINDING: Automated scan detected ${criticalIssues.length} active high/critical vulnerabilities suggesting patch compliance failure. Discovered CVEs include: ${criticalIssues.slice(0, 5).map(c => c.cve).join(', ')}. Reviewer confirmation required before marking as FAILED — verify host scope, exploitability, and whether patches are pending deployment.`;

    for (const reqId of patchReqs) {
      const targetTest = testResults.find(t => t.requirementId === reqId);
      if (targetTest) {
        await prisma.controlTest.update({
          where: { id: targetTest.id },
          data: {
            status: 'FAIL_CANDIDATE',
            notes: summaryNotes,
            reviewedBy: null,
            reviewedAt: new Date()
          }
        });

        // Store evidence
        await prisma.evidence.create({
          data: {
            controlTestId: targetTest.id,
            name: 'Nessus Compliance Scan Export',
            type: 'SCRIPT_OUTPUT',
            urlOrPath: fileUrl,
            owner: 'System Audit Importer',
            sourceSystem: 'Nessus Scan Engine',
            confidenceLevel: 'MEDIUM',
            notes: 'CANDIDATE FINDING: Vulnerability scan output suggesting active patch gaps. Machine-parsed only — human review required.'
          }
        });
      }
    }

    // Auto-create remediation tasks for the first 3 critical CVEs
    const addedTasks = [];
    for (const issue of criticalIssues.slice(0, 3)) {
      const task = await prisma.remediationTask.create({
        data: {
          systemId,
          requirementId: 'E8-PA-ML1-01',
          title: `Remediate ${issue.cve} on ${issue.host}`,
          description: `Description: ${issue.desc}\nSolution: ${issue.sol}`,
          status: 'BACKLOG',
          assignedTo: 'DevOps / SysAdmin Team',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000) // 14 days due date
        }
      });
      addedTasks.push(task.title);
    }

    return `Parsed ${parsedData.length - 1} vulnerabilities. Found ${criticalIssues.length} high/critical vulnerabilities. Set candidate findings on E8-PA-ML1-01 & E8-PO-ML1-01 as FAIL_CANDIDATE. Created ${addedTasks.length} backlog remediation tasks. Assessor review required to confirm scope and exploitability.`;
  } else {
    // If no vulnerabilities found, set as PASS_CANDIDATE for assessor confirmation
    const patchReqs = ['E8-PA-ML1-01', 'E8-PO-ML1-01'];
    for (const reqId of patchReqs) {
      const targetTest = testResults.find(t => t.requirementId === reqId);
      if (targetTest) {
        await prisma.controlTest.update({
          where: { id: targetTest.id },
          data: {
            status: 'PASS_CANDIDATE',
            notes: 'CANDIDATE FINDING: Scan report detected 0 high/critical patch vulnerabilities in the provided output. Reviewer confirmation required before marking as PASSED — verify scan scope covers all in-scope hosts and the scan was recent.',
            reviewedBy: null,
            reviewedAt: new Date()
          }
        });

        await prisma.evidence.create({
          data: {
            controlTestId: targetTest.id,
            name: 'Nessus Compliance Scan Export',
            type: 'SCRIPT_OUTPUT',
            urlOrPath: fileUrl,
            owner: 'System Audit Importer',
            sourceSystem: 'Nessus Scan Engine',
            confidenceLevel: 'MEDIUM',
            notes: 'CANDIDATE FINDING: Vulnerability scan output showing zero active vulnerabilities. Machine-parsed only — human review required.'
          }
        });
      }
    }
    return `Parsed scan file. Detected 0 high/critical vulnerabilities. Set PASS_CANDIDATE on E8-PA-ML1-01 & E8-PO-ML1-01. Assessor review required to confirm scan completeness.`;
  }
}

async function parseDefenderVulnerabilities(jsonText, assessment, fileUrl) {
  let list = [];
  try {
    const parsed = JSON.parse(jsonText);
    list = Array.isArray(parsed) ? parsed : (parsed.value || parsed.softwareVulnerabilities || []);
  } catch (err) {
    throw new Error('Failed to parse Defender JSON file: ' + err.message);
  }

  const criticalIssues = [];
  for (const item of list) {
    const severity = (item.severity || '').toLowerCase();
    if (severity === 'critical' || severity === 'high') {
      criticalIssues.push({
        cve: item.cveId || 'Unknown CVE',
        host: item.machineName || 'Unknown Host',
        desc: item.softwareName || 'Unknown Software',
        severity,
        sol: `Apply security update/patch: ${item.fixingKbId || 'N/A'}`
      });
    }
  }

  const testResults = assessment.testResults;
  const systemId = assessment.systemId;

  if (criticalIssues.length > 0) {
    const patchReqs = ['E8-PA-ML1-01', 'E8-PO-ML1-01'];
    const summaryNotes = `CANDIDATE FINDING: Defender for Endpoint scan detected ${criticalIssues.length} high/critical vulnerabilities suggesting patch compliance failure. Vulnerabilities found: ${criticalIssues.slice(0, 5).map(c => c.cve).join(', ')}. Reviewer confirmation required before marking as FAILED.`;

    for (const reqId of patchReqs) {
      const targetTest = testResults.find(t => t.requirementId === reqId);
      if (targetTest) {
        await prisma.controlTest.update({
          where: { id: targetTest.id },
          data: {
            status: 'FAIL_CANDIDATE',
            notes: summaryNotes,
            reviewedBy: null,
            reviewedAt: new Date()
          }
        });

        await prisma.evidence.create({
          data: {
            controlTestId: targetTest.id,
            name: 'Defender Vulnerabilities Report',
            type: 'API_EXPORT',
            urlOrPath: fileUrl,
            owner: 'Defender Auto Importer',
            sourceSystem: 'Microsoft Defender for Endpoint',
            confidenceLevel: 'MEDIUM',
            notes: 'CANDIDATE FINDING: Defender vulnerability export suggesting active patch gaps. Human review required.'
          }
        });
      }
    }

    // Auto-create remediation tasks for top 3
    const addedTasks = [];
    for (const issue of criticalIssues.slice(0, 3)) {
      const task = await prisma.remediationTask.create({
        data: {
          systemId,
          requirementId: 'E8-PA-ML1-01',
          title: `Remediate ${issue.cve} on ${issue.host} (Defender)`,
          description: `Software: ${issue.desc}\nSolution: ${issue.sol}`,
          status: 'BACKLOG',
          assignedTo: 'SecOps Team',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        }
      });
      addedTasks.push(task.title);
    }

    return `Parsed ${list.length} Defender vulnerability items. Found ${criticalIssues.length} high/critical vulnerabilities. Set candidate findings: E8-PA-ML1-01 & E8-PO-ML1-01 = FAIL_CANDIDATE. Created ${addedTasks.length} backlog remediation tasks.`;
  } else {
    const patchReqs = ['E8-PA-ML1-01', 'E8-PO-ML1-01'];
    for (const reqId of patchReqs) {
      const targetTest = testResults.find(t => t.requirementId === reqId);
      if (targetTest) {
        await prisma.controlTest.update({
          where: { id: targetTest.id },
          data: {
            status: 'PASS_CANDIDATE',
            notes: 'CANDIDATE FINDING: Defender export reported 0 active high/critical patch vulnerabilities. Reviewer confirmation required to verify scan scope.',
            reviewedBy: null,
            reviewedAt: new Date()
          }
        });

        await prisma.evidence.create({
          data: {
            controlTestId: targetTest.id,
            name: 'Defender Vulnerabilities Report',
            type: 'API_EXPORT',
            urlOrPath: fileUrl,
            owner: 'Defender Auto Importer',
            sourceSystem: 'Microsoft Defender for Endpoint',
            confidenceLevel: 'MEDIUM',
            notes: 'CANDIDATE FINDING: Defender scan report showing zero active vulnerabilities.'
          }
        });
      }
    }
    return `Parsed Defender file. Detected 0 high/critical vulnerabilities. Set PASS_CANDIDATE on E8-PA-ML1-01 & E8-PO-ML1-01. Assessor review required.`;
  }
}

async function parseAwsConfigCompliance(jsonText, assessment, fileUrl) {
  let list = [];
  try {
    const parsed = JSON.parse(jsonText);
    list = Array.isArray(parsed) ? parsed : (parsed.ComplianceByConfigRules || parsed.value || []);
  } catch (err) {
    throw new Error('Failed to parse AWS Config JSON file: ' + err.message);
  }

  const nonCompliantRules = [];
  for (const item of list) {
    if ((item.Compliance?.ComplianceType || '').toUpperCase() === 'NON_COMPLIANT') {
      nonCompliantRules.push(item.ConfigRuleName || 'Unknown Rule');
    }
  }

  const testResults = assessment.testResults;
  const systemId = assessment.systemId;

  if (nonCompliantRules.length > 0) {
    const mapping = [
      { rule: 'iam-user-mfa-enabled', reqs: ['E8-MFA-ML1-01', 'E8-MFA-ML2-01'], name: 'MFA Gaps' },
      { rule: 'access-keys-rotated', reqs: ['E8-MFA-ML1-01'], name: 'Access Keys Rotation Gaps' },
      { rule: 'restricted-ssh', reqs: ['E8-PA-ML1-01'], name: 'Ingress Restriction Gaps' },
      { rule: 'restricted-common-ports', reqs: ['E8-PA-ML1-01'], name: 'Common Ports Restriction Gaps' },
      { rule: 's3-bucket-public-read-prohibited', reqs: ['E8-RP-ML1-01'], name: 'Public Bucket Access' }
    ];

    const affectedReqs = new Set();
    const matchedNonCompliant = [];

    for (const ruleName of nonCompliantRules) {
      const match = mapping.find(m => ruleName.toLowerCase().includes(m.rule));
      if (match) {
        matchedNonCompliant.push(ruleName);
        match.reqs.forEach(r => affectedReqs.add(r));
      }
    }

    if (affectedReqs.size > 0) {
      for (const reqId of affectedReqs) {
        const targetTest = testResults.find(t => t.requirementId === reqId);
        if (targetTest) {
          await prisma.controlTest.update({
            where: { id: targetTest.id },
            data: {
              status: 'FAIL_CANDIDATE',
              notes: `CANDIDATE FINDING: AWS Config rules compliance check failed. Non-compliant AWS Config rule(s) detected: ${matchedNonCompliant.join(', ')}. Reviewer confirmation required before marking as FAILED.`,
              reviewedBy: null,
              reviewedAt: new Date()
            }
          });

          await prisma.evidence.create({
            data: {
              controlTestId: targetTest.id,
              name: 'AWS Config Rule Evaluation Report',
              type: 'API_EXPORT',
              urlOrPath: fileUrl,
              owner: 'AWS Config Auto Importer',
              sourceSystem: 'AWS Config',
              confidenceLevel: 'MEDIUM',
              notes: `CANDIDATE FINDING: AWS Config compliance state suggesting non-compliance for rule matching ${reqId}.`
            }
          });
        }
      }

      // Create a remediation task for matched rules
      for (const rule of matchedNonCompliant.slice(0, 3)) {
        await prisma.remediationTask.create({
          data: {
            systemId,
            requirementId: 'E8-PA-ML1-01',
            title: `Remediate non-compliant AWS Config rule: ${rule}`,
            description: `AWS Config rule ${rule} was evaluated as NON_COMPLIANT. Rectify AWS configuration to align with target guidelines.`,
            status: 'BACKLOG',
            assignedTo: 'Cloud Engineering Team',
            dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
          }
        });
      }

      return `Parsed AWS Config state. Found ${nonCompliantRules.length} non-compliant rule(s). Mapped ${matchedNonCompliant.length} E8 target matches. Set FAIL_CANDIDATE on matched requirements: ${Array.from(affectedReqs).join(', ')}.`;
    }
  }

  // Fallback / all compliant case
  const defaultPassReqs = ['E8-MFA-ML1-01', 'E8-PA-ML1-01', 'E8-RP-ML1-01'];
  for (const reqId of defaultPassReqs) {
    const targetTest = testResults.find(t => t.requirementId === reqId);
    if (targetTest) {
      await prisma.controlTest.update({
        where: { id: targetTest.id },
        data: {
          status: 'PASS_CANDIDATE',
          notes: 'CANDIDATE FINDING: AWS Config export evaluated key rules as COMPLIANT. Reviewer confirmation required to verify rules are correctly defined.',
          reviewedBy: null,
          reviewedAt: new Date()
        }
      });

      await prisma.evidence.create({
        data: {
          controlTestId: targetTest.id,
          name: 'AWS Config Rule Evaluation Report',
          type: 'API_EXPORT',
          urlOrPath: fileUrl,
          owner: 'AWS Config Auto Importer',
          sourceSystem: 'AWS Config',
          confidenceLevel: 'MEDIUM',
          notes: 'CANDIDATE FINDING: AWS Config compliance output evaluated key rules as compliant.'
        }
      });
    }
  }

  return `Parsed AWS Config rules. No non-compliant target rules found. Set PASS_CANDIDATE on E8-MFA-ML1-01, E8-PA-ML1-01, & E8-RP-ML1-01.`;
}

async function parseCustomCsv(csvText, assessment, fileUrl, mapping) {
  if (!mapping || !mapping.severity) {
    throw new Error('Missing severity column mapping configuration.');
  }

  const parsedData = parseCsvContent(csvText);
  if (parsedData.length < 1) {
    throw new Error('CSV file is empty.');
  }

  const headers = parsedData[0].map(h => h.trim().toLowerCase());
  
  const severityIndex = headers.indexOf(mapping.severity.toLowerCase());
  if (severityIndex === -1) {
    throw new Error(`Severity column "${mapping.severity}" not found in CSV.`);
  }

  const cveIndex = mapping.cve ? headers.indexOf(mapping.cve.toLowerCase()) : -1;
  const descIndex = mapping.description ? headers.indexOf(mapping.description.toLowerCase()) : -1;
  const hostIndex = mapping.host ? headers.indexOf(mapping.host.toLowerCase()) : -1;
  const solutionIndex = mapping.solution ? headers.indexOf(mapping.solution.toLowerCase()) : -1;

  const criticalIssues = [];

  const isCriticalOrHigh = (val) => {
    if (!val) return false;
    const v = val.toLowerCase().trim();
    return v.includes('critical') || 
           v.includes('high') || 
           v === '4' || 
           v === '5' || 
           (!isNaN(v) && parseFloat(v) >= 7.0);
  };

  for (let i = 1; i < parsedData.length; i++) {
    const row = parsedData[i];
    if (row.length <= severityIndex) continue;

    const severityValue = row[severityIndex];
    if (isCriticalOrHigh(severityValue)) {
      const cve = cveIndex !== -1 && row[cveIndex] ? row[cveIndex] : 'N/A';
      const host = hostIndex !== -1 && row[hostIndex] ? row[hostIndex] : 'Unknown Host';
      const desc = descIndex !== -1 && row[descIndex] ? row[descIndex] : 'Vulnerability';
      const sol = solutionIndex !== -1 && row[solutionIndex] ? row[solutionIndex] : 'Apply vendor security updates.';
      criticalIssues.push({ cve, host, desc, severity: severityValue, sol });
    }
  }

  const testResults = assessment.testResults;
  const systemId = assessment.systemId;

  if (criticalIssues.length > 0) {
    const patchReqs = ['E8-PA-ML1-01', 'E8-PO-ML1-01'];
    const summaryNotes = `CANDIDATE FINDING: Custom CSV scan detected ${criticalIssues.length} high/critical vulnerabilities suggesting patch compliance failure. CVEs: ${criticalIssues.slice(0, 5).map(c => c.cve).join(', ')}. Reviewer confirmation required before marking as FAILED.`;

    for (const reqId of patchReqs) {
      const targetTest = testResults.find(t => t.requirementId === reqId);
      if (targetTest) {
        await prisma.controlTest.update({
          where: { id: targetTest.id },
          data: {
            status: 'FAIL_CANDIDATE',
            notes: summaryNotes,
            reviewedBy: null,
            reviewedAt: new Date()
          }
        });

        await prisma.evidence.create({
          data: {
            controlTestId: targetTest.id,
            name: 'Custom CSV Scan Export',
            type: 'SCRIPT_OUTPUT',
            urlOrPath: fileUrl,
            owner: 'System Audit Importer',
            sourceSystem: 'Custom Scan Engine',
            confidenceLevel: 'MEDIUM',
            notes: 'CANDIDATE FINDING: Custom scan output suggesting active patch gaps. Human review required.'
          }
        });
      }
    }

    // Auto-create remediation tasks for top 3
    const addedTasks = [];
    for (const issue of criticalIssues.slice(0, 3)) {
      const task = await prisma.remediationTask.create({
        data: {
          systemId,
          requirementId: 'E8-PA-ML1-01',
          title: `Remediate ${issue.cve} on ${issue.host} (Custom)`,
          description: `Description: ${issue.desc}\nSolution: ${issue.sol}`,
          status: 'BACKLOG',
          assignedTo: 'SecOps Team',
          dueDate: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000)
        }
      });
      addedTasks.push(task.title);
    }

    return `Parsed ${parsedData.length - 1} custom vulnerabilities. Found ${criticalIssues.length} high/critical vulnerabilities. Set candidate findings: E8-PA-ML1-01 & E8-PO-ML1-01 = FAIL_CANDIDATE. Created ${addedTasks.length} backlog remediation tasks.`;
  } else {
    const patchReqs = ['E8-PA-ML1-01', 'E8-PO-ML1-01'];
    for (const reqId of patchReqs) {
      const targetTest = testResults.find(t => t.requirementId === reqId);
      if (targetTest) {
        await prisma.controlTest.update({
          where: { id: targetTest.id },
          data: {
            status: 'PASS_CANDIDATE',
            notes: 'CANDIDATE FINDING: Custom CSV scan detected 0 high/critical vulnerabilities. Reviewer confirmation required to verify scan scope and date.',
            reviewedBy: null,
            reviewedAt: new Date()
          }
        });

        await prisma.evidence.create({
          data: {
            controlTestId: targetTest.id,
            name: 'Custom CSV Scan Export',
            type: 'SCRIPT_OUTPUT',
            urlOrPath: fileUrl,
            owner: 'System Audit Importer',
            sourceSystem: 'Custom Scan Engine',
            confidenceLevel: 'MEDIUM',
            notes: 'CANDIDATE FINDING: Custom scan output showing zero vulnerabilities.'
          }
        });
      }
    }
    return `Parsed custom scan file. Detected 0 high/critical vulnerabilities. Set PASS_CANDIDATE on E8-PA-ML1-01 & E8-PO-ML1-01.`;
  }
}

