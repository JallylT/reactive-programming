const SERVER_URL = 'http://localhost:3000';

let currentVersion = 0;
let isPolling = false;
let requestCount = 0;
let pollController = null;

const statusElement = document.getElementById('status');
const versionElement = document.getElementById('version');
const lastUpdateElement = document.getElementById('last-update');
const requestCountElement = document.getElementById('request-count');
const logsElement = document.getElementById('logs');
const connectionStatusElement = document.getElementById('connection-status');

document.addEventListener('DOMContentLoaded', function() {
    log('🚀 Application démarrée', 'info');
    log('📡 Début de la communication avec le serveur', 'info');
    
    startLongPolling();
});

/**
 * Ajoute une entrée au journal des logs
 */
function log(message, type = 'info') {
    const timestamp = new Date().toLocaleTimeString();
    const logEntry = document.createElement('div');
    logEntry.className = `log-entry ${type}`;
    logEntry.textContent = `[${timestamp}] ${message}`;
    
    logsElement.appendChild(logEntry);
    logsElement.scrollTop = logsElement.scrollHeight;
    
    console.log(`[${type.toUpperCase()}] ${message}`);
}

/**
 * Met à jour l'affichage du statut de connexion
 */
function updateConnectionStatus(status, message) {
    const statusClasses = {
        'connected': 'connected',
        'connecting': 'connecting',
        'disconnected': 'disconnected'
    };
    
    connectionStatusElement.className = `connection-status ${statusClasses[status]}`;
    connectionStatusElement.innerHTML = `
        <div class="status-dot ${statusClasses[status]}"></div>
        <span>${message}</span>
    `;
}

/**
 * Met à jour l'affichage du statut de la tâche
 */
function updateTaskStatus(status, version) {
    statusElement.textContent = status;
    versionElement.textContent = version;
    lastUpdateElement.textContent = new Date().toLocaleTimeString();
    
    statusElement.className = 'status-badge ' + getStatusClass(status);
    
    statusElement.classList.add('updating');
    setTimeout(() => {
        statusElement.classList.remove('updating');
    }, 600);
    
    currentVersion = version;
    
    log(`✅ Statut mis à jour: "${status}" (version ${version})`, 'success');
}

/**
 * Convertit le statut en classe CSS
 */
function getStatusClass(status) {
    const statusMap = {
        'en attente': 'en-attente',
        'en cours': 'en-cours',
        'terminée': 'terminee',
        'échec': 'echec'
    };
    
    return statusMap[status.toLowerCase()] || 'en-attente';
}

/**
 * Met à jour le compteur de requêtes
 */
function updateRequestCount() {
    requestCount++;
    requestCountElement.textContent = requestCount;
}

/**
 * Fonction principale de Long Polling
 */
async function pollForStatus() {
    if (isPolling) {
        log('⚠️ Long Polling déjà en cours', 'warning');
        return;
    }
    
    isPolling = true;
    updateConnectionStatus('connecting', 'Long Polling en cours...');
    
    try {
        log(`🔄 Démarrage Long Polling (version actuelle: ${currentVersion})`, 'info');
        updateRequestCount();
        
        pollController = new AbortController();
        
        const response = await fetch(`${SERVER_URL}/poll-status?last_version=${currentVersion}`, {
            method: 'GET',
            signal: pollController.signal,
            headers: {
                'Content-Type': 'application/json',
            }
        });
        
        if (!response.ok) {
            throw new Error(`Erreur serveur: ${response.status} ${response.statusText}`);
        }
        
        const data = await response.json();
        updateConnectionStatus('connected', 'Connecté - En attente de changements');
        
        if (data.changed && data.status && data.version !== undefined) {
            log(`🎉 Changement détecté via Long Polling!`, 'success');
            updateTaskStatus(data.status, data.version);
        } else {
            log('⏰ Timeout Long Polling - Aucun changement', 'info');
        }
        
    } catch (error) {
        if (error.name === 'AbortError') {
            log('❌ Requête Long Polling annulée', 'warning');
        } else {
            log(`❌ Erreur Long Polling: ${error.message}`, 'error');
            updateConnectionStatus('disconnected', 'Erreur de connexion');
        }
    } finally {
        isPolling = false;
        pollController = null;
        
        setTimeout(() => {
            if (!isPolling) {
                pollForStatus();
            }
        }, 1000);
    }
}

/**
 * Démarre le système de Long Polling
 */
async function startLongPolling() {
    try {
        log('📥 Récupération de l\'état initial...', 'info');
        
        const response = await fetch(`${SERVER_URL}/status`);
        if (!response.ok) {
            throw new Error(`Erreur: ${response.status}`);
        }
        
        const data = await response.json();
        updateTaskStatus(data.status, data.version);
        updateConnectionStatus('connected', 'État initial récupéré');
        
        setTimeout(() => {
            pollForStatus();
        }, 1000);
        
    } catch (error) {
        log(`❌ Erreur lors de la récupération de l'état initial: ${error.message}`, 'error');
        updateConnectionStatus('disconnected', 'Impossible de se connecter');
        
        setTimeout(startLongPolling, 5000);
    }
}

/**
 * Met à jour le statut de la tâche (fonction admin)
 */
async function updateStatus() {
    const selectElement = document.getElementById('status-select');
    const updateBtn = document.getElementById('update-btn');
    const newStatus = selectElement.value;
    
    updateBtn.disabled = true;
    updateBtn.textContent = '⏳ Mise à jour...';
    
    try {
        log(`🔧 Tentative de mise à jour vers: "${newStatus}"`, 'info');
        
        const response = await fetch(`${SERVER_URL}/update-status`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                status: newStatus
            })
        });
        
        if (!response.ok) {
            throw new Error(`Erreur serveur: ${response.status}`);
        }
        
        const data = await response.json();
        log(`✅ ${data.message}`, 'success');
        
    } catch (error) {
        log(`❌ Erreur lors de la mise à jour: ${error.message}`, 'error');
        alert(`Erreur: ${error.message}`);
    } finally {
        updateBtn.disabled = false;
        updateBtn.textContent = '🚀 Mettre à jour le statut';
    }
}

/**
 * Efface les logs
 */
function clearLogs() {
    logsElement.innerHTML = '';
    log('🗑️ Logs effacés', 'info');
}

/**
 * Arrête le Long Polling (pour le débogage)
 */
function stopPolling() {
    if (pollController) {
        pollController.abort();
    }
    isPolling = false;
    updateConnectionStatus('disconnected', 'Polling arrêté manuellement');
    log('🛑 Long Polling arrêté manuellement', 'warning');
}

/**
 * Redémarre le Long Polling
 */
function restartPolling() {
    stopPolling();
    setTimeout(() => {
        log('🔄 Redémarrage du Long Polling...', 'info');
        startLongPolling();
    }, 1000);
}

// Gestion de la fermeture de la page
window.addEventListener('beforeunload', function() {
    if (pollController) {
        pollController.abort();
    }
});

// Gestion de la visibilité de la page
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        log('👁️ Page masquée - Long Polling continue en arrière-plan', 'info');
    } else {
        log('👁️ Page visible - Long Polling actif', 'info');
        
        // Redémarrer le polling si nécessaire
        if (!isPolling) {
            setTimeout(pollForStatus, 500);
        }
    }
});

// Fonctions utilitaires disponibles dans la console pour le débogage
window.longPollingDebug = {
    stop: stopPolling,
    restart: restartPolling,
    status: () => ({
        isPolling,
        currentVersion,
        requestCount,
        hasController: !!pollController
    }),
    logs: () => logsElement.innerHTML,
    clearLogs: clearLogs
};