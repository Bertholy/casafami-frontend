import * as RadixDialog from '@radix-ui/react-dialog';
import { cn } from '../../lib/utils';

export const Dialog = RadixDialog.Root;
export const DialogTrigger = RadixDialog.Trigger;
export const DialogTitle = RadixDialog.Title;
export const DialogDescription = RadixDialog.Description;
export const DialogClose = RadixDialog.Close;

/** Fenêtre modale (Radix Dialog) : focus piégé, Échap pour fermer, fond assombri. Portail → « theme-staff » pour les couleurs. */
export function DialogContent({ className, overlayClassName, children, ...props }) {
    return (
        <RadixDialog.Portal>
            <RadixDialog.Overlay className={cn('theme-staff fixed inset-0 z-70 bg-black/60 backdrop-blur-[2px] animate-[fond-in_.15s_ease-out]', overlayClassName)} />
            <RadixDialog.Content
                className={cn('theme-staff fixed left-1/2 top-[12vh] z-70 w-[calc(100%-2rem)] max-w-xl -translate-x-1/2 overflow-hidden rounded-xl border border-border bg-popover text-popover-foreground shadow-lg animate-[menu-in_.15s_ease-out]', className)} {...props}>
                {children}
            </RadixDialog.Content>
        </RadixDialog.Portal>
    );
}
