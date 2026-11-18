# Blackjack hybride — Phase 2

Module `blackjack-hybrid@1`, aventure `menthe27@0.2.0`, add-on préparé 0.6.0. Le manifeste historique 0.1.0 reste lisible ; sélectionner explicitement 0.2.0 pour jouer les trois manches.

## Démarrage

1. Administration : choisir **Opération Menthe 27 — 0.2.0**, renseigner les noms et activer une pièce avec ses placements enregistrés.
2. Jouer le coffre, ou activer **Autoriser la simulation PC**, sélectionner **Blackjack hybride — trois manches**, puis **Tester cette énigme** pour un essai isolé.
3. Vue joueur PC : activer **Simulation PC**, puis **Aller à la table**. En WebXR, effectuer A/B et se placer à moins de 1,3 m du point `table`.
4. La première connexion devient capitaine. Après son départ, le rôle revient à la connexion active de plus petite place ; un nouvel arrivant ne reprend pas le rôle. L’administration affiche son nom.

## Trois manches

- **Casino** : le capitaine distribue et choisit Tirer/Rester. Paquet neuf de 52 cartes mélangé côté serveur à chaque tentative. Figures à 10, As à 1 ou 11. Le croupier reste à 17, même souple. Un blackjack naturel bat un 21 à davantage de cartes ; deux naturels sont à égalité. Défaite et égalité comptent comme échecs. Après trois échecs, la tentative suivante est le rattrapage : équipe 10 + 9, croupier 10 + 7 ; Rester gagne. Récompense ♣ ; cliquer **Manche suivante**.
- **Double as** : sélectionner puis déposer A♦, 9♠ et A♥ dans les trois logements, dans un ordre quelconque. Donner 11 à un As et 1 à l’autre puis valider ; les deux solutions sont acceptées. Récompense ♥.
- **Croupier impossible** : déposer exactement trois cartes parmi 8♣, 5♦, 3♠, 10♥, A♣. Solution : 10♥ + 8♣ + 3♠ = 21 contre le croupier à 20. Récompense ♠.

Après ♣ ♥ ♠, le Vidéoclub rétro reste explicitement en attente ; l’aventure n’est pas déclarée terminée. Les récompenses précédentes, dont l’accès au casino du coffre, restent dans l’inventaire.

## Cartes et multijoueur

Cette version utilise **sélection puis dépôt**, sans prise libre. Souris, boutons tactiles et rayons des contrôleurs WebXR utilisent les mêmes commandes. La table 3D PC est cliquable. En WebXR, viser une carte puis un logement vide et presser la gâchette ; les boutons 3D permettent aussi les valeurs d’As et la validation sans DOM Overlay.

Une carte sélectionnée est réservée au joueur pendant 15 secondes, une seule par joueur. Un logement occupé ne peut pas être écrasé. Pour corriger : sélectionner une carte déposée, **Remettre la carte en réserve**, puis en déposer une autre. **Libérer la sélection** retire seulement la réservation. Le serveur libère les réservations expirées ou appartenant à une connexion disparue ; les cartes déposées restent en place.

Les commandes portent la révision et l’instance active. Les requêtes concurrentes ou rejouées deviennent périmées et reçoivent un refus explicite avec l’état courant. L’identité de l’acteur et le capitaine viennent du serveur, jamais du JSON client. Le mode test ne contourne pas ce rôle.

## Administration et état privé

**Partager l’indice suivant** révèle progressivement les six indices. **Réinitialiser l’énigme active** recommence ses manches et retire ses récompenses en préservant le coffre et ses récompenses. Jeton, origine et révision sont exigés. Après l’attente du Vidéoclub, aucune énigme n’est active : utiliser le mode test pour rejouer le casino, ou recommencer l’aventure.

Les règles du module n’importent ni Node, ni Three.js, ni WebSocket. Sa source aléatoire est injectée depuis la composition serveur (`crypto.randomInt`). L’état privé conserve le paquet. `publicState` l’omet, remplace la deuxième carte du croupier par `null` pendant la main et masque aussi son total. API admin, clients et nouveaux arrivants utilisent cette même projection. Les récompenses partielles passent par le contrat générique `earnedRewards`, y compris pour une restauration validée.

## Compatibilité et limites

- Neuf emplacements et panneau existants inchangés ; la nouvelle table réutilise `table`. Aucun fichier de pièce migré ou supprimé. Table virtuelle d’environ 1,6 × 1,15 m : vérifier la place physique et les passages.
- A/B reste un repère manuel commun, sans ancre spatiale partagée. Pas de pose libre synchronisée ou de fonctionnalité MR native supposée disponible.
- Progression, noms, capitaine, paquet et copie de test en mémoire. Une reconnexion au serveur encore actif retrouve l’état public ; un redémarrage perd la session. La sauvegarde disque reste en Phase 3.
- Un nouvel UUID ne récupère pas l’ancienne réservation ; celle-ci est libérée. Les cartes déposées restent partagées.
- Tests logiciels et simulations Chrome ne constituent pas des essais physiques Quest, téléphone ou HAOS.

Voir [Menthe 27](menthe27.md), [la création d’aventures](creating-adventures.md) et le [récapitulatif](../RECAPITULATIF.md).
