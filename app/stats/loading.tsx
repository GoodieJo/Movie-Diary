export default function Loading() {
  return (
    <div className="max-w-2xl mx-auto px-4 py-8 animate-pulse">
      <div className="text-center mb-8">
        <div className="h-8 w-32 bg-[#e8dcc8] rounded mx-auto mb-2" />
        <div className="h-5 w-48 bg-[#e8dcc8] rounded mx-auto" />
      </div>
      <div className="grid grid-cols-2 gap-4 mb-6">
        {[...Array(4)].map((_, i) => <div key={i} className="h-28 bg-[#e8dcc8] rounded-xl" />)}
      </div>
      <div className="h-48 bg-[#e8dcc8] rounded-xl mb-4" />
      <div className="h-48 bg-[#e8dcc8] rounded-xl mb-4" />
      <div className="h-48 bg-[#e8dcc8] rounded-xl" />
    </div>
  );
}
