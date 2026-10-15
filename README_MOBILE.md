# IMR — édition mobile / tablette

Ajouts par-dessus Incremental Mass Rewritten (MrRedShark77) : seulement 2 fichiers (`mobile.css`, `mobile.js`) + 2 lignes dans `index.html`. Le jeu original n'est pas modifié, ta save reste compatible.

## Interface
- Barre d'onglets en bas (défilable), sous-onglets en "chips" défilables.
- Barre du haut : masse + gain/s, bouton 💾 sauvegarder, 📊 ressources.
- Ressources dans un tiroir à droite (bouton 📊 ou swipe depuis le bord droit).
- Boutons plus grands, popups qui tiennent toujours dans l'écran.
- **Maintenir pour acheter** : garde le doigt sur un bouton d'achat → achat en rafale. Jamais sur les boutons de reset.
- Menu ☰ : mode Auto / Mobile / Desktop, activer/désactiver l'achat maintenu, bouton 🛟 Unstuck.

## Correctifs soft-lock
- **Infinity** : le jeu se mettait en pause (`inf_time`) et attendait des `setTimeout`. Si le reset plantait ou que les timers sautaient (appli en arrière-plan sur mobile), le jeu restait figé. Maintenant : reset protégé + surveillance qui débloque tout seul après quelques secondes. Si la masse retombe sous le requis avant le clic, l'Infinity est annulée proprement au lieu de bloquer.
- **Première Supernova** : le bouton finit toujours par apparaître, l'écran noir est remis à la normale après le reset.
- **Resets Quantum / Atom / etc.** : une erreur pendant le reset ne laisse plus la boucle du jeu bloquée.
- **Écran vide** (app cachée sans rien à cliquer plus de 6 s) → réparation automatique.
- Bouton 🛟 Unstuck manuel dans le menu ☰ si jamais quelque chose bloque quand même.

## Mettre en ligne
Upload tout le dossier sur un repo GitHub → Settings → Pages → branche `main`. Ouvre l'URL sur ton téléphone/tablette.
