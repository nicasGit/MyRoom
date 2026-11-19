# Bâtons et panneaux Quest — 0.10.1

## Bâtons libres et vortex — 0.11.0

Gardez une main fermée sur votre bâton pour le déplacer, l'incliner ou le retourner.
Il suit la rotation complète de la main ou manette, visible par les autres joueurs.
Vous pouvez continuer à le manipuler pendant l'attente du groupe, y compris après
votre passage, tant que l'introduction est active. Relâcher le pose ; il n'y a pas de
lancer, de gravité ou de collision physique complète. Les limites de déplacement et
l'attribution du bâton à votre place restent vérifiées côté serveur.

Le vortex affiche un tourbillon bleu/cyan avec un tunnel visuel et des particules.
Son ouverture reste déclenchée par la première prise ; l'aventure attend toujours
les passages du groupe. Cet effet ne montre pas encore les joueurs d'un autre
univers à travers le portail. Validation sur Quest physique encore nécessaire.

## Préparation simplifiée — 0.10.3

Dans Paramètres du menu mural, choisissez le nombre de joueurs. Si un ancien
placement du portail est hors de la pièce, utilisez « Adapter le portail à la pièce ».
MyRoom propose un couloir tenant compte du contour et des obstacles enregistrés,
avec assez de place pour les bâtons du groupe. Vérifiez vous-même le passage réel,
puis utilisez « Confirmer espace physique ». Cette confirmation n'est jamais faite
automatiquement. Si la recherche échoue, corrigez le relevé ou réduisez le groupe.

Au démarrage, les emplacements des énigmes sont proposés et enregistrés lorsqu'ils
manquent. Les placements déjà sauvegardés restent conservés ; vous pouvez ensuite
les ajuster via les outils existants. Les mains aux manettes utilisent la gâchette
pour l'index, la poignée pour les autres doigts et les contacts disponibles pour le
pouce. C'est une animation simulée ; les manettes ne mesurent pas les articulations.

Après mise à jour, fermez puis rouvrez MyRoom et vérifiez la version du client.
Terminez A/B et quittez le mode création de pièces avant de jouer.

L'organisateur confirme l'espace puis démarre le rituel dans le menu d'accueil.
Chaque place possède son propre bâton, signalé « (vous) ». Approchez la main du
corps du bâton, pincez ou maintenez la poignée latérale. La gâchette fonctionne
également pendant l'introduction. Gardez la prise pour déplacer, relâchez pour poser.
Une main suffit. Les signaux natifs de sélection complètent les boutons de manette
et la mesure de pince ; ils n'autorisent pas de prendre un bâton à distance.
Le serveur exige toujours un joueur présent avec suivi récent et son propre bâton.
Le portail s'ouvre après la première attribution, conformément au rituel existant.

Pour rapprocher un panneau : visez-le avec le rayon puis maintenez la poignée
latérale, ou pincez avec une main suivie. À huit mètres maximum, le panneau vient
à environ 85 cm, face à vous ; déplacez la main et relâchez pour le poser.
Utilisez ensuite la gâchette pour les boutons. Une courte protection après le
relâchement évite un clic involontaire. Une main proche d'un objet manipulable
garde sa priorité sur un panneau visé derrière. Le même geste fonctionne pour
le panneau des outils de création de pièces. Son placement reste local à cet
appareil, sans changer les murs enregistrés ni l'état de l'aventure.

Les mains simulées sont inclinées de 30° supplémentaires vers le bas ; les vraies
mains suivies conservent les articulations mesurées par WebXR.
Les quatre modèles de bâtons et leurs licences sont décrits dans
[les crédits](../client/public/models/staffs/README.md).
Les contrôles logiciels et le chargement sur Chrome PC ne valident pas les
interactions réelles sur Quest ; celles-ci nécessitent un essai matériel.
