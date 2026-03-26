interface Props {
  page: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export function Pagination({ page, totalPages, onPageChange }: Props) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-center gap-3 py-4">
      <button
        onClick={() => onPageChange(page - 1)}
        disabled={page <= 1}
        className="px-3 py-1.5 rounded border border-slate-200 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        ← Prev
      </button>
      <span className="text-sm text-slate-500">
        {page} / {totalPages}
      </span>
      <button
        onClick={() => onPageChange(page + 1)}
        disabled={page >= totalPages}
        className="px-3 py-1.5 rounded border border-slate-200 text-sm text-slate-600 hover:bg-slate-100 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
      >
        Next →
      </button>
    </div>
  );
}
