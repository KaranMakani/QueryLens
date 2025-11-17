import { formatTriageJson } from '../utils/formatters';

export default function JsonView({ triage, intent, entities, confidence, reasoning }) {
  const jsonData = formatTriageJson(triage, intent, entities, confidence, reasoning);
  const jsonString = JSON.stringify(jsonData, null, 2);

  const handleCopy = () => {
    navigator.clipboard.writeText(jsonString).catch(() => {
      // Fallback for older browsers
      const textarea = document.createElement('textarea');
      textarea.value = jsonString;
      document.body.appendChild(textarea);
      textarea.select();
      document.execCommand('copy');
      document.body.removeChild(textarea);
    });
  };

  return (
    <div className="card">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-sm font-semibold text-brand-400">JSON Output</h3>
        <button onClick={handleCopy} className="btn-ghost text-xs">
          <svg
            className="mr-1 inline h-3.5 w-3.5"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
          >
            <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
            <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
          </svg>
          Copy
        </button>
      </div>
      <pre className="overflow-x-auto whitespace-pre-wrap rounded-lg bg-gray-950 p-3 font-mono text-xs text-emerald-400 leading-relaxed">
        {jsonString}
      </pre>
    </div>
  );
}
