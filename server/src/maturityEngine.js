export function calculateMaturity(catalog, assessment, exceptions, targetMaturity = 'ML2') {
  // Defensive validation of inputs
  if (!catalog || !Array.isArray(catalog)) {
    return { 
      strategyScores: {}, 
      overallMaturity: 'ML0', 
      blockingStrategies: [], 
      targetMaturity,
      technicalScores: {},
      technicalMaturity: 'ML0',
      technicalBlockingStrategies: []
    };
  }
  if (!assessment || !Array.isArray(assessment.testResults)) {
    return { 
      strategyScores: {}, 
      overallMaturity: 'ML0', 
      blockingStrategies: [], 
      targetMaturity,
      technicalScores: {},
      technicalMaturity: 'ML0',
      technicalBlockingStrategies: []
    };
  }

  const safeExceptions = Array.isArray(exceptions) ? exceptions : [];

  // Map control tests for easy lookup
  const resultsMap = {};
  assessment.testResults.forEach(tr => {
    resultsMap[tr.requirementId] = tr.status;
  });

  // Map active exceptions
  const activeExceptions = new Set(
    safeExceptions
      .filter(ex => ex.status === 'APPROVED' && new Date(ex.expiryDate) > new Date())
      .map(ex => ex.requirementId)
  );

  const strategyScores = {};
  const technicalScores = {};
  const levelsOrder = ['ML0', 'ML1', 'ML2', 'ML3'];

  catalog.forEach(strategy => {
    // 1. Calculate Technical scores (Strict Passed/NA only, no exceptions)
    let techLevel = 'ML0';
    
    // Check ML1
    const ml1Reqs = strategy.requirements.filter(r => r.level === 'ML1');
    const ml1TechPassed = ml1Reqs.every(r => resultsMap[r.id] === 'PASSED' || resultsMap[r.id] === 'NOT_APPLICABLE');
    if (ml1TechPassed && ml1Reqs.length > 0) {
      techLevel = 'ML1';
      // Check ML2
      const ml2Reqs = strategy.requirements.filter(r => r.level === 'ML2');
      const ml2TechPassed = ml2Reqs.every(r => resultsMap[r.id] === 'PASSED' || resultsMap[r.id] === 'NOT_APPLICABLE');
      if (ml2TechPassed && ml2Reqs.length > 0) {
        techLevel = 'ML2';
        // Check ML3
        const ml3Reqs = strategy.requirements.filter(r => r.level === 'ML3');
        const ml3TechPassed = ml3Reqs.every(r => resultsMap[r.id] === 'PASSED' || resultsMap[r.id] === 'NOT_APPLICABLE');
        if (ml3TechPassed && ml3Reqs.length > 0) {
          techLevel = 'ML3';
        }
      }
    }
    technicalScores[strategy.strategy] = techLevel;

    // 2. Calculate Assessed scores (Includes exemptions and met_via_compensating_control)
    let assessedLevel = 'ML0';
    const ml1AssessedPassed = ml1Reqs.every(r => 
      resultsMap[r.id] === 'PASSED' || 
      resultsMap[r.id] === 'NOT_APPLICABLE' || 
      resultsMap[r.id] === 'MET_VIA_COMPENSATING_CONTROL' || 
      activeExceptions.has(r.id)
    );
    if (ml1AssessedPassed && ml1Reqs.length > 0) {
      assessedLevel = 'ML1';
      // Check ML2
      const ml2Reqs = strategy.requirements.filter(r => r.level === 'ML2');
      const ml2AssessedPassed = ml2Reqs.every(r => 
        resultsMap[r.id] === 'PASSED' || 
        resultsMap[r.id] === 'NOT_APPLICABLE' || 
        resultsMap[r.id] === 'MET_VIA_COMPENSATING_CONTROL' || 
        activeExceptions.has(r.id)
      );
      if (ml2AssessedPassed && ml2Reqs.length > 0) {
        assessedLevel = 'ML2';
        // Check ML3
        const ml3Reqs = strategy.requirements.filter(r => r.level === 'ML3');
        const ml3AssessedPassed = ml3Reqs.every(r => 
          resultsMap[r.id] === 'PASSED' || 
          resultsMap[r.id] === 'NOT_APPLICABLE' || 
          resultsMap[r.id] === 'MET_VIA_COMPENSATING_CONTROL' || 
          activeExceptions.has(r.id)
        );
        if (ml3AssessedPassed && ml3Reqs.length > 0) {
          assessedLevel = 'ML3';
        }
      }
    }
    strategyScores[strategy.strategy] = assessedLevel;
  });

  // Calculate overall Technical Maturity
  let technicalMaturity = 'ML3';
  let techMinIdx = 3;
  Object.values(technicalScores).forEach(level => {
    const idx = levelsOrder.indexOf(level);
    if (idx < techMinIdx) {
      techMinIdx = idx;
      technicalMaturity = level;
    }
  });

  // Calculate overall Assessed Maturity
  let overallMaturity = 'ML3';
  let assessedMinIdx = 3;
  Object.values(strategyScores).forEach(level => {
    const idx = levelsOrder.indexOf(level);
    if (idx < assessedMinIdx) {
      assessedMinIdx = idx;
      overallMaturity = level;
    }
  });

  // Find strategies blocking target maturity in assessed scores
  const blockingStrategies = [];
  const targetIdx = levelsOrder.indexOf(targetMaturity);
  Object.entries(strategyScores).forEach(([strategyName, level]) => {
    if (levelsOrder.indexOf(level) < targetIdx) {
      blockingStrategies.push(strategyName);
    }
  });

  // Find strategies blocking target maturity in technical scores
  const technicalBlockingStrategies = [];
  Object.entries(technicalScores).forEach(([strategyName, level]) => {
    if (levelsOrder.indexOf(level) < targetIdx) {
      technicalBlockingStrategies.push(strategyName);
    }
  });

  return {
    strategyScores,
    overallMaturity,
    blockingStrategies,
    targetMaturity,
    technicalScores,
    technicalMaturity,
    technicalBlockingStrategies
  };
}
