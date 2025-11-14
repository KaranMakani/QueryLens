import { formatTimestamp } from '../utils/formatters';

export default function MessageBubble({ message }) {
  const isUser = message.role === 'user';
  const isSystem = message.role === 'system';
  const isError = message.role === 'error';

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
      <div
        className={`max-w-[80%] rounded-2xl px-4 py-2.5 ${
          isUser
            ? 'rounded-br-md bg-brand-600 text-white'
            : 'rounded-bl-md bg-gray-800 text-gray-100'
        }`}
      >
        <p className="text-sm leading-relaxed whitespace-pre-wrap">{message.content}</p>
        <p
          className={`mt-1 text-right text-[10px] ${
            isUser ? 'text-brand-200' : 'text-gray-500'
          }`}
        >
          {formatTimestamp(message.timestamp)}
        </p>
      </div>
    </div>
  );
}
