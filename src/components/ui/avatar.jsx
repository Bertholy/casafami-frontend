import * as AvatarPrimitive from '@radix-ui/react-avatar';
import { cn } from '../../lib/utils';

// Pastille de profil shadcn/ui : la photo si elle charge, sinon les initiales.
export function Avatar({ className, ...props }) {
    return <AvatarPrimitive.Root className={cn('relative flex size-9 shrink-0 overflow-hidden rounded-full', className)} {...props} />;
}

export function AvatarImage({ className, ...props }) {
    return <AvatarPrimitive.Image className={cn('aspect-square size-full object-cover', className)} {...props} />;
}

export function AvatarFallback({ className, ...props }) {
    return <AvatarPrimitive.Fallback className={cn('flex size-full items-center justify-center rounded-full bg-muted text-sm font-semibold text-muted-foreground', className)} {...props} />;
}
