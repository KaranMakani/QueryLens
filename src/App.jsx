import { useState, useEffect, useCallback } from 'react';
import Header from './components/Header';
import QueryPanel from './components/QueryPanel';
import AnalysisPanel from './components/AnalysisPanel';
import {
  loadSession,
  addMessage,
  updateEntities,
  incrementOutOfScope,
  incrementFollowUp,
  resetFollowUp,
  clearSession as clearStorageSession,
  getConversationHistory,
} from './utils/storage';
import { runFullPipeline, ApiError } from './utils/api';
import {
  evaluateQuery,
  isLowConfidence,
  shouldEscalateScam,
  getIntentCategory,
} from './utils/decisionEngine';

// find the latest triage data from messages
function getLatestTriage(messages) {
  for (let i = messages.length - 1; i >= 0; i--) {
    if (messages[i].triageData) return messages[i].triageData;
  }
  return null;
}

export default function App() {
  const [session, setSession] = useState(() => loadSession());
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('text');
  const [confidenceBanner, setConfidenceBanner] = useState(null);
  const [showScamWarning, setShowScamWarning] = useState(false);
  const [pendingResult, setPendingResult] = useState(null);

  useEffect(() => {
    if (shouldEscalateScam(session.outOfScopeCount)) {
      setShowScamWarning(true);
    }
  }, [session.outOfScopeCount]);

  const handleClearSession = useCallback(() => {
    const fresh = clearStorageSession();
    setSession(fresh);
    setConfidenceBanner(null);
    setShowScamWarning(false);
    setPendingResult(null);
    setViewMode('text');
  }, []);

  const processQuery = useCallback(
    async (query) => {
      setIsLoading(true);
      setConfidenceBanner(null);

      try {
        // deep copy messages array so React detects the change
        const updatedSession = { ...session, messages: [...session.messages] };
        addMessage(updatedSession, { role: 'user', content: query });
        setSession({ ...updatedSession, messages: [...updatedSession.messages] });

        const history = getConversationHistory(updatedSession);
        const result = await runFullPipeline(query, history);
        updateEntities(updatedSession, result.entities);

        // out of scope
        if (result.intent === 'out_of_scope') {
          const newCount = incrementOutOfScope(updatedSession);
          if (shouldEscalateScam(newCount)) {
            setShowScamWarning(true);
            addMessage(updatedSession, {
              role: 'system',
              content: 'Out of scope query detected. Scam risk flag raised — moderator review recommended.',
            });
          } else {
            addMessage(updatedSession, {
              role: 'system',
              content: 'Out of scope — not related to Web3 support. Ask the user for transaction or wallet details.',
            });
          }
          setSession({ ...updatedSession, messages: [...updatedSession.messages] });
          return;
        }

        // evaluate
        const evaluation = evaluateQuery(result.intent, result.entities, updatedSession.followUpCount);
        if (evaluation.mode === 'follow_up' && !evaluation.shouldForceTriage) {
          incrementFollowUp(updatedSession);
          // use AI-generated follow-up question (dynamic, asks for all missing info at once)
          const followUp = result.followUpQuestion
            || `Could you provide more details? Missing: ${evaluation.missingFields.join(', ')}`;
          addMessage(updatedSession, {
            role: 'assistant',
            content: `Follow-up needed — ask the user: ${followUp}`,
            triageData: result,
          });
          setSession({ ...updatedSession, messages: [...updatedSession.messages] });
          return;
        }

        // full triage
        if (evaluation.shouldForceTriage) {
          addMessage(updatedSession, {
            role: 'system',
            content: 'Max follow-ups reached — triage generated with available information.',
          });
        }
        resetFollowUp(updatedSession);

        // low confidence
        if (isLowConfidence(result.confidence)) {
          setPendingResult(result);
          setConfidenceBanner({
            intent: getIntentCategory(result.intent)?.label || result.intent,
            confidence: result.confidence,
          });
          setSession({ ...updatedSession, messages: [...updatedSession.messages] });
          return;
        }

        // high confidence — show triage notification, NOT the reply itself
        addMessage(updatedSession, {
          role: 'assistant',
          content: 'Triage analysis ready — see Analysis Panel for details and suggested reply.',
          triageData: result,
        });
        setSession({ ...updatedSession, messages: [...updatedSession.messages] });
      } catch (error) {
        const errorMessage = error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
        const updatedSession = { ...session, messages: [...session.messages] };
        addMessage(updatedSession, { role: 'error', content: errorMessage });
        setSession({ ...updatedSession, messages: [...updatedSession.messages] });
      } finally {
        setIsLoading(false);
      }
    },
    [session]
  );

  const handleConfirmConfidence = useCallback(() => {
    if (!pendingResult) return;
    const updatedSession = { ...session, messages: [...session.messages] };
    addMessage(updatedSession, {
      role: 'assistant',
      content: 'Triage analysis ready — see Analysis Panel for details and suggested reply.',
      triageData: pendingResult,
    });
    setConfidenceBanner(null);
    setPendingResult(null);
    setSession({ ...updatedSession, messages: [...updatedSession.messages] });
  }, [pendingResult, session]);

  const handleProvideMoreInfo = useCallback(() => {
    setConfidenceBanner(null);
    setPendingResult(null);
  }, []);

  // compute active triage from session directly (no useMemo — avoids stale reference)
  const activeTriage = getLatestTriage(session.messages);

  return (
    <div className="flex h-screen flex-col bg-gray-950">
      <Header onClearSession={handleClearSession} />
      <div className="border-b border-gray-800/40 bg-gray-900/30 px-4 py-1 text-center text-[10px] tracking-wide text-gray-600">
        PROTOTYPE DEMO — In production, QueryLens connects to internal AI models trained on historical support data. This demo uses OpenAI for demonstration purposes only.
      </div>
      <div className="flex flex-1 overflow-hidden">
        <QueryPanel
          messages={session.messages}
          onSendMessage={processQuery}
          isLoading={isLoading}
        />
        <AnalysisPanel
          triageData={activeTriage}
          viewMode={viewMode}
          onViewModeChange={setViewMode}
          confidenceBanner={confidenceBanner}
          onConfirmConfidence={handleConfirmConfidence}
          onProvideMoreInfo={handleProvideMoreInfo}
          showScamWarning={showScamWarning}
          isLoading={isLoading}
        />
      </div>
    </div>
  );
}
