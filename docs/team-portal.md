# Team Portal — préparation coopérative de session

Implémentation en cours sur `feature/team-portal`. Aucun essai physique Quest effectué par l’agent. Le rituel ne constitue pas une énigme et n’ajoute aucune condition de victoire.

## Architecture et compatibilité

Le manifeste peut déclarer `introduction: { type: "team-portal", schemaVersion: 1, config: ... }`. Sans ce champ, le démarrage conserve son comportement historique. Menthe 27 `0.3.0` reprend exactement les étapes, objets et règles de `0.2.0` et ajoute cette introduction ; les versions antérieures restent au catalogue. `PuzzleModule`, le coffre et les règles du blackjack sont conservés. Le démarrage de l’AdventureEngine est appelé une seule fois par le coordinateur de salle, après le rituel.

- Serveur : `portal-types.ts` (contrats/validation), `team-portal.ts` (machine d’états), `crossing-detector.ts` (géométrie pure), `seat-sessions.ts` (reprise privée), `placement-store.ts` (placements indépendants).
- Client : `staff-view.ts`, `portal-view.ts`, `portal-client.ts` et `portal-admin.ts`. Les bâtons utilisent `ObjectGrabber`, `GrabInputs` et les baux de `ObjectManipulation` ; aucune seconde implémentation de la saisie ou du calibrage.
- Le repère manuel A/B reste local à chaque casque, en mètres. Il ne devient pas une ancre spatiale partagée. L’affichage cohérent dépend de l’utilisation des mêmes repères physiques et d’un suivi stable.

## Préparer depuis l’administration

1. Choisir une pièce avec les neuf placements existants, puis **Menthe 27 0.3.0**.
2. Saisir les quatre noms ou utiliser les noms suggérés. Les noms du rituel viennent de ces places ; ils ne prouvent aucune identité.
3. Régler le socle X/Y/Z, le vortex X/Z, son angle en radians, sa largeur/hauteur, le sens `1` ou `-1`, les distances d’approche et de sortie. Personnaliser couleurs, symboles, longueur et cristal des quatre bâtons.
4. Vérifier physiquement le passage et ses deux côtés, cocher la confirmation, enregistrer. Toute édition du formulaire retire cette confirmation. La validation du serveur contrôle aussi le couloir et le socle par rapport au contour et aux obstacles déclarés.
5. Démarrer le rituel. Chacun rejoint sa place, entre en AR et effectue A/B. Les quatre joueurs doivent rester présents et fournir un suivi calibré récent.

Le placement virtuel ne garantit pas l’absence d’obstacles physiques. Garder Guardian/Boundary actif ; dégager les passages, surveiller les autres joueurs et marcher calmement. Aucun mouvement artificiel de caméra, saut ou course n’est demandé. Le portail doit être plus haut que la tête de tous les participants ; la limite logicielle n’est pas une mesure de l’environnement réel.

Les placements sont sauvegardés séparément dans `DATA_DIR/portal-placements.json`, format versionné, écriture temporaire puis remplacement atomique, clé pièce/aventure/version. Aucune pièce existante n’est supprimée. Les attributions, jetons de place et la session active restent en mémoire : un redémarrage serveur exige une nouvelle connexion et un nouveau rituel. Les anciennes progressions ne sont pas migrées ni persistées sur disque par cette phase.

## Jouer

Prendre le bâton portant son nom avec une main, via pince ou poignée de contrôleur selon les capacités réellement exposées. Seul le serveur attribue le bâton à la place authentifiée par la connexion. Relâcher le bâton ne retire pas l’attribution ; le modèle s’illumine et le socle affiche le compteur. Les positions utiles utilisent la synchronisation existante ; les squelettes des mains ne sont pas partagés.

Avec quatre bâtons attribués et quatre présences prêtes, l’ouverture dure cinq secondes. Anneaux, vortex, faisceaux et signal sonore spatial synthétisé constituent des effets légers ; le son dépend de l’autorisation audio du navigateur. La flèche au sol indique le sens de traversée. Après ouverture, franchir calmement le centre depuis le côté d’approche. Chaque passage reçoit une confirmation et un halo individuel. Après les quatre passages et deux secondes de fermeture collective, le coffre du manifeste apparaît. A/B et les placements de la pièce restent conservés.

Le bouton **Mode accessible : valider mon passage sans traverser**, disponible en HTML et sur une étiquette 3D sélectionnable, est une alternative explicite au passage physique. Le serveur exige toujours le portail ouvert et les quatre présences prêtes. L’organisateur peut également valider une place ou passer l’introduction ; cette dernière commande est un contournement administratif explicite, pas une preuve de traversée.

## Reconnexion et confidentialité

La connexion reçoit un secret aléatoire de reprise de place, conservé dans `sessionStorage` pour cet onglet et transmis comme sous-protocole WebSocket sous HTTPS/WSS, sans le mettre dans l’URL ou le journal applicatif. Le serveur conserve son empreinte et refuse une seconde connexion simultanée avec le même justificatif. Pendant le rituel, une place absente reste réservée ; le nom affiché ou un nouveau navigateur ne permettent pas de la récupérer. L’attribution du bâton et le passage déjà validé restent attachés à la place. Le joueur reconnecté doit retrouver son suivi calibré ; la présence collective bloque sinon l’avancement. L’administration peut libérer explicitement une place déconnectée pour un remplacement.

Après redémarrage serveur ou perte du secret, le bouton **Rejoindre avec une nouvelle place** efface le justificatif local. Il ne contourne pas une réservation active : l’organisateur doit la libérer. Ne pas partager le justificatif ni cloner un onglet pour rejoindre deux places.

Les poses de tête sont envoyées environ trois fois par seconde uniquement pendant le rituel. Elles sont bornées et contrôlées côté serveur avec séquences, historique limité à la dernière pose et détecteur transitoire. Elles ne sont ni publiées dans les instantanés, ni écrites en journal ou sur disque. Les coordonnées déclarées par le casque ne sont pas une mesure physique indépendante.

## Traversée et concurrence

Le détecteur exige un départ à au moins 30 cm devant le plan, une intersection du rectangle utile et une arrivée à au moins 30 cm derrière. Les bords ont une marge de 8 cm. Les sauts excessifs et trous de suivi annulent l’historique ; des oscillations autour du plan ne suffisent pas. Le sens, la hauteur et la largeur sont contrôlés. Une place ne peut valider qu’un passage par session.

Les commandes portent session, révision, identifiant unique et séquence. Les commandes discrètes exigent la révision courante ; les poses tolèrent les révisions antérieures de la même session pour ne pas bloquer quatre flux concurrents, avec séquence strictement croissante et contrôle du déplacement. Refus explicites, limite dédiée de débit et identité déduite de la connexion. L’expiration du suivi retire l’état prêt. Les protections de saisie existantes restent actives.

## Simulation sans casque

Activer **Autoriser la simulation PC**, confirmer un placement, puis **Simulation PC à quatre places** dans Team Portal. Utiliser **Simuler la prise** pour chaque place, attendre l’ouverture, puis **Simuler le passage** pour chaque place. Le serveur simule les quatre présences dans cette session étiquetée **SIMULATION PC**. Le socle et le vortex sont visibles dans l’aperçu joueur avec les commandes de caméra existantes. La simulation permet d’atteindre le coffre sans casque ; elle ne valide pas la détection physique, le suivi, la lisibilité ou les performances Quest. Réinitialiser l’aventure et désactiver le mode test avant une partie réelle.

## Validation attendue sur matériel

Vérifier sur chaque casque : disponibilité des entrées, lisibilité des noms, prise/reprise avec une main, alignement du portail entre quatre appareils, stabilité après un recentrage, espace réellement dégagé, passage au centre dans le bon sens, refus en bordure et en oscillant, perte/reprise de suivi, reconnexion, alternative accessible, audio et performances. Aucun de ces essais matériels n’est annoncé comme effectué.
