# Installation et configuration

1. Ajouter `https://github.com/nicasgit/myroom` dans les dépôts de la boutique d'add-ons Home Assistant (pas HACS).
2. Installer **MyRoom**. L'image correspondant à la version de l'add-on doit déjà être publiée et publique.
3. Dans Configuration, régler `public_origin`, par exemple `https://myroom.example.com`, sans slash final ni chemin.
4. Conserver le port interne 8080 publié sur le port hôte 8099 et démarrer l'add-on.
5. Configurer un proxy Nginx HTTPS vers `http://ADRESSE_DU_PI:8099`, en relayant les WebSockets sur `/ws`. Voir [l'exemple](../docs/nginx-https.conf).
6. Ouvrir l'URL HTTPS dans les navigateurs des casques. La connexion directe en HTTP sur l'adresse LAN ne permet pas une session WebXR sécurisée.

Le serveur Node écoute uniquement à l'intérieur du conteneur sur le port 3000. Ne pas publier ce port. Le port 8099 reste sur le réseau interne derrière le proxy TLS.

## Test local Chrome depuis HAOS

Après installation ou mise à jour en 0.1.1, le bouton **Ouvrir l'interface Web** sur la page MyRoom ouvre `http://HOTE_HAOS:8099/` (ou le port personnalisé dans Réseau). Utiliser l'adresse locale de Home Assistant pour que le bouton reprenne le bon hôte. Ce lien HTTP est prévu pour les essais LAN sur ordinateur.

Dans Configuration, régler `public_origin` sur l'origine exacte ouverte par le bouton, par exemple :

```yaml
public_origin: "http://192.168.1.50:8099"
```

Remplacer l'IP par celle de HAOS et adapter le port. Enregistrer puis redémarrer l'add-on. Utiliser exactement cette adresse dans tous les onglets : un nom DNS et une IP représentent deux origines différentes. Une origine incorrecte empêche la connexion WebSocket même si la page se charge.

Ouvrir quatre onglets dans Chrome pour voir les quatre joueurs, puis résoudre l'énigme dans un onglet et vérifier la mise à jour des autres. Fermer les onglets pour libérer leurs places.

Sur une adresse LAN en HTTP, WebXR peut être absent et immersive-ar indisponible : les tests joueurs/énigme restent possibles. Pour l'AR, utiliser le proxy HTTPS avec certificat reconnu et remettre `public_origin` sur cette origine HTTPS. Le bouton LAN reste un raccourci de diagnostic HTTP ; ouvrir directement l'URL HTTPS pour les casques. Aucun test physique HAOS ou Quest n'a été réalisé.

## Téléphone en AR

Depuis 0.1.4, un navigateur compatible DOM Overlay affiche **Placer A / Placer B**, **Recommencer** et **Quitter l'AR** pendant la session. Viser les repères avec le centre de l'écran ; incliner vers le sol pour activer le placement. Voir [le guide tactile et les limites](../docs/mobile-ar.md). Utiliser HTTPS. Aucun essai physique de ces nouvelles commandes n'a été effectué par l'agent.

## Administration

Depuis 0.2.0 : [bibliothèque persistante de pièces 3D](../docs/room-library.md). La page joueur permet un relevé manuel AR du sol, des murs et des obstacles. Saisir le jeton administrateur dans la page joueur avant la session pour autoriser l'enregistrement. Les données sont conservées dans `/data/myroom/rooms.json`. L'administration permet de choisir parmi vingt pièces, d'en supprimer et d'exporter la bibliothèque. Attendre la confirmation d'enregistrement avant de quitter l'AR.

Dans Configuration, renseigner `admin_token` avec un secret aléatoire d'au moins 16 caractères puis redémarrer l'add-on. L'administration est désactivée tant que cette valeur est vide ou trop courte. Ouvrir MyRoom puis cliquer **Administration de la salle**, ou visiter `/admin.html` sur la même origine.

Saisir le jeton pour consulter les joueurs, les cent derniers événements applicatifs et l'état de l'énigme. La réinitialisation est diffusée à tous les joueurs ; la déconnexion d'un joueur l'empêche de revenir automatiquement, mais il peut recharger sa page. Ce n'est pas un bannissement.

Le jeton reste en mémoire dans l'onglet ; un rechargement demande une nouvelle connexion. Il n'est pas stocké dans l'URL ou le stockage du navigateur. Utiliser HTTPS pour protéger le jeton sur le réseau. Les accès directs HTTP sont réservés aux essais sur réseau de confiance. Pas de comptes ni de rôles multiples. Le journal admin contient les événements Node, pas les accès Nginx (visibles dans le journal HAOS).

## Journal

Depuis 0.1.2, l'onglet **Journal** affiche les connexions et déconnexions (identifiant, place, nombre de joueurs), refus et actions d'énigme, avec horodatage UTC. Les accès et erreurs Nginx sont également affichés. Voir [les événements et leurs limites](../docs/logging.md). L'identifiant est celui d'une connexion, pas un compte utilisateur.

## Limites du prototype

Quatre connexions et une seule salle active ; les connexions et l'état d'énigme ne sont pas persistés. La bibliothèque de pièces 3D est enregistrée sur disque. Les joueurs n'ont pas de comptes ou d'authentification ; l'administration et les écritures de modèles demandent le jeton. Réserver l'accès au réseau de confiance. Les poses ne sont pas diffusées. Calibrage manuel horizontal à deux repères physiques, sans ancre spatiale partagée. Recalibrer après recentrage ou changement de pièce.

Les validations sur Quest, Nginx déployé et HAOS/Raspberry Pi 5 restent à effectuer.
