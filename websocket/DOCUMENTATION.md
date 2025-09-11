# Chat WebSocket - TP Reactive Programming

Ce projet implémente un système de chat en temps réel utilisant les **WebSockets** pour une communication bidirectionnelle entre serveur et clients.

## 🎯 Objectif

Créer un chat minimaliste démontrant :
- Les connexions WebSocket persistantes
- La communication bidirectionnelle en temps réel
- Le broadcast de messages à tous les clients connectés
- La gestion des connexions/déconnexions

## 🏗️ Architecture

### Serveur (Node.js)
- **Framework** : Node.js avec la bibliothèque `ws`
- **Port** : 8080
- **Fonctionnalités** :
  - Gestion des connexions multiples
  - Broadcast des messages à tous les clients
  - Système d'identification des clients
  - Gestion propre des déconnexions
  - Messages système (connexion/déconnexion)

### Client (HTML/JavaScript)
- **Technologies** : HTML5, CSS3, JavaScript natif
- **Fonctionnalités** :
  - Interface de chat moderne et responsive
  - Configuration du nom d'utilisateur
  - Envoi/réception de messages en temps réel
  - Indicateur de statut de connexion
  - Reconnexion automatique
  - Notifications visuelles

## 🚀 Installation et Lancement

### Prérequis
- Node.js (version 14 ou supérieure)
- npm (fourni avec Node.js)
- Navigateur web moderne

### 1. Installation des dépendances

```powershell
# Dans le répertoire websocket
npm install
```

### 2. Démarrage du serveur

```powershell
node server.js
```

Le serveur sera accessible sur `ws://localhost:8080`

### 3. Ouverture du client

Ouvrez le fichier `client.html` dans votre navigateur web.

## 🔧 Utilisation

### Configuration initiale
1. Ouvrez `client.html` dans votre navigateur
2. Attendez que la connexion WebSocket s'établisse (point vert)
3. Saisissez votre nom d'utilisateur et confirmez

### Chat en temps réel
1. Tapez votre message dans le champ de saisie
2. Appuyez sur Entrée ou cliquez sur le bouton d'envoi
3. Le message apparaît instantanément chez tous les clients connectés

### Test multi-utilisateurs
1. Ouvrez plusieurs onglets de `client.html`
2. Configurez des noms d'utilisateur différents
3. Échangez des messages entre les différents clients

## 📡 Protocole de Communication

### Messages Client → Serveur
```javascript
{
    "content": "Contenu du message",
    "username": "NomUtilisateur",
    "timestamp": "2025-09-11T16:06:13.000Z"
}
```

### Messages Serveur → Client

#### Message de chat
```javascript
{
    "type": "message",
    "content": "Contenu du message",
    "username": "NomUtilisateur",
    "timestamp": "2025-09-11T16:06:13.000Z",
    "clientId": "abc123xyz"
}
```

#### Messages système
```javascript
{
    "type": "system|user-joined|user-left|server-shutdown",
    "content": "Message informatif",
    "timestamp": "2025-09-11T16:06:13.000Z",
    "clientId": "system"
}
```

#### Confirmation d'envoi
```javascript
{
    "type": "message-sent",
    "content": "Message envoyé avec succès",
    "timestamp": "2025-09-11T16:06:13.000Z",
    "originalMessage": { /* message original */ }
}
```

## 🛠️ Fonctionnalités Techniques

### Côté Serveur
- **Gestion des clients** : Set pour stocker les connexions actives
- **Broadcast intelligent** : Diffusion à tous sauf à l'expéditeur
- **Nettoyage automatique** : Suppression des connexions fermées
- **Ping/Pong** : Maintien des connexions actives
- **Logs détaillés** : Traçabilité complète des événements
- **Arrêt propre** : Fermeture gracieuse avec notification

### Côté Client
- **Reconnexion automatique** : Jusqu'à 5 tentatives avec délai progressif
- **Interface responsive** : Adaptation mobile et desktop
- **Notifications** : Toast messages pour les événements
- **Débogage** : Fonctions accessibles via `window.chatDebug`
- **Validation** : Vérification des données avant envoi

## 🎨 Interface Utilisateur

### Éléments visuels
- **Indicateur de connexion** : Point coloré animé
- **Messages différenciés** : Styles distincts pour vos messages et ceux des autres
- **Messages système** : Style particulier pour les notifications
- **Timestamps** : Horodatage de tous les messages
- **Compteur** : Nombre de messages envoyés
- **Animations** : Transitions fluides et feedback visuel

### Types de messages
- **Vos messages** : Bulles bleues alignées à droite
- **Messages des autres** : Bulles blanches alignées à gauche
- **Messages système** : Bulles grises centrées et en italique

## 🧪 Tests et Validation

### Test basique
1. Démarrer le serveur
2. Ouvrir le client dans un navigateur
3. Configurer un nom d'utilisateur
4. Envoyer un message et vérifier la réception

### Test multi-clients
1. Ouvrir plusieurs onglets/fenêtres du client
2. Configurer des noms différents
3. Envoyer des messages depuis différents clients
4. Vérifier la réception instantanée sur tous les clients

### Test de robustesse
1. Arrêter/redémarrer le serveur
2. Vérifier la reconnexion automatique
3. Tester avec de nombreux messages simultanés
4. Vérifier la gestion des déconnexions

## 🔍 Avantages des WebSockets

### Par rapport au Long Polling
- ✅ **Bidirectionnel** : Le serveur peut initier des communications
- ✅ **Moins d'overhead** : Pas de headers HTTP répétés
- ✅ **Temps réel vrai** : Latence minimale
- ✅ **Efficacité** : Une seule connexion persistante

### Par rapport au Polling traditionnel
- ✅ **Instantané** : Pas d'attente entre les requêtes
- ✅ **Efficace** : Pas de requêtes vides
- ✅ **Scalable** : Moins de charge serveur
- ✅ **Interactif** : Expérience utilisateur fluide

## 🐛 Débogage

### Console du navigateur
Utilisez `window.chatDebug` pour accéder aux fonctions de débogage :

```javascript
// Statistiques actuelles
chatDebug.getStats()

// Forcer la reconnexion
chatDebug.reconnect()

// Fermer la connexion
chatDebug.disconnect()

// Vider l'historique des messages
chatDebug.clearMessages()
```

### Logs du serveur
Le serveur affiche des logs détaillés :
- Connexions/déconnexions des clients
- Messages reçus et diffusés
- Erreurs et événements système
- Statistiques périodiques

## 🚀 Extensions Possibles

- **Salles de chat** : Créer plusieurs canaux
- **Messages privés** : Communication one-to-one
- **Émojis et markdown** : Enrichissement des messages
- **Historique persistant** : Sauvegarde en base de données
- **Authentification** : Système de login
- **Fichiers** : Partage d'images et documents
- **Statuts** : Indicateurs "en train d'écrire"

## 📝 Conclusion

Cette implémentation démontre la puissance des WebSockets pour créer des applications temps réel. La solution est robuste, scalable et offre une expérience utilisateur fluide et moderne.

**Avantages clés :**
- Communication bidirectionnelle instantanée
- Gestion propre des connexions multiples
- Interface utilisateur intuitive et responsive
- Robustesse avec reconnexion automatique
