export default function Loading() {
  return (
    <div className="max-w-xl mx-auto px-4 py-8 animate-pulse space-y-10">
      <div className="text-center">
        <div className="h-8 w-40 bg-[#e8dcc8] rounded mx-auto mb-2" />
        <div className="h-5 w-56 bg-[#e8dcc8] rounded mx-auto" />
      </div>
      {[...Array(2)].map((_, i) => (
        <div key={i}>
          <div className="h-10 w-20 bg-[#e8dcc8] rounded mb-5" />
          <div className="pl-6 space-y-3 border-l-2 border-[#f0e6d2]">
            {[...Array(3)].map((_, j) => (
              <div key={j} className="diary-card p-3 flex items-center gap-3">
                <div className="w-10 h-14 rounded bg-[#e8dcc8] flex-shrink-0" />
                <div className="flex-1 space-y-1.5">
                  <div className="h-3.5 bg-[#e8dcc8] rounded w-3/4" />
                  <div className="h-3 bg-[#e8dcc8] rounded w-1/3" />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
