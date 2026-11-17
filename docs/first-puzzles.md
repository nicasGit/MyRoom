# Les deux premières énigmes — 0.4.2

## Préparer une pièce

Dans l’administration, activer une pièce enregistrée puis ouvrir **Les deux énigmes AR**. Cliquer **Proposer des positions**, sélectionner chaque élément et ajuster sa position par clic sur le plan ou avec X/Z en mètres. Cliquer **Enregistrer les placements**. Les neuf emplacements sont conservés dans la bibliothèque du serveur, indépendamment pour chaque pièce.

Depuis 0.4.1, la proposition varie à chaque clic : coffre au plus près du centre libre, table à proximité, puis balises et cartes réparties dans des secteurs autour, avec rotation et distances variables. Le centre visé est celui des limites du contour ; s’il tombe dans un obstacle ou hors d’une pièce concave, une position valide voisine est choisie. La répartition reste approximative dans une pièce étroite ou encombrée.

Le plan permet aussi de saisir un repère et de le glisser à sa nouvelle place, à la souris ou au doigt. Enregistrer les changements avant de cliquer **Commencer les énigmes**. Avant ce départ explicite, le serveur refuse les actions de jeu. **Recommencer les deux énigmes** revient en préparation.

Sur téléphone en AR, après A/B, ouvrir **Jouer aux énigmes**, choisir l’élément à déplacer, saisir le jeton administrateur dans le champ de placement, viser le sol et toucher **Placer cet élément au viseur**. Le viseur doit disposer d’une position valide très récente. Chaque déplacement est validé et enregistré sur le serveur, puis partagé ; le jeton reste en mémoire de page et n’est pas journalisé. Cette commande est refusée si la partie a commencé ou si une révision a changé. Sur casque sans DOM Overlay, utiliser pour cette version le plan admin depuis un autre appareil ; la prise d’objet libre aux contrôleurs n’est pas implémentée.

Les éléments doivent être dans le contour, espacés d’au moins 60 cm et éloignés des obstacles déclarés. La proposition géométrique ne vérifie pas les passages réels : contrôler les positions et leur accessibilité. Une pièce trop petite ou encombrée peut être refusée. Pour modifier un obstacle qui recouvre un emplacement existant, déplacer cet emplacement ou retirer les énigmes avant le nouveau relevé.

Une modification de la pièce active ou un changement de pièce recommence la partie. **Recommencer les deux énigmes** conserve les placements. Les pièces et placements persistent ; la progression et l’autorisation de simulation restent en mémoire et sont réinitialisées au redémarrage du serveur.

## Tester en solo sur Chrome PC

Dans l’administration, cocher **Autoriser la simulation PC**. Dans la vue joueur, cocher **Simulation PC**. Utiliser **Aller à cet élément (test PC)**, puis le bouton de découverte ou de choix associé. Ce déplacement est virtuel et ne requiert pas WebXR. Désactiver l’autorisation après les essais.

Un joueur peut tout résoudre. Les autres reçoivent la progression commune ; une action sur une ancienne révision est refusée et l’état courant est renvoyé.

## Jouer en AR

Ouvrir la même origine HTTPS, démarrer immersive-ar et refaire A/B avec les mêmes repères physiques que pour le relevé. Les objets apparaissent dans ce repère manuel. Approcher à moins de 1,3 m horizontalement d’une balise, d’une carte, du coffre ou de la table pour agir.

Sur téléphone avec DOM Overlay, ouvrir **Jouer aux énigmes** et toucher les boutons. Sur casque, viser les panneaux des objets et utiliser la gâchette. Le texte d’aide apparaît également en 3D sans DOM Overlay. Les interactions sont suspendues pendant un brouillon de relevé. La simulation est désactivée pendant une session AR.

Le calibrage est local à chaque appareil, en mètres, avec alignement horizontal. Il ne constitue pas une ancre partagée. Le serveur valide coordonnées, révisions, proximité et règles à partir de la position déclarée par le client ; il ne prouve pas la présence physique et ne fournit pas de protection contre la triche. Les objets ne sont pas occultés automatiquement par le mobilier réel.

## Le coffre des quatre symboles

Trouver les quatre balises pour découvrir leurs symboles à toute l’équipe. Lire : « Le jour nourrit la forêt. Puis vient la nuit, et ses premières lumières. » S’approcher du **panneau mural des symboles**, puis choisir les éléments dans l’ordre : chaque choix remplit un des quatre logements. Sur téléphone, toucher les boutons du panneau de commande AR ; sur casque, viser les tuiles du panneau mural et utiliser la gâchette. Une erreur efface seulement la combinaison. La réussite retire la serrure, ouvre le coffre et donne accès au blackjack. Un son accompagne la réussite lorsque le navigateur a autorisé l’audio.

Le coffre comporte un corps creux avec planches et veinage de bois généré, un couvercle bombé articulé, des ferrures, rivets, poignées et une serrure. L’éclairage local sert la lisibilité ; il ne reproduit pas l’éclairage réel de la pièce.

Le panneau mesure environ 1 × 0,8 m et son centre est à 1,35 m du sol, orienté vers l’intérieur du mur déclaré. Il possède quatre logements numérotés et quatre tuiles illustrées (soleil, arbre, lune, étoile). La validation serveur exige d’être à moins de 1,3 m du panneau, au lieu du coffre.

Dans l’administration, sélectionner **Panneau mural des symboles**, puis cliquer/glisser sur le plan ou modifier X/Z. La position est rapprochée d’un segment mural libre, puis enregistrée avec la pièce. Le panneau peut aussi être déplacé au viseur pendant la préparation tactile AR : viser le sol près du mur souhaité. Il reste à hauteur fixe ; aucun glissement libre de tuiles aux contrôleurs n’est ajouté. Les ouvertures qui recouvrent sa zone et les obstacles déclarés sont exclus ; un mur doit mesurer au moins 1,2 m et la pièce au moins 1,8 m de haut. Le départ est refusé si aucun segment libre n’est disponible.

Les anciennes pièces avec neuf points d’énigmes restent compatibles : un panneau est proposé automatiquement sur un mur libre, sans modifier les neuf points. Son emplacement normalisé est stocké lors de la prochaine sauvegarde de la bibliothèque. Le panneau utilise les murs du modèle et ne détecte pas lui-même le mur physique.

## La table du dernier As

La main commence avec **As + 6**. Retrouver les trois cartes et leurs indices : quatre saisons, deux fois les saisons, et une couronne qui vaut dix. Choisir ensuite **une seule carte** à la table pour atteindre exactement 21. Les erreurs affichent le total et la valeur de l’As ; chaque essai repart de As + 6. La réussite révèle une clé virtuelle et le chiffre 7. Aucun pari ni argent réel.

<details><summary>Solutions pour l’organisateur</summary>

Soleil → Arbre → Lune → Étoile. Au blackjack, choisir le 4 : As (11) + 6 + 4 = 21. Avec 8, l’As passe à 1 et le total vaut 15 ; avec le Roi, il vaut 17.

</details>

## Vérifications et limites

Tests logiciels : schémas réseau, ordre des symboles, erreurs et reprise, calcul de l’As, proximité, révisions, simulation autorisée, stockage des placements et diffusion WebSocket aux quatre joueurs. Le parcours navigateur utilise des déplacements virtuels. Aucun essai physique sur téléphone, Quest 2, Quest 3 ou Quest 3S effectué par l’agent pour cette version. Le rendu et les interactions AR restent à valider sur ces appareils.
