import * as Menu from '@radix-ui/react-dropdown-menu';
import { cn } from '../../lib/utils';

export const DropdownMenu = Menu.Root;
export const DropdownMenuTrigger = Menu.Trigger;
export const DropdownMenuGroup = Menu.Group;

/** Le menu s'affiche hors de la page (portail) : « theme-staff » lui redonne les jetons de couleur de l'espace du personnel. */
export function DropdownMenuContent({ className, sideOffset = 8, ...props }) {
    return (
        <Menu.Portal>
            <Menu.Content sideOffset={sideOffset} collisionPadding={12}
                className={cn('theme-staff z-80 min-w-56 overflow-hidden rounded-lg border border-border bg-popover p-1 text-popover-foreground shadow-lg animate-[menu-in_.12s_ease-out]', className)} {...props} />
        </Menu.Portal>
    );
}

export function DropdownMenuItem({ className, danger, ...props }) {
    return (
        <Menu.Item className={cn('flex cursor-pointer select-none items-center gap-2.5 rounded-md px-2.5 py-2 text-sm outline-none transition data-highlighted:bg-accent data-highlighted:text-accent-foreground data-disabled:pointer-events-none data-disabled:opacity-50',
            danger && 'text-rose-500 data-highlighted:bg-rose-500/10 data-highlighted:text-rose-500', className)} {...props} />
    );
}

export function DropdownMenuLabel({ className, ...props }) {
    return <Menu.Label className={cn('px-2.5 py-2 text-xs text-muted-foreground', className)} {...props} />;
}

export function DropdownMenuSeparator({ className, ...props }) {
    return <Menu.Separator className={cn('-mx-1 my-1 h-px bg-border', className)} {...props} />;
}
