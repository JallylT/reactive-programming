const WebSocket = require('ws');

// Configuration du serveur
const PORT = 8080;

// Création du serveur WebSocket
const wss = new WebSocket.Server({ 
    port: PORT,
    perMessageDeflate: false
});

// Set pour stocker les connexions actives
const clients = new Set();

// Fonction utilitaire pour logger avec timestamp
function log(message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${message}`);
}

// Fonction pour broadcaster un message à tous les clients connectés
function broadcast(message, excludeClient = null) {
    const messageStr = JSON.stringify(message);
    let sentCount = 0;
    
    clients.forEach(client => {
        // Exclure l'expéditeur si spécifié
        if (excludeClient && client === excludeClient) {
            return;
        }
        
        // Vérifier que la connexion est ouverte
        if (client.readyState === WebSocket.OPEN) {
            client.send(messageStr);
            sentCount++;
        } else {
            // Nettoyer les connexions fermées
            clients.delete(client);
        }
    });
    
    return sentCount;
}

// Gestion des nouvelles connexions
wss.on('connection', (ws, request) => {
    // Informations sur la connexion
    const clientIP = request.socket.remoteAddress;
    const clientId = Math.random().toString(36).substr(2, 9);
    
    log(`🟢 Nouveau client connecté (ID: ${clientId}, IP: ${clientIP})`);
    log(`📊 Total clients connectés: ${clients.size + 1}`);
    
    ws.clientId = clientId;
    clients.add(ws);
    
    const welcomeMessage = {
        type: 'system',
        content: 'Bienvenue dans le chat ! Vous êtes maintenant connecté.',
        timestamp: new Date().toISOString(),
        clientId: 'system'
    };
    ws.send(JSON.stringify(welcomeMessage));
    
    const joinMessage = {
        type: 'user-joined',
        content: `Un nouvel utilisateur (${clientId}) a rejoint le chat`,
        timestamp: new Date().toISOString(),
        clientId: 'system'
    };
    broadcast(joinMessage, ws);
    
    ws.on('message', (data) => {
        try {
            const messageData = JSON.parse(data.toString());
            
            log(`📨 Message reçu de ${clientId}: ${messageData.content}`);
            
            const broadcastMessage = {
                type: 'message',
                content: messageData.content,
                username: messageData.username || `Utilisateur-${clientId}`,
                timestamp: new Date().toISOString(),
                clientId: clientId
            };
            
            const sentCount = broadcast(broadcastMessage, ws);
            log(`📤 Message diffusé à ${sentCount} client(s)`);
            
            const confirmMessage = {
                type: 'message-sent',
                content: 'Message envoyé avec succès',
                timestamp: new Date().toISOString(),
                originalMessage: broadcastMessage
            };
            ws.send(JSON.stringify(confirmMessage));
            
        } catch (error) {
            log(`❌ Erreur lors du traitement du message de ${clientId}: ${error.message}`);
            
            const errorMessage = {
                type: 'error',
                content: 'Format de message invalide',
                timestamp: new Date().toISOString(),
                clientId: 'system'
            };
            ws.send(JSON.stringify(errorMessage));
        }
    });
    
    ws.on('close', (code, reason) => {
        log(`🔴 Client ${clientId} déconnecté (Code: ${code}, Raison: ${reason || 'Non spécifiée'})`);
        
        clients.delete(ws);
        log(`📊 Total clients connectés: ${clients.size}`);
        
        const leaveMessage = {
            type: 'user-left',
            content: `L'utilisateur ${clientId} a quitté le chat`,
            timestamp: new Date().toISOString(),
            clientId: 'system'
        };
        broadcast(leaveMessage);
    });
    
    ws.on('error', (error) => {
        log(`❌ Erreur WebSocket pour ${clientId}: ${error.message}`);
        clients.delete(ws);
    });
    
    const pingInterval = setInterval(() => {
        if (ws.readyState === WebSocket.OPEN) {
            ws.ping();
        } else {
            clearInterval(pingInterval);
            clients.delete(ws);
        }
    }, 30000);
    
    ws.on('close', () => clearInterval(pingInterval));
});

wss.on('error', (error) => {
    log(`❌ Erreur du serveur WebSocket: ${error.message}`);
});

function displayStats() {
    log(`📊 Statistiques: ${clients.size} client(s) connecté(s)`);
}

setInterval(displayStats, 60000);

process.on('SIGINT', () => {
    log('🛑 Arrêt du serveur en cours...');
    
    const closeMessage = {
        type: 'server-shutdown',
        content: 'Le serveur va s\'arrêter. Connexion fermée.',
        timestamp: new Date().toISOString(),
        clientId: 'system'
    };
    
    broadcast(closeMessage);
    
    wss.close(() => {
        log('✅ Serveur fermé proprement');
        process.exit(0);
    });
});

log('🚀 Démarrage du serveur WebSocket...');
log(`🌐 Serveur en écoute sur ws://localhost:${PORT}`);
log('💡 Appuyez sur Ctrl+C pour arrêter le serveur');
log('═'.repeat(50));
