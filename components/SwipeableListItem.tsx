"use client";

import {
  motion,
  useMotionValue,
  useTransform,
  animate,
  PanInfo,
} from "framer-motion";
import { Trash2, Edit3 } from "lucide-react";
import { ReactNode, useRef } from "react";

interface SwipeableListItemProps {
  children: ReactNode;
  onEdit?: () => void;
  onDelete?: () => void;
  isDark?: boolean;
}

export default function SwipeableListItem({
  children,
  onEdit,
  onDelete,
  isDark = false,
}: SwipeableListItemProps) {
  const x = useMotionValue(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Swipe thresholds
  const SWIPE_THRESHOLD = 100; // px to trigger action
  const MAX_SWIPE = 150; // Maximum swipe distance

  // Transform x position into background opacity
  const editOpacity = useTransform(x, [0, SWIPE_THRESHOLD], [0, 1]);
  const deleteOpacity = useTransform(x, [-SWIPE_THRESHOLD, 0], [1, 0]);

  const handleDragEnd = async (
    _event: MouseEvent | TouchEvent | PointerEvent,
    info: PanInfo,
  ) => {
    const currentX = x.get();
    const velocity = info.velocity.x;

    // Swipe right (Edit)
    if (currentX > SWIPE_THRESHOLD || velocity > 500) {
      // Trigger haptic feedback if available
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(50);
      }

      // Animate to reveal edit action
      await animate(x, MAX_SWIPE, {
        type: "spring",
        stiffness: 300,
        damping: 30,
      });

      // Trigger edit callback
      if (onEdit) {
        onEdit();
      }

      // Reset position
      await animate(x, 0, {
        type: "spring",
        stiffness: 300,
        damping: 30,
      });
    }
    // Swipe left (Delete)
    else if (currentX < -SWIPE_THRESHOLD || velocity < -500) {
      // Trigger haptic feedback if available
      if (typeof window !== "undefined" && "vibrate" in navigator) {
        navigator.vibrate(50);
      }

      // Animate to reveal delete action
      await animate(x, -MAX_SWIPE, {
        type: "spring",
        stiffness: 300,
        damping: 30,
      });

      // Trigger delete callback
      if (onDelete) {
        onDelete();
      }

      // Reset position
      await animate(x, 0, {
        type: "spring",
        stiffness: 300,
        damping: 30,
      });
    }
    // Not enough swipe - reset
    else {
      await animate(x, 0, {
        type: "spring",
        stiffness: 300,
        damping: 30,
      });
    }
  };

  return (
    <div ref={containerRef} className="relative overflow-hidden">
      {/* Edit Action Background (Right Swipe) */}
      <motion.div
        style={{ opacity: editOpacity }}
        className="absolute inset-0 bg-blue-500 flex items-center justify-start px-6"
      >
        <Edit3 size={24} className="text-white" />
      </motion.div>

      {/* Delete Action Background (Left Swipe) */}
      <motion.div
        style={{ opacity: deleteOpacity }}
        className="absolute inset-0 bg-red-500 flex items-center justify-end px-6"
      >
        <Trash2 size={24} className="text-white" />
      </motion.div>

      {/* Swipeable Content */}
      <motion.div
        drag="x"
        dragConstraints={{ left: -MAX_SWIPE, right: MAX_SWIPE }}
        dragElastic={0.2}
        onDragEnd={handleDragEnd}
        style={{ x }}
        className={`relative z-10 ${isDark ? "bg-slate-900" : "bg-white"}`}
      >
        {children}
      </motion.div>
    </div>
  );
}
