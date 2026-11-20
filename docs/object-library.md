# Bibliothèque d’objets — première version 0.14.0

## Utilisation

Dans l’administration, activer une pièce, arrêter la partie puis ouvrir
**Bibliothèque d’objets**. Depuis 0.14.1, chaque carte du catalogue affiche un aperçu 3D du modèle avant
ajout. Les images sont calculées localement une seule fois quand le catalogue
devient visible, avec un seul contexte WebGL temporaire puis libéré ; pas de
caméra ni de WebXR requis. En cas d’échec, les commandes restent disponibles.

Huit modèles Kenney sont disponibles : table, chaise,
bureau, lit, armoire, lampe, livres et plante. **Ajouter** choisit une position
libre au sol dans la pièce et enregistre immédiatement l’objet sur le serveur.
Si aucun emplacement ne convient, l’ajout est refusé sans modifier la pièce.

Sélectionner un objet pour changer son nom, sa position X/Y/Z en mètres, sa
rotation horizontale, sa taille uniforme ou son caractère fixe/manipulable.
**Enregistrer cet objet** valide la transformation complète côté serveur.
Supprimer demande confirmation. Le plafond et les murs limitent les dimensions.

Dans le casque : **Accueil → Bibliothèque d’objets**. Ajouter un modèle, ouvrir
**Objets de la pièce**, puis sélectionner l’instance pour changer sa taille,
rotation ou caractère fixe/manipulable. Suppression avec confirmation dans le
panneau. Le menu peut toujours être rapproché avec la prise à distance existante.
Les outils de bibliothèque utilisent la pièce enregistrée ; finir ou annuler un
brouillon de relevé avant de les utiliser.

Prendre les meubles avec deux mains et les petits objets avec une main. Pour
redimensionner, saisir avec les deux mains dès le début puis les écarter ou les
rapprocher progressivement. Les petits objets peuvent aussi être saisis avec
deux mains. Le mouvement conserve une rotation horizontale, sans basculement.
Perte de suivi, expiration du bail ou déconnexion annulent la prise et restaurent
sa pose initiale. Les objets fixes refusent la prise côté serveur.

Dans le simulateur PC/tactile : s’approcher au joystick/clavier, cliquer/toucher
un objet manipulable puis se déplacer pour le porter ; **Poser l’objet** relâche.
Les deux mains nécessaires aux meubles sont simulées explicitement. Les réglages
numériques de l’admin permettent aussi un placement précis sans casque.

Les déplacements en jeu sont partagés mais ne s’enregistrent pas automatiquement
sur disque. Arrêter la session, relâcher les objets, puis choisir **Enregistrer
les placements** dans le casque ou **Enregistrer les objets déplacés** dans la
bibliothèque admin. Un ajout ou une modification conserve également les poses
courantes des autres objets de bibliothèque. Les transitions du portail et des
énigmes ne déplacent pas le mobilier. Une modification du catalogue de la pièce
ne réinitialise pas la progression, le portail ou le calibrage A/B.

## Format et extension

[Le catalogue](../server/src/object-library.ts) contient un pack versionné et
des définitions indépendantes des énigmes : ID stable, catégorie, chemin GLB
local, dimensions en mètres et nombre de mains. Ajouter un modèle consiste à
ajouter sa définition et son fichier local, conserver sa licence et vérifier
les dimensions. Les huit entrées initiales sont rendues avec le même chargeur.
Il n’y a pas encore d’importateur de packs depuis l’interface : les prochains
packs s’ajouteront au catalogue livré avec l’application.

Chaque pièce possède facultativement `objects: { version: 1, items: [...] }`.
Une instance contient `id`, `asset`, `name`, `movable` et une `pose` composée de
`x`, `y`, `z`, `yaw`, `scale`. Maximum 32 objets par pièce, taille ×0,1 à ×3.
La bibliothèque historique reste en version 1 ; les pièces sans `objects`
restent lisibles sans réécriture ni suppression. Les neuf emplacements d’énigmes
ne sont pas réutilisés pour le mobilier.

Les objets utilisent les identifiants réseau `prop:<id>`, le repère A/B en mètres,
les baux exclusifs existants et des règles de prise transmises par le serveur.
Positions et échelles courantes vivent dans `ObjectManipulation`, séparées des
placements persistants et de l’état des énigmes. Les données réseau sont validées,
les commandes répétées/périmées refusées et les réponses explicites.

`POST /api/admin/rooms/objects` réutilise la sécurité admin, l’origine autorisée,
les révisions de bibliothèque et d’objets. Actions `add`, `update`, `remove`,
`save`. Modification uniquement hors session et sans objet tenu. Le serveur
normalise le modèle complet puis réutilise les écritures atomiques de RoomStore
dans `DATA_DIR/rooms.json` (`/data` sur HAOS). Aucun chemin ou script externe
n’est accepté depuis les clients. L’export existant des pièces inclut les objets.

## Licences et limites

Source et licence CC0 vérifiées sur la [page officielle Kenney](https://kenney.nl/assets/furniture-kit).
L’archive utilisée provient d’un miroir, avec empreinte vérifiée et licence
originale conservée. Les modèles et leurs empreintes sont décrits dans
[SOURCE.md](../client/public/models/library/kenney-furniture/SOURCE.md).
Tous les modèles sont servis localement, y compris sur HAOS aarch64.

Cette version fournit des objets **incassables**, sans simulation physique,
tiroirs/portes animés, interrupteurs fonctionnels, lampe UV ou liens d’indices.
La lampe est un modèle décoratif. Les objets peuvent se chevaucher après un
placement manuel ; ils ne deviennent pas automatiquement des obstacles du relevé
ni des protections physiques. Le rattachement des objets à des puzzles, les
déclencheurs sans code et les indices cachés seront ajoutés progressivement.
Les règles du coffre et du blackjack ne changent pas.

Les vérifications logicielles couvrent schémas, anciens modèles, persistance,
prises, redimensionnement, révisions, déconnexions, modèles GLB et deux clients
réseau. Elles ne constituent pas un essai physique Quest ou iPad.
