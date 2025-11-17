import { formatTriageText } from '../utils/formatters';

export default function TriageOutput({ triage, intent, entities, reply }) {
  const textOutput = formatTriageText(triage, intent, entities);

  return (
    <div className="card space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-brand-400">Triage Result</h3>
        <div className="flex items-center gap-2">
          {reply && (
            <span className="rounded bg-brand-500/10 px-2 py-0.5 text-xs text-brand-300">
              Reply Ready
            </span>
          )}
        </div>
      </div>

      <div className="space-y-2">
        {/* Issue Type + Confidence */}
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-gray-200">
            {triage.issueType}
          </span>
          <span
            className={`badge ${
              triage.confidence === 'High'
                ? 'badge-high'
                : triage.confidence === 'Medium'
                ? 'badge-medium'
                : 'badge-low'
            }`}
          >
            {triage.confidence} confidence
          </span>
        </div>

      {/* Structured Text View */}
      <pre className="whitespace-pre-wrap rounded-lg bg-gray-950 p-3 font-mono text-xs text-gray-300 leading-relaxed">
{textOutput}
      </pre>

      {/* Suggested Reply Highlight */}
      {reply && (
        <div className="rounded-lg border border-brand-500/20 bg-brand-500/5 p-3">
          <p className="mb-1 text-xs font-medium text-brand-400">Suggested Reply</p>
          <p className="text-sm text-gray-200">{reply}</p>
        </div>
      )}
    </div>
    </div>
  );
}
