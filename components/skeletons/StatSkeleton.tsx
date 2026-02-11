"use client";

interface StatSkeletonProps {
  isDark?: boolean;
}

export default function StatSkeleton({ isDark = false }: StatSkeletonProps) {
  return (
    <div
      className={`rounded-2xl p-6 ${isDark ? "bg-slate-800/50" : "bg-white/50"}`}
    >
      {/* Label Skeleton */}
      <div
        className={`h-4 w-24 rounded mb-3 ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
        style={{
          backgroundImage: isDark
            ? "linear-gradient(90deg, #334155 0%, #475569 50%, #334155 100%)"
            : "linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 50%, #e2e8f0 100%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 2s infinite",
        }}
      />

      {/* Number Skeleton */}
      <div
        className={`h-8 w-32 rounded ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
        style={{
          backgroundImage: isDark
            ? "linear-gradient(90deg, #334155 0%, #475569 50%, #334155 100%)"
            : "linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 50%, #e2e8f0 100%)",
          backgroundSize: "200% 100%",
          animation: "shimmer 2s infinite",
        }}
      />
    </div>
  );
}
