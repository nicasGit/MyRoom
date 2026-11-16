# Commandes tactiles AR — 0.1.4

Ouvrir MyRoom en HTTPS sur un téléphone compatible et démarrer immersive-ar. La session demande le sol local et, en option, [DOM Overlay](https://www.w3.org/TR/webxr-dom-overlays-1/) pour les contrôles tactiles. La présence effective des contrôles est détectée via domOverlayState, pas via le modèle du téléphone.

1. Choisir A puis B au sol, idéalement distants de 1 à 2 mètres, et identiques pour tous les appareils.
2. Incliner le téléphone pour viser A avec la croix centrale. Un petit anneau cyan indique la projection sur le sol local. Depuis 0.1.5, le bouton reste actif tant que le calibrage n'est pas terminé afin qu'un appui affiche toujours un résultat, même si la visée est invalide.
3. Toucher **Placer A**. Le point A reste visible en bleu.
4. Viser B avec le centre de l'écran puis toucher **Placer B**. B apparaît en vert et la distance est affichée. Si B est trop proche (moins de 50 cm), viser plus loin et réessayer.
5. **Recommencer** efface les deux points et redémarre à A. **Quitter l'AR** termine la session. La fin de session et le recentrage invalident le calibrage.

Un appui sur un bouton ne produit pas en plus une sélection XR : beforexrselect est annulé dans le panneau et les événements tactiles suivants sont dédoublonnés. Après validation des deux points, les appuis ne modifient plus les repères jusqu'à Recommencer.

## Pertes brèves de suivi — 0.1.6

Le contact initial (pointerdown) déclenche l'appui, sans attendre de retirer le doigt. Si une projection valide vient d'être observée il y a au plus 100 ms et qu'aucune image invalide ne l'a remplacée, elle est consommée immédiatement. Sinon, maintenir le centre de l'écran sur le même repère : la demande attend la première projection valide pendant au plus 1,5 seconde. Des images sans suivi n'annulent plus immédiatement l'appui. Un délai dépassé annule la demande ; aucun point n'est créé lors d'une reprise tardive du suivi.

Le viseur est vert quand la projection est valide et orange sinon. Le téléphone peut interrompre son suivi pour des raisons externes au site : la tolérance n'est pas une garantie de reprise. Si des diagnostics de suivi arrivent sans aucune ligne placement_requested après un appui, la réception de l'entrée tactile reste à investiguer. Sans événement DOM, un toucher dans la vue hors panneau peut aussi fournir la sélection screen native WebXR si le navigateur l'émet ; cette voie utilise son rayon tactile, sans réutiliser l'appui sur un bouton.

## Diagnostic d'un appui sans résultat — 0.1.5

Après mise à jour, quitter l'ancienne session et recharger la page ; le diagnostic doit afficher la version installée (**0.1.6** pour la correction des pertes brèves). Un appui affiche immédiatement « Appui reçu pour A/B », puis une validation ou un motif. Depuis 0.1.6, une projection invalide à la première image laisse jusqu'à 1,5 seconde au suivi pour revenir ; à expiration, la dernière raison est affichée. B trop proche est toujours refusé et peut être sélectionné à nouveau.

Le petit état « Journal serveur » distingue un événement en cours d'envoi, un accusé de réception et une connexion hors ligne. Le serveur enregistre ces diagnostics sous `client_xr`, avec l'identifiant et la place du joueur : `placement_requested`, puis `placement_accepted`, `placement_rejected` ou `placement_timeout`. Les changements de suivi sont limités à un événement par deux secondes et ne sont pas diffusés à chaque image. En cas de perte réseau, au plus vingt événements attendent la reconnexion ; ce journal n'est pas une trace exhaustive.

Si le refus indique une hauteur ≤ 0, le plan local-floor ne permet pas la projection actuelle. Recommencer la session peut rétablir le référentiel ; il ne s'agit pas d'une correction garantie. Aucun sol fictif n'est ajouté pour masquer cette erreur.

## Limites et repli

Sans DOM Overlay, le diagnostic indique l'absence des commandes. La sélection tactile native WebXR reste utilisable si le navigateur fournit une source screen ; elle utilise le rayon du toucher. Les contrôleurs Quest continuent à utiliser leur rayon et leur gâchette. La sortie système du navigateur permet de quitter une session sans bouton.

Le placement projette un rayon sur le plan y=0 du référentiel local-floor, avec une distance maximale de 10 mètres ; ce n'est pas une détection de surface réelle par hit-test. Le navigateur doit fournir un sol local correct. Aucun support garanti sur tous les téléphones. Une session qui montre la caméra ne garantit pas le support de DOM Overlay ou la précision du sol.

À vérifier physiquement : panneau lisible en portrait/paysage, un seul repère par appui, A/B, refus d'un B trop proche, perte/reprise du suivi, recentrage, recommencer, sortie et entrée répétées. Aucun essai physique téléphone ou Quest n'a été effectué par l'agent pour ces commandes. Le retour utilisateur sur la caméra concernait la version précédente.
