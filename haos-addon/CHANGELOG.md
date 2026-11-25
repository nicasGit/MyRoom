## 0.15.9\n\n- Ajout des jaquettes originales du Vidéoclub rétro dans la Bibliothèque.\n- Quatre films des années 80, années de sortie et cachettes thématiques.\n- Nouvelle aventure Menthe 27 version 0.5.0.\n\n## 0.15.8

- Ajout du puzzle Videoclub retro : decouverte, montage de trois cassettes, erreurs et ordre gagnant.
- Nouvelle aventure Menthe 27 version 0.4.0, avec progression coffre, blackjack puis videoclub.
- Compatible avec les versions d aventure existantes et les pieces deja enregistrees.

## 0.15.7

- Coffre enrichi avec fragments d’indices cachés et fausse piste.
- Validation serveur des indices avant la combinaison.
- Interface 3D et tactile mise à jour pour examiner les fragments.

## 0.15.6

- Correction de la prise du bâton dans la simulation 3D.
- Déplacement du vortex depuis le menu d'administration sur casque ou PC.
- Ancres WebXR persistantes optionnelles pour restaurer les repères A/B.
- Obstacles de création visibles uniquement à proximité immédiate.

## 0.15.5

- Correction de la prise tactile Android : la main virtuelle vise le bâton au centre de l'image.
- Le bâton reste attaché à la ceinture dans le couloir du vortex.

## 0.15.4

- Fenêtre transparente vers le passthrough dans le trou d'entrée depuis le couloir.
- Sortie MR uniquement en retraversant l'ouverture elliptique ; contourner le plan conserve l'univers virtuel.
- Courtes pertes de suivi et changements de préparation ne coupent plus l'univers et son ambiance ; reprise audio bornée après suspension.
- Réinitialisation effective du rituel : nouvelle session, bâtons/passages/prises remis à zéro, progression d'énigmes et pièce conservées ; retour explicite dans le panneau admin.
- Comportement du panneau intérieur conservé.

## 0.15.3

- Vortex plat : disque, contour et particules coplanaires, sans volume conique visible en faisant le tour.
- Passage de tête : univers opaque à l'entrée et retour MR en reculant, même après validation serveur.
- L'immersion locale n'attend plus que tous les autres joueurs aient leur suivi prêt ; progression serveur inchangée.
- Son temporel dès l'entrée visuelle, sans attendre l'accusé serveur ; déverrouillage audio également par gâchette/poignée XR.

## 0.15.2

- Casque : choisir un objet dans la bibliothèque, aperçu au rayon, hauteur/rotation/taille puis pose enregistrée dans la pièce.
- Admin PC : sélection dans la vue 3D, flèches de déplacement, rotation et sauvegarde explicite avec protection contre les modifications concurrentes.
- Validation serveur des poses explicites ; ancien ajout automatique conservé pour les autres interfaces.

## 0.15.1

- Coffre de l'énigme : modèle importé treasure_chest_1k, couvercle animé et verrou masqué après réussite.
- Dimensions de jeu conservées et coffre procédural de secours si le modèle est absent.

## 0.15.0

- Reprises bornées des verrouillages transitoires Windows pendant les sauvegardes atomiques.

- Page Bibliothèque : import de plusieurs GLB, prévisualisation et bilan par fichier.
- Modal de configuration des modèles importés, recherche et catégories.
- Catalogue et fichiers persistants sur HAOS ; versions des objets placés conservées.
- Validation GLB statiques autonomes, limites de poids/géométrie/textures et licence déclarée.

## 0.14.1

- Vignettes 3D des huit objets dans le catalogue admin PC, avant ajout.
- Cadrage automatique, éclairage et images statiques générées localement avec un seul contexte temporaire.
- Erreur d’aperçu non bloquante ; aucun changement des sauvegardes ou des énigmes.

## 0.14.0

- Bibliothèque de huit objets Kenney CC0 locaux : table, chaise, bureau, lit, armoire, lampe, livres et plante.
- Ajout, réglages, fixe/manipulable et sauvegarde depuis l’admin et le menu mural.
- Prises partagées et taille ajustable avec deux mains ; prise au clic dans le simulateur.
- Placements persistants, anciens modèles conservés, progression des énigmes préservée.
- Objets incassables ; lampe et portes d’armoire décoratives. Aucun essai physique Quest/iPad.

## 0.13.3

- Boutons Team Léon et Noms aléatoires dans l’administration et le menu du casque.
- Quatre noms distincts parmi 40 personnages ; validation serveur existante conservée.
- Aucun essai physique Quest.

## 0.13.2

- Vortex, panneau en bois, faisceaux et flèche révélés individuellement après la prise de son propre bâton.
- Prendre le bâton d'un autre joueur n'ouvre pas l'accès ; relâcher son bâton conserve la révélation pendant le rituel.
- Couloir et confirmation accessible exigent aussi cette attribution ; passage physique non validé sans bâton.
- Même affichage dans WebXR, les simulateurs et l'aperçu joueur ; nouvelle session et reset retirent l'accès.
- Contrôles logiciels uniquement, sans essai physique Quest.

## 0.13.1

- Renommage des pièces depuis leur fiche d'administration, sans changer l'identifiant, les placements, la pièce active ou la progression.
- Nom éditable avant l'enregistrement ; bouton dédié et clavier virtuel dans les outils de création Quest, avec validation, annulation et sortie.
- Bouton « Réinitialiser l’aventure » dans l'administration et le menu mural, avec confirmation explicite. Les pièces et placements sont conservés.
- Validation serveur des noms et révisions, persistance atomique et autorisation administrative existante.
- Aucun essai matériel Quest annoncé.

## 0.13.0

- Vortex proposé au centre géométrique de la pièce, ou dans la zone libre la plus proche ; bouton « Centrer le vortex » sur PC et menu mural, puis confirmation physique requise.
- Grand panneau en bois biscornu « Entrez entièrement dans le vortex », visible au fond du portail ouvert et dans le couloir, avec compteur des arrivées.
- Fantômes des autres joueurs WebXR dans le couloir, y compris ceux encore dehors ; positions de tête récentes, corps approximatifs et couleur orangée à proximité.
- Positions expirées ou perdues masquées ; indication de suivi incomplet. Aucun suivi corporel complet ni garantie anticollision.
- Partage temporaire des poses pendant le rituel, sans journalisation ni persistance. Aucun essai matériel Quest annoncé.

## 0.12.1

- Ambiance originale de moteur temporel dans le couloir après validation du passage, inspirée du TARDIS, sans extrait de la série.
- Boucle locale à volume modéré avec fondus ; arrêt à la fin du rituel, perte de suivi, casque masqué, déconnexion ou sortie XR.
- Synthèse Web Audio après un geste utilisateur ; aucun téléchargement audio et aucune incidence sur la progression si le navigateur refuse le son.
- Vérifications logicielles uniquement, sans essai physique Quest.

## 0.12.0

- Couloir de vortex personnel après le franchissement de la tête en WebXR : décor opaque animé et compteur des passages en direct, sans déplacer la caméra.
- Validation physique à 4 cm derrière le plan, après une approche de 30 cm ; passage virtuel et confirmation accessible restent identifiés séparément.
- Les autres joueurs restent devant le portail jusqu'à leur propre passage ; l'aventure attend tout le groupe.
- Bâton toujours manipulable pendant l'attente. Fin du rituel, perte de suivi ou sortie XR nettoient le décor.
- Aucun essai matériel Quest annoncé ; limites détaillées dans la documentation Team Portal.

## 0.11.0

- Bâtons : orientation complète de la main (inclinaison, roulis et rotation), synchronisée pendant l'attente des autres joueurs et conservée au relâchement dans la session.
- Protocole rétrocompatible : quaternion facultatif strictement validé pour les bâtons ; autres objets et anciens placements inchangés.
- Vortex bleu/cyan procédural : spirales animées, tunnel 3D, particules et bord lumineux, inspiré de l'ambiance Sliders.
- Faisceaux suivant la pointe des bâtons inclinés ; mêmes règles d'ouverture et de franchissement.
- Vérifications logicielles uniquement, sans validation physique Quest.

## 0.10.3

- Nombre de joueurs modifiable même si l'ancien couloir est invalide ; la confirmation physique reste exigée.
- Portail proposé selon la pièce pour les nouveaux relevés, bouton « Adapter le portail à la pièce » dans les paramètres du menu mural.
- Préparation et sauvegarde automatique des neuf emplacements manquants avant le rituel, sans remplacer les placements existants.
- Mains avec manettes : pose de repos souple, index à la gâchette, autres doigts à la poignée, pouce selon les contacts disponibles.
- Aucune validation matérielle Quest annoncée.

## 0.10.2

- Démarrage du rituel : renvoyer le motif réel du refus (placements, espace à confirmer, session), au lieu de « Requête JSON invalide » pour un JSON correct.
- Journal serveur adventure_start_refused pour identifier le prérequis bloquant.
- Bouton « Lancer le jeu en WebXR » mis en évidence en haut de l'accueil, avant les modes et les diagnostics.
- Aucun changement des permissions, de la confirmation de l'espace ou de la progression.

## 0.10.1

- Inclinaison vers le bas de 30° des mains simulées, sans changer les poses des mains réellement suivies.
- Prise des bâtons : événements natifs pince/gâchette, zone de saisie dédiée, sélection du bâton de sa place et indépendance des placements d'énigmes.
- Quatre modèles CC0 différents, KayKit et TCCDev/OpenGameArt, servis localement avec textures et provenance.
- Panneaux administrateur et outils de pièce : viser puis maintenir poignée/pince pour rapprocher et déplacer ; relâcher pose sans cliquer.
- Validation logicielle uniquement ; aucune validation physique Quest annoncée.

## 0.10.0

- Mains simulées inclinées de 30° supplémentaires, orientations gauche/droite conservées.
- Sauvegarde des pièces sans jeton si admin_token est vide, sans ouvrir les autres commandes admin.
- Obstacles : déplacement à une main, dimensions ajustables à deux mains, validation et annulation dans le brouillon.
- Import facultatif des volumes de meubles Quest exposés par WebXR, dédoublonnage des plans, accès depuis les outils 3D.
- Aucun essai matériel Quest réalisé par l'agent ; les données spatiales disponibles dépendent du navigateur.

## 0.9.3

- Option debug_without_admin_token facultative : les configurations existantes sans cette clé restent valides.
- Absence de clé interprétée comme false au démarrage, sans activer les droits debug.

## 0.9.2

- Mode debug sans jeton sur activation explicite de debug_without_admin_token.
- Le menu verrouillé affiche un refus sans ouvrir automatiquement le clavier.
- Prise des bâtons aussi par gâchette pendant le rituel et messages visibles au mur.
- Inclinaison des mains corrigée, curseur visible sur les panneaux, fenêtres saisissables à la poignée/pince.

## 0.9.1

- Panneau de relevé 3D utilisable aux contrôleurs Quest : fermer le contour, enregistrer, annuler, revenir et quitter XR.
- Masquage des panneaux concurrents pendant la création de pièce.
- Inclinaison symétrique des mains simulées aux contrôleurs ; suivi optique conservé.

## 0.9.0

- Virtual 3D, experimental camera overlay and native Quest display adapters.
- Persistent administrator mode policy, client capabilities and distinct portal passage methods.
- Camera lifecycle cleanup and mixed-mode multiplayer regression tests.

# Changelog

## 0.8.6

- Commandes tactiles essentielles dans une barre indépendante des panneaux repliables : prise, sélection, pièces/jeu et sortie.
- Prise au premier contact, sans double bascule au clic synthétique ; mode screen-space reconnu même si un grip est déclaré.
- Reprise de construction de scène quand le modèle arrive après calibrage, indication explicite de pièce absente ou serveur déconnecté.
- Vérification navigateur en format téléphone ; aucun essai matériel effectué par l'agent.

## 0.8.5

- Mains 3D WebXR articulées avec matériau couleur peau, servies localement et accompagnées de leur licence MIT.
- Fermeture progressive sur téléphone et contrôleurs ; articulations WebXR réelles lorsqu'elles sont disponibles.
- Aperçu 3D avant l'AR et repli sur les primitives si le modèle ou le suivi sont indisponibles.
- 95 tests logiciels réussis ; aucun essai matériel effectué par l'agent.

## 0.8.4

- Menu mural Team Portal : aventures, paramètres joueurs, noms avec clavier 3D et démarrage.
- Actualisation en direct, modifications protégées par le jeton organisateur existant.
- Mode pièces dédié ; croix et grands panneaux masqués en jeu après calibrage.
- Correction de la détection tactile qui pouvait désactiver la main virtuelle téléphone.
- 94 tests logiciels réussis ; aucun essai matériel effectué par l'agent.

## 0.8.3

- Main virtuelle sur téléphone avec bouton Prendre / Relâcher après calibrage A/B.
- Vortex ouvert dès la première prise de bâton ; nombre de joueurs réglable de 1 à 4 dans l'administration.
- Bâtons, passages et limite de connexion adaptés au groupe choisi ; anciennes configurations à quatre conservées.
- 91 tests logiciels réussis ; aucun essai matériel effectué par l'agent.

## 0.8.2

- Bâtons du vortex en suspension, sans socle, avec halos respirants.
- Répartition commune dans la pièce, hors obstacles déclarés et couloir du vortex.
- Manipulation existante conservée ; 88 tests logiciels réussis. Aucun essai physique Quest effectué par l'agent.

## 0.8.1

- Le vortex et les quatre bâtons deviennent l’accueil global de MyRoom, visible avant les objets d’aventure après calibrage.
- Introduction activée par défaut et placement commun à la pièce, indépendant de l’aventure sélectionnée ; anciens placements conservés.
- Accès direct à l’introduction dans l’administration, sans imposer le mode test PC. Les tests directs d’énigmes restent explicites.
- 86 tests logiciels ; aucun essai physique Quest effectué par l’agent.

## 0.8.0

- Team Portal : introduction coopérative facultative, avec quatre bâtons nominatifs, vortex et passages individuels validés par le serveur.
- Menthe 27 0.3.0 conserve le coffre et le blackjack existants, après ce rituel ; anciennes versions conservées.
- Placements indépendants enregistrés, confirmation de l’espace physique, couleurs et dimensions personnalisables.
- Reprise privée de place, passage accessible, commandes administrateur et simulation PC explicitement identifiée.
- Correction du passage immédiatement après ouverture ; aucun essai matériel Quest effectué par l’agent.

## 0.7.2

- Mains articulées stylisées avec doigts suivant les poses WebXR disponibles, visibles dès l’entrée en session.
- Gauche cyan, droite verte et jaune pendant une prise détectée ; disparition des articulations sans suivi.
- Gants simplifiés pour les contrôleurs, sans modèle distant ni transmission du squelette aux autres joueurs.
- 77 tests logiciels ; aucun essai physique de cet ajout effectué par l’agent.

## 0.7.1

- Panneau d’informations fixe dans l’espace de session, à hauteur de lecture, au lieu de suivre le regard.
- Prise possible en approchant avec la pince ou la poignée déjà maintenue, avec aide pour les gros objets à deux mains.
- Points cyan/jaunes et compteur des prises détectées pour faciliter le diagnostic sur casque.
- Correctifs couverts par 75 tests logiciels ; essai physique de cette correction encore nécessaire.

## 0.7.0

- Prise des objets pendant la partie : une main pour les petits objets, deux mains pour coffre, table et panneau.
- Pince des mains WebXR si disponible et poignées des contrôleurs ; positions partagées, verrous et annulation après perte de suivi ou déconnexion.
- Indice sous le coffre, dépôt des cartes dans leurs logements et sauvegarde administrateur des placements après arrêt.
- Anciens modèles de pièces et calibrage A/B conservés ; aucun essai physique Quest effectué par l’agent.

## 0.6.0

- Opération Menthe 27 version 0.2.0 : coffre conservé puis blackjack hybride à trois manches.
- Casino à paquet serveur, Tirer/Rester réservés au capitaine, rattrapage après trois échecs et carte du croupier masquée avant révélation.
- Double as et croupier impossible avec cartes 3D, sélection puis dépôt dans des logements partagés, réservations de 15 secondes et libération après déconnexion.
- Récompenses progressives ♣ ♥ ♠, indices et réinitialisation de l’énigme active depuis l’administration ; suite explicitement en attente.
- Compatibilité des anciennes pièces, calibrage A/B et démonstration classique conservés. Progression en mémoire ; aucun essai physique Quest/HAOS effectué par l’agent.

## 0.5.1

- Accès direct aux énigmes implémentées depuis l’administration en mode test.
- Session temporaire partagée ; sortie du mode test restaurant la progression précédente.
- Contrôles des révisions et de l’accès administrateur, état de test visible aux joueurs.

## 0.5.0

- Fondations modulaires : registre d’énigmes, catalogue versionné, étapes et inventaire partagé.
- Choix de l’aventure et saisie des quatre noms dans l’administration.
- Opération Menthe 27 : coffre jouable puis attente explicite du blackjack hybride, non implémenté dans cette version.
- Démonstration classique, coffre 3D, panneau mural, anciennes pièces et calibrage A/B conservés.
- Noms et progression en mémoire uniquement ; aucun essai matériel Quest ou HAOS effectué par l’agent.

## 0.4.2

- Coffre détaillé en bois : corps creux, couvercle bombé, ferrures, poignées, rivets et serrure retirée à l’ouverture.
- Combinaison transférée sur un panneau mural avec tuiles illustrées et quatre logements synchronisés.
- Position/orientation du panneau validées contre murs, portes, fenêtres et obstacles, avec déplacement depuis le plan ou le viseur tactile.
- Compatibilité des anciennes pièces ; proximité serveur désormais contrôlée au panneau.

## 0.4.1

- Proposition aléatoire répartie par secteurs, coffre près du centre libre et table à proximité.
- Glissement des éléments sur le plan administrateur et repositionnement au viseur AR tactile pendant la préparation.
- Départ explicite administrateur, jeu bloqué avant le départ et déplacement tactile bloqué en cours de partie.
- Placements partagés et persistés, contrôles des obstacles et révisions ; pas de prise libre aux contrôleurs.

## 0.4.0

- Coffre des quatre symboles, puis blackjack à une carte avec As souple et progression coopérative.
- Placement des neuf éléments sur le plan admin, enregistré avec chaque pièce.
- Objets AR, commandes tactiles et gâchette ; simulation PC autorisée explicitement par l’administrateur.
- Validation serveur des actions, révisions et proximité déclarée ; progression en mémoire et logs HAOS.
- Aucun essai matériel sur téléphone ou Quest réalisé par l’agent.

## 0.3.4

- Suppression des émissions `tracking_changed` dans le client, sans modifier le viseur ni le suivi AR.
- Filtrage de ces événements côté serveur pour les pages plus anciennes encore ouvertes ; accusé de réception conservé, sans journal HAOS ni tampon admin.
- Les connexions, erreurs, placements, calibrages et diagnostics de sauvegarde restent journalisés.

## 0.3.3

- Saisie/correction du jeton administrateur dans le panneau AR, sans quitter le relevé.
- Motif du bouton de sauvegarde désactivé et erreurs d’enregistrement affichés près du bouton ; brouillon conservé en cas d’échec.
- Diagnostics HAOS des demandes, succès et échecs de sauvegarde, sans journaliser le jeton.
- Réglage local de l’affichage après sauvegarde : translation par pas de 5 cm, rotation par pas de 1° et retour au calibrage initial.
- Réglage bloqué pendant un brouillon, non persistant et sans modification de la pièce du serveur. Ne corrige pas une dérive du suivi AR.

## 0.3.2

- Application web installable depuis Chrome : manifeste, icônes PNG et ouverture en mode application.
- Bouton d’installation proposé selon les capacités du navigateur, instructions de repli et confirmation d’installation.
- Serveur HAOS toujours nécessaire ; aucun cache hors ligne de données ou de code AR.
- Manifeste servi avec le type adapté et revalidation HTTP ; installation et WebXR sur téléphone physique restent à valider.

## 0.3.1

- Le bouton de placement reste visible et désactivé après B, afin de conserver sa place dans la barre de commandes jusqu’au relâchement du doigt.
- Largeur réservée pour empêcher le libellé « Calibrage terminé » de réorganiser les commandes sur petit écran.
- Évite le déplacement du bouton Quitter l’AR sous le contact lors de la fin du calibrage tactile.
- Cause matérielle du signalement à confirmer ; aucun essai physique téléphone ou Quest effectué par l’agent.

## 0.3.0

- Import expérimental des surfaces WebXR, destiné au Quest 3 : contour du sol, hauteur estimée et boîtes de meubles identifiés.
- Brouillon à vérifier avant sauvegarde dans la bibliothèque persistante ; calibrage A/B conservé.
- Détection des capacités, repli manuel et diagnostics d’import dans le journal HAOS.
- Commandes contrôleur A/X importer, B droit enregistrer, Y gauche annuler et panneau de messages 3D sans DOM Overlay.
- Pas de validation physique Quest ; ouvertures et corrections restent manuelles.

## 0.2.2

- Portes et fenêtres rectangulaires : choix du mur, dimensions, distance au coin et hauteur du bas.
- Placement optionnel du centre au sol en AR, retrait des ouvertures et sauvegarde avec chaque pièce.
- Découpes dans les murs de l’aperçu 3D et de l’AR ; validation des dimensions et chevauchements.
- Lecture des anciennes pièces sans migration manuelle.

## 0.2.1

- Panneau AR borné sous le viseur central, y compris sur petits écrans et en paysage.
- Commandes de placement en tête du panneau et fixes pendant le défilement.
- Instructions détaillées et journal repliables pour réduire l'encombrement.

## 0.2.0

- Reconstruction manuelle 3D : contour au sol, hauteur des murs et obstacles cubiques.
- Bibliothèque de vingt pièces nommées, sauvegardée sur disque dans le stockage HAOS.
- Administration : aperçu 3D, activation, suppression et export des pièces.
- Protection par jeton administrateur, validation géométrique et contrôle de révision.

## 0.1.6

- Appui pris dès pointerdown, sans double action au relâchement ou au clic.
- Tolérance aux pertes brèves de suivi : attente d'une projection valide pendant 1,5 s.
- Position courante utilisable à l'appui uniquement si valide et âgée de moins de 100 ms ; toute image invalide l'efface.
- Viseur vert lorsque le placement est possible et sélection tactile XR native en repli hors panneau.

## 0.1.5

- Placement tactile réactif même si la visée est invalide, retour immédiat et motif du refus.
- Appuis pointerup/click dédoublonnés et délai signalé en l'absence d'image XR.
- Événements AR du navigateur validés et remontés au journal HAOS et à l'administration.

## 0.1.4

- Commandes tactiles AR sur navigateur compatible DOM Overlay : placer A/B, recommencer, quitter.
- Instructions dans la vue AR, viseur central et deux marqueurs de calibrage distincts.

## 0.1.3

- Interface d'administration /admin.html : joueurs, état, journal et disponibilité serveur.
- Commandes protégées par admin_token : réinitialisation d'énigme et déconnexion joueur.

## 0.1.2

- Journal HAOS : connexions, départs, refus, erreurs et résolutions d'énigme horodatés.
- Accès et erreurs Nginx dirigés vers la sortie du conteneur.

## 0.1.1

- Bouton « Ouvrir l'interface Web » sur la page de l'add-on, vers le port LAN configuré.
- Instructions pour tester sur Chrome via HAOS et configurer l'origine WebSocket.

## 0.1.0

- Prototype WebXR avec diagnostic immersive-ar et calibrage manuel à deux points.
- Quatre places WebSocket et énigme de démonstration synchronisée.
- Image ARM64 publiée via GitHub Actions, serveur Node.js et Nginx.
## 0.15.10

- Import/export JSON de la bibliothèque de pièces depuis l’administration.
- Import et sélection persistante de jaquettes personnalisées pour le Vidéoclub.
- Franchissement virtuel fonctionnel dans la simulation PC, avec lancement de l’aventure après validation serveur.


## 0.15.11
- Ajoute la transition de brouillard lors du passage collectif du vortex en simulation PC.
- Le panneau mural affiche le puzzle courant et NJOSoftware au dos.
## 0.15.12

- Navigation joueur et administration organisée en sidebar sur écran large.
- Lien direct vers l’administration ajouté dans la sidebar joueur.

