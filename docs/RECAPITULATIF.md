# MyRoom — Récapitulatif des réalisations

État au **18 novembre 2026**, fonctionnalités publiées jusqu’à **0.7.2**, incluant le mode test administrateur et le blackjack hybride de la Phase 2. Ce document rassemble les travaux effectués dans le dépôt, les parcours d’utilisation, les vérifications et les limites connues. Les résultats matériels rapportés par l’utilisateur sont distingués des tests logiciels réalisés pendant le développement.

## 1. Projet et architecture

### 18 novembre 2026 — reprise Team Portal et préparation 0.8.0

Vérifications complètes après correction et préparation de version : `npm run typecheck`, `npm run build`, `npm test` réussis, **85 tests**, dont huit dédiés au portail. Scénario réseau complet réussi : quatre prises nominatives, rejet d’une autre place, attribution conservée au relâchement, reconnexion avec justificatif privé, quatre passages géométriques, départ unique du coffre, commandes administrateur protégées et simulation autorisée seulement en mode test. Avertissement Vite habituel du bloc Three.js (530 kB). La demande ultérieure d’un univers différent après passage et d’une vue des autres participants à travers le portail a été explicitée comme évolution future : ni décor immersif secondaire, ni avatars synchronisés, ni fenêtre entre deux univers dans cette livraison. Publication de la 0.8.0 en cours ; disponibilité ARM64 à vérifier.

L’utilisateur demande la publication pour essais après l’arrêt documenté ci-dessous. Blocage diagnostiqué : le détecteur ne recevait sa première pose qu’après ouverture ; un joueur commençant immédiatement à avancer pouvait déjà se trouver à moins des 30 cm nécessaires à l’armement. À l’ouverture, initialisation avec la dernière pose validée et récente (1,2 seconde maximum), sans assouplir le sens, la fenêtre utile, la cohérence du mouvement ou l’hystérésis. Test de régression ajouté ; les huit tests ciblés (sept unitaires et le scénario réseau à quatre connexions) réussissent, notamment prises, reconnexion, quatre traversées et démarrage unique du coffre. Version add-on et diagnostic client préparés en 0.8.0. Vérifications complètes et publication en cours ; aucun essai physique Quest annoncé.

### 18 novembre 2026 — Team Portal, développement sur branche dédiée

Arrêt conformément au workflow demandé après vérifications : commit local `7714031` sur `feature/team-portal`, `npm run typecheck` et `npm run build` réussis ; `npm test` donne **83 réussites / 84 tests**. Les six tests unitaires Team Portal réussissent, ainsi que les anciens tests de coffre, blackjack, pièces et saisie. Le nouveau test réseau à quatre connexions atteint l’attente d’une traversée mais dépasse son délai de validation (`portal-network.test.ts`, ligne 32). Le scénario complet réseau n’est donc pas validé ; aucune fusion dans `main`, aucun push de cette fonctionnalité et aucune publication HAOS. Aucun test matériel Quest effectué. Le défaut doit être diagnostiqué et corrigé avant reprise des vérifications et publication. Avertissement Vite habituel du bloc Three.js à 530 kB. Les données temporaires des tests ont été nettoyées par les tests.

Lecture du cahier des charges joint et des documents demandés ; dépôt propre, synchronisation avec `origin/main`, branche `feature/team-portal`. Ajout d’une introduction de session dédiée, distincte des énigmes : contrats stricts, états serveur, attributions par place, détecteur de traversée avec hystérésis, réutilisation de la saisie existante et lancement unique de l’AdventureEngine. Menthe 27 0.3.0 ajoute le rituel et conserve exactement les étapes de 0.2.0 ; versions historiques et pièces conservées. Placements indépendants sur disque, jetons privés de reprise de place dans le sous-protocole WSS, réservations pendant l’introduction. Aucun secret dans l’URL ou le journal applicatif. Administration protégée, confirmation physique, noms/couleurs/dimensions, simulation PC explicitement identifiée, passage accessible, reset/skip et remplacement de place. Rendu socle/cristaux/noms/vortex/faisceaux, effets individuels et audio conditionnel. Les poses de tête sont transitoires et ne sont pas conservées en journal/disque. Tests et vérifications finales en cours ; aucune publication ni validation physique Quest annoncée. Voir [le guide](team-portal.md).

### 18 novembre 2026 — mains visibles, publication 0.7.2

À la demande de l’utilisateur, ajout de mains articulées procédurales Three.js, sans modèle distant : articulations et segments des doigts pilotés par les poses WebXR disponibles, masquage immédiat en cas de perte de suivi. Rendu visible avant le calibrage A/B ; les interactions conservent leurs conditions existantes. Couleurs gauche/droite et jaune pendant une prise détectée. Gants simplifiés pour les contrôleurs, orientés par `gripSpace`, sans simulation de suivi des doigts. Géométries et matériaux libérés à la sortie de session. Rendu propre à chaque client, sans synchronisation des squelettes ni changement serveur ou HAOS. Source primaire consultée : [WebXR Hand Input](https://www.w3.org/TR/webxr-hand-input-1/). Deux tests synthétiques ajoutés pour suivi/perte/retrait et repli contrôleur. Vérifications finales : `npm run typecheck`, `npm run build` et `npm test` réussis, **77 tests**, contrôle d’espacement Git réussi. Avertissement Vite habituel pour le bloc Three.js de 526 kB. Aucun essai physique de cet ajout effectué. Pour la préparation 0.7.2, typecheck et build relancés avec succès ; quatre exécutions Windows donnent 76/77 tests, seul l’ancien test des vingt pièces échouant sur EPERM au renommage atomique, y compris avec un dossier temporaire dans le dépôt. Les 77 tests avaient réussi avant le changement de version. La validation Linux doit réussir avant publication de l’image. Publication 0.7.2 autorisée et confirmée : commit `7d0d50c` sur `main`, workflow [44343134319](https://github.com/nicasGit/MyRoom/actions/runs/44343134319) réussi, dont validation Linux complète avec les 77 tests. Manifeste `ghcr.io/nicasgit/myroom:0.7.2` vérifié après publication : Linux ARM64, label 0.7.2, digest `sha256:00bba3a0fd8f9ba27f7ea28d8d39aaf1e675ee9c6575627e480f30d161c055bf`. Cela confirme la disponibilité de l’image, pas une exécution physique HAOS ou Quest.

### 18 novembre 2026 — correctif 0.7.1 de lisibilité et de prise après retour Quest

L’utilisateur rapporte un essai physique sur Quest : informations trop hautes et impossibilité de prendre les objets. Ce retour ne valide pas les interactions. Sur la branche `fix/quest-panel-grabbing`, remplacement du Sprite suivant la tête par un panneau plan fixé dans l’espace de session, à 1,6 m devant la première pose suivie, avec hauteur de lecture bornée entre 0,9 et 1,5 m ; replacé au recalibrage. Les informations restent visibles pendant une prise. Points de suivi cyan/jaunes et compteur de mains/poignées suivies et fermées pour diagnostiquer les entrées disponibles. La prise accepte désormais une pince/poignée fermée avant l’approche, au lieu d’exiger un nouvel appui près de l’objet. Aide explicite pour les deux mains et objets déjà tenus ; un refus n’entraîne pas de rafale de nouvelles demandes sans relâchement. Aucun changement serveur, de calibrage A/B, de sécurité ; version de l’add-on et diagnostic client portés à 0.7.1. Tests de régression ajoutés pour la stabilité du panneau et l’approche avec prises maintenues. Vérifications finales : `npm run typecheck`, `npm run build` et `npm test` réussis, **75 tests**. Première exécution : comparaison du callback interne Three.js dans le nouveau test corrigée pour comparer les composantes du quaternion ; ancien test de stockage affecté par le refus Windows intermittent EPERM, relance complète réussie. Avertissement Vite de taille du bloc Three.js (526 kB). Aucun essai physique effectué par l’agent ; publication 0.7.1 autorisée et confirmée : commit `82533d1` sur `main`, workflow [44340992295](https://github.com/nicasGit/MyRoom/actions/runs/44340992295) réussi. Typecheck, build et 75 tests relancés avec succès avant commit. Manifeste `ghcr.io/nicasgit/myroom:0.7.1` vérifié après publication : Linux ARM64, label 0.7.1, digest `sha256:4c87a87c2a2d49c37ced7323f2e8c631dc630b640560b2d97f5b5d4c89bc6f0d`. Cela confirme la disponibilité de l’image, sans valider son exécution physique HAOS ou Quest.

### 18 novembre 2026 — prises Quest et indice sous le coffre, publication 0.7.0

Branche `feat/quest-two-hand-grabbing`, base publiée 0.6.0. Lecture des consignes, architecture et récapitulatif avant modification. L’utilisateur a confirmé le déplacement pendant la partie et demandé un indice sous le coffre. Prise par pince des mains suivies (capacité optionnelle) ou poignées des contrôleurs, une main pour les petits objets et deux mains distinctes pour coffre/table/panneau. Relâcher pose ; perte de suivi annule. Les cartes hybrides réutilisent leurs réservations et logements, avec aperçu porté localement. Murs et obstacles physiques ne sont pas des objets de jeu déplaçables.

Gestionnaire serveur distinct des énigmes : positions temporaires partagées, propriétaire, bail, séquences, bornes/vitesse, annulation à l’expiration/déconnexion. Un déplacement ne réinitialise ni la progression ni A/B ; la proximité des énigmes suit les positions courantes. Sauvegarde administrateur seulement après arrêt et relâchement, contrôlée par deux révisions ; extension facultative `puzzles.poses` pour hauteur/rotation, anciens modèles lisibles. Panneau maintenu sur mur libre et objets au-dessus des tables possibles. Indice sous le coffre : apparition après levée de 25 cm ou déplacement horizontal de 45 cm. Sources primaires WebXR consultées ; aucune capacité native supposée garantie sur un modèle de casque.

Vérifications finales : `npm run typecheck`, `npm run build` et `npm test` réussis, **73 tests**, dont dix nouveaux tests de prise, géométrie, entrées et transport. Couverture : une/deux mains, rotation rigide, pince avec hystérésis, poignées de contrôleur, schéma strict, prises concurrentes, propriétaire/séquence, limites, expiration/déconnexion, conservation de progression pendant le déplacement, sauvegarde protégée et recharge disque, dépôt magnétique d’une carte et révélation de l’indice. Une erreur de compte de champs du nouveau parseur a été corrigée après le premier test réseau. Premier passage avec le `EPERM` Windows déjà observé dans un ancien test de renommage atomique ; relance réussie. Vérification d’espacement Git réussie ; avertissement Vite habituel du bloc Three.js à 524 kB. Aucun essai physique Quest/téléphone/HAOS ni simulation de session XR matérielle, publication confirmée ci-dessous. Détails et limites dans [le guide de prise](quest-grabbing.md).

Publication 0.7.0 autorisée et confirmée le 18 novembre 2026 : commit `15228cb` sur `main`, workflow [44284989466](https://github.com/nicasGit/MyRoom/actions/runs/44284989466) réussi (validation Linux et publication). Contrôles locaux relancés avant commit : typecheck, build et 73 tests réussis. Manifeste `ghcr.io/nicasgit/myroom:0.7.0` vérifié après publication : Linux ARM64, label 0.7.0, digest `sha256:d4368412b54dd352b4c70240151b8add32c01be913d57d72a91231559594e78c`. Disponibilité du registre confirmée ; aucune exécution physique HAOS, Raspberry Pi ou Quest vérifiée.

### 18 novembre 2026 — Phase 2 publiée en 0.6.0 depuis la branche dédiée

Branche `feat/menthe27-blackjack-hybrid`, à partir de `b7617d4`. Lecture préalable des cinq documents demandés. Module indépendant `blackjack-hybrid` enregistré avec source aléatoire cryptographique injectée au point de composition serveur, sans dépendance Three.js/WebSocket dans les règles. Trois manches, paquet privé, projection masquée, capitaine issu des connexions, réservations de cartes de 15 secondes et dépôts dans trois logements. Contexte d’action fourni par le serveur, commandes et révisions validées. Récompenses intermédiaires via un contrat générique `earnedRewards`, maintenance des verrous et indices administrateur ; `symbol-chest` et `blackjack-legacy` restent inchangés.

Menthe 27 `0.2.0` remplace le casino prévu par une instance jouable puis attend le Vidéoclub rétro, sans victoire finale. La version `0.1.0` est conservée au catalogue pour la compatibilité des instantanés. Les neuf points existants sont inchangés, seule la position `table` est réutilisée. État de jeu séparé des placements. Aucun changement de calibrage A/B, de schéma de pièce ou de stockage existant.

Contrôles finaux locaux : `npm run typecheck`, `npm run build` et `npm test` réussis, **63 tests**, dont onze tests de règles/intégration hybrides et un test réseau supplémentaire avec quatre connexions. Couverture : blackjack naturel, 17 souple, égalités, trois échecs/rattrapage, deux solutions du double as, choix erronés/correction, états privés, locks/expiration, capitaine, gains partiels/restauration, partie normale jusqu’à l’attente et état final restaurable. Le test réseau couvre refus hors capitaine, réattribution, actions simultanées, libération après déconnexion, indices/reset protégés, trois manches/récompenses et reconnexion dans l’attente finale. Un contrôle de réinitialisation du blackjack historique après sa réussite conserve désormais un état restaurable et rejouable, sans toucher à ses règles. Avertissement Vite habituel pour le bloc Three.js de 524 kB ; vérification d’espacement Git réussie.

Dans Chrome local : parcours des trois manches jusqu’au Vidéoclub en attente, commandes DOM par clics synthétiques (onglet partagé masqué), réservation d’une carte via projection d’un clic sur l’aperçu 3D, et capture Canvas du rendu Three.js inspectée. Inscriptions agrandies et boutons remontés pour dégager les logements. Canvas d’aperçu présent et vue du croupier masquée pendant la main. Pièce temporaire supprimée après essai ; aventure classique et simulation désactivée rétablies. Ces simulations ne constituent pas des essais WebXR physiques. Progression, paquet et noms restent en mémoire ; la persistance disque appartient toujours à la Phase 3. Aucun essai physique Quest/téléphone/HAOS.

Version de l’add-on et diagnostic client portés à 0.6.0, changelog, architecture, README et guides actualisés. Le [guide hybride](adventures/blackjack-hybrid.md) décrit le fonctionnement et les limites. Publication sur `main` autorisée explicitement et confirmée : commit `ba58026` issu de la branche dédiée, workflow [44272739627](https://github.com/nicasGit/MyRoom/actions/runs/44272739627) réussi (validation Linux et publication). Après le workflow, manifeste `ghcr.io/nicasgit/myroom:0.6.0` vérifié pour Linux ARM64, label de version 0.6.0 ; digest `sha256:175bf5b410f1cdc15a4af3228e843a9fd999be3f29902e77eec29c7acf5d56dd`. Cela confirme la disponibilité de l’image, pas son exécution sur HAOS, Raspberry Pi ou Quest.

Publication préalable 0.5.1 confirmée : commit `b7617d4`, workflow [44268181791](https://github.com/nicasGit/MyRoom/actions/runs/44268181791) réussi, manifeste Linux ARM64 `ghcr.io/nicasgit/myroom:0.5.1` vérifié après exécution, digest `sha256:fd9337f28208b5b6781e94640a27fbad4e11ee5b681530bab3493c1ac9eaf19b`. Les 51 tests, le typecheck et la compilation avaient réussi avant son push. La première commande globale commit/push avait été refusée par la revue automatique ; les douze fichiers ont été sélectionnés et inspectés explicitement, puis l’autorisation manuelle a confirmé la publication sur main.

### 18 novembre 2026 — accès direct aux énigmes en mode test, préparation 0.5.1

Publication 0.5.1 demandée par l’utilisateur avant la Phase 2. Version et changelog préparés ; disponibilité du registre à vérifier après le workflow. Utilisation de la compétence commit pour enregistrer ces changements sans modification des règles du coffre et du blackjack historique.

- Administration : sélecteur « Accès direct aux énigmes », activé par la case existante « Autoriser la simulation PC ». Le bouton « Tester cette énigme » démarre immédiatement l’énigme choisie pour tous les joueurs, sans résoudre les précédentes. Les étapes prévues mais non implémentées sont désactivées ; Menthe 27 ne donne toujours pas accès au blackjack hybride.
- Commande protégée `POST /api/admin/adventure/test-step` : jeton, origine, JSON strict, étape disponible, placements configurés, mode test et révision courante requis. Refus explicites et journal `adventure_test_step`, sans modification des pièces ou du calibrage A/B.
- Session temporaire identifiée par `testStartStepId`, état initial de l’énigme ciblée, inventaire indépendant et états diffusés aux joueurs. Le premier accès garde une copie en mémoire de la partie normale ; les accès suivants réinitialisent uniquement la session de test. Désactiver le mode test restaure cette copie et abandonne les récompenses de test. Un changement de pièce ou une réinitialisation abandonne également la copie ; elle ne survit pas à un redémarrage serveur. Changer d’aventure pendant un accès direct est refusé jusqu’à la sortie du mode test.
- Contrat de restauration validant le point de départ temporaire, les étapes ignorées et l’inventaire, sans assouplir la restauration des sessions normales. Bandeau de test dans les commandes joueur et statut explicite dans l’administration.

Vérifications : `npm run typecheck`, `npm run build` et `npm test` réussis avec **51 tests**. Deux nouveaux tests couvrent accès direct, états isolés, fin et restauration JSON de test, étapes indisponibles, commandes périmées et retour à la progression normale. Test réseau étendu : authentification/origine, champs inconnus, révision périmée, refus sans mode test, diffusion aux quatre joueurs et restauration de la partie précédente. Dans Chrome local, connexion admin puis activation du mode, choix du blackjack historique, démarrage direct et retour au coffre en préparation à la désactivation vérifiés par les commandes de l’interface. Aucun essai physique téléphone/Quest/HAOS. Avertissement Vite habituel sur le bloc Three.js supérieur à 500 kB. Aucune publication d’image ou modification de version dans cette tranche.

### 18 novembre 2026 — préparation de la publication 0.5.0

Publication confirmée : commit `ffe92e5` intégré sur `main` après autorisation explicite, workflow [44262750589](https://github.com/nicasGit/MyRoom/actions/runs/44262750589) terminé avec succès. Manifeste `ghcr.io/nicasgit/myroom:0.5.0` vérifié après le workflow : Linux ARM64 et label de version 0.5.0 ; digest `sha256:f77c8f24e0cdf3af4f6955355413353e9ea9f03ea9f936a2446ae8a30fef7507`. La disponibilité du registre ne constitue pas un essai sur HAOS, Raspberry Pi, téléphone ou Quest. La revue automatique avait bloqué le premier push sur `main` ; une autorisation manuelle explicite a ensuite permis cette intégration et publication.

Publication demandée explicitement après le commit `1b530bc` et son push sur `feat/modular-adventures-phase1`. Préparation de l’intégration sur `main`, version de l’add-on portée à 0.5.0 et changelog actualisé. Le workflow existant conserve Linux ARM64, HTTPS/WSS et les contrôles logiciels avant publication. Les pièces existantes ne sont pas migrées ni supprimées. Phase 2 toujours non commencée ; noms et progression en mémoire uniquement.

Contrôles locaux de cette version : `npm run typecheck` et `npm run build` réussis ; `npm test` réussit avec 49 tests après relance. Le premier passage a rencontré un `EPERM` Windows sur le renommage atomique du fichier temporaire du test de bibliothèque ; la relance sans modification du code passe. Avertissement Vite habituel pour le bloc Three.js supérieur à 500 kB. Le workflow a également réussi ses trois commandes de validation sous Linux avant la construction et publication ARM64.

### 18 novembre 2026 — architecture modulaire, Phase 1 locale

Branche locale `feat/modular-adventures-phase1`, à partir du commit publié `c893269`. Aucune modification de la version HAOS 0.4.2, aucun push, aucune publication ni essai matériel. Phase 2 non commencée, conformément à la demande utilisateur.

- Lecture des consignes, de l’architecture et du présent récapitulatif avant modification. Présentation préalable de la cartographie, des contrats TypeScript, de la compatibilité, des fichiers et des risques ; détail durable dans [l’analyse Phase 1](adventures/phase1-architecture.md).
- Contrats purs `PuzzleModule`, instances, objets, rôles, transformations futures, récompenses, manifestes et instantanés versionnés ; registre avec validation des configurations, états et actions.
- Projection publique propre à chaque module, séparée de son état privé et de sa configuration ; test d’un module masqué pour préparer les futurs jeux à information cachée sans les implémenter.
- Coffre encapsulé dans `symbol-chest`, blackjack actuel conservé dans `blackjack-legacy`. `adventure.ts` reste l’entrée publique et réexporte une façade de compatibilité séparant proximité/transport des règles. Anciennes commandes, neuf points, panneau mural, rendu détaillé et calibrage A/B conservés.
- Moteur linéaire : instances indépendantes, révisions, transitions, inventaire dédupliqué et événements. Contrat pur de restauration JSON validant références, état des modules, réussite, étapes futures et inventaire, avant mutation. Aucune sauvegarde automatique de session ou API de restauration disque ajoutée.
- Catalogue de manifestes validés : démonstration classique et `menthe27@0.1.0`, plus chargement optionnel de JSON externes sans changement de code moteur. Menthe 27 expose le coffre puis une étape `planned` ; aucun module `blackjack-hybrid`, aucun faux succès final ni récompense ♣/♥/♠.
- Choix/arrêt de l’aventure dans l’administration ; saisie des quatre noms par place, suggestions Léon/Reno/Fabien/Nicolas, validation et révision côté serveur, diffusion aux clients. Noms, choix d’aventure et progression restent en mémoire ; le nom d’une place subsiste lors d’une déconnexion, sans devenir un compte joueur.
- Nouvelle commande WebSocket `puzzle_action` avec ID d’instance, en complément de `adventure_action`. Adaptations limitées du client pour les noms, l’état générique et l’attente explicite d’une étape future. Les fichiers de modèle/stockage des pièces et de calibrage ne sont pas modifiés.

Vérifications finales : `npm run typecheck`, `npm run build` et `npm test` réussis, avec 49 tests (les 39 existants et dix nouveaux). Un test de restauration a été corrigé pour ne pas tenter de redécouvrir une balise déjà acquise. Tests de modules sans Three.js/WebSocket, instances multiples, commandes périmées, récompenses, aller-retour JSON/corruption, ancienne bibliothèque non réécrite et catalogue externe. Le test réseau contrôle les noms aux quatre clients, sélection protégée, commandes génériques par instance, déconnexion sans perte des découvertes et attente après le coffre. Avertissement Vite conservé pour le bloc Three.js supérieur à 500 kB ; `git diff --check` sans erreur d’espacement.

Dans Chrome local : sélection de Menthe 27, enregistrement des quatre noms suggérés, nom Léon dans la vue joueur, coffre résolu en simulation avec une erreur récupérable puis attente sans victoire finale. Aucun test physique téléphone, Quest ou HAOS. Les limites du rendu historique, des noms par place, de la restauration en mémoire et des phases différées sont décrites dans les nouveaux guides. La pièce temporaire créée pour cet essai a été supprimée ; aventure classique, noms par défaut et simulation désactivée rétablis après vérification.

### Ajout du 17 novembre 2026 — coffre détaillé et panneau mural, 0.4.2

Publication confirmée le 17 novembre : commit `d97580c`, workflow GitHub Actions `44151206525` terminé avec succès et manifeste de l’image ARM64 0.4.2 vérifié dans GHCR après ce workflow. La disponibilité dans le registre ne constitue pas une validation d’exécution sur Raspberry Pi, téléphone ou casque.

Contrôles 3D complémentaires dans Chrome : rayon synthétique sur une tuile du panneau correctement résolu en action `press_symbol` ; ouverture du couvercle convergeant vers −1,5 radian après 120 images simulées et serrure invisible après réussite. Pièce temporaire supprimée et simulation serveur désactivée à la fin des essais. Ces contrôles logiciels ne constituent pas un essai WebXR sur casque.

- Coffre Three.js avec corps creux, planches et texture de veinage générée en Canvas, couvercle bombé articulé, sangles métalliques, rivets, poignées et serrure retirée à la réussite. Matériaux bois/métal avec éclairage local ; conservation de l’angle du couvercle lors des mises à jour de partie pour éviter de répéter l’ouverture.
- Combinaison déplacée sur un panneau mural : quatre tuiles illustrées et quatre logements montrant les choix partagés. Saisie par boutons tactiles ou sélection du panneau 3D à la gâchette ; il faut désormais approcher le panneau pour entrer les symboles.
- Panneau de 1 × 0,8 m à hauteur centrale fixe de 1,35 m, orienté vers l’intérieur ; validation du mur, des marges aux coins, des ouvertures et obstacles. Proposition automatique pour les anciennes pièces, sans déplacement de leurs neuf points. Position mur/décalage persistée à la sauvegarde.
- Sélection et déplacement du panneau sur le plan administrateur et au viseur tactile pendant la préparation. Départ bloqué si aucun mur libre ; aucune prise libre de tuiles ajoutée.

Vérifications : typecheck, compilation et 39 tests réussis. Trois nouveaux tests couvrent migration/stockage du panneau, placement et exclusions géométriques, et refus de saisir les symboles depuis le coffre ; test réseau étendu pour accepter un panneau valide et refuser un placement mural invalide. Dans Chrome local, rendu du coffre fermé et du panneau inspecté ; panneau déplacé sur un autre mur depuis l’administration et sauvegardé ; parcours en simulation avec erreur de combinaison, puis ordre correct débloquant le blackjack. Aucun essai physique sur téléphone ou Quest, pas de détection automatique des murs réels ni de restitution de leur éclairage. Guide, architecture et changelog actualisés.

### Ajout du 17 novembre 2026 — préparation et placements, 0.4.1

Publication confirmée : commit `181ed20`, workflow GitHub Actions `44138561838` réussi et manifeste ARM64 0.4.1 disponible dans GHCR après ce workflow. Vérification logicielle supplémentaire : cent variantes d’une pièce 4 × 3 m avec obstacle central ont toutes produit un placement validé. Cela ne valide pas les passages physiques ni l’exécution sur HAOS.

- Nouvelle proposition aléatoire ordonnée : centre libre pour le coffre, table proche et sept autres éléments dans des secteurs angulaires avec rotation et rayon variables. Coordonnées validées contre le contour, les obstacles et l’espacement minimal ; repli vers les positions libres lorsque le centre des limites est indisponible.
- Déplacement des repères par glissement souris/tactile dans le plan admin. Modifications non sauvegardées empêchant le départ local.
- Phase de préparation et bouton **Commencer les énigmes** ; actions de jeu refusées avant le départ. Réinitialisation et modification du modèle actif retournent en préparation.
- En AR tactile, choix d’un élément et placement au viseur après A/B, avec jeton admin en mémoire uniquement. Endpoint spécifique protégé : préparation requise, révisions de jeu et bibliothèque contrôlées, géométrie de la pièce conservée. Positions enregistrées et diffusées aux joueurs ; déplacement refusé après départ.
- En préparation, tous les éléments 3D sont visibles avec leur identité pour faciliter le placement. Aucun système de prise libre aux contrôleurs ajouté ; sur casque sans panneau tactile, préparation depuis le plan admin d’un autre appareil.

Vérifications : typecheck et compilation réussis, 36 tests réussis après correction d’un placement de test dirigé dans un obstacle. Deux nouveaux tests couvrent préparation/départ et vingt variantes de répartition valides avec principaux centraux ; le test réseau couvre placement autorisé, jeton absent, révision périmée et refus après départ. Dans Chrome : glissement réel à la souris d’un repère et sauvegarde, blocage du départ avec modifications non sauvegardées, départ admin ; contrôleur tactile testé avec calibrage et visée synthétiques, sauvegarde effective et champ de jeton vidé. Pièce temporaire supprimée après les vérifications. Aucun essai physique AR sur téléphone ou Quest effectué par l’agent. Guide des énigmes et changelog actualisés.

### Ajout du 17 novembre 2026 — deux énigmes, version 0.4.0

- Coffre des quatre symboles : quatre découvertes partagées, combinaison Soleil → Arbre → Lune → Étoile, erreur récupérable et ouverture animée.
- Blackjack débloqué après le coffre : As + 6, découverte des cartes 4/8/Roi, un choix par essai, As souple, explication des erreurs et récompense clé virtuelle/chiffre 7. Aucun pari.
- Placement de neuf éléments dans l’administration, proposition géométrique, ajustement sur plan ou coordonnées et enregistrement indépendant dans chaque pièce. Anciennes pièces compatibles sans configuration d’énigmes.
- Objets Three.js, textes et rayons de visée, interaction à la gâchette et boutons tactiles. Affichage et proximité liés au calibrage A/B ; jeu suspendu pendant le relevé.
- Serveur autoritaire : validation stricte des actions, cibles, révisions, phase, découvertes et proximité déclarée. Actions et commandes admin journalisées sans réintroduire `tracking_changed`.
- Simulation solo PC autorisée explicitement par l’administrateur ; progression commune jusqu’à quatre joueurs, remise à zéro admin. Placements persistés, partie et autorisation de simulation en mémoire uniquement.
- Guide : [les deux premières énigmes](first-puzzles.md).

Vérifications exécutées : typecheck et compilation réussis ; 34 tests réussis, dont sept nouveaux tests sur règles, validation, stockage et sélection 3D des panneaux Sprite avec caméra explicite ; extension du test HTTP/WebSocket vérifiant la diffusion aux quatre joueurs, les révisions et les protections admin. Dans Chrome local : proposition et sauvegarde des placements depuis l’administration, parcours complet en simulation avec erreur de combinaison, cartes 8 et Roi incorrectes puis 4 gagnant, construction/libération de la scène 3D finale. Pièce temporaire supprimée et simulation serveur désactivée après le test.

Limites : aucun essai physique téléphone/Quest par l’agent ; pas de preuve de position physique, d’ancre partagée, d’occultation du mobilier réel ou de vérification automatique des passages. La proposition des positions doit être vérifiée dans la pièce. L’audio dépend de son autorisation par le navigateur. Avertissement Vite conservé pour le bloc Three.js supérieur à 500 kB.

Publication 0.4.0 confirmée le 17 novembre : fonctionnalités du commit `59f40b0`, correction de sélection 3D `a76ff4e`, workflow GitHub Actions `44133245925` réussi et manifeste ARM64 0.4.0 vérifié dans GHCR après ce workflow. Cette vérification confirme la disponibilité de l’image, pas son exécution sur HAOS ou un appareil physique. Le lien de récapitulatif du README a également été actualisé.

Ce récapitulatif doit être actualisé à chaque modification du projet, dans le même ensemble de changements. Cette règle est inscrite dans les [consignes du dépôt](../AGENTS.md) et couvre aussi la configuration, le déploiement et la documentation. Les vérifications rapportées doivent correspondre à celles effectivement exécutées ; une version ou publication ne doit pas être annoncée avant confirmation.

- Création du squelette et des dossiers [client](../client/), [server](../server/), [haos-addon](../haos-addon/) et [docs](./).
- Création des consignes [AGENTS.md](../AGENTS.md), de l’[architecture](../ARCHITECTURE.md), du [README](../README.md) et du [.gitignore](../.gitignore).
- Client TypeScript, Three.js et WebXR, construit avec Vite.
- Serveur Node.js, TypeScript et WebSocket avec la bibliothèque `ws`.
- Configuration npm avec scripts de développement, vérification TypeScript, compilation et tests.
- Add-on Home Assistant OS ciblant **aarch64 / Raspberry Pi 5**.
- Nginx sert le client et relaie les WebSocket et API ; HTTPS est terminé par un proxy externe avec certificat reconnu par les appareils.
- Port interne Node.js non exposé directement en production. Pas d’Ingress Home Assistant dans ce prototype.
- Aucun secret ou certificat privé ajouté au dépôt.

Le projet cible Quest 2, Quest 3 et Quest 3S, en détectant les capacités disponibles à l’exécution. Le modèle déclaré par le navigateur ne sert pas à garantir une fonctionnalité.

## 2. GitHub, images et installation HAOS

- Dépôt utilisable comme dépôt d’add-ons Home Assistant : [nicasGit/MyRoom](https://github.com/nicasGit/MyRoom).
- Workflow GitHub Actions : installation des dépendances, typecheck, compilation, tests, construction et publication de l’image Linux ARM64 sur GHCR.
- Images versionnées sous `ghcr.io/nicasgit/myroom`, avec le tag de version et `latest`.
- Bouton **Ouvrir l’interface Web** sur la page de l’add-on, vers le port LAN configuré.
- Documentation du déploiement local, de l’origine publique HTTPS et du proxy WebSocket.
- Après le signalement de l’erreur `manifest unknown` sur 0.1.6, disponibilité du manifeste ARM64 vérifiée avant d’annoncer les mises à jour suivantes 0.2.0 à 0.3.0.

La publication **0.3.0** a terminé avec succès dans GitHub Actions et son manifeste ARM64 a été vérifié. Cela confirme la présence de l’image dans le registre, pas son exécution physique sur Raspberry Pi.

Voir [le déploiement](deployment.md) et [le guide de l’add-on](../haos-addon/DOCS.md).

## 3. Diagnostic WebXR et multijoueur

- Page de diagnostic : contexte sécurisé, présence de l’API WebXR, version du client et disponibilité de `immersive-ar`.
- Démarrage d’une session AR avec référentiel `local-floor`.
- Affichage des **quatre places joueurs**, avec indication de sa propre connexion.
- Attribution des places par le serveur, refus du cinquième joueur et réutilisation des places libérées.
- Reconnexion WebSocket automatique après une coupure ordinaire ; les déconnexions administratives ne relancent pas automatiquement le joueur.
- Contrôle de l’origine, limite de taille des messages, limitation de fréquence et heartbeat.
- Énigme de démonstration : état autoritaire côté serveur, résolution partagée, contrôle de révision et réinitialisation administrative.

Un seul joueur peut tester le prototype : il n’est pas nécessaire d’occuper les quatre places. Plusieurs onglets peuvent servir à vérifier la synchronisation sur ordinateur. Les poses des joueurs ne sont pas encore diffusées et il n’y a pas de jeu d’énigmes complet.

## 4. Calibrage spatial A/B

- Deux repères physiques communs **A puis B**, placés au sol à au moins **50 cm** l’un de l’autre.
- A définit l’origine ; A → B définit l’axe horizontal +X ; dimensions en mètres.
- Placement au contrôleur par la gâchette et, sur téléphone compatible, au bouton tactile avec le rayon central.
- Deux marqueurs distincts, messages de progression et possibilité de recommencer.
- Le rayon est projeté sur le plan du sol local `y = 0` ; il ne s’agit pas d’un hit-test de surface réelle.
- Recentrage, fin de session et changement de pièce active invalident le calibrage.

Tous les appareils doivent retrouver les mêmes repères, dans le même ordre. Ce mécanisme **n’est pas une ancre spatiale partagée** et ne reconnaît pas automatiquement les repères lors d’une nouvelle session.

## 5. Commandes tactiles et corrections du placement

Correction 0.3.1 (`8c240bc`) : après B, le bouton de placement reste dans la barre, désactivé et libellé « Calibrage terminé ». Une largeur minimale réserve aussi la place de ce libellé. Auparavant, il disparaissait dans la boucle XR : la barre pouvait alors se réorganiser pendant l’appui tactile et déplacer « Quitter l’AR » sous le doigt. Cette cause possible de la sortie signalée après les deux repères doit encore être confirmée sur l’appareil de l’utilisateur. Le correctif évite ce changement de disposition ; il ne prétend pas résoudre une fermeture système du navigateur ou du casque.

Vérifications du 17 novembre : typecheck et compilation réussis, 26 tests réussis. Dans Chrome, passage simulé « Placer B » → « Calibrage terminé » : position de Quitter inchangée sur 320×568, 390×844, 640×320 et 844×390. Un appui souris simulé avec le gestionnaire de placement réel produit un seul placement et aucune action Quitter. Aucune session XR réelle effectuée pour ce correctif.

Publication 0.3.1 confirmée le 17 novembre : workflow GitHub Actions du correctif terminé avec succès et manifeste ARM64 disponible dans GHCR. Cela ne confirme pas encore le résultat sur l’appareil de l’utilisateur.

- Panneau DOM Overlay, si proposé par le navigateur : **Placer A/B**, **Recommencer**, **Quitter l’AR**, puis commandes du relevé.
- Viseur central et indication verte lorsque la projection de placement est valide.
- Prise en compte immédiate du contact tactile, sans double placement au relâchement ou au clic synthétique.
- Position valide très récente utilisable à l’appui : au maximum **100 ms**.
- Tolérance aux pertes brèves du suivi : attente d’une position valide pendant **1,5 seconde**.
- Refus explicites pour les positions périmées, l’absence de suivi, la visée vers l’horizon ou une projection trop distante.
- Messages de délai dépassé en l’absence d’images XR.
- Sélection XR native de repli hors du panneau, sans double action liée aux commandes HTML.
- Panneau de relevé placé sous le viseur, défilant sur petits écrans, avec barre de commandes fixe et instructions/journal repliables.

Les difficultés rapportées sur téléphone — bouton A sans réaction apparente, journal déconnecté et alternance de suivi valide/invalide — ont conduit à ces corrections et aux diagnostics détaillés. Le proxy externe doit aussi autoriser les WebSocket ; l’utilisateur a indiqué avoir activé cette option dans Nginx.

Voir [le parcours mobile](mobile-ar.md).

## 6. Journal HAOS et diagnostics

- Logs serveur JSON horodatés sur la sortie standard : démarrage, connexions, départs, refus, erreurs et actions d’énigme.
- Métadonnées de connexion disponibles pour l’administration : identifiant, place, adresse et navigateur.
- Accès et erreurs Nginx dirigés vers les sorties du conteneur.
- Événements du client XR validés par le serveur puis associés à l’identité et à la place du joueur.
- Traces de demande/démarrage/fin de session, placement demandé/accepté/refusé/expiré, calibrage et changement de suivi.
- Accusés de réception WebSocket pour indiquer que le journal serveur a reçu l’événement.
- File limitée d’événements en attente pendant une déconnexion.
- Depuis 0.3.0 : disponibilité des surfaces, import réussi ou erreur d’import Quest.
- Les polygones bruts des surfaces et les images caméra ne sont pas envoyés dans les journaux.

L’administration expose les **100 derniers événements Node.js** ; ce tampon n’est pas une archive persistante et ne comprend pas les lignes d’accès Nginx.

Voir [le guide des journaux](logging.md).

## 7. Interface d’administration

- Page dédiée `/admin.html`, accessible depuis la page joueur.
- Consultation de la disponibilité serveur, des joueurs, de l’état de l’énigme et du journal récent.
- Réinitialisation de l’énigme et déconnexion d’un joueur.
- Bibliothèque de pièces : aperçu 3D, activation, suppression avec confirmation et export JSON.
- Actualisation périodique sans occuper une place joueur.
- API protégées par un jeton administrateur d’au moins **16 caractères**, configuré avec `admin_token` dans HAOS ou `ADMIN_TOKEN` en développement.
- Jeton conservé en mémoire dans la page, absent des modèles enregistrés. Vérification du jeton, de l’origine et des entrées côté serveur.

Pas de comptes utilisateurs, de gestion de plusieurs rôles ou de bannissement persistant. L’interface ne propose pas encore un éditeur complet de géométrie depuis l’administration.

## 8. Construction manuelle de pièces 3D

- Création d’une pièce après calibrage A/B, avec nom et hauteur mesurée des murs.
- Contour de **3 à 32 coins**, relevés dans l’ordre au sol puis fermés.
- Contours concaves autorisés : plusieurs coins et décrochements dans les murs.
- Validation des coordonnées, de la surface, des coins trop proches, des alignements inutiles et des croisements.
- Jusqu’à **32 obstacles**, représentés par des boîtes alignées sur les axes A/B.
- Deux coins opposés pour l’empreinte au sol d’un obstacle, avec nom et hauteur saisis manuellement.
- Possibilité de représenter une table, banquette, chaise ou bureau par une ou plusieurs boîtes ; pas de catalogue de modèles détaillés de mobilier.
- Validation pour empêcher un obstacle de dépasser du contour ou de la hauteur des murs.
- Brouillon local, annulation, retrait du dernier élément selon l’étape et enregistrement explicite.
- Aperçu 3D orientable/zoomable à la souris ou au toucher ; superposition du modèle en AR après calibrage.

Les murs ont une hauteur uniforme. Les boîtes ne reproduisent pas les pieds, dossiers, textures ou formes détaillées du mobilier. Le modèle n’assure ni occlusion réelle ni protection contre les obstacles physiques.

## 9. Plusieurs pièces et conservation sur le serveur

- Bibliothèque de **20 pièces maximum**, avec identifiants, noms et une pièce active.
- Enregistrement du modèle et de la sélection active dans `rooms.json`.
- Sous HAOS : stockage dans **`/data/myroom/rooms.json`**, conservé lors d’un redémarrage ou d’une mise à jour de l’add-on.
- En développement : dossier de données du serveur par défaut, ou emplacement défini par `DATA_DIR`.
- Écriture dans un fichier temporaire puis renommage avant remplacement de l’état en mémoire.
- Contrôle de révision pour éviter les écrasements par un appareil disposant d’un ancien état.
- Refus d’un fichier corrompu au démarrage, afin de préserver les données existantes.
- Diffusion du modèle actif aux joueurs par WebSocket.
- Activation, suppression et export ; restauration manuelle documentée, sans import graphique de sauvegarde à ce stade.

Une seule pièce est active pour la salle multijoueur : plusieurs fiches ne créent pas plusieurs parties simultanées. Les connexions et l’état des énigmes restent en mémoire et sont perdus au redémarrage. Prévoir une sauvegarde Home Assistant incluant les données de l’add-on avant une désinstallation.

Voir [la bibliothèque de pièces](room-library.md).

## 10. Portes et fenêtres — 0.2.2

- Ouvertures rectangulaires attachées à un mur entre deux coins consécutifs.
- Choix du type, du nom, de la largeur et de la hauteur.
- Position mesurée depuis le premier coin du mur jusqu’au bord de l’ouverture.
- Porte commençant au sol ; hauteur du bas réglable pour une fenêtre.
- Positionnement optionnel par visée du sol au pied du centre de l’ouverture, projetée sur le mur sélectionné.
- Refus d’une visée éloignée de plus de 50 cm de la ligne du mur choisi.
- Découpe réelle de la géométrie du mur dans l’aperçu et le modèle AR ; contours verts pour les portes, jaunes pour les fenêtres.
- Retrait d’une ouverture du brouillon et conservation avec chaque pièce après sauvegarde.
- Limite de **32 ouvertures**, validation des dimensions et refus des chevauchements.
- Anciennes pièces sans champ d’ouvertures toujours lisibles, avec liste vide.

Pas de vantail animé, vitrage, collision ou détection automatique des ouvertures.

## 11. Import expérimental Quest 3 — 0.3.0

- Demande de `plane-detection` comme capacité WebXR optionnelle.
- Affichage du nombre de surfaces et message explicite si l’API ou les surfaces ne sont pas disponibles.
- Lecture des plans uniquement à la demande, sur une image XR active, avec leur pose courante ; pas de réutilisation d’une pose perdue.
- Transformation des surfaces vers le repère commun A/B.
- Sélection d’un contour de sol valide contenant A et B, proche du sol local ; préférence pour les surfaces identifiées comme sol.
- Conservation des décrochements du polygone disponible, sans remplacement par une enveloppe convexe.
- Hauteur des murs estimée depuis des surfaces identifiées comme plafond ou mur ; à défaut, **2,5 m proposée**, signalée comme devant être mesurée.
- Boîtes approximatives possibles pour les surfaces horizontales identifiées comme table, bureau, canapé ou lit.
- Rejet signalé des meubles dont la boîte sort des limites.
- Création d’une **nouvelle fiche en brouillon**, sans écraser la pièce active ni un brouillon déjà commencé.
- Vérification puis sauvegarde via les mêmes API et la même bibliothèque persistante que le relevé manuel.
- Panneau de messages 3D si DOM Overlay n’est pas disponible.
- Boutons des contrôleurs WebXR standard : **A droit / X gauche** importer, **B droit** enregistrer, **Y gauche** annuler ; nouveaux appuis uniquement.

### Parcours de premier essai

1. Mettre à jour l’add-on vers 0.3.0 et recharger MyRoom.
2. Effectuer la configuration de l’espace dans le Quest 3.
3. Ouvrir MyRoom en HTTPS dans Meta Quest Browser et saisir le jeton administrateur avant l’AR.
4. Démarrer immersive-ar et autoriser l’accès aux données spatiales si demandé.
5. Calibrer A/B avec les deux mêmes repères physiques au sol.
6. Importer les surfaces par le bouton du panneau ou A/X.
7. Vérifier la géométrie et les avertissements ; B droit enregistre, Y gauche annule.
8. Vérifier la fiche dans l’administration et consulter le journal HAOS en cas de refus.

### Limites de cet import

L’application lit ce que le navigateur expose depuis la configuration de l’espace. Elle ne lance pas le scan système, n’importe pas de maillage détaillé, ne reconnaît pas elle-même les objets et ne fusionne pas plusieurs sols. Le contour fourni peut être un simple rectangle. Certains meubles ou murs peuvent manquer, et plusieurs plans d’un même meuble peuvent produire des doublons. Les portes et fenêtres restent manuelles.

Sans DOM Overlay, le panneau 3D est un affichage de messages ; les corrections détaillées nécessitent les outils manuels sur un appareil proposant le panneau HTML. Ne sauvegarder que si le modèle convient. Chaque joueur doit toujours refaire A/B.

Voir [le guide Quest et ses limites](quest-scan.md).

## 12. Historique des versions et commits

| Version | Commit | Réalisation principale |
|---|---|---|
| 0.1.0 | `7ea7175` | Squelette, diagnostic WebXR, quatre joueurs, calibrage, add-on et publication ARM64 |
| 0.1.1 | `d0b6d64` | Lien de l’interface Web dans HAOS et accès réseau local |
| 0.1.2 | `e1e50ab` | Journaux serveur et Nginx dans les sorties HAOS |
| 0.1.3 | `25a1c43` | Administration protégée, joueurs, journal et commandes |
| 0.1.4 | `e7f4677` | Commandes tactiles AR |
| 0.1.5 | `8a7252e` | Retour des appuis et diagnostics XR |
| 0.1.6 | `8b62a8d` | Tolérance aux pertes brèves de suivi pendant le placement |
| 0.2.0 | `30f3ebc` | Reconstruction manuelle et bibliothèque persistante de pièces |
| 0.2.1 | `59c55c5` | Panneau mobile dégagé du viseur |
| 0.2.2 | `3467c20` | Portes et fenêtres sauvegardées, avec découpes des murs |
| 0.3.0 | `f23af74` | Import expérimental des surfaces Quest et commandes contrôleur |
| 0.3.1 | `8c240bc` | Barre de commandes stable après B pour éviter une activation involontaire de Quitter |
| 0.3.2 | `98dc09a` | Application web installable depuis Chrome avec icônes et lancement autonome |
| 0.3.3 | `8eace08` | Jeton et erreurs de sauvegarde dans l’AR, réglage local de l’alignement |
| 0.3.4 | `f359e57` | Retrait des logs répétitifs de suivi, filtrage des anciens clients |

Voir aussi le [changelog de l’add-on](../haos-addon/CHANGELOG.md).

## 13. Vérifications effectuées et résultats matériels

### Compilation et tests logiciels

Sur l’état fonctionnel 0.3.0 :

- `npm run typecheck` : réussi pour le client et le serveur.
- `npm run build` : réussi pour Vite et le serveur TypeScript. Vite signale un chunk Three.js supérieur à son seuil indicatif de 500 ko ; ce n’est pas une erreur de compilation.
- `npm test` : **26 tests réussis**.
- CI GitHub Actions 0.3.0 : validation et publication réussies.
- Présence de l’image 0.3.0 ARM64 vérifiée dans GHCR.

Les tests couvrent notamment les places joueurs, la synchronisation de l’énigme, les API et WebSocket, l’administration, les origines, la projection au sol, les appuis et pertes de suivi simulés, les entrées réseau, la persistance des pièces, les révisions concurrentes, les fichiers corrompus, les ouvertures et la conversion de surfaces Quest synthétiques.

Lors de la vérification de ce récapitulatif, une première exécution a rencontré une erreur Windows `EPERM` de renommage d’un fichier temporaire dans les tests de stockage. Une nouvelle exécution, sans modification du code, a réussi avec les 26 tests. Ce refus ponctuel n’a pas été reproduit ni diagnostiqué davantage.

### Vérifications dans Chrome intégré

- Administration, joueurs, journal et réinitialisation visible sur la page joueur.
- Aperçus 3D de pièces et parcours de relevé avec points injectés.
- Panneau mobile mesuré sur plusieurs tailles simulées, en portrait et paysage.
- Ajout/retrait de portes et fenêtres et placement de fenêtre par projection simulée.
- Import Quest avec surfaces synthétiques, protection du brouillon, ajout d’une ouverture puis annulation retrouvant la pièce active.

Ces essais de formulaire et de géométrie **ne constituent pas des sessions WebXR réelles**.

### Retours matériels de l’utilisateur

L’utilisateur a indiqué que son téléphone démarrait immersive-ar avec la caméra visible, puis a confirmé le fonctionnement du placement A/B après les ajustements de suivi. Ces retours ne valident pas la reconstruction complète, les ouvertures ou l’import Quest ajouté ensuite.

### Restant à valider sur matériel

- Sessions physiques sur Quest 2, Quest 3 et Quest 3S.
- Accès réel aux surfaces du Quest 3, permissions et qualité des contours fournis.
- Lisibilité du panneau 3D, mapping et fonctionnement des boutons sur les contrôleurs réels.
- Précision et stabilité du calibrage à plusieurs appareils dans la même pièce.
- Relevé complet et ouvertures sur téléphone réel.
- Exécution de l’image sur HAOS/Raspberry Pi 5, proxy HTTPS et conservation des pièces dans cette installation.

**Aucun essai physique Quest n’a été effectué par l’agent.** Docker n’était pas disponible dans l’environnement local ; la construction ARM64 a été réalisée par GitHub Actions. Voir [le détail des vérifications](verification.md) et [la procédure de validation casque](quest-validation.md).

## 14. Commandes de développement

```sh
npm ci
npm run dev
npm run typecheck
npm run build
npm test
```

Le développement se consulte sur `http://localhost:5173/` ; l’administration sur `/admin.html`. Chrome peut tester les interfaces et la logique en local, mais la disponibilité d’immersive-ar dépend de l’appareil. Un téléphone ou casque sur le LAN doit accéder à une origine HTTPS avec certificat reconnu, via le proxy correctement configuré pour les WebSocket.

`npm start` lance uniquement le serveur compilé ; en production, les fichiers du client sont servis par Nginx. Les secrets de configuration doivent rester hors de Git.

## 15. Application installable depuis Chrome — 0.3.2

- Manifeste d’application web avec identité stable, nom MyRoom, démarrage à la racine et affichage `standalone`.
- Icônes PNG 192 et 512 px et variante maskable, générées par un script Node sans dépendance externe.
- Bouton d’installation affiché quand Chrome le propose, prise en compte d’une annulation, des erreurs, de la confirmation `appinstalled` et du mode application.
- Instructions via le menu Chrome si le bouton n’est pas disponible ; aucune prétention à détecter toutes les installations depuis un onglet ordinaire.
- Ouverture de la même origine HTTPS HAOS depuis l’écran d’accueil. Le serveur reste nécessaire et aucun service worker/cache hors ligne n’est ajouté.
- Configuration Nginx pour le type MIME du manifeste et sa revalidation ; guide [d’installation mobile](installation-mobile.md).

L’installation réelle sur un téléphone et l’AR depuis l’application installée restent à valider physiquement. L’installation n’ajoute pas les capacités WebXR absentes du téléphone et ne configure pas l’accès extérieur au serveur.

Vérifications du 17 novembre : typecheck et compilation réussis après correction d’un conflit de déclaration TypeScript dans le nouveau module ; 26 tests existants réussis. Dans Chrome intégré, manifeste chargé et trois icônes décodées aux dimensions déclarées ; événements d’installation synthétiques vérifiant proposition, annulation, acceptation sans confirmation prématurée, confirmation et erreur du navigateur. Aucune installation Android réelle effectuée. Le type MIME Nginx est configuré mais n’a pas été essayé localement dans un conteneur.

Publication 0.3.2 confirmée le 17 novembre : workflow du commit `98dc09a` terminé avec succès et manifeste de l’image ARM64 disponible dans GHCR. L’installation sur le téléphone de l’utilisateur reste à effectuer.

## 16. Sauvegarde mobile et alignement local — 0.3.3

Après le signalement d’une sauvegarde impossible et d’un modèle parfois mal placé sur téléphone :

- Saisie du jeton administrateur possible dans le panneau AR, sans quitter la session et perdre le brouillon. Aucun jeton ajouté aux logs ou au stockage du modèle.
- Explication près du bouton de sauvegarde lorsqu’un contour, obstacle ou ajout d’ouverture reste à terminer ; erreurs du contour également visibles à cet endroit.
- Messages explicites pour jeton absent/refusé, réseau, délai dépassé ou réponse non JSON du proxy ; conservation du brouillon.
- Traces de demande, succès et échec de sauvegarde dans HAOS, limitées aux messages de diagnostic.
- Réglage local d’affichage après sauvegarde : décalages de 5 cm, hauteur, rotation de 1°, annulation vers le calibrage initial. Bloqué pendant un brouillon ; ne modifie pas la géométrie serveur et ne persiste pas après la session.

Typecheck et compilation exécutés avec succès après correction d’une incompatibilité d’itération DOM ; 27 tests logiciels réussis, dont un nouveau test de déplacement/rotation sans mutation du calibrage initial. Dans Chrome avec quatre points synthétiques et réponses HTTP simulées : sauvegarde bloquée avant fermeture, jeton manquant expliqué, jeton refusé conservant le brouillon, correction dans le champ AR puis succès ; champs secrets vidés après lecture et diagnostics vérifiés. Les protections des diagnostics contre l’envoi du jeton sont testées. Aucun essai physique de sauvegarde ou de réglage AR réalisé par l’agent.

La cause précise du refus sur l’appareil utilisateur n’est pas encore établie. Le réglage local peut aider un décalage stable, mais ne corrige ni la dérive du suivi ni une estimation incorrecte du sol. L’utilisateur a également indiqué que le redémarrage complet de Chrome avait levé son blocage d’installation précédent ; cela ne constitue pas une validation indépendante du certificat ou de l’installation Android.

La confirmation de sauvegarde valide aussi le schéma de la bibliothèque reçue et la présence de la pièce avant de supprimer le brouillon. Dans Chrome, réponses HTML HTTP 502, bibliothèque invalide et panne réseau simulées : message adapté, brouillon conservé et bouton de nouveau utilisable.

## 17. Nettoyage des journaux — 0.3.4

À la demande de l’utilisateur qui indique que la visée fonctionne, suppression des émissions `tracking_changed` côté client. Le serveur valide et accuse encore réception de ces événements pour les anciennes pages ouvertes, mais ne les écrit ni dans stdout/HAOS ni dans le tampon du journal admin. Le viseur et les messages à l’écran restent actifs, ainsi que les journaux de connexion, erreur, calibrage, placement et sauvegarde. Les lignes historiques HAOS ne sont pas effacées.

Le test d’intégration HTTP/WebSocket vérifie l’accusé de réception d’un ancien client et l’absence de cet événement dans les logs admin et stdout, tout en conservant les autres diagnostics. La version 0.3.4 comprend les améliorations de sauvegarde et d’alignement développées pour 0.3.3.

Vérifications finales : typecheck et compilation réussis, 27 tests réussis. Les workflows GitHub Actions 0.3.3 et 0.3.4 ont terminé avec succès ; le manifeste ARM64 0.3.4 a été vérifié dans GHCR. Aucun essai physique de cette version réalisé par l’agent.
