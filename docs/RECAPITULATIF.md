# MyRoom — Récapitulatif des réalisations

État au **17 novembre 2026**, fonctionnalités et corrections publiées jusqu’à **0.4.0**. Ce document rassemble les travaux effectués dans le dépôt, les parcours d’utilisation, les vérifications et les limites connues. Les résultats matériels rapportés par l’utilisateur sont distingués des tests logiciels réalisés pendant le développement.

## 1. Projet et architecture

### Ajout du 17 novembre 2026 — préparation et placements, 0.4.1

- Nouvelle proposition aléatoire ordonnée : centre libre pour le coffre, table proche et sept autres éléments dans des secteurs angulaires avec rotation et rayon variables. Coordonnées validées contre le contour, les obstacles et l’espacement minimal ; repli vers les positions libres lorsque le centre des limites est indisponible.
- Déplacement des repères par glissement souris/tactile dans le plan admin. Modifications non sauvegardées empêchant le départ local.
- Phase de préparation et bouton **Commencer les énigmes** ; actions de jeu refusées avant le départ. Réinitialisation et modification du modèle actif retournent en préparation.
- En AR tactile, choix d’un élément et placement au viseur après A/B, avec jeton admin en mémoire uniquement. Endpoint spécifique protégé : préparation requise, révisions de jeu et bibliothèque contrôlées, géométrie de la pièce conservée. Positions enregistrées et diffusées aux joueurs ; déplacement refusé après départ.
- En préparation, tous les éléments 3D sont visibles avec leur identité pour faciliter le placement. Aucun système de prise libre aux contrôleurs ajouté ; sur casque sans panneau tactile, préparation depuis le plan admin d’un autre appareil.

Vérifications : typecheck et compilation réussis, 36 tests réussis après correction d’un placement de test dirigé dans un obstacle. Deux nouveaux tests couvrent préparation/départ et vingt variantes de répartition valides avec principaux centraux ; le test réseau couvre placement autorisé, jeton absent, révision périmée et refus après départ. Dans Chrome : glissement réel à la souris d’un repère et sauvegarde, blocage du départ avec modifications non sauvegardées, départ admin ; contrôleur tactile testé avec calibrage et visée synthétiques, sauvegarde effective et champ de jeton vidé. Pièce temporaire supprimée après les vérifications. Aucun essai physique AR sur téléphone ou Quest effectué par l’agent. Guide des énigmes et changelog actualisés. Publication 0.4.1 à confirmer.

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
