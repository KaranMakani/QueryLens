// localStorage persistence for conversation state

const STORAGE_KEY = 'querylens_session';

function createDefaultSession() {
  return {
    messages: [],
    triageResults: [],
    outOfScopeCount: 0,
    followUpCount: 0,
    currentEntities: {},
    lastIntent: null,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

export function loadSession() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return createDefaultSession();
    const session = JSON.parse(raw);
    if (!session.messages || !Array.isArray(session.messages)) {
      return createDefaultSession();
    }
    return session;
  } catch {
    return createDefaultSession();
  }
}

export function saveSession(session) {
  try {
    session.updatedAt = Date.now();
    localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
  } catch {
    console.warn('[QueryLens] Unable to save session to LocalStorage');
  }
}

export function addMessage(session, message) {
  const newMessage = {
    id: crypto.randomUUID?.() || `msg-${Date.now()}-${Math.random().toString(36).slice(2)}`,
    timestamp: Date.now(),
    ...message,
  };
  session.messages.push(newMessage);
  saveSession(session);
  return newMessage;
}

export function addTriageResult(session, triageData) {
  const result = {
    id: crypto.randomUUID?.() || `triage-${Date.now()}`,
    timestamp: Date.now(),
    ...triageData,
  };
  session.triageResults.push(result);
  saveSession(session);
  return result;
}

export function updateEntities(session, entities) {
  session.currentEntities = {
    ...session.currentEntities,
    ...entities,
  };
  saveSession(session);
}

export function incrementOutOfScope(session) {
  session.outOfScopeCount = (session.outOfScopeCount || 0) + 1;
  saveSession(session);
  return session.outOfScopeCount;
}

export function incrementFollowUp(session) {
  session.followUpCount = (session.followUpCount || 0) + 1;
  saveSession(session);
  return session.followUpCount;
}

export function resetFollowUp(session) {
  session.followUpCount = 0;
  saveSession(session);
}

export function updateMessage(session, messageId, updates) {
  const idx = session.messages.findIndex((m) => m.id === messageId);
  if (idx !== -1) {
    session.messages[idx] = { ...session.messages[idx], ...updates };
    saveSession(session);
  }
}

export function clearSession() {
  localStorage.removeItem(STORAGE_KEY);
  return createDefaultSession();
}

export function getConversationHistory(session, limit = 10) {
  return session.messages
    .filter((m) => m.role === 'user' || m.role === 'assistant')
    .slice(-limit)
    .map((m) => ({
      role: m.role,
      content: m.content,
    }));
}
