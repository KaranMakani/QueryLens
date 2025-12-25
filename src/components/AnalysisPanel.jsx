import { useState } from 'react';
import { getIntentCategory } from '../utils/decisionEngine';

const INTENT_COLORS = {
  missing_funds: { bg: 'bg-purple-500/15', border: 'border-purple-500/30', text: 'text-purple-400', dot: 'bg-purple-500' },
  wrong_network: { bg: 'bg-amber-500/15', border: 'border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-500' },
  bridge_delay: { bg: 'bg-blue-500/15', border: 'border-blue-500/30', text: 'text-blue-400', dot: 'bg-blue-500' },
  wallet_confusion: { bg: 'bg-emerald-500/15', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-500' },
  scam_risk: { bg: 'bg-red-500/15', border: 'border-red-500/30', text: 'text-red-400', dot: 'bg-red-500' },
  out_of_scope: { bg: 'bg-gray-500/15', border: 'border-gray-500/30', text: 'text-gray-400', dot: 'bg-gray-500' },
};

const ENTITY_ICONS = {
  network: '🔗',
  token: '🪙',
  platform: '🏢',
  transactionHash: '📄',
  walletAddress: '👛',
};

const ENTITY_LABELS = {
  network: 'Network',
  token: 'Token',
  platform: 'Platform',
  transactionHash: 'Tx Hash',
  walletAddress: 'Wallet',
};

function ConfidenceMeter({ confidence }) {
  const pct = Math.round(confidence * 100);
  const color = pct >= 85 ? 'bg-green-500' : pct >= 70 ? 'bg-amber-500' : 'bg-red-500';
  const label = pct >= 85 ? 'High' : pct >= 70 ? 'Medium' : 'Low';

  return (
    <div>
      <div className="mb-1.5 flex items-center justify-between">
        <span className="text-[11px] font-medium text-gray-500">Confidence</span>
        <span className={`text-[11px] font-semibold ${pct >= 85 ? 'text-green-400' : pct >= 70 ? 'text-amber-400' : 'text-red-400'}`}>
          {label} — {pct}%
        </span>
      </div>
      <div className="h-1.5 overflow-hidden rounded-full bg-gray-800">
        <div className={`h-full rounded-full ${color} transition-all duration-700`} style={{ width: `${pct}%` }} />
      </div>
    </div>
  );
}

// issue tags — AI-generated descriptive labels for quick scanning
function IssueTags({ tags }) {
  if (!tags || tags.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-1.5">
      {tags.map((tag) => (
        <span
          key={tag}
          className="inline-flex items-center gap-1 rounded-full bg-brand-500/10 border border-brand-500/20 px-2.5 py-0.5 text-[11px] font-medium text-brand-300"
        >
          <span className="h-1.5 w-1.5 rounded-full bg-brand-400" />
          {tag}
        </span>
      ))}
    </div>
  );
}

// full data table with copy — all values visible and copyable for the moderator
function EntityDataTable({ entities }) {
  const [copiedKey, setCopiedKey] = useState(null);
  const fields = ['network', 'token', 'platform', 'transactionHash', 'walletAddress'];

  const handleCopy = (key, val) => {
    navigator.clipboard.writeText(val);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  return (
    <div className="rounded-lg border border-gray-800/60 bg-gray-800/15 divide-y divide-gray-800/40">
      {fields.map((key) => {
        const val = entities[key];
        return (
          <div key={key} className="flex items-start gap-3 px-3.5 py-2.5">
            <span className="flex-shrink-0 pt-0.5 text-[10px]">{ENTITY_ICONS[key]}</span>
            <div className="min-w-0 flex-1">
              <p className="text-[9px] font-semibold uppercase tracking-wider text-gray-600">{ENTITY_LABELS[key]}</p>
              {val ? (
                <p className="mt-0.5 break-all font-mono text-xs text-gray-300">{val}</p>
              ) : (
                <p className="mt-0.5 text-xs text-amber-500/40 italic">not provided</p>
              )}
            </div>
            {val && (
              <button
                onClick={() => handleCopy(key, val)}
                className={`flex-shrink-0 rounded px-1.5 py-0.5 text-[10px] transition-colors ${
                  copiedKey === key
                    ? 'bg-green-500/10 text-green-400'
                    : 'text-gray-600 hover:bg-gray-700/50 hover:text-gray-400'
                }`}
                title="Copy"
              >
                {copiedKey === key ? (
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5" />
                  </svg>
                ) : (
                  <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                    <rect x="9" y="9" width="13" height="13" rx="2" />
                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                  </svg>
                )}
              </button>
            )}
          </div>
        );
      })}
    </div>
  );
}

function SuggestedReplyCard({ reply }) {
  const [copied, setCopied] = useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(reply);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="rounded-lg border border-gray-700/40 bg-gray-800/20 p-4">
      <div className="mb-2.5 flex items-center justify-between">
        <span className="text-[11px] font-semibold uppercase tracking-wider text-gray-500">Suggested Reply</span>
        <button
          onClick={handleCopy}
          className={`flex items-center gap-1 rounded px-2 py-1 text-[11px] transition-colors ${
            copied
              ? 'bg-green-500/10 text-green-400'
              : 'text-gray-500 hover:bg-gray-700/50 hover:text-gray-300'
          }`}
        >
          {copied ? (
            <>
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path d="M20 6L9 17l-5-5" />
              </svg>
              Copied
            </>
          ) : (
            <>
              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="9" y="9" width="13" height="13" rx="2" />
                <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
              </svg>
              Copy
            </>
          )}
        </button>
      </div>
      <p className="text-sm leading-relaxed text-gray-300">{reply}</p>
    </div>
  );
}

function JsonHighlight({ data }) {
  const formatted = JSON.stringify(data, null, 2);
  const highlighted = formatted
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"([^"]+)":/g, '<span style="color:#818cf8">"$1"</span>:')
    .replace(/: "([^"]*)"/g, ': <span style="color:#34d399">"$1"</span>')
    .replace(/: (\d+\.?\d*)/g, ': <span style="color:#fbbf24">$1</span>')
    .replace(/: (true|false|null)/g, ': <span style="color:#f87171">$1</span>');

  return (
    <pre
      className="overflow-auto rounded-lg border border-gray-800 bg-gray-900/60 p-4 font-mono text-xs leading-relaxed text-gray-300"
      dangerouslySetInnerHTML={{ __html: highlighted }}
    />
  );
}

export default function AnalysisPanel({
  triageData,
  viewMode,
  onViewModeChange,
  confidenceBanner,
  onConfirmConfidence,
  onProvideMoreInfo,
  showScamWarning,
  isLoading,
}) {
  // Loading with no previous data
  if (isLoading && !triageData && !confidenceBanner && !showScamWarning) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 flex gap-1.5 justify-center">
            <div className="h-2 w-2 animate-bounce rounded-full bg-brand-400" style={{ animationDelay: '0ms' }} />
            <div className="h-2 w-2 animate-bounce rounded-full bg-brand-400" style={{ animationDelay: '150ms' }} />
            <div className="h-2 w-2 animate-bounce rounded-full bg-brand-400" style={{ animationDelay: '300ms' }} />
          </div>
          <p className="text-sm font-medium text-gray-400">Analyzing query...</p>
          <p className="mt-1 text-xs text-gray-600">Running 4-stage pipeline</p>
        </div>
      </div>
    );
  }

  // Empty state
  if (!triageData && !confidenceBanner && !showScamWarning) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="max-w-xs text-center">
          <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl border border-gray-800 bg-gray-800/30">
            <svg className="h-7 w-7 text-gray-600" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
          </div>
          <h3 className="mb-1 text-sm font-medium text-gray-400">Analysis Panel</h3>
          <p className="text-xs text-gray-600">
            Triage analysis will appear here after you submit a query
          </p>
        </div>
      </div>
    );
  }

  // Scam warning
  if (showScamWarning) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="max-w-md text-center">
          <div className="rounded-xl border border-red-500/25 bg-red-500/5 p-8">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-red-500/15">
              <svg className="h-7 w-7 text-red-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
                <path d="M12 9v4M12 17h.01" />
              </svg>
            </div>
            <h3 className="mb-2 text-lg font-semibold text-red-400">Scam Risk Escalation</h3>
            <p className="mb-4 text-sm text-gray-400">
              Multiple out-of-scope queries detected. This user may be attempting social engineering.
            </p>
            <div className="rounded-lg border border-red-500/20 bg-red-500/5 p-4 text-left">
              <p className="mb-1 text-xs font-semibold text-red-300">Recommended Action</p>
              <p className="text-xs text-gray-500">Escalate to senior moderator for review. Do not engage further without oversight.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Confidence prompt
  if (confidenceBanner && !triageData) {
    return (
      <div className="flex flex-1 items-center justify-center">
        <div className="max-w-md">
          <div className="rounded-xl border border-amber-500/20 bg-amber-500/5 p-8 text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-amber-500/15">
              <svg className="h-6 w-6 text-amber-400" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="mb-1 text-base font-semibold text-amber-300">Low Confidence Detection</h3>
            <p className="mb-4 text-sm text-gray-400">
              Detected as <span className="font-medium text-amber-300">{confidenceBanner.intent}</span> with only{' '}
              <span className="font-mono text-amber-300">{Math.round(confidenceBanner.confidence * 100)}%</span> confidence
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={onConfirmConfidence}
                className="rounded-lg bg-brand-600 px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-brand-500"
              >
                Looks correct, continue
              </button>
              <button
                onClick={onProvideMoreInfo}
                className="rounded-lg border border-gray-700 px-5 py-2.5 text-sm font-medium text-gray-400 transition-colors hover:bg-gray-800 hover:text-gray-200"
              >
                Let me provide more info
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // Full triage analysis
  if (!triageData) return null;

  const intent = triageData.intent;
  const colors = INTENT_COLORS[intent] || INTENT_COLORS.out_of_scope;
  const category = getIntentCategory(intent);
  const triage = triageData.triage;

  return (
    <div className="flex flex-1 flex-col overflow-y-auto">
      <div className="flex-1 p-6">
        <div className="mx-auto max-w-2xl space-y-5">
          {/* Loading overlay when re-querying */}
          {isLoading && (
            <div className="mb-4 flex items-center gap-2 rounded-lg border border-brand-500/20 bg-brand-500/5 px-4 py-2.5">
              <div className="flex gap-1">
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-400" style={{ animationDelay: '0ms' }} />
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-400" style={{ animationDelay: '150ms' }} />
                <div className="h-1.5 w-1.5 animate-bounce rounded-full bg-brand-400" style={{ animationDelay: '300ms' }} />
              </div>
              <span className="text-xs text-brand-300">Processing new query...</span>
            </div>
          )}

          {/* Intent Badge + Confidence + Tags */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className={`inline-flex items-center gap-2 rounded-full border px-3.5 py-1.5 ${colors.bg} ${colors.border}`}>
                <span className={`h-2 w-2 rounded-full ${colors.dot}`} />
                <span className={`text-xs font-bold tracking-wide ${colors.text}`}>
                  {category?.label || intent}
                </span>
              </div>
              <div className="flex items-center gap-1 rounded-lg bg-gray-800/50 p-0.5">
                <button
                  onClick={() => onViewModeChange('text')}
                  className={`rounded-md px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                    viewMode === 'text' ? 'bg-brand-600 text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  Triage
                </button>
                <button
                  onClick={() => onViewModeChange('json')}
                  className={`rounded-md px-3 py-1.5 text-[11px] font-semibold transition-colors ${
                    viewMode === 'json' ? 'bg-brand-600 text-white' : 'text-gray-500 hover:text-gray-300'
                  }`}
                >
                  JSON
                </button>
              </div>
            </div>
            <ConfidenceMeter confidence={triageData.confidence} />
            <IssueTags tags={triage?.tags} />
          </div>

          {viewMode === 'text' ? (
            <>
              {/* Entity Data — full values with copy */}
              <div>
                <h4 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Extracted Data
                </h4>
                <EntityDataTable entities={triageData.entities} />
              </div>

              {/* Triage Breakdown */}
              <div>
                <h4 className="mb-2.5 text-[11px] font-semibold uppercase tracking-wider text-gray-500">
                  Triage Breakdown
                </h4>
                <div className="rounded-lg border border-gray-800/60 bg-gray-800/15 divide-y divide-gray-800/40">
                  <BreakdownRow label="Situation" value={triage?.userSituation} />
                  <BreakdownRow label="Likely Cause" value={triage?.likelyCause} />
                  <BreakdownRow
                    label="Missing Info"
                    value={
                      triage?.missingInfo?.length > 0 ? (
                        <div className="flex flex-wrap gap-1.5">
                          {triage.missingInfo.map((f) => (
                            <span
                              key={f}
                              className="inline-flex items-center gap-1 rounded border border-amber-500/20 bg-amber-500/5 px-2 py-0.5 text-xs text-amber-400"
                            >
                              <svg className="h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                <path d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              {f}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="text-xs text-gray-600">None — all fields captured</span>
                      )
                    }
                  />
                  <BreakdownRow label="Mod Action" value={triage?.modAction} />
                </div>
              </div>

              {/* Suggested Reply */}
              <SuggestedReplyCard reply={triageData.reply} />
            </>
          ) : (
            <JsonHighlight
              data={{
                intent: triageData.intent,
                confidence: triageData.confidence,
                entities: triageData.entities,
                reasoning: triageData.reasoning,
                triage: triageData.triage,
              }}
            />
          )}
        </div>
      </div>
    </div>
  );
}

function BreakdownRow({ label, value }) {
  return (
    <div className="px-4 py-3">
      <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-gray-500">{label}</p>
      {typeof value === 'string' ? (
        <p className="text-sm leading-relaxed text-gray-300">{value || '—'}</p>
      ) : (
        value
      )}
    </div>
  );
}
