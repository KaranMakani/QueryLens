import React, { useRef, useEffect, useState } from 'react';

const EXAMPLE_QUERIES = [
  'Sent USDC from Binance but not received',
  'admin told me to dm him my seed phrase',
  'My tokens disappeared from wallet',
  'Bridge transaction stuck for hours',
];

export default function QueryPanel({ messages, onSendMessage, isLoading }) {
  const [input, setInput] = useState('');
  const messagesEndRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

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
    <div className="flex w-[400px] flex-shrink-0 flex-col border-r border-gray-800/60">
      {/* Query Input */}
      <div className="border-b border-gray-800/60 p-4">
        <form onSubmit={handleSubmit} className="relative">
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
            rows={2}
            className="w-full resize-none rounded-lg border border-gray-700/60 bg-gray-800/40 px-4 py-3 pr-12 text-sm text-gray-200 placeholder-gray-500 transition-colors focus:border-brand-500/50 focus:outline-none focus:ring-1 focus:ring-brand-500/30 disabled:opacity-60"
            disabled={isLoading}
          />
          <button
            type="submit"
            disabled={isLoading || !input.trim()}
            className="absolute right-2 bottom-2 rounded-md bg-brand-600 p-2 text-white transition-colors hover:bg-brand-500 disabled:opacity-40 disabled:hover:bg-brand-600"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" />
            </svg>
          </button>
        </form>
      </div>

      {/* Conversation Timeline */}
      <div className="flex-1 overflow-y-auto">
        {messages.length === 0 ? (
          <EmptyState onSendMessage={onSendMessage} />
        ) : (
          <div className="divide-y divide-gray-800/30">
            {messages.map((msg) => (
              <TimelineMessage key={msg.id} message={msg} />
            ))}
            {isLoading && (
              <div className="flex items-center gap-2 px-4 py-3">
                <div className="flex gap-1">
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-400" style={{ animationDelay: '0ms' }} />
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-400" style={{ animationDelay: '150ms' }} />
                  <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-400" style={{ animationDelay: '300ms' }} />
                </div>
                <span className="text-xs text-gray-500">Analyzing...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>
        )}
      </div>
    </div>
  );
}

function EmptyState({ onSendMessage }) {
  return (
    <div className="p-6 text-center">
      <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-brand-600/15">
        <svg className="h-6 w-6 text-brand-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
          <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
        </svg>
      </div>
      <p className="mb-1 text-sm font-medium text-gray-400">Submit a Query</p>
      <p className="mb-5 text-xs text-gray-600">Describe a Web3 support issue to see triage analysis</p>
      <div className="space-y-1.5">
        {EXAMPLE_QUERIES.map((q) => (
          <button
            key={q}
            onClick={() => onSendMessage(q)}
            className="block w-full rounded-lg border border-gray-800 bg-gray-800/20 px-3 py-2 text-left text-xs text-gray-500 transition-colors hover:border-brand-500/30 hover:bg-gray-800/40 hover:text-gray-300"
          >
            {q}
          </button>
        ))}
      </div>
    </div>
  );
}

function TimelineMessage({ message }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isError = message.role === 'error';
  const hasTriage = message.triageData;

  if (isError) {
    return (
      <div className="px-4 py-3">
        <div className="flex items-start gap-2">
          <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full bg-red-500/15 text-[10px] font-medium text-red-400">
            !
          </div>
          <p className="text-sm text-red-400">{message.content}</p>
        </div>
      </div>
    );
  }

  if (isSystem) {
    return (
      <div className="px-4 py-2">
        <div className="flex items-center gap-2 rounded-md bg-gray-800/30 px-3 py-1.5">
          <svg className="h-3.5 w-3.5 text-gray-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <p className="text-[11px] text-gray-500">{message.content}</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`px-4 py-3 ${hasTriage ? 'bg-brand-600/[0.03]' : ''}`}>
      <div className="flex items-start gap-2.5">
        <div className={`mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full text-[10px] font-semibold ${
          isUser
            ? 'bg-brand-600/20 text-brand-300'
            : 'bg-gray-700/80 text-gray-300'
        }`}>
          {isUser ? 'U' : 'Q'}
        </div>
        <div className="min-w-0 flex-1">
          <div className="mb-0.5 flex items-center gap-2">
            <span className={`text-[11px] font-medium ${isUser ? 'text-brand-400' : 'text-gray-400'}`}>
              {isUser ? 'User' : 'QueryLens'}
            </span>
            {hasTriage && (
              <span className="rounded border border-brand-500/20 bg-brand-500/10 px-1.5 py-px text-[9px] font-medium text-brand-300">
                ANALYZED
              </span>
            )}
          </div>
          <p className="text-sm leading-relaxed text-gray-300">{message.content}</p>
        </div>
      </div>
    </div>
  );
}
