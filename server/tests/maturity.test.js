import { calculateMaturity } from '../src/maturityEngine.js';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Read catalog from data directory
const catalogPath = path.join(__dirname, '../../data/essential-eight/controls.json');
const catalog = JSON.parse(fs.readFileSync(catalogPath, 'utf8'));

// Assertion helper
function assert(condition, message) {
  if (!condition) {
    throw new Error(`Assertion Failed: ${message}`);
  }
  console.log(`[PASS] ${message}`);
}

function runTests() {
  console.log('Running Maturity Engine Tests...');

  // Test Case 1: All passed should be ML3
  const assessmentAllPassed = {
    testResults: catalog.flatMap(strategy => 
      strategy.requirements.map(req => ({
        requirementId: req.id,
        status: 'EFFECTIVE'
      }))
    )
  };
  const result1 = calculateMaturity(catalog, assessmentAllPassed, [], 'ML3');
  assert(result1.overallMaturity === 'ML3', 'Should calculate ML3 when all requirements are passed');
  assert(result1.blockingStrategies.length === 0, 'No strategies should block target');

  // Test Case 2: One ML1 control failed -> overall should be ML0
  const assessmentOneFailed = {
    testResults: catalog.flatMap(strategy => 
      strategy.requirements.map(req => ({
        requirementId: req.id,
        status: req.id === 'E8-AC-ML1-01' ? 'INEFFECTIVE' : 'EFFECTIVE'
      }))
    )
  };
  const result2 = calculateMaturity(catalog, assessmentOneFailed, [], 'ML2');
  assert(result2.strategyScores['Application Control'] === 'ML0', 'Application Control should be downgraded to ML0');
  assert(result2.overallMaturity === 'ML0', 'Overall maturity should be ML0 due to lowest common denominator');
  assert(result2.blockingStrategies.includes('Application Control'), 'Application Control should block target level');

  // Test Case 3: Failed control WITH an active approved exception -> should NOT downgrade maturity
  const exceptions = [
    {
      requirementId: 'E8-AC-ML1-01',
      status: 'APPROVED',
      expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10), // 10 days in future
      compensatingControlEfficacy: 'HIGH',
      riskAcceptedBy: 'CISO',
      riskAcceptedAt: new Date()
    }
  ];
  const result3 = calculateMaturity(catalog, assessmentOneFailed, exceptions, 'ML2');
  assert(result3.strategyScores['Application Control'] === 'ML3', 'Application Control should pass to ML3 with exception');
  assert(result3.overallMaturity === 'ML3', 'Overall maturity should remain ML3 since exception is approved and active');
  assert(result3.technicalMaturity === 'ML0', 'Technical maturity must remain ML0 (ignoring exceptions)');

  // Test Case 3b: Failed control WITH an approved exception but MEDIUM efficacy -> should downgrade
  const mediumEfficacyExceptions = [
    {
      requirementId: 'E8-AC-ML1-01',
      status: 'APPROVED',
      expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
      compensatingControlEfficacy: 'MEDIUM',
      riskAcceptedBy: 'CISO',
      riskAcceptedAt: new Date()
    }
  ];
  const result3b = calculateMaturity(catalog, assessmentOneFailed, mediumEfficacyExceptions, 'ML2');
  assert(result3b.strategyScores['Application Control'] === 'ML0', 'Medium efficacy exceptions must not bypass downgrading');
  assert(result3b.overallMaturity === 'ML0', 'Overall maturity must downgrade for medium efficacy exceptions');

  // Test Case 3c: Failed control WITH an approved exception but missing risk acceptance -> should downgrade
  const unsignedExceptions = [
    {
      requirementId: 'E8-AC-ML1-01',
      status: 'APPROVED',
      expiryDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 10),
      compensatingControlEfficacy: 'HIGH',
      riskAcceptedBy: null,
      riskAcceptedAt: null
    }
  ];
  const result3c = calculateMaturity(catalog, assessmentOneFailed, unsignedExceptions, 'ML2');
  assert(result3c.strategyScores['Application Control'] === 'ML0', 'Unsigned exceptions must not bypass downgrading');

  // Test Case 4: Failed control WITH an EXPIRED exception -> should downgrade
  const expiredExceptions = [
    {
      requirementId: 'E8-AC-ML1-01',
      status: 'APPROVED',
      expiryDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 1), // expired yesterday
      compensatingControlEfficacy: 'HIGH',
      riskAcceptedBy: 'CISO',
      riskAcceptedAt: new Date()
    }
  ];
  const result4 = calculateMaturity(catalog, assessmentOneFailed, expiredExceptions, 'ML2');
  assert(result4.strategyScores['Application Control'] === 'ML0', 'Expired exceptions must not be counted for compliance');
  assert(result4.overallMaturity === 'ML0', 'Overall maturity must downgrade for expired exceptions');
  assert(result4.technicalMaturity === 'ML0', 'Technical maturity should be ML0 under expired exceptions');

  // Test Case 5: Malformed inputs (Defensive validations checks)
  const resultMalformed1 = calculateMaturity(null, assessmentAllPassed, []);
  assert(resultMalformed1.overallMaturity === 'ML0', 'Should handle null catalog safely');

  const resultMalformed2 = calculateMaturity(catalog, null, []);
  assert(resultMalformed2.overallMaturity === 'ML0', 'Should handle null assessment safely');

  const resultMalformed3 = calculateMaturity(catalog, assessmentAllPassed, null);
  assert(resultMalformed3.overallMaturity === 'ML3', 'Should handle null exceptions safely');

  console.log('\nAll Maturity Engine tests passed successfully!');
}

runTests();
