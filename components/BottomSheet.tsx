"use client";

import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  PanInfo,
} from "framer-motion";
import { X } from "lucide-react";
import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
  isDark?: boolean;
  title?: string;
  snapPoints?: number[]; // Array of snap heights in pixels, e.g., [200, 400, window.innerHeight - 100]
}

export default function BottomSheet({
  isOpen,
  onClose,
  children,
  isDark = false,
  title,
  snapPoints = [],
}: BottomSheetProps) {
  const y = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close threshold - drag down 150px to dismiss
  const CLOSE_THRESHOLD = 150;

  const handleDragEnd = async (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const currentY = y.get();
    const velocity = info.velocity.y;

    // If dragged down and past threshold, close the sheet
    if (currentY > CLOSE_THRESHOLD || velocity > 500) {
      await animate(y, window.innerHeight, {
        type: "spring",
        stiffness: 300,
        damping: 30,
      });
      onClose();
    } else if (snapPoints.length > 0) {
      // Find nearest snap point
      let nearestSnap = 0;
      let minDistance = Math.abs(currentY - 0);

      snapPoints.forEach((snap) => {
        const distance = Math.abs(currentY - snap);
        if (distance < minDistance) {
          minDistance = distance;
          nearestSnap = snap;
        }
      });

      await animate(y, nearestSnap, {
        type: "spring",
        stiffness: 300,
        damping: 30,
      });
    } else {
      // Reset to initial position
      await animate(y, 0, {
        type: "spring",
        stiffness: 300,
        damping: 30,
      });
    }
  };

  useEffect(() => {
    if (isOpen) {
      y.set(window.innerHeight);
      animate(y, 0, {
        type: "spring",
        stiffness: 300,
        damping: 30,
      });
    }
  }, [isOpen, y]);

  // Lock body scroll when open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const backdropOpacity = useTransform(y, [0, window.innerHeight], [1, 0]);

  const content = (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        style={{ opacity: backdropOpacity }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[100]"
        onClick={onClose}
      />

      {/* Bottom Sheet */}
      <motion.div
        ref={containerRef}
        drag="y"
        dragConstraints={{ top: 0, bottom: window.innerHeight }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ y }}
        className={`fixed bottom-0 left-0 right-0 z-[101] rounded-t-[2rem] shadow-2xl max-h-[90vh] overflow-hidden ${
          isDark ? "bg-slate-900 text-white" : "bg-white text-slate-900"
        }`}
      >
        {/* Drag Handle */}
        <div className="flex justify-center pt-3 pb-2">
          <div
            className={`w-12 h-1.5 rounded-full ${isDark ? "bg-slate-700" : "bg-slate-300"}`}
          />
        </div>

        {/* Header */}
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 dark:border-slate-700">
            <h2 className="text-xl font-bold">{title}</h2>
            <button
              onClick={onClose}
              className={`p-2 rounded-xl transition-colors ${
                isDark
                  ? "hover:bg-slate-800 text-slate-400 hover:text-white"
                  : "hover:bg-slate-100 text-slate-600 hover:text-slate-900"
              }`}
            >
              <X size={24} />
            </button>
          </div>
        )}

        {/* Content */}
        <div className="overflow-y-auto max-h-[calc(90vh-80px)] overscroll-contain">
          {children}
        </div>
      </motion.div>
    </>
  );

  return createPortal(content, document.body);
}
