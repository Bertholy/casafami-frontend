# Mises à jour — CASAFAMI (site)

## Nouveau design du site public (branche `design-montagne`)

- Le site public (accueil, services, prendre RDV, mes RDV, connexion, menu, pied de page) reprend le design du modèle « Mountain hotel » : bandeau bleu (couleur du bâtiment), titres Montserrat en majuscules avec un mot en italique, sections image / texte pleine largeur, boutons carrés, bandeaux ardoise, galerie, mode sombre conservé.
- Toutes les fonctions sont conservées (réservation, assistant, FR / MG, mode édition du site, notifications, espace personnel et super admin inchangés). La couleur principale suit « Couleurs du site » ; sans personnalisation elle reprend le bleu du bâtiment du cabinet (#0a8fc7).
- **Revenir à l'ancien design** : `git checkout main` (l'ancien design y est intact et poussé), ou, pour garder la branche, retirer la classe `theme-montagne` dans `src/App.jsx`.

## Mise à jour suivante (11 octobre 2026, soir)

- **Tableau de bord du personnel** : un médecin, une sage-femme ou une infirmière (sans droit d'attribuer ni de confirmer) a maintenant « Mon espace » : ses patients du jour, sa semaine, ses rendez-vous, avec seulement Accepter, Terminer, Dossier, Détail et Reçu. Plus de colonne « Praticien », de « À attribuer », de modification, de corbeille ni d'annulation, et les rendez-vous pas encore attribués n'y apparaissent pas. Le super administrateur garde le tableau de bord de gestion complet ; la secrétaire garde la vue d'accueil du cabinet sans attribution ni confirmation.

- **Œil sur les mots de passe** : tous les champs de mot de passe (connexion, création de compte, réinitialisation, changement du mien, nouveau mot de passe oublié) ont un œil pour afficher ou masquer ce qu'on tape.

- **Rôles et permissions** (menu Administration) : cases par rôle, exceptions par personne, retour aux droits d'origine. Les menus, boutons et pages du personnel s'adaptent aux droits de chacun.
- **Modifier le site** : la grande barre du bas est remplacée par une petite barre d'outils ; un clic sur un texte ouvre une **fenêtre de modification** (texte, gras, italique, alignement, taille, couleur, aperçu, Enregistrer / Annuler / Remettre par défaut). Boutons « Ajouter un texte » (haut ou bas de page), « Annuler » la dernière modification, « Remettre par défaut » (cette page, menu et pied de page, tout le site). Chaque langue (FR / MG) a ses propres textes.
- **Photos** : toute photo choisie (services, profil) est adaptée automatiquement ; plus de message « Image invalide ».
- **Congés** : la page Horaires et congés indique combien de personnes ont été prévenues (notification + SMS).

## Version du 11 octobre 2026

### Site public (patients)
- **Français / Malagasy** : sélecteur FR | MG dans une barre en haut du site, 400 textes traduits (à faire relire par un locuteur natif). Le super administrateur peut corriger un texte dans la langue affichée (mode édition). Les espaces du personnel restent en français.
- **Assistant de rendez-vous** : le patient décrit ce qui lui arrive avec ses mots (français ou malgache) et l'assistant propose le **service adapté**, avec son explication. Il repère aussi les signes graves (saignement abondant, difficulté à respirer, début de travail…) et reprend les mots du patient dans le motif envoyé à l'équipe. Services « Soins infirmiers » et « Analyses » ajoutés.
- Le patient ne choisit plus la personne qui le reçoit.
- **Performance** : pages chargées à la demande (premier chargement : 611 Ko → environ 370 Ko) et images compressées (18 Mo → 1,3 Mo).

### Espace du personnel
- **Rendez-vous en deux confirmations** : le super administrateur attribue (fenêtre avec l'occupation du personnel), la personne accepte, le super administrateur confirme. Badges « Réponse attendue / Accepté » dans la liste.
- **Mes patients** (médecins, sages-femmes, infirmières) : la liste des patients confiés, avec date et heure ; en haut, ceux à accepter.
- **Cloche de notifications** : le super administrateur reçoit tout (nouvelles demandes du patient, de la secrétaire, du personnel, modifications, annulations, corbeille, acceptations). Un clic ouvre la page où traiter la demande (carte « Demande à traiter » avec les boutons Attribuer / Accepter / Confirmer).
- **Messagerie** interne avec compteur de messages non lus.
- **Suivi maternité** : grossesse (terme, consultations prénatales, alertes), carnet de vaccination des enfants, page de rappels.
- **Sauvegardes** (super administrateur) et **mot de passe oublié** (page de demande et page de nouveau mot de passe).
- Chaque onglet garde sa propre connexion : on peut ouvrir plusieurs comptes en même temps (super administrateur, médecin, secrétaire…).
- La création d'un compte met la liste à jour tout de suite.

### Technique
- Session par onglet (`sessionStorage`), chargement paresseux des pages, regroupement des bibliothèques en fichiers stables.
- Contrôles automatiques : encodage des textes et analyse du code (`npm run lint`).
