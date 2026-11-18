# Prendre et déplacer les objets avec le Quest

Version 0.7.0 en préparation sur `feat/quest-two-hand-grabbing`, à partir de 0.6.0. Aucun essai physique sur casque annoncé.

Après calibrage A/B, approcher une main d’un objet (environ 15 cm de sa géométrie), puis pincer pouce/index. Avec les contrôleurs, maintenir la poignée latérale ; la gâchette conserve les actions d’énigme. Les mains suivies sont demandées via la capacité optionnelle `hand-tracking`, détectée à l’exécution. Les deux modes dépendent des sources d’entrée que le navigateur expose ; aucun modèle de Quest ne garantit la capacité.

- Balises et cartes historiques : une main.
- Coffre, table et panneau mural : mains gauche **et** droite, écartées d’au moins 12 cm, près du même objet. Maintenir les deux prises pendant le transport ; relâcher une prise pose l’objet à sa dernière pose valide.
- Translation en mètres et rotation horizontale, sans redimensionnement ni bascule. Le panneau se raccroche à un mur libre, à sa hauteur existante. Les murs et obstacles du relevé représentent la pièce physique : ils ne deviennent pas des objets de jeu à transporter.
- L’inscription **« Indice : le jour précède la forêt. »** apparaît à l’emplacement initial du coffre quand il est soulevé de plus de 25 cm ou écarté de plus de 45 cm. Elle se masque à nouveau quand il revient dessus.

## Pendant la partie

Les neuf objets de scène et le panneau utilisent un état de positions séparé du modèle enregistré et de la progression. Le serveur partage leurs poses sans remise à zéro du coffre ou du blackjack. Les validations de proximité utilisent les nouvelles positions. Une prise appartient à une seule connexion ; une connexion porte un seul objet de scène. Déconnexion, suivi perdu, annulation ou expiration de quatre secondes sans mise à jour rendent sa position précédente à l’objet. Les mises à jour sont limitées à environ quatre/cinq par seconde, avec une limite réseau séparée des actions d’énigme, et sans log à chaque image.

Les cartes du blackjack hybride conservent les réservations et trois logements de leur module : une main sélectionne une carte, son aperçu suit cette main localement, puis relâcher à moins de 30 cm d’un logement libre la dépose. Relâcher ailleurs la remet en réserve. La réservation dure 15 secondes et les dépôts sont partagés ; la pose intermédiaire de la carte portée reste locale. Les règles, révisions et récompenses ne sont pas contournées.

## Enregistrer la disposition

Les déplacements de partie sont en mémoire. Pour en faire la disposition de la pièce : arrêter la partie, relâcher tous les objets, puis cliquer dans l’administration **Enregistrer les objets déplacés dans la pièce**. Jeton, origine, révision de bibliothèque et révision des objets sont vérifiés. Une sauvegarde réinitialise la préparation comme les autres modifications du modèle.

Le format existant garde ses neuf points X/Z et ajoute facultativement `puzzles.poses` (hauteur de base et rotation horizontale par objet). Les anciennes pièces restent lisibles. Les hauteurs permettent de poser un objet au-dessus d’un obstacle/table relevé, sans l’insérer dans son volume. La sauvegarde conserve les contrôles d’espacement et de contour ; elle peut refuser une disposition de jeu trop serrée. Aucune ancienne pièce n’est supprimée.

## Limites de validation

Les coordonnées et le nombre de prises sont déclarés par le client : ils ne prouvent pas une présence physique. Le serveur vérifie les types, bornes, proximité déclarée, deux points distincts pour un gros objet, propriétaire, bail, séquence monotone, hauteur, contour, obstacles et vitesse par mise à jour. Il ne simule ni gravité ni collisions complètes des volumes ; vérifier les passages et meubles réels. A/B reste un repère manuel commun, sans ancre partagée.

Références primaires : [WebXR Hand Input](https://www.w3.org/TR/webxr-hand-input-1/) et [événements de saisie WebXR](https://www.w3.org/TR/webxr/). Les tests logiciels et poses synthétiques ne remplacent pas un essai physique sur Quest 2, Quest 3 ou Quest 3S.
