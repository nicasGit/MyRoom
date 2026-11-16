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

## Journal

Depuis 0.1.2, l'onglet **Journal** affiche les connexions et déconnexions (identifiant, place, nombre de joueurs), refus et actions d'énigme, avec horodatage UTC. Les accès et erreurs Nginx sont également affichés. Voir [les événements et leurs limites](../docs/logging.md). L'identifiant est celui d'une connexion, pas un compte utilisateur.

## Limites du prototype

Quatre connexions, une salle et un état d'énigme en mémoire ; pas de comptes, d'authentification ou de persistance. Réserver l'accès au réseau de confiance. Les poses ne sont pas diffusées. Calibrage manuel horizontal à deux repères physiques, sans ancre spatiale partagée. Recalibrer après recentrage.

Les validations sur Quest, Nginx déployé et HAOS/Raspberry Pi 5 restent à effectuer.
