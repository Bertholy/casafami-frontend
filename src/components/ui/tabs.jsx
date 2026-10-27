import * as RadixTabs from '@radix-ui/react-tabs';
import { cn } from '../../lib/utils';

export const Tabs = RadixTabs.Root;
export const TabsContent = RadixTabs.Content;

export function TabsList({ className, ...props }) {
    return <RadixTabs.List className={cn('inline-flex max-w-full items-center gap-0.5 overflow-x-auto rounded-lg border border-border bg-card p-0.5', className)} {...props} />;
}

export function TabsTrigger({ className, ...props }) {
    return (
        <RadixTabs.Trigger className={cn('whitespace-nowrap rounded-md px-3 py-1 text-xs font-semibold text-muted-foreground outline-none transition hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring data-[state=active]:bg-primary data-[state=active]:text-primary-foreground', className)} {...props} />
    );
}
