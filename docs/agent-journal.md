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


## 2026-10-12 — Refonte des trois pages (validation sur branche)
- Départ : main 4835fc13e27b0ad15622ab3db8e5241319610b2f. Instantané récent conservé, sans lecture des clés.
- Marchés : cours compacts, trois faits prioritaires, calendrier et repères séparés, historique natif hors connexion, cartes gaz datées et export CSV.
- Physique : tableaux avec commentaires concis, graphiques avec axes et survol, comparaison annuelle Brent/stockage/TTF, avancement de récolte face à la moyenne cinq ans. Métaux : facteurs à surveiller distincts des chiffres annuels USGS.
- Power : présentation harmonisée, comparaison des quatre années, méthodes repliées ; aucun faux intraday.
- Structure : app/template.html, app/styles.css, app/cockpit.js → compilateur Python → HTML autonome. README séparé du code complet pour empêcher la copie de documentation dans le HTML.
- Sources : correctif des pages Crop Progress ; pagination GIE complète ; NGP EEX sous condition de droits explicites après vérification des conditions officielles.
- Vérifications locales : tests Python et syntaxe JS passent. Vérification du rendu Chromium et des collectes à confirmer dans les workflows avant publication finale.

### Vérification du rendu et calculs — 12 octobre, après-midi Paris
- Workflow 38261746988 puis 38262786808 : succès. Captures inspectées pour Marchés, Physique pétrole/gaz/agri et Power desktop/mobile. 18 combinaisons de page/largeur contrôlées (1440/390/320 px), sans débordement ni exception de panneau.
- 28 tests Python passent ; tests Node des moyennes Power : journées Paris de 23/25 h, quarts d’heure manquants et doublons. Journées incomplètes exclues des moyennes et affichage des repères disponibles aujourd’hui.
- Le TTF sans flux NGP est nommé moyenne mensuelle dans le titre et la date. Contexte EIA limité aux pages pétrole/gaz ; les mesures et définitions des autres secteurs restent pertinentes à leur marché.
- Prochaine étape de cette intervention : publication main, reconstruction effective du HTML et vérification des collectes avec les secrets déjà configurés. Ces étapes ne sont pas encore attestées par cette entrée.

## 2026-10-12 — Livraison main vérifiée, 16:33 Paris
- Code publié : 0cbe809562c8efdd195efb44456b7427cde5a940 ; compilation robot : 79584b1 ; données : a1fa3ba81bd7e24d674373e1798de0e5cf4e8176.
- Contrôle final de forme sur branche : workflow 38263297461 réussi. Collecte main : workflow 38263593169 réussi, HTML reconstruit et vérifié dans main (nouvelle interface et calculs Power présents, aucun marqueur de compilation restant).
- Instantané généré 2026-10-12T14:32:01+00:00 : 57 mesures. Stockages France/UE : 1379 jours chacun (2023 365, 2024 366, 2025 365, 2026 283). Prix Power quotidiens : 1381 jours ; prix day-ahead FR/DE reçus jusqu’au 13 octobre. RTE : observation du 12 octobre 14:15 UTC. TTF mensuel : septembre 2026 ; EEX NGP désactivé faute de droit.
- Écart découvert en collecte : Crop Progress du 5 octobre existe, mais ses colonnes N−1 sont « (NA) ». L’ancien parseur rejetait également les valeurs actuelles. Correctif ciblé : conserver les conditions actuelles et les récoltes, laisser la comparaison absente, distinguer semaine mesurée du 4 octobre et publication du 5. Tests ancrés sur les lignes officielles ; 30 tests Python passent.
- WASDE : la collecte a rencontré une erreur réseau ; chiffres octobre conservés. Ajout d’une unique nouvelle tentative pour une erreur de transport et garde empêchant une réponse plus ancienne d’écraser une mesure récente.
- La dernière collecte du correctif agricole reste à vérifier avant d’attester le résultat de cette source.

## 2026-10-13 — Modifications demandées, validation sur branche
- Départ : main 79e44fcec5936544ced42a16067be0eee3bcc4f7. Reprise des sources existantes, sans refonte complète.
- Marchés : catégories et 17 références sélectionnables ; futures continus identifiés, LME distinct de COMEX et du benchmark 3 mois ; liens TTF/JKM Trading Economics sans abonnement.
- Physique pétrole : Brent annuel en premier, Brent/WTI spot 12 mois en deuxième, stocks US hors SPR 2023–2026 en troisième ; 196 observations EIA réellement reçues.
- Power : comparaisons annuelles et bilan physique remontés ; parts du mix/GW ; imports/exports, nucléaire, éolien et solaire mis en évidence. Comparateurs DE-LU/Belgique/Italie du Nord ; deux nouveaux flux CC BY 4.0 vérifiés. Repère annuel quotidien comparable à l’historique quotidien.
- Contrôles locaux : tests Python et syntaxe JS ; contrôle navigateur à vérifier par GitHub Actions avant publication main. Le téléchargement de Chromium dans cet environnement échoue ; le workflow dédié sert à la vérification desktop/mobile.
- Limite : la sélection d’un symbole LME/MATIF/ICE est disponible, mais chaque intégration en séance reste soumise aux droits des widgets TradingView ; liens source permanents, aucune substitution de prix.

### Vérification réelle des widgets du 13 octobre
Les widgets publics refusent TTF ICE Endex, JKM NYMEX, cuivre/aluminium LME, CBOT blé/maïs et ICE US café/cacao, avec notification « Symbole disponible uniquement sur TradingView ». MATIF blé/maïs, Brent et EURJPY ont chargé en ligne. Les références refusées proposent un accès externe explicite. Les graphiques indicatifs blé/maïs OANDA et café/cacao Capital.com ont réellement chargé lors du contrôle fournisseur 38378069777. TTF et JKM en séance, cuivre/aluminium LME restent en accès externe ; le TTF mensuel embarqué reste consultable. Aucun benchmark officiel n’est remplacé silencieusement.

## 2026-10-13 — Livraison main vérifiée
- Code publié : ff57d2a469f9232687c152d74c0e9a1fde538396 ; HTML compilé : 2300e15 ; données : 8ff3f7f. Instantané du 13 octobre à 11:48 Paris, 57 mesures, 196 observations hebdomadaires de brut US.
- Collecte main 38378924110 réussie : prix FR/DE-LU/BE/IT-North reçus et licences contrôlées. HTML réellement publié vérifié : sources compilées, quatre zones, aucun marqueur de génération restant.
- Interface main 38378924130 réussie : 32 tests Python, calculs Power Node, 18 vues à 1440/390/320 px, comparaisons hebdomadaires, navigation et mode hors connexion. Captures desktop/mobile inspectées ; observations en ligne conservées dans les artefacts.
- Graphiques en ligne confirmés : MATIF blé/maïs, Brent, EURJPY et CFD blé/maïs OANDA, café/cacao Capital.com. TTF et JKM courants, cuivre/aluminium LME restent en accès externe : les widgets gratuits refusent ces références. Pas de substitution d’un benchmark officiel. TTF mensuel embarqué conservé.
- Prochaine priorité : une source gratuite autorisée pour les références exactes encore externes ; sinon conserver les accès explicites et surveiller la fraîcheur des collectes.
