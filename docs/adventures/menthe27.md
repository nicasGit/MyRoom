# Opération Menthe 27 — Phase 1

Manifeste `menthe27@0.1.0`, schéma 1. Première tranche de développement, pas une aventure complète. Participants suggérés : **Léon, Reno, Fabien et Nicolas**. Durée cible indicative : 60 minutes, à ajuster lorsque les étapes seront implémentées. La métadonnée de quatre participants n’empêche pas les tests solo ; MyRoom conserve quatre connexions maximum.

## Essayer localement

### Accès direct en mode test

Dans l’administration, activez **Autoriser la simulation PC**, puis utilisez **Accès direct aux énigmes → Tester cette énigme**. Une session temporaire part de l’énigme choisie, sans attribuer les récompenses des étapes ignorées. Désactiver la simulation restaure la partie qui précédait le premier accès direct. Réinitialiser ou changer de pièce abandonne cette copie en mémoire ; un redémarrage serveur la perd également. Le changement concerne tous les joueurs connectés.

Seules les énigmes implémentées sont sélectionnables : Menthe 27 propose actuellement le coffre. Pour tester directement le blackjack historique, choisissez la **Démonstration classique** avant d’ouvrir la session temporaire. Le blackjack hybride reste indisponible.

1. Démarrer MyRoom avec le jeton administrateur habituel et ouvrir `/admin.html`.
2. Dans **Aventure et équipe**, sélectionner **Opération Menthe 27 — 0.1.0**, puis **Choisir cette aventure**. Arrêter d’abord une partie en cours. Le changement recommence la progression.
3. Renseigner les quatre champs de noms, ou cliquer **Utiliser les noms suggérés**, puis **Enregistrer les noms**.
4. Activer une pièce enregistrée et préparer les placements existants. Enregistrer toute modification avant le départ.
5. Démarrer les énigmes. Pour tester en solo sans casque, activer la simulation PC dans l’administration et dans la vue joueur.
6. Retrouver les balises puis saisir au panneau mural **Soleil → Arbre → Lune → Étoile**.

Le coffre reste identique au modèle existant. La réussite attribue **Accès au casino** dans l’inventaire commun. L’état devient `pending` sur **Blackjack hybride — Phase 2 à valider** : aucun jeu hybride ni victoire finale n’est simulé. La démonstration classique reste sélectionnable pour jouer au blackjack historique à une carte.

## Noms et progression

Les noms sont validés côté serveur : quatre textes non vides, 40 caractères maximum, sans caractères de contrôle. Une révision empêche d’écraser une modification concurrente. Ils sont affichés dans l’administration et associés aux joueurs connectés dans la vue joueur. Une déconnexion ne supprime pas le nom de sa place ; un nouvel occupant de cette place reçoit ce nom. Il ne s’agit pas encore d’un système de comptes ou de reconnexion d’identité.

**Le redémarrage du serveur réinitialise noms, choix d’aventure et progression.** Les pièces existantes sont conservées. Le contrat d’instantané du moteur prépare la Phase 3, sans sauvegarde automatique dans cette version de travail.

## Phase 2 prévue, non implémentée

- Casino partagé : paquet serveur, Tirer/Rester, croupier restant à 17 souple, rattrapage après trois échecs, récompense ♣.
- Double as : A♦ + 9♠ + A♥, valeurs 11 + 9 + 1 ou 1 + 9 + 11, récompense ♥.
- Croupier impossible : sélectionner exactement trois cartes, 10♥ + 8♣ + 3♠, récompense ♠.

Le manifeste ne crée volontairement aucune instance `blackjack-hybrid` avant la validation utilisateur. Les autres énigmes restent également à concevoir après les phases précédentes.

Voir [l’architecture et les risques de migration](phase1-architecture.md) et [la création d’aventures](creating-adventures.md). Aucun essai physique téléphone/Quest effectué par l’agent pour cette Phase 1.
