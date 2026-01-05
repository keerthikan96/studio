
'use client';

import { AlertCircle } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "./ui/tooltip";

type ReviewFieldWrapperProps = {
    children: React.ReactNode;
    confidence?: number;
};

const CONFIDENCE_THRESHOLD = 0.75;

export function ReviewFieldWrapper({ children, confidence }: ReviewFieldWrapperProps) {
    if (confidence === undefined || confidence >= CONFIDENCE_THRESHOLD) {
        return <>{children}</>;
    }

    return (
        <TooltipProvider>
            <Tooltip>
                <TooltipTrigger asChild>
                    <div className="relative p-3 border-2 border-yellow-400 rounded-md bg-yellow-50/50">
                        <div className="absolute -top-2 -right-2">
                            <AlertCircle className="h-5 w-5 text-yellow-500 fill-yellow-100" />
                        </div>
                        {children}
                    </div>
                </TooltipTrigger>
                <TooltipContent>
                    <p>Low Confidence ({Math.round(confidence * 100)}%). Please review this field.</p>
                </TooltipContent>
            </Tooltip>
        </TooltipProvider>
    );
}
