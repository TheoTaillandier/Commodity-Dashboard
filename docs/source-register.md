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

## Couverture livrée le 12 octobre 2026
- France/UE AGSI : 1379 observations par région, du 1er janvier 2023 au 10 octobre 2026. Les quatre courbes annuelles sont réellement disponibles.
- Brent/WTI : 951/937 observations quotidiennes depuis 2023, dernière date 6 octobre 2026.
- Power FR : 1381 moyennes quotidiennes de journées complètes depuis 2023 jusqu’au 12 octobre 2026 ; prix FR/DE-LU de demain reçus. Licence CC BY 4.0 contrôlée. RTE a livré une mesure du 12 octobre 14:15 UTC.
- Banque mondiale/BCE : 45 moyennes mensuelles TTF 2023–septembre 2026 ; ce sont des niveaux mensuels, explicitement séparés d’un cours en séance.
- USDA Crop Progress 5 octobre : les comparaisons N−1 sont absentes (« NA »). Le parseur doit conserver les valeurs actuelles sans inventer la comparaison. La semaine mesurée est le 4 octobre ; publication le 5. Aucun report de la comparaison N−1 du rapport précédent sur ce nouveau rapport.

## 13 octobre 2026 — Instruments, pétrole et comparateurs Power
- Sélecteur TradingView : ICEENDEX:TFM1!, NYMEX:JKM1!, LME:CA1!/AH1!, CBOT:ZW1!/ZC1!, EURONEXT:EBM1!/EMA1!, ICEUS:KC1!/CC1!, OANDA:EURUSD/EURGBP/EURJPY. Références mensuelles continues et unités affichées. Pages publiques LME/MATIF/TTF/JKM vérifiées ; l’accès à chaque instrument dans les widgets gratuits reste soumis au fournisseur. Pas de substitution COMEX → LME, ni de contrat mensuel → benchmark 3 mois.
- Trading Economics : https://widgets.tradingeconomics.com/getting-started et son application officielle demandent un Subscription Plan. Aucun service payant activé. Liens publics TTF et https://tradingeconomics.com/commodity/liquefied-natural-gas-japan-korea ajoutés.
- EIA WPSR psw00.json : 196 mesures hebdomadaires de stocks commerciaux hors SPR du 6 janvier 2023 au 2 octobre 2026. Le parseur conserve quatre années civiles ; valeurs supprimées, invalides et futures exclues.
- Energy-Charts /price : réponses BE et IT-North vérifiées le 13 octobre, 960 créneaux par zone reçus, dernière livraison 13 octobre 21:45 UTC. CC BY 4.0 / Bundesnetzagentur SMARD déclaré dans chaque réponse. FR/DE-LU restent conservés à leur date de collecte antérieure. Les quatre zones sont désormais collectées et comparables sans modifier les prévisions ENTSO-E FR/DE.

### Vérification réelle des widgets du 13 octobre
Les widgets publics refusent TTF ICE Endex, JKM NYMEX, cuivre/aluminium LME, CBOT blé/maïs et ICE US café/cacao, avec notification « Symbole disponible uniquement sur TradingView ». MATIF blé/maïs, Brent et EURJPY ont chargé en ligne. Les références refusées proposent un accès externe explicite. Les graphiques indicatifs blé/maïs OANDA et café/cacao Capital.com ont réellement chargé lors du contrôle fournisseur 38378069777. TTF et JKM en séance, cuivre/aluminium LME restent en accès externe ; le TTF mensuel embarqué reste consultable. Aucun benchmark officiel n’est remplacé silencieusement.

## 13 octobre 2026 — Deuxième ligne de cotations
- Cinq nouvelles cartes : OANDA:WHEATUSD, OANDA:CORNUSD, CAPITALCOM:COFFEE, CAPITALCOM:COCOA, CAPITALCOM:ALUMINUM. Prix et variations chargés dans les widgets publics Single Quote ; captures en ligne inspectées. Ce sont des CFD indicatifs ; l’aluminium ne représente pas le benchmark LME officiel. Les cinq cartes précédentes restent en première ligne.
- Distribution actuelle : widgets TradingView. Une cotation OANDA/Capital.com dans ce widget ne constitue pas une connexion directe à leur API.
- Autre diffusion étudiée : API officielle Capital.com https://open-api.capital.com/ (REST et WebSocket, environnement démo disponible). Authentification par compte et clé API nécessaire ; couverture des instruments et droits de réutilisation à vérifier avant connexion. Aucun compte, abonnement ni flux direct activé. Trading Economics nécessite un plan pour son intégration, comme indiqué plus haut.

## 14 octobre 2026 — Sources physiques supplémentaires vérifiées
- FranceAgriMer Céré’Obs : API publique `/cereobs-sp/api/public/publications/getPublicationParDerniereSemaine`, tableaux nationaux XLS via `rapportExcel?idPublication=…`. Seules les métadonnées et mesures nationales sont conservées ; les contacts régionaux présents dans l’index ne sont ni utilisés ni copiés dans le dépôt. Rapport mesuré au 5 octobre, publié le 9 : maïs récolte 2026 (récolté 84 %, bonnes/très bonnes 22 %), semis blé récolte 2027 (4 %). En-tête de reproduction : mention de la source obligatoire, attribution et lien conservés. L’archive data.gouv.fr maïs (Licence Ouverte 2.0) s’arrête à S35 ; elle n’est pas présentée comme la dernière semaine.
- USDA FAS café : https://apps.fas.usda.gov/psdonline/downloads/psd_coffee_csv.zip . PS&D café vert, données nationales Brésil/Vietnam. Unité originale : milliers de sacs de 60 kg ; conversion affichée en millions. Campagne 2026/27, mois de mise à jour du fichier juillet 2026. Production et stocks finaux prévus, comparaison à la campagne précédente ; aucune cotation live ni inventaire certifié ICE.
- ICCO : dernier communiqué trimestriel public via https://www.icco.org/quarterly-bulletin-of-cocoa-statistics-2/ . Communiqué du 31 août 2026 : production 4,733 Mt, broyages 4,649 Mt, stocks estimés 1,309 Mt, campagne 2024/25. Les chiffres 2025/26 sont temporairement retenus par la source ; ne pas les inventer. Trois faits du communiqué seulement, aucun bulletin payant téléchargé.
- USDA Crop Progress : la publication du mardi 13 octobre est réellement reçue (semaine du 11). L’index ancien ne doit pas arrêter la recherche avant les pages datées récentes. WASDE octobre : archive officielle https://esmis.nal.usda.gov/sites/default/release-files/796099/wasde1026.txt vérifiée comme repli à l’ancien endpoint USDA.
- LME : inventaires sous conditions d’accès/réutilisation, aucun flux automatique publiable vérifié dans ce passage. Capital.com REST/WebSocket : accès compte/clé et droits à établir, non connecté. Futures TTF/JKM/LME exacts restent externes ; CFD cuivre/aluminium sont explicitement distincts.
