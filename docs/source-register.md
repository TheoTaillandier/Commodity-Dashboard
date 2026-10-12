# Registre des sources

État initial vérifié dans main le 12 octobre 2026, commit 2f57954843893dd0a342d4181e3d17050fccbe27. Ce registre décrit le code et l'instantané publiés ; il n'est pas une garantie permanente de disponibilité. Compléter les validations avec date et preuve lors des interventions.

| Données | Source / accès | Cadence et définition | État initial |
|---|---|---|---|
| Brent, WTI, gaz US, cuivre, or en séance | Widgets TradingView/OANDA | Cours indicatifs du fournisseur ; produit, horaire et délai à vérifier | Présents ; revoir la taille, le fond et les doublons |
| Brent Europe, WTI Cushing | https://www.eia.gov/dnav/pet/pet_pri_spt_s1_d.htm | Spot physique quotidien différé, $/bbl | Dernier jour affiché : 6 octobre 2026 |
| Henry Hub | https://www.eia.gov/dnav/ng/NG_PRI_FUT_S1_D.htm | Spot physique quotidien différé, $/MMBtu | Dernier jour affiché : 6 octobre 2026 |
| Historique pétrole | FRED DCOILBRENTEU/DCOILWTICO, repli datasets/oil-prices | Séries quotidiennes EIA ; jours sans observation absents | Environ un an ; N−2/N−3 à charger |
| Stocks et flux pétrole US | EIA WPSR, ir.eia.gov/wpsr | Hebdomadaire ; stocks et débits distincts | Période 2 octobre, publication 7 octobre 2026 |
| Stockage gaz US | EIA WNGSR, ir.eia.gov/ngs | Hebdomadaire ; bcf, variation, écart moyenne cinq ans | Période 2 octobre 2026 |
| Stockage France/UE | https://agsi.gie.eu/ API x-key, secret GIE_API_KEY | Quotidien ; % plein, TWh, GWh/j ; statut confirmé/estimé | 600 jours reçus par région, dernière journée 10 octobre ; 2023/2024 incomplets |
| Terminaux GNL France/UE | https://alsi.gie.eu/ même clé, accès ALSI requis | Quotidien ; stock liquide et send-out énergétique distincts | Dernière journée 10 octobre 2026 |
| Production Norvège | https://www.sodir.no/en/whats-new/news/production-figures/ | Publication mensuelle provisoire, pétrole + LGN + condensats | Repère août 2026 ; automatique indisponible |
| Bilans agricoles | USDA WASDE | Estimations mensuelles ; vérifier les colonnes de révision | Rapport octobre 2026 collecté |
| État et récoltes US | USDA NASS Crop Progress / esmis.nal.usda.gov | Hebdomadaire en saison ; état vs N−1, récolte vs moyenne cinq ans | Source en erreur ; dernière période conservée : 28 septembre |
| Métaux | USGS MCS 2026 | Estimations annuelles ; ce ne sont pas des stocks LME | Repères structurels 2025 |
| Actualités physiques | https://www.eia.gov/rss/todayinenergy.xml | Articles datés de contexte | Dernier article collecté : 7 octobre |
| Power FR physique | ODRE eco2mix-national-tr, https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/eco2mix-national-tr/records | RTE provisoire au quart d'heure ; MW, échanges négatifs = export | Dernière mesure instantané : 12 octobre 05:30 UTC ; lecture directe navigateur |
| Prévisions de demande FR/DE-LU | ENTSO-E A65/A01 ; secret ENTSOE_API_TOKEN | Day-ahead ; MW, prévision datée | Deux zones collectées |
| Prix électriques FR/DE-LU | https://api.energy-charts.info/price | Prix day-ahead de chaque livraison, EUR/MWh ; exiger CC BY 4.0 dans chaque réponse | Attribution Bundesnetzagentur/SMARD ; lecture directe et archive, historique accumulé limité |
| Intraday France ID1/ID3 | EPEX | Marché différent du day-ahead et de l'équilibrage | Pas de flux ouvert réutilisable vérifié ; aucun prix de substitution |
| TTF, PEG, JKM | EEX/ICE, liens de référence | Indices ou futures selon produit | Liens uniquement dans la version initiale |

## Pistes déjà explorées, non encore livrées dans main
- GIE : pagination size=300 avec from/to depuis le 1er janvier N−3 ; toutes les pages déclarées, pour la comparaison annuelle France.
- Brent : étendre les séries quotidiennes EIA/FRED au 1er janvier N−3.
- Power FR : backfill annuel de l'API Energy-Charts ; moyennes quotidiennes pondérées par durée, journées Paris de 23/25 h et passage heure/quart d'heure.
- TTF courant : fichier public EEX https://gasandregistry.eex.com/Gas/NGP/TTF_NGP_15_Mins.csv ; vérifier statut final/provisoire, journée gazière, heure LET, disponibilité et conditions d'usage. Repli historique public sur 60 jours.
- TTF long : Pink Sheet Banque mondiale, colonne Natural gas, Europe ; moyennes mensuelles TTF depuis avril 2015, $/MMBtu. Conversion en €/MWh avec le change moyen du même mois BCE EXR.M.USD.EUR.SP00.A : multiplier par 3,412141633 puis diviser par USD/EUR. Ne pas inventer des clôtures quotidiennes à partir de ces moyennes.
- Référence de forme et de transparence des données : https://github.com/lptva/gb-power-dashboard ; l'adapter à la France et aux besoins du cockpit.

## Méthode de validation d'une nouvelle source
Documenter URL officielle, produit exact, unité, fréquence, observation/publication/collecte, authentification, conditions d'utilisation, limites de requêtes, couverture historique, contrôles, repli et date de la dernière vérification. Une source proposée reste marquée « à vérifier » tant qu'une réponse utilisable et les droits n'ont pas été établis.


## 12 octobre 2026 — Refonte en cours de validation
- Référence de présentation supplémentaire : https://github.com/ronysitepu/commodity-dashboard (pas de licence déclarée). Organisation observée : cartes compactes, tableaux et catégories. Interface réimplémentée indépendamment ; aucune copie de ses prix ni de son code.
- NGP EEX : accès public confirmé, mais republication systématique restreinte. Collecte désormais désactivée par défaut ; condition explicite de droits. Le TTF mensuel Banque mondiale/BCE reste affiché avec sa fréquence.
- Crop Progress : le rapport officiel du 5 octobre existe à https://esmis.nal.usda.gov/sites/default/release-files/796095/prog4026.txt. Collecte corrigée pour examiner les pages de publication datées et garder la plus récente réponse valide.
- Historiques longs : archive préparée le 2 octobre conservée séparément ; fusion par date avec priorité aux observations récentes. Le workflow doit confirmer le nouveau chargement complet GIE avant de présenter 2023/2024 comme reçues.
