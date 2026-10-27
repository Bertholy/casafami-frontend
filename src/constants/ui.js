// Classes partagées par les pages du personnel (cartes, champs, boutons) : un seul endroit à ajuster.
// Elles viennent des composants shadcn/ui (components/ui) : l'apparence d'un bouton, d'un champ ou d'une carte se règle donc là-bas,
// et leurs couleurs suivent les jetons --sc-* de staff.css (thème clair et sombre, couleur de bouton choisie dans « Couleurs du site »).
import { cn } from '../lib/utils';
import { buttonVariants } from '../components/ui/button';
import { carteClasses } from '../components/ui/card';
import { champClasses } from '../components/ui/input';

export const card = carteClasses;
export const inputClass = cn(champClasses, 'rounded-lg px-3.5 py-2.5 text-sm');
export const btnPrimary = cn(buttonVariants({ size: 'md' }), 'font-bold');
export const btnSecondary = cn(buttonVariants({ variant: 'outline', size: 'md' }));
export const btnDanger = cn(buttonVariants({ variant: 'destructive', size: 'md' }), 'font-bold');
