export default function ScamWarning() {
  return (
    <div className="rounded-lg border border-red-500/30 bg-red-500/5 p-3">
      <div className="flex items-center gap-2">
        <svg
          className="h-5 w-5 text-red-400"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        </svg>
        <div>
          <p className="text-sm font-semibold text-red-400">
            Potential Scam Alert
          </p>
          <p className="text-xs text-gray-400">
            Multiple out-of-scope messages detected. This could be a suspicious
            interaction — moderators should review and consider taking action.
          </p>
        </div>
      </div>
    </div>
  );
}
