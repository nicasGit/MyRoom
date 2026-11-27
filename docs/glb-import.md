# Bibliothèque GLB et import par lot — 0.15.0

## Importer plusieurs objets

Depuis l’administration, ouvrir **Bibliothèque GLB** ou **Gérer la bibliothèque /
importer des GLB**. La page dédiée est `library.html`. Le jeton administrateur
est demandé sur cette page et reste en mémoire, sans stockage navigateur ou URL.
Le mode debug explicitement activé sur HAOS conserve son fonctionnement existant.

1. Sélectionner **jusqu’à dix fichiers GLB en une seule fois**.
2. Attendre le résultat de vérification de chaque fichier. Un fichier refusé ne
   bloque pas les autres. Décocher les modèles à ne pas importer.
3. **Prévisualiser** permet de tourner et zoomer sur chaque fichier valide avant
   tout enregistrement. Cette vérification ne stocke pas le fichier sur disque.
4. Saisir la source et la licence communes au lot et confirmer les droits
   d’utilisation et de redistribution, textures comprises. Séparer les lots si
   leurs licences diffèrent. MyRoom n’attribue pas automatiquement une licence CC0
   aux fichiers importés et ne vérifie pas les droits déclarés par l’utilisateur.
5. Cliquer **Confirmer l’import du lot**. Les fichiers sont envoyés successivement
   pour limiter la mémoire, sans sélection manuelle fichier par fichier.

Chaque ligne indique « Importé », « Déjà présent » ou l’erreur précise. Un import
partiel conserve ses réussites ; les fichiers en échec restent sélectionnables
pour une nouvelle tentative. Les doublons sont reconnus par SHA-256.

## Catalogue et fenêtre de configuration

Le catalogue réunit les modèles intégrés et importés, avec vignettes, recherche
par nom et filtre de catégorie. **Voir / modifier** ouvre une fenêtre avec aperçu
3D interactif et réglages : nom, catégorie, largeur/hauteur/profondeur en mètres,
nombre de mains, orientation initiale horizontale Y, manipulable par défaut,
source et licence. Les modèles intégrés sont en lecture seule ; leurs exemplaires
restent réglables depuis l’administration des pièces.

Les dimensions GLB sont initialement interprétées en mètres. Une source hors
limites est ramenée à un mètre de haut si ses proportions le permettent, sinon
elle est refusée. Vérifier les dimensions et le nombre de mains avant utilisation.
Les dimensions configurées des imports ajustent les trois axes du modèle.
L’orientation initiale Y définit le placement des prochains exemplaires.

**Ajouter à la pièce active** réutilise le placement et la sauvegarde existants,
hors session et sans objet tenu. Les modèles importés sont aussi disponibles
dans l’admin principale et dans le catalogue paginé du menu mural du casque.
Les règles de prise, de taille et de sauvegarde du mobilier restent identiques.

Chaque modification de fiche crée une version. Un exemplaire placé référence
explicitement sa version : modifier une fiche ne change ni la taille, ni le nombre
de mains, ni la position des anciens exemplaires. La progression des aventures
et le calibrage A/B restent séparés du catalogue. L’import et les fiches peuvent
être gérés pendant une partie ; ajouter des objets à la pièce reste réservé à
la préparation. Les anciennes pièces et les huit modèles intégrés sont conservés.

## Formats et limites

- GLB 2.0 statiques et autonomes, un seul tampon binaire intégré, 8 Mio par fichier.
- Maximum 100 000 sommets et 200 000 triangles par modèle ; scènes et nœuds bornés.
- Textures PNG/JPEG en `bufferView`, 2048 pixels par côté et 4 mégapixels cumulés.
- Pas de fichiers ou URI externes, y compris des URI `data:` ; pas d’animations,
  de skins, de morph targets ou de compression Draco/Meshopt/Basis nécessitant un décodeur.
- Extensions de matériaux et transformation UV courantes acceptées ; extensions
  inconnues refusées explicitement. Les modèles invalides ne sont pas publiés.
- Dimensions de fiche : largeur/profondeur 1 cm à 20 m, hauteur 1 cm à 6 m.
- Maximum 64 fichiers importés, 128 Mio au total et 256 versions de fiches.
- La suppression des modèles et des anciennes versions n’est pas proposée dans
  cette V1, afin de préserver les pièces qui les référencent.

Un GLB accepté n’est pas pour autant validé sur casque. Choisir des modèles simples
et des textures légères ; les comportements de casse, d’ouverture et les indices
ne sont pas déduits du fichier. Les objets restent incassables dans cette version.

## Stockage, API et déploiement

`DATA_DIR/models/catalog.json` contient un index versionné et ses révisions.
Les GLB inchangés sont stockés sous leur empreinte SHA-256 dans ce même dossier.
Fichier complet puis index sont publiés par remplacement atomique ; une erreur
avant publication de l’index ne modifie pas le catalogue en mémoire. Une panne
entre les deux peut laisser un fichier non référencé, qui n’est pas servi.
Les fichiers et versions ne sont pas supprimés pendant une migration.

Sur HAOS, le dossier se trouve dans `/data/models`. Sauvegarder **à la fois**
ce dossier et `/data/rooms.json` pour restaurer des pièces contenant des imports.
L’export JSON des pièces seul n’embarque pas leurs fichiers GLB. Le catalogue
est chargé avant les pièces au démarrage, pour résoudre leurs versions.

Les routes `POST /api/admin/models/inspect`, `import` et `update` réutilisent
authentification admin et contrôle d’origine. Inspection et import reçoivent
un corps binaire borné ; l’import comprend la licence et les droits confirmés.
Les métadonnées utilisent des révisions contre les modifications concurrentes.
`GET /api/library/catalog` et `GET /api/library/models/<sha256>.glb` sont publics
sur la même origine pour les joueurs ; ne pas importer de ressources confidentielles.
Les chemins sont générés côté serveur, sans réutiliser un chemin fourni par l’utilisateur.

Nginx et le proxy Vite exposent ces routes. Le Nginx de l’add-on accepte 8 Mio
uniquement sur les deux routes binaires, en conservant les limites des autres API.
Un proxy HTTPS supplémentaire doit également permettre ces requêtes ; un refus
413 du proxy est signalé à l’import. HTTPS/WSS et la cible HAOS aarch64 sont conservés.

Le client reçoit le catalogue versionné avec l’état partagé. Le chargeur GLB reste
commun aux trois modes et aux aperçus, avec un cache borné à huit sources. Les
fiches ne dupliquent aucune règle de coffre, blackjack ou autre énigme.

Les tests logiciels couvrent les formats, limites, références externes, cycles,
révisions, doublons, versions d’instances, persistance et API. Aucun essai physique
Quest ou iPad n’est annoncé pour cette version.


Les jaquettes acceptent jusqu'� 16 Mio c�t� serveur et proxy HAOS. Un HTTP 413 indique qu'un proxy externe conserve une limite inf�rieure.
