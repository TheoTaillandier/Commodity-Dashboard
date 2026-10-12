# Journal de l'agent cockpit

## 2026-10-12 — Mise en place
- Demande : travailler de façon soutenue cet après-midi sur les sources, le process de collecte et la lisibilité ; passer à une cadence plus espacée dès demain.
- Référence initiale : main 2f57954843893dd0a342d4181e3d17050fccbe27 ; instantané généré 2026-10-12T05:59:01+00:00.
- La collecte GitHub est programmée toutes les deux heures. Les clés GIE/ENTSO-E sont utilisées par le workflow ; leur valeur n'a pas été lue.
- Points vérifiés : GIE France/UE et GNL fonctionnent ; stockage limité à 600 jours. WASDE octobre fonctionne. Crop Progress est en erreur avec dernière mesure du 28 septembre. RTE/ENTSO-E et prix day-ahead ont des données datées.
- Les nouveaux graphiques annuels et la nouvelle interface Marchés préparés dans la conversation précédente ne sont pas présents dans main. Ne pas les présenter comme publiés.
- Livrable de cette étape : instructions, registre des sources et ce journal pour assurer la continuité des exécutions.

## Prochain travail
1. Refaire un audit de fraîcheur et des écarts entre publication attendue et donnée affichée, puis corriger la collecte Crop Progress si la nouvelle source officielle est vérifiable.
2. Livrer les comparaisons annuelles manquantes : Brent, stockage France et prix Power FR, avec les vrais historiques et les contrôles de jours incomplets.
3. Ajouter le niveau TTF actuel et son historique long avec des fréquences distinctes explicitement indiquées ; ne pas mélanger indices, futures, prix quotidiens et moyennes mensuelles.
4. Terminer la forme Marchés : widgets compacts, fond cohérent, graph à gauche, calendrier lisible à droite, supprimer les doublons et expliquer précisément les cases en attente.
5. Vérifier la publication et la collecte avec les secrets du dépôt, conserver la compatibilité HTML autonome.

## Format à ajouter après chaque passage
Date/heure Europe/Paris ; commit de départ ; constats nouveaux ; décision ; fichiers modifiés ; tests et résultat ; commit publié et workflow vérifié ; limite restante ; prochaine priorité. Rester concis et distinguer réalisation confirmée de proposition.
