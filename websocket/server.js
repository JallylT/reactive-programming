const WebSocket = require('ws');

// Création du serveur WebSocket sur le port 8080
const wss = new WebSocket.Server({ port: 8080 });

console.log('Serveur WebSocket en écoute sur le port 8080...');

// Gestion des salons
const rooms = new Map(); // Map<roomName, Set<ws>>
const availableRooms = new Set(['Général', 'Jeux', 'Détente']); // Salons par défaut

// Fonction pour broadcast la liste des salons à tous les clients
function broadcastRoomList(newRoom = null) {
    const roomList = Array.from(availableRooms);
    wss.clients.forEach(function each(client) {
        if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify({
                type: 'roomList',
                rooms: roomList,
                newRoom: newRoom // Indiquer quel salon vient d'être créé
            }));
        }
    });
}

// Gestion des nouvelles connexions
wss.on('connection', function connection(ws) {
    console.log('Nouveau client connecté');

    // Propriétés du client
    ws.username = null; // Stocke le username chiffré
    ws.room = null;
    ws.isAuthenticated = false;
    
    // Envoyer la liste des salons au nouveau client
    ws.send(JSON.stringify({
        type: 'roomList',
        rooms: Array.from(availableRooms)
    }));

    // Gestion des messages reçus du client
    ws.on('message', function incoming(data) {
        try {
            const messageData = JSON.parse(data);

            // Gestion de la création de salon
            if (messageData.type === 'createRoom') {
                const roomName = messageData.roomName.trim();
                
                if (roomName.length === 0) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Le nom du salon ne peut pas être vide.'
                    }));
                    return;
                }
                
                if (availableRooms.has(roomName)) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Ce salon existe déjà.'
                    }));
                    return;
                }
                
                availableRooms.add(roomName);
                broadcastRoomList(roomName); // Envoyer le nom du nouveau salon
                
                console.log(`Nouveau salon créé: ${roomName}`);
                return;
            }

            // Si l'utilisateur n'est pas encore authentifié, traiter le pseudonyme et le salon
            if (!ws.isAuthenticated && messageData.type === 'join') {
                const encryptedUsername = messageData.encryptedUsername; // Username chiffré
                const roomName = messageData.room;

                // Vérifier si le salon existe
                if (!availableRooms.has(roomName)) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Ce salon n\'existe pas.'
                    }));
                    return;
                }

                // Note: On ne peut pas vérifier l'unicité du username car il est chiffré
                // Chaque client aura son propre username chiffré unique

                // Assigner le username chiffré et le salon
                ws.username = encryptedUsername;
                ws.room = roomName;
                ws.isAuthenticated = true;

                // Initialiser le salon s'il n'existe pas dans la Map
                if (!rooms.has(roomName)) {
                    rooms.set(roomName, new Set());
                }
                
                // Ajouter le client au salon
                rooms.get(roomName).add(ws);

                console.log(`Utilisateur connecté au salon: ${roomName}`);

                // Confirmer l'authentification
                ws.send(JSON.stringify({
                    type: 'authenticated',
                    room: roomName
                }));

                // Notifier les autres utilisateurs du même salon (message chiffré)
                rooms.get(roomName).forEach(function each(client) {
                    if (client !== ws && client.readyState === WebSocket.OPEN && client.isAuthenticated) {
                        client.send(JSON.stringify({
                            type: 'system',
                            encryptedMessage: messageData.joinMessage, // Message chiffré
                            timestamp: new Date().toLocaleTimeString()
                        }));
                    }
                });

                return;
            }

            // Si l'utilisateur n'est pas authentifié et essaie d'envoyer un message
            if (!ws.isAuthenticated) {
                ws.send(JSON.stringify({
                    type: 'error',
                    message: 'Vous devez d\'abord rejoindre un salon.'
                }));
                return;
            }

            // Traitement des messages normaux (chiffrés)
            if (messageData.type === 'message') {
                console.log(`Message dans le salon ${ws.room}`);

                // Broadcast du message chiffré uniquement aux clients du même salon
                const roomClients = rooms.get(ws.room);
                if (roomClients) {
                    roomClients.forEach(function each(client) {
                        if (client.readyState === WebSocket.OPEN && client.isAuthenticated) {
                            client.send(JSON.stringify({
                                type: 'message',
                                encryptedMessage: messageData.encryptedMessage, // Message chiffré
                                encryptedUsername: ws.username, // Username chiffré
                                timestamp: new Date().toLocaleTimeString()
                            }));
                        }
                    });
                }
            }
        } catch (error) {
            console.error('Erreur lors du traitement du message:', error);
        }
    });

    // Gestion de la déconnexion
    ws.on('close', function close() {
        if (ws.isAuthenticated && ws.room) {
            console.log(`Client déconnecté du salon: ${ws.room}`);

            // Retirer le client du salon
            const roomClients = rooms.get(ws.room);
            if (roomClients) {
                roomClients.delete(ws);
                
                // Notifier les autres utilisateurs du même salon (message chiffré si fourni)
                roomClients.forEach(function each(client) {
                    if (client.readyState === WebSocket.OPEN && client.isAuthenticated) {
                        client.send(JSON.stringify({
                            type: 'userLeft',
                            encryptedUsername: ws.username,
                            timestamp: new Date().toLocaleTimeString()
                        }));
                    }
                });
                
                // Supprimer le salon s'il est vide
                if (roomClients.size === 0) {
                    rooms.delete(ws.room);
                }
            }
        } else {
            console.log('Client déconnecté');
        }
    });

    // Gestion des erreurs
    ws.on('error', function error(err) {
        console.error('Erreur WebSocket:', err);
    });
});

// Gestion des erreurs du serveur
wss.on('error', function error(err) {
    console.error('Erreur du serveur WebSocket:', err);
});