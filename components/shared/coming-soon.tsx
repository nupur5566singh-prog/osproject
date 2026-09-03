import { cn } from '@/lib/utils';
import { Clock } from 'lucide-react';

interface ComingSoonProps {
  feature: string;
  description?: string;
  className?: string;
}

export function ComingSoon({ feature, description, className }: ComingSoonProps) {
  return (
    <div className={cn('flex flex-col items-center justify-center py-16 text-center', className)}>
      <div className="mb-4 flex h-14 w-14 items-center justify-center rounded-full bg-secondary">
        <Clock className="h-7 w-7 text-muted-foreground" />
      </div>
      <h3 className="text-lg font-semibold">{feature} — Coming in the next phase</h3>
      <p className="mt-1 max-w-sm text-sm text-muted-foreground">
        {description ||
          `This feature is under active development and will be available in Phase 2 of ProjectOS.`}
      </p>
    </div>
  );
}
