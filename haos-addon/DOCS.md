# Installation et configuration

1. Ajouter `https://github.com/nicasgit/myroom` dans les dépôts de la boutique d'add-ons Home Assistant (pas HACS).
2. Installer **MyRoom**. L'image `ghcr.io/nicasgit/myroom:0.1.0` doit déjà être publiée et publique.
3. Dans Configuration, régler `public_origin`, par exemple `https://myroom.example.com`, sans slash final ni chemin.
4. Conserver le port interne 8080 publié sur le port hôte 8099 et démarrer l'add-on.
5. Configurer un proxy Nginx HTTPS vers `http://ADRESSE_DU_PI:8099`, en relayant les WebSockets sur `/ws`. Voir [l'exemple](../docs/nginx-https.conf).
6. Ouvrir l'URL HTTPS dans les navigateurs des casques. La connexion directe en HTTP sur l'adresse LAN ne permet pas une session WebXR sécurisée.

Le serveur Node écoute uniquement à l'intérieur du conteneur sur le port 3000. Ne pas publier ce port. Le port 8099 reste sur le réseau interne derrière le proxy TLS.

## Limites

Quatre connexions, une salle et un état d'énigme en mémoire ; pas de comptes, d'authentification ou de persistance. Réserver l'accès au réseau de confiance. Les poses ne sont pas diffusées. Calibrage manuel horizontal à deux repères physiques, sans ancre spatiale partagée. Recalibrer après recentrage.

Les validations sur Quest, Nginx déployé et HAOS/Raspberry Pi 5 restent à effectuer.
