# Changelog

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
