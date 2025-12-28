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

      {/* Import Tickets — UI placeholder, not functional */}
      <div className="flex items-center gap-3 border-b border-gray-800/60 bg-gray-900/40 px-4 py-2">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-gray-600">Import</span>
        <div className="h-3.5 w-px bg-gray-800" />
        <div className="flex items-center gap-3">
          <div className="group relative">
            <div className="flex items-center gap-1.5 text-gray-500 cursor-not-allowed">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M20.317 4.37a19.791 19.791 0 00-4.885-1.515.074.074 0 00-.079.037c-.21.375-.444.864-.608 1.25a18.27 18.27 0 00-5.487 0 12.64 12.64 0 00-.617-1.25.077.077 0 00-.079-.037A19.736 19.736 0 003.677 4.37a.07.07 0 00-.032.027C.533 9.046-.32 13.58.099 18.057a.082.082 0 00.031.057 19.9 19.9 0 005.993 3.03.078.078 0 00.084-.028c.462-.63.874-1.295 1.226-1.994a.076.076 0 00-.041-.106 13.107 13.107 0 01-1.872-.892.077.077 0 01-.008-.128 10.2 10.2 0 00.372-.292.074.074 0 01.077-.01c3.928 1.793 8.18 1.793 12.062 0a.074.074 0 01.078.01c.12.098.246.198.373.292a.077.077 0 01-.006.127 12.299 12.299 0 01-1.873.892.077.077 0 00-.041.107c.36.698.772 1.362 1.225 1.993a.076.076 0 00.084.028 19.839 19.839 0 006.002-3.03.077.077 0 00.032-.054c.5-5.177-.838-9.674-3.549-13.66a.061.061 0 00-.031-.03z" />
              </svg>
              <span className="text-[11px]">Discord</span>
            </div>
            <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 rounded bg-gray-900 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-brand-400/80 opacity-0 shadow-lg border border-brand-500/20 whitespace-nowrap transition-opacity group-hover:opacity-100">
              Coming Soon
            </span>
          </div>
          <div className="group relative">
            <div className="flex items-center gap-1.5 text-gray-500 cursor-not-allowed">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M11.944 0A12 12 0 000 12a12 12 0 0012 12 12 12 0 0012-12A12 12 0 0012 0a12 12 0 00-.056 0zm4.962 7.224c.1-.002.321.023.465.14a.506.506 0 01.171.325c.016.093.036.306.02.472-.18 1.898-.962 6.502-1.36 8.627-.168.9-.499 1.201-.82 1.23-.696.065-1.225-.46-1.9-.902-1.056-.693-1.653-1.124-2.678-1.8-1.185-.78-.417-1.21.258-1.91.177-.184 3.247-2.977 3.307-3.23.007-.032.014-.15-.056-.212s-.174-.041-.249-.024c-.106.024-1.793 1.14-5.061 3.345-.479.33-.913.49-1.302.48-.428-.008-1.252-.241-1.865-.44-.752-.245-1.349-.374-1.297-.789.027-.216.325-.437.893-.663 3.498-1.524 5.83-2.529 6.998-3.014 3.332-1.386 4.025-1.627 4.476-1.635z" />
              </svg>
              <span className="text-[11px]">Telegram</span>
            </div>
            <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 rounded bg-gray-900 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-brand-400/80 opacity-0 shadow-lg border border-brand-500/20 whitespace-nowrap transition-opacity group-hover:opacity-100">
              Coming Soon
            </span>
          </div>
          <div className="group relative">
            <div className="flex items-center gap-1.5 text-gray-500 cursor-not-allowed">
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M2 9a3 3 0 013-3h14a3 3 0 013 3v0a3 3 0 01-3 3H5a3 3 0 01-3-3z" />
                <path d="M9 6V4a1 1 0 011-1h4a1 1 0 011 1v2M9 18v2a1 1 0 001 1h4a1 1 0 001-1v-2" />
                <path d="M7 12h10" />
              </svg>
              <span className="text-[11px]">Ticket Tool</span>
            </div>
            <span className="pointer-events-none absolute -bottom-7 left-1/2 -translate-x-1/2 rounded bg-gray-900 px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wider text-brand-400/80 opacity-0 shadow-lg border border-brand-500/20 whitespace-nowrap transition-opacity group-hover:opacity-100">
              Coming Soon
            </span>
          </div>
        </div>
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
