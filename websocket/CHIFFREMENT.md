# 🔒 Documentation du Chiffrement de Bout en Bout (E2EE)

## Qu'est-ce qui a été implémenté ?

### 1. Chiffrement E2EE avec WebCrypto API

Ton application utilise maintenant le **chiffrement de bout en bout** (End-to-End Encryption) avec l'algorithme **AES-GCM** (Advanced Encryption Standard - Galois/Counter Mode).

#### Comment ça fonctionne ?

1. **Génération de la clé de chiffrement**
   - Chaque salon a sa propre clé de chiffrement
   - La clé est générée à partir du nom du salon + une phrase secrète
   - Utilisation de SHA-256 pour créer une clé de 256 bits
   - La clé n'est JAMAIS envoyée au serveur

2. **Chiffrement des messages**
   - Avant d'envoyer un message, il est chiffré avec AES-GCM
   - Un IV (Initialization Vector) aléatoire est généré pour chaque message
   - Le message chiffré + l'IV sont envoyés au serveur
   - Le serveur ne peut pas lire le message (il voit juste du charabia)

3. **Chiffrement du pseudo**
   - Ton pseudo est également chiffré avant d'être envoyé
   - Le serveur stocke uniquement la version chiffrée
   - Seuls les clients du même salon peuvent déchiffrer le pseudo

4. **Déchiffrement**
   - Quand un client reçoit un message, il utilise sa clé locale
   - Il déchiffre le message et le pseudo
   - L'affiche en clair dans l'interface

### 2. Système de Salons Indépendants

#### Fonctionnalités des salons :

✅ **Salons par défaut** : Général, Jeux, Détente

✅ **Création de nouveaux salons** : Bouton "➕ Créer"

✅ **Liste déroulante** : Se met à jour automatiquement quand un nouveau salon est créé

✅ **Isolation des messages** : Les messages d'un salon ne sont visibles que dans ce salon

✅ **Clé de chiffrement unique** : Chaque salon a sa propre clé

#### Page d'accueil :

- 📝 Champ "Nom de villageois"
- 🏠 Liste déroulante pour choisir le salon
- ➕ Bouton pour créer un nouveau salon
- 🏡 Bouton "Rejoindre le salon"

## 🔐 Sécurité

### Ce qui est protégé :

✅ **Messages** : Chiffrés avec AES-GCM
✅ **Pseudonymes** : Chiffrés avec AES-GCM
✅ **Notifications système** : Chiffrées (ex: "X a rejoint le chat")

### Ce qui n'est PAS protégé :

❌ **Nom du salon** : Visible en clair (nécessaire pour router les messages)
❌ **Horodatage** : Timestamp visible (ajouté par le serveur)
❌ **Type de message** : Le serveur sait si c'est un message ou une notification

### Limitations :

⚠️ **Tous les clients d'un salon partagent la même clé**
   - La clé est dérivée du nom du salon
   - N'importe qui connaissant le nom du salon peut générer la clé
   - Pour une vraie sécurité, il faudrait un échange de clés Diffie-Hellman

⚠️ **Pas de vérification d'identité**
   - Pas de système pour vérifier que "Alice" est bien Alice
   - Un attaquant peut se faire passer pour quelqu'un d'autre

⚠️ **L'hébergeur peut voir les métadonnées**
   - Qui se connecte (adresse IP)
   - Quand les messages sont envoyés
   - Taille approximative des messages
   - Quel salon est utilisé

## 🚀 Test du système

### Pour tester :

1. Ouvre deux fenêtres de navigateur
2. Dans la première, rejoins le salon "Général" avec le pseudo "Alice"
3. Dans la seconde, rejoins le salon "Jeux" avec le pseudo "Bob"
4. Envoie un message depuis Alice → Bob ne le verra pas (salon différent)
5. Fais rejoindre Bob au salon "Général" → Il peut maintenant voir les messages d'Alice

### Pour vérifier le chiffrement :

1. Ouvre les DevTools (F12) → Onglet "Network" → "WS"
2. Clique sur la connexion WebSocket
3. Regarde les messages échangés
4. Tu verras des données chiffrées comme : `{"encrypted":"A7xK9mP...", "iv":"xR3d..."}`

## 🔧 Code technique

### Fonctions principales :

```javascript
// Générer une clé de chiffrement pour un salon
generateEncryptionKey(roomName)

// Chiffrer un texte
encryptMessage(text, key) // Retourne {encrypted, iv}

// Déchiffrer un texte
decryptMessage(encryptedBase64, ivBase64, key)
```

### Format des messages chiffrés :

```json
{
  "type": "message",
  "encryptedMessage": "{\"encrypted\":\"base64...\",\"iv\":\"base64...\"}",
  "encryptedUsername": "{\"encrypted\":\"base64...\",\"iv\":\"base64...\"}",
  "timestamp": "14:30:25"
}
```

## 🎯 Amélioration possible

Pour un vrai E2EE de niveau Signal/WhatsApp, il faudrait :

1. **Échange de clés Diffie-Hellman** entre les clients
2. **Signature des messages** pour vérifier l'identité
3. **Perfect Forward Secrecy** (nouvelle clé à chaque session)
4. **Vérification des empreintes** (Safety Numbers)
5. **Rotation des clés** périodique

Mais pour un projet éducatif, ce système montre les concepts de base du E2EE ! 🎓
