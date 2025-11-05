// output formatting - text and json views for triage results

export function formatTriageText(triage, intent, entities) {
  const lines = [];

  lines.push(`Issue Type: ${triage.issueType || 'Unknown'}`);
  lines.push(`Confidence: ${triage.confidence || 'Low'}`);
  lines.push('');

  if (triage.userSituation) {
    lines.push('User Situation:');
    lines.push(triage.userSituation);
    lines.push('');
  }

  if (triage.likelyCause) {
    lines.push('Likely Cause:');
    lines.push(triage.likelyCause);
    lines.push('');
  }

  if (triage.missingInfo && triage.missingInfo.length > 0) {
    lines.push(`Missing Info: ${triage.missingInfo.join(', ')}`);
    lines.push('');
  } else {
    lines.push('Missing Info: None');
    lines.push('');
  }

  if (triage.modAction) {
    lines.push('Mod Action:');
    lines.push(triage.modAction);
    lines.push('');
  }

  if (triage.suggestedReply) {
    lines.push('Suggested Reply:');
    lines.push(`"${triage.suggestedReply}"`);
    lines.push('');
  }

  const nonNullEntities = Object.entries(entities || {}).filter(
    ([, value]) => value !== null && value !== undefined && value !== ''
  );

  if (nonNullEntities.length > 0) {
    lines.push('Extracted Info:');
    nonNullEntities.forEach(([key, value]) => {
      lines.push(`  ${formatFieldName(key)}: ${value}`);
    });
  }

  return lines.join('\n');
}

export function formatTriageJson(triage, intent, entities, confidence, reasoning) {
  return {
    intent: {
      id: intent,
      confidence,
      reasoning,
    },
    entities: Object.fromEntries(
      Object.entries(entities || {}).filter(
        ([, value]) => value !== null && value !== undefined && value !== ''
      )
    ),
    triage: {
      issueType: triage.issueType,
      confidence: triage.confidence,
      userSituation: triage.userSituation,
      likelyCause: triage.likelyCause,
      missingInfo: triage.missingInfo,
      modAction: triage.modAction,
      suggestedReply: triage.suggestedReply,
    },
    timestamp: new Date().toISOString(),
  };
}

function formatFieldName(field) {
  const nameMap = {
    transactionHash: 'TX Hash',
    walletAddress: 'Wallet',
    network: 'Network',
    token: 'Token',
    platform: 'Platform',
  };
  return nameMap[field] || field.replace(/([A-Z])/g, ' $1').trim();
}

export function formatTimestamp(timestamp) {
  const date = new Date(timestamp);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}
