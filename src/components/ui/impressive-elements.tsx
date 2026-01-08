'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { cn } from '@/lib/utils';

interface GlassCardProps {
  children: ReactNode;
  className?: string;
  hover?: boolean;
}

export function GlassCard({ children, className, hover = true }: GlassCardProps) {
  return (
    <motion.div
      className={cn(
        'relative overflow-hidden rounded-2xl border border-white/10',
        'bg-gradient-to-br from-white/80 to-white/40 backdrop-blur-xl',
        'shadow-2xl',
        hover && 'hover:shadow-primary/20 transition-all duration-300',
        className
      )}
      whileHover={hover ? { y: -4, scale: 1.01 } : {}}
      transition={{ type: 'spring', stiffness: 300 }}
    >
      {/* Gradient overlay */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-transparent to-accent/5 pointer-events-none" />
      
      {/* Shimmer effect */}
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent opacity-0 hover:opacity-100 transition-opacity duration-700 pointer-events-none" 
           style={{ transform: 'translateX(-100%)', animation: 'shimmer 3s infinite' }} 
      />
      
      <div className="relative z-10">{children}</div>
    </motion.div>
  );
}

interface FloatingElementProps {
  children: ReactNode;
  delay?: number;
  duration?: number;
  className?: string;
}

export function FloatingElement({ children, delay = 0, duration = 3, className }: FloatingElementProps) {
  return (
    <motion.div
      className={className}
      animate={{
        y: [0, -10, 0],
        rotate: [0, 2, 0, -2, 0],
      }}
      transition={{
        duration,
        delay,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
    >
      {children}
    </motion.div>
  );
}

interface GradientTextProps {
  children: ReactNode;
  className?: string;
  animated?: boolean;
}

export function GradientText({ children, className, animated = false }: GradientTextProps) {
  return (
    <span
      className={cn(
        'bg-gradient-to-r from-primary via-accent to-primary bg-clip-text text-transparent',
        animated && 'bg-[length:200%_auto] animate-shimmer',
        className
      )}
    >
      {children}
    </span>
  );
}

interface ParticleBackgroundProps {
  count?: number;
}

export function ParticleBackground({ count = 20 }: ParticleBackgroundProps) {
  return (
    <div className="absolute inset-0 overflow-hidden pointer-events-none">
      {Array.from({ length: count }).map((_, i) => (
        <motion.div
          key={i}
          className="absolute w-1 h-1 bg-primary/30 rounded-full"
          style={{
            left: `${Math.random() * 100}%`,
            top: `${Math.random() * 100}%`,
          }}
          animate={{
            y: [0, -30, 0],
            x: [0, Math.random() * 20 - 10, 0],
            opacity: [0.2, 0.5, 0.2],
            scale: [1, 1.5, 1],
          }}
          transition={{
            duration: 3 + Math.random() * 2,
            repeat: Infinity,
            delay: Math.random() * 2,
            ease: 'easeInOut',
          }}
        />
      ))}
    </div>
  );
}

interface MetricCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: ReactNode;
  trend?: 'up' | 'down';
  trendValue?: string;
  color?: 'primary' | 'accent' | 'success' | 'warning';
}

export function MetricCard({ title, value, subtitle, icon, trend, trendValue, color = 'primary' }: MetricCardProps) {
  const colorClasses = {
    primary: 'from-primary/20 to-primary/5 text-primary',
    accent: 'from-accent/20 to-accent/5 text-accent',
    success: 'from-emerald-500/20 to-emerald-500/5 text-emerald-500',
    warning: 'from-orange-500/20 to-orange-500/5 text-orange-500',
  };

  return (
    <motion.div
      className="relative overflow-hidden rounded-xl bg-card border border-border/50 p-6 shadow-soft hover:shadow-medium transition-all group"
      whileHover={{ y: -4 }}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
    >
      {/* Background gradient */}
      <div className={cn('absolute top-0 right-0 w-32 h-32 rounded-full blur-3xl opacity-20 transition-opacity group-hover:opacity-30', 
        `bg-gradient-to-br ${colorClasses[color]}`)} 
      />
      
      <div className="relative z-10">
        <div className="flex items-start justify-between mb-4">
          <div>
            <p className="text-sm text-muted-foreground font-medium">{title}</p>
            <h3 className="text-3xl font-bold mt-1 bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text text-transparent">
              {value}
            </h3>
          </div>
          {icon && (
            <div className={cn(
              'p-3 rounded-xl bg-gradient-to-br shadow-soft',
              colorClasses[color]
            )}>
              {icon}
            </div>
          )}
        </div>
        
        {(subtitle || trendValue) && (
          <div className="flex items-center gap-2 text-sm">
            {trend && trendValue && (
              <span className={cn(
                'font-medium',
                trend === 'up' ? 'text-emerald-500' : 'text-red-500'
              )}>
                {trend === 'up' ? '↑' : '↓'} {trendValue}
              </span>
            )}
            {subtitle && (
              <span className="text-muted-foreground">{subtitle}</span>
            )}
          </div>
        )}
      </div>
    </motion.div>
  );
}

interface AnimatedCounterProps {
  value: number;
  duration?: number;
  className?: string;
  suffix?: string;
  prefix?: string;
}

export function AnimatedCounter({ value, duration = 1, className, suffix = '', prefix = '' }: AnimatedCounterProps) {
  return (
    <motion.span
      className={className}
      initial={{ opacity: 0, scale: 0.5 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.5 }}
    >
      <motion.span
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration }}
      >
        {prefix}
        <motion.span
          initial={{ y: 20 }}
          animate={{ y: 0 }}
          transition={{ type: 'spring', stiffness: 100 }}
        >
          {value}
        </motion.span>
        {suffix}
      </motion.span>
    </motion.span>
  );
}
