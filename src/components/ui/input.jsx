import { cn } from '../../lib/utils';

// Champs de saisie shadcn/ui : bordure fine, anneau de focus, rouge quand `aria-invalid` est vrai.
const base = 'w-full rounded-md border border-input bg-background px-3 py-2 text-base text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive md:text-sm';

export function Input({ className, type = 'text', ...props }) {
    return <input type={type} className={cn(base, 'flex h-11', className)} {...props} />;
}

export function Textarea({ className, ...props }) {
    return <textarea className={cn(base, 'flex min-h-20', className)} {...props} />;
}

export function Label({ className, ...props }) {
    return <label className={cn('text-sm font-medium leading-none text-foreground', className)} {...props} />;
}
