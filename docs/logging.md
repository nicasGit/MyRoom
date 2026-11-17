# Journal de l'add-on

Depuis 0.1.2, ouvrir l'onglet Journal de MyRoom dans Home Assistant. Les événements Node sont des lignes JSON sur stdout avec timestamp UTC et event. Les accès HTTP Nginx et ses erreurs apparaissent aussi dans la sortie du conteneur.

- `server_started` : port réel, origine autorisée, capacité.
- `player_connected` : UUID de connexion, place 1–4, nombre de joueurs, adresse réseau, origine et navigateur déclaré.
- `player_disconnected` : identifiant, place, code WebSocket, raison et nombre de joueurs restants. Code 1006 : fermeture sans échange de clôture, par exemple une coupure réseau.
- `connection_rejected` : origine incorrecte, chemin incorrect ou salle complète.
- `puzzle_solve` : joueur, révision demandée, révision actuelle et acceptation.
- `invalid_message`, `rate_limit_exceeded`, `heartbeat_timeout`, `socket_error`, `server_error` : anomalies réseau ou protocole.
- Depuis 0.2.0 : `room_library_changed` indique une sauvegarde, activation ou suppression persistée (révision et nombre de pièces). `room_library_error` indique un modèle refusé, un conflit ou une erreur d'écriture. Le démarrage affiche le nombre de pièces chargées et le nom de la pièce active.

L'identifiant représente une connexion, pas une personne authentifiée ; un onglet supplémentaire ou une reconnexion crée une autre identité. Le navigateur déclaré n'identifie pas un modèle de casque de manière fiable. Derrière un proxy HTTPS externe, l'adresse affichée peut être celle du proxy. Le Nginx interne remplace X-Real-IP par l'adresse de son pair pour ne pas faire confiance à un en-tête fourni par un client.

Depuis 0.1.5, `client_xr` contient des diagnostics déclarés par le navigateur : session demandée/démarrée/terminée, appui reçu, placement accepté/refusé, absence d'image XR et changements de suivi. Le serveur valide la liste des événements et les champs, puis associe lui-même l'identifiant et la place du joueur ; ces déclarations ne modifient pas l'état autoritaire de la salle et ne prouvent pas qu'un casque a été physiquement testé. Un accusé de réception est renvoyé au navigateur. Les événements sont visibles aussi dans le journal de l'administration. Voir [le diagnostic tactile](mobile-ar.md).

Depuis 0.3.4, les changements de suivi `tracking_changed` ne sont plus émis par le client. Le serveur accuse réception de ceux des anciennes pages, mais les exclut de stdout et du tampon d’administration. Le viseur, les messages de visée et le suivi restent actifs. Les anciennes lignes déjà présentes dans le journal HAOS ne sont pas effacées ; le filtrage concerne les nouveaux événements. Depuis 0.3.3, les demandes, succès et échecs d’enregistrement de pièce apparaissent sous `survey_save_requested`, `survey_save_succeeded` et `survey_save_failed`, sans jeton.

Les événements applicatifs ne contiennent pas les messages bruts ; les diagnostics XR incluent des coordonnées locales, motifs de refus et informations de suivi limitées. Les accès Nginx contiennent les URL : ne pas y placer de secrets. Aucun test physique HAOS, téléphone ou Quest n'a été effectué par l'agent pour cette version.
