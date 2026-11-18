# Ajouter une aventure — contrats de Phase 1

Une aventure est un manifeste versionné qui réutilise des types de modules enregistrés. Ajouter un scénario JSON ne modifie pas le moteur. Ajouter un nouveau **type de règle** nécessite un module TypeScript et son enregistrement ; aucun script JavaScript n’est exécuté depuis un manifeste.

Les versions intégrées sont [MyRoom classique](../../server/src/adventures/legacy.ts) et [Menthe 27](../../server/src/adventures/menthe27.ts). Le serveur lit aussi les fichiers `*.json` de `DATA_DIR/adventures/`, ou de `ADVENTURE_CATALOG_DIR` si défini. Lecture au démarrage : redémarrer le serveur après ajout. Au maximum 32 fichiers externes de 128 Kio chacun. Un manifeste invalide ou un doublon ID/version bloque le démarrage sans supprimer le fichier.

## Exemple minimal : un coffre

```json
{
  "schemaVersion": 1,
  "id": "mon-aventure",
  "version": "1.0.0",
  "title": "Le premier sceau",
  "description": "Une aventure indépendante utilisant le coffre existant.",
  "players": { "min": 1, "max": 4, "suggestedNames": [] },
  "targetMinutes": 10,
  "instances": [{
    "id": "premier-coffre",
    "type": "symbol-chest",
    "schemaVersion": 1,
    "config": {
      "order": ["sun", "tree", "moon", "star"],
      "hints": ["Le jour précède la nuit."],
      "rewards": [{ "id": "sceau", "label": "Premier sceau" }]
    }
  }],
  "steps": [{
    "id": "premier-sceau",
    "title": "Le coffre des symboles",
    "narrative": "Retrouvez les quatre balises puis approchez le panneau.",
    "kind": "puzzle",
    "instanceId": "premier-coffre",
    "next": null
  }],
  "objects": [
    { "instanceId": "premier-coffre", "objectId": "chest", "placementKey": "chest" },
    { "instanceId": "premier-coffre", "objectId": "panel", "placementKey": "panel" },
    { "instanceId": "premier-coffre", "objectId": "sun", "placementKey": "sun" },
    { "instanceId": "premier-coffre", "objectId": "tree", "placementKey": "tree" },
    { "instanceId": "premier-coffre", "objectId": "moon", "placementKey": "moon" },
    { "instanceId": "premier-coffre", "objectId": "star", "placementKey": "star" }
  ],
  "victory": { "requiredSteps": ["premier-sceau"] }
}
```

Le fichier se sélectionne ensuite depuis l’administration, une fois la partie précédente arrêtée. La sélection est en mémoire pour cette Phase 1. Les objets du moteur portent des IDs locaux à l’instance : deux instances peuvent employer le même `objectId` sans partager leur état. En revanche, le rendu historique et les neuf points sont encore réutilisés ; la façade exige des liaisons `objectId === placementKey`. Les nouvelles transformations/collections de placements seront intégrées en Phase 3.

## Validation et indépendance

Les IDs, versions, références, objets, configurations et conditions de victoire sont validés. Chaque objet déclaré par un module doit avoir une liaison. Chaque instance doit correspondre à une seule étape ; plusieurs étapes peuvent utiliser le même **type** avec des IDs d’instance différents. Les références `next` doivent suivre l’ordre de la liste et se terminer par `null`. Les cycles et embranchements sont refusés en V1 ; la structure explicite permet une évolution ultérieure.

Une étape future peut être déclarée avec `kind: "planned"` et `puzzleType`, sans `instanceId`. Le moteur s’y arrête en statut `pending` ; cela ne vaut pas réussite. La victoire V1 exige toutes les étapes. Le registre ne contient pas encore `blackjack-hybrid`.

Un module implémente [PuzzleModule](../../server/src/engine/puzzle-types.ts). Sa configuration et ses états/actions sont validés séparément. `reduce` renvoie un nouvel état et un refus explicite en cas d’action non autorisée. Le moteur seul enregistre la réussite, les récompenses et la transition. Aucun accès WebSocket, Three.js, disque ou pièce n’est nécessaire pour tester les règles.

Les indices sont déclarés et l’instantané possède un niveau d’indice par instance ; aucune attribution admin n’est implémentée en Phase 1. Le client conserve le rendu actuel et sa phrase d’énigme historique pour le coffre ; un manifeste avec un autre ordre doit prévoir son parcours de présentation lors de la généralisation du client. Les nouveaux modules/visuels, la manipulation magnétique et la persistance de session attendent les phases validées suivantes.

## Phase 2

Voir [blackjack-hybrid](blackjack-hybrid.md) pour un module avec contexte serveur, projection publique et contrat optionnel `earnedRewards` pour les gains par manche. `maintain` libère les réservations expirées ou déconnectées. Les modules existants conservent leur comportement sans ces extensions.
# Introduction de session réutilisable

Le champ facultatif `introduction` accepte `{ "type": "team-portal", "schemaVersion": 1, "config": ... }`. La configuration complète est décrite dans [Team Portal](../team-portal.md) et son exemple intégré se trouve dans [Menthe 27](../../server/src/adventures/menthe27.ts). Cette introduction ne figure ni dans `steps`, ni dans `victory.requiredSteps`. Le démarrage est coordonné par la salle avant l’AdventureEngine. Sans ce champ, les anciens manifestes conservent le démarrage direct. Créer une nouvelle version d’aventure pour ajouter le rituel plutôt que modifier une version déjà utilisée.

