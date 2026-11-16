# Journal de l'add-on

Depuis 0.1.2, ouvrir l'onglet Journal de MyRoom dans Home Assistant. Les événements Node sont des lignes JSON sur stdout avec timestamp UTC et event. Les accès HTTP Nginx et ses erreurs apparaissent aussi dans la sortie du conteneur.

- `server_started` : port réel, origine autorisée, capacité.
- `player_connected` : UUID de connexion, place 1–4, nombre de joueurs, adresse réseau, origine et navigateur déclaré.
- `player_disconnected` : identifiant, place, code WebSocket, raison et nombre de joueurs restants. Code 1006 : fermeture sans échange de clôture, par exemple une coupure réseau.
- `connection_rejected` : origine incorrecte, chemin incorrect ou salle complète.
- `puzzle_solve` : joueur, révision demandée, révision actuelle et acceptation.
- `invalid_message`, `rate_limit_exceeded`, `heartbeat_timeout`, `socket_error`, `server_error` : anomalies réseau ou protocole.

L'identifiant représente une connexion, pas une personne authentifiée ; un onglet supplémentaire ou une reconnexion crée une autre identité. Le navigateur déclaré n'identifie pas un modèle de casque de manière fiable. Derrière un proxy HTTPS externe, l'adresse affichée peut être celle du proxy. Le Nginx interne remplace X-Real-IP par l'adresse de son pair pour ne pas faire confiance à un en-tête fourni par un client.

Depuis 0.1.5, `client_xr` contient des diagnostics déclarés par le navigateur : session demandée/démarrée/terminée, appui reçu, placement accepté/refusé, absence d'image XR et changements de suivi. Le serveur valide la liste des événements et les champs, puis associe lui-même l'identifiant et la place du joueur ; ces déclarations ne modifient pas l'état autoritaire de la salle et ne prouvent pas qu'un casque a été physiquement testé. Un accusé de réception est renvoyé au navigateur. Les événements sont visibles aussi dans le journal de l'administration. Voir [le diagnostic tactile](mobile-ar.md).

Les événements applicatifs ne contiennent pas les messages bruts ; les diagnostics XR incluent des coordonnées locales, motifs de refus et informations de suivi limitées. Les accès Nginx contiennent les URL : ne pas y placer de secrets. Aucun test physique HAOS, téléphone ou Quest n'a été effectué par l'agent pour cette version.
