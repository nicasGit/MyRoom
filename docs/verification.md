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

Version 0.1.6 : tests supplémentaires du contact pointerdown sans double action au relâchement, de la position récente consommée une seule fois, de la reprise du suivi pendant une demande, de l'invalidation des positions périmées et du refus d'une reprise après expiration ou annulation. Le retour utilisateur montre une alternance entre projection valide et suivi absent sur téléphone ; ces tests simulent ces transitions en logiciel, sans validation matérielle de la correction.

Version 0.2.0 : dix-sept tests logiciels, couvrant bibliothèque de plusieurs pièces, rechargement depuis disque, activation, suppression, révision concurrente, limite de capacité, refus d'écriture et fichier corrompu. Les API sont vérifiées avec authentification et diffusion du modèle aux quatre joueurs. Essai dans le navigateur intégré : affichage d'une fiche temporaire, surface, obstacle et aperçu 3D sur les pages joueur et admin. Le parcours de formulaire a également été simulé avec des points injectés : quatre coins, fermeture, un obstacle à deux coins puis annulation (sans session XR). Le relevé AR complet et la conservation sous HAOS restent à valider sur matériel. La fiche temporaire a été retirée après vérification.

Non vérifiés : affichage navigateur, sessions WebXR, Quest 2 / 3 / 3S, précision du calibrage, image Docker ARM64, Nginx en exécution et installation HAOS. Docker n'est pas disponible dans cet environnement. Voir [la procédure matérielle](quest-validation.md) et [le déploiement](deployment.md).
