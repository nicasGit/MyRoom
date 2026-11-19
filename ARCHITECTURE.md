# Architecture MyRoom

## Noms de pièces et réinitialisation 0.13.1

`rooms/rename` effectue une mutation de métadonnées versionnée et atomique dans
RoomStore, sans activer une autre pièce. Le nom seul est exclu des clés de cache
du portail, de l'aventure et des objets : renommer ne réinitialise pas la session.
Géométrie, ID et placements conservent leurs règles d'invalidation.
Le nom du brouillon passe par le champ existant ; un clavier de panneau permet
la saisie Quest sans clavier système. La réinitialisation réutilise l'API protégée
`adventure/reset`, avec confirmation navigateur ou écran de confirmation mural.

## Centrage, panneau et fantômes 0.13.0

Le placement propose le centroïde du polygone de sol puis la zone valide la plus
proche, avec validation du couloir et de la place des bâtons. Les placements
enregistrés restent inchangés jusqu'à « Centrer le vortex », hors session, puis
nouvelle confirmation physique. Aucun changement de schéma persistant.

`PortalPublic.ghosts` ajoute facultativement des positions de tête WebXR validées,
place et âge calculé à la réception serveur, uniquement pendant le rituel actif.
Les modes caméra/simulateur, poses expirées, places absentes et simulations sont
exclus. Le client tient compte de l'âge reçu et du temps local écoulé ; les poses
ne sont ni extrapolées ni persistées. `PortalGhosts` rend un corps approximatif
à partir de la tête, sans prétendre mesurer les membres. Pas de règle de collision.
`vortexSign` produit la géométrie et une texture Canvas originale du panneau en
bois, partagée par le portail et le couloir ; les fantômes restent visibles devant
le décor opaque. Voir [Team Portal](docs/team-portal.md#centrage-panneau-et-fantômes-0130).

## Ambiance du couloir 0.12.1

`WaitingAudio` synthétise une boucle locale de huit secondes via Web Audio,
déverrouillée par un geste utilisateur. Elle suit l'affichage personnel du couloir
et la validation serveur du passage, sans nouveau message ou règle d'aventure.
Une seule source active, fondus d'entrée/sortie et nettoyage des nœuds ; son refusé
ou suspendu ne bloque pas le jeu. Le contexte est fermé à la sortie de la page.

## Couloir personnel 0.12.0

`PortalWaiting` sépare la prédiction visuelle locale du franchissement validé par
`TeamPortal`. Les poses de tête XR utilisent toujours A/B ; le détecteur géométrique
partagé conserve approche, sens, rectangle utile et contrôles de continuité.
WebXR valide à 4 cm derrière le plan ; le simulateur conserve 30 cm. Aucun nouveau
message, format de pièce ou état de puzzle. `waiting-corridor.ts` rend une enveloppe
opaque et un tunnel procédural dans le repère calibré, avec panneau fixe par entrée.
Le rendu est personnel ; l'état public autoritaire fournit le compteur collectif.
La caméra n'est jamais déplacée et les protections du casque ne sont pas modifiées.
Voir [le comportement et ses limites](docs/team-portal.md#couloir-personnel-0120).

## Bâtons et vortex 0.11.0

Le protocole de manipulation accepte un quaternion facultatif normalisé uniquement
pour les bâtons. Le client le calcule dans le repère commun A/B ; le serveur conserve
les baux et les mêmes validations de position. Les objets historiques restent en yaw.
Le rendu du vortex est isolé dans `client/src/portal/vortex-view.ts` : animation
procédurale Three.js sans modification de la machine d'états de franchissement.

## Préparation spatiale 0.10.3

`portal/portal-placement.ts` calcule une proposition de couloir dans le modèle de
pièce et distingue modification des réglages, déplacement et confirmation physique.
Le serveur conserve les placements portail enregistrés ; la proposition initiale
concerne les pièces sans configuration. Un recalcul explicite invalide la confirmation.
Les commandes de démarrage préparent via le générateur existant les neuf points
d'énigmes absents, puis sauvegardent atomiquement le modèle avant le rituel. Aucun
placement existant n'est remplacé. Les règles et le format des aventures ne changent
pas. Voir [la préparation dans le casque](docs/quest-staffs-and-menus.md).

## Adaptateurs d'affichage 0.9.0

Virtual3D et CameraAR utilisent une scène commune et les mêmes vues d'énigmes,
AdventureClient et commandes autoritaires que QuestWebXR. Ce dernier adapte le
cycle natif existant sans modifier A/B. DisplayModes conserve la politique
administrateur versionnée et atomique, séparée des pièces et de la progression.
Les capacités et modes clients sont des métadonnées de connexion, non une preuve
de suivi spatial. Les méthodes de passage du portail sont distinguées côté serveur.
Les ajustements de superposition caméra restent locaux et séparés des poses de jeu.
Voir [modes d'affichage et limites](docs/display-modes.md).

## Team Portal — introduction de session facultative

Depuis 0.8.1 : Team Portal devient l’accueil global de MyRoom, activé par défaut pour chaque pièce et présenté avant les objets d’aventure. Sa clé de placement est `pièce@team-portal@1`, indépendante du manifeste ; les anciens placements par aventure restent lisibles comme secours sans supprimer leurs fichiers. Le choix d’aventure ne réinitialise plus l’accueil. Les métadonnées `introduction` des manifestes historiques restent lisibles mais ne décident plus de l’activation globale. Une désactivation explicite dans l’administration et les accès de test temporaires permettent de contourner cet accueil intentionnellement. Le calibrage et la confirmation physique restent nécessaires avant les interactions.

Un contrat dédié `introduction` dans les manifestes complète le catalogue sans changer `PuzzleModule`. Menthe 27 0.3.0 conserve les étapes de 0.2.0. `Room` coordonne une machine d’états `TeamPortal` avant le démarrage unique de l’aventure. Le détecteur de franchissement pur utilise historique, rectangle utile, sens et hystérésis ; les données de tête déclarées ne constituent pas une mesure indépendante. Les bâtons réutilisent les saisies, baux, positions et calibrage existants. Placements indépendants versionnés, reprise privée de place, commandes administrateur protégées et simulation PC identifiée : voir [Team Portal](docs/team-portal.md). Dans 0.8.0, les anciennes aventures sans introduction conservaient leur démarrage direct ; depuis 0.8.1, l’accueil global est actif sauf désactivation explicite.

L'évolution locale des bâtons flottants calcule une disposition déterministe côté serveur via `staff-layout.ts`, transmise dans `PortalPublic.staffPositions` et réutilisée pour les poses manipulables. Le socle disparaît ; le champ historique `stand` reste compatible comme repère d'informations. La respiration des halos et la suspension sont des animations clientes sans modification des poses partagées. Voir les limites dans [Team Portal](docs/team-portal.md).

## Prises d’objets — évolution version 0.7.0

Évolution locale : `WallLobby` et `WallMenuView` présentent un menu planaire dans le repère A/B, sur le mur validé du panneau existant. Une texture Canvas et des zones UV remplacent les panneaux DOM permanents après calibrage. Le flux WebSocket diffuse uniquement les métadonnées publiques du catalogue et les noms ; les modifications réutilisent les routes administrateur authentifiées, avec lecture de révision avant commande et absence de nouvelle tentative automatique. Le jeton reste en mémoire sur l'appareil et peut autoriser aussi l'enregistrement des pièces. Le mode pièces réactive explicitement les outils de relevé existants. Voir [le guide d'accueil mural](docs/wall-lobby.md).

`ObjectManipulation` conserve des poses et baux séparés de la progression et du modèle enregistré. Les commandes WebSocket `object_action` sont validées côté serveur avec propriétaire, séquence monotone, proximité déclarée, nombre de prises et bornes. Les poses temporaires sont ajoutées à l’état public ; leur révision n’altère pas celle de l’énigme. Le rendu applique les poses sans reconstruire la scène à chaque déplacement. Les contrôles de proximité suivent les nouveaux emplacements sans changer A/B.

Les mains suivies, lorsqu’exposées par WebXR, utilisent une pince avec hystérésis ; les contrôleurs utilisent la poignée. Les gros objets exigent les côtés gauche et droit. La perte de suivi ou de connexion annule la prise. Les cartes hybrides gardent leurs verrous et logements, avec aperçu de portage local. Une inscription fixe sous le coffre devient visible après soulèvement/déplacement. Les limites et sources primaires sont dans [le guide Quest](docs/quest-grabbing.md).

La sauvegarde admin des poses est réservée à une partie arrêtée sans prise active ; `puzzles.poses` complète facultativement les neuf points avec hauteur et rotation horizontale, sans supprimer les anciens modèles. Les déplacements de jeu et baux ne sont pas persistés automatiquement. Pas de physique complète, de preuve de présence ou d’ancre spatiale partagée. Image HAOS 0.7.0 publiée et manifeste ARM64 vérifié, sans validation matérielle Quest.

## Blackjack hybride — Phase 2, version 0.6.0

Le registre ajoute `blackjack-hybrid`, sans modifier le comportement des deux modules historiques. Le manifeste `menthe27@0.2.0` enchaîne coffre, trois manches de casino, puis une étape Vidéoclub prévue. La version 0.1.0 reste au catalogue pour les instantanés historiques. Aucun moteur générique ne contient de règle de Menthe 27.

`PuzzleContext` transporte acteur, capitaine, connexions actives et heure depuis le serveur. Le module propose les extensions optionnelles `maintain` (réservations) et `earnedRewards` (gains par manche). Le moteur applique les gains après chaque action et les recalcule à la restauration ; les autres modules gardent une attribution à la réussite. Une révision globale sérialise les commandes concurrentes ; les commandes refusées retournent explicitement le motif et l’état courant.

La première connexion est capitaine ; un départ réattribue le rôle à une place active. Le paquet est mélangé via une source cryptographique injectée, conservé uniquement dans l’état privé. La projection publique masque paquet, carte cachée et total du croupier tant que la main est active. Les actions et le journal ne contiennent pas le paquet. Les cartes des manches suivantes utilisent des réservations de 15 secondes et trois logements ; la maintenance serveur libère expiration/déconnexion et diffuse les changements. Position de la table et états de jeu restent séparés.

Le rendu Three.js et les descripteurs de commandes sont réutilisés par l’aperçu PC, le tactile et WebXR. La première interaction est sélection puis dépôt fixe, sans prise libre ou poses transmises en continu. `/api/admin/adventure/hint` et `/reset-puzzle` sont protégés par la sécurité existante et la révision. Voir [le guide hybride et ses limites](docs/adventures/blackjack-hybrid.md). Les sessions restent en mémoire, la persistance disque est différée en Phase 3. Aucun essai physique Quest annoncé.

## Fondations modulaires — Phase 1 locale, 18 novembre 2026

Le code distingue désormais MyRoom Engine (transport, pièces, sécurité spatiale et administration), Puzzle Engine (registre et modules purs), Adventure Engine (étapes, instances, inventaire et instantanés) et Adventure Catalog (manifestes versionnés). La façade historique `Adventure` conserve les commandes et l’état attendus par le client. Le coffre est encapsulé dans `symbol-chest`, le blackjack actuel dans `blackjack-legacy` ; aucun blackjack hybride n’est encore implémenté.

L’administration choisit l’aventure et les noms des quatre places. La démonstration classique reste le choix initial ; `menthe27@0.1.0` joue le coffre puis s’arrête sur une étape prévue. Le catalogue externe se lit depuis `DATA_DIR/adventures/` ou `ADVENTURE_CATALOG_DIR`, sans modifier le moteur. Les anciennes pièces et A/B restent inchangés. Le contrat de restauration est purement en mémoire ; persistance des sessions/noms et placements séparés seront ajoutés en Phase 3. Aucun push ni déploiement de cette tranche sans validation.

Voir la [cartographie, les contrats, les fichiers et les risques](docs/adventures/phase1-architecture.md), [Menthe 27](docs/adventures/menthe27.md) et le [guide des manifestes](docs/adventures/creating-adventures.md).

## Énigmes coopératives

Depuis 0.4.2, `puzzles.panel` ajoute facultativement un mur et un décalage le long de celui-ci. Les anciennes pièces reçoivent une proposition normalisée, persistée à leur prochaine sauvegarde. Le panneau est orienté vers l’intérieur et centré à 1,35 m du sol ; sa zone est validée contre les ouvertures et obstacles déclarés. Les actions `press_symbol` utilisent sa position horizontale pour la proximité. Les logements reflètent `symbols.entered` ; la géométrie du coffre et son animation n’autorisent aucune résolution locale.

Le modèle de pièce peut contenir neuf points d’énigmes validés et persistés dans sa bibliothèque. Le serveur maintient une progression commune en mémoire : symboles, combinaison du coffre, cartes et choix unique au blackjack. Chaque action transporte les révisions de partie et de bibliothèque, une position horizontale bornée et un indicateur de simulation. Le serveur vérifie phase, découvertes, proximité et règles ; une position déclarée ne prouve pas la présence physique. La simulation PC nécessite une autorisation admin temporaire. Voir le [guide des énigmes](docs/first-puzzles.md).

Navigateur Quest → HTTPS/WSS → Nginx frontal (TLS) → Nginx add-on :8080 → serveur Node.js :3000 pour /ws. Nginx sert les fichiers du client Three.js compilés avec Vite. En développement Vite relaie /ws vers Node.

## Client

TypeScript strict, Three.js et API WebXR native. La page vérifie le contexte sécurisé, la présence de WebXR et `isSessionSupported('immersive-ar')`. La session demande `local-floor` ; un support annoncé du mode AR ne garantit pas l'acceptation de cette fonctionnalité. Les erreurs sont visibles. Les capacités sont détectées sans déduction à partir du modèle Quest.

Chaque casque sélectionne les mêmes repères physiques A puis B via intersection du rayon contrôleur avec le sol local. L'origine devient A ; une rotation autour de Y aligne A → B sur +X. Aucune mise à l'échelle ; Y reste vertical. Le module de calibrage expose la conversion vers les coordonnées de pièce. Le résultat reste local et n'est pas encore envoyé au serveur. Pas d'ancres partagées ni de synchronisation des poses. Refaire le calibrage après redémarrage ou recentrage ; les deux points ne corrigent pas la dérive ou un sol mal estimé.

## Serveur et protocole v0

Une salle en mémoire, quatre connexions maximum. Chaque connexion reçoit un UUID et la première place libre. Une reconnexion obtient une nouvelle identité. Le cinquième client est fermé avec le code 1008 ; le client ne réessaie pas automatiquement dans ce cas.

| Direction | Message JSON | Usage |
|---|---|---|
| serveur → client | `{ "type": "welcome", "id": "uuid" }` | Identité de connexion |
| serveur → tous | `{ "type": "state", "players": [{"id":"uuid","slot":1}], "puzzle": {"id":"demo","solved":false,"revision":0} }` | Instantané complet après connexion, départ ou commande |
| client → serveur | `{ "type": "solve", "revision": 0 }` | Résoudre la démo si révision courante |
| serveur → client | `{ "type": "error", "message": "Message invalide" }` | JSON ou commande invalide |
| client → serveur | `{ "type": "xr_event", "event": "placement_requested", "details": {"step":"A"} }` | Diagnostic navigateur, nom et champs limités ; ne modifie pas la salle |
| serveur → client | `{ "type": "xr_ack", "event": "placement_requested" }` | Diagnostic reçu et journalisé sous client_xr avec identité serveur |

Le serveur est autoritaire ; une commande périmée reçoit l'état courant sans mutation. La résolution est idempotente. Taille limitée à 4 Kio, 30 messages par fenêtre de 10 s, heartbeat ping/pong et contrôle d'origine. Pas de persistance ni d'authentification : prototype pour réseau de confiance. Un bouton peut résoudre la démo sans calibrage ; les futures énigmes devront valider leurs conditions côté serveur.

## Administration

`/admin.html` est une page distincte qui ne crée aucune connexion joueur. Elle interroge `/api/admin/state` toutes les deux secondes avec un jeton Bearer conservé uniquement dans la mémoire de l'onglet. Le serveur refuse l'administration si `ADMIN_TOKEN` contient moins de 16 caractères ; HAOS le fournit via l'option `admin_token`. Les API admin sont protégées, même si les fichiers de l'interface sont publics.

`POST /api/admin/reset` attend `{}` et incrémente la révision sans réutiliser les anciennes révisions. `POST /api/admin/kick` attend `{ "id": "uuid" }` et ferme la connexion avec le code 1008 (sans reconnexion automatique). Chaque action vérifie le jeton, l'origine et le JSON. Ces commandes sont journalisées. L'état administrateur expose les métadonnées de connexion et les 100 derniers événements Node, sans les accès Nginx. Aucun compte, rôle multiple ou bannissement persistant. Utiliser HTTPS pour protéger le jeton en transit.

## Pièces 3D et bibliothèque persistante

Le modèle manuel contient un identifiant, un nom, un polygone de sol (3–32 sommets en coordonnées A/B), une hauteur uniforme de murs et jusqu'à 32 obstacles cubiques alignés sur les axes de la pièce. Le module pur `server/src/scene-schema.ts` est partagé par le serveur et les builds client pour la validation géométrique ; il ne contient aucun accès système. Les pièces peuvent être concaves ; contours croisés, coordonnées non finies et obstacles dépassant le contour sont rejetés.

Une bibliothèque versionnée contient jusqu'à vingt pièces et une sélection active. `RoomStore` la charge depuis DATA_DIR/rooms.json, la valide et effectue des écritures par fichier temporaire puis renommage, avant publication en mémoire. La révision globale évite les écrasements concurrents. Sous HAOS, DATA_DIR vaut /data/myroom ; un fichier corrompu bloque le démarrage pour préserver les données.

Les commandes `POST /api/admin/rooms/save` (`{revision,room}`), `/activate` et `/delete` (`{revision,id}`) nécessitent le jeton, l'origine configurée et un JSON limité à 32 Kio. La sauvegarde active la pièce. L'API admin expose la bibliothèque complète ; l'instantané WebSocket expose `model` et `libraryRevision` pour la seule pièce active. Chaque modification est diffusée et journalisée. Les modèles sont relevés manuellement ou importés depuis les surfaces WebXR disponibles, puis vérifiés par l'administrateur. Aucune ancre spatiale partagée.

Depuis 0.3.0, le client demande `plane-detection` comme capacité optionnelle et lit les poses des plans sur une image XR active, uniquement à la demande d’import. La conversion vers A/B génère un brouillon utilisant le schéma existant : contour de sol, hauteur estimée, boîtes de meubles identifiés et ouvertures manuelles. Aucune accumulation de poses périmées, aucun transfert d’images ou de maillage brut. Un panneau 3D et les boutons des contrôleurs WebXR standard permettent l’import et la sauvegarde en l’absence de DOM Overlay. Voir [les limites et la validation Quest](docs/quest-scan.md).

Changer de pièce active invalide le calibrage local des joueurs ; ils doivent retrouver les repères physiques A/B de la pièce correspondante. Les brouillons non enregistrés sont locaux et perdus après fin de session ou recentrage. La bibliothèque ne persiste ni l'état des énigmes ni les connexions. Voir [le guide](docs/room-library.md).

## Déploiement

Image Node 22 Alpine multi-architecture, add-on limité à aarch64 pour Raspberry Pi 5. Le conteneur réunit Nginx et Node, arrêtés ensemble si un processus sort. HTTPS est terminé sur un proxy externe avec certificat reconnu par les casques. Le port 3000 n'est pas publié. Pas d'Ingress Home Assistant pour ce prototype : accès direct à une origine HTTPS dédiée.
