import { getSystems, createSystem, getSystemById, updateSystem, getSystemReport, deleteSystem, exportAuditLogs } from '../src/controllers/systemsController.js';
import { createAssessment, updateAssessment, signOffAssessment } from '../src/controllers/assessmentsController.js';
import { updateControlTest, addEvidence, deleteEvidence, verifyEvidenceIntegrity, downloadEvidence } from '../src/controllers/controlTestsController.js';
import { getExceptions, createException, updateException, deleteException } from '../src/controllers/exceptionsController.js';
import { getRemediations, createRemediation, updateRemediation, deleteRemediation } from '../src/controllers/remediationsController.js';
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
  res.headers = {};
  res.status = (code) => {
    res.statusCode = code;
    return res;
  };
  res.json = (data) => {
    res.body = data;
    return res;
  };
  res.setHeader = (name, value) => {
    res.headers[name] = value;
    return res;
  };
  res.send = (data) => {
    res.body = data;
    return res;
  };
  return res;
}

async function runControllerTests() {
  console.log('\nRunning Controller Integration Tests...');
  let testSystemId = null;
  let testAssessmentId = null;
  let testControlTestId = null;
  let testEvidenceId = null;
  let testExceptionId = null;
  let testRemediationId = null;

  try {
    // 1. Test getSystems
    const resGetSystems = mockResponse();
    await getSystems({}, resGetSystems);
    assert(Array.isArray(resGetSystems.body), 'getSystems should return an array');

    // 2. Test createSystem
    const resCreateSystem = mockResponse();
    const mockSystemBody = {
      name: 'Integration Test System',
      businessOwner: 'QA Team',
      technicalOwner: 'Test Ops',
      environment: 'Test',
      platform: 'Jest Mock Platform',
      dataSensitivity: 'Official',
      targetMaturity: 'ML2',
      outOfScopeItems: 'None',
      scopeJustification: 'None'
    };
    await createSystem({ body: mockSystemBody }, resCreateSystem);
    assert(resCreateSystem.statusCode === 201, 'createSystem should return status 201');
    assert(resCreateSystem.body.name === 'Integration Test System', 'System name should match input');
    testSystemId = resCreateSystem.body.id;

    // 3. Test getSystemById
    const resGetSystemById = mockResponse();
    await getSystemById({ params: { id: testSystemId } }, resGetSystemById);
    assert(resGetSystemById.statusCode === 200, 'getSystemById should return status 200');
    assert(resGetSystemById.body.name === 'Integration Test System', 'System name in detail should match');
    assert(resGetSystemById.body.assessments.length > 0, 'System creation should trigger initial assessment');
    testAssessmentId = resGetSystemById.body.assessments[0].id;
    testControlTestId = resGetSystemById.body.assessments[0].testResults[0].id;

    // 4. Test updateSystem
    const resUpdateSystem = mockResponse();
    await updateSystem({ params: { id: testSystemId }, body: { targetMaturity: 'ML3' } }, resUpdateSystem);
    assert(resUpdateSystem.statusCode === 200, 'updateSystem should return status 200');
    assert(resUpdateSystem.body.targetMaturity === 'ML3', 'System target maturity should be updated');

    // 5. Test createAssessment
    const resCreateAssessment = mockResponse();
    await createAssessment({ params: { systemId: testSystemId }, body: { createdBy: 'QA Auditor' } }, resCreateAssessment);
    assert(resCreateAssessment.statusCode === 201, 'createAssessment should return status 201');
    assert(resCreateAssessment.body.createdBy === 'QA Auditor', 'createdBy should match input');
    const newAssessmentId = resCreateAssessment.body.id;

    // 6. Test updateAssessment
    const resUpdateAssessment = mockResponse();
    await updateAssessment({ params: { id: newAssessmentId }, body: { status: 'REVIEWING_CONTROLS' } }, resUpdateAssessment);
    assert(resUpdateAssessment.statusCode === 200, 'updateAssessment should return status 200');
    assert(resUpdateAssessment.body.status === 'REVIEWING_CONTROLS', 'Assessment status should be updated');

    // Clean up secondary assessment
    await prisma.assessment.delete({ where: { id: newAssessmentId } });

    // 7. Test updateControlTest
    const resUpdateControlTest = mockResponse();
    await updateControlTest(
      { params: { id: testControlTestId }, body: { status: 'EFFECTIVE', notes: 'Verification test notes', reviewedBy: 'Tester' } },
      resUpdateControlTest
    );
    assert(resUpdateControlTest.statusCode === 200, 'updateControlTest should return status 200');
    assert(resUpdateControlTest.body.status === 'EFFECTIVE', 'Control status should be updated to EFFECTIVE');

    // 8. Test addEvidence
    const resAddEvidence = mockResponse();
    const mockEvidenceBody = {
      name: 'Test Policy PDF',
      type: 'FILE',
      owner: 'SecOps',
      sourceSystem: 'Local Store',
      confidenceLevel: 'HIGH',
      notes: 'Test configuration documentation',
      fileData: {
        base64: 'SGVsbG8gV29ybGQgLSBPcGVuRTggVGVzdCBGaWxl',
        filename: 'test-policy.txt'
      }
    };
    await addEvidence({ params: { testId: testControlTestId }, body: mockEvidenceBody }, resAddEvidence);
    assert(resAddEvidence.statusCode === 201, 'addEvidence should return status 201');
    assert(resAddEvidence.body.contentHash !== null, 'addEvidence should compute contentHash');
    assert(resAddEvidence.body.contentHash.length === 64, 'contentHash should be a SHA-256 hex string');
    testEvidenceId = resAddEvidence.body.id;

    // 8b. Test verifyEvidenceIntegrity
    const resVerifyEvidenceSuccess = mockResponse();
    await verifyEvidenceIntegrity({ params: { id: testEvidenceId } }, resVerifyEvidenceSuccess);
    assert(resVerifyEvidenceSuccess.statusCode === 200, 'verifyEvidenceIntegrity should return 200');
    assert(resVerifyEvidenceSuccess.body.verified === true, 'Evidence should pass integrity checks when unmodified');

    // 8c. Test downloadEvidence (Successful path)
    const resDownloadSuccess = mockResponse();
    resDownloadSuccess.sendFile = (filePath) => {
      resDownloadSuccess.sendFileCalledWith = filePath;
      return resDownloadSuccess;
    };
    await downloadEvidence({ params: { id: testEvidenceId } }, resDownloadSuccess);
    assert(resDownloadSuccess.headers['Content-Disposition'].includes('attachment'), 'downloadEvidence should set content disposition attachment header');
    assert(resDownloadSuccess.sendFileCalledWith !== undefined, 'downloadEvidence should invoke sendFile to stream back resources');

    // 8d. Test downloadEvidence (Missing ID)
    const resDownloadMissing = mockResponse();
    await downloadEvidence({ params: { id: 'invalid-evidence-uuid' } }, resDownloadMissing);
    assert(resDownloadMissing.statusCode === 404, 'downloadEvidence for missing resource returns status 404');

    // 8e. Test addEvidence file extension whitelist rejection
    const resAddEvidenceBadExt = mockResponse();
    const mockEvidenceBadExt = {
      name: 'Malicious Script',
      type: 'FILE',
      fileData: {
        base64: 'SGVsbG8gV29ybGQ=',
        filename: 'script.exe'
      }
    };
    await addEvidence({ params: { testId: testControlTestId }, body: mockEvidenceBadExt }, resAddEvidenceBadExt);
    assert(resAddEvidenceBadExt.statusCode === 400, 'addEvidence with unsupported file extension script.exe returns status 400');
    assert(resAddEvidenceBadExt.body.error.includes('Unsupported file extension'), 'unsupported file extension error message matched');

    // 8f. Test addEvidence file size boundary limit
    const resAddEvidenceTooLarge = mockResponse();
    const mockEvidenceTooLarge = {
      name: 'Gigantic Backup',
      type: 'FILE',
      fileData: {
        base64: Buffer.alloc(11 * 1024 * 1024).toString('base64'),
        filename: 'huge-backup.txt'
      }
    };
    await addEvidence({ params: { testId: testControlTestId }, body: mockEvidenceTooLarge }, resAddEvidenceTooLarge);
    assert(resAddEvidenceTooLarge.statusCode === 400, 'addEvidence with file exceeding 10MB limit returns status 400');
    assert(resAddEvidenceTooLarge.body.error.includes('exceeds maximum permitted limit'), 'file size limit error message matched');

    // Simulate file tampering by modifying the file contents on disk
    const storedEvidence = resAddEvidence.body;
    const testPath = (await import('path')).default;
    const testFs = (await import('fs')).default;
    const { fileURLToPath } = await import('url');
    const testDirname = testPath.dirname(fileURLToPath(import.meta.url));
    const testFilePath = testPath.join(testDirname, '..', storedEvidence.urlOrPath);
    
    testFs.writeFileSync(testFilePath, 'TAMPERED DATA STRING');

    const resVerifyEvidenceTampered = mockResponse();
    await verifyEvidenceIntegrity({ params: { id: testEvidenceId } }, resVerifyEvidenceTampered);
    assert(resVerifyEvidenceTampered.statusCode === 200, 'verifyEvidenceIntegrity should return 200');
    assert(resVerifyEvidenceTampered.body.verified === false, 'Evidence should fail integrity verification when tampered');
    assert(resVerifyEvidenceTampered.body.error.includes('INTEGRITY BREACH'), 'Tampered response should contain breach message');

    // 9. Test createException
    const resCreateException = mockResponse();
    const mockExceptionBody = {
      requirementId: 'E8-AC-ML2-01',
      status: 'APPROVED',
      riskStatement: 'Operational limitation testing',
      compensatingControl: 'Additional firewall rules',
      residualRisk: 'LOW',
      approvedBy: 'CISO Office',
      reviewDate: new Date(),
      expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5)
    };
    await createException({ params: { systemId: testSystemId }, body: mockExceptionBody }, resCreateException);
    assert(resCreateException.statusCode === 201, 'createException should return status 201');
    testExceptionId = resCreateException.body.id;

    // 10. Test getExceptions
    const resGetExceptions = mockResponse();
    await getExceptions({ params: { systemId: testSystemId } }, resGetExceptions);
    assert(resGetExceptions.statusCode === 200, 'getExceptions should return status 200');
    assert(resGetExceptions.body.length > 0, 'Exceptions list should not be empty');

    // 11. Test updateException
    const resUpdateException = mockResponse();
    await updateException(
      { 
        params: { id: testExceptionId }, 
        body: { 
          residualRisk: 'MEDIUM', 
          auditComment: 'Risk review conducted',
          reviewDate: new Date(),
          expiryDate: new Date(),
          affectedUserCount: 10,
          riskAcceptedBy: 'Assessor User'
        } 
      },
      resUpdateException
    );
    assert(resUpdateException.statusCode === 200, 'updateException should return status 200');
    assert(resUpdateException.body.residualRisk === 'MEDIUM', 'Exception residual risk should be updated');

    // 12. Test createRemediation
    const resCreateRemediation = mockResponse();
    const mockRemediationBody = {
      requirementId: 'E8-AC-ML2-01',
      title: 'Deploy test ruleset',
      description: 'Implement test definitions',
      status: 'IN_PROGRESS',
      assignedTo: 'Test Engineer',
      dueDate: new Date(),
      ticketLink: 'https://jira.test'
    };
    await createRemediation({ params: { systemId: testSystemId }, body: mockRemediationBody }, resCreateRemediation);
    assert(resCreateRemediation.statusCode === 201, 'createRemediation should return status 201');
    testRemediationId = resCreateRemediation.body.id;

    // 13. Test getRemediations
    const resGetRemediations = mockResponse();
    await getRemediations({ params: { systemId: testSystemId } }, resGetRemediations);
    assert(resGetRemediations.statusCode === 200, 'getRemediations should return status 200');
    assert(resGetRemediations.body.length > 0, 'Remediations list should not be empty');

    // 14. Test updateRemediation
    const resUpdateRemediation = mockResponse();
    await updateRemediation(
      { params: { id: testRemediationId }, body: { status: 'DONE', assignedTo: 'Auditor Team' } },
      resUpdateRemediation
    );
    assert(resUpdateRemediation.statusCode === 200, 'updateRemediation should return status 200');
    assert(resUpdateRemediation.body.status === 'DONE', 'Remediation status should be updated to DONE');

    // 15. Test getSystemReport
    const resGetReport = mockResponse();
    await getSystemReport({ params: { id: testSystemId } }, resGetReport);
    assert(resGetReport.statusCode === 200, 'getSystemReport should return status 200');
    assert(typeof resGetReport.body.markdown === 'string', 'Report should contain markdown string');
    assert(resGetReport.body.systemName === 'Integration Test System', 'Report system name should match');

    // 15b. Test exportAuditLogs
    const resExportAudit = mockResponse();
    await exportAuditLogs({ params: { id: testSystemId } }, resExportAudit);
    assert(resExportAudit.statusCode === 200, 'exportAuditLogs should return status 200');
    assert(resExportAudit.headers['Content-Type'] === 'text/csv', 'Response content type should be text/csv');
    assert(resExportAudit.body.includes('Timestamp,Operator,Action,Component,Resource ID,Details,Old Value,New Value'), 'Response body should contain CSV headers');
    assert(resExportAudit.body.includes('Integration Test System'), 'CSV should contain logged details matching the system name');

    // === EXTRA COVERAGE BOOSTER FOR SYSTEM, ASSESSMENT & CONTROLTESTS CONTROLLERS ===

    // 22. ControlTests Controller Boosters
    // Test updateControlTest Not Found 404
    const resUpdateCtrlNotFound = mockResponse();
    await updateControlTest({ params: { id: 'invalid-id-uuid' }, body: {} }, resUpdateCtrlNotFound);
    assert(resUpdateCtrlNotFound.statusCode === 404, 'updateControlTest for missing test should return status 404');

    // Test addEvidence Not Found 404
    const resAddEvidenceNotFound = mockResponse();
    await addEvidence({ params: { testId: 'invalid-id-uuid' }, body: {} }, resAddEvidenceNotFound);
    assert(resAddEvidenceNotFound.statusCode === 404, 'addEvidence for missing test should return status 404');

    // Test addEvidence with missing fileData fallback
    const resAddEvidenceNoFile = mockResponse();
    await addEvidence(
      { 
        params: { testId: testControlTestId }, 
        body: { name: 'Booster Text Evidence', type: 'TEXT', owner: 'QA', confidenceLevel: 'MEDIUM', sourceSystem: 'Local System' } 
      }, 
      resAddEvidenceNoFile
    );
    assert(resAddEvidenceNoFile.statusCode === 201, 'addEvidence without file data should return status 201');
    const boosterEvidenceId = resAddEvidenceNoFile.body.id;

    // Test deleteEvidence Not Found 404
    const resDeleteEvidenceNotFound = mockResponse();
    await deleteEvidence({ params: { id: 'invalid-id-uuid' } }, resDeleteEvidenceNotFound);
    assert(resDeleteEvidenceNotFound.statusCode === 404, 'deleteEvidence for missing resource should return status 404');

    // Test verifyEvidenceIntegrity - Evidence Not Found 404
    const resVerifyNotFound = mockResponse();
    await verifyEvidenceIntegrity({ params: { id: 'invalid-id-uuid' } }, resVerifyNotFound);
    assert(resVerifyNotFound.statusCode === 404, 'verifyEvidenceIntegrity should return 404 for non-existent evidence');

    // Test verifyEvidenceIntegrity - Missing File Path
    const resVerifyNoPath = mockResponse();
    await verifyEvidenceIntegrity({ params: { id: boosterEvidenceId } }, resVerifyNoPath);
    assert(resVerifyNoPath.statusCode === 400, 'verifyEvidenceIntegrity should return 400 when no urlOrPath is configured');

    // Test verifyEvidenceIntegrity - Missing baseline hash
    await prisma.evidence.update({
      where: { id: boosterEvidenceId },
      data: { urlOrPath: '/uploads/missing-file.txt' }
    });
    const resVerifyNoHash = mockResponse();
    await verifyEvidenceIntegrity({ params: { id: boosterEvidenceId } }, resVerifyNoHash);
    assert(resVerifyNoHash.statusCode === 400, 'verifyEvidenceIntegrity should return 400 when contentHash is missing');

    // Clean up booster evidence
    await prisma.evidence.delete({ where: { id: boosterEvidenceId } });

    // 23. Systems Controller Boosters
    // Test getSystemById Not Found 404
    const resGetSysNotFound = mockResponse();
    await getSystemById({ params: { id: 'invalid-id-uuid' } }, resGetSysNotFound);
    assert(resGetSysNotFound.statusCode === 404, 'getSystemById for missing system should return status 404');

    // Test updateSystem Not Found 404
    const resUpdateSysNotFound = mockResponse();
    await updateSystem({ params: { id: 'invalid-id-uuid' }, body: {} }, resUpdateSysNotFound);
    assert(resUpdateSysNotFound.statusCode === 404, 'updateSystem for missing system should return status 404');

    // Test deleteSystem Not Found 404
    const resDeleteSysNotFound = mockResponse();
    await deleteSystem({ params: { id: 'invalid-id-uuid' } }, resDeleteSysNotFound);
    assert(resDeleteSysNotFound.statusCode === 404, 'deleteSystem for missing system should return status 404');

    // Test getSystemReport Not Found 404
    const resReportNotFound = mockResponse();
    await getSystemReport({ params: { id: 'invalid-id-uuid' } }, resReportNotFound);
    assert(resReportNotFound.statusCode === 404, 'getSystemReport for missing system should return status 404');

    // Test exportAuditLogs Not Found 404
    const resExportNotFound = mockResponse();
    await exportAuditLogs({ params: { id: 'invalid-id-uuid' } }, resExportNotFound);
    assert(resExportNotFound.statusCode === 404, 'exportAuditLogs for missing system should return status 404');

    // 24. Assessments Controller Boosters
    // Test updateAssessment Not Found 404
    const resUpdateAsmNotFound = mockResponse();
    await updateAssessment({ params: { id: 'invalid-id-uuid' }, body: {} }, resUpdateAsmNotFound);
    assert(resUpdateAsmNotFound.statusCode === 404, 'updateAssessment for missing ID should return status 404');

    // Test signOffAssessment Not Found 404
    const resSignOffNotFound = mockResponse();
    await signOffAssessment({ params: { id: 'invalid-id-uuid' }, body: { role: 'ASSESSOR', signature: 'Sign' } }, resSignOffNotFound);
    assert(resSignOffNotFound.statusCode === 404, 'signOffAssessment for missing ID should return status 404');

    // Test signOffAssessment - Missing parameters
    const resSignOffMissing = mockResponse();
    await signOffAssessment({ params: { id: testAssessmentId }, body: {} }, resSignOffMissing);
    assert(resSignOffMissing.statusCode === 400, 'signOffAssessment should return 400 on missing arguments');

    // Additional Assessments Controller boosters
    // Test signOffAssessment - invalid role SYSTEM_OWNER signature attempt
    const resSignOwnerFail = mockResponse();
    await signOffAssessment(
      { params: { id: testAssessmentId }, body: { role: 'SYSTEM_OWNER', signature: 'Owner Sig' }, user: { role: 'AUDITOR', name: 'Auditor User' } },
      resSignOwnerFail
    );
    assert(resSignOwnerFail.statusCode === 403, 'signOffAssessment with invalid owner role should return 403');

    // Test updateAssessment Catch Block
    const resUpdateAsmErr = mockResponse();
    await updateAssessment({ params: null, body: null }, resUpdateAsmErr);
    assert(resUpdateAsmErr.statusCode === 400, 'updateAssessment catch block should return 400');

    // Test signOffAssessment Catch Block
    const resSignOffErr = mockResponse();
    await signOffAssessment({ params: null, body: { role: 'ASSESSOR', signature: 'Sig' } }, resSignOffErr);
    assert(resSignOffErr.statusCode === 500, 'signOffAssessment catch block should return 500');

    // Additional ControlTests Controller boosters
    // Test updateControlTest Catch Block
    const resUpdateCtrlErr = mockResponse();
    await updateControlTest({ params: null, body: null }, resUpdateCtrlErr);
    assert(resUpdateCtrlErr.statusCode === 400, 'updateControlTest catch block should return 400');

    // Test addEvidence Catch Block
    const resAddEvidenceErr = mockResponse();
    await addEvidence({ params: null, body: null }, resAddEvidenceErr);
    assert(resAddEvidenceErr.statusCode === 500, 'addEvidence catch block should return 500');

    // Test deleteEvidence Catch Block
    const resDeleteEvidenceErr = mockResponse();
    await deleteEvidence({ params: null }, resDeleteEvidenceErr);
    assert(resDeleteEvidenceErr.statusCode === 500, 'deleteEvidence catch block should return 500');

    // Test verifyEvidenceIntegrity Catch Block
    const resVerifyIntegrityErr = mockResponse();
    await verifyEvidenceIntegrity({ params: null }, resVerifyIntegrityErr);
    assert(resVerifyIntegrityErr.statusCode === 500, 'verifyEvidenceIntegrity catch block should return 500');

    // Create a fallback remediation task for report parsing fallback paths
    const resCreateRemFallbackReport = mockResponse();
    await createRemediation(
      {
        params: { systemId: testSystemId },
        body: {
          requirementId: 'E8-AC-ML2-01',
          title: 'Report fallback task title',
          description: 'Omitted assignedTo, dueDate, ticketLink'
        }
      },
      resCreateRemFallbackReport
    );
    assert(resCreateRemFallbackReport.statusCode === 201, 'createRemediation fallback for report should return status 201');
    const boosterRemReportId = resCreateRemFallbackReport.body.id;

    // Trigger report generation to cover openRem fallbacks
    const resGetReportFallback = mockResponse();
    await getSystemReport({ params: { id: testSystemId } }, resGetReportFallback);
    assert(resGetReportFallback.statusCode === 200, 'getSystemReport after creating fallback remediation should return status 200');

    // Clean up fallback remediation
    await prisma.remediationTask.delete({ where: { id: boosterRemReportId } });

    // Additional Systems Controller boosters
    const resGetSysErr = mockResponse();
    await getSystemById({ params: null }, resGetSysErr);
    assert(resGetSysErr.statusCode === 500, 'getSystemById catch block should return 500');

    const resUpdateSysErr = mockResponse();
    await updateSystem({ params: null, body: null }, resUpdateSysErr);
    assert(resUpdateSysErr.statusCode === 400, 'updateSystem catch block should return 400');

    const resDeleteSysErr = mockResponse();
    await deleteSystem({ params: null }, resDeleteSysErr);
    assert(resDeleteSysErr.statusCode === 500, 'deleteSystem catch block should return 500');

    const resReportSysErr = mockResponse();
    await getSystemReport({ params: null }, resReportSysErr);
    assert(resReportSysErr.statusCode === 500, 'getSystemReport catch block should return 500');

    const resExportSysErr = mockResponse();
    await exportAuditLogs({ params: null }, resExportSysErr);
    assert(resExportSysErr.statusCode === 500, 'exportAuditLogs catch block should return 500');

    // 15c. Test signOffAssessment & lock-outs
    // Non-assessor signing as ASSESSOR should fail
    const resSignAssessorFail = mockResponse();
    await signOffAssessment(
      { params: { id: testAssessmentId }, body: { role: 'ASSESSOR', signature: 'Assessor Signature' }, user: { role: 'AUDITOR', name: 'Auditor User' } },
      resSignAssessorFail
    );
    assert(resSignAssessorFail.statusCode === 403, 'signOffAssessment with invalid role should return 403');

    // Assessor signing off should succeed
    const resSignAssessorSuccess = mockResponse();
    await signOffAssessment(
      { params: { id: testAssessmentId }, body: { role: 'ASSESSOR', signature: 'Lead Assessor Signature' }, user: { role: 'ASSESSOR', name: 'Assessor User' } },
      resSignAssessorSuccess
    );
    assert(resSignAssessorSuccess.statusCode === 200, 'signOffAssessment as ASSESSOR should return 200');
    assert(resSignAssessorSuccess.body.assessorSignature === 'Lead Assessor Signature', 'Assessor signature should match');

    // Owner signing off should succeed and complete the assessment
    const resSignOwnerSuccess = mockResponse();
    await signOffAssessment(
      { params: { id: testAssessmentId }, body: { role: 'SYSTEM_OWNER', signature: 'RMS Owner Signature' }, user: { role: 'SYSTEM_OWNER', name: 'Owner User' } },
      resSignOwnerSuccess
    );
    assert(resSignOwnerSuccess.statusCode === 200, 'signOffAssessment as SYSTEM_OWNER should return 200');
    assert(resSignOwnerSuccess.body.ownerSignature === 'RMS Owner Signature', 'Owner signature should match');
    assert(resSignOwnerSuccess.body.status === 'COMPLETED', 'Assessment status should transition to COMPLETED when both roles have signed off');

    // Trying to update control test on COMPLETED assessment should fail (lockout check)
    const resLockUpdateTest = mockResponse();
    await updateControlTest(
      { params: { id: testControlTestId }, body: { status: 'INEFFECTIVE', notes: 'Altering completed details', reviewedBy: 'Hacker' } },
      resLockUpdateTest
    );
    assert(resLockUpdateTest.statusCode === 400, 'updateControlTest on signed-off assessment should return 400 Bad Request');
    assert(resLockUpdateTest.body.error.includes('signed off and locked'), 'Lockout message should denote locked status');

    // Trying to upload evidence on COMPLETED assessment should fail
    const resLockAddEvidence = mockResponse();
    await addEvidence(
      { params: { testId: testControlTestId }, body: { name: 'Late Evidence', type: 'FILE' } },
      resLockAddEvidence
    );
    assert(resLockAddEvidence.statusCode === 400, 'addEvidence on signed-off assessment should return 400 Bad Request');

    // Trying to delete evidence on COMPLETED assessment should fail
    const resLockDeleteEvidence = mockResponse();
    await deleteEvidence(
      { params: { id: testEvidenceId } },
      resLockDeleteEvidence
    );
    assert(resLockDeleteEvidence.statusCode === 400, 'deleteEvidence on signed-off assessment should return 400 Bad Request');

    // Re-unlock assessment so that teardown deleteEvidence and deleteSystem can proceed cleanly
    await prisma.assessment.update({
      where: { id: testAssessmentId },
      data: { status: 'PLANNING', assessorSignature: null, ownerSignature: null }
    });

    // 16. Test deleteEvidence
    const resDeleteEvidence = mockResponse();
    await deleteEvidence({ params: { id: testEvidenceId } }, resDeleteEvidence);
    assert(resDeleteEvidence.statusCode === 200, 'deleteEvidence should return status 200');

    // 17. Test deleteException
    const resDeleteException = mockResponse();
    await deleteException({ params: { id: testExceptionId } }, resDeleteException);
    assert(resDeleteException.statusCode === 200, 'deleteException should return status 200');

    // 18. Test deleteRemediation
    const resDeleteRemediation = mockResponse();
    await deleteRemediation({ params: { id: testRemediationId } }, resDeleteRemediation);
    assert(resDeleteRemediation.statusCode === 200, 'deleteRemediation should return status 200');
    // === EXTRA COVERAGE BOOSTER FOR STATEMENT AND BRANCH PATHWAYS ===

    // 20. Exceptions Controller Boosters
    // Test getExceptions Catch Block
    const resGetExcErr = mockResponse();
    await getExceptions({ params: null }, resGetExcErr);
    assert(resGetExcErr.statusCode === 500, 'getExceptions catch block should return status 500');

    // Test createException Fallbacks (status, temporaryOrPermanent, riskAcceptedBy, affectedUserCount)
    const resCreateExcFallback = mockResponse();
    await createException(
      { 
        params: { systemId: testSystemId }, 
        body: {
          requirementId: 'E8-AC-ML2-01',
          riskStatement: 'Exposure test',
          compensatingControl: 'N/A',
          residualRisk: 'LOW',
          approvedBy: 'QA',
          reviewDate: new Date(),
          expiryDate: new Date(),
          riskAcceptedBy: 'Chief Risk Officer',
          affectedUserCount: '42'
        }
      }, 
      resCreateExcFallback
    );
    assert(resCreateExcFallback.statusCode === 201, 'createException fallback path should return status 201');
    assert(resCreateExcFallback.body.status === 'PENDING', 'Missing status should default to PENDING');
    assert(resCreateExcFallback.body.temporaryOrPermanent === 'TEMPORARY', 'Missing temporaryOrPermanent should default to TEMPORARY');
    assert(resCreateExcFallback.body.affectedUserCount === 42, 'affectedUserCount should parse string to int');
    assert(resCreateExcFallback.body.riskAcceptedAt !== null, 'riskAcceptedAt should be populated if riskAcceptedBy exists');
    const boosterExcId = resCreateExcFallback.body.id;

    // Test createException Catch Block
    const resCreateExcErr = mockResponse();
    await createException({ params: { systemId: testSystemId }, body: null }, resCreateExcErr);
    assert(resCreateExcErr.statusCode === 400, 'createException catch block should return status 400');

    // Test updateException Not Found 404
    const resUpdateExcNotFound = mockResponse();
    await updateException({ params: { id: 'invalid-id-uuid' }, body: {} }, resUpdateExcNotFound);
    assert(resUpdateExcNotFound.statusCode === 404, 'updateException for missing exception should return status 404');

    // Test updateException with fields omitted to trigger false branches
    const resUpdateExcOmitted = mockResponse();
    await updateException(
      { 
        params: { id: boosterExcId }, 
        body: { 
          residualRisk: 'HIGH'
          // reviewDate, expiryDate, affectedUserCount, riskAcceptedBy, auditComment, approvedBy are omitted
        } 
      }, 
      resUpdateExcOmitted
    );
    assert(resUpdateExcOmitted.statusCode === 200, 'updateException with omitted fields should return status 200');

    // Test updateException Catch Block
    const resUpdateExcErr = mockResponse();
    await updateException({ params: { id: boosterExcId }, body: null }, resUpdateExcErr);
    assert(resUpdateExcErr.statusCode === 400, 'updateException catch block should return status 400');

    // Test deleteException Not Found 404
    const resDeleteExcNotFound = mockResponse();
    await deleteException({ params: { id: 'invalid-id-uuid' } }, resDeleteExcNotFound);
    assert(resDeleteExcNotFound.statusCode === 404, 'deleteException for missing exception should return status 404');

    // Test deleteException Catch Block
    const resDeleteExcErr = mockResponse();
    await deleteException({ params: null }, resDeleteExcErr);
    assert(resDeleteExcErr.statusCode === 500, 'deleteException catch block should return status 500');

    // Clean up booster exception
    await prisma.exception.delete({ where: { id: boosterExcId } });

    // 21. Remediations Controller Boosters
    // Test getRemediations Catch Block
    const resGetRemErr = mockResponse();
    await getRemediations({ params: null }, resGetRemErr);
    assert(resGetRemErr.statusCode === 500, 'getRemediations catch block should return status 500');

    // Test createRemediation Fallbacks (status, dueDate)
    const resCreateRemFallback = mockResponse();
    await createRemediation(
      {
        params: { systemId: testSystemId },
        body: {
          requirementId: 'E8-AC-ML2-01',
          title: 'Remediation title',
          description: 'Remediation description'
        }
      },
      resCreateRemFallback
    );
    assert(resCreateRemFallback.statusCode === 201, 'createRemediation fallback path should return status 201');
    assert(resCreateRemFallback.body.status === 'BACKLOG', 'Missing status should default to BACKLOG');
    assert(resCreateRemFallback.body.dueDate === null, 'Missing dueDate should default to null');
    const boosterRemId = resCreateRemFallback.body.id;

    // Test createRemediation Catch Block
    const resCreateRemErr = mockResponse();
    await createRemediation({ params: { systemId: testSystemId }, body: null }, resCreateRemErr);
    assert(resCreateRemErr.statusCode === 400, 'createRemediation catch block should return status 400');

    // Test updateRemediation Not Found 404
    const resUpdateRemNotFound = mockResponse();
    await updateRemediation({ params: { id: 'invalid-id-uuid' }, body: {} }, resUpdateRemNotFound);
    assert(resUpdateRemNotFound.statusCode === 404, 'updateRemediation for missing task should return status 404');

    // Test updateRemediation Catch Block
    const resUpdateRemErr = mockResponse();
    await updateRemediation({ params: { id: boosterRemId }, body: null }, resUpdateRemErr);
    assert(resUpdateRemErr.statusCode === 400, 'updateRemediation catch block should return status 400');

    // Test deleteRemediation Not Found 404
    const resDeleteRemNotFound = mockResponse();
    await deleteRemediation({ params: { id: 'invalid-id-uuid' } }, resDeleteRemNotFound);
    assert(resDeleteRemNotFound.statusCode === 404, 'deleteRemediation for missing task should return status 404');

    // Test deleteRemediation Catch Block
    const resDeleteRemErr = mockResponse();
    await deleteRemediation({ params: null }, resDeleteRemErr);
    assert(resDeleteRemErr.statusCode === 500, 'deleteRemediation catch block should return status 500');

    // Clean up booster remediation
    await prisma.remediationTask.delete({ where: { id: boosterRemId } });



    // 19. Test deleteSystem
    const resDeleteSystem = mockResponse();
    await deleteSystem({ params: { id: testSystemId } }, resDeleteSystem);
    assert(resDeleteSystem.statusCode === 200, 'deleteSystem should return status 200');

    console.log('All Controller Integration Tests passed successfully!');
  } catch (err) {
    console.error('Controller Integration Test Failed with error:', err);
    // Cleanup if failure happens before delete
    if (testSystemId) {
      try {
        await prisma.system.delete({ where: { id: testSystemId } });
      } catch (cleanupErr) {
        // Ignored if already cleaned up
      }
    }
    throw err;
  } finally {
    await prisma.$disconnect();
  }
}

// Support running directly
if (process.argv[1] && process.argv[1].endsWith('controllers.test.js')) {
  runControllerTests();
}

export { runControllerTests };
