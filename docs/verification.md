# Vérifications du squelette

Exécutées le 16 novembre 2026 sous Windows, Node.js 24.16.0 / npm 11.13.0 :

| Vérification | Résultat |
|---|---|
| `npm install` | Réussie ; lockfile créé, audit sans vulnérabilité signalée |
| `npm run typecheck` | Client et serveur valides |
| `npm run build` | Bundle Vite et serveur TypeScript produits |
| `npm test` | 3 tests réussis : places, révisions, intégration HTTP/WebSocket |

Le test réseau démarre un vrai serveur Node sur le port 13017, vérifie `/health`, quatre connexions, le refus de la cinquième, la résolution diffusée et le contrôle d'origine.

Non vérifiés : affichage navigateur, sessions WebXR, Quest 2 / 3 / 3S, précision du calibrage, image Docker ARM64, Nginx en exécution et installation HAOS. Docker n'est pas disponible dans cet environnement. Voir [la procédure matérielle](quest-validation.md) et [le déploiement](deployment.md).
