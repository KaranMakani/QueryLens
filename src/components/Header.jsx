export default function Header({ onClearSession }) {
  return (
    <header className="border-b border-gray-800/60 bg-gray-950">
      <div className="flex items-center justify-between px-5 py-2.5">
        <div className="flex items-center gap-3">
          <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-brand-600">
            <svg className="h-4 w-4 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <div className="flex items-baseline gap-2">
            <h1 className="text-sm font-bold text-white tracking-tight">QueryLens</h1>
            <span className="text-[10px] font-medium text-gray-600">Web3 Support Triage</span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded border border-amber-500/20 bg-amber-500/5 px-2 py-0.5 text-[10px] font-semibold text-amber-500/70">
            DEMO
          </span>
          <button
            onClick={onClearSession}
            className="rounded-md px-2.5 py-1 text-[11px] text-gray-500 transition-colors hover:bg-gray-800 hover:text-gray-300"
            title="Clear conversation"
          >
            <svg className="mr-1 inline h-3 w-3" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
            </svg>
            Clear
          </button>
        </div>
      </div>
    </header>
  );
}
