import { Briefcase } from 'lucide-react';
import { cn } from '@/lib/utils';

type LogoProps = {
  className?: string;
  iconOnly?: boolean;
};

export default function Logo({ className, iconOnly = false }: LogoProps) {
  return (
    <div className={cn("flex items-center gap-2", className)}>
      <Briefcase className="h-6 w-6 text-primary" />
      {!iconOnly && (
        <h1 className="font-headline text-2xl font-bold">StaffSync</h1>
      )}
    </div>
  );
}
