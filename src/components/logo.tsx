'use client';

import { motion } from 'framer-motion';
import { Building2 } from 'lucide-react';
import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
  iconOnly?: boolean;
};

export default function Logo({ className, iconOnly = false }: LogoProps) {
  return (
    <motion.div 
      className={cn("flex items-center gap-3", className)}
      whileHover={{ scale: 1.05 }}
      transition={{ type: "spring", stiffness: 400 }}
    >
      <div className="bg-primary p-2 rounded-lg shadow-soft">
        <Building2 className="h-5 w-5 text-white" />
      </div>
      {!iconOnly && (
        <h1 className="font-headline text-2xl font-bold text-foreground">
          MDP
        </h1>
      )}
    </motion.div>
  );
}
