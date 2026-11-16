# Journal de l'add-on

Depuis 0.1.2, ouvrir l'onglet Journal de MyRoom dans Home Assistant. Les événements Node sont des lignes JSON sur stdout avec timestamp UTC et event. Les accès HTTP Nginx et ses erreurs apparaissent aussi dans la sortie du conteneur.

- `server_started` : port réel, origine autorisée, capacité.
- `player_connected` : UUID de connexion, place 1–4, nombre de joueurs, adresse réseau, origine et navigateur déclaré.
- `player_disconnected` : identifiant, place, code WebSocket, raison et nombre de joueurs restants. Code 1006 : fermeture sans échange de clôture, par exemple une coupure réseau.
- `connection_rejected` : origine incorrecte, chemin incorrect ou salle complète.
- `puzzle_solve` : joueur, révision demandée, révision actuelle et acceptation.
- `invalid_message`, `rate_limit_exceeded`, `heartbeat_timeout`, `socket_error`, `server_error` : anomalies réseau ou protocole.

L'identifiant représente une connexion, pas une personne authentifiée ; un onglet supplémentaire ou une reconnexion crée une autre identité. Le navigateur déclaré n'identifie pas un modèle de casque de manière fiable. Derrière un proxy HTTPS externe, l'adresse affichée peut être celle du proxy. Le Nginx interne remplace X-Real-IP par l'adresse de son pair pour ne pas faire confiance à un en-tête fourni par un client.

Les événements applicatifs ne contiennent pas le corps des messages. Les accès Nginx contiennent les URL : ne pas y placer de secrets. Les logs ne confirment pas le démarrage d'une session AR ou l'accès à la caméra : ces événements restent locaux au navigateur. Aucun test physique HAOS ou Quest n'a été effectué pour cette version.
