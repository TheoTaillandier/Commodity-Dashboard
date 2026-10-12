# Instructions du Commodity Cockpit

## Objectif
Maintenir et améliorer le dashboard personnel de Theo, dans ce dépôt uniquement. L'utilisateur autorise les améliorations vérifiées et leur publication sur GitHub. L'interface reste en français, concise et lisible : cours actuel et variation, faits physiques chiffrés, explication courte et détails accessibles au clic.

## Reprendre le travail
Lire docs/source-register.md et docs/agent-journal.md avant chaque intervention. Partir de la dernière version main ; ne pas utiliser un fichier HTML ou JSON local ancien comme référence. Conserver dans le journal les sources vérifiées, décisions, limites, travaux réalisés, tests et prochaine priorité. Ne pas répéter une amélioration déjà livrée.

## Données
- Privilégier les sources officielles, gratuites, accessibles et réutilisables. Vérifier la disponibilité réelle, les droits, les unités, les dates et la définition du produit.
- Distinguer cours en séance, CFD, future, spot physique, indice et moyenne. Ne jamais rebaptiser une moyenne mensuelle ou un prix day-ahead en prix live.
- Ne fabriquer aucun prix, historique, actualité, consensus ou lien causal. Identifier les calculs et les hypothèses ; dater les archives et les sources en erreur.
- Conserver les dernières données valides lors d'une panne. Respecter les limites des API. Les mises à jour doivent passer par le collecteur, pas par des chiffres saisis dans le HTML.
- Les clés GIE et ENTSO-E restent dans les secrets GitHub Actions. Ne jamais lire, afficher, copier ou publier leurs valeurs. Aucun nouvel abonnement, achat ou service payant à activer.
- La fraîcheur se juge selon la cadence et le calendrier de publication de chaque source, avec distinction entre date mesurée et date publiée.

## Présentation
Trois informations prioritaires maximum par synthèse. Chaque graphique indique unité, axes, période, source et couverture réelle. Les années comparées utilisent une échelle commune et des dates comparables. Les détails de collecte et de licence vont dans la méthodologie, pas dans le parcours principal. Conserver les pages Marchés, Physique et Power FR et les liens utiles au marché physique.

## Architecture et vérification
Le fichier index.html doit rester téléchargeable et ouvrable seul : ce besoin vient du poste professionnel qui peut bloquer GitHub. Conserver les données embarquées et les accès directs autorisés avec repli daté.
Avant publication, exécuter les tests Python pertinents, vérifier la syntaxe JavaScript et, pour une modification de forme, contrôler le rendu desktop/mobile et l'absence de débordement. Préserver les dernières données embarquées du dépôt lors des changements de code.
Publier des changements ciblés, avec le problème résolu et les vérifications dans le message de commit. Ne pas forcer main ni écraser un commit concurrent du robot. Vérifier ensuite le workflow et le fichier réellement publié. Si un contrôle essentiel échoue ou si les accès sont indisponibles, conserver le travail sur une branche et expliquer la limite sans prétendre avoir publié une correction.

## Priorité
Fiabilité des sources → collecte/process → lisibilité → enrichissement utile. Les séries demandées comprennent Brent spot N/N−1/N−2/N−3, stockage France 2026/2025/2024/2023, TTF historique avec fréquence explicite et niveau actuel distinct, et Power FR avec trois années de comparaison. Respecter le journal pour distinguer demande, travail préparé et livraison vérifiée.
