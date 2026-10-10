# Mises à jour — CASAFAMI (site)

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
