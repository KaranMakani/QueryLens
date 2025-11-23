import { formatTimestamp } from '../utils/formatters';
import TriageOutput from './TriageOutput';
import JsonView from './JsonView';

export default function MessageBubble({ message, viewMode, onViewModeChange }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isError = message.role === 'error';
  const hasTriage = message.triageData;

  if (isError) {
    return (
      <div className="mx-auto max-w-lg rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-3 text-center text-sm text-red-400">
        {message.content}
      </div>
    );
  }

  if (isSystem) {
    return (
      <div className="flex justify-center">
        <div className="max-w-md rounded-lg bg-gray-800/50 px-4 py-2 text-center text-xs text-gray-400">
          {message.content}
        </div>
      </div>
    );
  }

  return (
    <div className={`flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div className={`max-w-[85%] ${hasTriage ? 'w-full' : ''}`}>
        <div
          className={`${hasTriage ? '' : `rounded-2xl px-4 py-2.5 ${
            isUser
              ? 'rounded-br-md bg-brand-600 text-white'
              : 'rounded-bl-md bg-gray-800 text-gray-100'
          }`}`}
        >
          {/* Chat bubble for the reply text */}
          {message.content && (
            <div
              className={`${hasTriage ? 'mb-3 rounded-2xl px-4 py-2.5 rounded-bl-md bg-gray-800 text-gray-100' : ''}`}
            >
              <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
              <p className="mt-1 text-right text-[10px] text-gray-500">
                {formatTimestamp(message.timestamp)}
              </p>
            </div>
          )}

          {/* Inline triage output */}
          {hasTriage && (
            <div className="space-y-2">
              {/* View mode toggle */}
              <div className="flex items-center gap-1 rounded-lg bg-gray-800/50 p-1">
                <button
                  onClick={() => onViewModeChange('text')}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    viewMode === 'text'
                      ? 'bg-brand-600 text-white'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  Triage View
                </button>
                <button
                  onClick={() => onViewModeChange('json')}
                  className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                    viewMode === 'json'
                      ? 'bg-brand-600 text-white'
                      : 'text-gray-400 hover:text-gray-200'
                  }`}
                >
                  JSON View
                </button>
              </div>

              {viewMode === 'text' ? (
                <TriageOutput
                  triage={message.triageData.triage}
                  intent={message.triageData.intent}
                  entities={message.triageData.entities}
                  reply={message.triageData.reply}
                />
              ) : (
                <JsonView
                  triage={message.triageData.triage}
                  intent={message.triageData.intent}
                  entities={message.triageData.entities}
                  confidence={message.triageData.confidence}
                  reasoning={message.triageData.reasoning}
                />
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
