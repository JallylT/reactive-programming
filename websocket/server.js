const WebSocket = require('ws');

// Création du serveur WebSocket sur le port 8080
const wss = new WebSocket.Server({ port: 8080 });

console.log('Serveur WebSocket en écoute sur le port 8080...');

// Gestion des salons
const rooms = new Map(); // Map<roomName, Set<ws>>
const availableRooms = new Set(['Général']); // Salon par défaut
const roomPasswords = new Map(); // Map<roomName, hashedPassword> - pour les salons privés
const roomTimers = new Map(); // Map<roomName, timeoutId> - pour supprimer les salons vides

// Fonction pour démarrer le timer de suppression d'un salon vide
function startRoomDeletionTimer(roomName) {
    // Ne pas supprimer le salon par défaut "Général"
    if (roomName === 'Général') return;
    
    // Annuler le timer existant s'il y en a un
    if (roomTimers.has(roomName)) {
        clearTimeout(roomTimers.get(roomName));
    }
    
    // Démarrer un nouveau timer de 1 minute (60000 ms)
    const timerId = setTimeout(() => {
        const roomClients = rooms.get(roomName);
        
        // Vérifier que le salon est toujours vide
        if (!roomClients || roomClients.size === 0) {
            console.log(`⏰ Suppression du salon vide: ${roomName}`);
            
            // Supprimer le salon
            availableRooms.delete(roomName);
            rooms.delete(roomName);
            roomPasswords.delete(roomName);
            roomTimers.delete(roomName);
            
            // Informer tous les clients
            broadcastRoomList();
        }
    }, 60000); // 1 minute
    
    roomTimers.set(roomName, timerId);
    console.log(`⏲️ Timer de suppression démarré pour le salon: ${roomName} (1 minute)`);
}

// Fonction pour annuler le timer de suppression d'un salon
function cancelRoomDeletionTimer(roomName) {
    if (roomTimers.has(roomName)) {
        clearTimeout(roomTimers.get(roomName));
        roomTimers.delete(roomName);
        console.log(`⏹️ Timer de suppression annulé pour le salon: ${roomName}`);
    }
}

// Fonction pour broadcast la liste des salons à tous les clients
function broadcastRoomList(newRoom = null) {
    const roomList = Array.from(availableRooms).map(roomName => ({
        name: roomName,
        isPrivate: roomPasswords.has(roomName)
    }));
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

// Fonction pour envoyer le nombre d'utilisateurs dans un salon
function broadcastUserCount(roomName) {
    const roomClients = rooms.get(roomName);
    if (roomClients) {
        const userCount = roomClients.size;
        roomClients.forEach(function each(client) {
            if (client.readyState === WebSocket.OPEN && client.isAuthenticated) {
                client.send(JSON.stringify({
                    type: 'userCount',
                    count: userCount
                }));
            }
        });
    }
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
        rooms: Array.from(availableRooms).map(roomName => ({
            name: roomName,
            isPrivate: roomPasswords.has(roomName)
        }))
    }));

    // Gestion des messages reçus du client
    ws.on('message', function incoming(data) {
        try {
            const messageData = JSON.parse(data);
            
            console.log(`📩 Message reçu - Type: ${messageData.type}, Auth: ${ws.isAuthenticated}, Room: ${ws.room}`);

            // Gestion de la création de salon
            if (messageData.type === 'createRoom') {
                const roomName = messageData.roomName.trim();
                const isPrivate = messageData.isPrivate || false;
                const hashedPassword = messageData.hashedPassword; // Mot de passe déjà hashé côté client
                
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
                
                // Si salon privé, vérifier qu'un mot de passe est fourni
                if (isPrivate && !hashedPassword) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Un mot de passe est requis pour un salon privé.'
                    }));
                    return;
                }
                
                availableRooms.add(roomName);
                
                // Stocker le mot de passe hashé si salon privé
                if (isPrivate) {
                    roomPasswords.set(roomName, hashedPassword);
                }
                
                broadcastRoomList(roomName); // Envoyer le nom du nouveau salon
                
                console.log(`Nouveau salon créé: ${roomName} (${isPrivate ? 'Privé' : 'Public'})`);
                return;
            }

            // Si l'utilisateur n'est pas encore authentifié, traiter le pseudonyme et le salon
            if (!ws.isAuthenticated && messageData.type === 'join') {
                const encryptedUsername = messageData.encryptedUsername; // Username chiffré
                const roomName = messageData.room;
                const hashedPassword = messageData.hashedPassword; // Mot de passe hashé si salon privé

                // Vérifier si le salon existe
                if (!availableRooms.has(roomName)) {
                    ws.send(JSON.stringify({
                        type: 'error',
                        message: 'Ce salon n\'existe pas.'
                    }));
                    return;
                }

                // Vérifier le mot de passe pour les salons privés
                if (roomPasswords.has(roomName)) {
                    const correctPassword = roomPasswords.get(roomName);
                    if (hashedPassword !== correctPassword) {
                        ws.send(JSON.stringify({
                            type: 'error',
                            message: 'Mot de passe incorrect.'
                        }));
                        return;
                    }
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
                
                // Annuler le timer de suppression si quelqu'un rejoint
                cancelRoomDeletionTimer(roomName);
                
                // Ajouter le client au salon
                rooms.get(roomName).add(ws);

                console.log(`Utilisateur connecté au salon: ${roomName}`);

                // Confirmer l'authentification
                ws.send(JSON.stringify({
                    type: 'authenticated',
                    room: roomName
                }));

                // Envoyer le nombre d'utilisateurs dans le salon
                broadcastUserCount(roomName);

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

            // Gestion de la déconnexion d'un salon (retour à l'accueil)
            if (messageData.type === 'leave' && ws.isAuthenticated && ws.room) {
                const roomName = ws.room;
                const username = ws.username;
                
                console.log(`Utilisateur quitté le salon: ${roomName}`);
                
                // Retirer le client du salon
                const roomClients = rooms.get(roomName);
                if (roomClients) {
                    roomClients.delete(ws);
                    
                    console.log(`📊 Salon "${roomName}" a maintenant ${roomClients.size} utilisateur(s)`);
                    
                    // Mettre à jour le compteur d'utilisateurs
                    broadcastUserCount(roomName);
                    
                    // Notifier les autres utilisateurs
                    roomClients.forEach(function each(client) {
                        if (client.readyState === WebSocket.OPEN && client.isAuthenticated) {
                            client.send(JSON.stringify({
                                type: 'userLeft',
                                encryptedUsername: username,
                                timestamp: new Date().toLocaleTimeString()
                            }));
                        }
                    });
                    
                    // Si le salon est vide, démarrer le timer de suppression
                    if (roomClients.size === 0) {
                        console.log(`🔴 Salon "${roomName}" est vide, lancement du timer de suppression...`);
                        startRoomDeletionTimer(roomName);
                    }
                }
                
                // Réinitialiser l'état du client
                ws.isAuthenticated = false;
                ws.username = null;
                ws.room = null;
                
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

            // Traitement des fichiers (chiffrés)
            if (messageData.type === 'file') {
                console.log(`Fichier envoyé dans le salon ${ws.room}: ${messageData.fileName}`);

                // Broadcast du fichier chiffré uniquement aux clients du même salon
                const roomClients = rooms.get(ws.room);
                if (roomClients) {
                    roomClients.forEach(function each(client) {
                        if (client.readyState === WebSocket.OPEN && client.isAuthenticated) {
                            client.send(JSON.stringify({
                                type: 'file',
                                encryptedFile: messageData.encryptedFile, // Fichier chiffré
                                encryptedUsername: ws.username, // Username chiffré
                                fileName: messageData.fileName,
                                fileType: messageData.fileType,
                                fileSize: messageData.fileSize,
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

            const roomName = ws.room; // Sauvegarder le nom du salon
            
            // Retirer le client du salon
            const roomClients = rooms.get(roomName);
            if (roomClients) {
                roomClients.delete(ws);
                
                console.log(`📊 Salon "${roomName}" a maintenant ${roomClients.size} utilisateur(s) (déconnexion)`);
                
                // Mettre à jour le compteur d'utilisateurs
                broadcastUserCount(roomName);
                
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
                
                // Si le salon est vide, démarrer le timer de suppression
                if (roomClients.size === 0) {
                    console.log(`🔴 Salon "${roomName}" est vide (déconnexion), lancement du timer de suppression...`);
                    startRoomDeletionTimer(roomName);
                }
            }
        } else {
            console.log('Client déconnecté (pas authentifié)');
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