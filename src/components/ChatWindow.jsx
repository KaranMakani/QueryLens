import React, { useRef, useEffect, useState } from 'react';
import MessageBubble from './MessageBubble';
import ConfidenceBanner from './ConfidenceBanner';
import ScamWarning from './ScamWarning';

export default function ChatWindow({
  messages,
  onSendMessage,
  isLoading,
  viewMode,
  onViewModeChange,
  confidenceBanner,
  onConfirmConfidence,
  onProvideMoreInfo,
  showScamWarning,
  onClearSession,
}) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, confidenceBanner, showScamWarning]);

  useEffect(() => {
    if (!isLoading) inputRef.current?.focus();
  }, [isLoading]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;
    onSendMessage(trimmed);
    setInput('');
  };

  return (
    <div className="flex h-full flex-col">
      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="mx-auto max-w-3xl space-y-3">
          {messages.length === 0 && (
            <div className="py-16 text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-600/20">
                <svg
                  className="h-8 w-8 text-brand-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <h2 className="mb-1 text-lg font-semibold text-gray-200">
                QueryLens Triage
              </h2>
              <p className="text-sm text-gray-500">
                Describe a Web3 support issue and get instant triage analysis.
              </p>
              <div className="mt-6 flex flex-wrap justify-center gap-2">
                {[
                  'Sent USDC from Binance but not received',
                  'admin told me to dm him my seed phrase',
                  'My tokens disappeared from wallet',
                  'Bridge transaction stuck for hours',
                ].map((example) => (
                  <button
                    key={example}
                    onClick={() => onSendMessage(example)}
                    className="rounded-full border border-gray-700 bg-gray-800/50 px-3 py-1.5 text-xs text-gray-400 transition-colors hover:border-brand-500/50 hover:text-gray-200"
                  >
                    {example}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <MessageBubble
              key={msg.id}
              message={msg}
              viewMode={viewMode}
              onViewModeChange={onViewModeChange}
            />
          ))}

          {/* Confidence Banner */}
          {confidenceBanner && (
            <ConfidenceBanner
              intent={confidenceBanner.intent}
              confidence={confidenceBanner.confidence}
              onConfirm={onConfirmConfidence}
              onProvideMore={onProvideMoreInfo}
            />
          )}

          {/* Scam Warning */}
          {showScamWarning && <ScamWarning />}

          {/* Loading Indicator */}
          {isLoading && (
            <div className="flex justify-start">
              <div className="rounded-2xl rounded-bl-md bg-gray-800 px-4 py-3">
                <div className="flex items-center gap-1.5">
                  <div className="h-2 w-2 animate-bounce rounded-full bg-brand-400" style={{ animationDelay: '0ms' }} />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-brand-400" style={{ animationDelay: '150ms' }} />
                  <div className="h-2 w-2 animate-bounce rounded-full bg-brand-400" style={{ animationDelay: '300ms' }} />
                </div>
              </div>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-800 bg-gray-900/80 backdrop-blur-sm">
        <form
          onSubmit={handleSubmit}
          className="mx-auto flex max-w-3xl items-end gap-3 px-4 py-3"
        >
          {/* Reset button - show when conversation exists */}
          {messages.length > 0 && (
            <button
              type="button"
              onClick={onClearSession}
              className="flex h-[46px] items-center gap-1.5 rounded-lg border border-gray-700 bg-gray-800 px-3 text-xs text-gray-400 transition-colors hover:border-red-500/40 hover:text-red-400"
              title="Start new conversation"
            >
              <svg
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2"
              >
                <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
              </svg>
              New
            </button>
          )}

          <div className="flex-1">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  handleSubmit(e);
                }
              }}
              placeholder="Describe the support issue..."
              rows={1}
              className="chat-input resize-none"
              disabled={isLoading}
            />
          </div>
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="btn-primary flex h-[46px] items-center justify-center px-4"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </form>
      </div>
    </div>
  );
}
