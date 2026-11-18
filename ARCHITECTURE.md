# Architecture MyRoom

## Blackjack hybride — Phase 2, version 0.6.0 préparée

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
