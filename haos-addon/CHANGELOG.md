# Changelog

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
