# Relevé Quest et édition des volumes — 0.10.0

Arrêtez la session, calibrez A/B et ouvrez le mode création de pièces.
Fermez le contour manuel ou utilisez « Importer le scan Quest ». L'import est
aussi disponible avec A/X. Un brouillon existant doit être enregistré ou annulé
avant un nouvel import.

Approchez une main d'un volume et pincez (ou pressez la poignée latérale) pour
le déplacer horizontalement. Prenez le même volume avec les deux mains puis
écartez-les selon chaque axe pour ajuster largeur, profondeur et hauteur.
Relâchez les deux mains pour confirmer dans le brouillon, puis enregistrez.
« Annuler la dernière modification » annule le dernier geste. La perte de suivi
annule le geste en cours. Les obstacles restent alignés sur A/B et posés au sol ;
leur rotation libre et les volumes suspendus ne sont pas représentés par ce format.
Un déplacement hors pièce ou incompatible avec un placement d'énigme est refusé.

Si `admin_token` est vide dans HAOS, l'enregistrement des pièces est autorisé
sans jeton, même sans `debug_without_admin_token`. Cette exception permet aussi
la mise à jour d'une pièce et son activation lors de la sauvegarde. Elle ne donne
pas accès aux autres commandes administrateur. Un jeton configuré reste requis.
Les contrôles d'origine HTTPS, de révision, de modèle et l'écriture atomique sont
conservés. Un portail actif doit être arrêté avant de changer de pièce.

## Ce que fournit le scan du Quest 3

Configurez d'abord l'espace dans le système Quest et autorisez l'accès aux données
spatiales. MyRoom demande les capacités facultatives `plane-detection` et
`mesh-detection`. Leur présence dépend du navigateur et des permissions, pas du
nom du casque. Le contour du sol doit être exploitable et contenir A et B.
Les plans horizontaux de meubles et les maillages de meubles étiquetés deviennent
des boîtes englobantes ; les doublons de plans et volumes sont fusionnés.
Un maillage global ou sans étiquette n'est pas transformé en obstacle arbitraire.

On peut donc importer, corriger les volumes avec les mains et enregistrer à la fin.
Cela ne garantit pas un relevé de tous les obstacles : petites chaises, objets
mobiles, portes et fenêtres peuvent manquer. MyRoom ne lance pas automatiquement
une reconstruction complète de l'environnement. Le calibrage A/B reste nécessaire
et ne constitue pas une ancre spatiale partagée.

Référence : [Scene understanding Meta](https://developers.meta.com/vr/documentation/iwsdk/guides/11-scene-understanding/).
Compilation et tests logiciels ne remplacent pas un essai physique sur Quest.
