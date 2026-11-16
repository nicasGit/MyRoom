# Déploiement HAOS / Raspberry Pi 5

## Première publication GitHub

Le dépôt est https://github.com/nicasgit/myroom. Le workflow [publish-addon.yaml](../.github/workflows/publish-addon.yaml) vérifie TypeScript, compile et teste, puis publie une image linux/arm64 sur ghcr.io/nicasgit/myroom. La version est lue dans [config.yaml](../haos-addon/config.yaml). Il utilise GITHUB_TOKEN : aucun secret personnel à ajouter.

1. Envoyer les changements sur main et attendre le succès du workflow dans Actions.
2. Dans le paquet GitHub myroom du compte nicasgit, ouvrir **Package settings → Change visibility → Public**. Un nouveau paquet GHCR peut être privé par défaut. Home Assistant doit télécharger l'image sans authentification. Le dépôt GitHub doit aussi être public pour cette procédure.
3. Ajouter https://github.com/nicasgit/myroom aux dépôts de la boutique d'add-ons Home Assistant (pas HACS). Installer **MyRoom**, sans copie manuelle de fichiers.
4. Configurer public_origin avec l'origine HTTPS exacte, sans slash final, puis démarrer l'add-on. Port hôte par défaut : 8099.
5. Configurer un Nginx frontal selon [l'exemple HTTPS](nginx-https.conf), avec l'adresse du Raspberry Pi et le port 8099. Prévoir DNS et certificat reconnus par les casques. Réserver l'accès au réseau de confiance : aucune authentification applicative.
6. Ouvrir l'origine HTTPS sur Quest. Vérifier /health, les quatre places et le passage WSS. Le port 8099 reste interne ; ne pas publier le port Node 3000.

## Versions suivantes

Incrémenter version dans [config.yaml](../haos-addon/config.yaml), compléter le [changelog](../haos-addon/CHANGELOG.md) et pousser sur main. Attendre la publication avant la mise à jour HAOS. Le Supervisor utilise le tag de version, pas latest. Relancer manuellement le workflow depuis Actions si nécessaire. Ne pas réutiliser une version distribuée pour une nouvelle release.

## Construction manuelle

Le Dockerfile nécessite la racine du dépôt comme contexte pour compiler les workspaces. HAOS télécharge l'image précompilée indiquée par image ; il ne construit pas depuis le sous-dossier.

```sh
docker buildx build --platform linux/arm64 -f haos-addon/Dockerfile -t ghcr.io/nicasgit/myroom:0.1.0 --push .
```

Essai Docker local : construire avec `docker build -f haos-addon/Dockerfile -t myroom .`, puis `docker run --rm -p 8099:8080 -e PUBLIC_ORIGIN=https://myroom.example.com myroom`. Le proxy TLS reste nécessaire.

L'image, l'installation Supervisor et l'exécution sur Raspberry Pi 5 restent à valider. Docker n'est pas installé dans l'environnement de préparation. Aucun test sur casque effectué.
