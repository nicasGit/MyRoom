# MyRoom — Récapitulatif des réalisations

### 20 novembre 2026 - Placement bibliothèque casque et admin PC, 0.15.2

Branche `feat/headset-library-placement`. Dans le menu mural, choisir un modèle
du catalogue intégré ou importé ouvre un aperçu translucide au rayon. Réglage
de hauteur de base, rotation et taille ; gâchette/sélection hors panneau pour
poser. Contour vert/rouge selon les limites de pièce. Confirmation enregistrée
immédiatement sur le serveur ; annulation sans créer d'objet. Après pose,
réglages habituels et prise une/deux mains disponibles, puis enregistrer les
placements après ajustement manuel. Catalogue paginé sur quatre modèles pour
garder les boutons lisibles. Réservé à la préparation hors partie, après A/B
et hors brouillon de relevé. Le plan horizontal de placement est manuel et
ne représente pas une détection de surface Quest.

Admin PC : la vue de pièce devient un éditeur avec sélection par clic ou liste,
gizmo de translation XYZ et rotation Y. Sauvegarde explicite, annulation/recharge,
révisions capturées au début de l'édition et rejet si changement concurrent.
Les objets fixes restent éditables par l'admin ; les règles de prise en jeu
restent inchangées. Poses explicites validées côté serveur, anciennes commandes
d'ajout automatique conservées. Vérifications : npm run typecheck, npm run build,
npm test (156 réussis), git diff --check. Chrome sur données de test isolées :
déplacement du gizmo, sauvegarde HTTP 200 et pose relue depuis le serveur ;
conflit provoqué par un autre ajout, sauvegarde bloquée, recharge fonctionnelle.
La fiche numérique accepte les coordonnées précises issues du gizmo, sans
imposer un pas de saisie de 0,01 qui empêcherait d'enregistrer une autre propriété.
Le test initial a révélé une hauteur négative via glissement dans un plan du
gizmo : corrigé par bornage vertical sol/plafond, puis sauvegarde vérifiée.
Tests de rayon/hauteur, validation des poses, droits API, commandes périmées,
objets tenus et restauration disque. Avertissement habituel de bundle Three.js.
Aucun test matériel Quest. Publication en cours.

### 20 novembre 2026 - Coffre importé, 0.15.1

Branche `feat/imported-puzzle-chest`. Le coffre d'énigme utilise le GLB
`treasure_chest_1k` déjà importé sur le serveur, identifié par son empreinte
de contenu (indépendamment du nom éditable). Aucun binaire ajouté au dépôt.
Le modèle doit rester dans le catalogue du serveur ; coffre procédural conservé
si absent ou chargement impossible. Couvercle séparé animé autour du pivot
du GLB et verrou masqué après ouverture. Dimensions de jeu 0,9 × 0,66 × 0,58 m,
placements existants, panneau mural, manipulation à deux mains, proximité,
indice sous le coffre et règles serveur conservés. Aucun changement du calibrage.
Vérifications : npm run typecheck, npm run build et npm test réussis (154 tests),
git diff --check réussi. Avertissement habituel de taille du bundle Three.js.
Structure du GLB vérifiée sur le serveur : corps, couvercle avec pivot arrière,
poignées et verrou séparés. Rendu en casque non testé. Publication vérifiée :
commit `41eb530` sur main, [workflow 44744965917](https://github.com/nicasGit/MyRoom/actions/runs/44744965917)
réussi. Image `ghcr.io/nicasgit/myroom:0.15.1`, plateforme `linux/arm64`,
label `0.15.1`, digest
`sha256:89b442741213f15ceee8f4a240ad21155df72dcf1c332fb21ba33434b72bab14`.

### 20 novembre 2026 - Bibliothèque GLB et import par lot, 0.15.0

Branche `feat/glb-library-import`. Page dédiée Bibliothèque, import de dix GLB
en une sélection, inspection avant prévisualisation et confirmation, compte rendu
par fichier. Aperçu 3D interactif, recherche/catégories, ajout dans la pièce active
et modal de configuration nom/dimensions/mains/orientation Y/fixe/source/licence.
Fichiers et catalogue versionnés enregistrés atomiquement dans DATA_DIR/models.
Modèles visibles par les joueurs et le casque via le catalogue synchronisé.
Les instances conservent leur version : une fiche modifiée ne transforme pas les
objets déjà placés. Auth admin et contrôles d’origine conservés ; fichiers
servis sur la même origine HTTPS. Limites : statique/autonome, 8 Mio, 100 000
sommets, 200 000 triangles, PNG/JPEG 2048 px/4 mégapixels, 64 fichiers/128 Mio.
Pas d’import externe, de compression nécessitant un décodeur, de skin ou animation.
Source/licence et confirmation de droits fournies par l’admin, sans attribution
automatique de licence libre. Pas de suppression des anciens fichiers/versions.
Vérifications : npm run typecheck, npm run build et npm test réussis (154 tests).
Des passages ont rencontré le verrouillage Windows EPERM connu dans RoomStore.
Une relance sans changement a réussi, puis le blocage s’est reproduit. Ajout
d’une reprise bornée du renommage atomique sous Windows (cinq tentatives, 80 ms
maximum d’attente), dans RoomStore et ModelStore ; aucune suppression de cible
ni reprise des autres erreurs. Test des erreurs persistantes et hors Windows. Chrome : sélection
multiple native de deux GLB, inspection, aperçu interactif, import du lot,
modification de fiche en v2 et ajout de v2 dans une pièce de test isolée.
Pas HTML de saisie numérique corrigé pour accepter les dimensions GLB précises.
Documentation : [import GLB](glb-import.md). Avertissement de taille Three.js
connu conservé. Aucun essai physique Quest/iPad. Publication vérifiée sur `main`
(commit `5bcd5ba`, fonctionnalité `b9195fb`) : [workflow 44705985246](https://github.com/nicasGit/MyRoom/actions/runs/44705985246)
réussi, image `ghcr.io/nicasgit/myroom:0.15.0` disponible avec plateforme
`linux/arm64` et label de version `0.15.0`. Digest vérifié :
`sha256:557c8e0b59927ee2fcf5c31102e57fd9d086ab2793c528a5a62319f1a5380c00`.
Le guide initial de bibliothèque renvoie désormais vers l’import GLB disponible.

### 20 novembre 2026 - Aperçus catalogue admin, 0.14.1

Branche `feat/admin-object-previews`. Les huit cartes du catalogue admin PC
affichent une image 3D de leur vrai modèle GLB avant ajout. Cadrage automatique
et éclairage pour distinguer les volumes. Un seul contexte WebGL temporaire
produit les images statiques à l’apparition du catalogue ; aucune animation
continue ni contexte par carte. Les clones et ressources sont libérés après
rendu. En cas d’échec, indication explicite sans bloquer l’ajout.
Chargement commun avec la vue en jeu, sans modification serveur ou sauvegardes.
Lien d’accès rapide ajouté dans le tableau de bord.
Validation : npm run typecheck, npm run build et npm test réussis (149 tests),
git diff --check. Chrome : huit vignettes 360×240 chargées, cadrage visuel
vérifié, affichage disponible même sans pièce active. Avertissement Vite connu
sur la taille du chunk Three.js. Aucun essai physique Quest/iPad.
Publication vérifiée : commit `462729e` sur origin/main, workflow
[44699430522](https://github.com/nicasGit/MyRoom/actions/runs/44699430522) réussi.
Image `ghcr.io/nicasgit/myroom:0.14.1`, linux/arm64 et label version 0.14.1
vérifiés dans le registre. Digest :
`sha256:16f0df949c701ec970e045f040a7f272b39ef442e281b4b7768de08471e8096f`.

### 20 novembre 2026 - Bibliothèque initiale, 0.14.0

Branche `feat/object-library`. Huit modèles GLB Kenney Furniture Kit 2.0 sous
CC0 : table, chaise, bureau, lit, armoire, lampe, livres et plante. Archive
récupérée sur miroir, empreinte SHA-256 et licence originale vérifiées ;
fichiers locaux inchangés, source et empreintes individuelles conservées.

Bibliothèque dans l’admin PC et le menu mural : ajout, sélection, suppression
confirmée, mode fixe/manipulable, rotation horizontale, taille et sauvegarde.
L’admin propose aussi le nom et X/Y/Z. Prises partagées : deux mains pour les
meubles, une ou deux pour les petits objets ; écartement pour redimensionner.
Simulateur : prendre au clic/toucher, transporter au joystick, bouton Poser.

Instances versionnées et validées dans la pièce, sauvegarde atomique existante,
32 objets maximum, tailles ×0,1 à ×3, vérification murs et plafond. Anciennes
pièces et neuf points conservés. Baux, refus concurrents, révisions et nettoyage
sur déconnexion réutilisés. Les placements de mobilier survivent aux transitions
portail/énigmes. Les changements d’objets ne réinitialisent pas la progression.
L’édition et la sauvegarde sont protégées par l’admin existante, hors session.

Limites : objets incassables et décoratifs, lampe sans éclairage commandé, pas
d’ouverture d’armoire, de physique ou de déclencheurs d’indices ; importateur
de packs et rattachement par puzzle à venir. Pas de test physique Quest/iPad.
Un test a détecté le mauvais nombre de mains client pour les meubles ; corrigé
et couvert par un test client/serveur de redimensionnement. Les objets masqués
dans le couloir ou le mode relevé ne peuvent plus être pris invisiblement.
Documentation : [Bibliothèque](object-library.md).
Validation : npm run typecheck, npm run build et npm test réussis (149 tests),
git diff --check. Avertissement Vite connu : chunk Three.js 575 Ko.
Chrome logiciel : huit modèles chargés, 1 238 triangles, shaders valides ; ajout
et modification taille/fixe par le formulaire admin vérifiés sur une pièce de
test isolée. Contrôles automatisés via événements DOM, pas de test casque.
Publication vérifiée sur origin/main : commit `fe99d75`, workflow
[44697864429](https://github.com/nicasGit/MyRoom/actions/runs/44697864429) réussi.
Image `ghcr.io/nicasgit/myroom:0.14.0` disponible ; configuration linux/arm64
et label version 0.14.0 vérifiés directement dans le registre. Digest :
`sha256:07133017a8e84a662d09dbd528fe50e9ad73f4a66e0e9e1ff091006e54f967d8`.

### 20 novembre 2026 - Presets des noms, 0.13.3

Branche `feat/team-name-presets`. Deux boutons distincts dans l’administration
et le menu mural : Team Léon (Léon, Reno, Fabien, Nico) et Noms aléatoires
(quatre personnages différents, sans doublons, parmi 40 personnages).
Sur PC les boutons remplissent les champs puis Enregistrer les noms valide ;
dans le casque ils appliquent les noms via la commande protégée existante,
avec contrôle de révision. Aucune modification de progression.
Noms toujours conservés uniquement pendant ce démarrage du serveur.
Cette livraison concerne les noms ; bibliothèque et créateur restent à implémenter.
Validation : npm run typecheck, npm run build et npm test réussis
(142 tests). Aucun essai physique Quest.
Publication vérifiée sur origin/main : commit `bf8e1a5`, workflow
[44693110204](https://github.com/nicasGit/MyRoom/actions/runs/44693110204) réussi.
Image `ghcr.io/nicasgit/myroom:0.13.3` disponible, configuration linux/arm64
et version 0.13.3 vérifiées directement dans le registre. Digest :
`sha256:3bea77fcf1434d0e1c91852a33dc1cc61b2d1be9c991e3c514ec803c86db68c2`.

### 19 novembre 2026 — révélation individuelle du vortex, 0.13.2 publiée

Branche `fix/personal-vortex-unlock`. Chaque joueur voit le vortex et son panneau
uniquement après la première prise de son propre bâton, confirmée côté serveur.
Les faisceaux, flèche, confirmation accessible et son d'ouverture suivent le même
accès ; bâtons et menu restent disponibles avant la prise. Relâcher conserve
l'attribution pendant le rituel. Reconnexion à la même place la conserve ; reset
et nouvelle session la retirent. Le premier bâton démarre toujours l'ouverture
collective de cinq secondes ; chacun découvre l'état courant à sa prise.

WebXR, simulateurs et aperçu joueur utilisent la même place authentifiée, sans
révélation dans un aperçu anonyme. Visibilité initialisée avant la première image
et réappliquée à chaque animation, y compris après restauration des objets visibles
dans la boucle XR. Le couloir exige également l'attribution du bâton ; le serveur
ne valide pas une traversée physique avant prise et refuse la confirmation
accessible sans bâton. Contournements administrateur explicites conservés.
A/B, placements, coffre, blackjack, fantômes et son d'attente inchangés.

Vérifications réussies : `npm run typecheck`, `npm run build`, `npm test`
(141/141), `git diff --check`. Avertissement Vite habituel : chunk Three.js 574 kB.
Contrôle de la vue Three.js dans Chrome : vortex et panneau visibles pour la place
ayant pris son bâton, masqués pour l'autre place et l'aperçu anonyme, même après
restauration des objets visibles avant l'animation ; bâtons toujours visibles.
Test ajouté : première prise
d'une autre place sans révélation, refus de franchissement/confirmation et de
couloir, prise personnelle, reprise et reset. Aucun essai physique Quest annoncé.
Publication confirmée : commit `f5e78e9` intégré sur main, workflow
[44597916355](https://github.com/nicasGit/MyRoom/actions/runs/44597916355) réussi.
Image `ghcr.io/nicasgit/myroom:0.13.2` vérifiée dans le registre : Linux ARM64,
label version 0.13.2, digest
`sha256:6dfce3a36d100d36f5d32f2018deef88e1072715604e9a553ac4bdaf454da7d4`.

### 19 novembre 2026 — noms de pièces et reset d'aventure, 0.13.1 publiée

Branche `feat/room-names-adventure-reset`. Chaque fiche de la bibliothèque admin
dispose d'un champ et bouton **Renommer**. Route protégée `rooms/rename`, nom
validé (1 à 64 caractères), révision obligatoire, écriture atomique. L'ID, la
géométrie, les neuf placements et la sélection active restent inchangés. Le nom
seul est exclu des clés d'invalidation de l'aventure, du portail et des objets :
renommer une pièce active n'efface pas le rituel ou la progression, et ne demande
pas de refaire A/B. Sécurité admin conservée ; pas d'élargissement du mode debug.

Avant sauvegarde, le champ existant reçoit un bouton **Nommer / renommer la pièce**.
Dans les outils Quest : clavier virtuel sur le panneau, lettres, chiffres et
quelques accents, espace/effacement, validation, annulation et sortie XR. Saisie
vide refusée, limite de 64 caractères, modification du brouillon seulement avant
**Enregistrer et activer**. Téléphone/PC : édition du champ standard. Aucun prompt
navigateur requis dans le casque.

Bouton **Réinitialiser l’aventure** placé dans la section Aventure de l'admin,
confirmation explicite de suppression de progression/récompenses. Même commande
dans l'accueil mural, avec écran Oui/Annuler, réutilisant `adventure/reset`.
Réinitialise l'aventure choisie et arrête le rituel ; catalogue, pièces et placements
conservés. Le panneau d'entrée du vortex reste visible par tous après ouverture,
pas uniquement par les porteurs de bâtons : aucune modification de cette règle.

Vérifications réussies : `npm run typecheck`, `npm run build`, `npm test`
(140/140) et `git diff --check`. Avertissement Vite habituel : Three.js 574 kB.
Les premiers tests ont identifié un ancien test utilisant le changement de nom
pour simuler une autre pièce : il vérifie désormais que le nom conserve la
progression et qu'un autre ID la réinitialise. Le test HTTP a ensuite détecté
le verrou global du rituel : renommage de métadonnées et reset explicite sont
maintenant autorisés pendant le portail, après les contrôles admin existants.
Publication confirmée : commit `b8fcc7a` intégré sur main ; workflow
[44595642428](https://github.com/nicasGit/MyRoom/actions/runs/44595642428) réussi.
Image `ghcr.io/nicasgit/myroom:0.13.1` vérifiée dans le registre : Linux ARM64,
label version 0.13.1, digest
`sha256:144a9fbd6c7bf176469ae66a4cf09c937bcac486db7c68e755e7e406fe934bb4`.
Tests ajoutés : renommage persistant de pièce inactive sans activation, refus
des noms/révisions invalides, conservation d'une session active et de ses objets,
clavier borné et annulation ; HTTP protégé, refus sans droits admin et reset
conservant la bibliothèque. Aucun essai matériel Quest effectué par l'agent.

### 19 novembre 2026 — vortex centré, panneau et fantômes, 0.13.0 publiée

Branche `feat/centered-vortex-sign-ghosts`. Le placement automatique privilégie
le centroïde du sol, puis une position libre proche parmi les candidats validés,
en conservant les contrôles du couloir et de place des bâtons. Bouton **Centrer
le vortex** ajouté dans l'administration PC et nommé ainsi dans le menu mural.
Pour une pièce existante : arrêter la session, centrer puis vérifier/confirmer
à nouveau l'espace physique. Aucun déplacement silencieux d'un placement déjà
enregistré ou d'un portail actif ; aucune migration du format des pièces.

Panneau original en bois, grain procédural, clous, planche irrégulière et liseré
noir/crème, inspiré d'une ambiance fantastique macabre. Texte **« Entrez entièrement
dans le vortex »**, affiché au fond du portail ouvert et en grand dans le couloir,
avec compteur d'arrivées. Texture Canvas locale ; pas de ressource Beetlejuice.
Confirmation accessible déplacée sur le côté pour dégager le panneau principal.
Le message demande de finir le passage dans l'espace physique validé, puis
d'attendre ; la profondeur du décor ne doit pas être parcourue réellement.

`PortalPublic.ghosts` facultatif : place, position de tête WebXR validée et âge
calculé côté serveur, partagé seulement durant le rituel actif. Pas d'écriture
en journal ou sur disque ; modes caméra et simulateur exclus des fantômes
physiques, simulation du rituel exclue. Les joueurs encore dehors sont aussi
visibles depuis le couloir. Corps translucide estimé sous la tête, nom et repère
au sol, couleur orangée sous 90 cm, rendu devant le décor opaque. Position A/B
directe sans extrapolation ; pose effacée à 1 000 ms, suivis absents/déconnexions
exclus. Le client ajoute le temps écoulé depuis réception pour ne pas maintenir
une silhouette figée après silence réseau. Changement de session et nettoyage
réutilisent les mécanismes existants. Indication **Suivi incomplet** si nécessaire.

Les silhouettes ne constituent pas un suivi corporel complet ou un anticollision :
latence, dérive, calibrages différents et personnes sans casque restent des limites.
Guardian/Boundary, règles du rituel, seuils de tête, puzzles et son inchangés.
Voir [Team Portal](team-portal.md#centrage-panneau-et-fantômes-0130).

Vérifications initiales réussies : `npm run typecheck`, `npm run build`, `npm test`
(137 tests). Nouveaux tests : centroïde et obstacle central, absence de confirmation
automatique, poses fraîches/expirées, exclusion des autres modes, copies publiques,
perte de suivi/déconnexion et reprise ; rendu des seuls autres joueurs, couleur de
proximité, expiration locale, nouvelle session et position du panneau selon le sens.
Test réseau à quatre clients : silhouettes transmises, retrait à la déconnexion,
retour à la reprise et suppression en fin de rituel, avec départ collectif unique.
Aperçu Chrome inspecté : bois et texte lisibles, fantôme visible devant le tunnel,
cinq programmes compilés, 16 appels de dessin et 1 366 triangles pour ce montage
avec un autre joueur. Aucune mesure de performance ni validation matérielle Quest.
Contrôles finaux également réussis : `npm run typecheck`, `npm run build`,
`npm test` (137/137) et `git diff --check`. Avertissement Vite habituel : chunk
Three.js de 574 kB. Publication confirmée : commit `f0b7d3a` intégré sur main,
workflow [44578338067](https://github.com/nicasGit/MyRoom/actions/runs/44578338067)
réussi. Image `ghcr.io/nicasgit/myroom:0.13.0` vérifiée dans le registre : Linux
ARM64, label version 0.13.0, digest
`sha256:c3925a28d4646f3ab16138570567208b49cc982945785fc420d570f75de12900`.
Précision documentaire : WebXR fournit une pose de point de vue ; sur un téléphone
en WebXR natif, celle-ci représente la caméra, pas la tête ni le corps du porteur.

### 19 novembre 2026 — ambiance du couloir, 0.12.1 publiée

Branche `feat/vortex-waiting-audio`. Boucle originale de moteur temporel inspirée
du TARDIS : graves modulés, souffle et grincement synthétisés avec Web Audio,
sans extrait de série ni fichier externe. Elle joue personnellement dans le
couloir après validation serveur du passage, pas pendant l'aperçu non confirmé.
Volume modéré, entrée en 400 ms et sortie en 180 ms ; une seule source active,
tampon mono de huit secondes réutilisé et nœuds déconnectés après arrêt.
Le tampon est préparé après le geste de lancement, à 22,05 kHz maximum, pour
éviter sa synthèse au premier franchissement dans la boucle d'animation XR.

Déverrouillage lors d'un geste utilisateur ou du lancement WebXR. Refus ou
suspension audio ne bloquent pas le jeu ; prochain appui réessaie. Arrêt à la
fin/annulation du rituel, perte de suivi, recalibrage, masquage de la session XR,
déconnexion ou sortie XR ; fermeture du contexte à la sortie de la page.
Règles, protocole, calibrage, pièces et modes simulateurs inchangés.
Volume réglable avec les commandes générales du casque ; boucle non synchronisée
entre appareils. Aucun essai physique Quest ni écoute matérielle annoncés.

Contrôles réussis : `npm run typecheck`, `npm run build`, `npm test` (133 tests),
dont trois tests audio : signal périodique fini et borné, absence de multiplication
des sources sur les images répétées, arrêt/reprise/nettoyage et audio indisponible.
Rendu Web Audio hors ligne Chrome à 48 kHz sur neuf secondes : boucle et fondus
traités, silence confirmé après arrêt ; ce contrôle ne valide pas la restitution
sonore du casque. Le premier essai navigateur a rencontré le serveur local arrêté,
relancé pour exécuter le contrôle. Avertissement Vite habituel : chunk Three.js
574 kB. `git diff --check` réussi. Publication confirmée : commit `a003dca`
intégré sur main, workflow
[44567698800](https://github.com/nicasGit/MyRoom/actions/runs/44567698800) réussi.
Image `ghcr.io/nicasgit/myroom:0.12.1` vérifiée dans le registre : Linux ARM64,
label version 0.12.1, digest
`sha256:2a300b30e11e9f44552baaeced0e51e4d113b1dbfaa159c34af4eb57b2c6acd3`.
Deux passages intermédiaires ont rencontré l'EPERM Windows connu lors du remplacement
atomique de la bibliothèque des pièces ; aucun échec audio. Nouvelle exécution
complète inchangée réussie (133/133). Après déplacement
du pré-calcul audio, TypeScript a aussi détecté un retour de tampon potentiellement
indéfini : corrigé avec un retour typé avant les vérifications finales.

### 19 novembre 2026 — couloir personnel après passage de tête, 0.12.0 publiée

Branche `feat/head-crossing-waiting-corridor`. Dans la session immersive WebXR,
le passage de la tête dans le plan du vortex affiche individuellement un couloir
bleu/violet procédural opaque, sans translation artificielle de caméra. Aperçu
local à 1,5 cm derrière le plan, progression validée uniquement par le serveur à
4 cm, après une approche de 30 cm. Sens, rectangle utile, marges, historique,
sauts, lacunes de suivi, révisions et séquences restent contrôlés. Le simulateur
virtuel conserve son seuil de 30 cm et le mode caméra ne valide pas physiquement.

Le panneau du couloir reste fixé dans le repère A/B à l'entrée et affiche en
direct les passages validés et l'attente du groupe. Les autres casques gardent
le portail jusqu'à leur passage. Mains et bâton restent utilisables ; le menu
mural extérieur et les effets du portail sont masqués pendant l'attente. Toutes
les présences et passages sont toujours nécessaires au départ unique, après
la transition collective existante. Reconnexion à la même place : validation
conservée après reprise du suivi. Fin, annulation, perte de pose, recalibrage et
sortie XR retirent le décor et restaurent le fond transparent. Aperçu non validé
réversible ; après validation, rester dans le couloir jusqu'à la fin du rituel.

Aucun changement de format de pièce, des neuf placements, des puzzles ou d'A/B.
Guardian/Boundary inchangé. Le couloir ne doit pas être parcouru physiquement ;
rester dans l'espace réel dégagé. Pas de découpe par œil, de fenêtre montrant les
autres joueurs ou de second environnement persistant après le lancement.
Modes Virtual3D/CameraAR inchangés. Voir [Team Portal](team-portal.md#couloir-personnel-0120).

Contrôles réussis : `npm run typecheck`, `npm run build`, `npm test` (130 tests).
Premier test ciblé : attente incorrecte d'une seconde entrée sans nouvelle
approche ; corrigée pour respecter l'hystérésis existante, sans assouplir ce garde.
Tests ajoutés : seuil physique distinct du virtuel, attente des autres joueurs,
aperçu/réversibilité, acquittement, reprise, suivi perdu, nouvelle session, sens
inversé et angle, ouverture utile, sauts et lacunes ; géométrie opaque, animation
sans déplacement de caméra et nettoyage. Aperçu Chrome inspecté : trois programmes
compilés, six appels de dessin pour couloir et panneau. Avertissement Vite habituel
sur le chunk Three.js de 574 kB. Aucun essai matériel Quest effectué par l'agent.
Publication confirmée : commit `8ed42a8` intégré sur main ; workflow
[44565020200](https://github.com/nicasGit/MyRoom/actions/runs/44565020200) réussi
(validation et publication). Image `ghcr.io/nicasgit/myroom:0.12.0` vérifiée dans
le registre : Linux ARM64, label version 0.12.0, digest
`sha256:89202fc076757ba7444f965aea185d40ec8c16cda4a90e1b729dfb0bc875add9`.
`git diff --check` réussi. Documentation de publication uniquement après ces vérifications.

### 19 novembre 2026 — bâtons libres et vortex, 0.11.0 publiée

Branche `feat/free-staff-rotation-vortex`. Les bâtons peuvent suivre l'orientation
complète d'une main ou manette : quaternion calculé dans le repère A/B, rotation
autour du point de prise conservé, position et orientation diffusées environ dix
fois par seconde pendant la prise. Relâcher conserve la pose dans la session ;
perdre le suivi, expirer ou se déconnecter conserve les règles d'annulation existantes.
La possibilité d'attendre et de manipuler son bâton après son passage reste active
tant que l'introduction n'est pas terminée. Attribution par place, baux, séquences,
bornes et validation côté serveur conservés. Aucun lancer ou moteur physique ajouté.

Le protocole ajoute un quaternion facultatif normalisé, strictement réservé aux
bâtons ; anciennes commandes yaw et anciennes pièces restent lisibles. Coffre,
table et panneaux conservent leurs règles de manipulation. Pas de nouvelle donnée
persistée dans les placements des neuf objets. La main simulée du téléphone utilise
également son orientation. Les faisceaux suivent maintenant la vraie pointe inclinée.

Rendu du portail remplacé par un effet original bleu/cyan, inspiré de l'ambiance
Sliders : surface spiralée procédurale, trois filaments de tunnel en profondeur,
particules et bord lumineux. Pas d'extrait vidéo ou de ressource de la série.
Le tunnel visuel suit le sens du passage ; ouverture et transitions serveur inchangées.
Il ne constitue pas un rendu d'un second univers à travers une fenêtre spatiale.
Chrome PC : shaders compilés, aperçu inspecté, six appels de dessin et 3 440 triangles
pour le vortex isolé. Aucune mesure de fréquence d'images sur Quest.

Contrôles réussis : `npm run typecheck`, `npm run build`, `npm test` (126 tests),
`git diff --check`. Premier passage échoué sur EPERM Windows connu de RoomStore ;
aucun échec des tests de rotation ou du vortex. Passage complet suivant réussi.
Tests : pivot de prise et rotation complète, retour yaw historique, rejet des
quaternions invalides et des rotations complètes des gros objets, mouvement et
pose de quatre bâtons diffusés aux autres clients, transitions et départ unique.
Avertissement Vite habituel : chunk Three.js 574 kB. Aucun essai matériel Quest
par l'agent. Publication confirmée : commit `fb3a03a` intégré sur main, workflow
[44561759931](https://github.com/nicasGit/MyRoom/actions/runs/44561759931) réussi.
Image `ghcr.io/nicasgit/myroom:0.11.0` vérifiée dans le registre : Linux ARM64,
label version 0.11.0, digest
`sha256:dc290b1a90e72a925a686cd71f61aaaf999787c84d972f364ee79361aee577d3`.

### 19 novembre 2026 — préparation du portail et mains aux manettes, 0.10.3 publiée

Branche `fix/portal-preparation-controller-hands`. Le changement du nombre de joueurs
était refusé par la validation intégrale d'un couloir inchangé. La configuration
autorise maintenant les réglages sans déplacer la géométrie invalide ; un espace
invalide perd sa confirmation. Une modification spatiale ou une confirmation
positive exigent toujours la validation géométrique. Sessions actives et réduction
du groupe sous des places connectées restent protégées.

Pour les pièces sans placement portail enregistré, proposition calculée dans le
contour, avec obstacles, rotations et place pour les bâtons. Repli compact si utile,
sans confirmation automatique. Les placements enregistrés restent prioritaires.
« Adapter le portail à la pièce » dans Paramètres du menu mural permet de recalculer
explicitement un ancien placement ; il faut ensuite confirmer l'espace physique.
Si aucun couloir exploitable n'est trouvé, le démarrage reste refusé et l'utilisateur
doit corriger l'espace ou réduire le groupe. A/B inchangé, aucune garantie de mesure
physique à partir du seul relevé.

L'API prépare les neuf emplacements d'énigmes uniquement lorsqu'ils manquent, via
le générateur existant, validation du modèle et écriture atomique de la bibliothèque.
Cette préparation peut être sauvegardée même si une autre condition du rituel bloque
ensuite son démarrage. Les anciennes pièces et placements existants sont conservés.
Application aussi aux commandes reset et simulation du portail.

Aux manettes : doigts animés séparément depuis les valeurs analogiques de gâchette
et poignée, pouce depuis les contacts exposés, repos légèrement fléchi et transitions
lissées. Il s'agit d'une pose simulée, pas d'un suivi réel des doigts avec manettes.
Les poses articulaires des mains suivies restent inchangées.

Contrôles réussis : `npm run typecheck`, `npm run build`, `npm test` (123 tests),
`git diff --check`. Tests : compte du groupe malgré un ancien couloir invalide,
confirmation toujours refusée si invalide, proposition dans une pièce décalée,
absence d'espace libre, préparation HTTP de points manquants, conservation des
points existants, recalcul explicite du portail, entrées analogiques et animation
indépendante des doigts sur les deux vrais modèles GLB. Un passage intermédiaire
a rencontré EPERM dans RoomStore et un retour 400 de sauvegarde dans le test réseau ;
relance complète sans changement de code réussie. Avertissement Vite connu : 574 kB.
Aucun test matériel Quest réalisé par l'agent. Publication confirmée : commit
`1adc8a2` intégré sur main, workflow
[44552273782](https://github.com/nicasGit/MyRoom/actions/runs/44552273782) réussi.
Image `ghcr.io/nicasgit/myroom:0.10.3` contrôlée dans le registre : Linux ARM64,
label version 0.10.3, digest
`sha256:cf307ef16bb5fe3c039ab68c1ede05d425a2cecdf1ae200f2366f6093d0d5847`.

### 19 novembre 2026 — refus du rituel et accueil WebXR, 0.10.2 publiée

Branche `fix/ritual-errors-home-launch`. Le menu envoyait correctement `{}` à
adventure/start, mais la capture générale de l'API remplaçait les exceptions métier
de startSession par « Requête JSON invalide ». La route renvoie maintenant le
motif réel du refus et journalise adventure_start_refused. Les prérequis physiques,
placements, droits admin et règles de progression restent exigés. Le motif exact
du refus sur le serveur HAOS de l'utilisateur n'est pas connu à distance.

Le bouton existant, son identifiant et son parcours WebXR sont conservés, déplacés
dans une zone « Lancer le jeu » en haut de l'accueil. Statut de lancement au même
endroit, sélection des modes placée ensuite. L'accès reste conditionné aux capacités
du navigateur et à la politique serveur ; aucune permission caméra demandée ici.

Tests HTTP étendus : placements absents, espace non confirmé, démarrage réussi
après confirmation et vrai JSON malformé. Premier passage : le double DOM du test
DisplayClient manquait querySelector, ajouté au double ; contrôles finaux réussis :
`npm run typecheck`, `npm run build`, `npm test` (120 tests), `git diff --check`.
Avertissement Vite habituel : chunk Three.js 574 kB.
Accueil vérifié dans Chrome PC : bouton avant modes, installation et diagnostics.
Aucun essai physique Quest effectué. Publication confirmée : commit `564dae6`
intégré sur main, workflow
[44546009704](https://github.com/nicasGit/MyRoom/actions/runs/44546009704) réussi.
Image `ghcr.io/nicasgit/myroom:0.10.2` vérifiée dans le registre : Linux ARM64,
label 0.10.2, digest
`sha256:f942b5b459e0f132e632b486453e176cf2de36901c3d8aa5db871284116fc668`.

### 19 novembre 2026 — mains, bâtons et panneau à distance, 0.10.1 publiée

Retour utilisateur : scan Quest satisfaisant, mains encore à incliner vers le bas,
bâton impossible à prendre et panneau mural trop éloigné. Branche
`feat/quest-staffs-distance-menu`. Rotation locale X diminuée de 30° pour les mains
simulées ; roulis gauche/droite conservé, suivi optique articulé inchangé.

Prise : événements natifs selectstart/selectend pris en compte en complément des
boutons de manette pour l'introduction et de la pince mesurée pour les mains.
Zone de saisie dédiée au bâton, marge de 22 cm, indépendante du halo et du nom.
Le client ignore les bâtons des autres places pour la saisie ; serveur inchangé
pour l'attribution, présence, calibrage déclaré et session active. La manipulation
d'un bâton n'exige plus un placement d'énigmes, contrairement aux objets de jeu.
Ces corrections ciblent plusieurs blocages possibles ; leur efficacité sur le
casque de l'utilisateur reste à confirmer par un nouvel essai physique.

Quatre modèles CC0 locaux : staff et wand KayKit Adventurers, Skeleton_Staff KayKit
Skeletons, SWS de TCCDev sur OpenGameArt. Textures et licences/provenance conservées
dans [les ressources](../client/public/models/staffs/README.md). Hauteurs normalisées,
matériaux visibles sans éclairage, cache des modèles, clones isolés et nettoyage
protégé si une scène est détruite pendant le chargement. Forme procédurale de secours.

Panneau admin et outils de pièce : viser à huit mètres maximum puis maintenir
poignée/pince attire le panneau à 85 cm du rayon, face à l'utilisateur ; la main
peut ensuite le déplacer. Relâcher le pose localement sans déclencher de bouton.
Une prise d'objet à proximité garde la priorité sur le panneau visé en arrière-plan.
Position locale au client, réinitialisée au recalibrage/changement de pièce.

Vérifications réussies : `npm run typecheck`, `npm run build`, `npm test`
(120 tests sans échec) et `git diff --check`. Tests ajoutés : rotation vers le bas,
prise native sans gamepad, cycle client/serveur saisir-déplacer-poser dans un repère
tourné, indépendance des énigmes, normalisation et priorité des zones de saisie,
rapprochement du panneau et protection contre le clic au relâchement.
Chargement des quatre modèles avec textures et hauteur normalisée vérifié dans
Chrome PC via les vrais fichiers glTF/GLB, ainsi que la protection d'un chargement
tardif après destruction de la scène. Avertissement Vite connu : Three.js 574 kB.
Aucun essai physique Quest effectué par l'agent.
Publication confirmée : commit `4f73100` intégré sur main, workflow
[44542918168](https://github.com/nicasGit/MyRoom/actions/runs/44542918168) réussi.
Image `ghcr.io/nicasgit/myroom:0.10.1` contrôlée dans le registre : Linux ARM64,
label version 0.10.1, digest
`sha256:91c1b4c916168872d8449f71ae279210521a5c8fa11bc52867ae7dde35da163e`.

### 19 novembre 2026 — édition des obstacles Quest, 0.10.0 publiée

Branche `feat/quest-obstacle-editor`. Inclinaison des mains simulées augmentée de
30° en conservant les signes gauche/droite ; les mains réellement suivies gardent
leurs poses articulaires. Sauvegarde des pièces autorisée lorsque admin_token est
vide, indépendamment du debug explicite. Exception limitée à rooms/save ; jeton
configuré, origine, validation, révision et restrictions de session conservés.
Le client vérifie l'autorisation au moment de sauvegarder et protège les doubles
requêtes pendant cette vérification.

Éditeur local de volumes dans le mode pièces : une main déplace, deux mains
redimensionnent indépendamment les axes. Aperçu puis validation au relâchement,
annulation du geste si suivi perdu, historique d'annulation dans le brouillon.
Les obstacles restent au sol et alignés sur A/B ; limites de pièce et placements
d'énigmes validés avant acceptation. Aucun changement du format des pièces.
Import des maillages de meubles étiquetés si exposés par WebXR, boîtes englobantes
bornées et dédoublonnage avec les plans. Bouton d'import dans le panneau 3D.
Voir [le guide Quest](quest-obstacle-editor.md) pour le parcours et les limites.

Vérifications réussies : `npm run typecheck`, `npm run build`, `npm test`
(115 tests, aucun échec), `git diff --check`. Tests supplémentaires : sauvegarde
HTTP sans jeton avec debug désactivé, origine et données refusées, gestes à une
et deux mains, perte de suivi, volume hors contour, capture et dédoublonnage des
meubles. Avertissement Vite habituel : chunk Three.js de 574 kB.
Aucun essai Quest matériel, ni validation sur un appareil HAOS annoncés.
Publication confirmée : commit `1cd3038` intégré sur main, workflow
[44537462522](https://github.com/nicasGit/MyRoom/actions/runs/44537462522) réussi.
Image `ghcr.io/nicasgit/myroom:0.10.0` vérifiée dans le registre : Linux ARM64,
label version 0.10.0, digest
`sha256:3706038bd9c0f7241583721837db3c2848cac999fe2c38d7673882c35ad7fc61`.

### 19 novembre 2026 — option debug facultative, 0.9.3 publiée

Erreur rapportée par l'utilisateur : Supervisor refuse l'ancienne configuration contenant
seulement public_origin et admin_token, car debug_without_admin_token était requis.
Branche `fix/optional-debug-option`. Schéma changé en `bool?`, retrait de la valeur
par défaut du dictionnaire options conformément à la documentation Home Assistant :
une option avec valeur dans options reste obligatoire. Le démarrage utilise déjà
un repli explicite false si la clé manque ; le serveur exige toujours une activation
explicite et un jeton vide pour le debug. Les configurations true/false existantes
restent utilisables. Aucun changement des données de pièce, du calibrage ou des jeux.

Contournement immédiat communiqué : ajouter debug_without_admin_token: true pour
activer volontairement le debug, ou false pour le laisser désactivé. Typecheck, build
et 111 tests réussis ; premier passage de tests interrompu par le refus Windows EPERM
connu de RoomStore, relance complète réussie sans changement de cette logique.
Contrôle de diff réussi, avertissement Vite habituel 574 kB ;
pas d'essai Supervisor ou Quest matériel.
Source : [Options / Schema officiel](https://github.com/home-assistant/developers.home-assistant/blob/master/docs/apps/configuration.md).

Publication confirmée : commit `4da8132` sur main, workflow
[44531094724](https://github.com/nicasGit/MyRoom/actions/runs/44531094724) réussi
avec contrôles Linux et publication ARM64. Image `ghcr.io/nicasgit/myroom:0.9.3`
vérifiée Linux ARM64, label 0.9.3, digest
`sha256:56b8c7c0c36f8edc53db83a4a202cd05bd239b0712211dc3dce22f9650a0dd23`.

### 19 novembre 2026 — menus Quest, bâtons et debug administrateur, 0.9.2 publiée

Branche `fix/debug-admin-staff-grab`. Le menu verrouillé ouvrait automatiquement
le formulaire du jeton après une action protégée, ce qui faisait apparaître le clavier
sur Moins de joueurs. Les actions refusées restent désormais dans le panneau avec
une explication ; seule la commande explicite de déverrouillage propose le jeton.
Messages de prise et refus serveur visibles sur le mur. Rappel du démarrage du rituel
avant la prise ; gâchette autorisée en plus de la poignée/pince pendant l'introduction,
sans téléportation de la main ni modification des contrôles de proximité et de place.

Option HAOS `debug_without_admin_token`, désactivée par défaut. Avec activation explicite
et jeton vide, tous les clients obtiennent les droits administrateur, y compris menu
mural, administration web, placement et sauvegarde des pièces. Avec un jeton configuré,
authentification inchangée ; un jeton trop court non vide ne donne jamais le debug.
Le contrôle automatique avait refusé l'activation implicite par défaut sur le service
partagé ; l'option explicite évite cette ouverture involontaire. La validation des données,
des révisions et de l'origine des écritures reste active. Aucun secret diffusé ; le mode
debug est signalé aux clients. Aucun essai matériel Quest effectué par l'agent.

Retour utilisateur complémentaire : inclinaison des mains inversée, visée cachée par
le panneau et besoin de déplacer la fenêtre. Inclinaison gauche/droite inversée.
Curseurs 3D sur la surface des deux menus avec priorité d'affichage sur les panneaux ;
rayons visibles, cible au sol masquée lorsqu'un menu est visé. Menu administratif et
outils de relevé saisissables à une main proche par poignée/pince, translation et rotation
complètes puis pose au relâchement. Les coordonnées de menu restent locales au client,
séparées des objets de jeu et des placements persistants. Les mises à jour serveur ne
replacent pas une fenêtre déplacée ; nouveau calibrage ou changement de pièce rétablit
sa position initiale. Perte du suivi et fin de session libèrent la saisie. Une saisie de
menu ne lance ni clic ni manipulation d'énigme simultanée.

Contrôles finaux : typecheck, build et 111 tests réussis, git diff --check réussi.
Un contrôle intermédiaire a rencontré le refus Windows EPERM connu sur renommage
atomique de RoomStore ; les passages complets après ajout des menus ont réussi.
Contrôles Chrome avec poses simulées et appels administrateur simulés : Moins ne
déplace pas le focus en mode verrouillé, route portal appelée en debug sans clavier ;
saisie/déplacement local, maintien de la position après réception du même modèle,
réinitialisation et curseur sur la surface confirmés. Aucun essai physique Quest,
aucun test de prise réelle sur casque revendiqué. Avertissement Vite habituel 574 kB.

Publication confirmée : commit `7b62094` sur main, workflow
[44529450043](https://github.com/nicasGit/MyRoom/actions/runs/44529450043) réussi
avec contrôles Linux et publication ARM64. Image `ghcr.io/nicasgit/myroom:0.9.2`
vérifiée Linux ARM64, label 0.9.2, digest
`sha256:14791668a94f3d55957681cce436967ffaf37637380dc96402a708d649cbeaad`.

### 19 novembre 2026 — correction Quest, version 0.9.1 publiée

Retour utilisateur sur casque : superposition des panneaux, contour impossible à fermer,
absence de sortie pendant le relevé, mains contrôleurs trop plates. Branche
`fix/quest-survey-controls` : panneau 3D dédié au relevé, fixe dans le référentiel local
et décalé à gauche, disponible sans DOM Overlay. Boutons nouvelle/modifier, fermeture
du contour, retrait, obstacle, enregistrement, annulation, annuler et revenir au jeu,
et quitter la réalité mixte. La sortie XR reste accessible pendant une sauvegarde ;
le retour au jeu annule explicitement le brouillon et reste bloqué pendant son écriture.
Les commandes réutilisent les validations et boutons Survey existants. Les zones
désactivées ne déclenchent pas un placement de coin à travers le panneau.

Le menu administratif est masqué pendant le relevé ; le panneau d'informations
historique reste limité au calibrage et ne se superpose plus aux outils. Sans pièce
active, les outils s'ouvrent après A/B. Les mains simulées ont une inclinaison locale
opposée gauche/droite et un angle de poignée ; modèles et primitives de repli suivent
la même correction. Les poses optiques des vraies mains restent inchangées.

Typecheck et build réussis, 106 tests réussis. Deux passages intermédiaires ont
rencontré le refus Windows EPERM connu du test RoomStore ; le dernier passage complet
réussit sans changer cette logique. Tests ajoutés : disponibilité de fermeture,
annulation avant retour, sortie pendant écriture et inclinaison symétrique des mains.
Dans Chrome, contrôle du panneau Canvas, neuf boutons, bouton désactivé non sélectionné,
puis exercice Survey avec calibrage injecté : trois points, fermeture effective,
enregistrement rendu disponible et annulation du brouillon. Aucun enregistrement
serveur ni session WebXR dans cet exercice. Les entrées world-space utilisent les
commandes 3D même si DOM Overlay est déclaré disponible, afin d'éviter un panneau
HTML superposé dans le casque. Aucun nouvel essai matériel Quest effectué par
l'agent. Le retour casque provient de l'utilisateur et concerne la version précédente.

Publication confirmée : commit `dd3a1b5` sur main, workflow
[44525747590](https://github.com/nicasGit/MyRoom/actions/runs/44525747590) réussi
avec contrôles Linux et publication ARM64. Image `ghcr.io/nicasgit/myroom:0.9.1`
vérifiée Linux ARM64, label 0.9.1, digest
`sha256:165fd5d4cba90ab458c74bd9dba9aa47e8b17e146e9547f5ae080e62b4fa6c60`.

### 19 novembre 2026 — trois modes d'affichage, version 0.9.0 publiée

Branche `feat/display-modes` : adaptateurs Virtual3D, CameraAR expérimental et
QuestWebXR partageant les vues et commandes d'énigmes. Simulation sans WebXR ni
caméra, navigation clavier/souris et joystick tactile, pièce et interactions communes.
Superposition vidéo transparente, activation explicite, gestes de placement locaux,
recentrage, retour de sécurité 3D et nettoyage des pistes, y compris après permission
tardive. Libellé sans ancrage spatial permanent. Politique administrateur persistante
avec validation, révisions et écriture atomique ; défaut appliqué aux futures connexions,
pas de remise à zéro de progression. Capacités déclarées visibles dans l'administration.
Le portail distingue les passages virtuels, confirmations caméra, poses XR et actions
administrateur ; changement de mode nettoie l'historique des poses. Pièces, neuf
emplacements, A/B, HTTPS/WSS et image HAOS aarch64 conservés.

Contrôles finaux : typecheck, build et 104 tests réussis, dont blackjack réseau à
modes mixtes, changement de politique sans perte de progression, méthodes de passage,
navigation concave, permissions simulées, libération vidéo et cycle de sortie Quest
via adaptateur testé sans matériel. Contrôle de diff réussi.
Une relance intermédiaire a rencontré le refus Windows EPERM connu au renommage
atomique du test RoomStore ; le dernier passage complet réussit sans modifier cette logique.
Une nouvelle page Chrome intégrée a permis de confirmer la version 0.9.0,
le mode virtual-3d, le Canvas et le joystick, sans flux caméra au chargement.
La scène est placée directement sous le choix de mode. Aucun essai complet d'énigme
ni permission caméra réelle dans ce contrôle DOM, faute de pièce active locale.
Avertissement Vite habituel du bloc
Three.js de 574 kB. Aucun essai matériel iPad, Android ou Quest, aucune validation
WebKit réelle annoncée.

Publication confirmée : commits `986c8fb` et `0458ed0` intégrés et poussés sur main.
Workflow final [44505159207](https://github.com/nicasGit/MyRoom/actions/runs/44505159207)
réussi, contrôles Linux et publication ARM64 inclus. Image
`ghcr.io/nicasgit/myroom:0.9.0` vérifiée Linux ARM64, label 0.9.0, digest
`sha256:90a29c15e8236099196d4cd7223b5a967370e84a06fcbfe68bf9e41ceacc29f2`.
Voir [le guide et les limites](display-modes.md).

État au **19 novembre 2026**, fonctionnalités publiées jusqu’à **0.9.3**, incluant le mode test administrateur et le blackjack hybride de la Phase 2. Ce document rassemble les travaux effectués dans le dépôt, les parcours d’utilisation, les vérifications et les limites connues. Les résultats matériels rapportés par l’utilisateur sont distingués des tests logiciels réalisés pendant le développement.

## 1. Projet et architecture

### 18 novembre 2026 - commandes téléphone absentes, correction 0.8.6 publiée

Après le retour utilisateur (main visible, pas de bouton ni autres éléments), branche `fix/mobile-ar-controls`. Extraction des commandes essentielles dans une barre directement rattachée à la racine DOM Overlay, indépendante du panneau de diagnostic repliable/défilant : Prendre/Relâcher, sélection au mur, pièces/jeu et sortie AR. Utilisation de bindPress au premier contact avec suppression des doublons synthétiques. Maintien de l'état fermé entre les images, annulation si suivi/calibrage indisponible. Le mode XR screen-space donne priorité à la simulation téléphone, même si le navigateur fournit un grip ; les entrées Quest suivies conservent leur fonctionnement. La barre reste présente avec explication lorsque la prise est désactivée.

La scène ne conserve plus une clé de cache valide lorsqu'elle n'a pas pu être construite ; nouvelle tentative si le modèle arrive tard. Messages explicites hors panneau repliable pour pièce active absente, mode pièces ou serveur déconnecté. Aucun déplacement du menu partagé ou modification d'A/B. Test navigateur intégré 390×844 : visibilité dans l'écran, premier contact ferme, clic synthétique ne double pas, état conservé, second contact relâche, désactivation au suivi perdu. Il s'agit d'une vérification DOM sans vraie session AR. Typecheck, build, 95 tests et git diff --check réussis pour publication directe 0.8.6 (avertissement Vite du bloc Three.js de 574 kB) ; cause exacte sur l'appareil de l'utilisateur non observée matériellement.

Publication confirmée : commit `7e2379b` sur main, workflow [44385997877](https://github.com/nicasGit/MyRoom/actions/runs/44385997877) réussi avec contrôles Linux et publication ARM64. Image `ghcr.io/nicasgit/myroom:0.8.6` vérifiée : Linux ARM64, label 0.8.6, digest `sha256:d0b694f51ed6dd73d3991debc70897b0e97671c8e6bcf38328bf60e4e8638d0b`. Branche conservée, aucun essai matériel effectué par l'agent.

### 18 novembre 2026 - publication directe autorisée et 0.8.5 confirmée

L'utilisateur demande de conserver la préférence de publication directe : consigne ajoutée à AGENTS.md, applicable après validation avec branche dédiée, contrôles, mise à jour de version, intégration main et vérification ARM64, sans nouvelle confirmation sauf instruction contraire. Version add-on/client et changelog actualisés en 0.8.5. Typecheck et build de livraison réussis. Première relance des tests : 94/95, refus Windows EPERM sur renommage atomique dans le test de bibliothèque. Relance complète sans changement de code : 95/95 réussis. Commit `5ebaa24` publié sur main ; workflow [44381718580](https://github.com/nicasGit/MyRoom/actions/runs/44381718580) réussi avec contrôles Linux et publication ARM64. Image `ghcr.io/nicasgit/myroom:0.8.5` vérifiée : Linux ARM64, label 0.8.5, digest `sha256:6d2be56f64615f1362fc253c357f77293fc4006d7c2febf30d36611ee5170f6f`. Branche conservée ; aucun essai matériel annoncé.

### 18 novembre 2026 - mains 3D articulées plus naturelles, travail local

Branche `feat/realistic-hands` : modèles génériques gauche/droite WebXR Input Profiles intégrés sans modification des GLB, source épinglée au commit `c5356912d0c3bc43c6db8aa3926d8951a7716449`, licence MIT et provenance conservées dans le dossier des modèles. Environ 94 Ko par main, servis par MyRoom sans CDN à l'exécution. Matériau couleur peau, éclairage, doigts animés progressivement à la prise sur téléphone/contrôleur ; les 25 articulations WebXR réelles pilotent le maillage lorsque toutes les poses nécessaires sont disponibles. Retour aux primitives existantes pendant le chargement, en cas d'échec ou de suivi partiel. Pose simulée explicitement distincte du suivi réel. Aucun changement des commandes, baux ou règles serveur.

Ajout d'un aperçu 3D repliable avec bouton d'ouverture/fermeture. Typecheck, build et **95 tests** réussis, dont lecture des deux GLB, fermeture/réouverture des doigts, poses suivies, perte de suivi et libération des ressources. Requête de modèle locale HTTP 200 et présence du Canvas d'aperçu confirmées dans Chrome ; contrôle visuel complet non conclu dans l'onglet intégré inactif. Avertissement Vite de taille du bloc Three.js (574 kB après ajout du chargement GLTF et du maillage). Aucun essai matériel téléphone ou Quest. Modifications locales non publiées, version publiée toujours 0.8.4. Voir [la provenance des modèles](../client/public/models/hands/SOURCE.md).

### 18 novembre 2026 - publication 0.8.4 confirmée

Publication autorisée : accueil mural, mode pièces et correction tactile. Version add-on et diagnostic client portés à 0.8.4, changelog complété. Les derniers contrôles complets ont réussi : typecheck, build et 94 tests ; seuls version et documents sont adaptés depuis. Commit `e0bf037` sur main ; workflow [44377664201](https://github.com/nicasGit/MyRoom/actions/runs/44377664201) réussi avec contrôles Linux et publication ARM64. Image `ghcr.io/nicasgit/myroom:0.8.4` vérifiée : Linux ARM64, label 0.8.4, digest `sha256:971ad08704a9ad1a0f6e57cb93e0c4bc09893e36648a5f50c4ae53019ff16050`. Branche conservée ; aucun essai matériel annoncé.

### 18 novembre 2026 - accueil mural, mode pièces et correction de la main, travail local

Branche `feat/wall-lobby` : distinction des sources tactiles screen et des prises tracked-pointer pour éviter de désactiver la main virtuelle à cause d'un grip déclaré par le téléphone. Bouton présent avec indication du calibrage manquant. Après A/B, masquage de la croix/cible au sol et des grands panneaux permanents en jeu ; réactivation explicite dans le mode pièces. Menu 3D planaire fixe au mur du panneau existant : accueil, catalogue versionné, groupe de 1 à 4, noms via clavier 3D, confirmation physique du passage et commandes de relevé. Sélection Quest par rayon, téléphone par visée et bouton, aperçu Canvas PC/tactile. Modifications via routes administrateur existantes ; jeton en mémoire et autorisation préalable possible avant AR, sans exposer les journaux ou secrets. Mise à jour publique par WebSocket, relecture organisateur toutes les deux secondes. Relevé et import existants réutilisés dans un mode dédié ; aucune migration des pièces ou d'A/B.

Premier passage complet : typecheck, build et 94 tests réussis. Après ajout de l'aperçu PC, une relance a rencontré le refus Windows EPERM connu sur renommage atomique du test de bibliothèque ; Vérifications finales réussies : `npm run typecheck`, `npm run build`, `npm test` (**94 tests**) et `git diff --check`. Avertissement Vite habituel pour le bloc Three.js de 530 kB. Serveurs locaux relancés après constat d'une page ancienne 0.6.0 avec serveur arrêté ; nouvelle page chargée en 0.8.3 et rendu Canvas 1024×768 confirmé dans Chrome intégré. Aucun essai physique téléphone ou Quest effectué ; confort et précision AR restent à vérifier. Modifications locales non publiées. Voir [le guide](wall-lobby.md).

### 18 novembre 2026 - publication rapide 0.8.3 confirmée

Publication explicitement autorisée : main virtuelle téléphone, ouverture au premier bâton et nombre de joueurs de 1 à 4. Versions add-on et diagnostic client mises à jour, changelog complété. Les derniers contrôles complets de cette implémentation ont réussi : typecheck, build et 91 tests. Aucun changement fonctionnel depuis ces contrôles ; seuls version et documentation de publication sont adaptés. Commit `a9b1b8d` publié sur main ; workflow [44366811915](https://github.com/nicasGit/MyRoom/actions/runs/44366811915) réussi avec les trois contrôles et publication ARM64. Image `ghcr.io/nicasgit/myroom:0.8.3` vérifiée : Linux ARM64, label 0.8.3, digest `sha256:9b6f0f772bdc4addc435ea9a4393cac264dc8c90f5b1137f2902e516761e74b1`. Branche conservée. Aucun essai matériel annoncé.

### 18 novembre 2026 - nombre de joueurs administrable, travail local

Ajout de **Nombre de joueurs** (1 à 4) dans Team Portal. Configuration strictement validée côté serveur, sauvegardée avec les paramètres existants par pièce ; anciennes configurations conservées avec quatre joueurs par défaut. Le rituel utilise les premières places choisies et ne demande que leurs présences et passages ; les bâtons dispersés, compteurs et commandes de simulation suivent ce nombre. Les noms des quatre places restent disponibles. Connexions au-delà du nombre choisi refusées ; réduction refusée si une place supérieure est encore connectée. Réglage verrouillé pendant la partie. Aucun changement des règles des énigmes ni du calibrage A/B. Tests ajoutés pour les nombres invalides, les anciens paramètres, les parcours complets de un à quatre joueurs et le refus des connexions supplémentaires. Première exécution : un test a détecté une initialisation conservant quatre places au démarrage ; corrigée. Vérifications finales réussies : `npm run typecheck`, `npm run build`, `npm test` (**91 tests**) et `git diff --check`. Avertissement Vite habituel pour le bloc Three.js de 530 kB. Modifications locales non publiées ; version publiée 0.8.2. Aucun essai matériel effectué.

### 18 novembre 2026 - main virtuelle téléphone et ouverture au premier bâton, travail local

Branche `feat/phone-grab-vortex` : en AR avec DOM Overlay, après A/B et sans source Quest main/contrôleur, ajout d'une main droite virtuelle à 55 cm devant la caméra et d'un bouton à bascule Prendre / Relâcher. La main reprend le gant procédural existant, change de couleur pendant la prise et fournit des entrées au même ObjectGrabber que les mains Quest ; commandes, baux et validations serveur conservés. Masquage pendant un brouillon ou une perte de suivi ; bouton retiré à la fin de session. Une seule main simulée ne permet pas de soulever les gros objets à deux mains.

Le serveur ouvre désormais le vortex en cinq secondes dès la première attribution d'un bâton, sans attendre les trois autres prises. Les quatre présences calibrées et les quatre passages restent nécessaires au lancement de l'aventure ; aucun démarrage solo implicite. Texte d'accueil et guide adaptés. Typecheck, build et **90 tests** réussis, dont saisie/déplacement/dépôt par la main simulée et ouverture avec une seule prise sans lancement prématuré ; `git diff --check` réussi. Avertissement Vite habituel du bloc Three.js de 530 kB. Aucun essai physique téléphone ou Quest effectué. Modifications locales non publiées ; version publiée 0.8.2.

### 18 novembre 2026 - publication 0.8.2 confirmée

Publication autorisée par l'utilisateur. Version add-on et diagnostic client portés à 0.8.2, changelog complété pour les bâtons flottants. Typecheck et build relancés avec succès avant commit. Première relance des tests : 86/88, échec HTTP 400 d'une écriture de pièce et refus Windows EPERM sur renommage atomique dans le test de bibliothèque. Relance complète sans changement de code : 88/88 réussis, dont les parcours réseau. Commit `aad7f06` publié sur `main` ; workflow [44363141432](https://github.com/nicasGit/MyRoom/actions/runs/44363141432) réussi, vérifications Linux incluses. Manifeste `ghcr.io/nicasgit/myroom:0.8.2` vérifié : Linux ARM64, label 0.8.2, digest `sha256:bd153187091b712ef1911761377b9ea875a7b592a26b6cfb06f31d0caa27c4db`. Branche intermédiaire conservée. Aucun essai physique HAOS ou Quest effectué par l'agent.

### 18 novembre 2026 - bâtons flottants et dispersés, travail local

Sur la branche `feat/floating-staffs`, retrait du socle 3D de l'accueil Vortex. Les quatre bâtons nominatifs sont en suspension avec deux halos respirants et une oscillation visuelle de 2,5 cm, suspendue pendant leur manipulation. Le serveur calcule et diffuse quatre positions déterministes dans le relevé de pièce, espacées d'au moins un mètre, hors obstacles déclarés et couloir du vortex ; un manque de place refuse le démarrage. Ces positions initialisent aussi les poses manipulables existantes. Le repère historique `stand` reste lisible et sert aux informations flottantes ; libellés administrateur adaptés. Le calibrage A/B, les attributions, les baux, les énigmes et le déploiement HAOS restent conservés.

Vérifications exécutées avec succès : `npm run typecheck`, `npm run build`, `npm test` (**88 tests**, dont deux nouveaux tests de disposition et de refus sans activation) et `git diff --check`. Le scénario réseau à quatre joueurs reste passant. Avertissement Vite habituel pour le bloc Three.js de 530 kB. Aucun test visuel ou physique Quest effectué ; répartition et lisibilité à valider dans la pièce réelle. Calcul fondé sur le relevé déclaré, sans détection physique des obstacles. Changements locaux non publiés, version publiée toujours 0.8.1. Voir [Team Portal](team-portal.md).

### 18 novembre 2026 — publication 0.8.1 confirmée

Publication de l’accueil global autorisée explicitement par l’utilisateur. Version de l’add-on et diagnostic client portés à 0.8.1, changelog complété. Les 86 tests, le typecheck et le build ont réussi lors de la modification ; vérifications de publication relancées. Publication confirmée : commit `b2249b5` sur `main`, workflow [44356005856](https://github.com/nicasGit/MyRoom/actions/runs/44356005856) réussi. Typecheck, build et 86 tests relancés avant commit avec succès. Manifeste `ghcr.io/nicasgit/myroom:0.8.1` vérifié : Linux ARM64, label 0.8.1, digest `sha256:f9df923bf16ac71ee9a64d41ce489db09be813800bbacb1d66213c3b96271ee8`. Branche intermédiaire conservée. Cette vérification confirme la disponibilité du registre, pas une exécution physique HAOS ou Quest. Aucun essai physique annoncé.

### 18 novembre 2026 — accueil Vortex indépendant des aventures, travail local

Correction de l’interprétation après précision de l’utilisateur : le vortex est l’accueil global de MyRoom et la première scène affichée après A/B, pas une introduction à sélectionner dans Menthe 27. Activation par défaut pour chaque pièce ; quatre bâtons nominatifs et vortex visibles en attente avant le démarrage du rituel. Les panneaux et objets d’aventure restent masqués jusqu’à la fin de l’introduction, sauf accès de test explicite. La sélection d’aventure ne réinitialise plus le rituel ni ses réglages ; placement enregistré sous une clé globale par pièce, anciens enregistrements par aventure conservés et lisibles comme secours. Noms d’accueil préparés avant la session ; saisie impossible tant que le rituel n’est pas démarré. Réinitialiser une aventure remet l’accueil en attente. Les anciens tests de jeu direct désactivent explicitement l’introduction ; test ajouté pour l’indépendance du choix d’aventure et la transition. Aucune modification des règles du coffre/blackjack, du calibrage ou de l’image publiée. Vérifications finales réussies : `npm run typecheck`, `npm run build`, `npm test` (**86 tests**) et contrôle d’espacement Git. Avertissement Vite habituel de taille du bloc Three.js (530 kB). Modification locale non publiée ; aucun essai matériel annoncé.

### 18 novembre 2026 — accès direct à l’introduction Vortex, modification locale

À la demande de l’utilisateur, ajout de l’entrée « Introduction Vortex » en tête des accès directs de l’administration lorsque l’aventure possède une introduction ou que Team Portal est activé. Son bouton lance le rituel réel via la commande protégée existante, sans imposer le mode test PC. Placement activé et confirmation de l’espace physique nécessaires ; lancement bloqué si introduction ou aventure déjà active. Les accès directs aux énigmes conservent l’exigence du mode test. Le bouton principal indique désormais « Commencer avec l’intro Vortex » lorsque Team Portal est activé. Aucune modification des règles, des quatre passages, du calibrage ou du serveur. Vérifications finales réussies : `npm run typecheck`, `npm run build`, `npm test` (**85 tests**) et contrôle d’espacement Git. Avertissement Vite habituel pour le bloc Three.js de 530 kB. Changement local non publié et aucun essai physique annoncé.

### 18 novembre 2026 — Team Portal corrigé et publié en 0.8.0

Vérifications complètes après correction et préparation de version : `npm run typecheck`, `npm run build`, `npm test` réussis, **85 tests**, dont huit dédiés au portail. Scénario réseau complet réussi : quatre prises nominatives, rejet d’une autre place, attribution conservée au relâchement, reconnexion avec justificatif privé, quatre passages géométriques, départ unique du coffre, commandes administrateur protégées et simulation autorisée seulement en mode test. Avertissement Vite habituel du bloc Three.js (530 kB). La demande ultérieure d’un univers différent après passage et d’une vue des autres participants à travers le portail a été explicitée comme évolution future : ni décor immersif secondaire, ni avatars synchronisés, ni fenêtre entre deux univers dans cette livraison. Publication 0.8.0 confirmée : commit `0e1d8f7` sur `main` (correctif `a144928`), workflow [44350986587](https://github.com/nicasGit/MyRoom/actions/runs/44350986587) réussi, dont validation Linux complète. Manifeste `ghcr.io/nicasgit/myroom:0.8.0` vérifié après publication : Linux ARM64, label 0.8.0, digest `sha256:23e570cf516ca2437d3f6db12c446af52112b6192c35f1239566babcdb6b78b3`. Image disponible ; aucune exécution physique HAOS ou Quest effectuée par l’agent. Branche intermédiaire conservée, aucune suppression sans confirmation. Guides et formatage Markdown actualisés dans cette livraison.

L’utilisateur demande la publication pour essais après l’arrêt documenté ci-dessous. Blocage diagnostiqué : le détecteur ne recevait sa première pose qu’après ouverture ; un joueur commençant immédiatement à avancer pouvait déjà se trouver à moins des 30 cm nécessaires à l’armement. À l’ouverture, initialisation avec la dernière pose validée et récente (1,2 seconde maximum), sans assouplir le sens, la fenêtre utile, la cohérence du mouvement ou l’hystérésis. Test de régression ajouté ; les huit tests ciblés (sept unitaires et le scénario réseau à quatre connexions) réussissent, notamment prises, reconnexion, quatre traversées et démarrage unique du coffre. Version add-on et diagnostic client préparés en 0.8.0. Vérifications complètes et publication en cours ; aucun essai physique Quest annoncé.

### 18 novembre 2026 — Team Portal, développement sur branche dédiée

Arrêt conformément au workflow demandé après vérifications : commit local `7714031` sur `feature/team-portal`, `npm run typecheck` et `npm run build` réussis ; `npm test` donne **83 réussites / 84 tests**. Les six tests unitaires Team Portal réussissent, ainsi que les anciens tests de coffre, blackjack, pièces et saisie. Le nouveau test réseau à quatre connexions atteint l’attente d’une traversée mais dépasse son délai de validation (`portal-network.test.ts`, ligne 32). Le scénario complet réseau n’est donc pas validé ; aucune fusion dans `main`, aucun push de cette fonctionnalité et aucune publication HAOS. Aucun test matériel Quest effectué. Le défaut doit être diagnostiqué et corrigé avant reprise des vérifications et publication. Avertissement Vite habituel du bloc Three.js à 530 kB. Les données temporaires des tests ont été nettoyées par les tests.

Lecture du cahier des charges joint et des documents demandés ; dépôt propre, synchronisation avec `origin/main`, branche `feature/team-portal`. Ajout d’une introduction de session dédiée, distincte des énigmes : contrats stricts, états serveur, attributions par place, détecteur de traversée avec hystérésis, réutilisation de la saisie existante et lancement unique de l’AdventureEngine. Menthe 27 0.3.0 ajoute le rituel et conserve exactement les étapes de 0.2.0 ; versions historiques et pièces conservées. Placements indépendants sur disque, jetons privés de reprise de place dans le sous-protocole WSS, réservations pendant l’introduction. Aucun secret dans l’URL ou le journal applicatif. Administration protégée, confirmation physique, noms/couleurs/dimensions, simulation PC explicitement identifiée, passage accessible, reset/skip et remplacement de place. Rendu socle/cristaux/noms/vortex/faisceaux, effets individuels et audio conditionnel. Les poses de tête sont transitoires et ne sont pas conservées en journal/disque. Tests et vérifications finales en cours ; aucune publication ni validation physique Quest annoncée. Voir [le guide](team-portal.md).

### 18 novembre 2026 — mains visibles, publication 0.7.2

À la demande de l’utilisateur, ajout de mains articulées procédurales Three.js, sans modèle distant : articulations et segments des doigts pilotés par les poses WebXR disponibles, masquage immédiat en cas de perte de suivi. Rendu visible avant le calibrage A/B ; les interactions conservent leurs conditions existantes. Couleurs gauche/droite et jaune pendant une prise détectée. Gants simplifiés pour les contrôleurs, orientés par `gripSpace`, sans simulation de suivi des doigts. Géométries et matériaux libérés à la sortie de session. Rendu propre à chaque client, sans synchronisation des squelettes ni changement serveur ou HAOS. Source primaire consultée : [WebXR Hand Input](https://www.w3.org/TR/webxr-hand-input-1/). Deux tests synthétiques ajoutés pour suivi/perte/retrait et repli contrôleur. Vérifications finales : `npm run typecheck`, `npm run build` et `npm test` réussis, **77 tests**, contrôle d’espacement Git réussi. Avertissement Vite habituel pour le bloc Three.js de 526 kB. Aucun essai physique de cet ajout effectué. Pour la préparation 0.7.2, typecheck et build relancés avec succès ; quatre exécutions Windows donnent 76/77 tests, seul l’ancien test des vingt pièces échouant sur EPERM au renommage atomique, y compris avec un dossier temporaire dans le dépôt. Les 77 tests avaient réussi avant le changement de version. La validation Linux doit réussir avant publication de l’image. Publication 0.7.2 autorisée et confirmée : commit `7d0d50c` sur `main`, workflow [44343134319](https://github.com/nicasGit/MyRoom/actions/runs/44343134319) réussi, dont validation Linux complète avec les 77 tests. Manifeste `ghcr.io/nicasgit/myroom:0.7.2` vérifié après publication : Linux ARM64, label 0.7.2, digest `sha256:00bba3a0fd8f9ba27f7ea28d8d39aaf1e675ee9c6575627e480f30d161c055bf`. Cela confirme la disponibilité de l’image, pas une exécution physique HAOS ou Quest.

### 18 novembre 2026 — correctif 0.7.1 de lisibilité et de prise après retour Quest

L’utilisateur rapporte un essai physique sur Quest : informations trop hautes et impossibilité de prendre les objets. Ce retour ne valide pas les interactions. Sur la branche `fix/quest-panel-grabbing`, remplacement du Sprite suivant la tête par un panneau plan fixé dans l’espace de session, à 1,6 m devant la première pose suivie, avec hauteur de lecture bornée entre 0,9 et 1,5 m ; replacé au recalibrage. Les informations restent visibles pendant une prise. Points de suivi cyan/jaunes et compteur de mains/poignées suivies et fermées pour diagnostiquer les entrées disponibles. La prise accepte désormais une pince/poignée fermée avant l’approche, au lieu d’exiger un nouvel appui près de l’objet. Aide explicite pour les deux mains et objets déjà tenus ; un refus n’entraîne pas de rafale de nouvelles demandes sans relâchement. Aucun changement serveur, de calibrage A/B, de sécurité ; version de l’add-on et diagnostic client portés à 0.7.1. Tests de régression ajoutés pour la stabilité du panneau et l’approche avec prises maintenues. Vérifications finales : `npm run typecheck`, `npm run build` et `npm test` réussis, **75 tests**. Première exécution : comparaison du callback interne Three.js dans le nouveau test corrigée pour comparer les composantes du quaternion ; ancien test de stockage affecté par le refus Windows intermittent EPERM, relance complète réussie. Avertissement Vite de taille du bloc Three.js (526 kB). Aucun essai physique effectué par l’agent ; publication 0.7.1 autorisée et confirmée : commit `82533d1` sur `main`, workflow [44340992295](https://github.com/nicasGit/MyRoom/actions/runs/44340992295) réussi. Typecheck, build et 75 tests relancés avec succès avant commit. Manifeste `ghcr.io/nicasgit/myroom:0.7.1` vérifié après publication : Linux ARM64, label 0.7.1, digest `sha256:4c87a87c2a2d49c37ced7323f2e8c631dc630b640560b2d97f5b5d4c89bc6f0d`. Cela confirme la disponibilité de l’image, sans valider son exécution physique HAOS ou Quest.

### 18 novembre 2026 — prises Quest et indice sous le coffre, publication 0.7.0

Branche `feat/quest-two-hand-grabbing`, base publiée 0.6.0. Lecture des consignes, architecture et récapitulatif avant modification. L’utilisateur a confirmé le déplacement pendant la partie et demandé un indice sous le coffre. Prise par pince des mains suivies (capacité optionnelle) ou poignées des contrôleurs, une main pour les petits objets et deux mains distinctes pour coffre/table/panneau. Relâcher pose ; perte de suivi annule. Les cartes hybrides réutilisent leurs réservations et logements, avec aperçu porté localement. Murs et obstacles physiques ne sont pas des objets de jeu déplaçables.

Gestionnaire serveur distinct des énigmes : positions temporaires partagées, propriétaire, bail, séquences, bornes/vitesse, annulation à l’expiration/déconnexion. Un déplacement ne réinitialise ni la progression ni A/B ; la proximité des énigmes suit les positions courantes. Sauvegarde administrateur seulement après arrêt et relâchement, contrôlée par deux révisions ; extension facultative `puzzles.poses` pour hauteur/rotation, anciens modèles lisibles. Panneau maintenu sur mur libre et objets au-dessus des tables possibles. Indice sous le coffre : apparition après levée de 25 cm ou déplacement horizontal de 45 cm. Sources primaires WebXR consultées ; aucune capacité native supposée garantie sur un modèle de casque.

Vérifications finales : `npm run typecheck`, `npm run build` et `npm test` réussis, **73 tests**, dont dix nouveaux tests de prise, géométrie, entrées et transport. Couverture : une/deux mains, rotation rigide, pince avec hystérésis, poignées de contrôleur, schéma strict, prises concurrentes, propriétaire/séquence, limites, expiration/déconnexion, conservation de progression pendant le déplacement, sauvegarde protégée et recharge disque, dépôt magnétique d’une carte et révélation de l’indice. Une erreur de compte de champs du nouveau parseur a été corrigée après le premier test réseau. Premier passage avec le `EPERM` Windows déjà observé dans un ancien test de renommage atomique ; relance réussie. Vérification d’espacement Git réussie ; avertissement Vite habituel du bloc Three.js à 524 kB. Aucun essai physique Quest/téléphone/HAOS ni simulation de session XR matérielle, publication confirmée ci-dessous. Détails et limites dans [le guide de prise](quest-grabbing.md).

Publication 0.7.0 autorisée et confirmée le 18 novembre 2026 : commit `15228cb` sur `main`, workflow [44284989466](https://github.com/nicasGit/MyRoom/actions/runs/44284989466) réussi (validation Linux et publication). Contrôles locaux relancés avant commit : typecheck, build et 73 tests réussis. Manifeste `ghcr.io/nicasgit/myroom:0.7.0` vérifié après publication : Linux ARM64, label 0.7.0, digest `sha256:d4368412b54dd352b4c70240151b8add32c01be913d57d72a91231559594e78c`. Disponibilité du registre confirmée ; aucune exécution physique HAOS, Raspberry Pi ou Quest vérifiée.

### 18 novembre 2026 — Phase 2 publiée en 0.6.0 depuis la branche dédiée

Branche `feat/menthe27-blackjack-hybrid`, à partir de `b7617d4`. Lecture préalable des cinq documents demandés. Module indépendant `blackjack-hybrid` enregistré avec source aléatoire cryptographique injectée au point de composition serveur, sans dépendance Three.js/WebSocket dans les règles. Trois manches, paquet privé, projection masquée, capitaine issu des connexions, réservations de cartes de 15 secondes et dépôts dans trois logements. Contexte d’action fourni par le serveur, commandes et révisions validées. Récompenses intermédiaires via un contrat générique `earnedRewards`, maintenance des verrous et indices administrateur ; `symbol-chest` et `blackjack-legacy` restent inchangés.

Menthe 27 `0.2.0` remplace le casino prévu par une instance jouable puis attend le Vidéoclub rétro, sans victoire finale. La version `0.1.0` est conservée au catalogue pour la compatibilité des instantanés. Les neuf points existants sont inchangés, seule la position `table` est réutilisée. État de jeu séparé des placements. Aucun changement de calibrage A/B, de schéma de pièce ou de stockage existant.

Contrôles finaux locaux : `npm run typecheck`, `npm run build` et `npm test` réussis, **63 tests**, dont onze tests de règles/intégration hybrides et un test réseau supplémentaire avec quatre connexions. Couverture : blackjack naturel, 17 souple, égalités, trois échecs/rattrapage, deux solutions du double as, choix erronés/correction, états privés, locks/expiration, capitaine, gains partiels/restauration, partie normale jusqu’à l’attente et état final restaurable. Le test réseau couvre refus hors capitaine, réattribution, actions simultanées, libération après déconnexion, indices/reset protégés, trois manches/récompenses et reconnexion dans l’attente finale. Un contrôle de réinitialisation du blackjack historique après sa réussite conserve désormais un état restaurable et rejouable, sans toucher à ses règles. Avertissement Vite habituel pour le bloc Three.js de 524 kB ; vérification d’espacement Git réussie.

Dans Chrome local : parcours des trois manches jusqu’au Vidéoclub en attente, commandes DOM par clics synthétiques (onglet partagé masqué), réservation d’une carte via projection d’un clic sur l’aperçu 3D, et capture Canvas du rendu Three.js inspectée. Inscriptions agrandies et boutons remontés pour dégager les logements. Canvas d’aperçu présent et vue du croupier masquée pendant la main. Pièce temporaire supprimée après essai ; aventure classique et simulation désactivée rétablies. Ces simulations ne constituent pas des essais WebXR physiques. Progression, paquet et noms restent en mémoire ; la persistance disque appartient toujours à la Phase 3. Aucun essai physique Quest/téléphone/HAOS.

Version de l’add-on et diagnostic client portés à 0.6.0, changelog, architecture, README et guides actualisés. Le [guide hybride](adventures/blackjack-hybrid.md) décrit le fonctionnement et les limites. Publication sur `main` autorisée explicitement et confirmée : commit `ba58026` issu de la branche dédiée, workflow [44272739627](https://github.com/nicasGit/MyRoom/actions/runs/44272739627) réussi (validation Linux et publication). Après le workflow, manifeste `ghcr.io/nicasgit/myroom:0.6.0` vérifié pour Linux ARM64, label de version 0.6.0 ; digest `sha256:175bf5b410f1cdc15a4af3228e843a9fd999be3f29902e77eec29c7acf5d56dd`. Cela confirme la disponibilité de l’image, pas son exécution sur HAOS, Raspberry Pi ou Quest.

Publication préalable 0.5.1 confirmée : commit `b7617d4`, workflow [44268181791](https://github.com/nicasGit/MyRoom/actions/runs/44268181791) réussi, manifeste Linux ARM64 `ghcr.io/nicasgit/myroom:0.5.1` vérifié après exécution, digest `sha256:fd9337f28208b5b6781e94640a27fbad4e11ee5b681530bab3493c1ac9eaf19b`. Les 51 tests, le typecheck et la compilation avaient réussi avant son push. La première commande globale commit/push avait été refusée par la revue automatique ; les douze fichiers ont été sélectionnés et inspectés explicitement, puis l’autorisation manuelle a confirmé la publication sur main.

### 18 novembre 2026 — accès direct aux énigmes en mode test, préparation 0.5.1

Publication 0.5.1 demandée par l’utilisateur avant la Phase 2. Version et changelog préparés ; disponibilité du registre à vérifier après le workflow. Utilisation de la compétence commit pour enregistrer ces changements sans modification des règles du coffre et du blackjack historique.

- Administration : sélecteur « Accès direct aux énigmes », activé par la case existante « Autoriser la simulation PC ». Le bouton « Tester cette énigme » démarre immédiatement l’énigme choisie pour tous les joueurs, sans résoudre les précédentes. Les étapes prévues mais non implémentées sont désactivées ; Menthe 27 ne donne toujours pas accès au blackjack hybride.
- Commande protégée `POST /api/admin/adventure/test-step` : jeton, origine, JSON strict, étape disponible, placements configurés, mode test et révision courante requis. Refus explicites et journal `adventure_test_step`, sans modification des pièces ou du calibrage A/B.
- Session temporaire identifiée par `testStartStepId`, état initial de l’énigme ciblée, inventaire indépendant et états diffusés aux joueurs. Le premier accès garde une copie en mémoire de la partie normale ; les accès suivants réinitialisent uniquement la session de test. Désactiver le mode test restaure cette copie et abandonne les récompenses de test. Un changement de pièce ou une réinitialisation abandonne également la copie ; elle ne survit pas à un redémarrage serveur. Changer d’aventure pendant un accès direct est refusé jusqu’à la sortie du mode test.
- Contrat de restauration validant le point de départ temporaire, les étapes ignorées et l’inventaire, sans assouplir la restauration des sessions normales. Bandeau de test dans les commandes joueur et statut explicite dans l’administration.

Vérifications : `npm run typecheck`, `npm run build` et `npm test` réussis avec **51 tests**. Deux nouveaux tests couvrent accès direct, états isolés, fin et restauration JSON de test, étapes indisponibles, commandes périmées et retour à la progression normale. Test réseau étendu : authentification/origine, champs inconnus, révision périmée, refus sans mode test, diffusion aux quatre joueurs et restauration de la partie précédente. Dans Chrome local, connexion admin puis activation du mode, choix du blackjack historique, démarrage direct et retour au coffre en préparation à la désactivation vérifiés par les commandes de l’interface. Aucun essai physique téléphone/Quest/HAOS. Avertissement Vite habituel sur le bloc Three.js supérieur à 500 kB. Aucune publication d’image ou modification de version dans cette tranche.

### 18 novembre 2026 — préparation de la publication 0.5.0

Publication confirmée : commit `ffe92e5` intégré sur `main` après autorisation explicite, workflow [44262750589](https://github.com/nicasGit/MyRoom/actions/runs/44262750589) terminé avec succès. Manifeste `ghcr.io/nicasgit/myroom:0.5.0` vérifié après le workflow : Linux ARM64 et label de version 0.5.0 ; digest `sha256:f77c8f24e0cdf3af4f6955355413353e9ea9f03ea9f936a2446ae8a30fef7507`. La disponibilité du registre ne constitue pas un essai sur HAOS, Raspberry Pi, téléphone ou Quest. La revue automatique avait bloqué le premier push sur `main` ; une autorisation manuelle explicite a ensuite permis cette intégration et publication.

Publication demandée explicitement après le commit `1b530bc` et son push sur `feat/modular-adventures-phase1`. Préparation de l’intégration sur `main`, version de l’add-on portée à 0.5.0 et changelog actualisé. Le workflow existant conserve Linux ARM64, HTTPS/WSS et les contrôles logiciels avant publication. Les pièces existantes ne sont pas migrées ni supprimées. Phase 2 toujours non commencée ; noms et progression en mémoire uniquement.

Contrôles locaux de cette version : `npm run typecheck` et `npm run build` réussis ; `npm test` réussit avec 49 tests après relance. Le premier passage a rencontré un `EPERM` Windows sur le renommage atomique du fichier temporaire du test de bibliothèque ; la relance sans modification du code passe. Avertissement Vite habituel pour le bloc Three.js supérieur à 500 kB. Le workflow a également réussi ses trois commandes de validation sous Linux avant la construction et publication ARM64.

### 18 novembre 2026 — architecture modulaire, Phase 1 locale

Branche locale `feat/modular-adventures-phase1`, à partir du commit publié `c893269`. Aucune modification de la version HAOS 0.4.2, aucun push, aucune publication ni essai matériel. Phase 2 non commencée, conformément à la demande utilisateur.

- Lecture des consignes, de l’architecture et du présent récapitulatif avant modification. Présentation préalable de la cartographie, des contrats TypeScript, de la compatibilité, des fichiers et des risques ; détail durable dans [l’analyse Phase 1](adventures/phase1-architecture.md).
- Contrats purs `PuzzleModule`, instances, objets, rôles, transformations futures, récompenses, manifestes et instantanés versionnés ; registre avec validation des configurations, états et actions.
- Projection publique propre à chaque module, séparée de son état privé et de sa configuration ; test d’un module masqué pour préparer les futurs jeux à information cachée sans les implémenter.
- Coffre encapsulé dans `symbol-chest`, blackjack actuel conservé dans `blackjack-legacy`. `adventure.ts` reste l’entrée publique et réexporte une façade de compatibilité séparant proximité/transport des règles. Anciennes commandes, neuf points, panneau mural, rendu détaillé et calibrage A/B conservés.
- Moteur linéaire : instances indépendantes, révisions, transitions, inventaire dédupliqué et événements. Contrat pur de restauration JSON validant références, état des modules, réussite, étapes futures et inventaire, avant mutation. Aucune sauvegarde automatique de session ou API de restauration disque ajoutée.
- Catalogue de manifestes validés : démonstration classique et `menthe27@0.1.0`, plus chargement optionnel de JSON externes sans changement de code moteur. Menthe 27 expose le coffre puis une étape `planned` ; aucun module `blackjack-hybrid`, aucun faux succès final ni récompense ♣/♥/♠.
- Choix/arrêt de l’aventure dans l’administration ; saisie des quatre noms par place, suggestions Léon/Reno/Fabien/Nicolas, validation et révision côté serveur, diffusion aux clients. Noms, choix d’aventure et progression restent en mémoire ; le nom d’une place subsiste lors d’une déconnexion, sans devenir un compte joueur.
- Nouvelle commande WebSocket `puzzle_action` avec ID d’instance, en complément de `adventure_action`. Adaptations limitées du client pour les noms, l’état générique et l’attente explicite d’une étape future. Les fichiers de modèle/stockage des pièces et de calibrage ne sont pas modifiés.

Vérifications finales : `npm run typecheck`, `npm run build` et `npm test` réussis, avec 49 tests (les 39 existants et dix nouveaux). Un test de restauration a été corrigé pour ne pas tenter de redécouvrir une balise déjà acquise. Tests de modules sans Three.js/WebSocket, instances multiples, commandes périmées, récompenses, aller-retour JSON/corruption, ancienne bibliothèque non réécrite et catalogue externe. Le test réseau contrôle les noms aux quatre clients, sélection protégée, commandes génériques par instance, déconnexion sans perte des découvertes et attente après le coffre. Avertissement Vite conservé pour le bloc Three.js supérieur à 500 kB ; `git diff --check` sans erreur d’espacement.

Dans Chrome local : sélection de Menthe 27, enregistrement des quatre noms suggérés, nom Léon dans la vue joueur, coffre résolu en simulation avec une erreur récupérable puis attente sans victoire finale. Aucun test physique téléphone, Quest ou HAOS. Les limites du rendu historique, des noms par place, de la restauration en mémoire et des phases différées sont décrites dans les nouveaux guides. La pièce temporaire créée pour cet essai a été supprimée ; aventure classique, noms par défaut et simulation désactivée rétablis après vérification.

### Ajout du 17 novembre 2026 — coffre détaillé et panneau mural, 0.4.2

Publication confirmée le 17 novembre : commit `d97580c`, workflow GitHub Actions `44151206525` terminé avec succès et manifeste de l’image ARM64 0.4.2 vérifié dans GHCR après ce workflow. La disponibilité dans le registre ne constitue pas une validation d’exécution sur Raspberry Pi, téléphone ou casque.

Contrôles 3D complémentaires dans Chrome : rayon synthétique sur une tuile du panneau correctement résolu en action `press_symbol` ; ouverture du couvercle convergeant vers −1,5 radian après 120 images simulées et serrure invisible après réussite. Pièce temporaire supprimée et simulation serveur désactivée à la fin des essais. Ces contrôles logiciels ne constituent pas un essai WebXR sur casque.

- Coffre Three.js avec corps creux, planches et texture de veinage générée en Canvas, couvercle bombé articulé, sangles métalliques, rivets, poignées et serrure retirée à la réussite. Matériaux bois/métal avec éclairage local ; conservation de l’angle du couvercle lors des mises à jour de partie pour éviter de répéter l’ouverture.
- Combinaison déplacée sur un panneau mural : quatre tuiles illustrées et quatre logements montrant les choix partagés. Saisie par boutons tactiles ou sélection du panneau 3D à la gâchette ; il faut désormais approcher le panneau pour entrer les symboles.
- Panneau de 1 × 0,8 m à hauteur centrale fixe de 1,35 m, orienté vers l’intérieur ; validation du mur, des marges aux coins, des ouvertures et obstacles. Proposition automatique pour les anciennes pièces, sans déplacement de leurs neuf points. Position mur/décalage persistée à la sauvegarde.
- Sélection et déplacement du panneau sur le plan administrateur et au viseur tactile pendant la préparation. Départ bloqué si aucun mur libre ; aucune prise libre de tuiles ajoutée.

Vérifications : typecheck, compilation et 39 tests réussis. Trois nouveaux tests couvrent migration/stockage du panneau, placement et exclusions géométriques, et refus de saisir les symboles depuis le coffre ; test réseau étendu pour accepter un panneau valide et refuser un placement mural invalide. Dans Chrome local, rendu du coffre fermé et du panneau inspecté ; panneau déplacé sur un autre mur depuis l’administration et sauvegardé ; parcours en simulation avec erreur de combinaison, puis ordre correct débloquant le blackjack. Aucun essai physique sur téléphone ou Quest, pas de détection automatique des murs réels ni de restitution de leur éclairage. Guide, architecture et changelog actualisés.

### Ajout du 17 novembre 2026 — préparation et placements, 0.4.1

Publication confirmée : commit `181ed20`, workflow GitHub Actions `44138561838` réussi et manifeste ARM64 0.4.1 disponible dans GHCR après ce workflow. Vérification logicielle supplémentaire : cent variantes d’une pièce 4 × 3 m avec obstacle central ont toutes produit un placement validé. Cela ne valide pas les passages physiques ni l’exécution sur HAOS.

- Nouvelle proposition aléatoire ordonnée : centre libre pour le coffre, table proche et sept autres éléments dans des secteurs angulaires avec rotation et rayon variables. Coordonnées validées contre le contour, les obstacles et l’espacement minimal ; repli vers les positions libres lorsque le centre des limites est indisponible.
- Déplacement des repères par glissement souris/tactile dans le plan admin. Modifications non sauvegardées empêchant le départ local.
- Phase de préparation et bouton **Commencer les énigmes** ; actions de jeu refusées avant le départ. Réinitialisation et modification du modèle actif retournent en préparation.
- En AR tactile, choix d’un élément et placement au viseur après A/B, avec jeton admin en mémoire uniquement. Endpoint spécifique protégé : préparation requise, révisions de jeu et bibliothèque contrôlées, géométrie de la pièce conservée. Positions enregistrées et diffusées aux joueurs ; déplacement refusé après départ.
- En préparation, tous les éléments 3D sont visibles avec leur identité pour faciliter le placement. Aucun système de prise libre aux contrôleurs ajouté ; sur casque sans panneau tactile, préparation depuis le plan admin d’un autre appareil.

Vérifications : typecheck et compilation réussis, 36 tests réussis après correction d’un placement de test dirigé dans un obstacle. Deux nouveaux tests couvrent préparation/départ et vingt variantes de répartition valides avec principaux centraux ; le test réseau couvre placement autorisé, jeton absent, révision périmée et refus après départ. Dans Chrome : glissement réel à la souris d’un repère et sauvegarde, blocage du départ avec modifications non sauvegardées, départ admin ; contrôleur tactile testé avec calibrage et visée synthétiques, sauvegarde effective et champ de jeton vidé. Pièce temporaire supprimée après les vérifications. Aucun essai physique AR sur téléphone ou Quest effectué par l’agent. Guide des énigmes et changelog actualisés.

### Ajout du 17 novembre 2026 — deux énigmes, version 0.4.0

- Coffre des quatre symboles : quatre découvertes partagées, combinaison Soleil → Arbre → Lune → Étoile, erreur récupérable et ouverture animée.
- Blackjack débloqué après le coffre : As + 6, découverte des cartes 4/8/Roi, un choix par essai, As souple, explication des erreurs et récompense clé virtuelle/chiffre 7. Aucun pari.
- Placement de neuf éléments dans l’administration, proposition géométrique, ajustement sur plan ou coordonnées et enregistrement indépendant dans chaque pièce. Anciennes pièces compatibles sans configuration d’énigmes.
- Objets Three.js, textes et rayons de visée, interaction à la gâchette et boutons tactiles. Affichage et proximité liés au calibrage A/B ; jeu suspendu pendant le relevé.
- Serveur autoritaire : validation stricte des actions, cibles, révisions, phase, découvertes et proximité déclarée. Actions et commandes admin journalisées sans réintroduire `tracking_changed`.
- Simulation solo PC autorisée explicitement par l’administrateur ; progression commune jusqu’à quatre joueurs, remise à zéro admin. Placements persistés, partie et autorisation de simulation en mémoire uniquement.
- Guide : [les deux premières énigmes](first-puzzles.md).

Vérifications exécutées : typecheck et compilation réussis ; 34 tests réussis, dont sept nouveaux tests sur règles, validation, stockage et sélection 3D des panneaux Sprite avec caméra explicite ; extension du test HTTP/WebSocket vérifiant la diffusion aux quatre joueurs, les révisions et les protections admin. Dans Chrome local : proposition et sauvegarde des placements depuis l’administration, parcours complet en simulation avec erreur de combinaison, cartes 8 et Roi incorrectes puis 4 gagnant, construction/libération de la scène 3D finale. Pièce temporaire supprimée et simulation serveur désactivée après le test.

Limites : aucun essai physique téléphone/Quest par l’agent ; pas de preuve de position physique, d’ancre partagée, d’occultation du mobilier réel ou de vérification automatique des passages. La proposition des positions doit être vérifiée dans la pièce. L’audio dépend de son autorisation par le navigateur. Avertissement Vite conservé pour le bloc Three.js supérieur à 500 kB.

Publication 0.4.0 confirmée le 17 novembre : fonctionnalités du commit `59f40b0`, correction de sélection 3D `a76ff4e`, workflow GitHub Actions `44133245925` réussi et manifeste ARM64 0.4.0 vérifié dans GHCR après ce workflow. Cette vérification confirme la disponibilité de l’image, pas son exécution sur HAOS ou un appareil physique. Le lien de récapitulatif du README a également été actualisé.

Ce récapitulatif doit être actualisé à chaque modification du projet, dans le même ensemble de changements. Cette règle est inscrite dans les [consignes du dépôt](../AGENTS.md) et couvre aussi la configuration, le déploiement et la documentation. Les vérifications rapportées doivent correspondre à celles effectivement exécutées ; une version ou publication ne doit pas être annoncée avant confirmation.

- Création du squelette et des dossiers [client](../client/), [server](../server/), [haos-addon](../haos-addon/) et [docs](./).
- Création des consignes [AGENTS.md](../AGENTS.md), de l’[architecture](../ARCHITECTURE.md), du [README](../README.md) et du [.gitignore](../.gitignore).
- Client TypeScript, Three.js et WebXR, construit avec Vite.
- Serveur Node.js, TypeScript et WebSocket avec la bibliothèque `ws`.
- Configuration npm avec scripts de développement, vérification TypeScript, compilation et tests.
- Add-on Home Assistant OS ciblant **aarch64 / Raspberry Pi 5**.
- Nginx sert le client et relaie les WebSocket et API ; HTTPS est terminé par un proxy externe avec certificat reconnu par les appareils.
- Port interne Node.js non exposé directement en production. Pas d’Ingress Home Assistant dans ce prototype.
- Aucun secret ou certificat privé ajouté au dépôt.

Le projet cible Quest 2, Quest 3 et Quest 3S, en détectant les capacités disponibles à l’exécution. Le modèle déclaré par le navigateur ne sert pas à garantir une fonctionnalité.

## 2. GitHub, images et installation HAOS

- Dépôt utilisable comme dépôt d’add-ons Home Assistant : [nicasGit/MyRoom](https://github.com/nicasGit/MyRoom).
- Workflow GitHub Actions : installation des dépendances, typecheck, compilation, tests, construction et publication de l’image Linux ARM64 sur GHCR.
- Images versionnées sous `ghcr.io/nicasgit/myroom`, avec le tag de version et `latest`.
- Bouton **Ouvrir l’interface Web** sur la page de l’add-on, vers le port LAN configuré.
- Documentation du déploiement local, de l’origine publique HTTPS et du proxy WebSocket.
- Après le signalement de l’erreur `manifest unknown` sur 0.1.6, disponibilité du manifeste ARM64 vérifiée avant d’annoncer les mises à jour suivantes 0.2.0 à 0.3.0.

La publication **0.3.0** a terminé avec succès dans GitHub Actions et son manifeste ARM64 a été vérifié. Cela confirme la présence de l’image dans le registre, pas son exécution physique sur Raspberry Pi.

Voir [le déploiement](deployment.md) et [le guide de l’add-on](../haos-addon/DOCS.md).

## 3. Diagnostic WebXR et multijoueur

- Page de diagnostic : contexte sécurisé, présence de l’API WebXR, version du client et disponibilité de `immersive-ar`.
- Démarrage d’une session AR avec référentiel `local-floor`.
- Affichage des **quatre places joueurs**, avec indication de sa propre connexion.
- Attribution des places par le serveur, refus du cinquième joueur et réutilisation des places libérées.
- Reconnexion WebSocket automatique après une coupure ordinaire ; les déconnexions administratives ne relancent pas automatiquement le joueur.
- Contrôle de l’origine, limite de taille des messages, limitation de fréquence et heartbeat.
- Énigme de démonstration : état autoritaire côté serveur, résolution partagée, contrôle de révision et réinitialisation administrative.

Un seul joueur peut tester le prototype : il n’est pas nécessaire d’occuper les quatre places. Plusieurs onglets peuvent servir à vérifier la synchronisation sur ordinateur. Les poses des joueurs ne sont pas encore diffusées et il n’y a pas de jeu d’énigmes complet.

## 4. Calibrage spatial A/B

- Deux repères physiques communs **A puis B**, placés au sol à au moins **50 cm** l’un de l’autre.
- A définit l’origine ; A → B définit l’axe horizontal +X ; dimensions en mètres.
- Placement au contrôleur par la gâchette et, sur téléphone compatible, au bouton tactile avec le rayon central.
- Deux marqueurs distincts, messages de progression et possibilité de recommencer.
- Le rayon est projeté sur le plan du sol local `y = 0` ; il ne s’agit pas d’un hit-test de surface réelle.
- Recentrage, fin de session et changement de pièce active invalident le calibrage.

Tous les appareils doivent retrouver les mêmes repères, dans le même ordre. Ce mécanisme **n’est pas une ancre spatiale partagée** et ne reconnaît pas automatiquement les repères lors d’une nouvelle session.

## 5. Commandes tactiles et corrections du placement

Correction 0.3.1 (`8c240bc`) : après B, le bouton de placement reste dans la barre, désactivé et libellé « Calibrage terminé ». Une largeur minimale réserve aussi la place de ce libellé. Auparavant, il disparaissait dans la boucle XR : la barre pouvait alors se réorganiser pendant l’appui tactile et déplacer « Quitter l’AR » sous le doigt. Cette cause possible de la sortie signalée après les deux repères doit encore être confirmée sur l’appareil de l’utilisateur. Le correctif évite ce changement de disposition ; il ne prétend pas résoudre une fermeture système du navigateur ou du casque.

Vérifications du 17 novembre : typecheck et compilation réussis, 26 tests réussis. Dans Chrome, passage simulé « Placer B » → « Calibrage terminé » : position de Quitter inchangée sur 320×568, 390×844, 640×320 et 844×390. Un appui souris simulé avec le gestionnaire de placement réel produit un seul placement et aucune action Quitter. Aucune session XR réelle effectuée pour ce correctif.

Publication 0.3.1 confirmée le 17 novembre : workflow GitHub Actions du correctif terminé avec succès et manifeste ARM64 disponible dans GHCR. Cela ne confirme pas encore le résultat sur l’appareil de l’utilisateur.

- Panneau DOM Overlay, si proposé par le navigateur : **Placer A/B**, **Recommencer**, **Quitter l’AR**, puis commandes du relevé.
- Viseur central et indication verte lorsque la projection de placement est valide.
- Prise en compte immédiate du contact tactile, sans double placement au relâchement ou au clic synthétique.
- Position valide très récente utilisable à l’appui : au maximum **100 ms**.
- Tolérance aux pertes brèves du suivi : attente d’une position valide pendant **1,5 seconde**.
- Refus explicites pour les positions périmées, l’absence de suivi, la visée vers l’horizon ou une projection trop distante.
- Messages de délai dépassé en l’absence d’images XR.
- Sélection XR native de repli hors du panneau, sans double action liée aux commandes HTML.
- Panneau de relevé placé sous le viseur, défilant sur petits écrans, avec barre de commandes fixe et instructions/journal repliables.

Les difficultés rapportées sur téléphone — bouton A sans réaction apparente, journal déconnecté et alternance de suivi valide/invalide — ont conduit à ces corrections et aux diagnostics détaillés. Le proxy externe doit aussi autoriser les WebSocket ; l’utilisateur a indiqué avoir activé cette option dans Nginx.

Voir [le parcours mobile](mobile-ar.md).

## 6. Journal HAOS et diagnostics

- Logs serveur JSON horodatés sur la sortie standard : démarrage, connexions, départs, refus, erreurs et actions d’énigme.
- Métadonnées de connexion disponibles pour l’administration : identifiant, place, adresse et navigateur.
- Accès et erreurs Nginx dirigés vers les sorties du conteneur.
- Événements du client XR validés par le serveur puis associés à l’identité et à la place du joueur.
- Traces de demande/démarrage/fin de session, placement demandé/accepté/refusé/expiré, calibrage et changement de suivi.
- Accusés de réception WebSocket pour indiquer que le journal serveur a reçu l’événement.
- File limitée d’événements en attente pendant une déconnexion.
- Depuis 0.3.0 : disponibilité des surfaces, import réussi ou erreur d’import Quest.
- Les polygones bruts des surfaces et les images caméra ne sont pas envoyés dans les journaux.

L’administration expose les **100 derniers événements Node.js** ; ce tampon n’est pas une archive persistante et ne comprend pas les lignes d’accès Nginx.

Voir [le guide des journaux](logging.md).

## 7. Interface d’administration

- Page dédiée `/admin.html`, accessible depuis la page joueur.
- Consultation de la disponibilité serveur, des joueurs, de l’état de l’énigme et du journal récent.
- Réinitialisation de l’énigme et déconnexion d’un joueur.
- Bibliothèque de pièces : aperçu 3D, activation, suppression avec confirmation et export JSON.
- Actualisation périodique sans occuper une place joueur.
- API protégées par un jeton administrateur d’au moins **16 caractères**, configuré avec `admin_token` dans HAOS ou `ADMIN_TOKEN` en développement.
- Jeton conservé en mémoire dans la page, absent des modèles enregistrés. Vérification du jeton, de l’origine et des entrées côté serveur.

Pas de comptes utilisateurs, de gestion de plusieurs rôles ou de bannissement persistant. L’interface ne propose pas encore un éditeur complet de géométrie depuis l’administration.

## 8. Construction manuelle de pièces 3D

- Création d’une pièce après calibrage A/B, avec nom et hauteur mesurée des murs.
- Contour de **3 à 32 coins**, relevés dans l’ordre au sol puis fermés.
- Contours concaves autorisés : plusieurs coins et décrochements dans les murs.
- Validation des coordonnées, de la surface, des coins trop proches, des alignements inutiles et des croisements.
- Jusqu’à **32 obstacles**, représentés par des boîtes alignées sur les axes A/B.
- Deux coins opposés pour l’empreinte au sol d’un obstacle, avec nom et hauteur saisis manuellement.
- Possibilité de représenter une table, banquette, chaise ou bureau par une ou plusieurs boîtes ; pas de catalogue de modèles détaillés de mobilier.
- Validation pour empêcher un obstacle de dépasser du contour ou de la hauteur des murs.
- Brouillon local, annulation, retrait du dernier élément selon l’étape et enregistrement explicite.
- Aperçu 3D orientable/zoomable à la souris ou au toucher ; superposition du modèle en AR après calibrage.

Les murs ont une hauteur uniforme. Les boîtes ne reproduisent pas les pieds, dossiers, textures ou formes détaillées du mobilier. Le modèle n’assure ni occlusion réelle ni protection contre les obstacles physiques.

## 9. Plusieurs pièces et conservation sur le serveur

- Bibliothèque de **20 pièces maximum**, avec identifiants, noms et une pièce active.
- Enregistrement du modèle et de la sélection active dans `rooms.json`.
- Sous HAOS : stockage dans **`/data/myroom/rooms.json`**, conservé lors d’un redémarrage ou d’une mise à jour de l’add-on.
- En développement : dossier de données du serveur par défaut, ou emplacement défini par `DATA_DIR`.
- Écriture dans un fichier temporaire puis renommage avant remplacement de l’état en mémoire.
- Contrôle de révision pour éviter les écrasements par un appareil disposant d’un ancien état.
- Refus d’un fichier corrompu au démarrage, afin de préserver les données existantes.
- Diffusion du modèle actif aux joueurs par WebSocket.
- Activation, suppression et export ; restauration manuelle documentée, sans import graphique de sauvegarde à ce stade.

Une seule pièce est active pour la salle multijoueur : plusieurs fiches ne créent pas plusieurs parties simultanées. Les connexions et l’état des énigmes restent en mémoire et sont perdus au redémarrage. Prévoir une sauvegarde Home Assistant incluant les données de l’add-on avant une désinstallation.

Voir [la bibliothèque de pièces](room-library.md).

## 10. Portes et fenêtres — 0.2.2

- Ouvertures rectangulaires attachées à un mur entre deux coins consécutifs.
- Choix du type, du nom, de la largeur et de la hauteur.
- Position mesurée depuis le premier coin du mur jusqu’au bord de l’ouverture.
- Porte commençant au sol ; hauteur du bas réglable pour une fenêtre.
- Positionnement optionnel par visée du sol au pied du centre de l’ouverture, projetée sur le mur sélectionné.
- Refus d’une visée éloignée de plus de 50 cm de la ligne du mur choisi.
- Découpe réelle de la géométrie du mur dans l’aperçu et le modèle AR ; contours verts pour les portes, jaunes pour les fenêtres.
- Retrait d’une ouverture du brouillon et conservation avec chaque pièce après sauvegarde.
- Limite de **32 ouvertures**, validation des dimensions et refus des chevauchements.
- Anciennes pièces sans champ d’ouvertures toujours lisibles, avec liste vide.

Pas de vantail animé, vitrage, collision ou détection automatique des ouvertures.

## 11. Import expérimental Quest 3 — 0.3.0

- Demande de `plane-detection` comme capacité WebXR optionnelle.
- Affichage du nombre de surfaces et message explicite si l’API ou les surfaces ne sont pas disponibles.
- Lecture des plans uniquement à la demande, sur une image XR active, avec leur pose courante ; pas de réutilisation d’une pose perdue.
- Transformation des surfaces vers le repère commun A/B.
- Sélection d’un contour de sol valide contenant A et B, proche du sol local ; préférence pour les surfaces identifiées comme sol.
- Conservation des décrochements du polygone disponible, sans remplacement par une enveloppe convexe.
- Hauteur des murs estimée depuis des surfaces identifiées comme plafond ou mur ; à défaut, **2,5 m proposée**, signalée comme devant être mesurée.
- Boîtes approximatives possibles pour les surfaces horizontales identifiées comme table, bureau, canapé ou lit.
- Rejet signalé des meubles dont la boîte sort des limites.
- Création d’une **nouvelle fiche en brouillon**, sans écraser la pièce active ni un brouillon déjà commencé.
- Vérification puis sauvegarde via les mêmes API et la même bibliothèque persistante que le relevé manuel.
- Panneau de messages 3D si DOM Overlay n’est pas disponible.
- Boutons des contrôleurs WebXR standard : **A droit / X gauche** importer, **B droit** enregistrer, **Y gauche** annuler ; nouveaux appuis uniquement.

### Parcours de premier essai

1. Mettre à jour l’add-on vers 0.3.0 et recharger MyRoom.
2. Effectuer la configuration de l’espace dans le Quest 3.
3. Ouvrir MyRoom en HTTPS dans Meta Quest Browser et saisir le jeton administrateur avant l’AR.
4. Démarrer immersive-ar et autoriser l’accès aux données spatiales si demandé.
5. Calibrer A/B avec les deux mêmes repères physiques au sol.
6. Importer les surfaces par le bouton du panneau ou A/X.
7. Vérifier la géométrie et les avertissements ; B droit enregistre, Y gauche annule.
8. Vérifier la fiche dans l’administration et consulter le journal HAOS en cas de refus.

### Limites de cet import

L’application lit ce que le navigateur expose depuis la configuration de l’espace. Elle ne lance pas le scan système, n’importe pas de maillage détaillé, ne reconnaît pas elle-même les objets et ne fusionne pas plusieurs sols. Le contour fourni peut être un simple rectangle. Certains meubles ou murs peuvent manquer, et plusieurs plans d’un même meuble peuvent produire des doublons. Les portes et fenêtres restent manuelles.

Sans DOM Overlay, le panneau 3D est un affichage de messages ; les corrections détaillées nécessitent les outils manuels sur un appareil proposant le panneau HTML. Ne sauvegarder que si le modèle convient. Chaque joueur doit toujours refaire A/B.

Voir [le guide Quest et ses limites](quest-scan.md).

## 12. Historique des versions et commits

| Version | Commit | Réalisation principale |
|---|---|---|
| 0.1.0 | `7ea7175` | Squelette, diagnostic WebXR, quatre joueurs, calibrage, add-on et publication ARM64 |
| 0.1.1 | `d0b6d64` | Lien de l’interface Web dans HAOS et accès réseau local |
| 0.1.2 | `e1e50ab` | Journaux serveur et Nginx dans les sorties HAOS |
| 0.1.3 | `25a1c43` | Administration protégée, joueurs, journal et commandes |
| 0.1.4 | `e7f4677` | Commandes tactiles AR |
| 0.1.5 | `8a7252e` | Retour des appuis et diagnostics XR |
| 0.1.6 | `8b62a8d` | Tolérance aux pertes brèves de suivi pendant le placement |
| 0.2.0 | `30f3ebc` | Reconstruction manuelle et bibliothèque persistante de pièces |
| 0.2.1 | `59c55c5` | Panneau mobile dégagé du viseur |
| 0.2.2 | `3467c20` | Portes et fenêtres sauvegardées, avec découpes des murs |
| 0.3.0 | `f23af74` | Import expérimental des surfaces Quest et commandes contrôleur |
| 0.3.1 | `8c240bc` | Barre de commandes stable après B pour éviter une activation involontaire de Quitter |
| 0.3.2 | `98dc09a` | Application web installable depuis Chrome avec icônes et lancement autonome |
| 0.3.3 | `8eace08` | Jeton et erreurs de sauvegarde dans l’AR, réglage local de l’alignement |
| 0.3.4 | `f359e57` | Retrait des logs répétitifs de suivi, filtrage des anciens clients |

Voir aussi le [changelog de l’add-on](../haos-addon/CHANGELOG.md).

## 13. Vérifications effectuées et résultats matériels

### Compilation et tests logiciels

Sur l’état fonctionnel 0.3.0 :

- `npm run typecheck` : réussi pour le client et le serveur.
- `npm run build` : réussi pour Vite et le serveur TypeScript. Vite signale un chunk Three.js supérieur à son seuil indicatif de 500 ko ; ce n’est pas une erreur de compilation.
- `npm test` : **26 tests réussis**.
- CI GitHub Actions 0.3.0 : validation et publication réussies.
- Présence de l’image 0.3.0 ARM64 vérifiée dans GHCR.

Les tests couvrent notamment les places joueurs, la synchronisation de l’énigme, les API et WebSocket, l’administration, les origines, la projection au sol, les appuis et pertes de suivi simulés, les entrées réseau, la persistance des pièces, les révisions concurrentes, les fichiers corrompus, les ouvertures et la conversion de surfaces Quest synthétiques.

Lors de la vérification de ce récapitulatif, une première exécution a rencontré une erreur Windows `EPERM` de renommage d’un fichier temporaire dans les tests de stockage. Une nouvelle exécution, sans modification du code, a réussi avec les 26 tests. Ce refus ponctuel n’a pas été reproduit ni diagnostiqué davantage.

### Vérifications dans Chrome intégré

- Administration, joueurs, journal et réinitialisation visible sur la page joueur.
- Aperçus 3D de pièces et parcours de relevé avec points injectés.
- Panneau mobile mesuré sur plusieurs tailles simulées, en portrait et paysage.
- Ajout/retrait de portes et fenêtres et placement de fenêtre par projection simulée.
- Import Quest avec surfaces synthétiques, protection du brouillon, ajout d’une ouverture puis annulation retrouvant la pièce active.

Ces essais de formulaire et de géométrie **ne constituent pas des sessions WebXR réelles**.

### Retours matériels de l’utilisateur

L’utilisateur a indiqué que son téléphone démarrait immersive-ar avec la caméra visible, puis a confirmé le fonctionnement du placement A/B après les ajustements de suivi. Ces retours ne valident pas la reconstruction complète, les ouvertures ou l’import Quest ajouté ensuite.

### Restant à valider sur matériel

- Sessions physiques sur Quest 2, Quest 3 et Quest 3S.
- Accès réel aux surfaces du Quest 3, permissions et qualité des contours fournis.
- Lisibilité du panneau 3D, mapping et fonctionnement des boutons sur les contrôleurs réels.
- Précision et stabilité du calibrage à plusieurs appareils dans la même pièce.
- Relevé complet et ouvertures sur téléphone réel.
- Exécution de l’image sur HAOS/Raspberry Pi 5, proxy HTTPS et conservation des pièces dans cette installation.

**Aucun essai physique Quest n’a été effectué par l’agent.** Docker n’était pas disponible dans l’environnement local ; la construction ARM64 a été réalisée par GitHub Actions. Voir [le détail des vérifications](verification.md) et [la procédure de validation casque](quest-validation.md).

## 14. Commandes de développement

```sh
npm ci
npm run dev
npm run typecheck
npm run build
npm test
```

Le développement se consulte sur `http://localhost:5173/` ; l’administration sur `/admin.html`. Chrome peut tester les interfaces et la logique en local, mais la disponibilité d’immersive-ar dépend de l’appareil. Un téléphone ou casque sur le LAN doit accéder à une origine HTTPS avec certificat reconnu, via le proxy correctement configuré pour les WebSocket.

`npm start` lance uniquement le serveur compilé ; en production, les fichiers du client sont servis par Nginx. Les secrets de configuration doivent rester hors de Git.

## 15. Application installable depuis Chrome — 0.3.2

- Manifeste d’application web avec identité stable, nom MyRoom, démarrage à la racine et affichage `standalone`.
- Icônes PNG 192 et 512 px et variante maskable, générées par un script Node sans dépendance externe.
- Bouton d’installation affiché quand Chrome le propose, prise en compte d’une annulation, des erreurs, de la confirmation `appinstalled` et du mode application.
- Instructions via le menu Chrome si le bouton n’est pas disponible ; aucune prétention à détecter toutes les installations depuis un onglet ordinaire.
- Ouverture de la même origine HTTPS HAOS depuis l’écran d’accueil. Le serveur reste nécessaire et aucun service worker/cache hors ligne n’est ajouté.
- Configuration Nginx pour le type MIME du manifeste et sa revalidation ; guide [d’installation mobile](installation-mobile.md).

L’installation réelle sur un téléphone et l’AR depuis l’application installée restent à valider physiquement. L’installation n’ajoute pas les capacités WebXR absentes du téléphone et ne configure pas l’accès extérieur au serveur.

Vérifications du 17 novembre : typecheck et compilation réussis après correction d’un conflit de déclaration TypeScript dans le nouveau module ; 26 tests existants réussis. Dans Chrome intégré, manifeste chargé et trois icônes décodées aux dimensions déclarées ; événements d’installation synthétiques vérifiant proposition, annulation, acceptation sans confirmation prématurée, confirmation et erreur du navigateur. Aucune installation Android réelle effectuée. Le type MIME Nginx est configuré mais n’a pas été essayé localement dans un conteneur.

Publication 0.3.2 confirmée le 17 novembre : workflow du commit `98dc09a` terminé avec succès et manifeste de l’image ARM64 disponible dans GHCR. L’installation sur le téléphone de l’utilisateur reste à effectuer.

## 16. Sauvegarde mobile et alignement local — 0.3.3

Après le signalement d’une sauvegarde impossible et d’un modèle parfois mal placé sur téléphone :

- Saisie du jeton administrateur possible dans le panneau AR, sans quitter la session et perdre le brouillon. Aucun jeton ajouté aux logs ou au stockage du modèle.
- Explication près du bouton de sauvegarde lorsqu’un contour, obstacle ou ajout d’ouverture reste à terminer ; erreurs du contour également visibles à cet endroit.
- Messages explicites pour jeton absent/refusé, réseau, délai dépassé ou réponse non JSON du proxy ; conservation du brouillon.
- Traces de demande, succès et échec de sauvegarde dans HAOS, limitées aux messages de diagnostic.
- Réglage local d’affichage après sauvegarde : décalages de 5 cm, hauteur, rotation de 1°, annulation vers le calibrage initial. Bloqué pendant un brouillon ; ne modifie pas la géométrie serveur et ne persiste pas après la session.

Typecheck et compilation exécutés avec succès après correction d’une incompatibilité d’itération DOM ; 27 tests logiciels réussis, dont un nouveau test de déplacement/rotation sans mutation du calibrage initial. Dans Chrome avec quatre points synthétiques et réponses HTTP simulées : sauvegarde bloquée avant fermeture, jeton manquant expliqué, jeton refusé conservant le brouillon, correction dans le champ AR puis succès ; champs secrets vidés après lecture et diagnostics vérifiés. Les protections des diagnostics contre l’envoi du jeton sont testées. Aucun essai physique de sauvegarde ou de réglage AR réalisé par l’agent.

La cause précise du refus sur l’appareil utilisateur n’est pas encore établie. Le réglage local peut aider un décalage stable, mais ne corrige ni la dérive du suivi ni une estimation incorrecte du sol. L’utilisateur a également indiqué que le redémarrage complet de Chrome avait levé son blocage d’installation précédent ; cela ne constitue pas une validation indépendante du certificat ou de l’installation Android.

La confirmation de sauvegarde valide aussi le schéma de la bibliothèque reçue et la présence de la pièce avant de supprimer le brouillon. Dans Chrome, réponses HTML HTTP 502, bibliothèque invalide et panne réseau simulées : message adapté, brouillon conservé et bouton de nouveau utilisable.

## 17. Nettoyage des journaux — 0.3.4

À la demande de l’utilisateur qui indique que la visée fonctionne, suppression des émissions `tracking_changed` côté client. Le serveur valide et accuse encore réception de ces événements pour les anciennes pages ouvertes, mais ne les écrit ni dans stdout/HAOS ni dans le tampon du journal admin. Le viseur et les messages à l’écran restent actifs, ainsi que les journaux de connexion, erreur, calibrage, placement et sauvegarde. Les lignes historiques HAOS ne sont pas effacées.

Le test d’intégration HTTP/WebSocket vérifie l’accusé de réception d’un ancien client et l’absence de cet événement dans les logs admin et stdout, tout en conservant les autres diagnostics. La version 0.3.4 comprend les améliorations de sauvegarde et d’alignement développées pour 0.3.3.

Vérifications finales : typecheck et compilation réussis, 27 tests réussis. Les workflows GitHub Actions 0.3.3 et 0.3.4 ont terminé avec succès ; le manifeste ARM64 0.3.4 a été vérifié dans GHCR. Aucun essai physique de cette version réalisé par l’agent.
