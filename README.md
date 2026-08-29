# 🎯 DartMaster PRO - Application Web Progressive (PWA) de Fléchettes

Une application web progressive complète, ultra-réactive et moderne pour le comptage de points de fléchettes, conçue avec **React 19**, **TypeScript**, **Tailwind CSS v4**, **Lucide Icons**, **Web Audio API** et **Supabase**.

Optimisée pour une utilisation sur smartphones, tablettes, écrans pliables (*foldables*) et ordinateurs.

---

## 🚀 Démarrage Rapide

```bash
# 1. Naviguer dans le dossier du projet
cd dartmaster-pwa

# 2. Lancer le serveur de développement local
npm run dev

# 3. Compiler pour la production (Génération PWA & Service Worker)
npm run build

# 4. Prévisualiser le build de production
npm run preview
```

---

## 🎮 Modes de Jeu Implémentés

### 1. 501 & 301 (X01)
- **Clavier virtuel complet** : Numéros de 1 à 20, multiplicateurs Simple / Double / Triple, Bull (25) et Double Bull (50), bouton Manqué (0).
- **Mode Saisie Rapide** : Entrée directe par volée (presets 26, 41, 45, 60, 100, 140, 180 ou score personnalisé).
- **Détection Automatique de Bust** :
  - Si le score restant passe en dessous de 0.
  - Si le score restant tombe à 1 en mode *Double Out*.
  - Si le score tombe à 0 sans terminer sur un double (en mode *Double Out*).
- **Assistant Dynamique de Checkout** : Suggestion en direct des combinaisons optimales dès que le score restant est $\le 170$ (ex: 170 $\rightarrow$ T20 T20 Bull, 40 $\rightarrow$ D20).
- **Statistiques en direct** : Moyenne sur 3 fléchettes, moyenne des 9 premières fléchettes, historique manche par manche, décompte des 180s.

### 2. Cricket & Cut-Throat
- **Tableau de score dynamique** style ardoise de pub : Cibles 15, 16, 17, 18, 19, 20 et Bull.
- **Suivi visuel des marques** :
  - 1 touche : `/` (Slash)
  - 2 touches : `✕` (Croix)
  - 3 touches ou plus : `⨂` (Cible Fermée)
- **Calcul automatique des points** : Les points sont crédités lorsqu'une cible est fermée par le joueur et encore ouverte chez au moins un adversaire.
- **Option Cut-Throat (Coupe-Gorge)** : Les points de pénalité sont infligés aux adversaires n'ayant pas encore fermé la cible (le score le plus bas l'emporte).
- **Calcul du MPR** : *Marks Per Round* calculé en temps réel.

### 3. King (Killer)
- **Phase 1 : Attribution du Numéro** : Attribution d'un numéro unique (1 à 20) à chaque joueur via le mode traditionnel **Tir main faible** ou tirage aléatoire.
- **Phase 2 : Qualification King (👑)** : Chaque joueur doit toucher 3 fois son propre numéro (Simple: +1, Double: +2, Triple: +3) pour activer ses 3 vies et être couronné **King 👑**.
- **Phase 3 : Attaque & Survie** : Dès qu'un joueur est King, chaque tir sur le numéro d'un adversaire lui retire des vies (Simple: -1, Double: -2, Triple: -3).
- **Élimination** : À 0 vie, le joueur est éliminé (**💀**).
- **Victoire** : Le dernier survivant est déclaré grand vainqueur !

---

## ⚡ Fonctionnalités Transversales

- **Architecture Offline-First** : Fonctionne à 100% hors-ligne sans aucune dépendance réseau. Les données sont sauvegardées instantanément dans le stockage local.
- **Synchronisation Cloud Supabase** : Connectez votre projet Supabase en 1 clic dans l'onglet Paramètres pour synchroniser les joueurs, les statistiques cumulées et l'historique des matches.
- **Bouton Annuler (Undo) persistant** : Annulation pas-à-pas sur chaque fléchette et volée.
- **Effets Sonores & Haptiques par Synthèse Audio** : Sons immersifs générés via la Web Audio API (tactile, double, triple, 180, buzz de bust, fanfare royale King, acclamations de victoire) sans latence ni fichiers audio lourds.
- **Célébration de Victoire** : Pluie de confettis interactive et récapitulatif détaillé des statistiques.
- **Gestion des Joueurs** : Création, modification, avatars personnalisés, couleurs de signature et statistiques individuelles.
- **Classement Général & Historique** : Filtres par mode de jeu, taux de victoire, meilleures moyennes, liste détaillée des parties jouées.
- **Optimisation Mobile & Écrans Pliables** : Layout adaptatif avec support multi-écrans et mode plein écran pour support de smartphone à côté de la cible.

---

## 🗄️ Schéma de Base de Données Supabase

Le script SQL complet pour créer les tables (`players`, `player_stats`, `matches`), les politiques de sécurité (RLS) et activer le Realtime est disponible directement dans l'application (bouton *Copier le SQL* dans les paramètres).
