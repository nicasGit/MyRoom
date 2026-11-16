# Bibliothèque de pièces 3D — 0.2.0

## Construire une pièce manuellement

1. Configurer un jeton administrateur d'au moins 16 caractères dans HAOS. Sur la page joueur, le saisir dans le champ dédié avant de démarrer l'AR. Le jeton est gardé uniquement en mémoire pour la session de page ; il ne fait pas partie des modèles enregistrés. Utiliser HTTPS.
2. Choisir deux repères physiques A/B durables pour cette pièce et effectuer le calibrage. Tous les appareils devront réutiliser ces mêmes repères, dans le même ordre, à chaque session. Noter ou marquer physiquement leur position ; le modèle ne les reconnaît pas automatiquement.
3. Dans le panneau AR, toucher **Nouvelle pièce**. Saisir un nom et la **hauteur mesurée des murs**. La valeur initiale 2,5 m est une valeur proposée à remplacer par la mesure réelle.
4. Viser chaque coin au sol et utiliser le bouton de placement, dans l'ordre autour de la pièce. Placer de 3 à 32 coins sans croiser le contour, puis **Fermer le contour**. Les murs sont verticaux et tous de la hauteur saisie.
5. Pour chaque obstacle, saisir son nom et sa hauteur mesurée, puis **Ajouter un obstacle**. Placer deux coins opposés de son empreinte au sol. Le volume créé est une boîte alignée sur les axes A/B, pas une reconnaissance d'objet. Utiliser plusieurs boîtes si nécessaire pour une forme plus complexe. L'obstacle doit rester dans la pièce et sous la hauteur des murs. Maximum : 32 obstacles.
6. **Annuler le dernier élément** retire le dernier coin, le premier coin d'un obstacle en cours, ou le dernier obstacle selon l'étape. **Annuler le relevé** abandonne le brouillon sans supprimer une pièce enregistrée.
7. **Enregistrer et activer** valide le modèle côté serveur, l'écrit sur disque et l'active pour les joueurs. Attendre la confirmation d'enregistrement avant de quitter l'AR. Une erreur réseau, un jeton invalide ou un conflit laisse le brouillon sur l'appareil tant que la session et la page restent actives. En cas de délai réseau, vérifier la bibliothèque admin : le serveur peut avoir reçu l'enregistrement sans que la réponse soit parvenue au téléphone.

Le brouillon d'une nouvelle pièce ne remplace pas l'ancienne tant qu'il n'est pas enregistré. **Modifier la pièce active** permet de changer son nom, sa hauteur et ses obstacles ; un nouveau contour se relève actuellement dans une nouvelle fiche. Après calibrage, la pièce active enregistrée se superpose en filaire/transparence à la caméra.

## Portes et fenêtres (0.2.2)

Après avoir fermé le contour, ou via **Modifier la pièce active**, ouvrir **Portes et fenêtres**. Choisir le mur : « coin 1 → 2 » suit l’ordre du relevé et le dernier mur revient au premier coin. Saisir le type, le nom, la largeur et la hauteur en mètres. La distance est mesurée depuis le premier coin du mur jusqu’au bord de l’ouverture. Une porte commence au sol ; pour une fenêtre, saisir aussi la hauteur de son bas au-dessus du sol.

**Ajouter l’ouverture** utilise les mesures saisies. Pour la positionner par visée, saisir d’abord ses dimensions, toucher **Viser son centre au sol**, puis placer le viseur au sol au pied du centre de l’ouverture sur le mur choisi et utiliser le bouton de placement. La position est projetée sur ce mur ; une visée éloignée de plus de 50 cm est refusée. La hauteur n’est pas mesurée automatiquement.

Les ouvertures doivent tenir entièrement dans le mur, sans chevauchement. Maximum : 32 par pièce. Leur contour est vert pour une porte, jaune pour une fenêtre ; le mur est découpé dans l’aperçu et en AR. **Retirer** supprime une ouverture du brouillon ; **Enregistrer et activer** conserve toutes les modifications sur le serveur. Les anciennes pièces restent lisibles avec une liste d’ouvertures vide. Chaque ouverture stocke le mur, la distance au coin, les dimensions et la hauteur du bas. Pas de vantail animé, vitrage, collision ou détection automatique d’ouverture.

## Plusieurs pièces

L'administration affiche une bibliothèque de **20 pièces maximum**, leur surface, hauteur et nombre d'obstacles. **Activer** sélectionne une seule pièce pour la salle multijoueur ; cela ne crée pas plusieurs parties simultanées. Les clients présents reçoivent le modèle actif. Une activation avec changement d'identifiant invalide leur calibrage : ils doivent refaire A/B dans la pièce physique correspondante. Enregistrer son propre relevé conserve le calibrage de cet appareil.

**Supprimer** demande confirmation et efface la fiche du serveur. Supprimer la pièce active désactive son modèle. **Exporter la bibliothèque** télécharge un fichier JSON de sauvegarde. L'import graphique n'est pas encore implémenté. L'aperçu 3D se tourne et se zoome à la souris ou au toucher, y compris sur ordinateur sans WebXR.

## Persistance et restauration

Dans HAOS, `DATA_DIR=/data/myroom` et le fichier est **/data/myroom/rooms.json**. Le dossier /data est le stockage persistant de l'add-on ; un redémarrage ou une mise à jour de son image conserve les fichiers. Prévoir une sauvegarde Home Assistant incluant les données de l'add-on avant toute désinstallation ou réinstallation. Le fichier contient la bibliothèque, la pièce active et la révision ; les jetons, connexions et énigmes n'y sont pas enregistrés.

En développement, la valeur par défaut est le dossier `data` du serveur (généralement `server/data` via les scripts npm). On peut définir `DATA_DIR` explicitement. Pour restaurer manuellement, arrêter le serveur, sauvegarder son fichier actuel, remplacer rooms.json par une exportation valide, puis redémarrer. Ne pas modifier le fichier pendant l'exécution.

Chaque écriture est préparée dans rooms.json.tmp puis renommée avant de remplacer l'état en mémoire. Une erreur d'écriture ne confirme pas la sauvegarde. Un fichier corrompu est refusé au démarrage plutôt que remplacé par une bibliothèque vide : consulter le journal et restaurer une copie valide. Les changements utilisent une révision globale pour éviter qu'un ancien appareil écrase une modification plus récente.

## Limites

Reconstruction **manuelle simplifiée**, sans textures, scan automatique, détection de meubles, plafond irrégulier, ancrage partagé ou occlusion réelle. Les portes et fenêtres sont des ouvertures rectangulaires saisies manuellement. Les obstacles reposent sur le sol et sont alignés sur les axes A/B. La précision dépend de local-floor, du suivi, des repères et des mesures saisies. Le modèle n'est pas un système de détection d'obstacles ni une limite de sécurité pour les déplacements.

Aucun essai de ce relevé 3D sur téléphone, HAOS/Raspberry Pi ou Quest n'a été effectué par l'agent. Le retour utilisateur de la version 0.1.6 confirme le placement A/B sur son téléphone, pas cette nouvelle reconstruction 3D.
