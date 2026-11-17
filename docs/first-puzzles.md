# Les deux premières énigmes — 0.4.0

## Préparer une pièce

Dans l’administration, activer une pièce enregistrée puis ouvrir **Les deux énigmes AR**. Cliquer **Proposer des positions**, sélectionner chaque élément et ajuster sa position par clic sur le plan ou avec X/Z en mètres. Cliquer **Enregistrer les placements**. Les neuf emplacements sont conservés dans la bibliothèque du serveur, indépendamment pour chaque pièce.

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

Trouver les quatre balises pour découvrir leurs symboles à toute l’équipe. Lire : « Le jour nourrit la forêt. Puis vient la nuit, et ses premières lumières. » Entrer les symboles au coffre. Une erreur efface seulement la combinaison. La réussite ouvre le coffre animé et donne accès au blackjack. Un son accompagne la réussite lorsque le navigateur a autorisé l’audio.

## La table du dernier As

La main commence avec **As + 6**. Retrouver les trois cartes et leurs indices : quatre saisons, deux fois les saisons, et une couronne qui vaut dix. Choisir ensuite **une seule carte** à la table pour atteindre exactement 21. Les erreurs affichent le total et la valeur de l’As ; chaque essai repart de As + 6. La réussite révèle une clé virtuelle et le chiffre 7. Aucun pari ni argent réel.

<details><summary>Solutions pour l’organisateur</summary>

Soleil → Arbre → Lune → Étoile. Au blackjack, choisir le 4 : As (11) + 6 + 4 = 21. Avec 8, l’As passe à 1 et le total vaut 15 ; avec le Roi, il vaut 17.

</details>

## Vérifications et limites

Tests logiciels : schémas réseau, ordre des symboles, erreurs et reprise, calcul de l’As, proximité, révisions, simulation autorisée, stockage des placements et diffusion WebSocket aux quatre joueurs. Le parcours navigateur utilise des déplacements virtuels. Aucun essai physique sur téléphone, Quest 2, Quest 3 ou Quest 3S effectué par l’agent pour cette version. Le rendu et les interactions AR restent à valider sur ces appareils.
