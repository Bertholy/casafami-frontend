import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// Encadré d'information shadcn/ui (message, avertissement, erreur) : une icône facultative à gauche, un titre et un texte.
// eslint-disable-next-line react-refresh/only-export-components
export const alertVariants = cva(
    'relative flex w-full gap-3 rounded-lg border p-4 text-sm [&>svg]:mt-0.5 [&>svg]:size-4 [&>svg]:shrink-0',
    {
        variants: {
            variant: {
                default: 'border-border bg-card text-card-foreground',
                destructive: 'border-destructive/40 bg-destructive/5 text-destructive',
                warning: 'border-amber-300 bg-amber-50 text-amber-900 dark:border-amber-500/40 dark:bg-amber-500/10 dark:text-amber-200',
                success: 'border-emerald-300 bg-emerald-50 text-emerald-900 dark:border-emerald-500/40 dark:bg-emerald-500/10 dark:text-emerald-200',
            },
        },
        defaultVariants: { variant: 'default' },
    },
);

export function Alert({ className, variant, ...props }) {
    return <div role="alert" className={cn(alertVariants({ variant }), className)} {...props} />;
}

export function AlertTitle({ className, ...props }) {
    return <h5 className={cn('mb-0.5 font-semibold leading-none tracking-tight', className)} {...props} />;
}

export function AlertDescription({ className, ...props }) {
    return <div className={cn('text-sm opacity-90', className)} {...props} />;
}
