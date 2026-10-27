import * as SelectPrimitive from '@radix-ui/react-select';
import { Check, ChevronDown, ChevronUp } from 'lucide-react';
import { cn } from '../../lib/utils';

// Liste déroulante shadcn/ui (Radix) : clavier, lecteur d'écran et recherche au clavier inclus.
export const Select = SelectPrimitive.Root;
export const SelectGroup = SelectPrimitive.Group;
export const SelectValue = SelectPrimitive.Value;

export function SelectTrigger({ className, children, ...props }) {
    return (
        <SelectPrimitive.Trigger className={cn('flex h-11 w-full items-center justify-between gap-2 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive data-[placeholder]:text-muted-foreground [&>span]:truncate', className)} {...props}>
            {children}
            <SelectPrimitive.Icon asChild><ChevronDown className="size-4 shrink-0 opacity-60" aria-hidden="true" /></SelectPrimitive.Icon>
        </SelectPrimitive.Trigger>
    );
}

export function SelectContent({ className, children, position = 'popper', ...props }) {
    return (
        <SelectPrimitive.Portal>
            <SelectPrimitive.Content position={position} className={cn('theme-staff relative z-50 max-h-72 min-w-32 overflow-hidden rounded-md border border-border bg-popover text-popover-foreground shadow-md', position === 'popper' && 'data-[side=bottom]:translate-y-1 data-[side=top]:-translate-y-1', className)} {...props}>
                <SelectPrimitive.ScrollUpButton className="flex h-6 items-center justify-center"><ChevronUp className="size-4" /></SelectPrimitive.ScrollUpButton>
                <SelectPrimitive.Viewport className={cn('p-1', position === 'popper' && 'w-full min-w-(--radix-select-trigger-width)')}>{children}</SelectPrimitive.Viewport>
                <SelectPrimitive.ScrollDownButton className="flex h-6 items-center justify-center"><ChevronDown className="size-4" /></SelectPrimitive.ScrollDownButton>
            </SelectPrimitive.Content>
        </SelectPrimitive.Portal>
    );
}

export function SelectLabel({ className, ...props }) {
    return <SelectPrimitive.Label className={cn('px-2 py-1.5 text-xs font-semibold text-muted-foreground', className)} {...props} />;
}

export function SelectItem({ className, children, ...props }) {
    return (
        <SelectPrimitive.Item className={cn('relative flex w-full cursor-default select-none items-center rounded-sm py-2 pl-8 pr-2 text-sm outline-none focus:bg-accent focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50', className)} {...props}>
            <span className="absolute left-2 flex size-4 items-center justify-center">
                <SelectPrimitive.ItemIndicator><Check className="size-4" aria-hidden="true" /></SelectPrimitive.ItemIndicator>
            </span>
            <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
        </SelectPrimitive.Item>
    );
}

export function SelectSeparator({ className, ...props }) {
    return <SelectPrimitive.Separator className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />;
}
