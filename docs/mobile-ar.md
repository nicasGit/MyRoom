# Commandes tactiles AR — 0.1.4

Ouvrir MyRoom en HTTPS sur un téléphone compatible et démarrer immersive-ar. La session demande le sol local et, en option, [DOM Overlay](https://www.w3.org/TR/webxr-dom-overlays-1/) pour les contrôles tactiles. La présence effective des contrôles est détectée via domOverlayState, pas via le modèle du téléphone.

1. Choisir A puis B au sol, idéalement distants de 1 à 2 mètres, et identiques pour tous les appareils.
2. Incliner le téléphone pour viser A avec la croix centrale. Un petit anneau cyan indique la projection sur le sol local ; le bouton s'active si le suivi fournit un point valide.
3. Toucher **Placer A**. Le point A reste visible en bleu.
4. Viser B avec le centre de l'écran puis toucher **Placer B**. B apparaît en vert et la distance est affichée. Si B est trop proche (moins de 50 cm), viser plus loin et réessayer.
5. **Recommencer** efface les deux points et redémarre à A. **Quitter l'AR** termine la session. La fin de session et le recentrage invalident le calibrage.

Un appui sur un bouton ne produit pas en plus une sélection XR : beforexrselect est annulé dans le panneau. Le placement tactile est effectué à l'image XR suivante avec la pose courante, sans conserver un ancien point quand le suivi est perdu. Après validation des deux points, les appuis ne modifient plus les repères jusqu'à Recommencer.

## Limites et repli

Sans DOM Overlay, le diagnostic indique l'absence des commandes. La sélection tactile native WebXR reste utilisable si le navigateur fournit une source screen ; elle utilise le rayon du toucher. Les contrôleurs Quest continuent à utiliser leur rayon et leur gâchette. La sortie système du navigateur permet de quitter une session sans bouton.

Le placement projette un rayon sur le plan y=0 du référentiel local-floor, avec une distance maximale de 10 mètres ; ce n'est pas une détection de surface réelle par hit-test. Le navigateur doit fournir un sol local correct. Aucun support garanti sur tous les téléphones. Une session qui montre la caméra ne garantit pas le support de DOM Overlay ou la précision du sol.

À vérifier physiquement : panneau lisible en portrait/paysage, un seul repère par appui, A/B, refus d'un B trop proche, perte/reprise du suivi, recentrage, recommencer, sortie et entrée répétées. Aucun essai physique téléphone ou Quest n'a été effectué par l'agent pour ces commandes. Le retour utilisateur sur la caméra concernait la version précédente.
