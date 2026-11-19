# Modes d'affichage — 0.9.0

Les adaptateurs Virtual3D, CameraAR et QuestWebXR partagent AdventureClient,
les scènes d'énigmes et les commandes métier existantes. Les règles, le capitaine,
les révisions et les récompenses restent autoritaires sur le serveur.

## Administration

Dans Administration → Modes d'affichage, choisir le mode des prochaines connexions,
autoriser les changements et activer éventuellement la caméra expérimentale.
Enregistrer ne déplace pas les joueurs connectés et ne réinitialise pas la progression.
Les capacités affichées sont détectées puis déclarées par chaque navigateur ;
elles ne prouvent ni le modèle d'appareil ni la présence d'un suivi spatial fiable.

La politique versionnée est enregistrée dans `DATA_DIR/display-modes.json`, par
écriture temporaire et renommage atomique, avec validation stricte et révision.
Un fichier invalide est refusé sans être remplacé. La bibliothèque des pièces,
les placements et les sauvegardes d'aventure ne sont pas migrés.

## Simulation 3D

Sans WebXR ni caméra : choisir Simulation 3D. Une pièce doit être enregistrée et active.
Cliquer la scène pour lui donner le focus ; WASD/ZQSD/flèches ou joystick tactile
pour avancer, glisser pour regarder, cliquer/toucher pour interagir. Le menu mural
utilise les autorisations administrateur existantes. Les contrôles d'énigme existants
utilisent la position virtuelle et conservent les règles de proximité.
Approcher son bâton puis le toucher pour le saisir et le relâcher ; traverser le
vortex au joystick. Ce simulateur n'active pas le contournement administrateur des énigmes.

## Superposition caméra expérimentale

Activer la fonctionnalité dans l'administration, choisir Caméra AR puis appuyer sur
Activer la caméra. Aucune autorisation caméra n'est demandée au chargement ni au
simple choix du mode. Le flux vidéo reste local, sans audio ni transmission serveur.
Le libellé permanent est « Superposition caméra — sans ancrage spatial ».

Le joystick déplace la position **virtuelle**, sans relation mesurée avec les mouvements
du téléphone. Dans Placer la superposition, sélectionner un objet ou l'ensemble :
glisser pour déplacer, pincer pour l'échelle, tourner avec deux doigts pour la rotation.
Ces corrections visuelles sont locales, temporaires et distinctes des poses de jeu
partagées. Recentrer les efface. Sortir, masquer la page ou perdre la caméra coupe
les pistes ; une permission refusée, une lecture vidéo impossible ou une caméra
indisponible ramène en 3D. Le retour de sécurité reste possible même si les changements
ordinaires sont interdits. Une permission accordée tard après la sortie est aussi nettoyée.

La confirmation tactile du vortex est enregistrée `camera-confirmation` ; les poses
de ce mode ne déclenchent jamais automatiquement une traversée physique. Les autres
méthodes sont `virtual-crossing`, `physical-xr`, `accessible-confirmation`, `admin`
ou `simulation`. Changer de mode efface l'historique de poses pour ne pas combiner
deux méthodes. Une méthode indique l'entrée utilisée, pas une certification matérielle.

## Quest et limites

Quest WebXR réutilise le lancement natif, les mains, les contrôleurs et le calibrage
A/B existants. L'activation immersive doit suivre un geste utilisateur. Le calibrage
manuel n'est pas une ancre partagée. Les appareils peuvent coexister dans une session.

Chrome sur iPadOS dépend des capacités WebKit disponibles : contexte HTTPS reconnu,
getUserMedia et vidéo muted/playsinline sont nécessaires à la superposition. Il n'y a
aucune détection de murs, surfaces, profondeur ou ancrage. Les gestes tactiles reposent
sur Pointer Events. Aucun essai physique iPad, Android ou Quest n'a été effectué pour
cette livraison ; aucune compatibilité matérielle ni validation WebKit réelle annoncée.
Les tests logiciels couvrent politique persistante, refus et replis, flux vidéo simulés,
adaptateurs, méthodes de passage et blackjack réseau à modes mixtes.
