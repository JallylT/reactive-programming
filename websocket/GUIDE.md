# 🏝️ Guide d'Utilisation - Animal Chat Island

## 🚀 Démarrage

### 1. Lancer le serveur

```bash
node server.js
```

Le serveur démarre sur le port 8080.

### 2. Ouvrir le client

Ouvre `client.html` dans ton navigateur (ou accède à l'URL de ton serveur).

## 📝 Utilisation

### Première connexion

1. **Entre ton nom de villageois** (ex: "Jallyl")
2. **Choisis un salon** dans la liste déroulante :
   - Général
   - Jeux
   - Détente
   - Ou crée ton propre salon avec le bouton "➕ Créer"
3. **Clique sur "🏡 Rejoindre le salon"**

### Créer un nouveau salon

1. Clique sur le bouton "➕ Créer"
2. Entre le nom du nouveau salon
3. Le salon apparaît dans la liste déroulante
4. Tu peux maintenant le sélectionner et le rejoindre

### Envoyer des messages

1. Une fois dans le salon, tape ton message dans le champ en bas
2. Appuie sur "Entrée" ou clique sur "📨 Envoyer"
3. Ton message apparaît à droite (fond vert)
4. Les messages des autres apparaissent à gauche (fond bleu)

### Changer de salon

Pour changer de salon, il faut :
1. Fermer la page
2. La rouvrir
3. Choisir un nouveau salon

## 🔒 Fonctionnalités de Sécurité

### Chiffrement automatique

- ✅ Tous tes messages sont **chiffrés automatiquement**
- ✅ Ton pseudo est également **chiffré**
- ✅ L'hébergeur du serveur **ne peut pas lire** tes messages
- ✅ Seuls les membres du même salon peuvent déchiffrer les messages

### Vérifier le chiffrement

1. Ouvre les DevTools (F12)
2. Va dans l'onglet "Network" puis "WS"
3. Clique sur la connexion WebSocket
4. Regarde les messages → Tu verras des données chiffrées !

## 🎨 Mode Sombre

- Clique sur le bouton 🌙/☀️ en haut à droite
- Le thème est sauvegardé dans ton navigateur

## 🏠 Salons Indépendants

### Comment fonctionnent les salons ?

- Chaque salon est **complètement isolé**
- Les messages d'un salon ne sont **pas visibles** dans un autre
- Tu peux créer **autant de salons** que tu veux
- Chaque salon a sa propre **clé de chiffrement**

### Exemple d'utilisation

**Salon "Général"** : Discussion générale
**Salon "Jeux"** : Parler de jeux vidéo
**Salon "Détente"** : Discussions détendues
**Salon "Projet"** : Discussion de projet privée

## 💡 Astuces

- 🎭 Utilise des **emojis** dans tes messages pour les rendre plus expressifs
- 🌟 Les messages système apparaissent en **rouge/rose**
- 👤 Ton pseudo apparaît avec une icône 🎭
- 📢 Les notifications système ont une icône 📢

## 🔧 Problèmes Courants

### Le serveur ne démarre pas

- Vérifie que le port 8080 n'est pas déjà utilisé
- Assure-toi d'avoir installé les dépendances : `npm install`

### Les messages ne s'affichent pas

- Vérifie que tu es bien connecté (🟢 Connecté au village)
- Vérifie que tu as bien rejoint un salon
- Regarde la console du navigateur (F12) pour les erreurs

### Message "impossible à déchiffrer"

- Tu es peut-être dans le mauvais salon
- Rafraîchis la page et reconnecte-toi

## 📱 Compatibilité

✅ Chrome, Edge, Firefox, Safari (versions récentes)
✅ Desktop et Mobile
✅ Nécessite un navigateur avec support WebCrypto API

## 🎯 Fonctionnalités Futures

Idées d'améliorations :
- 📋 Liste des membres connectés dans le salon
- 🔔 Notifications sonores
- 💾 Historique des messages (local)
- 🖼️ Partage d'images
- 🎨 Personnalisation des couleurs
- 🔑 Échange de clés Diffie-Hellman pour un vrai E2EE
