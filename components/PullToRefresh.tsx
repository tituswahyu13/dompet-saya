"use client";

import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { RefreshCw } from "lucide-react";
import { useState, useRef, useEffect } from "react";

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  isDark?: boolean;
}

export default function PullToRefresh({
  onRefresh,
  children,
  isDark = false,
}: PullToRefreshProps) {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const y = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Threshold to trigger refresh (80px)
  const REFRESH_THRESHOLD = 80;

  // Transform y position into rotation for the icon
  const rotate = useTransform(y, [0, REFRESH_THRESHOLD], [0, 360]);
  const opacity = useTransform(y, [0, REFRESH_THRESHOLD], [0, 1]);

  const handleDragEnd = async () => {
    const currentY = y.get();

    if (currentY >= REFRESH_THRESHOLD && !isRefreshing) {
      setIsRefreshing(true);

      // Animate to threshold position
      await animate(y, REFRESH_THRESHOLD, {
        type: "spring",
        stiffness: 300,
        damping: 30,
      });

      // Trigger refresh
      try {
        await onRefresh();
      } catch (error) {
        console.error("Refresh failed:", error);
      }

      setIsRefreshing(false);

      // Reset position
      await animate(y, 0, {
        type: "spring",
        stiffness: 300,
        damping: 30,
      });
    } else {
      // Reset if threshold not reached
      await animate(y, 0, {
        type: "spring",
        stiffness: 300,
        damping: 30,
      });
    }
  };

  // Check if at top of scroll
  const [canPull, setCanPull] = useState(true);

  useEffect(() => {
    const handleScroll = () => {
      if (containerRef.current) {
        setCanPull(containerRef.current.scrollTop === 0);
      }
    };

    const container = containerRef.current;
    if (container) {
      container.addEventListener("scroll", handleScroll);
      return () => container.removeEventListener("scroll", handleScroll);
    }
  }, []);

  return (
    <div className="relative h-full overflow-hidden">
      {/* Refresh Indicator */}
      <motion.div
        style={{ opacity }}
        className={`absolute top-0 left-0 right-0 flex items-center justify-center pointer-events-none z-50 ${
          isDark ? "text-white" : "text-slate-900"
        }`}
      >
        <motion.div
          style={{ rotate }}
          className="mt-4 p-2 rounded-full bg-white/10 backdrop-blur-sm"
        >
          <RefreshCw size={24} className={isRefreshing ? "animate-spin" : ""} />
        </motion.div>
      </motion.div>

      {/* Draggable Content */}
      <motion.div
        ref={containerRef}
        drag={canPull ? "y" : false}
        dragConstraints={{ top: 0, bottom: 0 }}
        dragElastic={0.5}
        onDragEnd={handleDragEnd}
        style={{ y }}
        className="h-full overflow-y-auto"
      >
        {children}
      </motion.div>
    </div>
  );
}
