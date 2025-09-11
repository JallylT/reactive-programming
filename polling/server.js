const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());
app.use(express.static('.'));

let currentTaskStatus = "En attente";
let statusVersion = 0;

let pendingRequests = [];

function log(message) {
    const timestamp = new Date().toLocaleTimeString();
    console.log(`[${timestamp}] ${message}`);
}

function notifyPendingRequests() {
    log(`Notification de ${pendingRequests.length} requête(s) en attente`);
    
    pendingRequests.forEach(({ res, lastVersion }) => {
        if (!res.headersSent) {
            res.json({
                status: currentTaskStatus,
                version: statusVersion,
                changed: true
            });
        }
    });
    
    pendingRequests = [];
}

app.post('/update-status', (req, res) => {
    const { status } = req.body;
    
    if (!status) {
        return res.status(400).json({ 
            error: 'Le champ "status" est requis' 
        });
    }
    
    currentTaskStatus = status;
    statusVersion++;
    
    log(`Statut mis à jour: "${currentTaskStatus}" (version ${statusVersion})`);
    
    notifyPendingRequests();
    
    res.json({
        status: currentTaskStatus,
        version: statusVersion,
        message: 'Statut mis à jour avec succès'
    });
});

app.get('/poll-status', (req, res) => {
    const lastVersion = parseInt(req.query.last_version) || 0;
    
    log(`Requête Long Polling reçue - Version client: ${lastVersion}, Version serveur: ${statusVersion}`);
    
    if (lastVersion < statusVersion) {
        log(`Changement détecté - Réponse immédiate`);
        return res.json({
            status: currentTaskStatus,
            version: statusVersion,
            changed: true
        });
    }
    
    log(`Pas de changement - Mise en attente de la requête`);
    
    const requestData = {
        res,
        lastVersion,
        timestamp: Date.now()
    };
    
    pendingRequests.push(requestData);
    
    const timeout = setTimeout(() => {
        if (!res.headersSent) {
            log(`Timeout atteint pour une requête - Aucun changement`);
            
            pendingRequests = pendingRequests.filter(req => req.res !== res);
            
            res.json({
                changed: false,
                message: 'Timeout - aucun changement'
            });
        }
    }, 30000);
    
    res.on('close', () => {
        clearTimeout(timeout);
        pendingRequests = pendingRequests.filter(req => req.res !== res);
        log(`Connexion fermée par le client`);
    });
});

app.get('/status', (req, res) => {
    res.json({
        status: currentTaskStatus,
        version: statusVersion
    });
});

app.get('/', (req, res) => {
    res.send(`
        <!DOCTYPE html>
        <html>
        <head>
            <title>Serveur Long Polling</title>
            <style>
                body { 
                    font-family: Arial, sans-serif; 
                    max-width: 800px; 
                    margin: 0 auto; 
                    padding: 40px; 
                    background-color: #f5f5f5;
                }
                .container { 
                    background: white; 
                    padding: 30px; 
                    border-radius: 10px; 
                    box-shadow: 0 2px 10px rgba(0,0,0,0.1);
                }
                .status { 
                    background: #e8f4f8; 
                    padding: 20px; 
                    border-radius: 8px; 
                    margin: 20px 0; 
                    border-left: 4px solid #2196F3;
                }
                .endpoints { 
                    background: #f0f8e8; 
                    padding: 20px; 
                    border-radius: 8px; 
                    border-left: 4px solid #4CAF50;
                }
                ul { padding-left: 20px; }
                li { margin: 8px 0; }
                code { 
                    background: #f4f4f4; 
                    padding: 2px 6px; 
                    border-radius: 4px; 
                    font-family: 'Courier New', monospace;
                }
                .highlight { color: #2196F3; font-weight: bold; }
            </style>
        </head>
        <body>
            <div class="container">
                <h1>🚀 Serveur Long Polling</h1>
                <p>Serveur Node.js/Express démarré avec succès!</p>
                
                <div class="status">
                    <h3>📊 État actuel du système:</h3>
                    <p><strong>Statut de la tâche:</strong> <span class="highlight">${currentTaskStatus}</span></p>
                    <p><strong>Version:</strong> <span class="highlight">${statusVersion}</span></p>
                    <p><strong>Requêtes en attente:</strong> <span class="highlight">${pendingRequests.length}</span></p>
                </div>
                
                <div class="endpoints">
                    <h3>🌐 Endpoints API disponibles:</h3>
                    <ul>
                        <li><strong>GET</strong> <code>/poll-status?last_version=X</code> - Long polling pour les mises à jour</li>
                        <li><strong>POST</strong> <code>/update-status</code> - Mettre à jour le statut (body: {"status": "nouveau_statut"})</li>
                        <li><strong>GET</strong> <code>/status</code> - Obtenir le statut actuel (sans long polling)</li>
                    </ul>
                </div>
                
                <div>
                    <h3>🎯 Pour tester:</h3>
                    <ol>
                        <li>Ouvrez <code>index.html</code> dans votre navigateur</li>
                        <li>Ouvrez plusieurs onglets pour tester le Long Polling multi-clients</li>
                        <li>Changez le statut dans un onglet et observez la mise à jour instantanée dans les autres</li>
                    </ol>
                </div>
                
                <p><em>💡 Astuce: Utilisez les outils de développement du navigateur (F12) pour observer les requêtes Long Polling en action!</em></p>
            </div>
        </body>
        </html>
    `);
});

app.listen(PORT, () => {
    log('='.repeat(50));
    log('🚀 Serveur Long Polling démarré');
    log(`🌐 URL: http://localhost:${PORT}`);
    log(`📊 Statut initial: "${currentTaskStatus}" (version ${statusVersion})`);
    log('💡 Appuyez sur Ctrl+C pour arrêter le serveur');
    log('='.repeat(50));
});

process.on('SIGINT', () => {
    log('\n🛑 Arrêt du serveur...');
    
    pendingRequests.forEach(({ res }) => {
        if (!res.headersSent) {
            res.status(503).json({
                error: 'Serveur en cours d\'arrêt',
                changed: false
            });
        }
    });
    
    log('✅ Serveur arrêté proprement');
    process.exit(0);
});

setInterval(() => {
    if (pendingRequests.length > 0) {
        log(`📊 Statistiques: ${pendingRequests.length} requête(s) Long Polling active(s)`);
    }
}, 60000);