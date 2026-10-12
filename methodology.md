# Méthodologie du Commodity Cockpit

## Ce que signifient les chiffres

| Étiquette | Sens | Exemple |
|---|---|---|
| Observé provisoire | Mesure publiée, susceptible de révision | Consommation et production RTE éCO2mix |
| Calculé | Opération déterministe sur des mesures datées | Demande résiduelle = consommation − éolien − solaire |
| Indicateur tiers | Cotation fournie par un widget externe, avec ses horaires et délais | Brent indicatif OANDA via TradingView |
| Repère daté | Publication officielle différée, sans prétention de temps réel | Spot Brent EIA, stockage GIE, récoltes USDA |
| Structurel | Estimation annuelle, inadaptée à un signal de séance | Production minière USGS |

Les niveaux de stockage, les débits, les cotations CFD, les prix spot quotidiens et les contrats à terme sont des objets distincts. Le site ne calcule pas de variation de prix à partir d'un seul chiffre physique. Les sources sans droit de rediffusion vérifié, notamment les cours live TTF, PEG, JKM et certains prix électriques, restent des liens explicites.

## Power France

Source : [RTE éCO2mix national temps réel](https://opendata.reseaux-energies.fr/explore/dataset/eco2mix-national-tr/). L'ETL lit les pages les plus récentes, trie et valide les observations, puis conserve le dernier relevé de chaque heure UTC. Le fichier `data/power_fr.json` accumule les heures réellement reçues sur 365 jours glissants. Il ne remplit pas les trous. La première collecte ne crée donc pas artificiellement un an d'histoire. La courbe indique la couverture entre sa première et sa dernière observation affichées.

| Champ du site | Origine | Unité | Interprétation |
|---|---|---|---|
| Demande | `consommation` RTE | MW | Charge nationale observée |
| Gaz électrique | `gaz` RTE | MW | Puissance électrique produite à partir de gaz |
| Éolien + solaire | `eolien + solaire` RTE | MW | Somme de deux filières observées |
| Demande résiduelle | `consommation − eolien − solaire` | MW | Indicateur calculé de besoin restant ; ni prix ni production thermique obligée |
| Échanges nets | `ech_physiques` RTE | MW | Négatif : exportateur net ; positif : importateur net |

Le graphique 24 h de la page Power utilise les relevés au quart d'heure de l'instantané ou les derniers points RTE récupérés directement par le navigateur. Le graphique historique utilise les relevés horaires accumulés. Chaque graphique porte sa propre échelle ; deux courbes de graphiques différents ne sont pas directement comparables en hauteur. Une interruption de collecte n'est pas interpolée. Un relevé ancien est signalé comme archive.

Prévisions : ENTSO-E A65/A01 pour la France et DE-LU, avec le jeton du dépôt. Le pic affiché est la demande prévue, pas une consommation déjà réalisée. Les prix day-ahead ne sont pas déduits de ces prévisions.

Prix day-ahead : l'API Fraunhofer ISE Energy-Charts fournit les périodes de livraison France et DE-LU en EUR/MWh. L'ETL et la lecture directe du navigateur vérifient `CC BY 4.0`, l'unité, la cohérence des séries et leur fraîcheur avant publication ou affichage ; l'attribution exacte de la réponse (actuellement Bundesnetzagentur / SMARD) accompagne les chiffres. `data/power_prices.json` accumule les seules périodes effectivement reçues sur 365 jours glissants. Le navigateur vérifie à nouveau les deux zones à l'ouverture, puis toutes les 30 minutes lorsque la page reste visible ; si cet accès échoue, l'instantané GitHub ou le HTML embarqué reste affiché avec sa date. La moyenne de demain n'est calculée que si au moins 80 % des créneaux attendus sont disponibles ; elle est arithmétique. L'écart France − DE-LU apparie exclusivement des timestamps identiques. Les minutes à prix négatif utilisent la durée réelle du pas de la série. Les graphiques utilisent le même axe monétaire pour les deux zones. Les tuiles « repricing », « pointe » et « écart de zone » sont des différences arithmétiques, sans causalité attribuée. Le repère prix / demande résiduelle utilise les seuls créneaux avec un prix et une mesure RTE au même timestamp parmi les sept derniers jours ; il divise les observations à la médiane de la demande résiduelle et affiche les prix moyens, les effectifs et le seuil. Il décrit une association historique ; l'enchère de prix a eu lieu la veille des mesures RTE.

Le day-ahead est fixé la veille pour une période future. Le prix d'une période en cours n'est donc pas une cotation en direct. Le flux intraday continu EPEX n'a pas été collecté : ENTSO-E 12.1.d ne rend sa publication que facultative, et l'accès public à un résultat sur un site n'autorise pas automatiquement sa récupération ni sa redistribution. Le prix d'équilibrage / de règlement des écarts est un autre marché et n'est pas substitué à l'intraday. Les comparaisons avec la demande résiduelle RTE sont descriptives et portent sur la même période de livraison, sans prétendre démontrer une causalité.

## Autres séries et mise à jour

- Pétrole : prix spot quotidiens EIA datés par FRED ou miroir public des séries EIA. Le collecteur garde les trois années calendaires complètes précédentes et l'année courante. La comparaison Brent/WTI reste sur douze mois ; la comparaison annuelle du Brent superpose N, N−1, N−2 et N−3. Les jours sans cours restent absents. Pour les cases au même jour, une clôture du dernier jour ouvré précédent peut être retenue à quatre jours maximum, avec sa date. Les widgets OANDA ont une autre définition de produit.
- Gaz : stockage France/UE GIE AGSI+ en pourcentage, pagination complète depuis le 1er janvier N−3 (`from`, `to`, `size=300`, toutes les pages déclarées). La France est tracée par année sur un axe fixe 0–100 % ; les cases comparent des dates identiques. Un changement de capacité peut affecter la comparaison. Les terminaux GNL GIE ALSI restent en volume et en émission. Un soutirage net positif réduit le stock, une injection nette l'augmente.
- Agriculture : estimations mensuelles USDA WASDE ; conditions et avancement des récoltes USDA NASS, comparés respectivement à N−1 et à la moyenne cinq ans selon le champ du rapport. Les liens météo ne sont pas présentés comme des mesures de récolte.
- Métaux : production annuelle estimée par l'USGS ; pas de stock LME fabriqué ni de signal de marché issu d'une estimation annuelle.

## Prix comparés par année

Les quatre courbes sont alignées par mois/jour sur un calendrier commun de 365 jours. Le 29 février est omis de cette superposition, sans modifier les séries d'origine. Les légendes donnent les années explicites et permettent de masquer une courbe. Les ruptures dépassant le délai propre à chaque série restent visibles. Le repère blanc, sa valeur, sa fréquence et sa date sont affichés séparément.

**Power FR** : `history.power_prices_daily` dans l'instantané garde les moyennes des journées de livraison depuis le 1er janvier N−3. La source est la même API Energy-Charts / Bundesnetzagentur / SMARD, sous CC BY 4.0 vérifiée dans chaque réponse. Le calcul pondère chaque prix par la durée de son créneau ; les jours Paris de 23 et 25 heures et le changement de résolution horaire/quart-horaire sont conservés. Il faut au moins 99 % de la durée attendue : les jours incomplets sont exclus. Les années déjà complètes sont réutilisées ; dix jours récents sont relus à chaque collecte. Les requêtes du collecteur vers ce fournisseur sont espacées pour respecter sa limite. La ligne blanche indique le créneau day-ahead livré aujourd'hui, alors que les courbes et les cases représentent des moyennes quotidiennes. Avant publication de l'enchère de demain, les cartes du haut montrent les chiffres d'aujourd'hui, avec des titres explicites.

**TTF spot NGP EEX** : le collecteur sait valider la journée gazière courante, l’heure LET et le statut final/provisoire du fichier public. Cependant, le téléchargement public ne donne pas un droit de republication systématique. Les [conditions du Market Data Hub](https://www.eex.com/en/market-data/market-data-hub) et les [licences EEX](https://www.eex.com/en/market-data/licensing-policies) ont été vérifiées le 12 octobre 2026. Le NGP est désactivé par défaut ; il ne peut être publié que si la variable `EEX_NGP_REDISTRIBUTION_ALLOWED=true` est configurée après obtention des droits. Sans droit, aucun NGP courant ni historique EEX n’est embarqué. Le TTF mensuel ci-dessous reste un repère distinct, pas un prix live.

**TTF historique long** : [Pink Sheet Banque mondiale](https://www.worldbank.org/en/research/commodity-markets), colonne « Natural gas, Europe » (TTF depuis avril 2015), moyennes **mensuelles**, $/MMBtu. Conversion calculée : €/MWh = $/MMBtu × 3,412141633 ÷ USD par EUR moyen du même mois, source BCE `EXR.M.USD.EUR.SP00.A`. Les valeurs d'origine et le change sont conservés dans `history.ttf_monthly`. Aucune observation quotidienne n'est déduite de ces moyennes. Si un NGP autorisé est connecté, la ligne blanche le distingue des moyennes mensuelles ; sinon, le dernier mois publié reste le repère affiché. Les références PEG et JKM restent des liens tant qu'un flux redistribuable n'est pas configuré.

GitHub Actions est programmé toutes les deux heures, mais GitHub peut retarder un déclenchement. Chaque source a son statut et sa date. Si une collecte échoue, la dernière mesure valide est conservée et marquée comme telle. Le HTML téléchargeable contient un instantané des données et l'historique Power ; son bouton « Actualiser les données » récupère les JSON les plus récents depuis GitHub si le navigateur peut y accéder. Sur la page Power visible, le navigateur tente aussi le relevé RTE public toutes les 15 minutes (la source publie au quart d'heure) et les prix day-ahead toutes les 30 minutes. Ces lectures exigent une connexion et un accès CORS autorisé par les sources ; un échec conserve l'archive datée. Le prix du créneau livré évolue avec les créneaux, mais chaque prix day-ahead a été fixé la veille. Les jetons restent dans les secrets GitHub Actions.

## Interface autonome et validation

Les sources HTML, CSS et JavaScript sont maintenues dans `app/`. Le compilateur Python embarque le code et les trois fichiers JSON dans un seul `index.html`. Le JSON est compacté et les délimiteurs HTML sont échappés ; une erreur de compilation conserve le dernier fichier valide. Les observations des historiques longs déjà vérifiés sont conservées dans `data/long_history.json`, puis fusionnées par date en donnant priorité aux nouvelles collectes. Les archives ne remplacent jamais une mesure plus récente.

Les graphiques SVG natifs montrent des axes numériques, unités, dates et valeurs au survol. Les ruptures de collecte restent visibles. La page Marchés propose un historique publié qui fonctionne sans widgets externes. Les tableaux physiques distinguent valeur, comparaison, période et commentaire ; aucune causalité instantanée n’est déduite automatiquement.

`validate-ui.yml` vérifie le rendu dans Chromium aux largeurs 1440, 390 et 320 pixels, les tableaux, la navigation, les comparaisons annuelles et l’absence de débordement. Les captures et le rapport sont conservés sept jours dans les artefacts GitHub Actions. Les tests désactivent les appels externes pour contrôler réellement le repli hors connexion ; ils ne prétendent pas garantir la disponibilité des fournisseurs tiers.
