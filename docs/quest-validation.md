# Validation matérielle à effectuer

Statut initial : aucun essai sur Quest 2, Quest 3 ou Quest 3S.

Pour chaque modèle, relever la version système, la version du navigateur, l'URL et la date, puis vérifier :

- Certificat HTTPS reconnu, diagnostic WebXR et disponibilité immersive-ar.
- Autorisations et entrée/sortie AR ; erreur lisible si local-floor est refusé.
- Quatre joueurs simultanés, cinquième refusé, départ, reconnexion et place libérée.
- Même énigme et révision sur tous les clients ; résolution simultanée sans double mutation.
- Repères A/B identiques, au sol, séparés de 1 à 2 m ; mesure de l'écart d'alignement à plusieurs endroits de la pièce.
- Recentrage et fin de session : calibrage invalidé puis refait.
- Perte Wi-Fi, casque en veille, redémarrage serveur et absence de persistance annoncée.

Le rayon suppose un sol local y=0 correctement estimé. Ne pas utiliser ce prototype pour guider des déplacements : les limites physiques de la pièce restent celles du système de sécurité du casque. Une interface XR pour les instructions, la confirmation visuelle des deux repères et l'écart de calibrage reste à développer.
