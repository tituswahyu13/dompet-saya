"use client";

interface CardSkeletonProps {
  height?: string;
  className?: string;
  isDark?: boolean;
}

export default function CardSkeleton({
  height = "h-32",
  className = "",
  isDark = false,
}: CardSkeletonProps) {
  return (
    <div
      className={`${height} ${className} rounded-2xl overflow-hidden relative ${
        isDark ? "bg-slate-800" : "bg-slate-200"
      }`}
    >
      <div
        className={`absolute inset-0 ${
          isDark
            ? "bg-gradient-to-r from-slate-800 via-slate-700 to-slate-800"
            : "bg-gradient-to-r from-slate-200 via-slate-100 to-slate-200"
        } animate-shimmer`}
        style={{
          backgroundSize: "200% 100%",
          animation: "shimmer 2s infinite",
        }}
      />
    </div>
  );
}
