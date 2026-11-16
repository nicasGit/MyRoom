# Architecture MyRoom

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

## Déploiement

Image Node 22 Alpine multi-architecture, add-on limité à aarch64 pour Raspberry Pi 5. Le conteneur réunit Nginx et Node, arrêtés ensemble si un processus sort. HTTPS est terminé sur un proxy externe avec certificat reconnu par les casques. Le port 3000 n'est pas publié. Pas d'Ingress Home Assistant pour ce prototype : accès direct à une origine HTTPS dédiée.
