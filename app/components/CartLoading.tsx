export function CartLoading() {
  return (
    <div className="flex flex-col flex-1 px-5 py-4 space-y-4 animate-pulse">
      {/* Skeleton cart items */}
      {[1, 2, 3].map((i) => (
        <div
          key={i}
          className="flex gap-3.5 p-3 rounded-2xl bg-neutral-50 border border-neutral-100"
        >
          {/* Image skeleton */}
          <div className="w-[78px] h-[78px] rounded-xl bg-neutral-200 flex-shrink-0" />

          {/* Content skeleton */}
          <div className="flex-1 space-y-2.5 py-1">
            <div className="h-3.5 bg-neutral-200 rounded-lg w-4/5" />
            <div className="h-3 bg-neutral-100 rounded-lg w-2/5" />
            <div className="flex items-center justify-between pt-1">
              <div className="h-7 bg-neutral-200 rounded-xl w-24" />
              <div className="h-4 bg-neutral-200 rounded-lg w-16" />
            </div>
          </div>
        </div>
      ))}

      {/* Summary skeleton */}
      <div className="mt-auto pt-4 border-t border-neutral-100 space-y-3">
        <div className="flex items-center justify-between">
          <div className="h-3 bg-neutral-200 rounded-lg w-20" />
          <div className="h-4 bg-neutral-200 rounded-lg w-24" />
        </div>
        <div className="h-12 bg-neutral-200 rounded-2xl w-full" />
      </div>
    </div>
  );
}
