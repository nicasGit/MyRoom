# Vérifications du squelette

Exécutées le 16 novembre 2026 sous Windows, Node.js 24.16.0 / npm 11.13.0 :

| Vérification | Résultat |
|---|---|
| `npm install` | Réussie ; lockfile créé, audit sans vulnérabilité signalée |
| `npm run typecheck` | Client et serveur valides |
| `npm run build` | Bundle Vite et serveur TypeScript produits |
| `npm test` | 3 tests réussis : places, révisions, intégration HTTP/WebSocket |

Le test réseau démarre un vrai serveur Node sur le port 13017, vérifie `/health`, quatre connexions, le refus de la cinquième, la résolution diffusée et le contrôle d'origine.

Version 0.1.3 : typecheck et compilation réussis ; les trois tests incluent maintenant l'authentification admin (jeton absent/incorrect), le refus d'une origine différente, la réinitialisation diffusée avec une nouvelle révision, la validation des identifiants et la déconnexion d'un joueur. Vérification manuelle dans le navigateur intégré : connexion admin, affichage joueur/journal et réinitialisation visible dans un onglet joueur. Pas d'essai physique HAOS ou Quest pour cette interface.

Version 0.1.4 : six tests logiciels, dont trois nouveaux tests de projection du rayon sur le sol (intersection, entrées invalides, horizon, distance) et de transformation à deux points. Les commandes tactiles DOM Overlay nécessitent encore un essai physique sur téléphone compatible ; elles ne sont pas validées par ces tests mathématiques. Voir [le parcours mobile](mobile-ar.md).

Version 0.1.5 : les tests couvrent également le dédoublonnage pointerup/click, la validation des diagnostics XR, leur accusé de réception WebSocket et leur présence dans le journal admin avec l'identité serveur. L'absence d'action sur le téléphone de l'utilisateur n'a pas pu être reproduite sur matériel ; le blocage silencieux du bouton quand la visée est invalide est corrigé et des traces permettent de poursuivre le diagnostic.

Non vérifiés : affichage navigateur, sessions WebXR, Quest 2 / 3 / 3S, précision du calibrage, image Docker ARM64, Nginx en exécution et installation HAOS. Docker n'est pas disponible dans cet environnement. Voir [la procédure matérielle](quest-validation.md) et [le déploiement](deployment.md).
