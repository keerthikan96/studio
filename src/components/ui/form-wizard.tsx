'use client';

import { useState, ReactNode } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { ChevronLeft, ChevronRight, Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export interface Step {
  id: string;
  title: string;
  description?: string;
  content: ReactNode;
  optional?: boolean;
}

interface FormWizardProps {
  steps: Step[];
  onComplete: () => void;
  onStepChange?: (stepIndex: number) => void;
  className?: string;
}

export function FormWizard({ steps, onComplete, onStepChange, className }: FormWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      const nextStep = currentStep + 1;
      setCurrentStep(nextStep);
      onStepChange?.(nextStep);
    } else {
      setCompletedSteps(prev => new Set([...prev, currentStep]));
      onComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      const prevStep = currentStep - 1;
      setCurrentStep(prevStep);
      onStepChange?.(prevStep);
    }
  };

  const handleStepClick = (stepIndex: number) => {
    // Allow clicking on completed steps or adjacent step
    if (completedSteps.has(stepIndex) || stepIndex === currentStep - 1 || stepIndex === currentStep + 1) {
      setCurrentStep(stepIndex);
      onStepChange?.(stepIndex);
    }
  };

  const progress = ((currentStep + 1) / steps.length) * 100;

  return (
    <div className={cn('w-full', className)}>
      {/* Progress Bar */}
      <div className="mb-8">
        <div className="relative">
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-primary to-accent"
              initial={{ width: 0 }}
              animate={{ width: `${progress}%` }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          </div>
          <div className="absolute -top-1 left-0 w-full flex justify-between">
            {steps.map((step, index) => (
              <button
                key={step.id}
                onClick={() => handleStepClick(index)}
                disabled={!completedSteps.has(index) && index !== currentStep && index !== currentStep + 1 && index !== currentStep - 1}
                className={cn(
                  'relative flex flex-col items-center group',
                  'disabled:cursor-not-allowed disabled:opacity-50'
                )}
              >
                <motion.div
                  className={cn(
                    'w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all',
                    'font-semibold text-sm',
                    index === currentStep
                      ? 'bg-primary text-primary-foreground border-primary shadow-lg scale-110'
                      : completedSteps.has(index)
                      ? 'bg-primary/20 text-primary border-primary'
                      : 'bg-background text-muted-foreground border-border'
                  )}
                  whileHover={{ scale: index === currentStep ? 1.1 : 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  {completedSteps.has(index) && index !== currentStep ? (
                    <Check className="w-5 h-5" />
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </motion.div>
                <span className={cn(
                  'absolute top-12 text-xs font-medium whitespace-nowrap transition-colors',
                  'hidden sm:block',
                  index === currentStep ? 'text-foreground' : 'text-muted-foreground'
                )}>
                  {step.title}
                </span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Step Content */}
      <div className="min-h-[400px] mt-16 sm:mt-20">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentStep}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            transition={{ duration: 0.3 }}
          >
            <Card>
              <CardHeader>
                <CardTitle className="text-2xl">{steps[currentStep].title}</CardTitle>
                {steps[currentStep].description && (
                  <CardDescription className="text-base">
                    {steps[currentStep].description}
                  </CardDescription>
                )}
              </CardHeader>
              <CardContent className="space-y-6">
                {steps[currentStep].content}
              </CardContent>
            </Card>
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center justify-between mt-8 gap-4">
        <Button
          variant="outline"
          onClick={handlePrevious}
          disabled={currentStep === 0}
          className="gap-2"
        >
          <ChevronLeft className="w-4 h-4" />
          Previous
        </Button>

        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <span className="font-medium">
            Step {currentStep + 1} of {steps.length}
          </span>
          {steps[currentStep].optional && (
            <span className="text-xs bg-muted px-2 py-1 rounded">Optional</span>
          )}
        </div>

        <Button
          variant={currentStep === steps.length - 1 ? 'gradient' : 'default'}
          onClick={handleNext}
          className="gap-2"
        >
          {currentStep === steps.length - 1 ? (
            <>
              <Check className="w-4 h-4" />
              Complete
            </>
          ) : (
            <>
              Next
              <ChevronRight className="w-4 h-4" />
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
