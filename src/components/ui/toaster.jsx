import * as Toast from '@radix-ui/react-toast';
import { AlertTriangle, CheckCircle2, Info, X, XCircle } from 'lucide-react';
import { toast, useToasts } from '../../lib/toast';
import { cn } from '../../lib/utils';

const STYLES = {
    success: { icone: CheckCircle2, couleur: 'text-emerald-500', barre: 'bg-emerald-500' },
    error: { icone: XCircle, couleur: 'text-rose-500', barre: 'bg-rose-500' },
    warning: { icone: AlertTriangle, couleur: 'text-amber-500', barre: 'bg-amber-500' },
    info: { icone: Info, couleur: 'text-sky-500', barre: 'bg-sky-500' },
};

/** Affiche les notifications lancées avec toast.success / error / warning / info (Radix Toast, style shadcn/ui). */
export default function Toaster() {
    const items = useToasts();
    return (
        <Toast.Provider swipeDirection="right" label="Notifications">
            {items.map(item => {
                const { icone: Icone, couleur, barre } = STYLES[item.type] || STYLES.info;
                return (
                    <Toast.Root key={item.id} duration={item.duree} type={item.type === 'error' ? 'foreground' : 'background'}
                        onOpenChange={ouvert => { if (!ouvert) toast.dismiss(item.id); }}
                        className={cn('group relative flex w-full items-start gap-3 overflow-hidden rounded-lg border border-border bg-popover p-3.5 pr-9 text-popover-foreground shadow-lg',
                            'data-[state=open]:animate-[toast-in_.2s_ease-out] data-[state=closed]:animate-[toast-out_.15s_ease-in] data-[swipe=move]:translate-x-(--radix-toast-swipe-move-x) data-[swipe=cancel]:translate-x-0 data-[swipe=end]:animate-[toast-out_.15s_ease-in]')}>
                        <span className={cn('absolute inset-y-0 left-0 w-1', barre)} aria-hidden="true" />
                        <Icone size={18} className={cn('mt-0.5 shrink-0', couleur)} aria-hidden="true" />
                        <div className="min-w-0 flex-1">
                            <Toast.Description className="text-sm leading-snug">{item.message}</Toast.Description>
                            {item.action && (
                                <Toast.Action altText={item.action.label} onClick={item.action.onClick}
                                    className="mt-2 inline-flex h-7 items-center rounded-md border border-border bg-secondary px-2.5 text-xs font-semibold text-secondary-foreground transition hover:bg-accent">
                                    {item.action.label}
                                </Toast.Action>
                            )}
                        </div>
                        <Toast.Close aria-label="Fermer" className="absolute right-2 top-2 rounded-md p-1 text-muted-foreground transition hover:bg-secondary hover:text-foreground">
                            <X size={14} />
                        </Toast.Close>
                    </Toast.Root>
                );
            })}
            <Toast.Viewport className="fixed bottom-0 right-0 z-100 m-0 flex w-full max-w-sm list-none flex-col gap-2 p-4 outline-none max-sm:max-w-full" />
        </Toast.Provider>
    );
}
