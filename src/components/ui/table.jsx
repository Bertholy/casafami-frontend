import { cn } from '../../lib/utils';

// Tableau shadcn/ui : le conteneur fait défiler horizontalement sur téléphone sans déformer la page.
export function Table({ className, ...props }) {
    return <div className="relative w-full overflow-x-auto"><table className={cn('w-full caption-bottom text-sm', className)} {...props} /></div>;
}

export function TableHeader({ className, ...props }) {
    return <thead className={cn('[&_tr]:border-b', className)} {...props} />;
}

export function TableBody({ className, ...props }) {
    return <tbody className={cn('[&_tr:last-child]:border-0', className)} {...props} />;
}

export function TableRow({ className, ...props }) {
    return <tr className={cn('border-b border-border transition-colors hover:bg-muted/50 data-[state=selected]:bg-muted', className)} {...props} />;
}

export function TableHead({ className, ...props }) {
    return <th className={cn('h-10 px-3 text-left align-middle text-xs font-semibold uppercase tracking-wide text-muted-foreground', className)} {...props} />;
}

export function TableCell({ className, ...props }) {
    return <td className={cn('px-3 py-3 align-middle', className)} {...props} />;
}

export function TableCaption({ className, ...props }) {
    return <caption className={cn('mt-3 text-sm text-muted-foreground', className)} {...props} />;
}
