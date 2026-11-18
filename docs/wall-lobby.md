# Accueil mural et mode pièces

Version 0.8.4 publiée : workflow GitHub réussi et image Linux ARM64 vérifiée. Aucune validation physique téléphone ou Quest effectuée par l'agent.

Après A/B, le menu Team Portal apparaît sur le mur validé du panneau existant, à hauteur fixe de 1,35 m. Il reste dans le repère de pièce et ne suit pas le regard. Les anciennes pièces et leur panneau restent lisibles ; pas de nouvelle ancre spatiale. Sans pièce active ou mur libre, utiliser **Mode pièces** dans la barre tactile pour relever la pièce avant d'obtenir un menu mural.

## Utilisation

- **Accueil** : démarrer le rituel, arrêter la session ou confirmer son propre passage accessible.
- **Aventures** : parcourir le catalogue versionné et sélectionner une aventure, avant le démarrage.
- **Paramètres** : choisir 1 à 4 joueurs, modifier les noms avec un clavier 3D A–Z/espace/effacement, confirmer explicitement la vérification physique du passage.
- **Mode pièces** : ouvrir les outils existants pour créer, modifier, importer, enregistrer ou annuler un relevé. La création de pièces demande toujours le calibrage. L'enregistrement et les corrections géométriques utilisent les contrôles et validations existants ; cet éditeur reste tactile/contrôleurs, pas une réécriture complète en outils 3D.

Sur Quest, sélectionner avec le rayon et la gâchette. Sur téléphone, orienter le téléphone vers un bouton du panneau puis toucher **Sélectionner au mur**, ou utiliser la sélection XR native si disponible. La page normale propose un **Aperçu du menu mural (PC / tactile)** avec les mêmes boutons et commandes.

Pour modifier les paramètres, saisir le jeton avec **Autoriser organisateur avant AR** avant d'entrer en session ; sur un navigateur avec DOM Overlay et clavier disponible, le bouton **Organisateur** permet aussi une saisie temporaire en AR. Sans clavier XR, l'autorisation préalable reste nécessaire. Le jeton est conservé uniquement en mémoire, sans URL ni stockage persistant. **Verrouiller** retire l'autorisation du menu et du relevé. La lecture publique n'expose que ID/titre/version des aventures et les noms ; les états administrateur et journaux restent protégés.

Les changements de groupe, aventure et noms se propagent via WebSocket. L'appareil organisateur relit aussi l'état administratif toutes les deux secondes pendant l'AR. Chaque commande relit la révision courante puis respecte les refus serveur ; elle ne répète pas automatiquement une commande refusée. Le mode pièces est interdit pendant une session active et un brouillon doit être enregistré ou annulé avant retour au jeu. Les positions d'énigmes et A/B restent conservés.

## Main virtuelle et écran allégé

Correction 0.8.6 : les commandes Prendre/Relâcher, Sélectionner au mur, Pièces/Jeu et Quitter AR sont dans une barre indépendante du panneau repliable. Elles restent accessibles avec DOM Overlay ; la prise agit dès le contact, sans double bascule sur le clic synthétique. Une pièce absente ou un serveur déconnecté produit une explication visible. Sans DOM Overlay, les commandes restent celles exposées nativement par le navigateur et les contrôleurs ; ce correctif ne peut pas imposer une interface DOM à un navigateur qui ne la fournit pas.

Les sources tactiles `screen` sont exclues des prises Quest même si elles annoncent un grip. Seules des entrées suivies `tracked-pointer` avec main/grip désactivent la main virtuelle automatique. Le bouton de prise est visible sur téléphone avant calibrage mais explique qu'il faut terminer A/B ; après calibrage, la main suit le téléphone à 55 cm devant lui. Il s'agit d'une simulation, pas d'un suivi optique.

Après calibrage, en mode jeu : croix et cible au sol masquées, HUD de diagnostic et outils de relevé retirés de l'écran. La barre tactile garde les commandes essentielles et un retour court. Le mode pièces réaffiche les outils de construction et la visée ; le menu mural reste présent dans l'accueil. Les énigmes retrouvent leur propre rendu après le vortex.

## Limites et vérifications

TypeScript, build et tests logiciels couvrent la sélection UV, le placement mural, le catalogue public et la distinction tactile/contrôleurs. L'aperçu Canvas a été vérifié dans Chrome local ; cela ne valide ni visibilité AR réelle, ni précision des rayons, ni lisibilité casque. Les essais matériels restent requis. Le menu utilise l'emplacement mural existant ; le placement physique du vortex et les ajustements fins restent disponibles dans l'administration existante. La confirmation du passage doit correspondre à une vérification réelle de l'organisateur.
