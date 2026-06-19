export function CartLoading() {
  return (
    <div className="flex flex-col flex-1 min-h-0 overflow-hidden animate-pulse">
      {/* Promo bar skeleton */}
      <div className="flex-shrink-0 h-9 bg-neutral-200" />

      {/* Progress bar skeleton */}
      <div className="flex-shrink-0 px-5 py-3 bg-neutral-50 border-b border-neutral-100 space-y-2">
        <div className="flex justify-between">
          <div className="h-3 bg-neutral-200 rounded w-3/5" />
          <div className="h-3 bg-neutral-200 rounded w-8" />
        </div>
        <div className="h-1.5 bg-neutral-200 rounded-full w-full" />
      </div>

      {/* Cart items skeleton */}
      <div className="flex-1 overflow-hidden px-4 py-4 space-y-3">
        {[1, 2, 3].map((i) => (
          <div
            key={i}
            className="flex gap-3 p-2.5 rounded-2xl bg-white border border-neutral-100"
          >
            {/* Thumbnail */}
            <div className="w-[72px] h-[72px] rounded-xl bg-neutral-200 flex-shrink-0" />
            {/* Content */}
            <div className="flex-1 space-y-2 py-1">
              <div className="h-3 bg-neutral-200 rounded w-4/5" />
              <div className="h-2.5 bg-neutral-100 rounded w-2/5" />
              <div className="flex items-center justify-between pt-1">
                <div className="h-6 bg-neutral-200 rounded-xl w-20" />
                <div className="h-3.5 bg-neutral-200 rounded w-14" />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer skeleton */}
      <div className="flex-shrink-0 border-t border-neutral-100">
        <div className="px-5 pt-4 pb-3 bg-neutral-50 border-b border-neutral-100 space-y-3">
          <div className="flex justify-between">
            <div className="h-3.5 bg-neutral-200 rounded w-16" />
            <div className="h-4 bg-neutral-200 rounded w-24" />
          </div>
          <div className="h-9 bg-neutral-100 rounded-xl w-full" />
        </div>
        <div className="px-5 pt-3 pb-5 space-y-2">
          <div className="h-12 bg-neutral-200 rounded-2xl w-full" />
          <div className="h-3 bg-neutral-100 rounded w-1/2 mx-auto" />
        </div>
      </div>
    </div>
  );
}
