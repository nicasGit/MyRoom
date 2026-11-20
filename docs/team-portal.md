# Team Portal — préparation coopérative de session

## Univers personnel — 0.15.3

Après prise de son bâton et ouverture du portail, faire passer la tête par le
disque suffit pour afficher un couloir virtuel entièrement opaque, avec les
fantômes approximatifs des autres participants. Reculer la tête devant le plan
revient en MR, même après confirmation du passage. Cela change le rendu local,
sans annuler la validation serveur. Le décor reste ancré au repère manuel A/B.
L'ouverture extérieure est plate de profil ; la profondeur est un effet du shader.
Le son temporel synthétisé accompagne l'entrée visuelle ; une sélection/pince
ou poignée XR permet aussi de réactiver l'audio si le navigateur l'a suspendu.
Ce son n'est pas l'enregistrement original du TARDIS. Les écrans Guardian ou
système restent sous le contrôle du casque. Aucun test physique Quest annoncé.

Les sections suivantes retracent les versions précédentes.

Version 0.8.0 publiée depuis `feature/team-portal`. Aucun essai physique Quest effectué par l’agent. Le rituel ne constitue pas une énigme et n’ajoute aucune condition de victoire.

**Version 0.8.0 publiée.** Le blocage initial de traversée a été corrigé : l’ouverture initialise le détecteur avec la dernière pose validée récente, pour reconnaître un premier pas immédiat. TypeScript, compilation et les 85 tests réussissent, dont le scénario réseau complet. Publication GitHub réussie et manifeste ARM64 vérifié ; détails dans [le récapitulatif](RECAPITULATIF.md). Aucun essai matériel n’est annoncé.

Cette version attend collectivement les quatre passages dans la même pièce MR. Elle ne change pas encore le décor pour un joueur passé et ne montre pas d’avatars à travers une fenêtre vers un autre univers. Ces éléments constituent une évolution distincte.

**Depuis 0.8.1 : accueil global.** Le vortex et les quatre bâtons deviennent la première scène après le calibrage, indépendamment de l’aventure sélectionnée. Ils apparaissent en attente avant même le démarrage du rituel. Les énigmes sont masquées jusqu’aux quatre passages ; un accès de test explicite peut les afficher directement. Il n’est plus nécessaire de sélectionner Menthe 27 0.3.0 pour obtenir le vortex. Le placement doit toujours être configuré et confirmé une fois pour la pièce. Cette évolution est publiée en 0.8.1.

## Bâtons flottants — version 0.8.2 publiée

Le socle 3D est retiré. Les quatre bâtons sont répartis automatiquement dans la pièce par le serveur : marge aux murs et obstacles déclarés, espacement minimal d'un mètre et exclusion du couloir du vortex. Tous les clients reçoivent les mêmes positions. Le démarrage est refusé si quatre emplacements ne peuvent pas être trouvés. Les champs historiques `stand` restent lisibles et définissent désormais le repère des informations ; ils ne représentent plus un meuble.

Chaque bâton possède deux anneaux lumineux avec une pulsation douce et une légère suspension visuelle de 2,5 cm. La suspension s'arrête pendant la prise ; les poses et les baux de manipulation restent autoritaires et séparés de cette animation. Le compteur flotte sans socle. Les anciennes mentions du socle ci-dessous décrivent la version publiée 0.8.1.

Le calcul repose sur le relevé déclaré, sans détection physique en temps réel. La dispersion et la lisibilité restent à vérifier dans la pièce réelle sur Quest. Version 0.8.2 publiée, workflow réussi et image ARM64 vérifiée ; aucun essai matériel effectué pour cette évolution.

## Architecture et compatibilité

Évolution locale : dans **Team Portal**, régler **Nombre de joueurs** de 1 à 4, confirmer le passage puis enregistrer avant de démarrer. Ce nombre est sauvegardé avec les paramètres de la pièce. Les premières places nominatives sont utilisées ; les noms des autres places restent conservés. Les bâtons, compteurs, actions de simulation et passages attendus suivent ce nombre. En solo, son propre passage suffit à lancer l'aventure. Les anciennes configurations sans ce champ restent à quatre joueurs. Le serveur refuse les connexions aux places supérieures et refuse de réduire le groupe tant que ces places sont connectées. Le nombre ne peut pas être changé pendant une session active. Les indications historiques de quatre passages ci-dessous concernent le réglage par défaut.

Évolution locale après 0.8.2 : l'ouverture de cinq secondes démarre dès la première attribution d'un bâton. Elle ne dépend plus des quatre prises ou de leur présence pendant cette animation. Les passages validés et le lancement de l'aventure restent soumis aux quatre présences calibrées et aux quatre passages ; l'ouverture seule ne lance aucune énigme.

Sur téléphone en AR avec DOM Overlay, après A/B, une main virtuelle droite apparaît à 55 cm devant la caméra, légèrement en dessous. Approcher le téléphone pour amener cette main sur son bâton, toucher **Prendre (main virtuelle)**, déplacer le téléphone, puis **Relâcher (main virtuelle)**. Il s'agit d'une simulation explicite, pas d'un suivi optique de main. Elle réutilise les commandes, baux et contrôles serveur existants ; une seule main ne peut soulever un objet lourd. La main est masquée pendant un brouillon de pièce ou une perte de suivi ; aucune simulation ne remplace une source Quest main/contrôleur. Les essais matériels restent à effectuer.

Dans la version publiée 0.8.0, les manifestes peuvent déclarer `introduction: { type: "team-portal", schemaVersion: 1, config: ... }`. La version 0.8.1 conserve cette métadonnée pour lire les manifestes existants, mais l’accueil est désormais géré globalement par la salle, activé par défaut pour toutes les aventures. Choisir une aventure ne réinitialise pas le portail. `PuzzleModule`, le coffre et les règles du blackjack sont conservés. Le démarrage de l’AdventureEngine est appelé une seule fois par le coordinateur de salle, après le rituel.

- Serveur : `portal-types.ts` (contrats/validation), `team-portal.ts` (machine d’états), `crossing-detector.ts` (géométrie pure), `seat-sessions.ts` (reprise privée), `placement-store.ts` (placements indépendants).
- Client : `staff-view.ts`, `portal-view.ts`, `portal-client.ts` et `portal-admin.ts`. Les bâtons utilisent `ObjectGrabber`, `GrabInputs` et les baux de `ObjectManipulation` ; aucune seconde implémentation de la saisie ou du calibrage.
- Le repère manuel A/B reste local à chaque casque, en mètres. Il ne devient pas une ancre spatiale partagée. L’affichage cohérent dépend de l’utilisation des mêmes repères physiques et d’un suivi stable.

## Préparer depuis l’administration

1. Choisir une pièce avec les neuf placements existants. L’accueil Vortex est commun à toutes les aventures ; choisir séparément celle qui devra commencer après le rituel.
2. Saisir les quatre noms ou utiliser les noms suggérés. Les noms du rituel viennent de ces places ; ils ne prouvent aucune identité.
3. Régler le socle X/Y/Z, le vortex X/Z, son angle en radians, sa largeur/hauteur, le sens `1` ou `-1`, les distances d’approche et de sortie. Personnaliser couleurs, symboles, longueur et cristal des quatre bâtons.
4. Vérifier physiquement le passage et ses deux côtés, cocher la confirmation, enregistrer. Toute édition du formulaire retire cette confirmation. La validation du serveur contrôle aussi le couloir et le socle par rapport au contour et aux obstacles déclarés.
5. Démarrer le rituel. Chacun rejoint sa place, entre en AR et effectue A/B. Les quatre joueurs doivent rester présents et fournir un suivi calibré récent.

Le placement virtuel ne garantit pas l’absence d’obstacles physiques. Garder Guardian/Boundary actif ; dégager les passages, surveiller les autres joueurs et marcher calmement. Aucun mouvement artificiel de caméra, saut ou course n’est demandé. Le portail doit être plus haut que la tête de tous les participants ; la limite logicielle n’est pas une mesure de l’environnement réel.

Les placements sont sauvegardés séparément dans `DATA_DIR/portal-placements.json`, format versionné, écriture temporaire puis remplacement atomique. La version 0.8.1 utilise une clé globale par pièce `pièce@team-portal@1` ; les anciennes clés pièce/aventure/version restent conservées et servent de secours si la clé globale n’existe pas. Enregistrer depuis l’administration crée la clé globale. Aucune pièce existante n’est supprimée. Les attributions, jetons de place et la session active restent en mémoire : un redémarrage serveur exige une nouvelle connexion et un nouveau rituel. Les anciennes progressions ne sont pas migrées ni persistées sur disque par cette phase.

## Jouer

L’administration propose aussi **Introduction Vortex** en tête des accès directs, puis **Commencer l’intro Vortex**. Ce démarrage réel ne nécessite pas le mode test PC ; il conserve l’activation de Team Portal et la confirmation du passage physique. Le bouton principal indique **Commencer avec l’intro Vortex** lorsque cette introduction est activée. Le rituel reste distinct d’une énigme et le coffre attend toujours les quatre passages. Cet accès supplémentaire est publié en 0.8.1.

Prendre le bâton portant son nom avec une main, via pince ou poignée de contrôleur selon les capacités réellement exposées. Seul le serveur attribue le bâton à la place authentifiée par la connexion. Relâcher le bâton ne retire pas l’attribution ; le modèle s’illumine et le socle affiche le compteur. Les positions utiles utilisent la synchronisation existante ; les squelettes des mains ne sont pas partagés.

Avec quatre bâtons attribués et quatre présences prêtes, l’ouverture dure cinq secondes. Anneaux, vortex, faisceaux et signal sonore spatial synthétisé constituent des effets légers ; le son dépend de l’autorisation audio du navigateur. La flèche au sol indique le sens de traversée. Après ouverture, franchir calmement le centre depuis le côté d’approche. Chaque passage reçoit une confirmation et un halo individuel. Après les quatre passages et deux secondes de fermeture collective, le coffre du manifeste apparaît. A/B et les placements de la pièce restent conservés.

Le bouton **Mode accessible : valider mon passage sans traverser**, disponible en HTML et sur une étiquette 3D sélectionnable, est une alternative explicite au passage physique. Le serveur exige toujours le portail ouvert et les quatre présences prêtes. L’organisateur peut également valider une place ou passer l’introduction ; cette dernière commande est un contournement administratif explicite, pas une preuve de traversée.

## Reconnexion et confidentialité

La connexion reçoit un secret aléatoire de reprise de place, conservé dans `sessionStorage` pour cet onglet et transmis comme sous-protocole WebSocket sous HTTPS/WSS, sans le mettre dans l’URL ou le journal applicatif. Le serveur conserve son empreinte et refuse une seconde connexion simultanée avec le même justificatif. Pendant le rituel, une place absente reste réservée ; le nom affiché ou un nouveau navigateur ne permettent pas de la récupérer. L’attribution du bâton et le passage déjà validé restent attachés à la place. Le joueur reconnecté doit retrouver son suivi calibré ; la présence collective bloque sinon l’avancement. L’administration peut libérer explicitement une place déconnectée pour un remplacement.

Après redémarrage serveur ou perte du secret, le bouton **Rejoindre avec une nouvelle place** efface le justificatif local. Il ne contourne pas une réservation active : l’organisateur doit la libérer. Ne pas partager le justificatif ni cloner un onglet pour rejoindre deux places.

Les poses de tête sont envoyées environ trois fois par seconde uniquement pendant le rituel. Elles sont bornées et contrôlées côté serveur avec séquences, historique limité à la dernière pose et détecteur transitoire. Depuis 0.13.0, les positions WebXR récentes sont partagées avec les participants dans `portal.ghosts` pour afficher les silhouettes, avec place et âge serveur ; elles ne sont ni écrites en journal ni sur disque. Les modes caméra et simulateur ne fournissent pas de fantômes physiques. Les coordonnées déclarées par le casque ne sont pas une mesure physique indépendante.

## Traversée et concurrence

Le détecteur exige un départ à au moins 30 cm devant le plan et une intersection du rectangle utile. Depuis 0.12.0, l'arrivée WebXR est validée à 4 cm derrière le plan de tête ; le simulateur virtuel conserve une arrivée à 30 cm. Les bords ont une marge de 8 cm. Les sauts excessifs et trous de suivi annulent l’historique ; des oscillations autour du plan ne suffisent pas. Le sens, la hauteur et la largeur sont contrôlés. Une place ne peut valider qu’un passage par session.

## Révélation personnelle 0.13.2

Chaque participant doit prendre son propre bâton pour voir le vortex et son
panneau en bois. Avant cette première prise validée par le serveur, les bâtons
restent visibles et accessibles, mais pas le vortex, le panneau, les faisceaux
ou la flèche. Prendre le bâton d'une autre place reste refusé. Relâcher son bâton
ne masque pas le portail : l'attribution est conservée jusqu'au prochain rituel.
La reconnexion à la même place conserve cette attribution ; un reset ou une
nouvelle session la retire. L'ouverture collective dure toujours cinq secondes
à partir de la première prise, sans attendre toutes les prises ; un joueur qui
prend son bâton ensuite découvre l'ouverture dans son état courant.

Le couloir et la confirmation accessible sont également réservés aux participants
ayant pris leur bâton. Le serveur ignore le franchissement physique avant cette
prise et refuse une confirmation accessible sans bâton. La détection et A/B ne
changent pas. Les commandes administrateur de passage forcé restent des
contournements explicitement identifiés. Le son d'ouverture n'est pas joué chez
un participant qui n'a pas encore pris son bâton. Les simulateurs et l'aperçu
joueur appliquent la même règle individuelle ; aucun aperçu anonyme ne révèle
le portail. Cette règle remplace la visibilité collective des versions précédentes.

## Centrage, panneau et fantômes 0.13.0

Pour une nouvelle pièce sans placement, le vortex est proposé au centre géométrique
du sol. Si le couloir est bloqué, la proposition cherche la zone libre la plus
proche, éventuellement avec une ouverture plus compacte. Un centre situé dans
un meuble ou hors d'une pièce concave n'est pas retenu aveuglément. Pour une pièce
existante, arrêter la session puis **Centrer le vortex** dans les paramètres du
menu mural ou dans Team Portal sur l'administration PC. Cette action sauvegarde
la proposition ; vérifier et confirmer à nouveau l'espace physique avant de
démarrer. Les anciens placements ne sont pas déplacés en cours de jeu.

Un grand panneau en bois irrégulier, avec grain, clous et liseré noir/crème, affiche
**« Entrez entièrement dans le vortex »**. Il apparaît au fond du portail ouvert,
puis plus grand dans le couloir personnel avec le compteur des arrivées. Il s'agit
d'un décor original d'ambiance fantastique et macabre, sans ressource du film
Beetlejuice. Le panneau n'est pas un objectif à rejoindre : franchir dans le couloir
physique dégagé confirmé, puis attendre sur place, sans parcourir la profondeur
virtuelle du tunnel. Le franchissement de tête, les seuils et les règles de départ
collectif ne changent pas.

Dans le couloir, les autres participants WebXR suivis apparaissent en silhouettes
translucides avec leur nom, même s'ils n'ont pas encore passé le vortex. La tête
et la projection au sol utilisent leur position A/B ; le torse et l'encombrement
corporel sont estimés, sans suivi des mains ou du corps partagé. Les silhouettes
utilisent la pose de point de vue fournie par WebXR : sur un casque, celle de la
tête ; sur un téléphone en WebXR natif, celle de la caméra tenue en main, qui ne
doit donc pas être prise pour une localisation précise du corps. Les silhouettes
restent visibles devant le panneau/décor, deviennent orangées à moins de 90 cm
horizontalement et s'effacent entre 600 et 1 000 ms d'âge. Une pose perdue,
déconnexion, changement de mode ou fin du rituel retire le fantôme. Le panneau
signale **Suivi incomplet** quand des participants n'ont pas de silhouette récente.

Ces positions sont partagées uniquement entre clients connectés durant le rituel,
pas enregistrées dans les pièces, les journaux ou les sauvegardes. Le mode caméra
et le simulateur ne sont pas présentés comme des personnes physiquement suivies.
Le partage dépend du calibrage manuel, de la dérive XR, du réseau et des poses
déclarées. Il ne détecte ni les personnes sans casque, ni les meubles réels non
relevés, et ne garantit pas l'absence de collision. Conserver Guardian/Boundary
et les distances physiques. Pas d'interpolation prédictive susceptible de faire
croire à une position mesurée ; le rafraîchissement suit les poses du rituel
(environ trois par seconde). Alignement et confort restent à vérifier sur Quest.

## Couloir personnel 0.12.0

Depuis 0.12.1, après validation de son passage, le joueur entend une boucle
originale de moteur temporel inspirée du TARDIS : pulsations graves, souffle et
grincement modulé. Aucun enregistrement de la série. Synthèse locale Web Audio,
volume modéré et fondus doux ; seuls les joueurs déjà dans leur couloir entendent
l'ambiance. Elle s'arrête à la fin/annulation du rituel, perte de suivi,
recalibrage, déconnexion, masquage de la session XR ou sortie XR. L'aperçu de tête
non encore validé reste silencieux. Le navigateur doit avoir autorisé l'audio après
un geste (lancement WebXR ou appui sur la page) ; en cas de refus le jeu continue
silencieusement, et un prochain appui peut réessayer. Le volume général se règle
sur le casque. Pas de synchronisation temporelle de la boucle entre appareils.
Son et confort restent à vérifier sur Quest réel.

Avec un suivi WebXR calibré, approcher depuis la flèche, à au moins 30 cm devant
le portail, puis passer doucement la tête dans son ouverture. Dès 1,5 cm derrière
le plan, un aperçu local remplace le passthrough par un tunnel bleu/violet animé,
inspiré d'un voyage entre univers. Le serveur valide le passage à 4 cm derrière
le plan lors de la prochaine pose reçue (environ 300 ms). L'aperçu n'attribue aucune
progression. Revenir devant le plan avant validation annule l'aperçu ; une nouvelle
entrée demande de refaire l'approche. Après validation, le couloir reste visible
jusqu'à la fin du rituel, même en reculant : le retour visuel n'est pas un nouveau
passage et ne retire pas une validation déjà acquise.

Chaque casque voit son propre décor. Les joueurs non passés gardent le portail
et la pièce réelle. Le panneau du couloir affiche les passages validés en direct
et demande de rester sur place ; il est fixé dans le repère A/B à l'entrée,
pas attaché au regard. Son bâton et ses mains restent visibles et manipulables.
L'aventure ne démarre qu'après tous les passages des joueurs choisis, avec suivi
et présence de tous, puis les deux secondes de transition collective existantes.
Une reconnexion à la même place conserve le passage validé après reprise du suivi.

Le tunnel donne une profondeur visuelle : il ne représente pas un couloir réel à
parcourir. Aucune translation de caméra, aucune modification de Guardian/Boundary,
aucune sortie de la zone du casque. Le décor masque volontairement le passthrough
pendant l'attente : rester dans l'espace dégagé confirmé. Une perte de pose,
un recalibrage ou la sortie XR retire le décor ; annulation et fin du rituel aussi.
La fin revient au rendu MR de l'aventure existante, pas à un nouvel environnement
persistant. Il n'y a pas encore de rendu d'autres joueurs à travers la surface du
portail, ni de découpe par œil comparable à l'effet système du casque. Le changement
est déclenché par la pose centrale de tête déclarée par WebXR, pas par une API
Guardian. Les confirmations accessibles et administrateur conservent leur méthode
distincte ; le mode caméra ne devient pas un franchissement physique.

Cette première version du couloir concerne la session immersive WebXR ; les modes
Virtual3D et CameraAR conservent leur rendu et leurs méthodes de passage existants.
Le style est procédural et original, sans ressource de Doctor Who. Validation
logicielle et aperçu Chrome uniquement ; tester alignement, confort, suivi, opacité
du rendu immersive-ar et performances sur Quest avant une utilisation collective.

Les commandes portent session, révision, identifiant unique et séquence. Les commandes discrètes exigent la révision courante ; les poses tolèrent les révisions antérieures de la même session pour ne pas bloquer quatre flux concurrents, avec séquence strictement croissante et contrôle du déplacement. Refus explicites, limite dédiée de débit et identité déduite de la connexion. L’expiration du suivi retire l’état prêt. Les protections de saisie existantes restent actives.

## Simulation sans casque

Activer **Autoriser la simulation PC**, confirmer un placement, puis **Simulation PC à quatre places** dans Team Portal. Utiliser **Simuler la prise** pour chaque place, attendre l’ouverture, puis **Simuler le passage** pour chaque place. Le serveur simule les quatre présences dans cette session étiquetée **SIMULATION PC**. Le socle et le vortex sont visibles dans l’aperçu joueur avec les commandes de caméra existantes. La simulation permet d’atteindre le coffre sans casque ; elle ne valide pas la détection physique, le suivi, la lisibilité ou les performances Quest. Réinitialiser l’aventure et désactiver le mode test avant une partie réelle.

## Validation attendue sur matériel

Vérifier sur chaque casque : disponibilité des entrées, lisibilité des noms, prise/reprise avec une main, alignement du portail entre quatre appareils, stabilité après un recentrage, espace réellement dégagé, passage au centre dans le bon sens, refus en bordure et en oscillant, perte/reprise de suivi, reconnexion, alternative accessible, audio et performances. Aucun de ces essais matériels n’est annoncé comme effectué.
