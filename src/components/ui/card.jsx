import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// Carte shadcn/ui : bordure fine, pas d'ombre. Les classes sont exportées pour les blocs écrits à la main (constants/ui.js).
export const carteClasses = 'rounded-xl border border-border bg-card text-card-foreground';

export function Card({ className, ...props }) {
    return <div className={cn(carteClasses, className)} {...props} />;
}

export function CardHeader({ className, ...props }) {
    return <div className={cn('flex flex-col gap-1.5 p-6', className)} {...props} />;
}

export function CardTitle({ className, as: Balise = 'h3', ...props }) {
    return <Balise className={cn('text-xl font-semibold leading-none tracking-tight', className)} {...props} />;
}

export function CardDescription({ className, ...props }) {
    return <p className={cn('text-sm text-muted-foreground', className)} {...props} />;
}

export function CardContent({ className, ...props }) {
    return <div className={cn('p-6 pt-0', className)} {...props} />;
}

export function CardFooter({ className, ...props }) {
    return <div className={cn('flex items-center p-6 pt-0', className)} {...props} />;
}

// Étiquette arrondie (statut, mot-clé).
// eslint-disable-next-line react-refresh/only-export-components
export const badgeVariants = cva(
    'inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-semibold transition-colors',
    {
        variants: {
            variant: {
                default: 'border-transparent bg-primary text-primary-foreground',
                secondary: 'border-transparent bg-secondary text-secondary-foreground',
                outline: 'border-border text-foreground',
                destructive: 'border-transparent bg-destructive text-destructive-foreground',
            },
        },
        defaultVariants: { variant: 'default' },
    },
);

export function Badge({ className, variant, ...props }) {
    return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
