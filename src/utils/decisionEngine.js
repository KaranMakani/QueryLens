// decision engine - routes queries to follow-up or full triage mode

import intentConfig from '../config/intents.json';

const { categories, extractableFields, settings } = intentConfig;

export function getIntentCategory(intentId) {
  return categories.find((c) => c.id === intentId) || null;
}

export function isLowConfidence(confidence) {
  return confidence < settings.confidenceThreshold;
}

export function getMissingFields(intentId, entities) {
  const category = getIntentCategory(intentId);
  if (!category) return [];

  return category.requiredFields.filter((field) => {
    const value = entities[field];
    return value === null || value === undefined || value === '';
  });
}

export function evaluateQuery(intentId, entities, followUpCount = 0) {
  const category = getIntentCategory(intentId);

  // some intents don't need entity checks
  if (intentId === 'out_of_scope') {
    return { mode: 'full_triage', isComplete: true, missingFields: [], shouldForceTriage: false };
  }

  if (intentId === 'scam_risk') {
    return { mode: 'full_triage', isComplete: true, missingFields: [], shouldForceTriage: false };
  }

  if (intentId === 'wallet_confusion' && !category.requiredFields.length) {
    return { mode: 'full_triage', isComplete: true, missingFields: [], shouldForceTriage: false };
  }

  const missingFields = getMissingFields(intentId, entities);
  const isComplete = missingFields.length === 0;
  const shouldForceTriage = followUpCount >= settings.maxFollowUpTurns;

  // force triage after max follow-ups even with incomplete data
  if (shouldForceTriage) {
    return { mode: 'full_triage', isComplete: false, missingFields, shouldForceTriage: true };
  }

  return {
    mode: isComplete ? 'full_triage' : 'follow_up',
    isComplete,
    missingFields,
    shouldForceTriage: false,
  };
}

export function generateFollowUpPrompts(missingFields) {
  return missingFields.map((field) => {
    const fieldConfig = extractableFields[field];
    return fieldConfig?.followUpPrompt || `Could you provide the ${fieldConfig?.label || field}?`;
  });
}

export function shouldEscalateScam(outOfScopeCount) {
  return outOfScopeCount >= settings.scamEscalationThreshold;
}

export function getConfidenceLevel(confidence) {
  if (confidence >= 0.85) return 'High';
  if (confidence >= 0.7) return 'Medium';
  return 'Low';
}
