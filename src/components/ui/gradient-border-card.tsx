'use client';

import * as React from "react";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

interface GradientBorderCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  hover?: boolean;
}

export const GradientBorderCard = React.forwardRef<
  HTMLDivElement,
  GradientBorderCardProps
>(({ className, children, hover = true, ...props }, ref) => {
  return (
    <motion.div
      ref={ref}
      className={cn(
        "relative rounded-xl bg-gradient-to-br from-primary/10 via-accent/10 to-primary/10 p-[1px]",
        "overflow-hidden",
        className
      )}
      whileHover={hover ? { scale: 1.02 } : {}}
      transition={{ duration: 0.2 }}
      {...props}
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-accent/20 to-primary/20 opacity-0 hover:opacity-100 transition-opacity duration-300" />
      <div className="relative rounded-xl bg-card p-4 md:p-6 h-full">
        {children}
      </div>
    </motion.div>
  );
});

GradientBorderCard.displayName = "GradientBorderCard";
