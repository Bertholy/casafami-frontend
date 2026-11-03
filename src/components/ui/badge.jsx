import { cva } from 'class-variance-authority';
import { cn } from '../../lib/utils';

// Badge shadcn/ui : petite pastille d'état. Les variantes « success », « destructive » et « warning » utilisent les jetons sémantiques --sc-*
// (fond clair teinté + texte foncé, contraste d'au moins 4,5:1 en clair comme en sombre) ; aucune couleur n'est codée ici.
// eslint-disable-next-line react-refresh/only-export-components
export const badgeVariants = cva(
    'inline-flex items-center gap-1 whitespace-nowrap rounded-full border px-2 py-0.5 text-xs font-semibold leading-none',
    {
        variants: {
            variant: {
                default: 'border-transparent bg-primary text-primary-foreground',
                secondary: 'border-transparent bg-secondary text-secondary-foreground',
                outline: 'border-border text-foreground',
                success: 'border-transparent bg-success-soft text-success-soft-foreground',
                destructive: 'border-transparent bg-destructive-soft text-destructive-soft-foreground',
                warning: 'border-transparent bg-warning-soft text-warning-soft-foreground',
            },
        },
        defaultVariants: { variant: 'default' },
    },
);

export function Badge({ className, variant, ...props }) {
    return <span className={cn(badgeVariants({ variant }), className)} {...props} />;
}
