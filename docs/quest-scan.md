# Import des surfaces Quest — 0.3.0

## Préparation et utilisation

1. Dans le Quest 3, effectuer la configuration de l’espace de Horizon OS. Ouvrir MyRoom en HTTPS dans Meta Quest Browser et autoriser les données spatiales lorsque le casque le demande. Cette fonction dépend des surfaces exposées par le navigateur, et non d’une identification du modèle du casque.
2. Saisir le jeton administrateur dans la page MyRoom **avant** d’entrer en AR. Démarrer immersive-ar puis calibrer les repères physiques A/B au sol, dans la pièce à importer.
3. Vérifier le nombre de surfaces affiché. **Importer les surfaces du Quest** crée une nouvelle fiche en brouillon, sans modifier ni remplacer la pièce active. Un brouillon existant doit être enregistré ou annulé avant un autre import.
4. Vérifier le modèle superposé, particulièrement le contour, la hauteur et les meubles. Corriger la hauteur, retirer un meuble approximatif via l’annulation des obstacles ou ajouter les éléments manquants avec les outils manuels. Un contour incorrect nécessite d’annuler puis de refaire l’import ou un relevé manuel. Ajouter manuellement les portes et fenêtres.
5. **Enregistrer et activer** écrit la fiche sur le serveur, dans la même bibliothèque persistante que les relevés manuels. Attendre la confirmation avant de quitter l’AR. L’administration permet ensuite de visualiser, activer, exporter ou supprimer cette pièce.

Sans panneau HTML dans le casque, un panneau 3D affiche les messages : gâchette pour A/B, **A droit ou X gauche** pour importer, **B droit** pour enregistrer après vérification et **Y gauche** pour annuler le brouillon. Ces boutons utilisent le mapping WebXR standard, si fourni par les contrôleurs ; ils ne déclenchent qu’à un nouvel appui. Leurs disponibilités et leur lisibilité restent à vérifier sur matériel. Sans ces commandes ni DOM Overlay, l’import n’est pas utilisable dans cette version.

Les corrections par formulaire nécessitent DOM Overlay. Sans ce panneau, vérifier le modèle superposé, l’enregistrer seulement s’il convient, ou annuler. Pour une correction détaillée, reprendre avec les outils manuels sur un appareil proposant le panneau HTML. Le panneau 3D de cette version est un affichage de messages, pas un éditeur complet.

## Conversion et limites

- Demande de `plane-detection` en option : une absence de prise en charge n’empêche pas le relevé manuel. Les plans sont lus sur une image XR active avec leur pose dans `local-floor`, puis transformés dans le repère A/B. Aucun plan ayant perdu sa pose n’est réutilisé.
- Le sol doit être horizontal, proche du sol local (20 cm), contenir A et B, et fournir un contour valide de 3 à 32 coins. Un plan étiqueté `floor` est préféré à une surface horizontale non identifiée. En cas d’ambiguïté, le plus grand contour compatible est proposé avec avertissement. Pas de fusion de plusieurs plans, pas d’enveloppe convexe : les décrochements du polygone sont conservés.
- La hauteur est estimée à partir de plans `ceiling` ou `wall` contenus dans le contour. Sans donnée exploitable : **2,5 m proposée**, à mesurer. Le sol reste à y=0 dans le modèle MyRoom.
- Les surfaces horizontales étiquetées table, desk, couch, sofa ou bed peuvent produire une boîte depuis le sol jusqu’au plan détecté. Il s’agit d’une approximation : pas de reconnaissance par MyRoom, pas de pieds ni de dossier, volumes alignés sur A/B. Une boîte qui dépasse du contour ou des limites est ignorée et signalée. Plusieurs surfaces du même meuble peuvent produire des doublons à retirer manuellement.
- Pas d’import du maillage détaillé, des textures ou des images caméra ; pas de lancement du scan système depuis la page. Aucune garantie de disposer de tous les murs/meubles ou d’un contour détaillé : le navigateur peut fournir un simple rectangle. Les ouvertures restent manuelles.
- Maximum 128 surfaces de 256 sommets chacune examinées. Le modèle final utilise les limites serveur existantes : 20 pièces, 32 coins, 32 obstacles et 32 ouvertures. Le serveur valide le modèle et les révisions avant écriture.
- Quitter la session, changer de pièce active ou se recentrer invalide le calibrage et abandonne le brouillon non enregistré. Les surfaces ne sont pas des ancres partagées ; chaque joueur refait A/B. Les journaux HAOS indiquent la disponibilité des plans et le succès ou l’erreur d’import, sans transmettre les polygones bruts.

## Validation

Tests logiciels avec surfaces et poses synthétiques : transformation A/B, contour concave, fermeture répétée, hauteur, meuble, absence de suivi et données invalides. Les essais physiques sur Quest 3, Quest 2, Quest 3S et HAOS/Raspberry Pi restent à effectuer ; ni la capture réelle ni les commandes contrôleur ne sont annoncées comme validées.

Sources : [WebXR Plane Detection](https://immersive-web.github.io/plane-detection/) et [réalité mixte dans Meta Quest Browser](https://developers.meta.com/vr/documentation/web/webxr-mixed-reality/).
