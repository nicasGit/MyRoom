# Changelog

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
