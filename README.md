# Commodity Dashboard

Un tableau de bord personnel pour suivre les matières premières et l’électricité en rapprochant les **prix de marché** des **fondamentaux physiques** : stocks, production, consommation, récoltes et échanges.

L’interface, intitulée **Commodity Cockpit**, est en français et organisée en trois pages : **Marchés**, **Physique** et **Power FR**.

**[Télécharger le dashboard HTML](https://github.com/TheoTaillandier/Test2/raw/refs/heads/main/index.html)** — enregistrer `index.html`, puis l’ouvrir dans Chrome ou Edge. Aucun serveur ni installation n’est nécessaire pour le consulter. Les données embarquées restent lisibles sans Internet ; les widgets et les mises à jour en ligne nécessitent une connexion.

## Pourquoi ce projet ?

J’ai voulu construire un outil de veille permettant de comprendre ce qui se passe derrière une variation de prix, plutôt que de consulter séparément des dizaines de sites et de rapports.

La démarche consiste à :

- réunir dans une même interface l’énergie, les métaux, l’agriculture, le change et l’électricité française ;
- comparer la situation actuelle aux années précédentes pour mieux lire la saisonnalité ;
- rapprocher les cotations des données physiques : stocks de brut, stockage gazier, récoltes, bilans agricoles ou mix électrique ;
- rendre chaque chiffre vérifiable grâce à sa source, son unité, sa période et sa date de publication ;
- conserver un fichier HTML autonome, facile à télécharger et à ouvrir, y compris lorsque certains services externes sont bloqués.

Le projet a été enrichi progressivement à partir d’une première version fonctionnelle. Il sert à la veille et à l’apprentissage de l’analyse des marchés : il ne produit pas de prévisions automatiques et ne passe aucun ordre.

## Ce que contient le dashboard

### Marchés

- **Dix cartes de cotations indicatives** : Brent, WTI, gaz US, or et EURUSD, puis blé US, maïs US, café, cacao et aluminium.
- **Graphiques par famille** : énergie, métaux, agriculture et FX, avec définition du produit et lien source. Le titre d’une carte ouvre le graphique correspondant.
- **Références suivies** : TTF, JKM, cuivre et aluminium LME, blé et maïs US/France, café, cacao, EURUSD, EURGBP et EURJPY. Certaines références exactes restent accessibles par lien externe lorsque le widget public refuse leur intégration.
- **Repères physiques et calendrier** : publications EIA, WASDE, Crop Progress et Céré’Obs, avec distinction entre date confirmée et date habituelle à confirmer.
- **Historique publié** : graphiques natifs consultables à partir des données embarquées, même si les widgets ne chargent pas. L’export CSV porte sur les mesures physiques datées, pas sur les cotations des widgets.

Les CFD indicatifs OANDA/Capital.com sont identifiés séparément des contrats officiels. Par exemple, un graphique aluminium CFD n’est pas présenté comme le benchmark aluminium LME.

### Physique

| Secteur | Contenu |
|---|---|
| **Pétrole** | Brent spot comparé par année, Brent/WTI spot sur douze mois, écart Brent−WTI aux mêmes dates et stocks commerciaux de brut US hors réserve stratégique sur quatre années. |
| **Gaz et GNL** | Stockage France/UE, comparaison annuelle, repère TTF mensuel, stockage US et indicateurs GNL. Stock liquide et send-out énergétique gardent leurs unités distinctes. |
| **Grains US** | Bilans WASDE, état des cultures et avancement des récoltes Crop Progress, avec comparaisons disponibles. |
| **Grains France** | Semis, récoltes et conditions du blé et du maïs issus de Céré’Obs ; campagnes et dates de mesure/publication explicites. |
| **Café** | Production et stocks finaux prévus au Brésil et au Vietnam selon USDA FAS PS&D, par campagne. |
| **Cacao** | Production mondiale, broyages et stocks estimés issus du communiqué public ICCO, pour la campagne réellement publiée. |
| **Métaux** | Repères annuels de production USGS, facteurs physiques à surveiller et accès aux références LME. Les inventaires quotidiens LME ne sont pas connectés. |

Chaque vue privilégie quelques faits chiffrés, puis donne accès aux graphiques, aux mesures détaillées et à leurs sources. Les comparaisons annuelles utilisent les observations réellement disponibles.

### Power FR

- **Prix day-ahead France** : créneau actuellement livré, moyenne d’aujourd’hui et de demain lorsque la journée complète est disponible.
- **Comparaison européenne** : France face à DE-LU, à la Belgique ou à l’Italie du Nord ; écart calculé sur les mêmes créneaux de livraison.
- **Historique annuel** : comparaison depuis 2023, sur des moyennes quotidiennes cohérentes.
- **Bilan électrique RTE** : production par filière en GW et en part du mix, consommation, nucléaire, éolien, solaire, gaz et échanges. Des échanges négatifs correspondent à un export net.
- **Prévisions ENTSO-E** : demande day-ahead France et Allemagne/Luxembourg.

Les moyennes de prix sont pondérées par la durée des créneaux. Le calcul tient compte des journées de 23 ou 25 heures en heure de Paris et exclut les journées incomplètes. La profondeur de l’archive physique RTE est affichée : elle ne doit pas être confondue avec l’historique annuel des prix.

**Le day-ahead est un prix fixé pour une livraison future ; ce n’est pas une cotation intraday.** Les indices EPEX ID1/ID3 ne sont pas connectés.

## Sources des données

Les tableaux décrivent les sources exploitées par le code et leur usage. Leur disponibilité, leurs délais et leurs conditions peuvent évoluer. Le [registre des sources](docs/source-register.md) conserve les vérifications datées ; la [méthodologie](methodology.md) détaille les calculs.

### Cotations, énergie et gaz

| Source | Données utilisées | Fréquence, nature et accès |
|---|---|---|
| [TradingView](https://www.tradingview.com/) — notamment OANDA et Capital.com | Cartes et graphiques de prix indicatifs ; FX et instruments sélectionnables. | Widgets externes. Cadence et délai propres au fournisseur et au symbole. Plusieurs instruments sont des CFD ; aucune API Capital.com directe n’est connectée. |
| [EIA — prix spot](https://www.eia.gov/dnav/pet/pet_pri_spt_s1_d.htm) et [Henry Hub](https://www.eia.gov/dnav/ng/NG_PRI_FUT_S1_D.htm) | Brent Europe, WTI Cushing, gaz Henry Hub. | Observations quotidiennes publiées avec décalage, en $/bbl ou $/MMBtu. Ce ne sont pas des cotations en séance. |
| [EIA — Weekly Petroleum Status Report](https://www.eia.gov/petroleum/supply/weekly/) | Stocks commerciaux de brut hors SPR, produits pétroliers et flux US. | Hebdomadaire. Stocks en volumes ; flux en volumes par jour. |
| [EIA — Weekly Natural Gas Storage Report](https://ir.eia.gov/ngs/ngs.html) | Stockage gazier US, variation et écart à la moyenne cinq ans. | Hebdomadaire, en Bcf. |
| [FRED](https://fred.stlouisfed.org/series/DCOILBRENTEU), repli [datasets/oil-prices](https://github.com/datasets/oil-prices) | Historique des séries Brent/WTI issues de l’EIA. | Quotidien publié. FRED est un diffuseur de ces séries ; le miroir est un repli technique identifié. Aucun prix inventé les jours sans observation. |
| [GIE AGSI+](https://agsi.gie.eu/) | Stockage gazier France/UE, remplissage et flux associés. | Quotidien selon publication : %, TWh, GWh/j. API avec clé GIE utilisée côté GitHub Actions. |
| [GIE ALSI](https://alsi.gie.eu/) | Stocks de GNL et send-out France/UE. | Quotidien. Stock liquide en milliers de m³ et send-out en GWh/j ; accès ALSI requis avec la clé GIE. |
| [Banque mondiale — Pink Sheet](https://www.worldbank.org/en/research/commodity-markets) | Série « Natural gas, Europe », référence TTF depuis avril 2015. | Moyennes **mensuelles**, initialement en $/MMBtu, utilisées pour l’historique et le repère publié. |
| [BCE — taux de change](https://data.ecb.europa.eu/) | Change moyen mensuel USD pour 1 EUR, série `EXR.M.USD.EUR.SP00.A`. | Conversion TTF : $/MMBtu × 3,412141633 ÷ USD/EUR = €/MWh, avec le change du même mois. |
| [EIA — Today in Energy](https://www.eia.gov/rss/todayinenergy.xml) | Articles de contexte datés pour les vues pétrole/gaz. | Flux RSS ; ce n’est pas un fil de marché en temps réel. |

### Agriculture et métaux

| Source | Données utilisées | Fréquence, nature et accès |
|---|---|---|
| [USDA — WASDE](https://www.usda.gov/about-usda/general-information/staff-offices/office-chief-economist/commodity-markets/wasde-report), repli [archive officielle NAL ESMIS](https://esmis.nal.usda.gov/publication/world-agricultural-supply-and-demand-estimates) | Bilans de production, consommation, échanges et stocks agricoles. | Estimations mensuelles par campagne. Les unités d’origine sont précisées dans les mesures. |
| [USDA NASS — Crop Progress](https://esmis.nal.usda.gov/publication/crop-progress) | État des cultures et progression des récoltes US. | Hebdomadaire en saison, en %. Semaine mesurée et date publiée distinctes ; une comparaison absente reste absente. Recherche des publications décalées après jour férié. |
| [FranceAgriMer — Céré’Obs](https://cereobs.franceagrimer.fr/) | Tableaux nationaux blé/maïs : semis, récolte, conditions. | Publications hebdomadaires XLS, mesures en %. Campagne de récolte explicite. Attribution FranceAgriMer conservée. |
| [USDA FAS — PS&D café](https://apps.fas.usda.gov/psdonline/downloads/psd_coffee_csv.zip) | Production et stocks finaux prévus de café au Brésil et au Vietnam. | Estimations par campagne et mises à jour PS&D. Milliers de sacs de 60 kg à la source, millions à l’écran. Ce ne sont pas les stocks certifiés ICE. |
| [ICCO — communiqué du bulletin trimestriel](https://www.icco.org/quarterly-bulletin-of-cocoa-statistics-2/) | Production mondiale de cacao, broyages et stocks finaux estimés. | Quelques faits du communiqué public, en millions de tonnes. Aucun bulletin payant collecté ; campagne affichée telle que publiée, même si elle est ancienne. |
| [USGS — Mineral Commodity Summaries](https://www.usgs.gov/centers/national-minerals-information-center/mineral-commodity-summaries) | Repères de production mondiale de cuivre et d’aluminium. | Estimations annuelles ; ce ne sont ni des cours ni des stocks d’entrepôts LME. |

### Électricité et références complémentaires

| Source | Données utilisées | Fréquence, nature et accès |
|---|---|---|
| [RTE / ODRE — éCO₂mix national temps réel](https://opendata.reseaux-energies.fr/explore/dataset/eco2mix-national-tr/) | Consommation, production par filière, échanges et intensité CO₂ France. | Mesures provisoires au quart d’heure, selon disponibilité. MW à la source, GW et parts du mix dans l’interface. Lecture publique directe et archive du collecteur. |
| [Fraunhofer ISE — Energy-Charts](https://www.energy-charts.info/charts/price_spot_market/chart.htm?c=FR) | Prix day-ahead FR, DE-LU, Belgique et Italie du Nord. | Créneaux en €/MWh. Licence CC BY 4.0 contrôlée dans les réponses ; attribution Bundesnetzagentur/SMARD conservée lorsqu’elle est fournie. |
| [ENTSO-E Transparency](https://transparency.entsoe.eu/) | Prévisions de demande day-ahead FR/DE-LU, documents A65/A01. | MW, prévisions datées. Jeton nécessaire, utilisé uniquement côté collecte. |
| [Sodir — production norvégienne](https://www.sodir.no/en/whats-new/news/production-figures/) | Repère de production pétrole, LGN et condensats. | Publication mensuelle provisoire. Repère documentaire daté ; collecte automatique non connectée. |

EEX, ICE, LME, EPEX et Trading Economics servent aussi de **liens de référence**. Un lien affiché ne signifie pas qu’un flux de données est intégré.

## Ce qui a été essayé et les limites actuelles

| Besoin | Travail réalisé et état actuel |
|---|---|
| **Références exactes dans les widgets gratuits** | Les symboles TTF ICE Endex, JKM NYMEX, cuivre/aluminium LME, blé/maïs CBOT et café/cacao ICE US ont été testés. Les widgets ont refusé leur intégration lors des contrôles datés du registre. Liens externes conservés ; alternatives CFD séparées et nommées. MATIF blé/maïs et plusieurs CFD ont effectivement chargé lors des contrôles. |
| **Autre diffusion que TradingView** | Trading Economics et l’API REST/WebSocket Capital.com ont été étudiés. L’intégration Trading Economics nécessite un abonnement ; Capital.com exige un compte, une clé et une vérification des droits/couvertures. Aucun de ces flux directs n’est connecté, aucun abonnement nouveau n’a été activé. |
| **TTF courant via EEX** | Les fichiers NGP publics ont été examinés. Leur téléchargement ne suffit pas à établir un droit de republication automatique. Collecte désactivée par défaut ; repère mensuel Banque mondiale/BCE distinct. |
| **Inventaires LME** | Aucun flux automatique réutilisable vérifié n’est connecté. Les repères annuels USGS et les liens LME sont conservés avec leur définition. |
| **Intraday électrique** | Les indices EPEX ID1/ID3 restent non connectés. Aucun prix day-ahead ou d’équilibrage n’est rebaptisé intraday. |
| **Comparaison sur quatre années** | Historiques Brent/WTI, stocks de brut US, stockage France/UE, TTF mensuel et prix Power enrichis. La couverture dépend de chaque série ; les trous restent visibles et les périodes suivent les observations réellement reçues. |
| **Fiabilité des publications physiques** | Pagination GIE, repli officiel WASDE, Crop Progress après jour férié, trois collecteurs agricoles publics, contrôles d’unités/campagnes et conservation des dernières observations valides en cas d’erreur de source. |

Les prix indicatifs, les prix spot publiés, les futures, les moyennes mensuelles et les prix day-ahead répondent à des usages différents. Le dashboard les distingue ; leur présence côte à côte ne les rend pas interchangeables.

## Mises à jour et fonctionnement hors connexion

1. **Collecte GitHub Actions** : tâche programmée toutes les deux heures. Le lancement peut être retardé par GitHub ; chaque source conserve sa propre fréquence de publication.
2. **Validation et archivage** : le collecteur normalise observations, dates et unités, puis met à jour les JSON. Les erreurs sont signalées et les dernières données valides sont conservées lorsqu’une source échoue.
3. **Construction** : le compilateur intègre CSS, JavaScript et données datées dans `index.html`.
4. **Ouverture** : le dashboard affiche l’instantané embarqué, puis tente de charger les JSON récents depuis GitHub. **Rafraîchir** relance cette lecture. Un accès bloqué laisse l’instantané daté consultable.
5. **Lectures directes** : vérification des prix Energy-Charts toutes les 30 minutes lorsque la page est visible, et de RTE toutes les 15 minutes lorsque Power FR est affiché. Ce sont des cadences de vérification, pas une garantie de nouvelle observation.

Date de collecte, date mesurée et date publiée peuvent différer. Une estimation annuelle ou mensuelle n’est pas jugée comme une mesure électrique au quart d’heure. Les widgets suivent leur fournisseur et ne sont pas disponibles hors connexion.

## Architecture technique

**HTML/CSS/JavaScript pour l’interface**, **Python pour la collecte et la compilation**, **GitHub Actions pour l’automatisation**. Les sources sont séparées pour la maintenance ; le résultat reste un fichier HTML unique.

| Chemin | Rôle |
|---|---|
| `app/template.html` | Structure des trois pages. |
| `app/styles.css` | Présentation et adaptation ordinateur/mobile. |
| `app/cockpit.js` | Navigation, graphiques SVG, widgets, rafraîchissements et export CSV. |
| `app/power_metrics.js` | Calculs Power partagés avec les tests : moyennes, couverture, fusion des zones. |
| `scripts/update_data.py` | Collecte, validation et normalisation des sources. |
| `scripts/physical_sources.py` | Collecteurs Céré’Obs, café PS&D et cacao ICCO. |
| `scripts/build_dashboard.py` | Génération de `index.html` à partir des sources et données. |
| `data/snapshot.json` | Mesures, publications, état des sources et historiques associés. |
| `data/long_history.json` | Historique long conservé séparément. |
| `data/power_fr.json` / `data/power_prices.json` | Archive physique RTE et séries de prix électriques. |
| `tests/` | Tests des parseurs, calculs, compilation, interface et widgets. |
| `.github/workflows/` | Collecte automatique et validation de l’interface. |
| `index.html` | Fichier généré à télécharger ; ne pas l’éditer directement. |

### Développer et vérifier

La CI utilise Python 3.12 et Node.js 22. Pour reconstruire avec les données déjà présentes :

```bash
git clone https://github.com/TheoTaillandier/Test2.git commodity-dashboard
cd commodity-dashboard
python -m pip install -r requirements.txt
python -m unittest discover -s tests -v
node tests/test_power_metrics.cjs
node --check app/cockpit.js
python scripts/build_dashboard.py
```

Modifier `app/` ou `scripts/`, puis reconstruire. `xlrd` est nécessaire au collecteur pour lire les XLS Céré’Obs ; aucune dépendance Python n’est nécessaire pour consulter le HTML.

Pour les contrôles navigateur :

```bash
npm install --ignore-scripts
npx playwright install chromium
npm run test:ui
node tests/check_live_widgets.cjs
```

Le contrôle de l’interface utilise les données embarquées et bloque les ressources externes. Il couvre les pages/sous-marchés à 1440, 390 et 320 px : navigation, graphiques, export et débordements. Le contrôle des widgets est séparé, nécessite Internet et dépend de leur disponibilité. Les [artefacts de validation de l’interface](https://github.com/TheoTaillandier/Test2/actions/workflows/validate-ui.yml) contiennent les captures et résultats.

### Accès du collecteur

La collecte complète (`python scripts/update_data.py`) s’exécute dans GitHub Actions avec les accès configurés. Une exécution locale complète exige les accès correspondants ; les tests et la reconstruction depuis les JSON existants n’en ont pas besoin.

- `GIE_API_KEY` : secret Actions pour AGSI+/ALSI.
- `ENTSOE_API_TOKEN` : secret Actions pour les prévisions ENTSO-E.
- `EEX_NGP_REDISTRIBUTION_ALLOWED=true` : variable réservée à un droit de redistribution obtenu séparément. Elle ne confère aucun droit à elle seule et ne doit pas être activée sans celui-ci.

**Aucune clé ne doit être placée dans le HTML, le JavaScript public ou un fichier commité.** Une collecte locale sans les accès GIE/ENTSO-E n’équivaut pas à la collecte configurée sur GitHub et peut retirer les séries qui en dépendent.

## Documentation et attribution

- [Méthodologie : sources, unités et calculs](methodology.md).
- [Registre des sources : accès vérifiés et limites datées](docs/source-register.md).
- [Journal de maintenance : décisions, livraisons et validations](docs/agent-journal.md).

Code du dashboard et données de tiers sont des éléments distincts. Les données et widgets restent soumis aux conditions de leurs fournisseurs ; leur affichage ici ne donne pas un droit général de redistribution. Les attributions et liens vers les sources doivent être conservés.
