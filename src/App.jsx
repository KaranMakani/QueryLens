import { useState, useEffect, useCallback, useMemo } from 'react';
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
  generateFollowUpPrompts,
  isLowConfidence,
  shouldEscalateScam,
  getIntentCategory,
} from './utils/decisionEngine';

export default function App() {
  const [session, setSession] = useState(() => loadSession());
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState('text');
  const [confidenceBanner, setConfidenceBanner] = useState(null);
  const [showScamWarning, setShowScamWarning] = useState(false);
  const [pendingResult, setPendingResult] = useState(null);

  // derive the active triage from latest message that has it
  const activeTriage = useMemo(() => {
    for (let i = session.messages.length - 1; i >= 0; i--) {
      if (session.messages[i].triageData) return session.messages[i].triageData;
    }
    return null;
  }, [session.messages]);

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
        const updatedSession = { ...session };
        addMessage(updatedSession, { role: 'user', content: query });
        setSession({ ...updatedSession });

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
              role: 'assistant',
              content: "This doesn't seem related to Web3 support. Could you describe your issue with more detail? For example, any problems with transactions, wallets, or bridging?",
            });
          }
          setSession({ ...updatedSession });
          return;
        }

        // evaluate
        const evaluation = evaluateQuery(result.intent, result.entities, updatedSession.followUpCount);
        if (evaluation.mode === 'follow_up' && !evaluation.shouldForceTriage) {
          incrementFollowUp(updatedSession);
          const prompts = generateFollowUpPrompts(evaluation.missingFields);
          addMessage(updatedSession, {
            role: 'assistant',
            content: prompts.join(' '),
            triageData: result,
          });
          setSession({ ...updatedSession });
          return;
        }

        // full triage
        if (evaluation.shouldForceTriage) {
          addMessage(updatedSession, {
            role: 'system',
            content: 'Max follow-ups reached — generating triage with available information.',
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
          setSession({ ...updatedSession });
          return;
        }

        // high confidence
        addMessage(updatedSession, {
          role: 'assistant',
          content: result.reply,
          triageData: result,
        });
        setSession({ ...updatedSession });
      } catch (error) {
        const errorMessage = error instanceof ApiError ? error.message : 'Something went wrong. Please try again.';
        const updatedSession = { ...session };
        addMessage(updatedSession, { role: 'error', content: errorMessage });
        setSession(updatedSession);
      } finally {
        setIsLoading(false);
      }
    },
    [session]
  );

  const handleConfirmConfidence = useCallback(() => {
    if (!pendingResult) return;
    const updatedSession = { ...session };
    addMessage(updatedSession, {
      role: 'assistant',
      content: pendingResult.reply,
      triageData: pendingResult,
    });
    setConfidenceBanner(null);
    setPendingResult(null);
    setSession(updatedSession);
  }, [pendingResult, session]);

  const handleProvideMoreInfo = useCallback(() => {
    setConfidenceBanner(null);
    setPendingResult(null);
  }, []);

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
