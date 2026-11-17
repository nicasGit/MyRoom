# Installer MyRoom depuis Chrome — 0.3.2

MyRoom dispose d’un manifeste d’application web, d’icônes PNG et d’un lancement en mode `standalone`. L’application installée ouvre le même serveur que l’adresse utilisée pendant l’installation.

## Sur téléphone Android avec Chrome

1. Mettre l’add-on à jour vers une version contenant cette fonctionnalité, puis ouvrir **l’adresse HTTPS de MyRoom/HAOS** dans Chrome sur le téléphone. Le certificat doit être reconnu sans avertissement. Le bouton Web de l’add-on peut ouvrir une adresse HTTP locale : utiliser l’adresse du proxy HTTPS pour l’installation et WebXR.
2. Sur la page MyRoom, toucher **Installer MyRoom sur cet appareil** si le bouton apparaît.
3. Sinon, ouvrir le menu **⋮** de Chrome, puis **Installer l’application** ou **Ajouter à l’écran d’accueil**, selon les options proposées. Chrome décide quand proposer l’installation ; le bouton n’apparaît qu’après réception de son événement d’installation.
4. Confirmer dans Chrome, puis ouvrir **MyRoom** depuis son icône. La page s’ouvre sans la barre d’adresse habituelle.
5. Autoriser les fonctions AR si proposées. Le calibrage A/B et le jeton administrateur pour l’enregistrement restent nécessaires comme dans le navigateur.

Si MyRoom est déjà installée, utiliser son icône. Le site ne peut pas toujours déterminer si une installation existe depuis un onglet ordinaire. Si la proposition est annulée, le menu Chrome reste le moyen de réessayer quand le navigateur le permet.

## Connexion, mises à jour et limites

- **Le serveur HAOS doit rester accessible** : sur le réseau local pour une adresse locale, ou via l’accès HTTPS distant que vous avez configuré. L’installation ne configure ni VPN ni accès extérieur.
- Pas de mode de jeu hors ligne ni de service worker dans cette version. Aucun cache applicatif de modèles, de jetons, d’API ou de fichiers AR : une nouvelle ouverture/recharge récupère le site selon les règles HTTP du navigateur. Une page déjà ouverte peut nécessiter un rechargement après mise à jour de l’add-on.
- Le manifeste est servi par Nginx avec le type `application/manifest+json` et `Cache-Control: no-cache`. Les icônes 192 et 512 px ainsi qu’une icône maskable sont incluses dans l’image HAOS. Elles peuvent être régénérées avec `node scripts/generate-app-icons.mjs` depuis la racine du dépôt.
- Le mode application ne change pas les capacités WebXR, le suivi ou les permissions du téléphone. Une AR indisponible dans le navigateur n’est pas rendue disponible par l’installation.
- Les jetons restent en mémoire de page ; le brouillon non enregistré est perdu si la page ou la session AR est fermée. Ne pas recharger pendant un relevé non enregistré.
- Cette fonctionnalité vise Chrome Android. Les menus d’installation et WebXR sur iPhone ne sont pas validés ; aucun paquet APK autonome ni publication Google Play n’est fourni.
- `http://localhost:5173` sert aux vérifications sur le PC. Installer cette adresse sur le PC ne donne pas au téléphone l’adresse du serveur HAOS.

## Vérification

Les tests logiciels et les vérifications du manifeste dans Chrome ne prouvent pas une installation réelle sur téléphone. Le lancement depuis l’écran d’accueil, les permissions et l’AR en mode application restent à essayer sur l’appareil.

Pendant le développement : compilation/typecheck et 26 tests existants réussis ; chargement du manifeste et décodage des icônes vérifiés dans Chrome intégré ; propositions, annulation, acceptation, confirmation et erreur d’installation simulées par événements. Aucun téléchargement ou installation effective d’une application Android n’a été effectué par l’agent.

Sources : [manifeste d’application web](https://web.dev/learn/pwa/web-app-manifest) et [critères du manifeste pour l’installation dans Chrome](https://developer.chrome.com/docs/lighthouse/pwa/installable-manifest).
