import * as RadixTooltip from '@radix-ui/react-tooltip';
import { cn } from '../../lib/utils';

export const TooltipProvider = RadixTooltip.Provider;

/** Info-bulle (Radix Tooltip) : <Tooltip label="Texte"><button>…</button></Tooltip>. */
export function Tooltip({ label, side = 'bottom', children }) {
    if (!label) return children;
    return (
        <RadixTooltip.Root delayDuration={250}>
            <RadixTooltip.Trigger asChild>{children}</RadixTooltip.Trigger>
            <RadixTooltip.Portal>
                <RadixTooltip.Content side={side} sideOffset={6} className={cn('theme-staff z-80 rounded-md border border-border bg-popover px-2 py-1 text-xs text-popover-foreground shadow-md animate-[menu-in_.12s_ease-out]')}>
                    {label}
                </RadixTooltip.Content>
            </RadixTooltip.Portal>
        </RadixTooltip.Root>
    );
}
