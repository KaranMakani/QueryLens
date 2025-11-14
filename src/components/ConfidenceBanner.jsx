export default function ConfidenceBanner({ intent, confidence, onConfirm, onProvideMore }) {
  return (
    <div className="rounded-lg border border-amber-500/30 bg-amber-500/5 p-3">
      <div className="mb-2 flex items-center gap-2">
        <svg
          className="h-4 w-4 text-amber-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 9v2m0 4h.01M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z" />
        </svg>
        <span className="text-sm font-medium text-amber-400">Low Confidence Detection</span>
      </div>
      <p className="mb-3 text-xs text-gray-400">
        We classified this as <span className="text-amber-300">{intent}</span> with{' '}
        <span className="text-amber-300">{Math.round(confidence * 100)}%</span> confidence.
        This may not be accurate.
      </p>
      <div className="flex gap-2">
        <button onClick={onConfirm} className="btn-primary text-xs">
          Looks correct, continue
        </button>
        <button onClick={onProvideMore} className="btn-ghost text-xs">
          Let me provide more info
        </button>
      </div>
    </div>
  );
}
