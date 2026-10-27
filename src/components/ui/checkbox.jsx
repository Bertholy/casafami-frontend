import * as CheckboxPrimitive from '@radix-ui/react-checkbox';
import { Check } from 'lucide-react';
import { cn } from '../../lib/utils';

// Case à cocher shadcn/ui (Radix) : état « coché » annoncé aux lecteurs d'écran, utilisable au clavier (Espace).
export function Checkbox({ className, ...props }) {
    return (
        <CheckboxPrimitive.Root className={cn('peer size-5 shrink-0 rounded-sm border border-input bg-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 data-[state=checked]:border-primary data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground', className)} {...props}>
            <CheckboxPrimitive.Indicator className="flex items-center justify-center text-current"><Check className="size-3.5" aria-hidden="true" /></CheckboxPrimitive.Indicator>
        </CheckboxPrimitive.Root>
    );
}
