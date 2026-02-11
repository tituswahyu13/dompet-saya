"use client";

interface ChartSkeletonProps {
  height?: string;
  isDark?: boolean;
}

export default function ChartSkeleton({
  height = "h-64",
  isDark = false,
}: ChartSkeletonProps) {
  return (
    <div
      className={`${height} rounded-2xl p-6 ${isDark ? "bg-slate-800/50" : "bg-white/50"}`}
    >
      <div className="flex items-end justify-around h-full gap-2">
        {/* Animated Bars */}
        {[60, 80, 45, 90, 70, 55].map((height, i) => (
          <div
            key={i}
            className={`w-full rounded-t-lg ${isDark ? "bg-slate-700" : "bg-slate-200"}`}
            style={{
              height: `${height}%`,
              backgroundImage: isDark
                ? "linear-gradient(90deg, #334155 0%, #475569 50%, #334155 100%)"
                : "linear-gradient(90deg, #e2e8f0 0%, #f1f5f9 50%, #e2e8f0 100%)",
              backgroundSize: "200% 100%",
              animation: `shimmer 2s infinite ${i * 0.2}s`,
            }}
          />
        ))}
      </div>
    </div>
  );
}
