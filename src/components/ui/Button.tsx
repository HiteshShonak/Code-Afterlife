import { memo, forwardRef } from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

type Variant = 'primary' | 'ghost' | 'danger' | 'outline';
type Size = 'sm' | 'md' | 'lg';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  isLoading?: boolean;
  children: React.ReactNode;
}

const VARIANTS: Record<Variant, string> = {
  primary: 'border border-foreground/20 bg-foreground text-background hover:bg-foreground/90',
  ghost:   'border border-transparent text-muted-foreground hover:bg-foreground/8 hover:text-foreground',
  danger:  'border border-destructive/30 bg-destructive/10 text-destructive hover:bg-destructive/20',
  outline: 'border border-foreground/20 bg-transparent text-foreground hover:bg-foreground/8',
};

const SIZES: Record<Size, string> = {
  sm: 'px-3 py-1.5 text-[10px]',
  md: 'px-4 py-2 text-[11px]',
  lg: 'px-6 py-2.5 text-[12px]',
};

// custom button component
export const Button = memo(
  forwardRef<HTMLButtonElement, ButtonProps>(function Button(
    { variant = 'primary', size = 'md', isLoading = false, className, children, disabled, ...props },
    ref
  ) {
    return (
      <motion.button
        ref={ref}
        whileTap={{ scale: 0.97 }}
        transition={{ duration: 0.1 }}
        disabled={disabled || isLoading}
        className={cn(
          'inline-flex items-center justify-center gap-2 rounded-sm font-mono uppercase tracking-[0.14em] transition-colors',
          'disabled:pointer-events-none disabled:opacity-40',
          VARIANTS[variant],
          SIZES[size],
          className
        )}
        {...(props as React.ComponentPropsWithRef<typeof motion.button>)}
      >
        {isLoading ? (
          <>
            <span className="h-3 w-3 animate-spin rounded-full border border-current border-t-transparent" />
            <span>Loading…</span>
          </>
        ) : (
          children
        )}
      </motion.button>
    );
  })
);
