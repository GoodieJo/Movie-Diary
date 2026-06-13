export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8">
      <div className="text-center mb-8 animate-pulse">
        <div className="h-8 w-48 bg-[#e8dcc8] rounded mx-auto mb-2" />
        <div className="h-5 w-64 bg-[#e8dcc8] rounded mx-auto" />
      </div>
      <div className="space-y-3">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="diary-card p-4 flex gap-4 animate-pulse">
            <div className="w-16 h-24 rounded-lg bg-[#e8dcc8] flex-shrink-0" />
            <div className="flex-1 space-y-2 pt-1">
              <div className="h-4 bg-[#e8dcc8] rounded w-3/4" />
              <div className="h-3 bg-[#e8dcc8] rounded w-1/3" />
              <div className="h-3 bg-[#e8dcc8] rounded w-1/2" />
              <div className="h-3 bg-[#e8dcc8] rounded w-2/3" />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
