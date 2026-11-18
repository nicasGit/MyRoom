# Consignes MyRoom

- À la demande de l'utilisateur, publier directement les modifications terminées après validation, sans demander une nouvelle confirmation de publication : travailler sur une branche dédiée, mettre à jour le récapitulatif et la version de l'add-on/client, exécuter les contrôles requis, puis commit, push et intégration sur `main`. Vérifier le workflow de publication et la disponibilité de l'image HAOS ARM64 avant d'annoncer la version disponible. Une instruction ultérieure de ne pas publier prime sur cette préférence. Ne pas forcer les push ni contourner les contrôles ; signaler tout blocage.

- À chaque modification du projet (code, configuration, déploiement ou documentation), mettre à jour [docs/RECAPITULATIF.md](docs/RECAPITULATIF.md) dans le même ensemble de changements, avant de terminer la tâche. Y refléter les changements réalisés, les vérifications effectivement exécutées et les limites connues. Actualiser la date et les versions/commits lorsqu'ils existent, sans annoncer une publication ou un essai matériel non vérifié.

- Conserver le client en TypeScript / Three.js / WebXR et le serveur en TypeScript / Node.js / WebSocket.
- Le serveur est autoritaire pour les places joueurs (quatre maximum) et l'état des énigmes. Valider toutes les entrées réseau.
- Ne jamais annoncer de test sur Quest sans essai physique documenté. Séparer compilation, tests logiciels et validation casque.
- Cibler Quest 2, Quest 3 et Quest 3S ; détecter les capacités à l'exécution, sans dépendre du modèle déclaré par le navigateur.
- Conserver une origine HTTPS et un proxy WebSocket ; ne pas exposer directement le port interne en production.
- Le calibrage utilise deux points physiques communs, un alignement horizontal et des unités en mètres. Ne pas le présenter comme une ancre spatiale partagée.
- Après modification : `npm run typecheck`, `npm run build`, `npm test`. Documenter les limites dans docs/.
- L'add-on HAOS doit rester compatible aarch64 / Raspberry Pi 5. Ne pas inclure de secret ou certificat privé dans Git.
