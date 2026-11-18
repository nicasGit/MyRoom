# MyRoom

Version add-on 0.6.0 : [Opération Menthe 27](docs/adventures/menthe27.md) version 0.2.0 propose le coffre puis trois manches de blackjack hybride coopératif, avec capitaine, cartes 3D et récompenses ♣ ♥ ♠. La suite reste en attente. L’administration permet de saisir les noms, tester directement une énigme, partager des indices et réinitialiser l’énigme active. La disponibilité de l’image est consignée dans le [récapitulatif](docs/RECAPITULATIF.md).

Deux énigmes coopératives : **Le coffre des quatre symboles**, puis **La table du dernier As**. Placement dans l’administration et simulation solo sur PC : [guide des énigmes](docs/first-puzzles.md).

[Récapitulatif des réalisations](docs/RECAPITULATIF.md) : fonctionnalités, versions, utilisation et limites de validation.

Squelette de jeu AR partagé pour quatre joueurs dans la même pièce : Three.js + TypeScript + WebXR, serveur Node.js + WebSocket, add-on Home Assistant OS pour Raspberry Pi 5 ARM64 et accès HTTPS par Nginx.

## Installer dans Home Assistant OS

[Ajouter le dépôt à Home Assistant](https://my.home-assistant.io/redirect/supervisor_add_addon_repository/?repository_url=https%3A%2F%2Fgithub.com%2Fnicasgit%2Fmyroom)

Ou ajouter `https://github.com/nicasgit/myroom` dans les dépôts de la boutique d'add-ons, puis installer **MyRoom**. Ce dépôt n'est pas un dépôt HACS. La première installation nécessite que le workflow GitHub Actions ait publié l'image et que le paquet GHCR soit public. Voir [le déploiement](docs/deployment.md).

## Développement

Pour installer MyRoom sur un téléphone depuis Chrome, consulter [l’installation mobile](docs/installation-mobile.md). L’application ouvre le serveur HAOS en HTTPS et nécessite sa disponibilité.

Prérequis : Node.js 22.12+ (ou 24 LTS) et npm.

```sh
npm ci
npm run dev
```

Ouvrir http://localhost:5173. Quatre onglets permettent de vérifier les places et la résolution partagée ; le cinquième est refusé. `localhost` autorise le diagnostic local, mais un casque accédant à une IP LAN a besoin de HTTPS avec un certificat reconnu. Le serveur de développement accepte les origines localhost/127.0.0.1:5173 ; configurer `PUBLIC_ORIGIN` avec l'origine HTTPS exacte pour un accès via proxy.

```sh
npm run typecheck
npm run build
npm test
npm start
```

`npm start` lance seulement le serveur compilé. En production, Nginx sert `client/dist` et relaie `/ws` ; voir [architecture](ARCHITECTURE.md), [déploiement](docs/deployment.md) et [validation Quest](docs/quest-validation.md).

## Prototype

Depuis 0.2.0 : [reconstruction manuelle 3D et bibliothèque persistante](docs/room-library.md). Après A/B, relever le contour, saisir la hauteur des murs et représenter les obstacles par des boîtes. Jusqu'à vingt pièces peuvent être enregistrées sur disque, activées, supprimées et exportées depuis l'administration. Depuis 0.3.0 : [import expérimental des surfaces du Quest](docs/quest-scan.md), selon les plans exposés par WebXR ; contour et meubles approximatifs à vérifier avant sauvegarde. Les portes et fenêtres peuvent être ajoutées manuellement.

Administration : ouvrir `/admin.html` ou le lien sur la page joueur. Configurer `admin_token` dans HAOS ; en développement PowerShell : `$env:ADMIN_TOKEN = 'VOTRE_SECRET_ALEATOIRE_16_CARACTERES_MINIMUM'` avant `npm run dev`. Ne pas committer ce secret. Voir [le guide admin](haos-addon/DOCS.md#administration).

- Diagnostic contexte sécurisé, WebXR et `immersive-ar` ; démarrage de session avec sol local.
- Quatre places synchronisées, reconnexion réseau, énigme de démonstration autoritaire en mémoire.
- Calibrage manuel horizontal à deux points au sol via gâchette, communs à tous les casques.

Quest 2, Quest 3 et Quest 3S sont des cibles prévues. **Aucun test WebXR sur ces casques n'a été effectué.** Disponibilité AR, interface de calibrage et précision doivent être vérifiées sur chaque appareil et version du navigateur. Sur téléphone compatible DOM Overlay, des commandes tactiles permettent de placer A/B avec le rayon central, de recommencer et de quitter la session. Le support est détecté pendant la session, sans supposer qu'un navigateur le fournit. Voir [le guide tactile](docs/mobile-ar.md). Sans DOM Overlay, un panneau 3D affiche les messages ; gâchette pour A/B, A/X pour importer, B droit pour enregistrer et Y gauche pour annuler le brouillon avec contrôleurs WebXR standard.

Les pièces 3D et la sélection active sont enregistrées sur disque. Les connexions et l'état des énigmes restent en mémoire et sont perdus au redémarrage. Les poses joueurs ne sont pas diffusées. Les écritures de la bibliothèque et l'administration demandent le jeton ; les joueurs n'ont pas de comptes ou d'ancres persistantes.
