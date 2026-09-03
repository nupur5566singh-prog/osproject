import { cn } from '@/lib/utils';
import { Layers } from 'lucide-react';

interface LogoProps {
  className?: string;
  iconClassName?: string;
  textClassName?: string;
  showText?: boolean;
  variant?: 'light' | 'dark';
}

export function Logo({
  className,
  iconClassName,
  textClassName,
  showText = true,
  variant = 'light',
}: LogoProps) {
  return (
    <div className={cn('flex items-center gap-2', className)}>
      <div
        className={cn(
          'flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground',
          iconClassName
        )}
      >
        <Layers className="h-5 w-5" />
      </div>
      {showText && (
        <span
          className={cn(
            'text-lg font-bold tracking-tight',
            variant === 'dark' ? 'text-white' : 'text-foreground',
            textClassName
          )}
        >
          ProjectOS
        </span>
      )}
    </div>
  );
}
