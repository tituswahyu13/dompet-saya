"use client";

interface TransactionSkeletonProps {
  count?: number;
  isDark?: boolean;
}

export default function TransactionSkeleton({
  count = 5,
  isDark = false,
}: TransactionSkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`flex items-center justify-between p-4 rounded-xl ${
            isDark ? "bg-slate-800/30" : "bg-slate-50"
          }`}
        >
          {/* Date Skeleton */}
          <div className="flex items-center gap-4">
            <div
              className={`w-16 h-16 rounded-xl ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
              style={{
                backgroundImage: isDark
                  ? "linear-gradient(90deg, #334155 0%, #475569 50%, #334155 100%)"
                  : "linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 50%, #e2e8f0 100%)",
                backgroundSize: "200% 100%",
                animation: "shimmer 2s infinite",
              }}
            />

            {/* Description Skeleton */}
            <div className="space-y-2">
              <div
                className={`h-4 w-40 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                style={{
                  backgroundImage: isDark
                    ? "linear-gradient(90deg, #334155 0%, #475569 50%, #334155 100%)"
                    : "linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 50%, #e2e8f0 100%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2s infinite",
                }}
              />
              <div
                className={`h-3 w-24 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
                style={{
                  backgroundImage: isDark
                    ? "linear-gradient(90deg, #334155 0%, #475569 50%, #334155 100%)"
                    : "linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 50%, #e2e8f0 100%)",
                  backgroundSize: "200% 100%",
                  animation: "shimmer 2s infinite",
                }}
              />
            </div>
          </div>

          {/* Amount Skeleton */}
          <div
            className={`h-6 w-24 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
            style={{
              backgroundImage: isDark
                ? "linear-gradient(90deg, #334155 0%, #475569 50%, #334155 100%)"
                : "linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 50%, #e2e8f0 100%)",
              backgroundSize: "200% 100%",
              animation: "shimmer 2s infinite",
            }}
          />
        </div>
      ))}
    </>
  );
}
