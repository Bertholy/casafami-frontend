import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

// Assemble des classes Tailwind sans conflit (la dernière gagne) : base de tous les composants de components/ui.
export function cn(...entrees) {
    return twMerge(clsx(entrees));
}
