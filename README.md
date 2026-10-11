# Commodity Cockpit

Tableau de bord personnel des matières premières. Dans l'onglet **Code**, ouvrir [`index.html`](index.html), cliquer sur **Raw** ou **Download raw file**, enregistrer le fichier en `.html`, puis l'ouvrir dans un navigateur. Le code HTML complet figure aussi ci-dessous.

Les cotations en séance Brent, WTI et gaz US sont des widgets TradingView/OANDA : elles demandent Internet et sont indicatives, distinctes du contrat ICE et de Henry Hub physique. Le spot officiel EIA est montré séparément avec sa date. Les autres chiffres officiels sont collectés par [la tâche planifiée](.github/workflows/update-data.yml). Le bouton **Actualiser les données** récupère la dernière publication GitHub même depuis un HTML téléchargé ; hors connexion, le fichier garde son instantané daté. L'onglet **Power FR** montre les prix day-ahead France/DE-LU, les observations RTE, une lecture des écarts et les prévisions de demande ENTSO-E. [Méthodologie, unités et limites](methodology.md).

## Sources & automatisation

- EIA WPSR : stocks de brut, Cushing, Gulf Coast, essence, distillats, jet et SPR ; production, importations, exportations et brut traité par les raffineries US.
- EIA WNGSR : stockage de gaz US et régions, variation hebdomadaire et écart à la moyenne cinq ans.
- USDA WASDE : production, exportations prévues et stocks de maïs et soja US ; stocks mondiaux de maïs et blé, commerce mondial prévu du blé. Les révisions comparent les deux colonnes de prévision du même rapport.
- USDA NASS Crop Progress : état bon/excellent du maïs et du soja US comparé à la même semaine N−1, avancement de récolte comparé à la moyenne cinq ans ; rapport hebdomadaire en saison, daté et validé avant publication. Les liens FranceAgriMer et météo restent des sources à consulter, pas des observations inventées.
- EIA Today in Energy : titres et résumés d'analyses récentes.
- Sodir (Norwegian Offshore Directorate) : chiffre mensuel provisoire d'août 2026 (pétrole, LGN et condensats), repère européen daté ; la source refuse actuellement les lectures automatisées du robot GitHub et ce chiffre n'est donc pas rafraîchi automatiquement.
- EIA, tableaux de prix spot quotidiens : Brent Europe, WTI Cushing et Henry Hub ; le collecteur vérifie la correspondance des six dates et six colonnes avant publication. Une série de 12 mois compare les clôtures spot Brent et WTI : FRED, puis miroir public EIA `datasets/oil-prices` si FRED est indisponible, avec date et provenance explicites ; elle ne se substitue pas à la cotation en séance.
- GIE AGSI+ / ALSI : avec une clé API gratuite (accès aux **deux plateformes**), stockage gaz France/UE, soutirage net, stocks en cuves GNL et émissions des terminaux GNL France/UE. Ce sont des observations physiques quotidiennes, **pas des prix TTF, PEG ou JKM**. Créer la clé sur https://agsi.gie.eu/account, choisir accès AGSI + ALSI et enregistrer `GIE_API_KEY` dans Settings → Secrets and variables → Actions → New repository secret. Relancer le workflow depuis Actions. Sans clé, ces chiffres ne sont pas affichés.
- RTE éCO2mix national temps réel : [dataset officiel](https://opendata.reseaux-energies.fr/explore/dataset/eco2mix-national-tr/) actualisé à la source au quart d'heure ; consommation, nucléaire, gaz, vent, solaire, hydraulique, bioénergies et échanges physiques. Export = solde négatif ; import = positif. Le cockpit collecte les dernières pages toutes les deux heures et conserve le dernier relevé de chaque heure dans `data/power_fr.json` sur 365 jours glissants. L'historique s'accumule depuis la première collecte, il n'invente pas une année déjà acquise. Il est aussi embarqué dans le HTML téléchargé. Demande résiduelle = consommation − éolien − solaire (calcul indicatif, **pas une prévision du prix**). Aucun compte requis.
- ENTSO-E : prévision *day-ahead* de demande (A65/A01, Article 6.1.b, données [CC BY 4.0](https://transparencyplatform.zendesk.com/hc/en-us/articles/40921911218961-Legal-Terms-and-Conditions)), France et Allemagne/Luxembourg ; affichage du pic prévu pour les prochaines 24 heures. Pour activer : créer un compte sur https://transparency.entsoe.eu/, demander l'accès API à `transparency@entsoe.eu` (objet `RESTful API access` et adresse enregistrée dans le corps), puis générer le jeton dans « My Account ». Enregistrer le jeton **uniquement** comme secret GitHub Actions `ENTSOE_API_TOKEN` via Settings → Secrets and variables → Actions → New repository secret ; relancer l'action. Ne jamais le coller dans le HTML, un fichier GitHub ou une conversation. Sans clé, RTE Power fonctionne déjà.
- Prix day-ahead France et DE-LU : API Fraunhofer ISE Energy-Charts. Le collecteur exige explicitement la mention de licence CC BY 4.0 dans chaque réponse et une unité EUR/MWh ; sinon il refuse la publication. L'attribution exacte déclarée par la réponse (actuellement Bundesnetzagentur / SMARD) accompagne les chiffres. `data/power_prices.json` conserve un historique glissant d'un an à partir des points réellement collectés. Le prix porte sur la **livraison** de chaque quart d'heure ou heure, il a été fixé la veille ; ce n'est pas un cours intraday en direct. Source et transformation sont affichées.
- Interface Power : le navigateur vérifie les prix day-ahead France/DE-LU sur Energy-Charts à l'ouverture et toutes les 30 minutes tant que le site est visible. Quand l'onglet Power est ouvert, il récupère les dernières observations RTE sur l'API publique ODRE toutes les 15 minutes, en respectant le quota de la source. Il valide la licence, les unités et les dates des prix ; si le réseau ou CORS refuse l'accès, il affiche l'instantané embarqué ou publié sur GitHub avec sa date. Les écarts de prix et facteurs physiques sont des calculs descriptifs, pas une preuve de causalité.
- Intraday continu France : [page de marché EPEX](https://www.epexspot.com/en/market-results) et [RTE](https://www.rte-france.com/en/data-publications/eco2mix/market-data) en accès direct. ENTSO-E 12.1.d rend obligatoire le day-ahead et l'intraday facultatif. RTE interdit la récupération des prix affichés dans éCO2mix et EPEX vend son flux de données ; le site ne fabrique donc pas un spread day-ahead/intraday. Les données de prix Fraunhofer sont attribuées conformément à la licence déclarée dans l'API.
- Calendrier natif : sorties EIA pétrole et gaz, USDA WASDE et STEO ; les exceptions 2026 connues sont incluses. Au-delà des dates vérifiées, le tableau l'indique sans inventer d'horaire.
- Marchés : cinq tuiles de cotations en séance TradingView/OANDA (Brent, WTI, gaz US, cuivre, or), plus un graphique et un tableau. Instruments OTC indicatifs ; ils ne remplacent ni les futures ICE/NYMEX ni le spot EIA daté. Le gaz US OANDA n'est pas une cotation Henry Hub physique. Les widgets nécessitent Internet et le fournisseur peut limiter la diffusion. Aluminium, cacao et café sont accessibles via leurs pages de marché ; leurs prix ne sont pas intégrés sans droits vérifiés.
- TTF/PEG/JKM : liens vers sources de marché ; un flux de cotations automatisé et redistribué publiquement nécessite un droit de diffusion. Aucune valeur ou spread instantané n'est inventé. ENTSO-E fournit des prévisions électriques ouvertes, ENTSOG des flux physiques de gaz, et GIE les stocks/terminaux.
- Physique : stockage AGSI France sur deux pages de 300 observations et comparaison de 90 jours à l'année précédente, émission ALSI France sur 14 jours, stocks de brut EIA sur 26 semaines et comparaison Brent/WTI spot sur un an lorsque FRED répond. Graphiques avec axes et unités. Les signaux de pression sont des scénarios conditionnels liés aux chiffres publiés, jamais un mouvement de prix constaté. FranceAgriMer Céré’Obs, USDA Crop Progress, Météo-France et NOAA sont liés dans Agriculture ; aucun état de culture n'est inventé si la source n'est pas collectée.
- USGS MCS 2026 : production mondiale de cuivre minier et d'aluminium primaire en 2025 (74 Mt contre 72,8 Mt en 2024 pour l'aluminium). Ce sont des repères annuels, sans signal de séance. LME : [rapports de stocks](https://www.lme.com/Market-data/Reports-and-data/Warehouse-and-stocks-reports) à consulter, sans chiffre de stock automatisé tant qu'un flux stable n'est pas vérifié.

Unités : M bbl = millions de barils ; M bbl/j = millions de barils par jour ; Bcf = milliards de pieds cubes ; TWh = térawattheures ; GWh/j = gigawattheures par jour ; 10³ m³ GNL = milliers de mètres cubes de GNL liquide ; M bu = millions de boisseaux ; Mt = millions de tonnes. Stocks, prix et flux ne sont jamais additionnés.

Les clés restent dans les secrets GitHub et ne sont jamais insérées dans les fichiers publics. Le fichier HTML contient un instantané et s'ouvre directement après téléchargement. Il synchronise `data/snapshot.json` depuis GitHub à l'ouverture et via le bouton manuel, et tente les deux API publiques directement sur Power ; tout accès dépend du réseau et des règles du navigateur. Les tâches GitHub planifiées peuvent être retardées ou désactivées après une longue période sans activité ; dans ce cas, l'onglet Actions permet la relance manuelle.

## Code complet

```html
<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Commodity Cockpit — Marchés, physique & power</title>
  <style>
    :root {
      color-scheme: dark;
      --bg: #090f17;
      --surface: #121d27;
      --surface-2: #1b2a35;
      --border: #30414e;
      --text: #f1f6f7;
      --muted: #a9bbc5;
      --accent: #71dfc2;
      --warm: #facb80;
      --red: #f58e91;
    }
    * { box-sizing: border-box; }
    body { margin: 0; background: radial-gradient(ellipse 80% 500px at 70% -200px,#193a45 0%,transparent 75%),var(--bg); color: var(--text); font: 14px/1.5 system-ui, -apple-system, Segoe UI, sans-serif; }
    button { font: inherit; cursor: pointer; }
    a { color: var(--accent); text-decoration: none; }
    a:hover { text-decoration: underline; }
    .header { min-height: 68px; padding: 9px clamp(16px,2.5vw,38px); display: flex; justify-content: space-between; align-items: center; gap: 14px; border-bottom: 1px solid var(--border); background:#0d1720f5; }
    .brand strong { font-size: 17px; letter-spacing: -.025em; }
    .brand span { color: var(--muted); font-size: 11px; margin-left: 9px; }
    .nav { display: flex; gap: 5px; }
    .nav button, .filters button { border: 1px solid transparent; background: transparent; color: var(--muted); border-radius: 6px; padding: 8px 14px; }
    .nav button[aria-selected="true"], .filters button.active { background: #21423e; border-color: #397e70; color: var(--text); }
    .page[hidden] { display: none !important; }
    .ticker { display: flex; gap: 8px; align-items: center; min-height: 65px; overflow-x: auto; padding: 8px 14px; border-bottom: 1px solid var(--border); scrollbar-width: thin; }
    .ticker a { flex: 0 0 auto; border: 1px solid var(--border); border-radius: 7px; min-width: 145px; padding: 5px 10px; color: var(--text); }
    .ticker b { display: block; font-size: 13px; }
    .ticker small { color: var(--muted); font-size: 10px; }
    .live-strip { display:grid; grid-template-columns:repeat(5,minmax(0,1fr)); gap:8px; padding:10px 13px; }
    .live-tile { min-width:0; background:var(--surface); border:1px solid var(--border); border-radius:7px; padding:6px; }
    .live-tile small { display:block; color:var(--muted); font-size:10px; padding:2px 5px; }
    .live-tile .widget { height:72px; }
    .live-tile a { font-size:10px; padding:0 5px; }
    .live-caption { padding:0 14px 7px; color:var(--muted); font-size:10px; }
    .card { background: var(--surface); border: 1px solid var(--border); border-radius: 13px; overflow: hidden; min-height: 0; box-shadow:0 12px 35px #040a101c; }
    .bar { min-height: 46px; padding: 8px 13px; display: flex; align-items: center; justify-content: space-between; gap: 12px; border-bottom: 1px solid var(--border); }
    .bar h2 { margin: 0; font-size: 13px; }
    .bar small { font-size: 10px; color: var(--muted); }
    .widget, .tradingview-widget-container, .tradingview-widget-container__widget { width: 100%; height: 100%; min-height: 0; }
    .market-grid { height: min(850px, calc(100vh - 175px)); min-height: 690px; padding: 12px; display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(365px, .9fr); gap: 12px; }
    .market-grid { height: auto; min-height: 850px; grid-template-columns: minmax(0, 1.45fr) minmax(380px, 1fr); }
    .chart { min-height: 850px; }
    .chart .widget { min-height: 715px; }
    .chart-picks { display:flex; flex-wrap:wrap; gap:5px; padding:8px 12px; border-bottom:1px solid var(--border); }
    .chart-picks button { border:1px solid var(--border); color:var(--muted); background:var(--surface-2); padding:5px 9px; border-radius:6px; }
    .chart-picks button.active { color:var(--accent); border-color:var(--accent); }
    .quote-widget { height:260px; flex:none; overflow:hidden; border-bottom:1px solid var(--border); }
    .price-links { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; padding:0 12px 14px; }
    .price-link { padding:12px; background:var(--surface-2); border:1px solid var(--border); border-radius:7px; }
    .price-link strong,.price-link small { display:block; }
    .price-link strong { font-size:13px; margin-bottom:3px; }
    .price-link small { font-size:10px; color:var(--muted); }
    .price-link p { margin:6px 0 0; font-size:11px; }
    .signal-grid { display:grid; grid-template-columns:repeat(3,minmax(0,1fr)); gap:10px; margin:0 0 14px; }
    .signal { padding:14px; border-left:3px solid var(--accent); }
    .signal.down { border-left-color:var(--red); }
    .signal.flat { border-left-color:var(--warm); }
    .signal strong { display:block; font-size:14px; margin:4px 0; }
    .signal small,.signal p { color:var(--muted); font-size:11px; }
    .signal p { margin:8px 0 0; }
    .gauge { height:9px; border-radius:20px; background:#294039; overflow:hidden; margin:12px 0 4px; }
    .gauge i { display:block; height:100%; background:var(--accent); border-radius:20px; }
    .chart-duo { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:10px; margin-top:12px; }
    .chart-duo .trend { margin:0; }
    .chart-duo h3 { font-size:12px; }
    .chart, .watch, .calendar { display: flex; flex-direction: column; }
    .right { min-height: 0; display: grid; grid-template-rows: minmax(280px, 300px) minmax(535px, 1fr); gap: 12px; }
    .right .calendar { grid-row:1; }
    .right .watch { grid-row:2; }
    .chart .widget, .watch .widget, .calendar .widget { flex: 1; }
    .caption { padding: 8px 12px; border-top: 1px solid var(--border); color: var(--muted); font-size: 10px; }
    .market-snapshot, .release-list { border-top: 1px solid var(--border); padding: 8px 12px; flex: none; }
    .market-snapshot { min-height: 80px; }
    .market-snapshot h3, .release-list h3 { font-size: 10px; color: var(--muted); margin: 0 0 5px; font-weight: 600; }
    .market-snapshot .row, .release-list .row { display: flex; justify-content: space-between; gap: 8px; padding: 2px 0; font-size: 10px; }
    .market-snapshot .row b, .release-list .row b { font-weight: 600; color: var(--text); white-space: nowrap; }
    .market-snapshot .row small { color: var(--muted); }
    .release-list .row a { overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .watch-list, .agenda { min-height: 0; overflow-y: auto; }
    .watch-group { padding: 7px 12px 3px; color: var(--muted); font-size: 10px; letter-spacing: .07em; }
    .quote-row { padding: 7px 12px; display: grid; grid-template-columns: minmax(0, 1fr) auto; gap: 3px 12px; align-items: center; border-top: 1px solid var(--border); }
    .quote-row strong { display: block; font-size: 11px; }
    .quote-row small { color: var(--muted); font-size: 10px; }
    .quote-value { text-align: right; font-weight: 700; white-space: nowrap; }
    .quote-value a { font-weight: 500; font-size: 10px; }
    .quote-row .quote-note { grid-column: 1 / -1; color: var(--muted); font-size: 10px; }
    .agenda-row { padding: 9px 12px; display: grid; grid-template-columns: 67px minmax(0, 1fr); gap: 9px; border-top: 1px solid var(--border); }
    .agenda-when { color: var(--warm); font-size: 11px; font-weight: 700; }
    .agenda-when small { display: block; color: var(--muted); font-weight: 400; }
    .agenda-row a { display: block; color: var(--text); font-size: 11px; font-weight: 600; }
    .agenda-row p { margin: 2px 0 0; color: var(--muted); font-size: 10px; }
    .market-context { padding: 0 12px 18px; }
    .market-context h2 { font-size: 13px; margin: 4px 0 9px; }
    .market-power-pulse { display:flex; align-items:center; gap:22px; padding:13px 19px; margin:5px 12px 0; background:linear-gradient(110deg,#173735,#14242d 65%); border-color:#3d716e; }
    .market-power-pulse h2 { font-size:18px; margin:4px 0; }
    .market-power-pulse p { color:var(--muted); font-size:11px; margin:3px 0 0; }
    .market-power-stats { display:flex; gap:22px; margin-left:auto; }
    .market-power-stats div { min-width:135px; }
    .market-power-stats small { display:block; color:var(--muted); font-size:10px; }
    .market-power-stats strong { font-size:19px; font-variant-numeric:tabular-nums; white-space:nowrap; }
    .market-power-pulse a { white-space:nowrap; font-weight:700; }
    .mini-grid { display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 10px; }
    .mini { padding: 12px; background: var(--surface); border: 1px solid var(--border); border-radius: 7px; }
    .mini small, .metric small { display: block; color: var(--muted); font-size: 10px; }
    .mini strong { display: block; font-size: 18px; margin: 4px 0 1px; }
    .mini span { color: var(--warm); font-size: 10px; }
    .workspace { max-width: 1460px; margin: auto; padding: clamp(16px,2.4vw,34px); }
    .page-intro { display: flex; align-items: end; justify-content: space-between; gap: 14px; margin-bottom: 15px; }
    .page-intro h1 { font-size: clamp(24px,2.6vw,38px); margin: 0 0 4px; letter-spacing: -.04em; line-height:1.14; }
    .page-intro p { color: var(--muted); margin: 0; }
    .stamp { border: 1px solid var(--border); background: var(--surface-2); border-radius: 6px; padding: 7px 10px; color: var(--muted); font-size: 10px; white-space: nowrap; }
    .source-status { display: flex; flex-wrap: wrap; gap: 7px; margin: 0 0 15px; }
    .badge { border: 1px solid var(--border); background: var(--surface); border-radius: 100px; padding: 5px 10px; font-size: 10px; color: var(--muted); }
    .badge.good { color: var(--accent); }
    .badge.warn { color: var(--warm); }
    .filters { display: flex; gap: 5px; flex-wrap: wrap; margin-bottom: 12px; }
    .filters button { padding: 7px 11px; }
    .physical-layout { display: grid; grid-template-columns: minmax(0, 1fr) 350px; gap: 12px; align-items: start; }
    .section-heading { margin: 0 0 10px; font-size: 14px; }
    .metrics { display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 10px; }
    .metric { padding: 14px; min-height: 151px; }
    .metric .number { font-size: 23px; font-weight: 700; letter-spacing: -.035em; margin: 7px 0 2px; }
    .metric .change { color: var(--warm); font-size: 11px; min-height: 17px; }
    .metric .meta { color: var(--muted); font-size: 10px; margin-top: 9px; }
    .metric .detail { color: var(--muted); font-size: 10px; margin-top: 4px; }
    .physical-side { display: grid; gap: 12px; }
    .side-pad { padding: 13px; }
    .side-pad h3 { font-size: 12px; margin: 0 0 9px; }
    .side-pad p { margin: 0 0 8px; color: var(--muted); font-size: 11px; }
    .story { padding: 11px 0; border-top: 1px solid var(--border); }
    .story a { color: var(--text); font-size: 11px; font-weight: 600; }
    .story p { color: var(--muted); font-size: 10px; margin: 4px 0; }
    .story small { color: var(--muted); font-size: 10px; }
    .trend { margin-top: 12px; }
    .trend svg { width: 100%; height: 110px; overflow: visible; }
    .trend polyline { stroke: var(--accent); stroke-width: 2; fill: none; vector-effect: non-scaling-stroke; }
    .trend .axis { display: flex; justify-content: space-between; color: var(--muted); font-size: 10px; }
    .trend-key { display:flex; gap:15px; margin:4px 0; font-size:10px; color:var(--muted); }
    .trend-key i { display:inline-block; width:15px; height:2px; vertical-align:middle; margin-right:4px; background:var(--accent); }
    .trend-key i.secondary { background:var(--warm); }
    .chart-figure { width:100%; height:175px; }
    .chart-figure line { stroke:var(--border); }
    .chart-figure text { fill:var(--muted); font-size:10px; }
    .chart-figure polyline { fill:none; stroke:var(--accent); stroke-width:2; vector-effect:non-scaling-stroke; }
    .chart-figure polyline.secondary { stroke:var(--warm); }
    .context-note { padding:10px 13px; margin:10px 0; border-left:2px solid var(--warm); color:var(--muted); background:var(--surface-2); font-size:11px; }
    .power-head { display:flex; align-items:center; gap:8px; flex-wrap:wrap; }
    .power-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:10px; margin:12px 0; }
    .power-card { min-height:123px; padding:14px; }
    .power-card small { color:var(--muted); }
    .power-card strong { display:block; font-size:24px; margin:10px 0 3px; line-height:1.1; }
    .power-card span { font-size:10px; color:var(--warm); }
    .power-layout { display:grid; grid-template-columns:minmax(0,1.35fr) minmax(300px,.8fr); gap:12px; }
    .power-layout .card { padding:15px; }
    .power-layout h2, .power-bottom h2 { font-size:13px; margin:0 0 5px; }
    .power-layout p, .power-bottom p { color:var(--muted); font-size:11px; margin:3px 0 12px; }
    .power-chart { height:225px; width:100%; display:block; overflow:visible; }
    .power-chart polyline { fill:none; stroke-width:2; vector-effect:non-scaling-stroke; }
    .power-chart .demand-line { stroke:var(--accent); }
    .power-chart .residual-line { stroke:var(--warm); }
    .power-chart line { stroke:var(--border); vector-effect:non-scaling-stroke; }
    .power-history-panel { padding:16px; margin-top:12px; }
    .power-history-panel h2 { font-size:14px; margin:0 0 5px; }
    .power-history-panel p { color:var(--muted); font-size:11px; margin:5px 0 12px; }
    .power-controls { display:flex; gap:6px; flex-wrap:wrap; margin:9px 0; }
    .power-controls button { border:1px solid var(--border); border-radius:6px; background:var(--surface-2); color:var(--muted); padding:6px 10px; font:inherit; font-size:11px; cursor:pointer; }
    .power-controls button[aria-pressed="true"] { border-color:var(--accent); color:var(--accent); }
    .power-history-chart { min-height:260px; }
    .power-history-chart svg { display:block; width:100%; height:235px; }
    .power-history-chart svg line { stroke:var(--border); }
    .power-history-chart svg polyline { fill:none; stroke:var(--accent); stroke-width:2; vector-effect:non-scaling-stroke; }
    .power-history-chart svg .zero { stroke:var(--warm); stroke-dasharray:4 4; }
    .power-history-chart svg text { fill:var(--muted); font-size:11px; }
    .power-meta { color:var(--muted); font-size:11px; }
    .price-grid { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:9px; margin:12px 0; }
    .price-grid article { background:var(--surface-2); border:1px solid var(--border); border-radius:7px; padding:10px; }
    .price-grid small { display:block; color:var(--muted); font-size:10px; }
    .price-grid strong { display:block; font-size:20px; margin:5px 0; }
    .price-grid span { color:var(--muted); font-size:10px; }
    .power-price-chart { height:225px; }
    .power-price-chart svg { width:100%; height:225px; display:block; }
    .power-price-chart polyline { fill:none; stroke:var(--accent); stroke-width:2; vector-effect:non-scaling-stroke; }
    .power-price-chart polyline.secondary { stroke:var(--warm); }
    .power-price-chart line { stroke:var(--border); }
    .power-price-chart line.zero { stroke-dasharray:4 4; stroke:var(--warm); }
    .power-price-chart text { fill:var(--muted); font-size:10px; }
    .power-legend { display:flex; justify-content:space-between; color:var(--muted); font-size:10px; gap:10px; }
    .power-legend b { color:var(--text); }
    .power-mix-row { display:grid; grid-template-columns:90px 1fr 75px; align-items:center; gap:10px; margin:11px 0; font-size:11px; }
    .power-mix-row .track { height:8px; background:var(--surface-2); border-radius:9px; overflow:hidden; }
    .power-mix-row i { display:block; height:100%; border-radius:9px; }
    .power-mix-row strong { text-align:right; }
    .power-bottom { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; margin-top:12px; }
    .power-bottom .card { padding:15px; }
    .power-forecast { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:9px; margin:12px 0; }
    .power-forecast div { background:var(--surface-2); border:1px solid var(--border); border-radius:6px; padding:10px; }
    .power-forecast small, .power-forecast span { display:block; color:var(--muted); font-size:10px; }
    .power-forecast strong { display:block; font-size:18px; margin:3px 0; }
    .eyebrow { color:var(--accent); font-size:10px; font-weight:800; letter-spacing:.16em; text-transform:uppercase; }
    .power-intro { align-items:center; margin:3px 0 19px; }
    .power-intro p { font-size:13px; margin-top:8px; }
    .power-actions { display:flex; align-items:center; flex-wrap:wrap; gap:8px; }
    .power-actions button { color:var(--text); background:var(--surface-2); font-size:12px; }
    .power-actions button:hover { border-color:var(--accent); }
    .power-head { margin-bottom:14px; }
    .power-head .badge { font-size:11px; padding:6px 11px; }
    .power-lead { display:grid; grid-template-columns:minmax(280px,.43fr) minmax(0,1fr); gap:12px; align-items:stretch; }
    .power-hero { padding:22px 24px; background:linear-gradient(140deg,#153d42,#13302f 50%,#14232e); border-color:#40877e; position:relative; }
    .power-hero:after { content:''; position:absolute; width:170px; height:170px; border:1px solid #71dfc230; border-radius:50%; right:-60px; top:-70px; pointer-events:none; }
    .power-hero strong { display:block; font-size:clamp(36px,4.3vw,60px); font-variant-numeric:tabular-nums; line-height:1.08; margin:20px 0 0; letter-spacing:-.055em; }
    .power-unit { color:var(--accent); font-weight:700; font-size:15px; }
    .power-hero-time { margin-top:15px; color:var(--text); font-weight:600; font-size:12px; }
    .power-hero-delta { margin-top:7px; color:#c8dcda; font-size:11px; }
    .power-lead .price-grid { display:grid; grid-template-columns:repeat(2,minmax(0,1fr)); gap:12px; margin:0; }
    .power-lead .price-grid article { border:1px solid var(--border); border-radius:13px; background:var(--surface); padding:17px 19px; min-height:116px; }
    .power-lead .price-grid small { color:var(--muted); font-size:11px; }
    .power-lead .price-grid strong { color:var(--text); font-size:clamp(19px,2.1vw,27px); font-variant-numeric:tabular-nums; letter-spacing:-.035em; }
    .power-lead .price-grid span { color:var(--muted); font-size:11px; }
    .power-brief { margin:12px 0; padding:19px 22px; border-color:#487765; background:linear-gradient(100deg,#18372f,#172b31 72%); }
    .power-section-header { display:flex; align-items:flex-start; justify-content:space-between; gap:14px; }
    .power-section-header h2 { margin:5px 0 0; font-size:18px; letter-spacing:-.02em; }
    .power-brief p { font-size:17px; color:var(--text); margin:13px 0 6px; line-height:1.5; }
    .power-brief-sub { color:#bed2cf; font-size:12px; }
    .power-alerts { display:grid; grid-template-columns:repeat(auto-fit,minmax(220px,1fr)); gap:12px; margin-bottom:12px; }
    .power-alert { padding:13px 15px; background:var(--surface); border:1px solid var(--border); border-left:3px solid var(--accent); border-radius:9px; }
    .power-alert.warm { border-left-color:var(--warm); }
    .power-alert small,.power-alert span { display:block; color:var(--muted); font-size:11px; }
    .power-alert strong { display:block; margin:3px 0; font-size:14px; }
    .power-analysis-layout { display:grid; grid-template-columns:minmax(0,1.65fr) minmax(315px,.85fr); gap:12px; align-items:stretch; }
    .power-analysis-layout .power-history-panel { margin:0; padding:20px; }
    .power-analysis-layout .power-history-panel p { font-size:12px; }
    .power-analysis-layout .power-price-chart { height:255px; margin:8px 0 0; }
    .power-analysis-layout .power-price-chart svg { height:255px; }
    .power-legend-inline { color:var(--muted); white-space:nowrap; font-size:11px; margin-top:7px; }
    .power-legend-inline i { display:inline-block; width:15px; height:3px; margin:0 5px 3px 12px; background:var(--accent); }
    .power-legend-inline i:nth-of-type(2) { background:var(--warm); }
    .power-hours { display:grid; grid-template-columns:repeat(4,minmax(0,1fr)); gap:7px; margin:13px 0; }
    .power-hours article { background:var(--surface-2); border:1px solid var(--border); border-radius:8px; padding:8px 10px; }
    .power-hours small,.power-hours span { display:block; color:var(--muted); font-size:10px; }
    .power-hours strong { font-variant-numeric:tabular-nums; font-size:15px; display:block; margin:2px 0; }
    .power-source { border-top:1px solid var(--border); padding-top:9px; overflow-wrap:anywhere; }
    .power-insights { display:grid; gap:12px; grid-template-rows:auto auto; }
    .power-insight-card { padding:19px; }
    .power-insight-card h2 { margin:5px 0 10px; font-size:18px; }
    .power-insight-card p { margin:8px 0 12px; color:var(--muted); font-size:12px; }
    .power-driver { display:grid; grid-template-columns:minmax(0,1fr) auto; gap:4px 10px; border-top:1px solid var(--border); padding:11px 0; }
    .power-driver small { color:var(--muted); font-size:11px; }
    .power-driver strong { font-size:15px; font-variant-numeric:tabular-nums; }
    .power-driver span { grid-column:1/-1; font-size:11px; color:var(--muted); }
    .power-intraday-empty { padding:11px; border:1px solid #997247; border-radius:7px; color:var(--warm)!important; background:#4b3a252a; font-weight:700; }
    .power-chapter { font-size:17px; letter-spacing:-.02em; margin:23px 0 7px; }
    .power-grid { margin-top:9px; }
    .power-card { border-top:2px solid #3e8277; }
    .empty { padding: 20px; color: var(--muted); }
    .footer { max-width: 1460px; margin: auto; padding: 10px 18px 24px; font-size: 10px; color: var(--muted); }
    @media (max-width: 1050px) {
      .market-grid { height: auto; grid-template-columns: 1fr; }
      .chart { height: 575px; }
      .right { grid-template-columns: 1fr 1fr; grid-template-rows: 560px; }
      .right .calendar,.right .watch { grid-row:auto; }
      .chart .widget { min-height:0; }
      .physical-layout { grid-template-columns: 1fr; }
      .physical-side { grid-template-columns: 1fr 1fr; }
      .power-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
      .power-layout { grid-template-columns:1fr; }
      .power-analysis-layout { grid-template-columns:1fr; }
      .power-insights { grid-template-columns:1fr 1fr; }
      .power-alerts { grid-template-columns:repeat(2,minmax(0,1fr)); }
      .chart { min-height:0; }
      .chart-duo { grid-template-columns:1fr; }
    }
    @media (max-width: 680px) {
      .live-strip { grid-template-columns:repeat(2,minmax(0,1fr)); }
      .header { padding: 9px; flex-wrap: wrap; }
      .brand span { display: none; }
      .market-grid { display: block; padding: 8px; }
      .chart { height: 490px; margin-bottom: 9px; }
      .right { display: flex; flex-direction:column; }
      .calendar { order:-1; }
      .watch { height: 530px; margin-bottom: 9px; }
      .calendar { height: 390px; }
      .market-context { padding: 0 8px 15px; }
      .mini-grid, .metrics { grid-template-columns: repeat(2, minmax(0, 1fr)); }
      .workspace { padding: 12px 9px; }
      .page-intro { display: block; }
      .stamp { display: inline-block; margin-top: 10px; }
      .physical-side { grid-template-columns: 1fr; }
      .power-grid, .power-bottom { grid-template-columns:1fr; }
      .power-lead { grid-template-columns:1fr; }
      .power-lead .price-grid { grid-template-columns:repeat(2,minmax(0,1fr)); }
      .power-lead .price-grid article { padding:12px; min-height:110px; }
      .power-lead .price-grid strong { font-size:20px; }
      .power-hours { grid-template-columns:repeat(2,minmax(0,1fr)); }
      .power-insights { grid-template-columns:1fr; }
      .power-alerts { grid-template-columns:1fr; }
      .power-brief p { font-size:15px; }
      .power-section-header { flex-wrap:wrap; }
      .power-forecast { grid-template-columns:1fr; }
      .price-links,.signal-grid { grid-template-columns:1fr; }
      .market-power-pulse { flex-wrap:wrap; gap:10px; }
      .market-power-stats { margin-left:0; width:100%; justify-content:space-between; }
    }
  </style>
</head>
<body>
  <header class="header">
    <div class="brand"><strong>Commodity Cockpit</strong><span>Marchés · physique · électricité</span></div>
    <nav class="nav" aria-label="Navigation">
      <button type="button" data-page="markets" aria-selected="true">Marchés</button>
      <button type="button" data-page="physical" aria-selected="false">Physique</button>
      <button type="button" data-page="power" aria-selected="false">Power FR</button>
    </nav>
  </header>

  <section class="page" id="markets">
    <div class="live-strip" id="live-strip" aria-label="Cotations en séance"></div>
    <div class="live-caption">Cotation indicative OANDA via TradingView, actualisée par le fournisseur en séance. Ce n’est pas le contrat Brent ICE. Vérifier l’heure et le délai chez le fournisseur avant toute décision.</div>
    <div class="card market-power-pulse"><div><div class="eyebrow">POWER FR · REPÈRE DE MARCHÉ</div><h2>Électricité française</h2><p id="market-power-note">Prix day-ahead en attente.</p></div><div class="market-power-stats"><div><small>Livraison en cours</small><strong id="market-power-now">—</strong></div><div><small>Demain · moyenne</small><strong id="market-power-tomorrow">—</strong></div></div><a href="#power" data-open="power">Analyser ↗</a></div>
    <main class="market-grid">
      <section class="card chart">
        <div class="bar"><h2 id="market-chart-title">Brent · indicatif OANDA</h2><a id="market-chart-link" href="https://www.tradingview.com/symbols/BCOUSD/?exchange=OANDA" target="_blank" rel="noopener noreferrer">Ouvrir ↗</a></div>
        <div class="chart-picks" id="chart-picks" aria-label="Choisir le graphique"></div>
        <div class="widget" id="market-chart"><p class="empty">Chargement de TradingView…</p></div>
        <div class="caption">Graphique tiers en séance : cotation indicative du fournisseur indiqué, avec disponibilité selon ses droits. Ce n’est ni le Brent ICE ni un prix d’exécution. Dernier spot officiel EIA daté dans le ruban.</div>
      </section>
      <aside class="right">
        <section class="card watch">
          <div class="bar"><h2>À surveiller · cotations en séance</h2><small>TradingView · accès tiers</small></div>
          <div class="quote-widget" id="market-quotes"><p class="empty">Chargement des cotations indicatives…</p></div>
          <div class="watch-list" id="watch-list"></div>
          <div class="caption">Cotations OANDA : prix indicatifs, fournisseur et horaire affichés dans TradingView. Contrats boursiers et cours officiels spot : détails ci-dessous.</div>
        </section>
        <section class="card calendar">
          <div class="bar"><h2>Prochaines publications · heure de Paris</h2><a href="https://www.eia.gov/petroleum/supply/weekly/schedule.php" target="_blank" rel="noopener noreferrer">Dates ↗</a></div>
          <div class="agenda" id="agenda"></div>
          <div class="release-list" id="release-list"><h3>Dernières publications vérifiées</h3></div>
        </section>
      </aside>
    </main>
    <section class="market-context"><h2>TTF, PEG, JKM · références de gaz et GNL</h2><div class="price-links" id="gas-prices"></div><h2>Le physique en chiffres · <a href="#physical" data-open="physical">explications ↗</a></h2><div class="mini-grid" id="mini-grid"></div></section>
  </section>

  <section class="page" id="physical" hidden>
    <main class="workspace">
      <div class="page-intro"><div><h1>Intelligence du marché physique</h1><p>Chiffres officiels, variation, période mesurée et fraîcheur de chaque publication.</p></div><div><span class="stamp" id="updated">Chargement de l'instantané…</span> <button type="button" class="stamp" id="refresh-data">Actualiser les données ↻</button></div></div>
      <div class="source-status" id="source-status"></div>
      <div class="filters" role="group" aria-label="Filtrer les matières premières">
        <button type="button" class="active" data-sector="oil">Pétrole</button>
        <button type="button" data-sector="gas">Gaz</button>
        <button type="button" data-sector="agri">Agriculture</button>
        <button type="button" data-sector="metals">Métaux</button>
      </div>
      <h2 class="section-heading">À comprendre en 10 secondes · sens possible pour les prix</h2>
      <div class="signal-grid" id="signals"></div>
      <div class="physical-layout">
          <section><h2 class="section-heading" id="sector-heading">Pétrole · prix spot et stocks</h2><div class="chart-duo"><div class="card side-pad trend" id="trend" hidden><h3 id="trend-title">Stocks commerciaux de brut US · 26 semaines</h3><svg viewBox="0 0 400 110" preserveAspectRatio="none" role="img" aria-label="Évolution des stocks ou flux physiques"><polyline id="trend-line" points=""></polyline></svg><div class="axis"><span id="trend-start"></span><span id="trend-end"></span></div></div><div class="card side-pad trend" id="trend-two" hidden><h3 id="trend-two-title">Deuxième repère</h3><svg viewBox="0 0 400 110" preserveAspectRatio="none" role="img" aria-label="Historique du deuxième repère"><polyline id="trend-two-line" points=""></polyline></svg><div class="axis"><span id="trend-two-start"></span><span id="trend-two-end"></span></div></div></div><div id="comparison-chart" class="card side-pad trend" hidden></div><div id="sector-context" class="context-note"></div><h2 class="section-heading" style="margin-top:16px">Dernières mesures officielles</h2><div class="metrics" id="metrics"></div></section>
        <aside class="physical-side">
          <section class="card side-pad" id="takeaways"><h3>Ce que disent les publications</h3><div id="takeaway-list"></div></section>
          <section class="card side-pad"><h3>Actualités qui éclairent le physique · EIA</h3><p>Production, stocks, raffinage et GNL. Les articles décrivent des faits publiés ; leur effet sur les prix reste à analyser.</p><div id="stories"></div></section>
          <section class="card side-pad"><h3>Ce que mesurent les données</h3><p>GIE AGSI+ : stocks de gaz France et UE. GIE ALSI : GNL dans les terminaux et émission en GWh/j. <a href="https://transparency.entsog.eu/" target="_blank" rel="noopener noreferrer">ENTSOG ↗</a> donne les flux de réseau. Un stock et un débit ne se comparent pas directement. Les signaux montrent une pression possible toutes choses égales par ailleurs ; ils ne mesurent pas une variation instantanée du TTF, du PEG ou du JKM.</p></section>
        </aside>
      </div>
    </main>
  </section>

  <section class="page" id="power" hidden>
    <main class="workspace">
      <div class="page-intro power-intro"><div><div class="eyebrow">POWER INTELLIGENCE · FRANCE</div><h1>Le marché électrique, en clair.</h1><p>Prix de livraison, écarts européens et signaux physiques. Chaque chiffre porte sa source et sa date.</p></div><div class="power-actions"><span class="stamp" id="power-updated">Instantané en attente</span><button type="button" class="stamp" id="power-refresh">Rafraîchir ↻</button></div></div>
      <div class="power-head"><span class="badge" id="power-price-status">Prix : vérification en cours</span><span class="badge" id="power-rte-status">RTE : collecte en attente</span><span class="badge" id="power-entsoe-status">ENTSO-E : collecte en attente</span></div>
      <section class="power-lead" aria-label="Tableau de bord des prix">
        <div class="card power-hero"><div class="eyebrow">FRANCE · DAY-AHEAD · CRÉNEAU LIVRÉ</div><strong id="power-now-value">—</strong><div class="power-unit">€/MWh</div><div id="power-now-delivery" class="power-hero-time">Période de livraison en attente</div><div id="power-now-delta" class="power-hero-delta">Prix fixé lors de l’enchère de la veille.</div></div>
        <div class="price-grid" id="power-price-grid"></div>
      </section>
      <section class="card power-brief"><div class="power-section-header"><div><div class="eyebrow">SYNTHÈSE</div><h2>Ce qui change sur le marché</h2></div><span class="badge">Calculé à partir des publications</span></div><p id="power-market-takeaway">Lecture des prix en cours…</p><div id="power-market-evidence" class="power-brief-sub"></div></section>
      <div class="power-alerts" id="power-alert-list" aria-label="Repères de marché calculés"></div>
      <div class="power-analysis-layout">
        <section class="card power-history-panel" id="power-prices-panel">
          <div class="power-section-header"><div><div class="eyebrow">MARCHÉ DE GROS</div><h2>France vs DE-LU · enchère day-ahead</h2></div><span class="power-legend-inline"><i></i> France <i></i> DE-LU</span></div>
          <p>Chaque point est le prix fixé la veille pour un créneau de livraison. L’échelle est commune aux deux marchés.</p>
          <div class="power-controls" id="power-price-span" aria-label="Période des prix"></div>
          <div class="power-price-chart" id="power-price-chart"><span class="empty">Collecte des prix en attente.</span></div>
          <div class="power-meta" id="power-price-meta"></div>
          <div id="power-price-hours" class="power-hours"></div>
          <p class="power-source"><a href="https://www.energy-charts.info/charts/price_spot_market/chart.htm?c=FR" target="_blank" rel="noopener noreferrer">Fraunhofer ISE Energy-Charts ↗</a> · <span id="power-price-license">Licence vérifiée dans la réponse source.</span> Graphique et indicateurs recalculés ici.</p>
        </section>
        <aside class="power-insights">
          <section class="card power-insight-card"><div class="eyebrow">LECTURE DES FACTEURS</div><h2>Pourquoi surveiller ces prix ?</h2><p>Les écarts ci-dessous sont des observations physiques. Ils éclairent le marché sans attribuer à eux seuls une variation de prix.</p><div id="power-driver-list"></div><p id="power-price-context"></p></section>
          <section class="card power-insight-card"><div class="eyebrow">AUTRE MARCHÉ</div><h2>Intraday continu · France</h2><p class="power-intraday-empty">Prix ID1 / ID3 indisponible dans le cockpit</p><p>EPEX publie des indices intraday pour des produits de livraison précis. Une série continue réutilisable n’est pas fournie par notre flux ouvert. Le prix d’équilibrage RTE ne mesure pas ces transactions.</p><a href="https://www.epexspot.com/en/market-results" target="_blank" rel="noopener noreferrer">Consulter les résultats EPEX ↗</a></section>
        </aside>
      </div>
      <section class="card power-history-panel"><div class="power-section-header"><div><div class="eyebrow">TRANSPARENCE</div><h2>Comment lire les variations</h2></div></div><p id="power-price-reading"></p><p>Une hausse du prix day-ahead de demain reflète l’enchère pour demain. Les mesures RTE ci-dessous décrivent des heures déjà écoulées ; les comparer permet de formuler des hypothèses, pas de prouver la cause d’un prix futur.</p></section>
      <h2 class="power-chapter">Le système physique · observations RTE</h2>
      <div class="power-grid" id="power-grid"></div>
      <div class="power-layout">
        <section class="card"><h2>Demande et résiduelle · 24 h</h2><p>Résiduelle indicative = consommation − éolien − solaire. Une valeur plus élevée peut solliciter des moyens pilotables.</p><div id="power-curve" class="empty">Collecte RTE en attente.</div><div class="power-legend" id="power-axis"></div></section>
        <section class="card"><h2>Production française · dernière observation</h2><p>Puissance par filière en MW. L’échelle des barres montre la part de la production affichée.</p><div id="power-mix" class="empty">Collecte RTE en attente.</div><small id="power-mix-time" class="detail"></small></section>
      </div>
      <section class="card power-history-panel"><div class="power-section-header"><div><div class="eyebrow">HISTORIQUE PHYSIQUE</div><h2>RTE · demande, gaz, renouvelables et échanges</h2></div></div><p>Observations horaires accumulées sans compléter les trous. « 1 an » affiche la période réellement collectée.</p><div class="power-controls" id="power-span" aria-label="Période du graphique"></div><div class="power-controls" id="power-series" aria-label="Mesure du graphique"></div><div class="power-history-chart" id="power-history-chart"><span class="empty">Historique RTE en attente.</span></div><div class="power-meta" id="power-history-meta"></div><p id="power-history-reading"></p></section>
      <div class="power-bottom">
        <section class="card"><h2>Pour surveiller le gaz et les échanges</h2><p id="power-readout">Le gaz électrique, l'éolien, le solaire et le solde d'import/export seront affichés après la première collecte RTE.</p><p>Un solde RTE négatif signifie une exportation nette ; positif, une importation nette. Les données sont des télémesures complétées d'estimations.</p><a href="https://opendata.reseaux-energies.fr/explore/dataset/eco2mix-national-tr/" target="_blank" rel="noopener noreferrer">Source RTE éCO2mix ↗</a></section>
        <section class="card"><h2>Demande anticipée · France et DE-LU</h2><p>Point haut prévu dans les prochaines 24 h, prévision day-ahead ENTSO-E sous licence CC BY 4.0. Chaque marché a sa taille : comparer la trajectoire, pas les niveaux bruts.</p><div class="power-forecast" id="power-forecast"></div><p id="power-forecast-note"></p><a href="https://transparency.entsoe.eu/" target="_blank" rel="noopener noreferrer">Transparence ENTSO-E ↗</a></section>
        <section class="card"><h2>Références de marché</h2><p>Prix day-ahead : enchère de la veille. Intraday continu : échanges ultérieurs du même créneau, avec indices ID1 / ID3. Prix d’équilibrage : règlement d’un mécanisme différent. Un spread exige des valeurs comparables et datées.</p><a href="https://www.epexspot.com/en/indices" target="_blank" rel="noopener noreferrer">Définitions EPEX ↗</a> · <a href="https://transparency.entsoe.eu/" target="_blank" rel="noopener noreferrer">Transparence ENTSO-E ↗</a></section>
        <section class="card"><h2>Méthode et qualité des mesures</h2><p><b>Observé provisoire</b> : RTE éCO2mix, dernier relevé de chaque heure UTC. <b>Calculé</b> : demande résiduelle = consommation − éolien − solaire ; ce calcul ne représente pas le dispatch réel d'une centrale ni un prix. Les trous de collecte restent visibles dans la courbe.</p><p>La couverture réelle, la date de mesure et l'heure de collecte sont affichées. Le fichier HTML embarque l'historique ; « Actualiser les données » le synchronise depuis GitHub si le réseau le permet.</p><p>Les jetons ENTSO-E et GIE restent dans les secrets GitHub.</p></section>
      </div>
    </main>
  </section>

  <p class="footer">Sources : EIA (spot publié et stocks), GIE AGSI/ALSI, USDA, USGS, RTE, ENTSO-E. Cotations indicatives tierces : TradingView/OANDA ; droits et délais du fournisseur. TTF, PEG et JKM : accès officiel aux cotations sans prix reproduit faute de flux redistribuable. Une source inaccessible conserve sa dernière valeur datée et est signalée.</p>

  <!-- Replaced by scripts/update_data.py; retained inside HTML for one-file opening. -->
  <script id="snapshot-data" type="application/json">
{
  "calendar": [
    {
      "at": "2026-10-15T14:30:00+00:00",
      "context": "Variation et écart à la moyenne cinq ans",
      "day_only": false,
      "title": "EIA · stockage gaz US",
      "url": "https://ir.eia.gov/ngs/schedule.html"
    },
    {
      "at": "2026-10-15T16:00:00+00:00",
      "context": "Brut, essence, distillats et raffineries US",
      "day_only": false,
      "title": "EIA · stocks pétroliers WPSR",
      "url": "https://www.eia.gov/petroleum/supply/weekly/schedule.php"
    },
    {
      "at": "2026-10-21T14:30:00+00:00",
      "context": "Brut, essence, distillats et raffineries US",
      "day_only": false,
      "title": "EIA · stocks pétroliers WPSR",
      "url": "https://www.eia.gov/petroleum/supply/weekly/schedule.php"
    },
    {
      "at": "2026-10-22T14:30:00+00:00",
      "context": "Variation et écart à la moyenne cinq ans",
      "day_only": false,
      "title": "EIA · stockage gaz US",
      "url": "https://ir.eia.gov/ngs/schedule.html"
    },
    {
      "at": "2026-10-28T14:30:00+00:00",
      "context": "Brut, essence, distillats et raffineries US",
      "day_only": false,
      "title": "EIA · stocks pétroliers WPSR",
      "url": "https://www.eia.gov/petroleum/supply/weekly/schedule.php"
    },
    {
      "at": "2026-10-29T14:30:00+00:00",
      "context": "Variation et écart à la moyenne cinq ans",
      "day_only": false,
      "title": "EIA · stockage gaz US",
      "url": "https://ir.eia.gov/ngs/schedule.html"
    },
    {
      "at": "2026-11-04T15:30:00+00:00",
      "context": "Brut, essence, distillats et raffineries US",
      "day_only": false,
      "title": "EIA · stocks pétroliers WPSR",
      "url": "https://www.eia.gov/petroleum/supply/weekly/schedule.php"
    },
    {
      "at": "2026-11-05T15:30:00+00:00",
      "context": "Variation et écart à la moyenne cinq ans",
      "day_only": false,
      "title": "EIA · stockage gaz US",
      "url": "https://ir.eia.gov/ngs/schedule.html"
    },
    {
      "at": "2026-11-10T17:00:00+00:00",
      "context": "Bilans mondiaux céréales et oléagineux",
      "day_only": false,
      "title": "USDA · WASDE",
      "url": "https://www.usda.gov/about-usda/general-information/staff-offices/office-chief-economist/commodity-markets/wasde-report"
    },
    {
      "at": "2026-11-12T17:00:00+00:00",
      "context": "Brut, essence, distillats et raffineries US",
      "day_only": false,
      "title": "EIA · stocks pétroliers WPSR",
      "url": "https://www.eia.gov/petroleum/supply/weekly/schedule.php"
    },
    {
      "at": "2026-11-13T15:30:00+00:00",
      "context": "Variation et écart à la moyenne cinq ans",
      "day_only": false,
      "title": "EIA · stockage gaz US",
      "url": "https://ir.eia.gov/ngs/schedule.html"
    },
    {
      "at": "2026-11-18T15:30:00+00:00",
      "context": "Brut, essence, distillats et raffineries US",
      "day_only": false,
      "title": "EIA · stocks pétroliers WPSR",
      "url": "https://www.eia.gov/petroleum/supply/weekly/schedule.php"
    },
    {
      "at": "2026-11-19T15:30:00+00:00",
      "context": "Variation et écart à la moyenne cinq ans",
      "day_only": false,
      "title": "EIA · stockage gaz US",
      "url": "https://ir.eia.gov/ngs/schedule.html"
    },
    {
      "at": "2026-11-25T15:30:00+00:00",
      "context": "Brut, essence, distillats et raffineries US",
      "day_only": false,
      "title": "EIA · stocks pétroliers WPSR",
      "url": "https://www.eia.gov/petroleum/supply/weekly/schedule.php"
    },
    {
      "at": "2026-11-25T17:00:00+00:00",
      "context": "Variation et écart à la moyenne cinq ans",
      "day_only": false,
      "title": "EIA · stockage gaz US",
      "url": "https://ir.eia.gov/ngs/schedule.html"
    },
    {
      "at": "2026-12-02T15:30:00+00:00",
      "context": "Brut, essence, distillats et raffineries US",
      "day_only": false,
      "title": "EIA · stocks pétroliers WPSR",
      "url": "https://www.eia.gov/petroleum/supply/weekly/schedule.php"
    },
    {
      "at": "2026-12-03T15:30:00+00:00",
      "context": "Variation et écart à la moyenne cinq ans",
      "day_only": false,
      "title": "EIA · stockage gaz US",
      "url": "https://ir.eia.gov/ngs/schedule.html"
    },
    {
      "at": "2026-12-09T15:30:00+00:00",
      "context": "Brut, essence, distillats et raffineries US",
      "day_only": false,
      "title": "EIA · stocks pétroliers WPSR",
      "url": "https://www.eia.gov/petroleum/supply/weekly/schedule.php"
    },
    {
      "at": "2026-12-10T15:30:00+00:00",
      "context": "Variation et écart à la moyenne cinq ans",
      "day_only": false,
      "title": "EIA · stockage gaz US",
      "url": "https://ir.eia.gov/ngs/schedule.html"
    },
    {
      "at": "2026-12-10T17:00:00+00:00",
      "context": "Bilans mondiaux céréales et oléagineux",
      "day_only": false,
      "title": "USDA · WASDE",
      "url": "https://www.usda.gov/about-usda/general-information/staff-offices/office-chief-economist/commodity-markets/wasde-report"
    },
    {
      "at": "2026-12-16T15:30:00+00:00",
      "context": "Brut, essence, distillats et raffineries US",
      "day_only": false,
      "title": "EIA · stocks pétroliers WPSR",
      "url": "https://www.eia.gov/petroleum/supply/weekly/schedule.php"
    },
    {
      "at": "2026-12-17T15:30:00+00:00",
      "context": "Variation et écart à la moyenne cinq ans",
      "day_only": false,
      "title": "EIA · stockage gaz US",
      "url": "https://ir.eia.gov/ngs/schedule.html"
    },
    {
      "at": "2026-12-23T15:30:00+00:00",
      "context": "Brut, essence, distillats et raffineries US",
      "day_only": false,
      "title": "EIA · stocks pétroliers WPSR",
      "url": "https://www.eia.gov/petroleum/supply/weekly/schedule.php"
    },
    {
      "at": "2026-12-24T15:30:00+00:00",
      "context": "Variation et écart à la moyenne cinq ans",
      "day_only": false,
      "title": "EIA · stockage gaz US",
      "url": "https://ir.eia.gov/ngs/schedule.html"
    },
    {
      "at": "2026-12-30T15:30:00+00:00",
      "context": "Brut, essence, distillats et raffineries US",
      "day_only": false,
      "title": "EIA · stocks pétroliers WPSR",
      "url": "https://www.eia.gov/petroleum/supply/weekly/schedule.php"
    },
    {
      "at": "2026-12-31T15:30:00+00:00",
      "context": "Variation et écart à la moyenne cinq ans",
      "day_only": false,
      "title": "EIA · stockage gaz US",
      "url": "https://ir.eia.gov/ngs/schedule.html"
    }
  ],
  "generated_at": "2026-10-11T23:40:05+00:00",
  "history": {
    "gas_eu": [
      {
        "date": "2025-02-19",
        "value": 41.86
      },
      {
        "date": "2025-02-20",
        "value": 41.32
      },
      {
        "date": "2025-02-21",
        "value": 40.96
      },
      {
        "date": "2025-02-22",
        "value": 40.7
      },
      {
        "date": "2025-02-23",
        "value": 40.52
      },
      {
        "date": "2025-02-24",
        "value": 40.22
      },
      {
        "date": "2025-02-25",
        "value": 39.86
      },
      {
        "date": "2025-02-26",
        "value": 39.47
      },
      {
        "date": "2025-02-27",
        "value": 39.06
      },
      {
        "date": "2025-02-28",
        "value": 38.18
      },
      {
        "date": "2025-03-01",
        "value": 38.17
      },
      {
        "date": "2025-03-02",
        "value": 37.91
      },
      {
        "date": "2025-03-03",
        "value": 37.56
      },
      {
        "date": "2025-03-04",
        "value": 37.25
      },
      {
        "date": "2025-03-05",
        "value": 37.0
      },
      {
        "date": "2025-03-06",
        "value": 36.81
      },
      {
        "date": "2025-03-07",
        "value": 36.66
      },
      {
        "date": "2025-03-08",
        "value": 36.63
      },
      {
        "date": "2025-03-09",
        "value": 36.6
      },
      {
        "date": "2025-03-10",
        "value": 36.43
      },
      {
        "date": "2025-03-11",
        "value": 36.16
      },
      {
        "date": "2025-03-12",
        "value": 35.83
      },
      {
        "date": "2025-03-13",
        "value": 35.47
      },
      {
        "date": "2025-03-14",
        "value": 35.17
      },
      {
        "date": "2025-03-15",
        "value": 34.96
      },
      {
        "date": "2025-03-16",
        "value": 34.78
      },
      {
        "date": "2025-03-17",
        "value": 34.47
      },
      {
        "date": "2025-03-18",
        "value": 34.19
      },
      {
        "date": "2025-03-19",
        "value": 33.96
      },
      {
        "date": "2025-03-20",
        "value": 33.81
      },
      {
        "date": "2025-03-21",
        "value": 33.78
      },
      {
        "date": "2025-03-22",
        "value": 33.84
      },
      {
        "date": "2025-03-23",
        "value": 33.87
      },
      {
        "date": "2025-03-24",
        "value": 33.76
      },
      {
        "date": "2025-03-25",
        "value": 33.66
      },
      {
        "date": "2025-03-26",
        "value": 33.56
      },
      {
        "date": "2025-03-27",
        "value": 33.51
      },
      {
        "date": "2025-03-28",
        "value": 33.52
      },
      {
        "date": "2025-03-29",
        "value": 33.59
      },
      {
        "date": "2025-03-30",
        "value": 33.67
      },
      {
        "date": "2025-03-31",
        "value": 33.81
      },
      {
        "date": "2025-04-01",
        "value": 34.3
      },
      {
        "date": "2025-04-02",
        "value": 34.41
      },
      {
        "date": "2025-04-03",
        "value": 34.47
      },
      {
        "date": "2025-04-04",
        "value": 34.62
      },
      {
        "date": "2025-04-05",
        "value": 34.82
      },
      {
        "date": "2025-04-06",
        "value": 35.02
      },
      {
        "date": "2025-04-07",
        "value": 35.01
      },
      {
        "date": "2025-04-08",
        "value": 34.98
      },
      {
        "date": "2025-04-09",
        "value": 34.99
      },
      {
        "date": "2025-04-10",
        "value": 35.03
      },
      {
        "date": "2025-04-11",
        "value": 35.12
      },
      {
        "date": "2025-04-12",
        "value": 35.36
      },
      {
        "date": "2025-04-13",
        "value": 35.63
      },
      {
        "date": "2025-04-14",
        "value": 35.81
      },
      {
        "date": "2025-04-15",
        "value": 35.98
      },
      {
        "date": "2025-04-16",
        "value": 36.11
      },
      {
        "date": "2025-04-17",
        "value": 36.26
      },
      {
        "date": "2025-04-18",
        "value": 36.46
      },
      {
        "date": "2025-04-19",
        "value": 36.75
      },
      {
        "date": "2025-04-20",
        "value": 37.05
      },
      {
        "date": "2025-04-21",
        "value": 37.33
      },
      {
        "date": "2025-04-22",
        "value": 37.55
      },
      {
        "date": "2025-04-23",
        "value": 37.74
      },
      {
        "date": "2025-04-24",
        "value": 37.93
      },
      {
        "date": "2025-04-25",
        "value": 38.15
      },
      {
        "date": "2025-04-26",
        "value": 38.43
      },
      {
        "date": "2025-04-27",
        "value": 38.7
      },
      {
        "date": "2025-04-28",
        "value": 38.97
      },
      {
        "date": "2025-04-29",
        "value": 39.23
      },
      {
        "date": "2025-04-30",
        "value": 39.53
      },
      {
        "date": "2025-05-01",
        "value": 39.91
      },
      {
        "date": "2025-05-02",
        "value": 40.3
      },
      {
        "date": "2025-05-03",
        "value": 40.75
      },
      {
        "date": "2025-05-04",
        "value": 41.15
      },
      {
        "date": "2025-05-05",
        "value": 41.41
      },
      {
        "date": "2025-05-06",
        "value": 41.6
      },
      {
        "date": "2025-05-07",
        "value": 41.8
      },
      {
        "date": "2025-05-08",
        "value": 41.92
      },
      {
        "date": "2025-05-09",
        "value": 42.16
      },
      {
        "date": "2025-05-10",
        "value": 42.47
      },
      {
        "date": "2025-05-11",
        "value": 42.83
      },
      {
        "date": "2025-05-12",
        "value": 43.1
      },
      {
        "date": "2025-05-13",
        "value": 43.36
      },
      {
        "date": "2025-05-14",
        "value": 43.64
      },
      {
        "date": "2025-05-15",
        "value": 43.88
      },
      {
        "date": "2025-05-16",
        "value": 44.13
      },
      {
        "date": "2025-05-17",
        "value": 44.43
      },
      {
        "date": "2025-05-18",
        "value": 44.71
      },
      {
        "date": "2025-05-19",
        "value": 44.93
      },
      {
        "date": "2025-05-20",
        "value": 45.16
      },
      {
        "date": "2025-05-21",
        "value": 45.29
      },
      {
        "date": "2025-05-22",
        "value": 45.47
      },
      {
        "date": "2025-05-23",
        "value": 45.69
      },
      {
        "date": "2025-05-24",
        "value": 45.95
      },
      {
        "date": "2025-05-25",
        "value": 46.31
      },
      {
        "date": "2025-05-26",
        "value": 46.6
      },
      {
        "date": "2025-05-27",
        "value": 46.88
      },
      {
        "date": "2025-05-28",
        "value": 47.17
      },
      {
        "date": "2025-05-29",
        "value": 47.53
      },
      {
        "date": "2025-05-30",
        "value": 47.89
      },
      {
        "date": "2025-05-31",
        "value": 48.34
      },
      {
        "date": "2025-06-01",
        "value": 48.88
      },
      {
        "date": "2025-06-02",
        "value": 49.22
      },
      {
        "date": "2025-06-03",
        "value": 49.55
      },
      {
        "date": "2025-06-04",
        "value": 49.89
      },
      {
        "date": "2025-06-05",
        "value": 50.17
      },
      {
        "date": "2025-06-06",
        "value": 50.53
      },
      {
        "date": "2025-06-07",
        "value": 50.97
      },
      {
        "date": "2025-06-08",
        "value": 51.4
      },
      {
        "date": "2025-06-09",
        "value": 51.79
      },
      {
        "date": "2025-06-10",
        "value": 52.12
      },
      {
        "date": "2025-06-11",
        "value": 52.44
      },
      {
        "date": "2025-06-12",
        "value": 52.75
      },
      {
        "date": "2025-06-13",
        "value": 53.02
      },
      {
        "date": "2025-06-14",
        "value": 53.4
      },
      {
        "date": "2025-06-15",
        "value": 53.78
      },
      {
        "date": "2025-06-16",
        "value": 54.07
      },
      {
        "date": "2025-06-17",
        "value": 54.38
      },
      {
        "date": "2025-06-18",
        "value": 54.72
      },
      {
        "date": "2025-06-19",
        "value": 55.06
      },
      {
        "date": "2025-06-20",
        "value": 55.4
      },
      {
        "date": "2025-06-21",
        "value": 55.81
      },
      {
        "date": "2025-06-22",
        "value": 56.23
      },
      {
        "date": "2025-06-23",
        "value": 56.59
      },
      {
        "date": "2025-06-24",
        "value": 56.91
      },
      {
        "date": "2025-06-25",
        "value": 57.17
      },
      {
        "date": "2025-06-26",
        "value": 57.42
      },
      {
        "date": "2025-06-27",
        "value": 57.77
      },
      {
        "date": "2025-06-28",
        "value": 58.18
      },
      {
        "date": "2025-06-29",
        "value": 58.59
      },
      {
        "date": "2025-06-30",
        "value": 58.9
      },
      {
        "date": "2025-07-01",
        "value": 59.15
      },
      {
        "date": "2025-07-02",
        "value": 59.44
      },
      {
        "date": "2025-07-03",
        "value": 59.69
      },
      {
        "date": "2025-07-04",
        "value": 59.98
      },
      {
        "date": "2025-07-05",
        "value": 60.3
      },
      {
        "date": "2025-07-06",
        "value": 60.65
      },
      {
        "date": "2025-07-07",
        "value": 60.94
      },
      {
        "date": "2025-07-08",
        "value": 61.59
      },
      {
        "date": "2025-07-09",
        "value": 61.56
      },
      {
        "date": "2025-07-10",
        "value": 61.92
      },
      {
        "date": "2025-07-11",
        "value": 62.23
      },
      {
        "date": "2025-07-12",
        "value": 62.63
      },
      {
        "date": "2025-07-13",
        "value": 63.02
      },
      {
        "date": "2025-07-14",
        "value": 63.32
      },
      {
        "date": "2025-07-15",
        "value": 63.61
      },
      {
        "date": "2025-07-16",
        "value": 63.82
      },
      {
        "date": "2025-07-17",
        "value": 64.05
      },
      {
        "date": "2025-07-18",
        "value": 64.34
      },
      {
        "date": "2025-07-19",
        "value": 64.7
      },
      {
        "date": "2025-07-20",
        "value": 65.08
      },
      {
        "date": "2025-07-21",
        "value": 65.36
      },
      {
        "date": "2025-07-22",
        "value": 65.65
      },
      {
        "date": "2025-07-23",
        "value": 65.94
      },
      {
        "date": "2025-07-24",
        "value": 66.19
      },
      {
        "date": "2025-07-25",
        "value": 66.47
      },
      {
        "date": "2025-07-26",
        "value": 66.83
      },
      {
        "date": "2025-07-27",
        "value": 67.28
      },
      {
        "date": "2025-07-28",
        "value": 67.59
      },
      {
        "date": "2025-07-29",
        "value": 67.94
      },
      {
        "date": "2025-07-30",
        "value": 68.28
      },
      {
        "date": "2025-07-31",
        "value": 68.58
      },
      {
        "date": "2025-08-01",
        "value": 68.85
      },
      {
        "date": "2025-08-02",
        "value": 69.24
      },
      {
        "date": "2025-08-03",
        "value": 69.62
      },
      {
        "date": "2025-08-04",
        "value": 69.96
      },
      {
        "date": "2025-08-05",
        "value": 70.3
      },
      {
        "date": "2025-08-06",
        "value": 70.62
      },
      {
        "date": "2025-08-07",
        "value": 70.93
      },
      {
        "date": "2025-08-08",
        "value": 71.25
      },
      {
        "date": "2025-08-09",
        "value": 71.57
      },
      {
        "date": "2025-08-10",
        "value": 72.01
      },
      {
        "date": "2025-08-11",
        "value": 72.31
      },
      {
        "date": "2025-08-12",
        "value": 72.54
      },
      {
        "date": "2025-08-13",
        "value": 72.74
      },
      {
        "date": "2025-08-14",
        "value": 72.99
      },
      {
        "date": "2025-08-15",
        "value": 73.31
      },
      {
        "date": "2025-08-16",
        "value": 73.63
      },
      {
        "date": "2025-08-17",
        "value": 73.95
      },
      {
        "date": "2025-08-18",
        "value": 74.24
      },
      {
        "date": "2025-08-19",
        "value": 74.53
      },
      {
        "date": "2025-08-20",
        "value": 74.8
      },
      {
        "date": "2025-08-21",
        "value": 75.08
      },
      {
        "date": "2025-08-22",
        "value": 75.35
      },
      {
        "date": "2025-08-23",
        "value": 75.67
      },
      {
        "date": "2025-08-24",
        "value": 75.99
      },
      {
        "date": "2025-08-25",
        "value": 76.24
      },
      {
        "date": "2025-08-26",
        "value": 76.46
      },
      {
        "date": "2025-08-27",
        "value": 76.64
      },
      {
        "date": "2025-08-28",
        "value": 76.85
      },
      {
        "date": "2025-08-29",
        "value": 77.09
      },
      {
        "date": "2025-08-30",
        "value": 77.38
      },
      {
        "date": "2025-08-31",
        "value": 77.65
      },
      {
        "date": "2025-09-01",
        "value": 78.1
      },
      {
        "date": "2025-09-02",
        "value": 78.29
      },
      {
        "date": "2025-09-03",
        "value": 78.51
      },
      {
        "date": "2025-09-04",
        "value": 78.74
      },
      {
        "date": "2025-09-05",
        "value": 78.95
      },
      {
        "date": "2025-09-06",
        "value": 79.2
      },
      {
        "date": "2025-09-07",
        "value": 79.48
      },
      {
        "date": "2025-09-08",
        "value": 79.63
      },
      {
        "date": "2025-09-09",
        "value": 79.73
      },
      {
        "date": "2025-09-10",
        "value": 79.86
      },
      {
        "date": "2025-09-11",
        "value": 79.98
      },
      {
        "date": "2025-09-12",
        "value": 80.12
      },
      {
        "date": "2025-09-13",
        "value": 80.35
      },
      {
        "date": "2025-09-14",
        "value": 80.6
      },
      {
        "date": "2025-09-15",
        "value": 80.83
      },
      {
        "date": "2025-09-16",
        "value": 80.97
      },
      {
        "date": "2025-09-17",
        "value": 81.09
      },
      {
        "date": "2025-09-18",
        "value": 81.23
      },
      {
        "date": "2025-09-19",
        "value": 81.38
      },
      {
        "date": "2025-09-20",
        "value": 81.61
      },
      {
        "date": "2025-09-21",
        "value": 81.85
      },
      {
        "date": "2025-09-22",
        "value": 81.96
      },
      {
        "date": "2025-09-23",
        "value": 82.0
      },
      {
        "date": "2025-09-24",
        "value": 82.03
      },
      {
        "date": "2025-09-25",
        "value": 82.09
      },
      {
        "date": "2025-09-26",
        "value": 82.17
      },
      {
        "date": "2025-09-27",
        "value": 82.34
      },
      {
        "date": "2025-09-28",
        "value": 82.5
      },
      {
        "date": "2025-09-29",
        "value": 82.59
      },
      {
        "date": "2025-09-30",
        "value": 82.5
      },
      {
        "date": "2025-10-01",
        "value": 82.59
      },
      {
        "date": "2025-10-02",
        "value": 82.55
      },
      {
        "date": "2025-10-03",
        "value": 82.61
      },
      {
        "date": "2025-10-04",
        "value": 82.75
      },
      {
        "date": "2025-10-05",
        "value": 82.88
      },
      {
        "date": "2025-10-06",
        "value": 82.89
      },
      {
        "date": "2025-10-07",
        "value": 82.86
      },
      {
        "date": "2025-10-08",
        "value": 82.83
      },
      {
        "date": "2025-10-09",
        "value": 82.82
      },
      {
        "date": "2025-10-10",
        "value": 82.88
      },
      {
        "date": "2025-10-11",
        "value": 83.03
      },
      {
        "date": "2025-10-12",
        "value": 83.15
      },
      {
        "date": "2025-10-13",
        "value": 83.09
      },
      {
        "date": "2025-10-14",
        "value": 83.04
      },
      {
        "date": "2025-10-15",
        "value": 82.93
      },
      {
        "date": "2025-10-16",
        "value": 82.81
      },
      {
        "date": "2025-10-17",
        "value": 82.75
      },
      {
        "date": "2025-10-18",
        "value": 82.78
      },
      {
        "date": "2025-10-19",
        "value": 82.84
      },
      {
        "date": "2025-10-20",
        "value": 82.82
      },
      {
        "date": "2025-10-21",
        "value": 82.82
      },
      {
        "date": "2025-10-22",
        "value": 82.82
      },
      {
        "date": "2025-10-23",
        "value": 82.86
      },
      {
        "date": "2025-10-24",
        "value": 82.86
      },
      {
        "date": "2025-10-25",
        "value": 82.79
      },
      {
        "date": "2025-10-26",
        "value": 82.91
      },
      {
        "date": "2025-10-27",
        "value": 82.86
      },
      {
        "date": "2025-10-28",
        "value": 82.83
      },
      {
        "date": "2025-10-29",
        "value": 82.79
      },
      {
        "date": "2025-10-30",
        "value": 82.8
      },
      {
        "date": "2025-10-31",
        "value": 82.82
      },
      {
        "date": "2025-11-01",
        "value": 82.81
      },
      {
        "date": "2025-11-02",
        "value": 82.9
      },
      {
        "date": "2025-11-03",
        "value": 83.02
      },
      {
        "date": "2025-11-04",
        "value": 83.02
      },
      {
        "date": "2025-11-05",
        "value": 82.97
      },
      {
        "date": "2025-11-06",
        "value": 82.83
      },
      {
        "date": "2025-11-07",
        "value": 82.68
      },
      {
        "date": "2025-11-08",
        "value": 82.61
      },
      {
        "date": "2025-11-09",
        "value": 82.55
      },
      {
        "date": "2025-11-10",
        "value": 82.39
      },
      {
        "date": "2025-11-11",
        "value": 82.3
      },
      {
        "date": "2025-11-12",
        "value": 82.22
      },
      {
        "date": "2025-11-13",
        "value": 82.11
      },
      {
        "date": "2025-11-14",
        "value": 82.03
      },
      {
        "date": "2025-11-15",
        "value": 81.98
      },
      {
        "date": "2025-11-16",
        "value": 81.89
      },
      {
        "date": "2025-11-17",
        "value": 81.62
      },
      {
        "date": "2025-11-18",
        "value": 81.16
      },
      {
        "date": "2025-11-19",
        "value": 80.7
      },
      {
        "date": "2025-11-20",
        "value": 80.14
      },
      {
        "date": "2025-11-21",
        "value": 79.54
      },
      {
        "date": "2025-11-22",
        "value": 79.07
      },
      {
        "date": "2025-11-23",
        "value": 78.63
      },
      {
        "date": "2025-11-24",
        "value": 78.08
      },
      {
        "date": "2025-11-25",
        "value": 77.52
      },
      {
        "date": "2025-11-26",
        "value": 76.93
      },
      {
        "date": "2025-11-27",
        "value": 76.4
      },
      {
        "date": "2025-11-28",
        "value": 75.94
      },
      {
        "date": "2025-11-29",
        "value": 75.62
      },
      {
        "date": "2025-11-30",
        "value": 75.21
      },
      {
        "date": "2025-12-01",
        "value": 74.79
      },
      {
        "date": "2025-12-02",
        "value": 74.26
      },
      {
        "date": "2025-12-03",
        "value": 73.66
      },
      {
        "date": "2025-12-04",
        "value": 73.12
      },
      {
        "date": "2025-12-05",
        "value": 72.57
      },
      {
        "date": "2025-12-06",
        "value": 72.26
      },
      {
        "date": "2025-12-07",
        "value": 72.04
      },
      {
        "date": "2025-12-08",
        "value": 71.79
      },
      {
        "date": "2025-12-09",
        "value": 71.52
      },
      {
        "date": "2025-12-10",
        "value": 71.23
      },
      {
        "date": "2025-12-11",
        "value": 70.84
      },
      {
        "date": "2025-12-12",
        "value": 70.39
      },
      {
        "date": "2025-12-13",
        "value": 70.04
      },
      {
        "date": "2025-12-14",
        "value": 69.73
      },
      {
        "date": "2025-12-15",
        "value": 69.25
      },
      {
        "date": "2025-12-16",
        "value": 68.64
      },
      {
        "date": "2025-12-17",
        "value": 68.15
      },
      {
        "date": "2025-12-18",
        "value": 67.86
      },
      {
        "date": "2025-12-19",
        "value": 67.51
      },
      {
        "date": "2025-12-20",
        "value": 67.16
      },
      {
        "date": "2025-12-21",
        "value": 66.89
      },
      {
        "date": "2025-12-22",
        "value": 66.48
      },
      {
        "date": "2025-12-23",
        "value": 66.08
      },
      {
        "date": "2025-12-24",
        "value": 65.67
      },
      {
        "date": "2025-12-25",
        "value": 65.15
      },
      {
        "date": "2025-12-26",
        "value": 64.6
      },
      {
        "date": "2025-12-27",
        "value": 64.15
      },
      {
        "date": "2025-12-28",
        "value": 63.7
      },
      {
        "date": "2025-12-29",
        "value": 63.12
      },
      {
        "date": "2025-12-30",
        "value": 62.53
      },
      {
        "date": "2025-12-31",
        "value": 61.96
      },
      {
        "date": "2026-01-01",
        "value": 61.5
      },
      {
        "date": "2026-01-02",
        "value": 60.96
      },
      {
        "date": "2026-01-03",
        "value": 60.4
      },
      {
        "date": "2026-01-04",
        "value": 59.73
      },
      {
        "date": "2026-01-05",
        "value": 58.88
      },
      {
        "date": "2026-01-06",
        "value": 58.03
      },
      {
        "date": "2026-01-07",
        "value": 57.13
      },
      {
        "date": "2026-01-08",
        "value": 56.24
      },
      {
        "date": "2026-01-09",
        "value": 55.48
      },
      {
        "date": "2026-01-10",
        "value": 54.72
      },
      {
        "date": "2026-01-11",
        "value": 53.96
      },
      {
        "date": "2026-01-12",
        "value": 53.18
      },
      {
        "date": "2026-01-13",
        "value": 52.48
      },
      {
        "date": "2026-01-14",
        "value": 51.87
      },
      {
        "date": "2026-01-15",
        "value": 51.32
      },
      {
        "date": "2026-01-16",
        "value": 50.82
      },
      {
        "date": "2026-01-17",
        "value": 50.32
      },
      {
        "date": "2026-01-18",
        "value": 49.81
      },
      {
        "date": "2026-01-19",
        "value": 49.08
      },
      {
        "date": "2026-01-20",
        "value": 48.3
      },
      {
        "date": "2026-01-21",
        "value": 47.57
      },
      {
        "date": "2026-01-22",
        "value": 46.82
      },
      {
        "date": "2026-01-23",
        "value": 46.1
      },
      {
        "date": "2026-01-24",
        "value": 45.51
      },
      {
        "date": "2026-01-25",
        "value": 44.91
      },
      {
        "date": "2026-01-26",
        "value": 44.19
      },
      {
        "date": "2026-01-27",
        "value": 43.53
      },
      {
        "date": "2026-01-28",
        "value": 42.85
      },
      {
        "date": "2026-01-29",
        "value": 42.15
      },
      {
        "date": "2026-01-30",
        "value": 41.54
      },
      {
        "date": "2026-01-31",
        "value": 41.02
      },
      {
        "date": "2026-02-01",
        "value": 40.53
      },
      {
        "date": "2026-02-02",
        "value": 39.87
      },
      {
        "date": "2026-02-03",
        "value": 39.18
      },
      {
        "date": "2026-02-04",
        "value": 38.5
      },
      {
        "date": "2026-02-05",
        "value": 37.89
      },
      {
        "date": "2026-02-06",
        "value": 37.37
      },
      {
        "date": "2026-02-07",
        "value": 37.04
      },
      {
        "date": "2026-02-08",
        "value": 36.67
      },
      {
        "date": "2026-02-09",
        "value": 36.12
      },
      {
        "date": "2026-02-10",
        "value": 35.62
      },
      {
        "date": "2026-02-11",
        "value": 35.2
      },
      {
        "date": "2026-02-12",
        "value": 34.8
      },
      {
        "date": "2026-02-13",
        "value": 34.37
      },
      {
        "date": "2026-02-14",
        "value": 33.95
      },
      {
        "date": "2026-02-15",
        "value": 33.53
      },
      {
        "date": "2026-02-16",
        "value": 33.02
      },
      {
        "date": "2026-02-17",
        "value": 32.5
      },
      {
        "date": "2026-02-18",
        "value": 31.97
      },
      {
        "date": "2026-02-19",
        "value": 31.46
      },
      {
        "date": "2026-02-20",
        "value": 31.07
      },
      {
        "date": "2026-02-21",
        "value": 30.86
      },
      {
        "date": "2026-02-22",
        "value": 30.79
      },
      {
        "date": "2026-02-23",
        "value": 30.6
      },
      {
        "date": "2026-02-24",
        "value": 30.35
      },
      {
        "date": "2026-02-25",
        "value": 30.19
      },
      {
        "date": "2026-02-26",
        "value": 30.09
      },
      {
        "date": "2026-02-27",
        "value": 30.05
      },
      {
        "date": "2026-02-28",
        "value": 29.98
      },
      {
        "date": "2026-03-01",
        "value": 29.97
      },
      {
        "date": "2026-03-02",
        "value": 29.89
      },
      {
        "date": "2026-03-03",
        "value": 29.75
      },
      {
        "date": "2026-03-04",
        "value": 29.59
      },
      {
        "date": "2026-03-05",
        "value": 29.52
      },
      {
        "date": "2026-03-06",
        "value": 29.42
      },
      {
        "date": "2026-03-07",
        "value": 29.4
      },
      {
        "date": "2026-03-08",
        "value": 29.4
      },
      {
        "date": "2026-03-09",
        "value": 29.3
      },
      {
        "date": "2026-03-10",
        "value": 29.27
      },
      {
        "date": "2026-03-11",
        "value": 29.24
      },
      {
        "date": "2026-03-12",
        "value": 29.17
      },
      {
        "date": "2026-03-13",
        "value": 29.1
      },
      {
        "date": "2026-03-14",
        "value": 29.06
      },
      {
        "date": "2026-03-15",
        "value": 29.04
      },
      {
        "date": "2026-03-16",
        "value": 28.97
      },
      {
        "date": "2026-03-17",
        "value": 28.82
      },
      {
        "date": "2026-03-18",
        "value": 28.69
      },
      {
        "date": "2026-03-19",
        "value": 28.58
      },
      {
        "date": "2026-03-20",
        "value": 28.51
      },
      {
        "date": "2026-03-21",
        "value": 28.49
      },
      {
        "date": "2026-03-22",
        "value": 28.48
      },
      {
        "date": "2026-03-23",
        "value": 28.42
      },
      {
        "date": "2026-03-24",
        "value": 28.45
      },
      {
        "date": "2026-03-25",
        "value": 28.44
      },
      {
        "date": "2026-03-26",
        "value": 28.29
      },
      {
        "date": "2026-03-27",
        "value": 28.15
      },
      {
        "date": "2026-03-28",
        "value": 28.13
      },
      {
        "date": "2026-03-29",
        "value": 28.1
      },
      {
        "date": "2026-03-30",
        "value": 27.98
      },
      {
        "date": "2026-03-31",
        "value": 27.62
      },
      {
        "date": "2026-04-01",
        "value": 27.89
      },
      {
        "date": "2026-04-02",
        "value": 27.88
      },
      {
        "date": "2026-04-03",
        "value": 27.93
      },
      {
        "date": "2026-04-04",
        "value": 28.15
      },
      {
        "date": "2026-04-05",
        "value": 28.38
      },
      {
        "date": "2026-04-06",
        "value": 28.58
      },
      {
        "date": "2026-04-07",
        "value": 28.74
      },
      {
        "date": "2026-04-08",
        "value": 28.89
      },
      {
        "date": "2026-04-09",
        "value": 29.01
      },
      {
        "date": "2026-04-10",
        "value": 29.14
      },
      {
        "date": "2026-04-11",
        "value": 29.36
      },
      {
        "date": "2026-04-12",
        "value": 29.5
      },
      {
        "date": "2026-04-13",
        "value": 29.52
      },
      {
        "date": "2026-04-14",
        "value": 29.51
      },
      {
        "date": "2026-04-15",
        "value": 29.55
      },
      {
        "date": "2026-04-16",
        "value": 29.7
      },
      {
        "date": "2026-04-17",
        "value": 29.92
      },
      {
        "date": "2026-04-18",
        "value": 30.2
      },
      {
        "date": "2026-04-19",
        "value": 30.46
      },
      {
        "date": "2026-04-20",
        "value": 30.61
      },
      {
        "date": "2026-04-21",
        "value": 30.71
      },
      {
        "date": "2026-04-22",
        "value": 30.82
      },
      {
        "date": "2026-04-23",
        "value": 30.95
      },
      {
        "date": "2026-04-24",
        "value": 31.19
      },
      {
        "date": "2026-04-25",
        "value": 31.47
      },
      {
        "date": "2026-04-26",
        "value": 31.75
      },
      {
        "date": "2026-04-27",
        "value": 31.97
      },
      {
        "date": "2026-04-28",
        "value": 32.23
      },
      {
        "date": "2026-04-29",
        "value": 32.49
      },
      {
        "date": "2026-04-30",
        "value": 32.73
      },
      {
        "date": "2026-05-01",
        "value": 33.06
      },
      {
        "date": "2026-05-02",
        "value": 33.43
      },
      {
        "date": "2026-05-03",
        "value": 33.78
      },
      {
        "date": "2026-05-04",
        "value": 34.05
      },
      {
        "date": "2026-05-05",
        "value": 34.24
      },
      {
        "date": "2026-05-06",
        "value": 34.38
      },
      {
        "date": "2026-05-07",
        "value": 34.5
      },
      {
        "date": "2026-05-08",
        "value": 34.73
      },
      {
        "date": "2026-05-09",
        "value": 35.04
      },
      {
        "date": "2026-05-10",
        "value": 35.35
      },
      {
        "date": "2026-05-11",
        "value": 35.56
      },
      {
        "date": "2026-05-12",
        "value": 35.71
      },
      {
        "date": "2026-05-13",
        "value": 35.83
      },
      {
        "date": "2026-05-14",
        "value": 35.98
      },
      {
        "date": "2026-05-15",
        "value": 36.14
      },
      {
        "date": "2026-05-16",
        "value": 36.34
      },
      {
        "date": "2026-05-17",
        "value": 36.56
      },
      {
        "date": "2026-05-18",
        "value": 36.72
      },
      {
        "date": "2026-05-19",
        "value": 36.87
      },
      {
        "date": "2026-05-20",
        "value": 36.99
      },
      {
        "date": "2026-05-21",
        "value": 37.18
      },
      {
        "date": "2026-05-22",
        "value": 37.45
      },
      {
        "date": "2026-05-23",
        "value": 37.83
      },
      {
        "date": "2026-05-24",
        "value": 38.21
      },
      {
        "date": "2026-05-25",
        "value": 38.52
      },
      {
        "date": "2026-05-26",
        "value": 38.83
      },
      {
        "date": "2026-05-27",
        "value": 39.13
      },
      {
        "date": "2026-05-28",
        "value": 39.42
      },
      {
        "date": "2026-05-29",
        "value": 39.73
      },
      {
        "date": "2026-05-30",
        "value": 40.09
      },
      {
        "date": "2026-05-31",
        "value": 40.47
      },
      {
        "date": "2026-06-01",
        "value": 40.76
      },
      {
        "date": "2026-06-02",
        "value": 41.03
      },
      {
        "date": "2026-06-03",
        "value": 41.25
      },
      {
        "date": "2026-06-04",
        "value": 41.53
      },
      {
        "date": "2026-06-05",
        "value": 41.79
      },
      {
        "date": "2026-06-06",
        "value": 42.13
      },
      {
        "date": "2026-06-07",
        "value": 42.48
      },
      {
        "date": "2026-06-08",
        "value": 42.79
      },
      {
        "date": "2026-06-09",
        "value": 43.09
      },
      {
        "date": "2026-06-10",
        "value": 43.36
      },
      {
        "date": "2026-06-11",
        "value": 43.59
      },
      {
        "date": "2026-06-12",
        "value": 43.91
      },
      {
        "date": "2026-06-13",
        "value": 44.34
      },
      {
        "date": "2026-06-14",
        "value": 44.72
      },
      {
        "date": "2026-06-15",
        "value": 45.03
      },
      {
        "date": "2026-06-16",
        "value": 45.29
      },
      {
        "date": "2026-06-17",
        "value": 45.56
      },
      {
        "date": "2026-06-18",
        "value": 45.82
      },
      {
        "date": "2026-06-19",
        "value": 46.1
      },
      {
        "date": "2026-06-20",
        "value": 46.41
      },
      {
        "date": "2026-06-21",
        "value": 46.73
      },
      {
        "date": "2026-06-22",
        "value": 46.98
      },
      {
        "date": "2026-06-23",
        "value": 47.21
      },
      {
        "date": "2026-06-24",
        "value": 47.44
      },
      {
        "date": "2026-06-25",
        "value": 47.7
      },
      {
        "date": "2026-06-26",
        "value": 47.98
      },
      {
        "date": "2026-06-27",
        "value": 48.31
      },
      {
        "date": "2026-06-28",
        "value": 48.63
      },
      {
        "date": "2026-06-29",
        "value": 48.87
      },
      {
        "date": "2026-06-30",
        "value": 49.09
      },
      {
        "date": "2026-07-01",
        "value": 49.24
      },
      {
        "date": "2026-07-02",
        "value": 49.47
      },
      {
        "date": "2026-07-03",
        "value": 49.72
      },
      {
        "date": "2026-07-04",
        "value": 50.05
      },
      {
        "date": "2026-07-05",
        "value": 50.37
      },
      {
        "date": "2026-07-06",
        "value": 50.64
      },
      {
        "date": "2026-07-07",
        "value": 50.89
      },
      {
        "date": "2026-07-08",
        "value": 51.11
      },
      {
        "date": "2026-07-09",
        "value": 51.32
      },
      {
        "date": "2026-07-10",
        "value": 51.53
      },
      {
        "date": "2026-07-11",
        "value": 51.87
      },
      {
        "date": "2026-07-12",
        "value": 52.24
      },
      {
        "date": "2026-07-13",
        "value": 52.52
      },
      {
        "date": "2026-07-14",
        "value": 52.77
      },
      {
        "date": "2026-07-15",
        "value": 53.0
      },
      {
        "date": "2026-07-16",
        "value": 53.15
      },
      {
        "date": "2026-07-17",
        "value": 53.37
      },
      {
        "date": "2026-07-18",
        "value": 53.68
      },
      {
        "date": "2026-07-19",
        "value": 54.0
      },
      {
        "date": "2026-07-20",
        "value": 54.2
      },
      {
        "date": "2026-07-21",
        "value": 54.38
      },
      {
        "date": "2026-07-22",
        "value": 54.61
      },
      {
        "date": "2026-07-23",
        "value": 54.82
      },
      {
        "date": "2026-07-24",
        "value": 55.06
      },
      {
        "date": "2026-07-25",
        "value": 55.35
      },
      {
        "date": "2026-07-26",
        "value": 55.67
      },
      {
        "date": "2026-07-27",
        "value": 55.91
      },
      {
        "date": "2026-07-28",
        "value": 56.15
      },
      {
        "date": "2026-07-29",
        "value": 56.39
      },
      {
        "date": "2026-07-30",
        "value": 56.63
      },
      {
        "date": "2026-07-31",
        "value": 56.79
      },
      {
        "date": "2026-08-01",
        "value": 57.09
      },
      {
        "date": "2026-08-02",
        "value": 57.41
      },
      {
        "date": "2026-08-03",
        "value": 57.64
      },
      {
        "date": "2026-08-04",
        "value": 57.85
      },
      {
        "date": "2026-08-05",
        "value": 58.07
      },
      {
        "date": "2026-08-06",
        "value": 58.3
      },
      {
        "date": "2026-08-07",
        "value": 58.53
      },
      {
        "date": "2026-08-08",
        "value": 58.82
      },
      {
        "date": "2026-08-09",
        "value": 59.1
      },
      {
        "date": "2026-08-10",
        "value": 59.37
      },
      {
        "date": "2026-08-11",
        "value": 59.63
      },
      {
        "date": "2026-08-12",
        "value": 59.9
      },
      {
        "date": "2026-08-13",
        "value": 60.16
      },
      {
        "date": "2026-08-14",
        "value": 60.44
      },
      {
        "date": "2026-08-15",
        "value": 60.79
      },
      {
        "date": "2026-08-16",
        "value": 61.13
      },
      {
        "date": "2026-08-17",
        "value": 61.37
      },
      {
        "date": "2026-08-18",
        "value": 61.6
      },
      {
        "date": "2026-08-19",
        "value": 61.81
      },
      {
        "date": "2026-08-20",
        "value": 62.04
      },
      {
        "date": "2026-08-21",
        "value": 62.32
      },
      {
        "date": "2026-08-22",
        "value": 62.64
      },
      {
        "date": "2026-08-23",
        "value": 62.99
      },
      {
        "date": "2026-08-24",
        "value": 63.28
      },
      {
        "date": "2026-08-25",
        "value": 63.55
      },
      {
        "date": "2026-08-26",
        "value": 63.81
      },
      {
        "date": "2026-08-27",
        "value": 64.09
      },
      {
        "date": "2026-08-28",
        "value": 64.38
      },
      {
        "date": "2026-08-29",
        "value": 64.74
      },
      {
        "date": "2026-08-30",
        "value": 65.1
      },
      {
        "date": "2026-08-31",
        "value": 65.4
      },
      {
        "date": "2026-09-01",
        "value": 65.62
      },
      {
        "date": "2026-09-02",
        "value": 65.83
      },
      {
        "date": "2026-09-03",
        "value": 66.07
      },
      {
        "date": "2026-09-04",
        "value": 66.35
      },
      {
        "date": "2026-09-05",
        "value": 66.59
      },
      {
        "date": "2026-09-06",
        "value": 66.91
      },
      {
        "date": "2026-09-07",
        "value": 67.14
      },
      {
        "date": "2026-09-08",
        "value": 67.35
      },
      {
        "date": "2026-09-09",
        "value": 67.52
      },
      {
        "date": "2026-09-10",
        "value": 67.66
      },
      {
        "date": "2026-09-11",
        "value": 67.78
      },
      {
        "date": "2026-09-12",
        "value": 68.04
      },
      {
        "date": "2026-09-13",
        "value": 68.31
      },
      {
        "date": "2026-09-14",
        "value": 68.5
      },
      {
        "date": "2026-09-15",
        "value": 68.67
      },
      {
        "date": "2026-09-16",
        "value": 68.85
      },
      {
        "date": "2026-09-17",
        "value": 69.06
      },
      {
        "date": "2026-09-18",
        "value": 69.31
      },
      {
        "date": "2026-09-19",
        "value": 69.62
      },
      {
        "date": "2026-09-20",
        "value": 69.94
      },
      {
        "date": "2026-09-21",
        "value": 70.14
      },
      {
        "date": "2026-09-22",
        "value": 70.24
      },
      {
        "date": "2026-09-23",
        "value": 70.35
      },
      {
        "date": "2026-09-24",
        "value": 70.45
      },
      {
        "date": "2026-09-25",
        "value": 70.62
      },
      {
        "date": "2026-09-26",
        "value": 70.88
      },
      {
        "date": "2026-09-27",
        "value": 71.16
      },
      {
        "date": "2026-09-28",
        "value": 71.33
      },
      {
        "date": "2026-09-29",
        "value": 71.55
      },
      {
        "date": "2026-09-30",
        "value": 71.64
      },
      {
        "date": "2026-10-01",
        "value": 71.97
      },
      {
        "date": "2026-10-02",
        "value": 72.15
      },
      {
        "date": "2026-10-03",
        "value": 72.41
      },
      {
        "date": "2026-10-04",
        "value": 72.68
      },
      {
        "date": "2026-10-05",
        "value": 72.84
      },
      {
        "date": "2026-10-06",
        "value": 72.97
      },
      {
        "date": "2026-10-07",
        "value": 73.12
      },
      {
        "date": "2026-10-08",
        "value": 73.31
      },
      {
        "date": "2026-10-09",
        "value": 73.47
      },
      {
        "date": "2026-10-10",
        "value": 73.61
      },
      {
        "date": "2026-10-11",
        "value": 73.77
      }
    ],
    "gas_fr": [
      {
        "date": "2025-02-19",
        "value": 23.76
      },
      {
        "date": "2025-02-20",
        "value": 23.51
      },
      {
        "date": "2025-02-21",
        "value": 23.32
      },
      {
        "date": "2025-02-22",
        "value": 23.37
      },
      {
        "date": "2025-02-23",
        "value": 23.5
      },
      {
        "date": "2025-02-24",
        "value": 23.56
      },
      {
        "date": "2025-02-25",
        "value": 23.48
      },
      {
        "date": "2025-02-26",
        "value": 23.26
      },
      {
        "date": "2025-02-27",
        "value": 22.94
      },
      {
        "date": "2025-02-28",
        "value": 22.61
      },
      {
        "date": "2025-03-01",
        "value": 22.38
      },
      {
        "date": "2025-03-02",
        "value": 22.18
      },
      {
        "date": "2025-03-03",
        "value": 21.81
      },
      {
        "date": "2025-03-04",
        "value": 21.6
      },
      {
        "date": "2025-03-05",
        "value": 21.53
      },
      {
        "date": "2025-03-06",
        "value": 21.62
      },
      {
        "date": "2025-03-07",
        "value": 21.76
      },
      {
        "date": "2025-03-08",
        "value": 22.15
      },
      {
        "date": "2025-03-09",
        "value": 22.52
      },
      {
        "date": "2025-03-10",
        "value": 22.7
      },
      {
        "date": "2025-03-11",
        "value": 22.72
      },
      {
        "date": "2025-03-12",
        "value": 22.47
      },
      {
        "date": "2025-03-13",
        "value": 22.1
      },
      {
        "date": "2025-03-14",
        "value": 21.78
      },
      {
        "date": "2025-03-15",
        "value": 21.57
      },
      {
        "date": "2025-03-16",
        "value": 21.44
      },
      {
        "date": "2025-03-17",
        "value": 21.26
      },
      {
        "date": "2025-03-18",
        "value": 21.12
      },
      {
        "date": "2025-03-19",
        "value": 21.1
      },
      {
        "date": "2025-03-20",
        "value": 21.29
      },
      {
        "date": "2025-03-21",
        "value": 21.74
      },
      {
        "date": "2025-03-22",
        "value": 22.14
      },
      {
        "date": "2025-03-23",
        "value": 22.47
      },
      {
        "date": "2025-03-24",
        "value": 22.66
      },
      {
        "date": "2025-03-25",
        "value": 22.86
      },
      {
        "date": "2025-03-26",
        "value": 23.13
      },
      {
        "date": "2025-03-27",
        "value": 23.48
      },
      {
        "date": "2025-03-28",
        "value": 23.81
      },
      {
        "date": "2025-03-29",
        "value": 24.18
      },
      {
        "date": "2025-03-30",
        "value": 24.59
      },
      {
        "date": "2025-03-31",
        "value": 24.99
      },
      {
        "date": "2025-04-01",
        "value": 27.28
      },
      {
        "date": "2025-04-02",
        "value": 27.73
      },
      {
        "date": "2025-04-03",
        "value": 27.95
      },
      {
        "date": "2025-04-04",
        "value": 28.49
      },
      {
        "date": "2025-04-05",
        "value": 29.26
      },
      {
        "date": "2025-04-06",
        "value": 30.01
      },
      {
        "date": "2025-04-07",
        "value": 30.55
      },
      {
        "date": "2025-04-08",
        "value": 30.99
      },
      {
        "date": "2025-04-09",
        "value": 31.54
      },
      {
        "date": "2025-04-10",
        "value": 32.11
      },
      {
        "date": "2025-04-11",
        "value": 32.7
      },
      {
        "date": "2025-04-12",
        "value": 33.32
      },
      {
        "date": "2025-04-13",
        "value": 33.95
      },
      {
        "date": "2025-04-14",
        "value": 34.53
      },
      {
        "date": "2025-04-15",
        "value": 35.11
      },
      {
        "date": "2025-04-16",
        "value": 35.54
      },
      {
        "date": "2025-04-17",
        "value": 35.95
      },
      {
        "date": "2025-04-18",
        "value": 36.35
      },
      {
        "date": "2025-04-19",
        "value": 36.92
      },
      {
        "date": "2025-04-20",
        "value": 37.49
      },
      {
        "date": "2025-04-21",
        "value": 37.97
      },
      {
        "date": "2025-04-22",
        "value": 38.46
      },
      {
        "date": "2025-04-23",
        "value": 38.95
      },
      {
        "date": "2025-04-24",
        "value": 39.38
      },
      {
        "date": "2025-04-25",
        "value": 39.84
      },
      {
        "date": "2025-04-26",
        "value": 40.42
      },
      {
        "date": "2025-04-27",
        "value": 41.0
      },
      {
        "date": "2025-04-28",
        "value": 41.52
      },
      {
        "date": "2025-04-29",
        "value": 42.04
      },
      {
        "date": "2025-04-30",
        "value": 42.64
      },
      {
        "date": "2025-05-01",
        "value": 43.29
      },
      {
        "date": "2025-05-02",
        "value": 43.94
      },
      {
        "date": "2025-05-03",
        "value": 44.67
      },
      {
        "date": "2025-05-04",
        "value": 45.37
      },
      {
        "date": "2025-05-05",
        "value": 45.81
      },
      {
        "date": "2025-05-06",
        "value": 46.36
      },
      {
        "date": "2025-05-07",
        "value": 46.86
      },
      {
        "date": "2025-05-08",
        "value": 47.4
      },
      {
        "date": "2025-05-09",
        "value": 47.93
      },
      {
        "date": "2025-05-10",
        "value": 48.52
      },
      {
        "date": "2025-05-11",
        "value": 49.14
      },
      {
        "date": "2025-05-12",
        "value": 49.6
      },
      {
        "date": "2025-05-13",
        "value": 50.0
      },
      {
        "date": "2025-05-14",
        "value": 50.32
      },
      {
        "date": "2025-05-15",
        "value": 50.51
      },
      {
        "date": "2025-05-16",
        "value": 50.81
      },
      {
        "date": "2025-05-17",
        "value": 51.17
      },
      {
        "date": "2025-05-18",
        "value": 51.51
      },
      {
        "date": "2025-05-19",
        "value": 51.65
      },
      {
        "date": "2025-05-20",
        "value": 51.88
      },
      {
        "date": "2025-05-21",
        "value": 51.73
      },
      {
        "date": "2025-05-22",
        "value": 51.66
      },
      {
        "date": "2025-05-23",
        "value": 51.97
      },
      {
        "date": "2025-05-24",
        "value": 51.98
      },
      {
        "date": "2025-05-25",
        "value": 52.46
      },
      {
        "date": "2025-05-26",
        "value": 52.82
      },
      {
        "date": "2025-05-27",
        "value": 53.24
      },
      {
        "date": "2025-05-28",
        "value": 53.64
      },
      {
        "date": "2025-05-29",
        "value": 54.1
      },
      {
        "date": "2025-05-30",
        "value": 54.61
      },
      {
        "date": "2025-05-31",
        "value": 55.3
      },
      {
        "date": "2025-06-01",
        "value": 55.87
      },
      {
        "date": "2025-06-02",
        "value": 56.29
      },
      {
        "date": "2025-06-03",
        "value": 56.72
      },
      {
        "date": "2025-06-04",
        "value": 57.11
      },
      {
        "date": "2025-06-05",
        "value": 57.48
      },
      {
        "date": "2025-06-06",
        "value": 57.96
      },
      {
        "date": "2025-06-07",
        "value": 58.48
      },
      {
        "date": "2025-06-08",
        "value": 58.98
      },
      {
        "date": "2025-06-09",
        "value": 59.45
      },
      {
        "date": "2025-06-10",
        "value": 59.87
      },
      {
        "date": "2025-06-11",
        "value": 60.33
      },
      {
        "date": "2025-06-12",
        "value": 60.7
      },
      {
        "date": "2025-06-13",
        "value": 60.69
      },
      {
        "date": "2025-06-14",
        "value": 61.03
      },
      {
        "date": "2025-06-15",
        "value": 61.38
      },
      {
        "date": "2025-06-16",
        "value": 61.63
      },
      {
        "date": "2025-06-17",
        "value": 62.06
      },
      {
        "date": "2025-06-18",
        "value": 62.41
      },
      {
        "date": "2025-06-19",
        "value": 62.66
      },
      {
        "date": "2025-06-20",
        "value": 62.94
      },
      {
        "date": "2025-06-21",
        "value": 63.37
      },
      {
        "date": "2025-06-22",
        "value": 63.87
      },
      {
        "date": "2025-06-23",
        "value": 64.27
      },
      {
        "date": "2025-06-24",
        "value": 64.52
      },
      {
        "date": "2025-06-25",
        "value": 64.69
      },
      {
        "date": "2025-06-26",
        "value": 64.87
      },
      {
        "date": "2025-06-27",
        "value": 65.23
      },
      {
        "date": "2025-06-28",
        "value": 65.63
      },
      {
        "date": "2025-06-29",
        "value": 66.02
      },
      {
        "date": "2025-06-30",
        "value": 66.29
      },
      {
        "date": "2025-07-01",
        "value": 66.47
      },
      {
        "date": "2025-07-02",
        "value": 66.75
      },
      {
        "date": "2025-07-03",
        "value": 67.0
      },
      {
        "date": "2025-07-04",
        "value": 67.22
      },
      {
        "date": "2025-07-05",
        "value": 67.6
      },
      {
        "date": "2025-07-06",
        "value": 67.98
      },
      {
        "date": "2025-07-07",
        "value": 68.32
      },
      {
        "date": "2025-07-08",
        "value": 68.64
      },
      {
        "date": "2025-07-09",
        "value": 68.93
      },
      {
        "date": "2025-07-10",
        "value": 69.26
      },
      {
        "date": "2025-07-11",
        "value": 69.56
      },
      {
        "date": "2025-07-12",
        "value": 69.95
      },
      {
        "date": "2025-07-13",
        "value": 70.33
      },
      {
        "date": "2025-07-14",
        "value": 70.75
      },
      {
        "date": "2025-07-15",
        "value": 71.16
      },
      {
        "date": "2025-07-16",
        "value": 71.43
      },
      {
        "date": "2025-07-17",
        "value": 71.59
      },
      {
        "date": "2025-07-18",
        "value": 71.92
      },
      {
        "date": "2025-07-19",
        "value": 72.36
      },
      {
        "date": "2025-07-20",
        "value": 72.77
      },
      {
        "date": "2025-07-21",
        "value": 73.12
      },
      {
        "date": "2025-07-22",
        "value": 73.45
      },
      {
        "date": "2025-07-23",
        "value": 73.74
      },
      {
        "date": "2025-07-24",
        "value": 74.01
      },
      {
        "date": "2025-07-25",
        "value": 74.28
      },
      {
        "date": "2025-07-26",
        "value": 74.66
      },
      {
        "date": "2025-07-27",
        "value": 75.08
      },
      {
        "date": "2025-07-28",
        "value": 75.45
      },
      {
        "date": "2025-07-29",
        "value": 75.85
      },
      {
        "date": "2025-07-30",
        "value": 76.28
      },
      {
        "date": "2025-07-31",
        "value": 76.67
      },
      {
        "date": "2025-08-01",
        "value": 77.19
      },
      {
        "date": "2025-08-02",
        "value": 77.66
      },
      {
        "date": "2025-08-03",
        "value": 78.17
      },
      {
        "date": "2025-08-04",
        "value": 78.5
      },
      {
        "date": "2025-08-05",
        "value": 78.8
      },
      {
        "date": "2025-08-06",
        "value": 79.13
      },
      {
        "date": "2025-08-07",
        "value": 79.39
      },
      {
        "date": "2025-08-08",
        "value": 79.64
      },
      {
        "date": "2025-08-09",
        "value": 80.07
      },
      {
        "date": "2025-08-10",
        "value": 80.58
      },
      {
        "date": "2025-08-11",
        "value": 80.81
      },
      {
        "date": "2025-08-12",
        "value": 80.91
      },
      {
        "date": "2025-08-13",
        "value": 80.98
      },
      {
        "date": "2025-08-14",
        "value": 81.09
      },
      {
        "date": "2025-08-15",
        "value": 81.29
      },
      {
        "date": "2025-08-16",
        "value": 81.51
      },
      {
        "date": "2025-08-17",
        "value": 81.73
      },
      {
        "date": "2025-08-18",
        "value": 82.16
      },
      {
        "date": "2025-08-19",
        "value": 82.6
      },
      {
        "date": "2025-08-20",
        "value": 82.96
      },
      {
        "date": "2025-08-21",
        "value": 83.29
      },
      {
        "date": "2025-08-22",
        "value": 83.54
      },
      {
        "date": "2025-08-23",
        "value": 83.89
      },
      {
        "date": "2025-08-24",
        "value": 84.33
      },
      {
        "date": "2025-08-25",
        "value": 84.72
      },
      {
        "date": "2025-08-26",
        "value": 85.02
      },
      {
        "date": "2025-08-27",
        "value": 85.33
      },
      {
        "date": "2025-08-28",
        "value": 85.78
      },
      {
        "date": "2025-08-29",
        "value": 86.25
      },
      {
        "date": "2025-08-30",
        "value": 86.56
      },
      {
        "date": "2025-08-31",
        "value": 86.53
      },
      {
        "date": "2025-09-01",
        "value": 86.79
      },
      {
        "date": "2025-09-02",
        "value": 87.33
      },
      {
        "date": "2025-09-03",
        "value": 87.66
      },
      {
        "date": "2025-09-04",
        "value": 87.97
      },
      {
        "date": "2025-09-05",
        "value": 88.24
      },
      {
        "date": "2025-09-06",
        "value": 88.6
      },
      {
        "date": "2025-09-07",
        "value": 88.93
      },
      {
        "date": "2025-09-08",
        "value": 89.21
      },
      {
        "date": "2025-09-09",
        "value": 89.48
      },
      {
        "date": "2025-09-10",
        "value": 89.71
      },
      {
        "date": "2025-09-11",
        "value": 89.77
      },
      {
        "date": "2025-09-12",
        "value": 89.89
      },
      {
        "date": "2025-09-13",
        "value": 89.93
      },
      {
        "date": "2025-09-14",
        "value": 89.97
      },
      {
        "date": "2025-09-15",
        "value": 90.18
      },
      {
        "date": "2025-09-16",
        "value": 90.23
      },
      {
        "date": "2025-09-17",
        "value": 90.16
      },
      {
        "date": "2025-09-18",
        "value": 90.23
      },
      {
        "date": "2025-09-19",
        "value": 90.25
      },
      {
        "date": "2025-09-20",
        "value": 90.57
      },
      {
        "date": "2025-09-21",
        "value": 90.87
      },
      {
        "date": "2025-09-22",
        "value": 91.06
      },
      {
        "date": "2025-09-23",
        "value": 91.16
      },
      {
        "date": "2025-09-24",
        "value": 91.25
      },
      {
        "date": "2025-09-25",
        "value": 91.08
      },
      {
        "date": "2025-09-26",
        "value": 91.07
      },
      {
        "date": "2025-09-27",
        "value": 91.25
      },
      {
        "date": "2025-09-28",
        "value": 91.45
      },
      {
        "date": "2025-09-29",
        "value": 91.58
      },
      {
        "date": "2025-09-30",
        "value": 91.75
      },
      {
        "date": "2025-10-01",
        "value": 91.62
      },
      {
        "date": "2025-10-02",
        "value": 91.5
      },
      {
        "date": "2025-10-03",
        "value": 91.69
      },
      {
        "date": "2025-10-04",
        "value": 91.99
      },
      {
        "date": "2025-10-05",
        "value": 92.32
      },
      {
        "date": "2025-10-06",
        "value": 92.47
      },
      {
        "date": "2025-10-07",
        "value": 92.41
      },
      {
        "date": "2025-10-08",
        "value": 92.38
      },
      {
        "date": "2025-10-09",
        "value": 92.38
      },
      {
        "date": "2025-10-10",
        "value": 92.45
      },
      {
        "date": "2025-10-11",
        "value": 92.8
      },
      {
        "date": "2025-10-12",
        "value": 93.0
      },
      {
        "date": "2025-10-13",
        "value": 92.84
      },
      {
        "date": "2025-10-14",
        "value": 92.83
      },
      {
        "date": "2025-10-15",
        "value": 92.69
      },
      {
        "date": "2025-10-16",
        "value": 92.34
      },
      {
        "date": "2025-10-17",
        "value": 92.19
      },
      {
        "date": "2025-10-18",
        "value": 92.27
      },
      {
        "date": "2025-10-19",
        "value": 92.46
      },
      {
        "date": "2025-10-20",
        "value": 92.56
      },
      {
        "date": "2025-10-21",
        "value": 92.69
      },
      {
        "date": "2025-10-22",
        "value": 92.83
      },
      {
        "date": "2025-10-23",
        "value": 92.83
      },
      {
        "date": "2025-10-24",
        "value": 92.73
      },
      {
        "date": "2025-10-25",
        "value": 92.78
      },
      {
        "date": "2025-10-26",
        "value": 92.79
      },
      {
        "date": "2025-10-27",
        "value": 92.7
      },
      {
        "date": "2025-10-28",
        "value": 92.63
      },
      {
        "date": "2025-10-29",
        "value": 92.59
      },
      {
        "date": "2025-10-30",
        "value": 92.62
      },
      {
        "date": "2025-10-31",
        "value": 92.78
      },
      {
        "date": "2025-11-01",
        "value": 93.05
      },
      {
        "date": "2025-11-02",
        "value": 93.21
      },
      {
        "date": "2025-11-03",
        "value": 93.19
      },
      {
        "date": "2025-11-04",
        "value": 93.29
      },
      {
        "date": "2025-11-05",
        "value": 93.36
      },
      {
        "date": "2025-11-06",
        "value": 93.3
      },
      {
        "date": "2025-11-07",
        "value": 93.19
      },
      {
        "date": "2025-11-08",
        "value": 93.18
      },
      {
        "date": "2025-11-09",
        "value": 93.16
      },
      {
        "date": "2025-11-10",
        "value": 93.12
      },
      {
        "date": "2025-11-11",
        "value": 93.2
      },
      {
        "date": "2025-11-12",
        "value": 93.33
      },
      {
        "date": "2025-11-13",
        "value": 93.31
      },
      {
        "date": "2025-11-14",
        "value": 93.4
      },
      {
        "date": "2025-11-15",
        "value": 93.55
      },
      {
        "date": "2025-11-16",
        "value": 93.46
      },
      {
        "date": "2025-11-17",
        "value": 93.14
      },
      {
        "date": "2025-11-18",
        "value": 92.39
      },
      {
        "date": "2025-11-19",
        "value": 91.58
      },
      {
        "date": "2025-11-20",
        "value": 90.53
      },
      {
        "date": "2025-11-21",
        "value": 89.47
      },
      {
        "date": "2025-11-22",
        "value": 88.64
      },
      {
        "date": "2025-11-23",
        "value": 87.98
      },
      {
        "date": "2025-11-24",
        "value": 87.27
      },
      {
        "date": "2025-11-25",
        "value": 86.41
      },
      {
        "date": "2025-11-26",
        "value": 85.44
      },
      {
        "date": "2025-11-27",
        "value": 84.63
      },
      {
        "date": "2025-11-28",
        "value": 83.92
      },
      {
        "date": "2025-11-29",
        "value": 83.38
      },
      {
        "date": "2025-11-30",
        "value": 81.97
      },
      {
        "date": "2025-12-01",
        "value": 81.86
      },
      {
        "date": "2025-12-02",
        "value": 80.92
      },
      {
        "date": "2025-12-03",
        "value": 79.94
      },
      {
        "date": "2025-12-04",
        "value": 79.03
      },
      {
        "date": "2025-12-05",
        "value": 78.3
      },
      {
        "date": "2025-12-06",
        "value": 77.74
      },
      {
        "date": "2025-12-07",
        "value": 77.31
      },
      {
        "date": "2025-12-08",
        "value": 76.85
      },
      {
        "date": "2025-12-09",
        "value": 76.49
      },
      {
        "date": "2025-12-10",
        "value": 76.1
      },
      {
        "date": "2025-12-11",
        "value": 75.49
      },
      {
        "date": "2025-12-12",
        "value": 74.89
      },
      {
        "date": "2025-12-13",
        "value": 74.46
      },
      {
        "date": "2025-12-14",
        "value": 73.93
      },
      {
        "date": "2025-12-15",
        "value": 73.31
      },
      {
        "date": "2025-12-16",
        "value": 72.61
      },
      {
        "date": "2025-12-17",
        "value": 72.0
      },
      {
        "date": "2025-12-18",
        "value": 71.51
      },
      {
        "date": "2025-12-19",
        "value": 71.01
      },
      {
        "date": "2025-12-20",
        "value": 70.43
      },
      {
        "date": "2025-12-21",
        "value": 69.88
      },
      {
        "date": "2025-12-22",
        "value": 69.12
      },
      {
        "date": "2025-12-23",
        "value": 68.44
      },
      {
        "date": "2025-12-24",
        "value": 67.71
      },
      {
        "date": "2025-12-25",
        "value": 66.7
      },
      {
        "date": "2025-12-26",
        "value": 65.58
      },
      {
        "date": "2025-12-27",
        "value": 64.59
      },
      {
        "date": "2025-12-28",
        "value": 63.57
      },
      {
        "date": "2025-12-29",
        "value": 62.36
      },
      {
        "date": "2025-12-30",
        "value": 61.12
      },
      {
        "date": "2025-12-31",
        "value": 60.04
      },
      {
        "date": "2026-01-01",
        "value": 59.13
      },
      {
        "date": "2026-01-02",
        "value": 58.1
      },
      {
        "date": "2026-01-03",
        "value": 57.02
      },
      {
        "date": "2026-01-04",
        "value": 55.71
      },
      {
        "date": "2026-01-05",
        "value": 54.2
      },
      {
        "date": "2026-01-06",
        "value": 52.73
      },
      {
        "date": "2026-01-07",
        "value": 51.37
      },
      {
        "date": "2026-01-08",
        "value": 50.23
      },
      {
        "date": "2026-01-09",
        "value": 49.29
      },
      {
        "date": "2026-01-10",
        "value": 48.28
      },
      {
        "date": "2026-01-11",
        "value": 47.25
      },
      {
        "date": "2026-01-12",
        "value": 46.35
      },
      {
        "date": "2026-01-13",
        "value": 45.38
      },
      {
        "date": "2026-01-14",
        "value": 44.54
      },
      {
        "date": "2026-01-15",
        "value": 43.88
      },
      {
        "date": "2026-01-16",
        "value": 43.15
      },
      {
        "date": "2026-01-17",
        "value": 42.42
      },
      {
        "date": "2026-01-18",
        "value": 41.75
      },
      {
        "date": "2026-01-19",
        "value": 40.81
      },
      {
        "date": "2026-01-20",
        "value": 39.83
      },
      {
        "date": "2026-01-21",
        "value": 39.04
      },
      {
        "date": "2026-01-22",
        "value": 38.01
      },
      {
        "date": "2026-01-23",
        "value": 37.1
      },
      {
        "date": "2026-01-24",
        "value": 36.38
      },
      {
        "date": "2026-01-25",
        "value": 35.57
      },
      {
        "date": "2026-01-26",
        "value": 34.53
      },
      {
        "date": "2026-01-27",
        "value": 33.67
      },
      {
        "date": "2026-01-28",
        "value": 32.73
      },
      {
        "date": "2026-01-29",
        "value": 31.89
      },
      {
        "date": "2026-01-30",
        "value": 31.2
      },
      {
        "date": "2026-01-31",
        "value": 30.67
      },
      {
        "date": "2026-02-01",
        "value": 30.18
      },
      {
        "date": "2026-02-02",
        "value": 29.52
      },
      {
        "date": "2026-02-03",
        "value": 29.0
      },
      {
        "date": "2026-02-04",
        "value": 28.5
      },
      {
        "date": "2026-02-05",
        "value": 28.06
      },
      {
        "date": "2026-02-06",
        "value": 27.67
      },
      {
        "date": "2026-02-07",
        "value": 27.36
      },
      {
        "date": "2026-02-08",
        "value": 26.99
      },
      {
        "date": "2026-02-09",
        "value": 26.45
      },
      {
        "date": "2026-02-10",
        "value": 26.09
      },
      {
        "date": "2026-02-11",
        "value": 25.74
      },
      {
        "date": "2026-02-12",
        "value": 25.36
      },
      {
        "date": "2026-02-13",
        "value": 24.98
      },
      {
        "date": "2026-02-14",
        "value": 24.5
      },
      {
        "date": "2026-02-15",
        "value": 24.04
      },
      {
        "date": "2026-02-16",
        "value": 23.56
      },
      {
        "date": "2026-02-17",
        "value": 22.99
      },
      {
        "date": "2026-02-18",
        "value": 22.47
      },
      {
        "date": "2026-02-19",
        "value": 21.82
      },
      {
        "date": "2026-02-20",
        "value": 21.32
      },
      {
        "date": "2026-02-21",
        "value": 21.14
      },
      {
        "date": "2026-02-22",
        "value": 21.08
      },
      {
        "date": "2026-02-23",
        "value": 21.08
      },
      {
        "date": "2026-02-24",
        "value": 20.97
      },
      {
        "date": "2026-02-25",
        "value": 21.01
      },
      {
        "date": "2026-02-26",
        "value": 21.14
      },
      {
        "date": "2026-02-27",
        "value": 21.38
      },
      {
        "date": "2026-02-28",
        "value": 21.54
      },
      {
        "date": "2026-03-01",
        "value": 21.65
      },
      {
        "date": "2026-03-02",
        "value": 21.69
      },
      {
        "date": "2026-03-03",
        "value": 21.65
      },
      {
        "date": "2026-03-04",
        "value": 21.62
      },
      {
        "date": "2026-03-05",
        "value": 21.72
      },
      {
        "date": "2026-03-06",
        "value": 21.75
      },
      {
        "date": "2026-03-07",
        "value": 21.86
      },
      {
        "date": "2026-03-08",
        "value": 21.98
      },
      {
        "date": "2026-03-09",
        "value": 21.92
      },
      {
        "date": "2026-03-10",
        "value": 21.89
      },
      {
        "date": "2026-03-11",
        "value": 21.91
      },
      {
        "date": "2026-03-12",
        "value": 21.91
      },
      {
        "date": "2026-03-13",
        "value": 21.99
      },
      {
        "date": "2026-03-14",
        "value": 21.94
      },
      {
        "date": "2026-03-15",
        "value": 22.01
      },
      {
        "date": "2026-03-16",
        "value": 22.0
      },
      {
        "date": "2026-03-17",
        "value": 22.11
      },
      {
        "date": "2026-03-18",
        "value": 21.99
      },
      {
        "date": "2026-03-19",
        "value": 21.84
      },
      {
        "date": "2026-03-20",
        "value": 21.85
      },
      {
        "date": "2026-03-21",
        "value": 21.98
      },
      {
        "date": "2026-03-22",
        "value": 22.07
      },
      {
        "date": "2026-03-23",
        "value": 21.96
      },
      {
        "date": "2026-03-24",
        "value": 22.07
      },
      {
        "date": "2026-03-25",
        "value": 22.08
      },
      {
        "date": "2026-03-26",
        "value": 21.86
      },
      {
        "date": "2026-03-27",
        "value": 21.67
      },
      {
        "date": "2026-03-28",
        "value": 21.71
      },
      {
        "date": "2026-03-29",
        "value": 21.86
      },
      {
        "date": "2026-03-30",
        "value": 21.88
      },
      {
        "date": "2026-03-31",
        "value": 21.81
      },
      {
        "date": "2026-04-01",
        "value": 22.06
      },
      {
        "date": "2026-04-02",
        "value": 21.97
      },
      {
        "date": "2026-04-03",
        "value": 22.07
      },
      {
        "date": "2026-04-04",
        "value": 22.43
      },
      {
        "date": "2026-04-05",
        "value": 22.78
      },
      {
        "date": "2026-04-06",
        "value": 23.1
      },
      {
        "date": "2026-04-07",
        "value": 23.53
      },
      {
        "date": "2026-04-08",
        "value": 24.02
      },
      {
        "date": "2026-04-09",
        "value": 24.52
      },
      {
        "date": "2026-04-10",
        "value": 25.04
      },
      {
        "date": "2026-04-11",
        "value": 25.5
      },
      {
        "date": "2026-04-12",
        "value": 25.85
      },
      {
        "date": "2026-04-13",
        "value": 25.93
      },
      {
        "date": "2026-04-14",
        "value": 26.05
      },
      {
        "date": "2026-04-15",
        "value": 26.28
      },
      {
        "date": "2026-04-16",
        "value": 26.63
      },
      {
        "date": "2026-04-17",
        "value": 27.06
      },
      {
        "date": "2026-04-18",
        "value": 27.55
      },
      {
        "date": "2026-04-19",
        "value": 27.97
      },
      {
        "date": "2026-04-20",
        "value": 28.27
      },
      {
        "date": "2026-04-21",
        "value": 28.47
      },
      {
        "date": "2026-04-22",
        "value": 28.81
      },
      {
        "date": "2026-04-23",
        "value": 29.13
      },
      {
        "date": "2026-04-24",
        "value": 29.53
      },
      {
        "date": "2026-04-25",
        "value": 30.06
      },
      {
        "date": "2026-04-26",
        "value": 30.53
      },
      {
        "date": "2026-04-27",
        "value": 30.99
      },
      {
        "date": "2026-04-28",
        "value": 31.44
      },
      {
        "date": "2026-04-29",
        "value": 31.91
      },
      {
        "date": "2026-04-30",
        "value": 32.35
      },
      {
        "date": "2026-05-01",
        "value": 32.88
      },
      {
        "date": "2026-05-02",
        "value": 33.51
      },
      {
        "date": "2026-05-03",
        "value": 34.08
      },
      {
        "date": "2026-05-04",
        "value": 34.54
      },
      {
        "date": "2026-05-05",
        "value": 34.88
      },
      {
        "date": "2026-05-06",
        "value": 34.93
      },
      {
        "date": "2026-05-07",
        "value": 34.96
      },
      {
        "date": "2026-05-08",
        "value": 35.38
      },
      {
        "date": "2026-05-09",
        "value": 35.81
      },
      {
        "date": "2026-05-10",
        "value": 36.2
      },
      {
        "date": "2026-05-11",
        "value": 36.45
      },
      {
        "date": "2026-05-12",
        "value": 36.63
      },
      {
        "date": "2026-05-13",
        "value": 36.85
      },
      {
        "date": "2026-05-14",
        "value": 37.07
      },
      {
        "date": "2026-05-15",
        "value": 37.16
      },
      {
        "date": "2026-05-16",
        "value": 37.34
      },
      {
        "date": "2026-05-17",
        "value": 37.55
      },
      {
        "date": "2026-05-18",
        "value": 37.64
      },
      {
        "date": "2026-05-19",
        "value": 37.78
      },
      {
        "date": "2026-05-20",
        "value": 37.74
      },
      {
        "date": "2026-05-21",
        "value": 37.78
      },
      {
        "date": "2026-05-22",
        "value": 38.1
      },
      {
        "date": "2026-05-23",
        "value": 38.58
      },
      {
        "date": "2026-05-24",
        "value": 39.09
      },
      {
        "date": "2026-05-25",
        "value": 39.44
      },
      {
        "date": "2026-05-26",
        "value": 39.73
      },
      {
        "date": "2026-05-27",
        "value": 40.01
      },
      {
        "date": "2026-05-28",
        "value": 40.3
      },
      {
        "date": "2026-05-29",
        "value": 40.69
      },
      {
        "date": "2026-05-30",
        "value": 41.23
      },
      {
        "date": "2026-05-31",
        "value": 41.88
      },
      {
        "date": "2026-06-01",
        "value": 42.05
      },
      {
        "date": "2026-06-02",
        "value": 42.29
      },
      {
        "date": "2026-06-03",
        "value": 42.4
      },
      {
        "date": "2026-06-04",
        "value": 42.6
      },
      {
        "date": "2026-06-05",
        "value": 42.8
      },
      {
        "date": "2026-06-06",
        "value": 43.12
      },
      {
        "date": "2026-06-07",
        "value": 43.48
      },
      {
        "date": "2026-06-08",
        "value": 43.8
      },
      {
        "date": "2026-06-09",
        "value": 43.99
      },
      {
        "date": "2026-06-10",
        "value": 44.09
      },
      {
        "date": "2026-06-11",
        "value": 44.22
      },
      {
        "date": "2026-06-12",
        "value": 44.58
      },
      {
        "date": "2026-06-13",
        "value": 45.0
      },
      {
        "date": "2026-06-14",
        "value": 45.43
      },
      {
        "date": "2026-06-15",
        "value": 45.87
      },
      {
        "date": "2026-06-16",
        "value": 46.28
      },
      {
        "date": "2026-06-17",
        "value": 46.66
      },
      {
        "date": "2026-06-18",
        "value": 47.03
      },
      {
        "date": "2026-06-19",
        "value": 47.31
      },
      {
        "date": "2026-06-20",
        "value": 47.59
      },
      {
        "date": "2026-06-21",
        "value": 47.85
      },
      {
        "date": "2026-06-22",
        "value": 48.0
      },
      {
        "date": "2026-06-23",
        "value": 48.11
      },
      {
        "date": "2026-06-24",
        "value": 48.25
      },
      {
        "date": "2026-06-25",
        "value": 48.36
      },
      {
        "date": "2026-06-26",
        "value": 48.61
      },
      {
        "date": "2026-06-27",
        "value": 48.87
      },
      {
        "date": "2026-06-28",
        "value": 49.15
      },
      {
        "date": "2026-06-29",
        "value": 49.23
      },
      {
        "date": "2026-06-30",
        "value": 49.44
      },
      {
        "date": "2026-07-01",
        "value": 49.53
      },
      {
        "date": "2026-07-02",
        "value": 49.67
      },
      {
        "date": "2026-07-03",
        "value": 49.79
      },
      {
        "date": "2026-07-04",
        "value": 50.04
      },
      {
        "date": "2026-07-05",
        "value": 50.28
      },
      {
        "date": "2026-07-06",
        "value": 50.41
      },
      {
        "date": "2026-07-07",
        "value": 50.6
      },
      {
        "date": "2026-07-08",
        "value": 50.73
      },
      {
        "date": "2026-07-09",
        "value": 50.78
      },
      {
        "date": "2026-07-10",
        "value": 50.82
      },
      {
        "date": "2026-07-11",
        "value": 51.14
      },
      {
        "date": "2026-07-12",
        "value": 51.51
      },
      {
        "date": "2026-07-13",
        "value": 51.73
      },
      {
        "date": "2026-07-14",
        "value": 51.91
      },
      {
        "date": "2026-07-15",
        "value": 52.09
      },
      {
        "date": "2026-07-16",
        "value": 52.12
      },
      {
        "date": "2026-07-17",
        "value": 52.23
      },
      {
        "date": "2026-07-18",
        "value": 52.61
      },
      {
        "date": "2026-07-19",
        "value": 53.01
      },
      {
        "date": "2026-07-20",
        "value": 53.21
      },
      {
        "date": "2026-07-21",
        "value": 53.33
      },
      {
        "date": "2026-07-22",
        "value": 53.54
      },
      {
        "date": "2026-07-23",
        "value": 53.74
      },
      {
        "date": "2026-07-24",
        "value": 53.98
      },
      {
        "date": "2026-07-25",
        "value": 54.25
      },
      {
        "date": "2026-07-26",
        "value": 54.68
      },
      {
        "date": "2026-07-27",
        "value": 55.02
      },
      {
        "date": "2026-07-28",
        "value": 55.35
      },
      {
        "date": "2026-07-29",
        "value": 55.74
      },
      {
        "date": "2026-07-30",
        "value": 56.17
      },
      {
        "date": "2026-07-31",
        "value": 56.57
      },
      {
        "date": "2026-08-01",
        "value": 57.05
      },
      {
        "date": "2026-08-02",
        "value": 57.52
      },
      {
        "date": "2026-08-03",
        "value": 57.88
      },
      {
        "date": "2026-08-04",
        "value": 58.24
      },
      {
        "date": "2026-08-05",
        "value": 58.71
      },
      {
        "date": "2026-08-06",
        "value": 59.15
      },
      {
        "date": "2026-08-07",
        "value": 59.54
      },
      {
        "date": "2026-08-08",
        "value": 59.99
      },
      {
        "date": "2026-08-09",
        "value": 60.43
      },
      {
        "date": "2026-08-10",
        "value": 60.9
      },
      {
        "date": "2026-08-11",
        "value": 61.34
      },
      {
        "date": "2026-08-12",
        "value": 61.79
      },
      {
        "date": "2026-08-13",
        "value": 62.28
      },
      {
        "date": "2026-08-14",
        "value": 62.71
      },
      {
        "date": "2026-08-15",
        "value": 63.19
      },
      {
        "date": "2026-08-16",
        "value": 63.67
      },
      {
        "date": "2026-08-17",
        "value": 64.03
      },
      {
        "date": "2026-08-18",
        "value": 64.46
      },
      {
        "date": "2026-08-19",
        "value": 64.78
      },
      {
        "date": "2026-08-20",
        "value": 65.22
      },
      {
        "date": "2026-08-21",
        "value": 65.72
      },
      {
        "date": "2026-08-22",
        "value": 66.26
      },
      {
        "date": "2026-08-23",
        "value": 66.81
      },
      {
        "date": "2026-08-24",
        "value": 67.33
      },
      {
        "date": "2026-08-25",
        "value": 67.83
      },
      {
        "date": "2026-08-26",
        "value": 68.33
      },
      {
        "date": "2026-08-27",
        "value": 68.87
      },
      {
        "date": "2026-08-28",
        "value": 69.42
      },
      {
        "date": "2026-08-29",
        "value": 70.08
      },
      {
        "date": "2026-08-30",
        "value": 70.71
      },
      {
        "date": "2026-08-31",
        "value": 71.31
      },
      {
        "date": "2026-09-01",
        "value": 71.72
      },
      {
        "date": "2026-09-02",
        "value": 72.11
      },
      {
        "date": "2026-09-03",
        "value": 72.52
      },
      {
        "date": "2026-09-04",
        "value": 73.02
      },
      {
        "date": "2026-09-05",
        "value": 73.41
      },
      {
        "date": "2026-09-06",
        "value": 73.89
      },
      {
        "date": "2026-09-07",
        "value": 74.26
      },
      {
        "date": "2026-09-08",
        "value": 74.69
      },
      {
        "date": "2026-09-09",
        "value": 75.05
      },
      {
        "date": "2026-09-10",
        "value": 75.4
      },
      {
        "date": "2026-09-11",
        "value": 75.77
      },
      {
        "date": "2026-09-12",
        "value": 76.27
      },
      {
        "date": "2026-09-13",
        "value": 76.74
      },
      {
        "date": "2026-09-14",
        "value": 77.16
      },
      {
        "date": "2026-09-15",
        "value": 77.53
      },
      {
        "date": "2026-09-16",
        "value": 78.01
      },
      {
        "date": "2026-09-17",
        "value": 78.52
      },
      {
        "date": "2026-09-18",
        "value": 79.1
      },
      {
        "date": "2026-09-19",
        "value": 79.69
      },
      {
        "date": "2026-09-20",
        "value": 80.31
      },
      {
        "date": "2026-09-21",
        "value": 80.82
      },
      {
        "date": "2026-09-22",
        "value": 81.09
      },
      {
        "date": "2026-09-23",
        "value": 81.43
      },
      {
        "date": "2026-09-24",
        "value": 81.61
      },
      {
        "date": "2026-09-25",
        "value": 81.97
      },
      {
        "date": "2026-09-26",
        "value": 82.47
      },
      {
        "date": "2026-09-27",
        "value": 83.03
      },
      {
        "date": "2026-09-28",
        "value": 83.23
      },
      {
        "date": "2026-09-29",
        "value": 83.48
      },
      {
        "date": "2026-09-30",
        "value": 83.77
      },
      {
        "date": "2026-10-01",
        "value": 83.91
      },
      {
        "date": "2026-10-02",
        "value": 84.13
      },
      {
        "date": "2026-10-03",
        "value": 84.67
      },
      {
        "date": "2026-10-04",
        "value": 85.19
      },
      {
        "date": "2026-10-05",
        "value": 85.47
      },
      {
        "date": "2026-10-06",
        "value": 85.74
      },
      {
        "date": "2026-10-07",
        "value": 86.09
      },
      {
        "date": "2026-10-08",
        "value": 86.39
      },
      {
        "date": "2026-10-09",
        "value": 86.66
      },
      {
        "date": "2026-10-10",
        "value": 86.96
      },
      {
        "date": "2026-10-11",
        "value": 87.26
      }
    ],
    "lng_eu_sendout": [
      {
        "date": "2026-09-28",
        "value": 3645.8
      },
      {
        "date": "2026-09-29",
        "value": 3383.9
      },
      {
        "date": "2026-09-30",
        "value": 3560.6
      },
      {
        "date": "2026-10-01",
        "value": 3365.1
      },
      {
        "date": "2026-10-02",
        "value": 3570.0
      },
      {
        "date": "2026-10-03",
        "value": 3595.9
      },
      {
        "date": "2026-10-04",
        "value": 3527.0
      },
      {
        "date": "2026-10-06",
        "value": 3813.6
      },
      {
        "date": "2026-10-07",
        "value": 3841.1
      },
      {
        "date": "2026-10-08",
        "value": 3474.6
      },
      {
        "date": "2026-10-09",
        "value": 3330.3
      },
      {
        "date": "2026-10-10",
        "value": 3290.2
      },
      {
        "date": "2026-10-11",
        "value": 3290.2
      }
    ],
    "lng_fr_sendout": [
      {
        "date": "2026-09-28",
        "value": 967.7
      },
      {
        "date": "2026-09-29",
        "value": 883.3
      },
      {
        "date": "2026-09-30",
        "value": 862.1
      },
      {
        "date": "2026-10-01",
        "value": 780.1
      },
      {
        "date": "2026-10-02",
        "value": 890.8
      },
      {
        "date": "2026-10-03",
        "value": 1080.7
      },
      {
        "date": "2026-10-04",
        "value": 1080.7
      },
      {
        "date": "2026-10-05",
        "value": 996.6
      },
      {
        "date": "2026-10-06",
        "value": 1004.7
      },
      {
        "date": "2026-10-07",
        "value": 1053.6
      },
      {
        "date": "2026-10-08",
        "value": 991.1
      },
      {
        "date": "2026-10-09",
        "value": 912.3
      },
      {
        "date": "2026-10-10",
        "value": 877.6
      },
      {
        "date": "2026-10-11",
        "value": 877.6
      }
    ],
    "oil_crude": [
      {
        "date": "2026-04-10",
        "value": 463.804
      },
      {
        "date": "2026-04-17",
        "value": 465.729
      },
      {
        "date": "2026-04-24",
        "value": 459.495
      },
      {
        "date": "2026-05-01",
        "value": 457.182
      },
      {
        "date": "2026-05-08",
        "value": 452.876
      },
      {
        "date": "2026-05-15",
        "value": 445.013
      },
      {
        "date": "2026-05-22",
        "value": 441.686
      },
      {
        "date": "2026-05-29",
        "value": 433.712
      },
      {
        "date": "2026-06-05",
        "value": 426.485
      },
      {
        "date": "2026-06-12",
        "value": 418.222
      },
      {
        "date": "2026-06-19",
        "value": 412.134
      },
      {
        "date": "2026-06-26",
        "value": 408.359
      },
      {
        "date": "2026-07-03",
        "value": 411.357
      },
      {
        "date": "2026-07-10",
        "value": 409.665
      },
      {
        "date": "2026-07-17",
        "value": 411.675
      },
      {
        "date": "2026-07-24",
        "value": 404.508
      },
      {
        "date": "2026-07-31",
        "value": 406.987
      },
      {
        "date": "2026-08-07",
        "value": 424.41
      },
      {
        "date": "2026-08-14",
        "value": 428.815
      },
      {
        "date": "2026-08-21",
        "value": 428.91
      },
      {
        "date": "2026-08-28",
        "value": 424.46
      },
      {
        "date": "2026-09-04",
        "value": 424.069
      },
      {
        "date": "2026-09-11",
        "value": 423.429
      },
      {
        "date": "2026-09-18",
        "value": 426.398
      },
      {
        "date": "2026-09-25",
        "value": 427.32
      },
      {
        "date": "2026-10-02",
        "value": 424.134
      }
    ],
    "oil_prices": {
      "brent": [
        {
          "date": "2025-10-06",
          "value": 67.09
        },
        {
          "date": "2025-10-07",
          "value": 67.1
        },
        {
          "date": "2025-10-08",
          "value": 67.42
        },
        {
          "date": "2025-10-09",
          "value": 67.23
        },
        {
          "date": "2025-10-10",
          "value": 64.41
        },
        {
          "date": "2025-10-13",
          "value": 64.15
        },
        {
          "date": "2025-10-14",
          "value": 63.0
        },
        {
          "date": "2025-10-15",
          "value": 62.33
        },
        {
          "date": "2025-10-16",
          "value": 61.08
        },
        {
          "date": "2025-10-17",
          "value": 61.23
        },
        {
          "date": "2025-10-20",
          "value": 60.71
        },
        {
          "date": "2025-10-21",
          "value": 61.0
        },
        {
          "date": "2025-10-22",
          "value": 62.28
        },
        {
          "date": "2025-10-23",
          "value": 66.32
        },
        {
          "date": "2025-10-24",
          "value": 65.8
        },
        {
          "date": "2025-10-27",
          "value": 65.52
        },
        {
          "date": "2025-10-28",
          "value": 64.03
        },
        {
          "date": "2025-10-29",
          "value": 65.01
        },
        {
          "date": "2025-10-30",
          "value": 65.11
        },
        {
          "date": "2025-10-31",
          "value": 65.44
        },
        {
          "date": "2025-11-03",
          "value": 65.79
        },
        {
          "date": "2025-11-04",
          "value": 65.04
        },
        {
          "date": "2025-11-05",
          "value": 63.54
        },
        {
          "date": "2025-11-06",
          "value": 63.41
        },
        {
          "date": "2025-11-07",
          "value": 63.72
        },
        {
          "date": "2025-11-10",
          "value": 63.01
        },
        {
          "date": "2025-11-11",
          "value": 63.86
        },
        {
          "date": "2025-11-12",
          "value": 61.88
        },
        {
          "date": "2025-11-13",
          "value": 62.14
        },
        {
          "date": "2025-11-14",
          "value": 63.45
        },
        {
          "date": "2025-11-17",
          "value": 63.16
        },
        {
          "date": "2025-11-18",
          "value": 64.86
        },
        {
          "date": "2025-11-19",
          "value": 63.78
        },
        {
          "date": "2025-11-20",
          "value": 63.64
        },
        {
          "date": "2025-11-21",
          "value": 62.78
        },
        {
          "date": "2025-11-24",
          "value": 64.83
        },
        {
          "date": "2025-11-25",
          "value": 63.99
        },
        {
          "date": "2025-11-26",
          "value": 64.81
        },
        {
          "date": "2025-11-27",
          "value": 64.18
        },
        {
          "date": "2025-11-28",
          "value": 64.07
        },
        {
          "date": "2025-12-01",
          "value": 64.22
        },
        {
          "date": "2025-12-02",
          "value": 63.37
        },
        {
          "date": "2025-12-03",
          "value": 63.75
        },
        {
          "date": "2025-12-04",
          "value": 64.15
        },
        {
          "date": "2025-12-05",
          "value": 64.42
        },
        {
          "date": "2025-12-08",
          "value": 63.3
        },
        {
          "date": "2025-12-09",
          "value": 62.62
        },
        {
          "date": "2025-12-10",
          "value": 63.12
        },
        {
          "date": "2025-12-11",
          "value": 61.87
        },
        {
          "date": "2025-12-12",
          "value": 62.11
        },
        {
          "date": "2025-12-15",
          "value": 61.55
        },
        {
          "date": "2025-12-16",
          "value": 59.93
        },
        {
          "date": "2025-12-17",
          "value": 60.61
        },
        {
          "date": "2025-12-18",
          "value": 60.69
        },
        {
          "date": "2025-12-19",
          "value": 61.35
        },
        {
          "date": "2025-12-22",
          "value": 62.22
        },
        {
          "date": "2025-12-23",
          "value": 63.7
        },
        {
          "date": "2025-12-24",
          "value": 63.7
        },
        {
          "date": "2025-12-29",
          "value": 63.1
        },
        {
          "date": "2025-12-30",
          "value": 62.3
        },
        {
          "date": "2025-12-31",
          "value": 61.35
        },
        {
          "date": "2026-01-02",
          "value": 61.98
        },
        {
          "date": "2026-01-05",
          "value": 63.0
        },
        {
          "date": "2026-01-06",
          "value": 62.1
        },
        {
          "date": "2026-01-07",
          "value": 61.08
        },
        {
          "date": "2026-01-08",
          "value": 63.34
        },
        {
          "date": "2026-01-09",
          "value": 65.11
        },
        {
          "date": "2026-01-12",
          "value": 65.4
        },
        {
          "date": "2026-01-13",
          "value": 67.58
        },
        {
          "date": "2026-01-14",
          "value": 68.87
        },
        {
          "date": "2026-01-15",
          "value": 66.16
        },
        {
          "date": "2026-01-16",
          "value": 66.97
        },
        {
          "date": "2026-01-19",
          "value": 66.91
        },
        {
          "date": "2026-01-20",
          "value": 67.68
        },
        {
          "date": "2026-01-21",
          "value": 66.72
        },
        {
          "date": "2026-01-22",
          "value": 65.46
        },
        {
          "date": "2026-01-23",
          "value": 68.16
        },
        {
          "date": "2026-01-26",
          "value": 67.7
        },
        {
          "date": "2026-01-27",
          "value": 70.28
        },
        {
          "date": "2026-01-28",
          "value": 70.9
        },
        {
          "date": "2026-01-29",
          "value": 71.0
        },
        {
          "date": "2026-01-30",
          "value": 72.25
        },
        {
          "date": "2026-02-02",
          "value": 67.72
        },
        {
          "date": "2026-02-03",
          "value": 70.01
        },
        {
          "date": "2026-02-04",
          "value": 71.15
        },
        {
          "date": "2026-02-05",
          "value": 69.87
        },
        {
          "date": "2026-02-06",
          "value": 70.45
        },
        {
          "date": "2026-02-09",
          "value": 71.19
        },
        {
          "date": "2026-02-10",
          "value": 71.01
        },
        {
          "date": "2026-02-11",
          "value": 71.52
        },
        {
          "date": "2026-02-12",
          "value": 69.8
        },
        {
          "date": "2026-02-13",
          "value": 69.96
        },
        {
          "date": "2026-02-16",
          "value": 70.81
        },
        {
          "date": "2026-02-17",
          "value": 69.77
        },
        {
          "date": "2026-02-18",
          "value": 71.78
        },
        {
          "date": "2026-02-19",
          "value": 73.17
        },
        {
          "date": "2026-02-20",
          "value": 72.75
        },
        {
          "date": "2026-02-23",
          "value": 71.9
        },
        {
          "date": "2026-02-24",
          "value": 71.21
        },
        {
          "date": "2026-02-25",
          "value": 70.69
        },
        {
          "date": "2026-02-26",
          "value": 71.66
        },
        {
          "date": "2026-02-27",
          "value": 71.32
        },
        {
          "date": "2026-03-02",
          "value": 77.24
        },
        {
          "date": "2026-03-03",
          "value": 83.28
        },
        {
          "date": "2026-03-04",
          "value": 81.56
        },
        {
          "date": "2026-03-05",
          "value": 88.59
        },
        {
          "date": "2026-03-06",
          "value": 95.74
        },
        {
          "date": "2026-03-09",
          "value": 94.35
        },
        {
          "date": "2026-03-10",
          "value": 89.84
        },
        {
          "date": "2026-03-11",
          "value": 90.98
        },
        {
          "date": "2026-03-12",
          "value": 102.38
        },
        {
          "date": "2026-03-13",
          "value": 103.23
        },
        {
          "date": "2026-03-16",
          "value": 101.04
        },
        {
          "date": "2026-03-17",
          "value": 108.39
        },
        {
          "date": "2026-03-18",
          "value": 118.09
        },
        {
          "date": "2026-03-19",
          "value": 111.05
        },
        {
          "date": "2026-03-20",
          "value": 118.42
        },
        {
          "date": "2026-03-23",
          "value": 103.79
        },
        {
          "date": "2026-03-24",
          "value": 108.42
        },
        {
          "date": "2026-03-25",
          "value": 109.14
        },
        {
          "date": "2026-03-26",
          "value": 113.39
        },
        {
          "date": "2026-03-27",
          "value": 121.47
        },
        {
          "date": "2026-03-30",
          "value": 121.88
        },
        {
          "date": "2026-03-31",
          "value": 126.69
        },
        {
          "date": "2026-04-01",
          "value": 119.56
        },
        {
          "date": "2026-04-02",
          "value": 127.61
        },
        {
          "date": "2026-04-07",
          "value": 138.21
        },
        {
          "date": "2026-04-08",
          "value": 122.11
        },
        {
          "date": "2026-04-09",
          "value": 119.03
        },
        {
          "date": "2026-04-10",
          "value": 119.07
        },
        {
          "date": "2026-04-13",
          "value": 123.28
        },
        {
          "date": "2026-04-14",
          "value": 118.69
        },
        {
          "date": "2026-04-15",
          "value": 114.93
        },
        {
          "date": "2026-04-16",
          "value": 116.63
        },
        {
          "date": "2026-04-17",
          "value": 98.63
        },
        {
          "date": "2026-04-20",
          "value": 103.4
        },
        {
          "date": "2026-04-21",
          "value": 106.14
        },
        {
          "date": "2026-04-22",
          "value": 113.44
        },
        {
          "date": "2026-04-23",
          "value": 113.25
        },
        {
          "date": "2026-04-24",
          "value": 111.86
        },
        {
          "date": "2026-04-27",
          "value": 113.89
        },
        {
          "date": "2026-04-28",
          "value": 117.62
        },
        {
          "date": "2026-04-29",
          "value": 124.16
        },
        {
          "date": "2026-04-30",
          "value": 124.24
        },
        {
          "date": "2026-05-01",
          "value": 118.26
        },
        {
          "date": "2026-05-05",
          "value": 114.51
        },
        {
          "date": "2026-05-06",
          "value": 103.7
        },
        {
          "date": "2026-05-07",
          "value": 101.82
        },
        {
          "date": "2026-05-08",
          "value": 103.48
        },
        {
          "date": "2026-05-11",
          "value": 106.11
        },
        {
          "date": "2026-05-12",
          "value": 111.37
        },
        {
          "date": "2026-05-13",
          "value": 110.28
        },
        {
          "date": "2026-05-14",
          "value": 110.91
        },
        {
          "date": "2026-05-15",
          "value": 113.96
        },
        {
          "date": "2026-05-18",
          "value": 116.73
        },
        {
          "date": "2026-05-19",
          "value": 114.64
        },
        {
          "date": "2026-05-20",
          "value": 108.93
        },
        {
          "date": "2026-05-21",
          "value": 105.84
        },
        {
          "date": "2026-05-22",
          "value": 106.9
        },
        {
          "date": "2026-05-26",
          "value": 102.75
        },
        {
          "date": "2026-05-27",
          "value": 97.11
        },
        {
          "date": "2026-05-28",
          "value": 95.47
        },
        {
          "date": "2026-05-29",
          "value": 92.88
        },
        {
          "date": "2026-06-01",
          "value": 98.29
        },
        {
          "date": "2026-06-02",
          "value": 98.49
        },
        {
          "date": "2026-06-03",
          "value": 101.69
        },
        {
          "date": "2026-06-04",
          "value": 98.98
        },
        {
          "date": "2026-06-05",
          "value": 97.29
        },
        {
          "date": "2026-06-08",
          "value": 97.46
        },
        {
          "date": "2026-06-09",
          "value": 94.15
        },
        {
          "date": "2026-06-10",
          "value": 95.73
        },
        {
          "date": "2026-06-11",
          "value": 92.84
        },
        {
          "date": "2026-06-12",
          "value": 88.64
        },
        {
          "date": "2026-06-15",
          "value": 84.36
        },
        {
          "date": "2026-06-16",
          "value": 80.5
        },
        {
          "date": "2026-06-17",
          "value": 80.33
        },
        {
          "date": "2026-06-18",
          "value": 79.35
        },
        {
          "date": "2026-06-19",
          "value": 80.46
        },
        {
          "date": "2026-06-22",
          "value": 76.49
        },
        {
          "date": "2026-06-23",
          "value": 75.69
        },
        {
          "date": "2026-06-24",
          "value": 72.09
        },
        {
          "date": "2026-06-25",
          "value": 73.74
        },
        {
          "date": "2026-06-26",
          "value": 70.16
        },
        {
          "date": "2026-06-29",
          "value": 71.59
        },
        {
          "date": "2026-06-30",
          "value": 70.46
        },
        {
          "date": "2026-07-01",
          "value": 69.24
        },
        {
          "date": "2026-07-02",
          "value": 68.53
        },
        {
          "date": "2026-07-03",
          "value": 68.68
        },
        {
          "date": "2026-07-06",
          "value": 69.56
        },
        {
          "date": "2026-07-07",
          "value": 71.78
        },
        {
          "date": "2026-07-08",
          "value": 76.5
        },
        {
          "date": "2026-07-09",
          "value": 74.46
        },
        {
          "date": "2026-07-10",
          "value": 74.34
        },
        {
          "date": "2026-07-13",
          "value": 81.62
        },
        {
          "date": "2026-07-14",
          "value": 83.69
        },
        {
          "date": "2026-07-15",
          "value": 83.08
        },
        {
          "date": "2026-07-16",
          "value": 81.23
        },
        {
          "date": "2026-07-17",
          "value": 85.01
        },
        {
          "date": "2026-07-20",
          "value": 86.99
        },
        {
          "date": "2026-07-21",
          "value": 93.85
        },
        {
          "date": "2026-07-22",
          "value": 94.12
        },
        {
          "date": "2026-07-23",
          "value": 105.32
        },
        {
          "date": "2026-07-24",
          "value": 100.31
        },
        {
          "date": "2026-07-27",
          "value": 91.82
        },
        {
          "date": "2026-07-28",
          "value": 85.51
        },
        {
          "date": "2026-07-29",
          "value": 91.95
        },
        {
          "date": "2026-07-30",
          "value": 91.91
        },
        {
          "date": "2026-07-31",
          "value": 96.95
        },
        {
          "date": "2026-08-03",
          "value": 88.9
        },
        {
          "date": "2026-08-04",
          "value": 86.47
        },
        {
          "date": "2026-08-05",
          "value": 86.65
        },
        {
          "date": "2026-08-06",
          "value": 89.65
        },
        {
          "date": "2026-08-07",
          "value": 87.62
        },
        {
          "date": "2026-08-10",
          "value": 92.74
        },
        {
          "date": "2026-08-11",
          "value": 93.26
        },
        {
          "date": "2026-08-12",
          "value": 92.52
        },
        {
          "date": "2026-08-13",
          "value": 92.03
        },
        {
          "date": "2026-08-14",
          "value": 92.02
        },
        {
          "date": "2026-08-17",
          "value": 92.43
        },
        {
          "date": "2026-08-18",
          "value": 95.29
        },
        {
          "date": "2026-08-19",
          "value": 92.37
        },
        {
          "date": "2026-08-20",
          "value": 94.0
        },
        {
          "date": "2026-08-21",
          "value": 96.92
        },
        {
          "date": "2026-08-24",
          "value": 92.71
        },
        {
          "date": "2026-08-25",
          "value": 88.24
        },
        {
          "date": "2026-08-26",
          "value": 87.77
        },
        {
          "date": "2026-08-27",
          "value": 90.18
        },
        {
          "date": "2026-08-28",
          "value": 89.75
        },
        {
          "date": "2026-09-01",
          "value": 96.02
        },
        {
          "date": "2026-09-02",
          "value": 97.59
        },
        {
          "date": "2026-09-03",
          "value": 100.52
        },
        {
          "date": "2026-09-04",
          "value": 102.24
        },
        {
          "date": "2026-09-07",
          "value": 104.47
        },
        {
          "date": "2026-09-08",
          "value": 106.12
        },
        {
          "date": "2026-09-09",
          "value": 109.51
        },
        {
          "date": "2026-09-10",
          "value": 120.98
        },
        {
          "date": "2026-09-11",
          "value": 118.06
        },
        {
          "date": "2026-09-14",
          "value": 121.25
        },
        {
          "date": "2026-09-15",
          "value": 130.8
        },
        {
          "date": "2026-09-16",
          "value": 127.84
        },
        {
          "date": "2026-09-17",
          "value": 121.18
        },
        {
          "date": "2026-09-18",
          "value": 119.66
        },
        {
          "date": "2026-09-21",
          "value": 116.15
        },
        {
          "date": "2026-09-22",
          "value": 114.89
        },
        {
          "date": "2026-09-23",
          "value": 117.45
        },
        {
          "date": "2026-09-24",
          "value": 120.92
        },
        {
          "date": "2026-09-25",
          "value": 116.01
        },
        {
          "date": "2026-09-28",
          "value": 119.97
        },
        {
          "date": "2026-09-29",
          "value": 113.96
        },
        {
          "date": "2026-09-30",
          "value": 115.91
        },
        {
          "date": "2026-10-01",
          "value": 114.82
        },
        {
          "date": "2026-10-02",
          "value": 135.51
        },
        {
          "date": "2026-10-05",
          "value": 125.51
        },
        {
          "date": "2026-10-06",
          "value": 125.44
        }
      ],
      "wti": [
        {
          "date": "2025-10-06",
          "value": 62.49
        },
        {
          "date": "2025-10-07",
          "value": 62.52
        },
        {
          "date": "2025-10-08",
          "value": 63.37
        },
        {
          "date": "2025-10-09",
          "value": 62.36
        },
        {
          "date": "2025-10-10",
          "value": 59.75
        },
        {
          "date": "2025-10-14",
          "value": 59.52
        },
        {
          "date": "2025-10-15",
          "value": 59.08
        },
        {
          "date": "2025-10-16",
          "value": 58.29
        },
        {
          "date": "2025-10-17",
          "value": 58.3
        },
        {
          "date": "2025-10-20",
          "value": 58.34
        },
        {
          "date": "2025-10-21",
          "value": 58.66
        },
        {
          "date": "2025-10-22",
          "value": 59.3
        },
        {
          "date": "2025-10-23",
          "value": 62.44
        },
        {
          "date": "2025-10-24",
          "value": 62.27
        },
        {
          "date": "2025-10-27",
          "value": 62.13
        },
        {
          "date": "2025-10-28",
          "value": 60.97
        },
        {
          "date": "2025-10-29",
          "value": 61.26
        },
        {
          "date": "2025-10-30",
          "value": 61.36
        },
        {
          "date": "2025-10-31",
          "value": 61.75
        },
        {
          "date": "2025-11-03",
          "value": 61.79
        },
        {
          "date": "2025-11-04",
          "value": 61.38
        },
        {
          "date": "2025-11-05",
          "value": 60.4
        },
        {
          "date": "2025-11-06",
          "value": 60.24
        },
        {
          "date": "2025-11-07",
          "value": 60.54
        },
        {
          "date": "2025-11-10",
          "value": 60.94
        },
        {
          "date": "2025-11-12",
          "value": 59.3
        },
        {
          "date": "2025-11-13",
          "value": 59.54
        },
        {
          "date": "2025-11-14",
          "value": 60.87
        },
        {
          "date": "2025-11-17",
          "value": 60.66
        },
        {
          "date": "2025-11-18",
          "value": 61.51
        },
        {
          "date": "2025-11-19",
          "value": 60.27
        },
        {
          "date": "2025-11-20",
          "value": 60.07
        },
        {
          "date": "2025-11-21",
          "value": 58.86
        },
        {
          "date": "2025-11-24",
          "value": 59.11
        },
        {
          "date": "2025-11-25",
          "value": 58.25
        },
        {
          "date": "2025-11-26",
          "value": 58.81
        },
        {
          "date": "2025-11-28",
          "value": 58.58
        },
        {
          "date": "2025-12-01",
          "value": 59.47
        },
        {
          "date": "2025-12-02",
          "value": 58.81
        },
        {
          "date": "2025-12-03",
          "value": 59.09
        },
        {
          "date": "2025-12-04",
          "value": 59.82
        },
        {
          "date": "2025-12-05",
          "value": 60.23
        },
        {
          "date": "2025-12-08",
          "value": 59.04
        },
        {
          "date": "2025-12-09",
          "value": 58.4
        },
        {
          "date": "2025-12-10",
          "value": 58.67
        },
        {
          "date": "2025-12-11",
          "value": 57.76
        },
        {
          "date": "2025-12-12",
          "value": 57.61
        },
        {
          "date": "2025-12-15",
          "value": 56.97
        },
        {
          "date": "2025-12-16",
          "value": 55.44
        },
        {
          "date": "2025-12-17",
          "value": 56.07
        },
        {
          "date": "2025-12-18",
          "value": 56.22
        },
        {
          "date": "2025-12-19",
          "value": 56.8
        },
        {
          "date": "2025-12-22",
          "value": 58.18
        },
        {
          "date": "2025-12-23",
          "value": 58.55
        },
        {
          "date": "2025-12-24",
          "value": 58.72
        },
        {
          "date": "2025-12-26",
          "value": 56.6
        },
        {
          "date": "2025-12-29",
          "value": 57.89
        },
        {
          "date": "2025-12-30",
          "value": 57.79
        },
        {
          "date": "2025-12-31",
          "value": 57.26
        },
        {
          "date": "2026-01-02",
          "value": 57.21
        },
        {
          "date": "2026-01-05",
          "value": 58.1
        },
        {
          "date": "2026-01-06",
          "value": 56.97
        },
        {
          "date": "2026-01-07",
          "value": 56.01
        },
        {
          "date": "2026-01-08",
          "value": 57.74
        },
        {
          "date": "2026-01-09",
          "value": 58.96
        },
        {
          "date": "2026-01-12",
          "value": 59.39
        },
        {
          "date": "2026-01-13",
          "value": 60.85
        },
        {
          "date": "2026-01-14",
          "value": 61.84
        },
        {
          "date": "2026-01-15",
          "value": 59.13
        },
        {
          "date": "2026-01-16",
          "value": 59.4
        },
        {
          "date": "2026-01-20",
          "value": 60.3
        },
        {
          "date": "2026-01-21",
          "value": 60.38
        },
        {
          "date": "2026-01-22",
          "value": 59.24
        },
        {
          "date": "2026-01-23",
          "value": 60.7
        },
        {
          "date": "2026-01-26",
          "value": 60.46
        },
        {
          "date": "2026-01-27",
          "value": 62.04
        },
        {
          "date": "2026-01-28",
          "value": 62.75
        },
        {
          "date": "2026-01-29",
          "value": 64.77
        },
        {
          "date": "2026-01-30",
          "value": 64.5
        },
        {
          "date": "2026-02-02",
          "value": 61.6
        },
        {
          "date": "2026-02-03",
          "value": 62.62
        },
        {
          "date": "2026-02-04",
          "value": 64.56
        },
        {
          "date": "2026-02-05",
          "value": 62.9
        },
        {
          "date": "2026-02-06",
          "value": 63.77
        },
        {
          "date": "2026-02-09",
          "value": 64.53
        },
        {
          "date": "2026-02-10",
          "value": 64.2
        },
        {
          "date": "2026-02-11",
          "value": 64.8
        },
        {
          "date": "2026-02-12",
          "value": 63.08
        },
        {
          "date": "2026-02-13",
          "value": 63.05
        },
        {
          "date": "2026-02-17",
          "value": 62.53
        },
        {
          "date": "2026-02-18",
          "value": 65.33
        },
        {
          "date": "2026-02-19",
          "value": 66.66
        },
        {
          "date": "2026-02-20",
          "value": 66.69
        },
        {
          "date": "2026-02-23",
          "value": 66.36
        },
        {
          "date": "2026-02-24",
          "value": 65.62
        },
        {
          "date": "2026-02-25",
          "value": 65.3
        },
        {
          "date": "2026-02-26",
          "value": 65.1
        },
        {
          "date": "2026-02-27",
          "value": 66.96
        },
        {
          "date": "2026-03-02",
          "value": 71.13
        },
        {
          "date": "2026-03-03",
          "value": 74.48
        },
        {
          "date": "2026-03-04",
          "value": 74.58
        },
        {
          "date": "2026-03-05",
          "value": 80.88
        },
        {
          "date": "2026-03-06",
          "value": 90.77
        },
        {
          "date": "2026-03-09",
          "value": 94.65
        },
        {
          "date": "2026-03-10",
          "value": 83.71
        },
        {
          "date": "2026-03-11",
          "value": 86.8
        },
        {
          "date": "2026-03-12",
          "value": 95.61
        },
        {
          "date": "2026-03-13",
          "value": 98.48
        },
        {
          "date": "2026-03-16",
          "value": 93.39
        },
        {
          "date": "2026-03-17",
          "value": 96.01
        },
        {
          "date": "2026-03-18",
          "value": 96.12
        },
        {
          "date": "2026-03-19",
          "value": 96.11
        },
        {
          "date": "2026-03-20",
          "value": 98.71
        },
        {
          "date": "2026-03-23",
          "value": 89.33
        },
        {
          "date": "2026-03-24",
          "value": 93.18
        },
        {
          "date": "2026-03-25",
          "value": 91.51
        },
        {
          "date": "2026-03-26",
          "value": 96.18
        },
        {
          "date": "2026-03-27",
          "value": 101.26
        },
        {
          "date": "2026-03-30",
          "value": 104.69
        },
        {
          "date": "2026-03-31",
          "value": 102.86
        },
        {
          "date": "2026-04-01",
          "value": 101.9
        },
        {
          "date": "2026-04-02",
          "value": 113.23
        },
        {
          "date": "2026-04-06",
          "value": 114.01
        },
        {
          "date": "2026-04-07",
          "value": 114.58
        },
        {
          "date": "2026-04-08",
          "value": 96.17
        },
        {
          "date": "2026-04-09",
          "value": 99.62
        },
        {
          "date": "2026-04-10",
          "value": 98.34
        },
        {
          "date": "2026-04-13",
          "value": 100.72
        },
        {
          "date": "2026-04-14",
          "value": 93.07
        },
        {
          "date": "2026-04-15",
          "value": 93.04
        },
        {
          "date": "2026-04-16",
          "value": 96.46
        },
        {
          "date": "2026-04-17",
          "value": 85.91
        },
        {
          "date": "2026-04-20",
          "value": 91.06
        },
        {
          "date": "2026-04-21",
          "value": 93.64
        },
        {
          "date": "2026-04-22",
          "value": 94.76
        },
        {
          "date": "2026-04-23",
          "value": 99.27
        },
        {
          "date": "2026-04-24",
          "value": 98.42
        },
        {
          "date": "2026-04-27",
          "value": 99.89
        },
        {
          "date": "2026-04-28",
          "value": 103.45
        },
        {
          "date": "2026-04-29",
          "value": 110.47
        },
        {
          "date": "2026-04-30",
          "value": 108.64
        },
        {
          "date": "2026-05-01",
          "value": 105.38
        },
        {
          "date": "2026-05-04",
          "value": 109.76
        },
        {
          "date": "2026-05-05",
          "value": 105.66
        },
        {
          "date": "2026-05-06",
          "value": 98.75
        },
        {
          "date": "2026-05-07",
          "value": 98.38
        },
        {
          "date": "2026-05-08",
          "value": 98.87
        },
        {
          "date": "2026-05-11",
          "value": 101.56
        },
        {
          "date": "2026-05-12",
          "value": 105.78
        },
        {
          "date": "2026-05-13",
          "value": 104.52
        },
        {
          "date": "2026-05-14",
          "value": 104.66
        },
        {
          "date": "2026-05-15",
          "value": 108.99
        },
        {
          "date": "2026-05-18",
          "value": 112.25
        },
        {
          "date": "2026-05-19",
          "value": 112.09
        },
        {
          "date": "2026-05-20",
          "value": 101.69
        },
        {
          "date": "2026-05-21",
          "value": 100.2
        },
        {
          "date": "2026-05-22",
          "value": 100.35
        },
        {
          "date": "2026-05-26",
          "value": 97.63
        },
        {
          "date": "2026-05-27",
          "value": 92.35
        },
        {
          "date": "2026-05-28",
          "value": 92.65
        },
        {
          "date": "2026-05-29",
          "value": 91.16
        },
        {
          "date": "2026-06-01",
          "value": 95.96
        },
        {
          "date": "2026-06-02",
          "value": 97.47
        },
        {
          "date": "2026-06-03",
          "value": 99.76
        },
        {
          "date": "2026-06-04",
          "value": 96.83
        },
        {
          "date": "2026-06-05",
          "value": 94.32
        },
        {
          "date": "2026-06-08",
          "value": 95.0
        },
        {
          "date": "2026-06-09",
          "value": 91.9
        },
        {
          "date": "2026-06-10",
          "value": 93.68
        },
        {
          "date": "2026-06-11",
          "value": 91.58
        },
        {
          "date": "2026-06-12",
          "value": 88.62
        },
        {
          "date": "2026-06-15",
          "value": 84.65
        },
        {
          "date": "2026-06-16",
          "value": 79.8
        },
        {
          "date": "2026-06-17",
          "value": 80.65
        },
        {
          "date": "2026-06-18",
          "value": 80.35
        },
        {
          "date": "2026-06-22",
          "value": 78.94
        },
        {
          "date": "2026-06-23",
          "value": 74.62
        },
        {
          "date": "2026-06-24",
          "value": 71.42
        },
        {
          "date": "2026-06-25",
          "value": 72.67
        },
        {
          "date": "2026-06-26",
          "value": 70.3
        },
        {
          "date": "2026-06-29",
          "value": 71.87
        },
        {
          "date": "2026-06-30",
          "value": 70.56
        },
        {
          "date": "2026-07-01",
          "value": 69.74
        },
        {
          "date": "2026-07-02",
          "value": 69.73
        },
        {
          "date": "2026-07-06",
          "value": 69.6
        },
        {
          "date": "2026-07-07",
          "value": 71.53
        },
        {
          "date": "2026-07-08",
          "value": 74.56
        },
        {
          "date": "2026-07-09",
          "value": 73.15
        },
        {
          "date": "2026-07-10",
          "value": 72.45
        },
        {
          "date": "2026-07-13",
          "value": 79.2
        },
        {
          "date": "2026-07-14",
          "value": 80.44
        },
        {
          "date": "2026-07-15",
          "value": 80.73
        },
        {
          "date": "2026-07-16",
          "value": 80.03
        },
        {
          "date": "2026-07-17",
          "value": 83.43
        },
        {
          "date": "2026-07-20",
          "value": 84.38
        },
        {
          "date": "2026-07-21",
          "value": 86.04
        },
        {
          "date": "2026-07-22",
          "value": 87.66
        },
        {
          "date": "2026-07-23",
          "value": 93.08
        },
        {
          "date": "2026-07-24",
          "value": 91.74
        },
        {
          "date": "2026-07-27",
          "value": 84.25
        },
        {
          "date": "2026-07-28",
          "value": 80.91
        },
        {
          "date": "2026-07-29",
          "value": 86.08
        },
        {
          "date": "2026-07-30",
          "value": 85.15
        },
        {
          "date": "2026-07-31",
          "value": 86.16
        },
        {
          "date": "2026-08-03",
          "value": 81.96
        },
        {
          "date": "2026-08-04",
          "value": 77.33
        },
        {
          "date": "2026-08-05",
          "value": 76.78
        },
        {
          "date": "2026-08-06",
          "value": 78.88
        },
        {
          "date": "2026-08-07",
          "value": 79.77
        },
        {
          "date": "2026-08-10",
          "value": 83.76
        },
        {
          "date": "2026-08-11",
          "value": 84.77
        },
        {
          "date": "2026-08-12",
          "value": 84.97
        },
        {
          "date": "2026-08-13",
          "value": 82.77
        },
        {
          "date": "2026-08-14",
          "value": 83.99
        },
        {
          "date": "2026-08-17",
          "value": 86.04
        },
        {
          "date": "2026-08-18",
          "value": 86.48
        },
        {
          "date": "2026-08-19",
          "value": 87.28
        },
        {
          "date": "2026-08-20",
          "value": 89.75
        },
        {
          "date": "2026-08-21",
          "value": 87.21
        },
        {
          "date": "2026-08-24",
          "value": 86.34
        },
        {
          "date": "2026-08-25",
          "value": 83.9
        },
        {
          "date": "2026-08-26",
          "value": 83.46
        },
        {
          "date": "2026-08-27",
          "value": 84.81
        },
        {
          "date": "2026-08-28",
          "value": 84.57
        },
        {
          "date": "2026-08-31",
          "value": 87.03
        },
        {
          "date": "2026-09-01",
          "value": 91.48
        },
        {
          "date": "2026-09-02",
          "value": 92.15
        },
        {
          "date": "2026-09-03",
          "value": 92.55
        },
        {
          "date": "2026-09-04",
          "value": 92.69
        },
        {
          "date": "2026-09-08",
          "value": 94.21
        },
        {
          "date": "2026-09-09",
          "value": 97.26
        },
        {
          "date": "2026-09-10",
          "value": 103.57
        },
        {
          "date": "2026-09-11",
          "value": 101.27
        },
        {
          "date": "2026-09-14",
          "value": 102.42
        },
        {
          "date": "2026-09-15",
          "value": 107.02
        },
        {
          "date": "2026-09-16",
          "value": 103.62
        },
        {
          "date": "2026-09-17",
          "value": 103.21
        },
        {
          "date": "2026-09-18",
          "value": 101.44
        },
        {
          "date": "2026-09-21",
          "value": 96.97
        },
        {
          "date": "2026-09-22",
          "value": 96.41
        },
        {
          "date": "2026-09-23",
          "value": 93.38
        },
        {
          "date": "2026-09-24",
          "value": 95.88
        },
        {
          "date": "2026-09-25",
          "value": 85.23
        },
        {
          "date": "2026-09-28",
          "value": 99.37
        },
        {
          "date": "2026-09-29",
          "value": 96.16
        },
        {
          "date": "2026-09-30",
          "value": 97.18
        },
        {
          "date": "2026-10-01",
          "value": 99.77
        },
        {
          "date": "2026-10-02",
          "value": 97.89
        },
        {
          "date": "2026-10-05",
          "value": 96.13
        },
        {
          "date": "2026-10-06",
          "value": 96.24
        }
      ]
    },
    "power_fr": [
      {
        "at": "2026-10-10T23:30:00+00:00",
        "bioenergies": 1026,
        "charbon": 0,
        "ech_physiques": -7425,
        "eolien": 4759,
        "fioul": 37,
        "gaz": 604,
        "hydraulique": 2598,
        "load": 37829,
        "nucleaire": 37443,
        "pompage": -1209,
        "prevision_j": 38700,
        "prevision_j1": 38700,
        "solaire": 0,
        "taux_co2": 17
      },
      {
        "at": "2026-10-10T23:45:00+00:00",
        "bioenergies": 1038,
        "charbon": 0,
        "ech_physiques": -7248,
        "eolien": 4623,
        "fioul": 37,
        "gaz": 563,
        "hydraulique": 2477,
        "load": 37493,
        "nucleaire": 37214,
        "pompage": -1208,
        "prevision_j": 38000,
        "prevision_j1": 38000,
        "solaire": 0,
        "taux_co2": 17
      },
      {
        "at": "2026-10-11T00:00:00+00:00",
        "bioenergies": 1037,
        "charbon": 0,
        "ech_physiques": -7913,
        "eolien": 4424,
        "fioul": 37,
        "gaz": 539,
        "hydraulique": 2441,
        "load": 36529,
        "nucleaire": 37187,
        "pompage": -1214,
        "prevision_j": 37300,
        "prevision_j1": 37300,
        "solaire": 0,
        "taux_co2": 17
      },
      {
        "at": "2026-10-11T00:15:00+00:00",
        "bioenergies": 1037,
        "charbon": 0,
        "ech_physiques": -8269,
        "eolien": 4368,
        "fioul": 37,
        "gaz": 565,
        "hydraulique": 2358,
        "load": 36103,
        "nucleaire": 37198,
        "pompage": -1213,
        "prevision_j": 36400,
        "prevision_j1": 36400,
        "solaire": 0,
        "taux_co2": 17
      },
      {
        "at": "2026-10-11T00:30:00+00:00",
        "bioenergies": 1039,
        "charbon": 0,
        "ech_physiques": -9028,
        "eolien": 4327,
        "fioul": 37,
        "gaz": 567,
        "hydraulique": 2370,
        "load": 35200,
        "nucleaire": 37065,
        "pompage": -1214,
        "prevision_j": 35500,
        "prevision_j1": 35500,
        "solaire": 0,
        "taux_co2": 17
      },
      {
        "at": "2026-10-11T00:45:00+00:00",
        "bioenergies": 1034,
        "charbon": 0,
        "ech_physiques": -9373,
        "eolien": 4256,
        "fioul": 37,
        "gaz": 530,
        "hydraulique": 2397,
        "load": 34594,
        "nucleaire": 36919,
        "pompage": -1213,
        "prevision_j": 34800,
        "prevision_j1": 34800,
        "solaire": 0,
        "taux_co2": 17
      },
      {
        "at": "2026-10-11T01:00:00+00:00",
        "bioenergies": 1036,
        "charbon": 0,
        "ech_physiques": -9889,
        "eolien": 4213,
        "fioul": 37,
        "gaz": 533,
        "hydraulique": 2375,
        "load": 33883,
        "nucleaire": 36775,
        "pompage": -1214,
        "prevision_j": 34100,
        "prevision_j1": 34100,
        "solaire": 0,
        "taux_co2": 17
      },
      {
        "at": "2026-10-11T01:15:00+00:00",
        "bioenergies": 1037,
        "charbon": 0,
        "ech_physiques": -9901,
        "eolien": 4138,
        "fioul": 37,
        "gaz": 586,
        "hydraulique": 2273,
        "load": 33582,
        "nucleaire": 36636,
        "pompage": -1214,
        "prevision_j": 33550,
        "prevision_j1": 33700,
        "solaire": 0,
        "taux_co2": 18
      },
      {
        "at": "2026-10-11T01:30:00+00:00",
        "bioenergies": 1037,
        "charbon": 0,
        "ech_physiques": -10115,
        "eolien": 4107,
        "fioul": 37,
        "gaz": 552,
        "hydraulique": 2308,
        "load": 33168,
        "nucleaire": 36449,
        "pompage": -1212,
        "prevision_j": 33000,
        "prevision_j1": 33300,
        "solaire": 0,
        "taux_co2": 17
      },
      {
        "at": "2026-10-11T01:45:00+00:00",
        "bioenergies": 1036,
        "charbon": 0,
        "ech_physiques": -10222,
        "eolien": 4046,
        "fioul": 37,
        "gaz": 529,
        "hydraulique": 2322,
        "load": 32941,
        "nucleaire": 36406,
        "pompage": -1218,
        "prevision_j": 32750,
        "prevision_j1": 33000,
        "solaire": 0,
        "taux_co2": 17
      },
      {
        "at": "2026-10-11T02:00:00+00:00",
        "bioenergies": 1034,
        "charbon": 0,
        "ech_physiques": -10310,
        "eolien": 4067,
        "fioul": 37,
        "gaz": 550,
        "hydraulique": 2323,
        "load": 32869,
        "nucleaire": 36398,
        "pompage": -1216,
        "prevision_j": 32500,
        "prevision_j1": 32700,
        "solaire": 0,
        "taux_co2": 17
      },
      {
        "at": "2026-10-11T02:15:00+00:00",
        "bioenergies": 1034,
        "charbon": 0,
        "ech_physiques": -10124,
        "eolien": 3983,
        "fioul": 37,
        "gaz": 602,
        "hydraulique": 2275,
        "load": 32874,
        "nucleaire": 36325,
        "pompage": -1216,
        "prevision_j": 32400,
        "prevision_j1": 32550,
        "solaire": 0,
        "taux_co2": 18
      },
      {
        "at": "2026-10-11T02:30:00+00:00",
        "bioenergies": 1032,
        "charbon": 0,
        "ech_physiques": -10166,
        "eolien": 3867,
        "fioul": 37,
        "gaz": 539,
        "hydraulique": 2335,
        "load": 32587,
        "nucleaire": 36386,
        "pompage": -1409,
        "prevision_j": 32300,
        "prevision_j1": 32400,
        "solaire": 0,
        "taux_co2": 17
      },
      {
        "at": "2026-10-11T02:45:00+00:00",
        "bioenergies": 1035,
        "charbon": 0,
        "ech_physiques": -10339,
        "eolien": 3683,
        "fioul": 37,
        "gaz": 533,
        "hydraulique": 2262,
        "load": 32230,
        "nucleaire": 36458,
        "pompage": -1406,
        "prevision_j": 32150,
        "prevision_j1": 32200,
        "solaire": 0,
        "taux_co2": 17
      },
      {
        "at": "2026-10-11T03:00:00+00:00",
        "bioenergies": 1033,
        "charbon": 0,
        "ech_physiques": -10664,
        "eolien": 3659,
        "fioul": 37,
        "gaz": 564,
        "hydraulique": 2291,
        "load": 32144,
        "nucleaire": 36677,
        "pompage": -1413,
        "prevision_j": 32000,
        "prevision_j1": 32000,
        "solaire": 0,
        "taux_co2": 18
      },
      {
        "at": "2026-10-11T03:15:00+00:00",
        "bioenergies": 1035,
        "charbon": 0,
        "ech_physiques": -10651,
        "eolien": 3517,
        "fioul": 37,
        "gaz": 602,
        "hydraulique": 2362,
        "load": 32421,
        "nucleaire": 36968,
        "pompage": -1409,
        "prevision_j": 32100,
        "prevision_j1": 32050,
        "solaire": 0,
        "taux_co2": 18
      },
      {
        "at": "2026-10-11T03:30:00+00:00",
        "bioenergies": 1036,
        "charbon": 0,
        "ech_physiques": -10523,
        "eolien": 3431,
        "fioul": 36,
        "gaz": 578,
        "hydraulique": 2286,
        "load": 32278,
        "nucleaire": 36914,
        "pompage": -1409,
        "prevision_j": 32200,
        "prevision_j1": 32100,
        "solaire": 0,
        "taux_co2": 18
      },
      {
        "at": "2026-10-11T03:45:00+00:00",
        "bioenergies": 1033,
        "charbon": 0,
        "ech_physiques": -10549,
        "eolien": 3476,
        "fioul": 37,
        "gaz": 599,
        "hydraulique": 2310,
        "load": 32459,
        "nucleaire": 36985,
        "pompage": -1409,
        "prevision_j": 32500,
        "prevision_j1": 32400,
        "solaire": 0,
        "taux_co2": 18
      },
      {
        "at": "2026-10-11T04:00:00+00:00",
        "bioenergies": 1031,
        "charbon": 0,
        "ech_physiques": -10746,
        "eolien": 3510,
        "fioul": 37,
        "gaz": 601,
        "hydraulique": 2413,
        "load": 32599,
        "nucleaire": 37205,
        "pompage": -1406,
        "prevision_j": 32800,
        "prevision_j1": 32700,
        "solaire": 0,
        "taux_co2": 18
      },
      {
        "at": "2026-10-11T04:15:00+00:00",
        "bioenergies": 1034,
        "charbon": 0,
        "ech_physiques": -10500,
        "eolien": 3504,
        "fioul": 37,
        "gaz": 582,
        "hydraulique": 2525,
        "load": 33080,
        "nucleaire": 37334,
        "pompage": -1406,
        "prevision_j": 33300,
        "prevision_j1": 33150,
        "solaire": 0,
        "taux_co2": 17
      },
      {
        "at": "2026-10-11T04:30:00+00:00",
        "bioenergies": 1030,
        "charbon": 0,
        "ech_physiques": -10190,
        "eolien": 3461,
        "fioul": 36,
        "gaz": 546,
        "hydraulique": 2499,
        "load": 33441,
        "nucleaire": 37488,
        "pompage": -1408,
        "prevision_j": 33800,
        "prevision_j1": 33600,
        "solaire": 0,
        "taux_co2": 17
      },
      {
        "at": "2026-10-11T04:45:00+00:00",
        "bioenergies": 1030,
        "charbon": 0,
        "ech_physiques": -10470,
        "eolien": 3371,
        "fioul": 37,
        "gaz": 557,
        "hydraulique": 2576,
        "load": 33352,
        "nucleaire": 37650,
        "pompage": -1409,
        "prevision_j": 34000,
        "prevision_j1": 33800,
        "solaire": 0,
        "taux_co2": 17
      },
      {
        "at": "2026-10-11T05:00:00+00:00",
        "bioenergies": 1031,
        "charbon": 0,
        "ech_physiques": -10426,
        "eolien": 3314,
        "fioul": 37,
        "gaz": 604,
        "hydraulique": 2727,
        "load": 33666,
        "nucleaire": 37782,
        "pompage": -1409,
        "prevision_j": 34200,
        "prevision_j1": 34000,
        "solaire": 0,
        "taux_co2": 17
      },
      {
        "at": "2026-10-11T05:15:00+00:00",
        "bioenergies": 1032,
        "charbon": 0,
        "ech_physiques": -9927,
        "eolien": 3230,
        "fioul": 36,
        "gaz": 547,
        "hydraulique": 3021,
        "load": 34341,
        "nucleaire": 37803,
        "pompage": -1411,
        "prevision_j": 34600,
        "prevision_j1": 34350,
        "solaire": 0,
        "taux_co2": 17
      },
      {
        "at": "2026-10-11T05:30:00+00:00",
        "bioenergies": 1035,
        "charbon": 0,
        "ech_physiques": -9955,
        "eolien": 3197,
        "fioul": 37,
        "gaz": 531,
        "hydraulique": 3044,
        "load": 34520,
        "nucleaire": 37795,
        "pompage": -1409,
        "prevision_j": 35000,
        "prevision_j1": 34700,
        "solaire": 223,
        "taux_co2": 17
      },
      {
        "at": "2026-10-11T05:45:00+00:00",
        "bioenergies": 1031,
        "charbon": 0,
        "ech_physiques": -10744,
        "eolien": 3184,
        "fioul": 37,
        "gaz": 570,
        "hydraulique": 3104,
        "load": 34625,
        "nucleaire": 37913,
        "pompage": -754,
        "prevision_j": 35200,
        "prevision_j1": 34900,
        "solaire": 213,
        "taux_co2": 17
      },
      {
        "at": "2026-10-11T06:00:00+00:00",
        "bioenergies": 1035,
        "charbon": 0,
        "ech_physiques": -10871,
        "eolien": 3210,
        "fioul": 37,
        "gaz": 587,
        "hydraulique": 3244,
        "load": 35112,
        "nucleaire": 37920,
        "pompage": -364,
        "prevision_j": 35400,
        "prevision_j1": 35100,
        "solaire": 228,
        "taux_co2": 17
      },
      {
        "at": "2026-10-11T06:15:00+00:00",
        "bioenergies": 1034,
        "charbon": 0,
        "ech_physiques": -10648,
        "eolien": 3314,
        "fioul": 37,
        "gaz": 533,
        "hydraulique": 3156,
        "load": 35575,
        "nucleaire": 37886,
        "pompage": -367,
        "prevision_j": 36100,
        "prevision_j1": 35750,
        "solaire": 345,
        "taux_co2": 17
      },
      {
        "at": "2026-10-11T06:30:00+00:00",
        "bioenergies": 1034,
        "charbon": 0,
        "ech_physiques": -10674,
        "eolien": 3292,
        "fioul": 37,
        "gaz": 524,
        "hydraulique": 3263,
        "load": 35786,
        "nucleaire": 37867,
        "pompage": -366,
        "prevision_j": 36800,
        "prevision_j1": 36400,
        "solaire": 626,
        "taux_co2": 16
      },
      {
        "at": "2026-10-11T06:45:00+00:00",
        "bioenergies": 1032,
        "charbon": 0,
        "ech_physiques": -10392,
        "eolien": 3157,
        "fioul": 37,
        "gaz": 581,
        "hydraulique": 3439,
        "load": 36430,
        "nucleaire": 37892,
        "pompage": -366,
        "prevision_j": 37450,
        "prevision_j1": 37050,
        "solaire": 1077,
        "taux_co2": 17
      },
      {
        "at": "2026-10-11T07:00:00+00:00",
        "bioenergies": 1034,
        "charbon": 0,
        "ech_physiques": -10286,
        "eolien": 3104,
        "fioul": 37,
        "gaz": 548,
        "hydraulique": 3352,
        "load": 37109,
        "nucleaire": 37915,
        "pompage": -403,
        "prevision_j": 38100,
        "prevision_j1": 37700,
        "solaire": 1689,
        "taux_co2": 16
      },
      {
        "at": "2026-10-11T07:15:00+00:00",
        "bioenergies": 1032,
        "charbon": 0,
        "ech_physiques": -9707,
        "eolien": 3055,
        "fioul": 37,
        "gaz": 521,
        "hydraulique": 2880,
        "load": 37926,
        "nucleaire": 37869,
        "pompage": -407,
        "prevision_j": 38850,
        "prevision_j1": 38400,
        "solaire": 2472,
        "taux_co2": 16
      },
      {
        "at": "2026-10-11T07:30:00+00:00",
        "bioenergies": 1031,
        "charbon": 0,
        "ech_physiques": -9818,
        "eolien": 3040,
        "fioul": 37,
        "gaz": 534,
        "hydraulique": 2840,
        "load": 37917,
        "nucleaire": 37815,
        "pompage": -936,
        "prevision_j": 39600,
        "prevision_j1": 39100,
        "solaire": 3393,
        "taux_co2": 16
      },
      {
        "at": "2026-10-11T07:45:00+00:00",
        "bioenergies": 1032,
        "charbon": 0,
        "ech_physiques": -10225,
        "eolien": 2804,
        "fioul": 37,
        "gaz": 598,
        "hydraulique": 2856,
        "load": 38255,
        "nucleaire": 37821,
        "pompage": -930,
        "prevision_j": 40300,
        "prevision_j1": 39800,
        "solaire": 4268,
        "taux_co2": 16
      },
      {
        "at": "2026-10-11T08:00:00+00:00",
        "bioenergies": 1020,
        "charbon": 0,
        "ech_physiques": -9959,
        "eolien": 2696,
        "fioul": 37,
        "gaz": 538,
        "hydraulique": 2606,
        "load": 39069,
        "nucleaire": 37854,
        "pompage": -939,
        "prevision_j": 41000,
        "prevision_j1": 40500,
        "solaire": 5212,
        "taux_co2": 15
      },
      {
        "at": "2026-10-11T08:15:00+00:00",
        "bioenergies": 1019,
        "charbon": 0,
        "ech_physiques": -9489,
        "eolien": 2443,
        "fioul": 37,
        "gaz": 544,
        "hydraulique": 2215,
        "load": 39511,
        "nucleaire": 37839,
        "pompage": -1406,
        "prevision_j": 41600,
        "prevision_j1": 41100,
        "solaire": 6269,
        "taux_co2": 15
      },
      {
        "at": "2026-10-11T08:30:00+00:00",
        "bioenergies": 1016,
        "charbon": 0,
        "ech_physiques": -9936,
        "eolien": 2389,
        "fioul": 37,
        "gaz": 587,
        "hydraulique": 2125,
        "load": 39838,
        "nucleaire": 37774,
        "pompage": -1403,
        "prevision_j": 42200,
        "prevision_j1": 41700,
        "solaire": 7264,
        "taux_co2": 15
      },
      {
        "at": "2026-10-11T08:45:00+00:00",
        "bioenergies": 1014,
        "charbon": 0,
        "ech_physiques": -9365,
        "eolien": 2279,
        "fioul": 37,
        "gaz": 601,
        "hydraulique": 1848,
        "load": 40275,
        "nucleaire": 37632,
        "pompage": -1602,
        "prevision_j": 41500,
        "prevision_j1": 41550,
        "solaire": 8058,
        "taux_co2": 15
      },
      {
        "at": "2026-10-11T09:00:00+00:00",
        "bioenergies": 1015,
        "charbon": 0,
        "ech_physiques": -9365,
        "eolien": 2199,
        "fioul": 37,
        "gaz": 561,
        "hydraulique": 1872,
        "load": 40684,
        "nucleaire": 37304,
        "pompage": -1774,
        "prevision_j": 40800,
        "prevision_j1": 41400,
        "solaire": 9162,
        "taux_co2": 15
      },
      {
        "at": "2026-10-11T09:15:00+00:00",
        "bioenergies": 1017,
        "charbon": 0,
        "ech_physiques": -9504,
        "eolien": 2184,
        "fioul": 36,
        "gaz": 550,
        "hydraulique": 1856,
        "load": 41405,
        "nucleaire": 36990,
        "pompage": -1774,
        "prevision_j": 41150,
        "prevision_j1": 41700,
        "solaire": 10194,
        "taux_co2": 15
      },
      {
        "at": "2026-10-11T09:30:00+00:00",
        "bioenergies": 1016,
        "charbon": 0,
        "ech_physiques": -9618,
        "eolien": 2230,
        "fioul": 37,
        "gaz": 592,
        "hydraulique": 1815,
        "load": 41690,
        "nucleaire": 36816,
        "pompage": -1908,
        "prevision_j": 41500,
        "prevision_j1": 42000,
        "solaire": 10857,
        "taux_co2": 15
      },
      {
        "at": "2026-10-11T09:45:00+00:00",
        "bioenergies": 1017,
        "charbon": 0,
        "ech_physiques": -9112,
        "eolien": 2227,
        "fioul": 37,
        "gaz": 555,
        "hydraulique": 1674,
        "load": 42193,
        "nucleaire": 36540,
        "pompage": -2150,
        "prevision_j": 42250,
        "prevision_j1": 42700,
        "solaire": 11539,
        "taux_co2": 14
      },
      {
        "at": "2026-10-11T10:00:00+00:00",
        "bioenergies": 1014,
        "charbon": 0,
        "ech_physiques": -8804,
        "eolien": 2325,
        "fioul": 37,
        "gaz": 547,
        "hydraulique": 1733,
        "load": 42907,
        "nucleaire": 36388,
        "pompage": -2209,
        "prevision_j": 43000,
        "prevision_j1": 43400,
        "solaire": 12088,
        "taux_co2": 14
      },
      {
        "at": "2026-10-11T10:15:00+00:00",
        "bioenergies": 1016,
        "charbon": 0,
        "ech_physiques": -8448,
        "eolien": 2243,
        "fioul": 36,
        "gaz": 576,
        "hydraulique": 1672,
        "load": 43340,
        "nucleaire": 36229,
        "pompage": -2441,
        "prevision_j": 43200,
        "prevision_j1": 43550,
        "solaire": 12611,
        "taux_co2": 14
      },
      {
        "at": "2026-10-11T10:30:00+00:00",
        "bioenergies": 1018,
        "charbon": 0,
        "ech_physiques": -8331,
        "eolien": 2280,
        "fioul": 36,
        "gaz": 608,
        "hydraulique": 1678,
        "load": 43821,
        "nucleaire": 35780,
        "pompage": -2444,
        "prevision_j": 43400,
        "prevision_j1": 43700,
        "solaire": 13322,
        "taux_co2": 14
      },
      {
        "at": "2026-10-11T10:45:00+00:00",
        "bioenergies": 1017,
        "charbon": 0,
        "ech_physiques": -8042,
        "eolien": 2516,
        "fioul": 37,
        "gaz": 573,
        "hydraulique": 1689,
        "load": 44527,
        "nucleaire": 35936,
        "pompage": -2438,
        "prevision_j": 43750,
        "prevision_j1": 44050,
        "solaire": 13358,
        "taux_co2": 14
      },
      {
        "at": "2026-10-11T11:00:00+00:00",
        "bioenergies": 1016,
        "charbon": 0,
        "ech_physiques": -8872,
        "eolien": 2520,
        "fioul": 37,
        "gaz": 571,
        "hydraulique": 1699,
        "load": 43986,
        "nucleaire": 36021,
        "pompage": -2428,
        "prevision_j": 44100,
        "prevision_j1": 44400,
        "solaire": 13587,
        "taux_co2": 14
      },
      {
        "at": "2026-10-11T11:15:00+00:00",
        "bioenergies": 1017,
        "charbon": 0,
        "ech_physiques": -9712,
        "eolien": 2530,
        "fioul": 37,
        "gaz": 601,
        "hydraulique": 1804,
        "load": 43367,
        "nucleaire": 36068,
        "pompage": -2433,
        "prevision_j": 42750,
        "prevision_j1": 43000,
        "solaire": 13586,
        "taux_co2": 14
      },
      {
        "at": "2026-10-11T11:30:00+00:00",
        "bioenergies": 1017,
        "charbon": 0,
        "ech_physiques": -10155,
        "eolien": 2477,
        "fioul": 36,
        "gaz": 646,
        "hydraulique": 1744,
        "load": 42518,
        "nucleaire": 35670,
        "pompage": -2440,
        "prevision_j": 41400,
        "prevision_j1": 41600,
        "solaire": 13581,
        "taux_co2": 15
      },
      {
        "at": "2026-10-11T11:45:00+00:00",
        "bioenergies": 1013,
        "charbon": 0,
        "ech_physiques": -10027,
        "eolien": 2376,
        "fioul": 36,
        "gaz": 602,
        "hydraulique": 1651,
        "load": 42116,
        "nucleaire": 35794,
        "pompage": -2433,
        "prevision_j": 41700,
        "prevision_j1": 41400,
        "solaire": 13413,
        "taux_co2": 14
      },
      {
        "at": "2026-10-11T12:00:00+00:00",
        "bioenergies": 1010,
        "charbon": 0,
        "ech_physiques": -9353,
        "eolien": 2325,
        "fioul": 37,
        "gaz": 589,
        "hydraulique": 1669,
        "load": 42289,
        "nucleaire": 35688,
        "pompage": -2432,
        "prevision_j": 42000,
        "prevision_j1": 41200,
        "solaire": 13116,
        "taux_co2": 14
      },
      {
        "at": "2026-10-11T12:15:00+00:00",
        "bioenergies": 1012,
        "charbon": 0,
        "ech_physiques": -9396,
        "eolien": 2372,
        "fioul": 37,
        "gaz": 627,
        "hydraulique": 1704,
        "load": 42600,
        "nucleaire": 35906,
        "pompage": -2358,
        "prevision_j": 41900,
        "prevision_j1": 41500,
        "solaire": 12976,
        "taux_co2": 15
      },
      {
        "at": "2026-10-11T12:30:00+00:00",
        "bioenergies": 1014,
        "charbon": 0,
        "ech_physiques": -9456,
        "eolien": 2320,
        "fioul": 37,
        "gaz": 588,
        "hydraulique": 1676,
        "load": 42160,
        "nucleaire": 35877,
        "pompage": -2359,
        "prevision_j": 41800,
        "prevision_j1": 41800,
        "solaire": 12637,
        "taux_co2": 14
      },
      {
        "at": "2026-10-11T12:45:00+00:00",
        "bioenergies": 1015,
        "charbon": 0,
        "ech_physiques": -9073,
        "eolien": 2336,
        "fioul": 37,
        "gaz": 534,
        "hydraulique": 1675,
        "load": 42340,
        "nucleaire": 35933,
        "pompage": -2354,
        "prevision_j": 41600,
        "prevision_j1": 41550,
        "solaire": 12292,
        "taux_co2": 14
      },
      {
        "at": "2026-10-11T13:00:00+00:00",
        "bioenergies": 1015,
        "charbon": 0,
        "ech_physiques": -8700,
        "eolien": 2324,
        "fioul": 36,
        "gaz": 541,
        "hydraulique": 1693,
        "load": 41919,
        "nucleaire": 35841,
        "pompage": -2357,
        "prevision_j": 41400,
        "prevision_j1": 41300,
        "solaire": 11594,
        "taux_co2": 14
      },
      {
        "at": "2026-10-11T13:15:00+00:00",
        "bioenergies": 1017,
        "charbon": 0,
        "ech_physiques": -9102,
        "eolien": 2331,
        "fioul": 37,
        "gaz": 590,
        "hydraulique": 1795,
        "load": 41820,
        "nucleaire": 36463,
        "pompage": -2351,
        "prevision_j": 40650,
        "prevision_j1": 40550,
        "solaire": 11034,
        "taux_co2": 15
      },
      {
        "at": "2026-10-11T13:30:00+00:00",
        "bioenergies": 1017,
        "charbon": 0,
        "ech_physiques": -9083,
        "eolien": 2304,
        "fioul": 36,
        "gaz": 540,
        "hydraulique": 1906,
        "load": 41365,
        "nucleaire": 36679,
        "pompage": -2343,
        "prevision_j": 39900,
        "prevision_j1": 39800,
        "solaire": 10286,
        "taux_co2": 14
      },
      {
        "at": "2026-10-11T13:45:00+00:00",
        "bioenergies": 1013,
        "charbon": 0,
        "ech_physiques": -8963,
        "eolien": 2175,
        "fioul": 37,
        "gaz": 543,
        "hydraulique": 1945,
        "load": 41288,
        "nucleaire": 36659,
        "pompage": -1890,
        "prevision_j": 39950,
        "prevision_j1": 39400,
        "solaire": 9510,
        "taux_co2": 15
      },
      {
        "at": "2026-10-11T14:00:00+00:00",
        "bioenergies": 1011,
        "charbon": 0,
        "ech_physiques": -8584,
        "eolien": 2116,
        "fioul": 36,
        "gaz": 651,
        "hydraulique": 1973,
        "load": 40745,
        "nucleaire": 36596,
        "pompage": -1898,
        "prevision_j": 40000,
        "prevision_j1": 39000,
        "solaire": 8730,
        "taux_co2": 16
      },
      {
        "at": "2026-10-11T14:15:00+00:00",
        "bioenergies": 1014,
        "charbon": 0,
        "ech_physiques": -9308,
        "eolien": 1985,
        "fioul": 37,
        "gaz": 765,
        "hydraulique": 2116,
        "load": 40242,
        "nucleaire": 36971,
        "pompage": -1557,
        "prevision_j": 39750,
        "prevision_j1": 38750,
        "solaire": 8216,
        "taux_co2": 17
      },
      {
        "at": "2026-10-11T14:30:00+00:00",
        "bioenergies": 1015,
        "charbon": 0,
        "ech_physiques": -8873,
        "eolien": 1923,
        "fioul": 36,
        "gaz": 913,
        "hydraulique": 2108,
        "load": 40032,
        "nucleaire": 37101,
        "pompage": -1565,
        "prevision_j": 39500,
        "prevision_j1": 38500,
        "solaire": 7389,
        "taux_co2": 18
      },
      {
        "at": "2026-10-11T14:45:00+00:00",
        "bioenergies": 1015,
        "charbon": 0,
        "ech_physiques": -9903,
        "eolien": 1817,
        "fioul": 37,
        "gaz": 1094,
        "hydraulique": 2136,
        "load": 39498,
        "nucleaire": 37724,
        "pompage": -914,
        "prevision_j": 39250,
        "prevision_j1": 38250,
        "solaire": 6501,
        "taux_co2": 20
      },
      {
        "at": "2026-10-11T15:00:00+00:00",
        "bioenergies": 1014,
        "charbon": 0,
        "ech_physiques": -9713,
        "eolien": 1814,
        "fioul": 37,
        "gaz": 1241,
        "hydraulique": 2278,
        "load": 39153,
        "nucleaire": 37825,
        "pompage": -596,
        "prevision_j": 39000,
        "prevision_j1": 38000,
        "solaire": 5255,
        "taux_co2": 21
      },
      {
        "at": "2026-10-11T15:15:00+00:00",
        "bioenergies": 1014,
        "charbon": 0,
        "ech_physiques": -9241,
        "eolien": 1845,
        "fioul": 36,
        "gaz": 1411,
        "hydraulique": 2506,
        "load": 39304,
        "nucleaire": 37863,
        "pompage": -585,
        "prevision_j": 39200,
        "prevision_j1": 38350,
        "solaire": 4441,
        "taux_co2": 23
      },
      {
        "at": "2026-10-11T15:30:00+00:00",
        "bioenergies": 1012,
        "charbon": 0,
        "ech_physiques": -9634,
        "eolien": 1881,
        "fioul": 37,
        "gaz": 1738,
        "hydraulique": 2838,
        "load": 39583,
        "nucleaire": 37906,
        "pompage": 0,
        "prevision_j": 39400,
        "prevision_j1": 38700,
        "solaire": 3889,
        "taux_co2": 26
      },
      {
        "at": "2026-10-11T15:45:00+00:00",
        "bioenergies": 984,
        "charbon": 0,
        "ech_physiques": -9628,
        "eolien": 1878,
        "fioul": 37,
        "gaz": 1993,
        "hydraulique": 4085,
        "load": 40325,
        "nucleaire": 37916,
        "pompage": 0,
        "prevision_j": 40450,
        "prevision_j1": 39900,
        "solaire": 3166,
        "taux_co2": 27
      },
      {
        "at": "2026-10-11T16:00:00+00:00",
        "bioenergies": 985,
        "charbon": 0,
        "ech_physiques": -9453,
        "eolien": 1762,
        "fioul": 37,
        "gaz": 2454,
        "hydraulique": 4591,
        "load": 40750,
        "nucleaire": 37940,
        "pompage": 0,
        "prevision_j": 41500,
        "prevision_j1": 41100,
        "solaire": 2404,
        "taux_co2": 31
      },
      {
        "at": "2026-10-11T16:15:00+00:00",
        "bioenergies": 986,
        "charbon": 0,
        "ech_physiques": -8538,
        "eolien": 1794,
        "fioul": 36,
        "gaz": 2607,
        "hydraulique": 4986,
        "load": 41825,
        "nucleaire": 38017,
        "pompage": 0,
        "prevision_j": 42250,
        "prevision_j1": 42000,
        "solaire": 1875,
        "taux_co2": 32
      },
      {
        "at": "2026-10-11T16:30:00+00:00",
        "bioenergies": 984,
        "charbon": 0,
        "ech_physiques": -8071,
        "eolien": 1800,
        "fioul": 37,
        "gaz": 2750,
        "hydraulique": 5668,
        "load": 42444,
        "nucleaire": 37981,
        "pompage": 0,
        "prevision_j": 43000,
        "prevision_j1": 42900,
        "solaire": 1251,
        "taux_co2": 34
      },
      {
        "at": "2026-10-11T16:45:00+00:00",
        "bioenergies": 981,
        "charbon": 0,
        "ech_physiques": -8596,
        "eolien": 1809,
        "fioul": 37,
        "gaz": 3057,
        "hydraulique": 7324,
        "load": 43512,
        "nucleaire": 37983,
        "pompage": 0,
        "prevision_j": 44100,
        "prevision_j1": 44150,
        "solaire": 867,
        "taux_co2": 35
      },
      {
        "at": "2026-10-11T17:00:00+00:00",
        "bioenergies": 983,
        "charbon": 0,
        "ech_physiques": -7768,
        "eolien": 1912,
        "fioul": 37,
        "gaz": 3313,
        "hydraulique": 7533,
        "load": 44870,
        "nucleaire": 37988,
        "pompage": 0,
        "prevision_j": 45200,
        "prevision_j1": 45400,
        "solaire": 559,
        "taux_co2": 37
      },
      {
        "at": "2026-10-11T17:15:00+00:00",
        "bioenergies": 989,
        "charbon": 0,
        "ech_physiques": -6307,
        "eolien": 1844,
        "fioul": 36,
        "gaz": 3377,
        "hydraulique": 7641,
        "load": 46050,
        "nucleaire": 37991,
        "pompage": 0,
        "prevision_j": 45850,
        "prevision_j1": 46200,
        "solaire": 380,
        "taux_co2": 38
      },
      {
        "at": "2026-10-11T17:30:00+00:00",
        "bioenergies": 1005,
        "charbon": 0,
        "ech_physiques": -5990,
        "eolien": 1914,
        "fioul": 37,
        "gaz": 3424,
        "hydraulique": 7539,
        "load": 46421,
        "nucleaire": 37990,
        "pompage": 0,
        "prevision_j": 46500,
        "prevision_j1": 47000,
        "solaire": 219,
        "taux_co2": 38
      },
      {
        "at": "2026-10-11T17:45:00+00:00",
        "bioenergies": 1000,
        "charbon": 0,
        "ech_physiques": -5438,
        "eolien": 2083,
        "fioul": 37,
        "gaz": 3500,
        "hydraulique": 6838,
        "load": 46537,
        "nucleaire": 38008,
        "pompage": 0,
        "prevision_j": 46150,
        "prevision_j1": 46600,
        "solaire": 193,
        "taux_co2": 39
      },
      {
        "at": "2026-10-11T18:00:00+00:00",
        "bioenergies": 988,
        "charbon": 0,
        "ech_physiques": -5976,
        "eolien": 2273,
        "fioul": 37,
        "gaz": 3501,
        "hydraulique": 6514,
        "load": 45829,
        "nucleaire": 38020,
        "pompage": 0,
        "prevision_j": 45800,
        "prevision_j1": 46200,
        "solaire": 190,
        "taux_co2": 39
      },
      {
        "at": "2026-10-11T18:15:00+00:00",
        "bioenergies": 988,
        "charbon": 0,
        "ech_physiques": -6674,
        "eolien": 2327,
        "fioul": 36,
        "gaz": 3481,
        "hydraulique": 6687,
        "load": 45135,
        "nucleaire": 38020,
        "pompage": 0,
        "prevision_j": 45050,
        "prevision_j1": 45350,
        "solaire": 0,
        "taux_co2": 39
      },
      {
        "at": "2026-10-11T18:30:00+00:00",
        "bioenergies": 987,
        "charbon": 0,
        "ech_physiques": -7084,
        "eolien": 2396,
        "fioul": 36,
        "gaz": 3470,
        "hydraulique": 6347,
        "load": 44407,
        "nucleaire": 38033,
        "pompage": 0,
        "prevision_j": 44300,
        "prevision_j1": 44500,
        "solaire": 0,
        "taux_co2": 39
      },
      {
        "at": "2026-10-11T18:45:00+00:00",
        "bioenergies": 990,
        "charbon": 0,
        "ech_physiques": -7280,
        "eolien": 2426,
        "fioul": 37,
        "gaz": 3527,
        "hydraulique": 5904,
        "load": 43664,
        "nucleaire": 38033,
        "pompage": 0,
        "prevision_j": 43750,
        "prevision_j1": 43900,
        "solaire": 0,
        "taux_co2": 40
      },
      {
        "at": "2026-10-11T19:00:00+00:00",
        "bioenergies": 987,
        "charbon": 0,
        "ech_physiques": -7547,
        "eolien": 2524,
        "fioul": 36,
        "gaz": 3461,
        "hydraulique": 5698,
        "load": 43202,
        "nucleaire": 38067,
        "pompage": 0,
        "prevision_j": 43200,
        "prevision_j1": 43300,
        "solaire": 0,
        "taux_co2": 39
      },
      {
        "at": "2026-10-11T19:15:00+00:00",
        "bioenergies": 984,
        "charbon": 0,
        "ech_physiques": -7535,
        "eolien": 2574,
        "fioul": 37,
        "gaz": 3468,
        "hydraulique": 5236,
        "load": 42791,
        "nucleaire": 38060,
        "pompage": -29,
        "prevision_j": 42800,
        "prevision_j1": 42850,
        "solaire": 0,
        "taux_co2": 40
      },
      {
        "at": "2026-10-11T19:30:00+00:00",
        "bioenergies": 987,
        "charbon": 0,
        "ech_physiques": -7381,
        "eolien": 2596,
        "fioul": 36,
        "gaz": 3504,
        "hydraulique": 4483,
        "load": 42257,
        "nucleaire": 38075,
        "pompage": -33,
        "prevision_j": 42400,
        "prevision_j1": 42400,
        "solaire": 0,
        "taux_co2": 40
      },
      {
        "at": "2026-10-11T19:45:00+00:00",
        "bioenergies": 994,
        "charbon": 0,
        "ech_physiques": -7594,
        "eolien": 2597,
        "fioul": 37,
        "gaz": 3526,
        "hydraulique": 4014,
        "load": 41663,
        "nucleaire": 38192,
        "pompage": -44,
        "prevision_j": 41750,
        "prevision_j1": 41700,
        "solaire": 0,
        "taux_co2": 41
      },
      {
        "at": "2026-10-11T20:00:00+00:00",
        "bioenergies": 1010,
        "charbon": 0,
        "ech_physiques": -8212,
        "eolien": 2672,
        "fioul": 37,
        "gaz": 3453,
        "hydraulique": 3943,
        "load": 41048,
        "nucleaire": 38222,
        "pompage": -42,
        "prevision_j": 41100,
        "prevision_j1": 41000,
        "solaire": 0,
        "taux_co2": 41
      },
      {
        "at": "2026-10-11T20:15:00+00:00",
        "bioenergies": 1011,
        "charbon": 0,
        "ech_physiques": -7973,
        "eolien": 2736,
        "fioul": 37,
        "gaz": 3480,
        "hydraulique": 4087,
        "load": 41591,
        "nucleaire": 38266,
        "pompage": -47,
        "prevision_j": 41700,
        "prevision_j1": 41500,
        "solaire": 0,
        "taux_co2": 41
      },
      {
        "at": "2026-10-11T20:30:00+00:00",
        "bioenergies": 1005,
        "charbon": 0,
        "ech_physiques": -7531,
        "eolien": 2787,
        "fioul": 36,
        "gaz": 3529,
        "hydraulique": 3763,
        "load": 41847,
        "nucleaire": 38310,
        "pompage": 0,
        "prevision_j": 42300,
        "prevision_j1": 42000,
        "solaire": 0,
        "taux_co2": 41
      },
      {
        "at": "2026-10-11T20:45:00+00:00",
        "bioenergies": 1007,
        "charbon": 0,
        "ech_physiques": -6689,
        "eolien": 2770,
        "fioul": 36,
        "gaz": 3550,
        "hydraulique": 3777,
        "load": 42769,
        "nucleaire": 38324,
        "pompage": 0,
        "prevision_j": 42900,
        "prevision_j1": 42550,
        "solaire": 0,
        "taux_co2": 41
      },
      {
        "at": "2026-10-11T21:00:00+00:00",
        "bioenergies": 1010,
        "charbon": 0,
        "ech_physiques": -6782,
        "eolien": 2798,
        "fioul": 36,
        "gaz": 3519,
        "hydraulique": 3401,
        "load": 42307,
        "nucleaire": 38339,
        "pompage": -1,
        "prevision_j": 43500,
        "prevision_j1": 43100,
        "solaire": 0,
        "taux_co2": 41
      },
      {
        "at": "2026-10-11T21:15:00+00:00",
        "bioenergies": 1013,
        "charbon": 0,
        "ech_physiques": -7156,
        "eolien": 2855,
        "fioul": 37,
        "gaz": 3459,
        "hydraulique": 3320,
        "load": 41834,
        "nucleaire": 38385,
        "pompage": 0,
        "prevision_j": 43100,
        "prevision_j1": 42800,
        "solaire": 0,
        "taux_co2": 41
      },
      {
        "at": "2026-10-11T21:30:00+00:00",
        "bioenergies": 1016,
        "charbon": 0,
        "ech_physiques": -7014,
        "eolien": 2915,
        "fioul": 36,
        "gaz": 3443,
        "hydraulique": 2856,
        "load": 41684,
        "nucleaire": 38471,
        "pompage": -1,
        "prevision_j": 42700,
        "prevision_j1": 42500,
        "solaire": 0,
        "taux_co2": 41
      },
      {
        "at": "2026-10-11T21:45:00+00:00",
        "bioenergies": 1015,
        "charbon": 0,
        "ech_physiques": -6893,
        "eolien": 2957,
        "fioul": 37,
        "gaz": 3399,
        "hydraulique": 2880,
        "load": 41827,
        "nucleaire": 38486,
        "pompage": 0,
        "prevision_j": 42200,
        "prevision_j1": 41900,
        "solaire": 0,
        "taux_co2": 41
      },
      {
        "at": "2026-10-11T22:00:00+00:00",
        "bioenergies": 1017,
        "charbon": 0,
        "ech_physiques": -7126,
        "eolien": 3023,
        "fioul": 37,
        "gaz": 3266,
        "hydraulique": 2856,
        "load": 41397,
        "nucleaire": 38502,
        "pompage": 0,
        "prevision_j": 41700,
        "prevision_j1": 41300,
        "solaire": 0,
        "taux_co2": 40
      },
      {
        "at": "2026-10-11T22:15:00+00:00",
        "bioenergies": 1021,
        "charbon": 0,
        "ech_physiques": -7074,
        "eolien": 3137,
        "fioul": 36,
        "gaz": 2804,
        "hydraulique": 2784,
        "load": 41266,
        "nucleaire": 38575,
        "pompage": -12,
        "prevision_j": 40800,
        "prevision_j1": 40600,
        "solaire": 0,
        "taux_co2": 36
      },
      {
        "at": "2026-10-11T22:30:00+00:00",
        "bioenergies": 1021,
        "charbon": 0,
        "ech_physiques": -7512,
        "eolien": 3235,
        "fioul": 36,
        "gaz": 2397,
        "hydraulique": 2705,
        "load": 40417,
        "nucleaire": 38609,
        "pompage": -8,
        "prevision_j": 39900,
        "prevision_j1": 39900,
        "solaire": 0,
        "taux_co2": 32
      },
      {
        "at": "2026-10-11T22:45:00+00:00",
        "bioenergies": 1018,
        "charbon": 0,
        "ech_physiques": -8093,
        "eolien": 3283,
        "fioul": 37,
        "gaz": 1713,
        "hydraulique": 2532,
        "load": 39069,
        "nucleaire": 38638,
        "pompage": -44,
        "prevision_j": 39050,
        "prevision_j1": 39050,
        "solaire": 0,
        "taux_co2": 27
      },
      {
        "at": "2026-10-11T23:00:00+00:00",
        "bioenergies": 1019,
        "charbon": 0,
        "ech_physiques": -8000,
        "eolien": 3362,
        "fioul": 37,
        "gaz": 1425,
        "hydraulique": 2423,
        "load": 38862,
        "nucleaire": 38682,
        "pompage": -44,
        "prevision_j": 38200,
        "prevision_j1": 38200,
        "solaire": 0,
        "taux_co2": 24
      },
      {
        "at": "2026-10-11T23:15:00+00:00",
        "bioenergies": 1022,
        "charbon": 0,
        "ech_physiques": -7805,
        "eolien": 3401,
        "fioul": 36,
        "gaz": 1426,
        "hydraulique": 2340,
        "load": 39056,
        "nucleaire": 38691,
        "pompage": -53,
        "prevision_j": 38400,
        "prevision_j1": 38400,
        "solaire": 0,
        "taux_co2": 24
      }
    ]
  },
  "metrics": [
    {
      "as_of": "2026-10-02",
      "change": -3.186,
      "comparison": "sur 1 semaine",
      "detail": "",
      "id": "oil_crude",
      "label": "Stocks commerciaux de brut",
      "sector": "oil",
      "source": "EIA WPSR",
      "unit": "M bbl",
      "url": "https://www.eia.gov/petroleum/supply/weekly/",
      "value": 424.134
    },
    {
      "as_of": "2026-10-02",
      "change": 0.444,
      "comparison": "sur 1 semaine",
      "detail": "",
      "id": "oil_cushing",
      "label": "Stocks de Cushing",
      "sector": "oil",
      "source": "EIA WPSR",
      "unit": "M bbl",
      "url": "https://www.eia.gov/petroleum/supply/weekly/",
      "value": 24.745
    },
    {
      "as_of": "2026-10-02",
      "change": -3.898,
      "comparison": "sur 1 semaine",
      "detail": "",
      "id": "oil_gulf",
      "label": "Stocks de brut Gulf Coast",
      "sector": "oil",
      "source": "EIA WPSR",
      "unit": "M bbl",
      "url": "https://www.eia.gov/petroleum/supply/weekly/",
      "value": 243.599
    },
    {
      "as_of": "2026-10-02",
      "change": 0.382,
      "comparison": "sur 1 semaine",
      "detail": "",
      "id": "oil_gasoline",
      "label": "Stocks d’essence",
      "sector": "oil",
      "source": "EIA WPSR",
      "unit": "M bbl",
      "url": "https://www.eia.gov/petroleum/supply/weekly/",
      "value": 204.744
    },
    {
      "as_of": "2026-10-02",
      "change": -0.042,
      "comparison": "sur 1 semaine",
      "detail": "",
      "id": "oil_distillate",
      "label": "Stocks de distillats",
      "sector": "oil",
      "source": "EIA WPSR",
      "unit": "M bbl",
      "url": "https://www.eia.gov/petroleum/supply/weekly/",
      "value": 105.138
    },
    {
      "as_of": "2026-10-02",
      "change": -1.108,
      "comparison": "sur 1 semaine",
      "detail": "",
      "id": "oil_jet",
      "label": "Stocks de jet fuel",
      "sector": "oil",
      "source": "EIA WPSR",
      "unit": "M bbl",
      "url": "https://www.eia.gov/petroleum/supply/weekly/",
      "value": 42.504
    },
    {
      "as_of": "2026-10-02",
      "change": -0.784,
      "comparison": "sur 1 semaine",
      "detail": "",
      "id": "oil_spr",
      "label": "Réserve stratégique US",
      "sector": "oil",
      "source": "EIA WPSR",
      "unit": "M bbl",
      "url": "https://www.eia.gov/petroleum/supply/weekly/",
      "value": 282.983
    },
    {
      "as_of": "2026-10-02",
      "change": 85.0,
      "comparison": "sur 1 semaine",
      "detail": "+2.0 % vs moyenne 5 ans",
      "id": "gas_us",
      "label": "Stockage de gaz US · Lower 48",
      "sector": "gas",
      "source": "EIA WNGSR",
      "unit": "Bcf",
      "url": "https://ir.eia.gov/ngs/ngs.html",
      "value": 3500.0
    },
    {
      "as_of": "2026-10-02",
      "change": 22.0,
      "comparison": "sur 1 semaine",
      "detail": "+3.7 % vs moyenne 5 ans",
      "id": "gas_east",
      "label": "Stockage gaz · East US",
      "sector": "gas",
      "source": "EIA WNGSR",
      "unit": "Bcf",
      "url": "https://ir.eia.gov/ngs/ngs.html",
      "value": 862.0
    },
    {
      "as_of": "2026-10-02",
      "change": 26.0,
      "comparison": "sur 1 semaine",
      "detail": "+2.3 % vs moyenne 5 ans",
      "id": "gas_midwest",
      "label": "Stockage gaz · Midwest US",
      "sector": "gas",
      "source": "EIA WNGSR",
      "unit": "Bcf",
      "url": "https://ir.eia.gov/ngs/ngs.html",
      "value": 1010.0
    },
    {
      "as_of": "2026-10-02",
      "change": 28.0,
      "comparison": "sur 1 semaine",
      "detail": "-2.3 % vs moyenne 5 ans",
      "id": "gas_south",
      "label": "Stockage gaz · South Central US",
      "sector": "gas",
      "source": "EIA WNGSR",
      "unit": "Bcf",
      "url": "https://ir.eia.gov/ngs/ngs.html",
      "value": 1076.0
    },
    {
      "as_of": "2025",
      "change": null,
      "comparison": "estimation annuelle",
      "detail": "Repère structurel, pas un stock LME",
      "id": "metal_copper",
      "label": "Production minière cuivre · monde",
      "sector": "metals",
      "source": "USGS MCS 2026",
      "unit": "Mt",
      "url": "https://pubs.usgs.gov/periodicals/mcs2026/mcs2026-copper.pdf",
      "value": 23
    },
    {
      "as_of": "2026-10-02",
      "change": 0.024,
      "comparison": "sur 1 semaine",
      "detail": "Débit quotidien moyen de la semaine",
      "id": "oil_production",
      "label": "Production de brut US",
      "sector": "oil",
      "source": "EIA WPSR",
      "unit": "M bbl/j",
      "url": "https://www.eia.gov/petroleum/supply/weekly/",
      "value": 13.979
    },
    {
      "as_of": "2026-10-02",
      "change": 1.142,
      "comparison": "sur 1 semaine",
      "detail": "Débit quotidien moyen de la semaine",
      "id": "oil_imports",
      "label": "Importations de brut US",
      "sector": "oil",
      "source": "EIA WPSR",
      "unit": "M bbl/j",
      "url": "https://www.eia.gov/petroleum/supply/weekly/",
      "value": 6.84
    },
    {
      "as_of": "2026-10-02",
      "change": 1.195,
      "comparison": "sur 1 semaine",
      "detail": "Débit quotidien moyen de la semaine",
      "id": "oil_exports",
      "label": "Exportations de brut US",
      "sector": "oil",
      "source": "EIA WPSR",
      "unit": "M bbl/j",
      "url": "https://www.eia.gov/petroleum/supply/weekly/",
      "value": 4.765
    },
    {
      "as_of": "2026-10-02",
      "change": 0.223,
      "comparison": "sur 1 semaine",
      "detail": "Débit quotidien moyen de la semaine",
      "id": "oil_refinery",
      "label": "Brut traité par les raffineries US",
      "sector": "oil",
      "source": "EIA WPSR",
      "unit": "M bbl/j",
      "url": "https://www.eia.gov/petroleum/supply/weekly/",
      "value": 16.48
    },
    {
      "as_of": "2026-10",
      "change": 234.0,
      "comparison": "vs rapport précédent",
      "detail": "Prévision de campagne, révisable",
      "id": "ag_corn_output",
      "label": "Production maïs US",
      "sector": "agri",
      "source": "USDA WASDE",
      "unit": "M bu",
      "url": "https://www.usda.gov/oce/commodity/wasde/wasde1026.txt",
      "value": 16034.0
    },
    {
      "as_of": "2026-10",
      "change": 282.0,
      "comparison": "vs rapport précédent",
      "detail": "Prévision de campagne, révisable",
      "id": "ag_corn_stocks",
      "label": "Stocks finaux maïs US",
      "sector": "agri",
      "source": "USDA WASDE",
      "unit": "M bu",
      "url": "https://www.usda.gov/oce/commodity/wasde/wasde1026.txt",
      "value": 1849.0
    },
    {
      "as_of": "2026-10",
      "change": 25.0,
      "comparison": "vs rapport précédent",
      "detail": "Prévision de campagne, révisable",
      "id": "ag_corn_exports",
      "label": "Exportations prévues maïs US",
      "sector": "agri",
      "source": "USDA WASDE",
      "unit": "M bu",
      "url": "https://www.usda.gov/oce/commodity/wasde/wasde1026.txt",
      "value": 3300.0
    },
    {
      "as_of": "2026-10",
      "change": 27.0,
      "comparison": "vs rapport précédent",
      "detail": "Prévision de campagne, révisable",
      "id": "ag_soy_output",
      "label": "Production soja US",
      "sector": "agri",
      "source": "USDA WASDE",
      "unit": "M bu",
      "url": "https://www.usda.gov/oce/commodity/wasde/wasde1026.txt",
      "value": 4562.0
    },
    {
      "as_of": "2026-10",
      "change": 5.0,
      "comparison": "vs rapport précédent",
      "detail": "Prévision de campagne, révisable",
      "id": "ag_soy_stocks",
      "label": "Stocks finaux soja US",
      "sector": "agri",
      "source": "USDA WASDE",
      "unit": "M bu",
      "url": "https://www.usda.gov/oce/commodity/wasde/wasde1026.txt",
      "value": 315.0
    },
    {
      "as_of": "2026-10",
      "change": 10.0,
      "comparison": "vs rapport précédent",
      "detail": "Prévision de campagne, révisable",
      "id": "ag_soy_exports",
      "label": "Exportations prévues soja US",
      "sector": "agri",
      "source": "USDA WASDE",
      "unit": "M bu",
      "url": "https://www.usda.gov/oce/commodity/wasde/wasde1026.txt",
      "value": 1695.0
    },
    {
      "as_of": "2026-10",
      "change": 8.34,
      "comparison": "vs rapport précédent",
      "detail": "Prévision de campagne, révisable",
      "id": "ag_world_corn",
      "label": "Stocks mondiaux de maïs",
      "sector": "agri",
      "source": "USDA WASDE",
      "unit": "Mt",
      "url": "https://www.usda.gov/oce/commodity/wasde/wasde1026.txt",
      "value": 280.44
    },
    {
      "as_of": "2026-10",
      "change": -0.25,
      "comparison": "vs rapport précédent",
      "detail": "Prévision de campagne, révisable",
      "id": "ag_world_wheat",
      "label": "Stocks mondiaux de blé",
      "sector": "agri",
      "source": "USDA WASDE",
      "unit": "Mt",
      "url": "https://www.usda.gov/oce/commodity/wasde/wasde1026.txt",
      "value": 276.04
    },
    {
      "as_of": "2026-10",
      "change": -2.8,
      "comparison": "vs rapport précédent",
      "detail": "Prévision de campagne, révisable",
      "id": "ag_world_wheat_trade",
      "label": "Commerce mondial de blé prévu",
      "sector": "agri",
      "source": "USDA WASDE",
      "unit": "Mt",
      "url": "https://www.usda.gov/oce/commodity/wasde/wasde1026.txt",
      "value": 208.97
    },
    {
      "as_of": "2026-08",
      "change": 0.097,
      "comparison": "vs mois précédent",
      "detail": "Pétrole + LGN + condensats ; pas uniquement le Brent",
      "id": "oil_norway_liquids",
      "label": "Production Norvège · pétrole et liquides",
      "sector": "oil",
      "source": "Sodir · provisoire",
      "unit": "M bbl/j",
      "url": "https://www.sodir.no/en/whats-new/news/production-figures/2026/production-figures-august-2026/",
      "value": 2.073
    },
    {
      "as_of": "2026-10-06",
      "change": -0.07,
      "comparison": "vs séance précédente",
      "detail": "Clôture quotidienne publiée avec retard ; pas un future",
      "id": "price_brent",
      "label": "Brent Europe · spot EIA",
      "sector": "oil",
      "source": "EIA · prix spot",
      "unit": "$/bbl",
      "url": "https://www.eia.gov/dnav/pet/pet_pri_spt_s1_d.htm",
      "value": 125.44
    },
    {
      "as_of": "2026-10-06",
      "change": 0.11,
      "comparison": "vs séance précédente",
      "detail": "Clôture quotidienne publiée avec retard ; pas un future",
      "id": "price_wti",
      "label": "WTI Cushing · spot EIA",
      "sector": "oil",
      "source": "EIA · prix spot",
      "unit": "$/bbl",
      "url": "https://www.eia.gov/dnav/pet/pet_pri_spt_s1_d.htm",
      "value": 96.24
    },
    {
      "as_of": "2026-10-06",
      "change": 0.07,
      "comparison": "vs séance précédente",
      "detail": "Clôture quotidienne publiée avec retard ; pas un future",
      "id": "price_henry",
      "label": "Henry Hub · spot EIA",
      "sector": "gas",
      "source": "EIA · prix spot",
      "unit": "$/MMBtu",
      "url": "https://www.eia.gov/dnav/ng/NG_PRI_FUT_S1_D.htm",
      "value": 3.03
    },
    {
      "as_of": "2026-10-11",
      "change": -2210,
      "comparison": "vs ~1 h",
      "detail": "Observation 2026-10-11T23:15:00+00:00 UTC",
      "id": "power_load",
      "label": "Demande France",
      "sector": "power",
      "source": "RTE éCO2mix",
      "unit": "MW",
      "url": "https://opendata.reseaux-energies.fr/explore/dataset/eco2mix-national-tr/",
      "value": 39056
    },
    {
      "as_of": "2026-10-11",
      "change": null,
      "comparison": "export si négatif · import si positif",
      "detail": "Observation 2026-10-11T23:15:00+00:00 UTC",
      "id": "power_exchange",
      "label": "Solde des échanges physiques",
      "sector": "power",
      "source": "RTE éCO2mix",
      "unit": "MW",
      "url": "https://opendata.reseaux-energies.fr/explore/dataset/eco2mix-national-tr/",
      "value": -7805
    },
    {
      "as_of": "2026-10-11",
      "change": null,
      "comparison": "production observée",
      "detail": "Observation 2026-10-11T23:15:00+00:00 UTC",
      "id": "power_nucleaire",
      "label": "Nucléaire",
      "sector": "power",
      "source": "RTE éCO2mix",
      "unit": "MW",
      "url": "https://opendata.reseaux-energies.fr/explore/dataset/eco2mix-national-tr/",
      "value": 38691
    },
    {
      "as_of": "2026-10-11",
      "change": null,
      "comparison": "production observée",
      "detail": "Observation 2026-10-11T23:15:00+00:00 UTC",
      "id": "power_gaz",
      "label": "Gaz électrique",
      "sector": "power",
      "source": "RTE éCO2mix",
      "unit": "MW",
      "url": "https://opendata.reseaux-energies.fr/explore/dataset/eco2mix-national-tr/",
      "value": 1426
    },
    {
      "as_of": "2026-10-11",
      "change": null,
      "comparison": "production observée",
      "detail": "Observation 2026-10-11T23:15:00+00:00 UTC",
      "id": "power_eolien",
      "label": "Éolien",
      "sector": "power",
      "source": "RTE éCO2mix",
      "unit": "MW",
      "url": "https://opendata.reseaux-energies.fr/explore/dataset/eco2mix-national-tr/",
      "value": 3401
    },
    {
      "as_of": "2026-10-11",
      "change": null,
      "comparison": "production observée",
      "detail": "Observation 2026-10-11T23:15:00+00:00 UTC",
      "id": "power_solaire",
      "label": "Solaire",
      "sector": "power",
      "source": "RTE éCO2mix",
      "unit": "MW",
      "url": "https://opendata.reseaux-energies.fr/explore/dataset/eco2mix-national-tr/",
      "value": 0
    },
    {
      "as_of": "2026-10-11",
      "change": null,
      "comparison": "production observée",
      "detail": "Observation 2026-10-11T23:15:00+00:00 UTC",
      "id": "power_hydraulique",
      "label": "Hydraulique",
      "sector": "power",
      "source": "RTE éCO2mix",
      "unit": "MW",
      "url": "https://opendata.reseaux-energies.fr/explore/dataset/eco2mix-national-tr/",
      "value": 2340
    },
    {
      "as_of": "2026-10-11",
      "change": null,
      "comparison": "production observée",
      "detail": "Observation 2026-10-11T23:15:00+00:00 UTC",
      "id": "power_bioenergies",
      "label": "Bioénergies",
      "sector": "power",
      "source": "RTE éCO2mix",
      "unit": "MW",
      "url": "https://opendata.reseaux-energies.fr/explore/dataset/eco2mix-national-tr/",
      "value": 1022
    },
    {
      "as_of": "2026-10-11",
      "change": null,
      "comparison": "demande − éolien − solaire",
      "detail": "Calcul indicatif, sans jugement sur le prix ni l'appel au gaz. Observation 2026-10-11T23:15:00+00:00 UTC",
      "id": "power_residual",
      "label": "Demande résiduelle indicative",
      "sector": "power",
      "source": "Calcul sur RTE éCO2mix",
      "unit": "MW",
      "url": "https://opendata.reseaux-energies.fr/explore/dataset/eco2mix-national-tr/",
      "value": 35655
    },
    {
      "as_of": "2026-10-11",
      "change": null,
      "comparison": "production française",
      "detail": "Observation 2026-10-11T23:15:00+00:00 UTC",
      "id": "power_carbon",
      "label": "Intensité CO₂ estimée",
      "sector": "power",
      "source": "RTE éCO2mix",
      "unit": "g/kWh",
      "url": "https://opendata.reseaux-energies.fr/explore/dataset/eco2mix-national-tr/",
      "value": 24
    },
    {
      "as_of": "2026-10-11",
      "change": null,
      "comparison": "réalisé − prévision réactualisée le jour même",
      "detail": "Observation 2026-10-11T23:15:00+00:00 UTC",
      "id": "power_load_gap",
      "label": "Écart à prévision de demande J",
      "sector": "power",
      "source": "Calcul sur RTE éCO2mix",
      "unit": "MW",
      "url": "https://opendata.reseaux-energies.fr/explore/dataset/eco2mix-national-tr/",
      "value": 656
    },
    {
      "as_of": "2026-10-11",
      "change": 0.16,
      "comparison": "points vs veille",
      "detail": "Estimé par les opérateurs",
      "id": "gas_eu",
      "label": "Stockage gaz UE · remplissage",
      "sector": "gas",
      "source": "GIE AGSI+",
      "unit": "%",
      "url": "https://agsi.gie.eu/",
      "value": 73.77
    },
    {
      "as_of": "2026-10-11",
      "change": 1.869,
      "comparison": "vs veille",
      "detail": "Estimé par les opérateurs",
      "id": "gas_eu_twh",
      "label": "Gaz stocké UE",
      "sector": "gas",
      "source": "GIE AGSI+",
      "unit": "TWh",
      "url": "https://agsi.gie.eu/",
      "value": 833.729
    },
    {
      "as_of": "2026-10-11",
      "change": null,
      "comparison": "positif = soutirage ; négatif = injection",
      "detail": "Estimé par les opérateurs",
      "id": "gas_eu_net",
      "label": "Soutirage net UE",
      "sector": "gas",
      "source": "GIE AGSI+",
      "unit": "GWh/j",
      "url": "https://agsi.gie.eu/",
      "value": -1869.0
    },
    {
      "as_of": "2026-10-11",
      "change": 0.3,
      "comparison": "points vs veille",
      "detail": "Estimé par les opérateurs",
      "id": "gas_fr",
      "label": "Stockage gaz France · remplissage",
      "sector": "gas",
      "source": "GIE AGSI+",
      "unit": "%",
      "url": "https://agsi.gie.eu/",
      "value": 87.26
    },
    {
      "as_of": "2026-10-11",
      "change": 0.37,
      "comparison": "vs veille",
      "detail": "Estimé par les opérateurs",
      "id": "gas_fr_twh",
      "label": "Gaz stocké France",
      "sector": "gas",
      "source": "GIE AGSI+",
      "unit": "TWh",
      "url": "https://agsi.gie.eu/",
      "value": 108.094
    },
    {
      "as_of": "2026-10-11",
      "change": null,
      "comparison": "positif = soutirage ; négatif = injection",
      "detail": "Estimé par les opérateurs",
      "id": "gas_fr_net",
      "label": "Soutirage net France",
      "sector": "gas",
      "source": "GIE AGSI+",
      "unit": "GWh/j",
      "url": "https://agsi.gie.eu/",
      "value": -370.5
    },
    {
      "as_of": "2026-10-11",
      "change": 0.0,
      "comparison": "vs veille",
      "detail": "Estimé par les opérateurs",
      "id": "lng_eu_inventory",
      "label": "GNL en cuves UE",
      "sector": "gas",
      "source": "GIE ALSI",
      "unit": "10³ m³ GNL",
      "url": "https://alsi.gie.eu/",
      "value": 4589.71
    },
    {
      "as_of": "2026-10-11",
      "change": 0.0,
      "comparison": "vs veille",
      "detail": "Estimé par les opérateurs",
      "id": "lng_eu_sendout",
      "label": "Émission terminaux GNL UE",
      "sector": "gas",
      "source": "GIE ALSI",
      "unit": "GWh/j",
      "url": "https://alsi.gie.eu/",
      "value": 3290.2
    },
    {
      "as_of": "2026-10-11",
      "change": 0.0,
      "comparison": "vs veille",
      "detail": "Estimé par les opérateurs",
      "id": "lng_fr_inventory",
      "label": "GNL en cuves France",
      "sector": "gas",
      "source": "GIE ALSI",
      "unit": "10³ m³ GNL",
      "url": "https://alsi.gie.eu/",
      "value": 635.68
    },
    {
      "as_of": "2026-10-11",
      "change": 0.0,
      "comparison": "vs veille",
      "detail": "Estimé par les opérateurs",
      "id": "lng_fr_sendout",
      "label": "Émission terminaux GNL France",
      "sector": "gas",
      "source": "GIE ALSI",
      "unit": "GWh/j",
      "url": "https://alsi.gie.eu/",
      "value": 877.6
    },
    {
      "as_of": "2026-10-12",
      "change": null,
      "comparison": "prévision J-1, 24 h glissantes",
      "detail": "Pic prévu à 2026-10-12T17:30:00+00:00 UTC",
      "id": "power_forecast_fr",
      "label": "Pic prévu 24 h · France",
      "sector": "power",
      "source": "ENTSO-E · prévision J-1",
      "unit": "MW",
      "url": "https://transparency.entsoe.eu/",
      "value": 50500
    },
    {
      "as_of": "2026-10-12",
      "change": null,
      "comparison": "prévision J-1, 24 h glissantes",
      "detail": "Pic prévu à 2026-10-12T07:45:00+00:00 UTC",
      "id": "power_forecast_de",
      "label": "Pic prévu 24 h · Allemagne/Luxembourg",
      "sector": "power",
      "source": "ENTSO-E · prévision J-1",
      "unit": "MW",
      "url": "https://transparency.entsoe.eu/",
      "value": 64705
    },
    {
      "as_of": "2026-09-28",
      "change": -9,
      "comparison": "vs même date N−1",
      "detail": "Part des cultures jugées bonnes ou excellentes · 18 États majeurs",
      "id": "ag_corn_condition",
      "label": "Maïs US · bon/excellent",
      "sector": "agri",
      "source": "USDA NASS Crop Progress",
      "unit": "%",
      "url": "https://esmis.nal.usda.gov/sites/default/release-files/796082/prog3926.txt",
      "value": 57
    },
    {
      "as_of": "2026-09-28",
      "change": 0,
      "comparison": "vs moyenne 5 ans",
      "detail": "17 % à la même date N−1 · 13 % semaine précédente",
      "id": "ag_corn_harvest",
      "label": "Maïs US · récolté",
      "sector": "agri",
      "source": "USDA NASS Crop Progress",
      "unit": "%",
      "url": "https://esmis.nal.usda.gov/sites/default/release-files/796082/prog3926.txt",
      "value": 18
    },
    {
      "as_of": "2026-09-28",
      "change": -4,
      "comparison": "vs même date N−1",
      "detail": "Part des cultures jugées bonnes ou excellentes · 18 États majeurs",
      "id": "ag_soy_condition",
      "label": "Soja US · bon/excellent",
      "sector": "agri",
      "source": "USDA NASS Crop Progress",
      "unit": "%",
      "url": "https://esmis.nal.usda.gov/sites/default/release-files/796082/prog3926.txt",
      "value": 58
    },
    {
      "as_of": "2026-09-28",
      "change": 0,
      "comparison": "vs moyenne 5 ans",
      "detail": "18 % à la même date N−1 · 12 % semaine précédente",
      "id": "ag_soy_harvest",
      "label": "Soja US · récolté",
      "sector": "agri",
      "source": "USDA NASS Crop Progress",
      "unit": "%",
      "url": "https://esmis.nal.usda.gov/sites/default/release-files/796082/prog3926.txt",
      "value": 17
    },
    {
      "as_of": "2025",
      "change": 1.2,
      "comparison": "vs 2024",
      "detail": "Production annuelle estimée ; 2024 : 72,8 Mt. Pas un stock LME",
      "id": "metal_aluminum",
      "label": "Aluminium primaire · monde",
      "sector": "metals",
      "source": "USGS MCS 2026",
      "unit": "Mt",
      "url": "https://pubs.usgs.gov/periodicals/mcs2026/mcs2026-aluminum.pdf",
      "value": 74
    }
  ],
  "schema": 3,
  "sources": {
    "alsi": {
      "as_of": "2026-10-11",
      "checked_at": "2026-10-11T23:40:05+00:00",
      "status": "ok",
      "url": "https://alsi.gie.eu/"
    },
    "alsi_fr": {
      "as_of": "2026-10-11",
      "checked_at": "2026-10-11T23:40:05+00:00",
      "status": "ok",
      "url": "https://alsi.gie.eu/"
    },
    "brent": {
      "as_of": "2026-10-06",
      "checked_at": "2026-10-11T23:40:05+00:00",
      "status": "ok",
      "url": "https://www.eia.gov/dnav/pet/pet_pri_spt_s1_d.htm"
    },
    "crop_progress": {
      "as_of": "2026-09-28",
      "checked_at": "2026-10-11T23:40:05+00:00",
      "message": "Dernière donnée conservée ; source indisponible.",
      "status": "error",
      "url": "https://esmis.nal.usda.gov/sites/default/release-files/796082/prog3926.txt"
    },
    "entsoe_de": {
      "as_of": "2026-10-12T07:45:00+00:00",
      "checked_at": "2026-10-11T23:40:05+00:00",
      "status": "ok",
      "url": "https://transparency.entsoe.eu/"
    },
    "entsoe_fr": {
      "as_of": "2026-10-12T17:30:00+00:00",
      "checked_at": "2026-10-11T23:40:05+00:00",
      "status": "ok",
      "url": "https://transparency.entsoe.eu/"
    },
    "gas": {
      "as_of": "2026-10-02",
      "checked_at": "2026-10-11T23:40:05+00:00",
      "status": "ok",
      "url": "https://ir.eia.gov/ngs/ngs.html"
    },
    "gie": {
      "as_of": "2026-10-11",
      "checked_at": "2026-10-11T23:40:05+00:00",
      "status": "ok",
      "url": "https://agsi.gie.eu/"
    },
    "gie_fr": {
      "as_of": "2026-10-11",
      "checked_at": "2026-10-11T23:40:05+00:00",
      "status": "ok",
      "url": "https://agsi.gie.eu/"
    },
    "henry": {
      "as_of": "2026-10-06",
      "checked_at": "2026-10-11T23:40:05+00:00",
      "status": "ok",
      "url": "https://www.eia.gov/dnav/ng/NG_PRI_FUT_S1_D.htm"
    },
    "metals": {
      "as_of": "2025",
      "status": "structural",
      "url": "https://www.lme.com/Market-data/Reports-and-data/Warehouse-and-stocks-reports"
    },
    "news": {
      "as_of": "2026-10-07",
      "checked_at": "2026-10-11T23:40:05+00:00",
      "status": "ok",
      "url": "https://www.eia.gov/rss/todayinenergy.xml"
    },
    "norway": {
      "as_of": "2026-08",
      "message": "Repère mensuel vérifié ; collecte automatique indisponible.",
      "status": "manual",
      "url": "https://www.sodir.no/en/whats-new/news/production-figures/"
    },
    "oil": {
      "as_of": "2026-10-02",
      "checked_at": "2026-10-11T23:40:05+00:00",
      "status": "ok",
      "url": "https://www.eia.gov/petroleum/supply/weekly/"
    },
    "oil_flows": {
      "as_of": "2026-10-02",
      "checked_at": "2026-10-11T23:40:05+00:00",
      "status": "ok",
      "url": "https://www.eia.gov/petroleum/supply/weekly/"
    },
    "oil_history": {
      "as_of": "2026-10-02",
      "checked_at": "2026-10-11T23:40:05+00:00",
      "published": "2026-10-07",
      "status": "ok",
      "url": "https://www.eia.gov/petroleum/supply/weekly/"
    },
    "oil_price_history": {
      "as_of": "2026-10-06",
      "checked_at": "2026-10-11T23:40:05+00:00",
      "provenance": "EIA · miroir datasets/oil-prices",
      "status": "ok",
      "url": "https://github.com/datasets/oil-prices"
    },
    "power_price_de": {
      "as_of": "2026-10-12T21:45:00+00:00",
      "checked_at": "2026-10-11T23:40:05+00:00",
      "licence": "CC BY 4.0 (creativecommons.org/licenses/by/4.0) from Bundesnetzagentur | SMARD.de",
      "provenance": "Fraunhofer ISE Energy-Charts · day-ahead",
      "status": "ok",
      "url": "https://www.energy-charts.info/charts/price_spot_market/chart.htm?c=DE"
    },
    "power_price_fr": {
      "as_of": "2026-10-12T21:45:00+00:00",
      "checked_at": "2026-10-11T23:40:05+00:00",
      "licence": "CC BY 4.0 (creativecommons.org/licenses/by/4.0) from Bundesnetzagentur | SMARD.de",
      "provenance": "Fraunhofer ISE Energy-Charts · day-ahead",
      "status": "ok",
      "url": "https://www.energy-charts.info/charts/price_spot_market/chart.htm?c=FR"
    },
    "rte_power": {
      "as_of": "2026-10-11T23:15:00+00:00",
      "checked_at": "2026-10-11T23:40:05+00:00",
      "status": "ok",
      "url": "https://opendata.reseaux-energies.fr/explore/dataset/eco2mix-national-tr/"
    },
    "wasde": {
      "as_of": "2026-10",
      "checked_at": "2026-10-11T23:40:05+00:00",
      "message": "Dernière donnée conservée ; source indisponible.",
      "status": "error",
      "url": "https://www.usda.gov/oce/commodity/wasde/wasde1026.txt"
    },
    "wti": {
      "as_of": "2026-10-06",
      "checked_at": "2026-10-11T23:40:05+00:00",
      "status": "ok",
      "url": "https://www.eia.gov/dnav/pet/pet_pri_spt_s1_d.htm"
    }
  },
  "stories": [
    {
      "date": "2026-10-07",
      "source": "EIA · Today in Energy",
      "summary": "We expect energy expenditures this winter to vary because of diverging trends in energy prices among fuels and regional variation in forecast temperatures. We expect that lower prices for natural gas and propane will drive decreases in expenditures this year f",
      "title": "Mixed outlook for energy expenditures this winter",
      "url": "https://www.eia.gov/todayinenergy/detail.php?id=68264"
    },
    {
      "date": "2026-10-05",
      "source": "EIA · Today in Energy",
      "summary": "Petroleum markets in the third quarter of 2026 (3Q26) were characterized by increasing prices for crude oil and petroleum products amid persistent conflict in the Middle East.",
      "title": "Crude oil prices and refinery margins generally increased throughout the third quarter",
      "url": "https://www.eia.gov/todayinenergy/detail.php?id=68245"
    },
    {
      "date": "2026-10-02",
      "source": "EIA · Today in Energy",
      "summary": "U.S. natural gas production hit an all-time high in July 2026, driven primarily by increased output in the Permian Basin, according to our latest Natural Gas Monthly.",
      "title": "U.S. natural gas production reached a record high in July 2026",
      "url": "https://www.eia.gov/todayinenergy/detail.php?id=68225"
    },
    {
      "date": "2026-10-01",
      "source": "EIA · Today in Energy",
      "summary": "U.S. propane exports increased to 2 million barrels per day (b/d) in the first half of 2026, 11% more than during the same period in 2025. Increased U.S. propane production and changing trade flows, particularly increased exports to India and other countries i",
      "title": "U.S. exports of propane reached records in the first half of 2026",
      "url": "https://www.eia.gov/todayinenergy/detail.php?id=68244"
    },
    {
      "date": "2026-09-30",
      "source": "EIA · Today in Energy",
      "summary": "We estimate light-duty electric vehicles in the United States consumed 8% more electricity during the first six months of 2026 than in the last half of 2025 (2H25) in our Monthly Energy Review, down from the 13-24% growth seen in six-month periods in recent ye",
      "title": "U.S. electricity use for electric vehicles increasing at a slower pace in 2026",
      "url": "https://www.eia.gov/todayinenergy/detail.php?id=68224"
    },
    {
      "date": "2026-09-25",
      "source": "EIA · Today in Energy",
      "summary": "The Henry Hub natural gas spot price averaged $2.93 per million British thermal units from June through August, 6% less than the same period last year. Prices were lower this summer despite exceptionally hot weather that increased electricity demand for air co",
      "title": "Henry Hub natural gas prices this summer were 6% lower than last summer",
      "url": "https://www.eia.gov/todayinenergy/detail.php?id=68204"
    },
    {
      "date": "2026-09-22",
      "source": "EIA · Today in Energy",
      "summary": "Publicly traded companies represent a tiny share of the total number of companies producing crude oil and natural gas in the United States, but they make up a large share of U.S. production. In 2025, publicly traded companies accounted for just 2% of about 12,",
      "title": "Public companies produce most U.S. crude oil and natural gas",
      "url": "https://www.eia.gov/todayinenergy/detail.php?id=68184"
    },
    {
      "date": "2026-09-18",
      "source": "EIA · Today in Energy",
      "summary": "The price of distillate fuel oil, often sold as diesel, is driven by the price of crude oil, retail margins, distribution costs, taxes, and crack spreads, the indicator we use for refining margins. Tight global supplies of distillate fuel oil and elevated crud",
      "title": "What goes into diesel prices?",
      "url": "https://www.eia.gov/todayinenergy/detail.php?id=68164"
    }
  ]
}
</script>
  <script id="power-history-data" type="application/json">
{"schema":1,"source":"RTE éCO2mix national temps réel","url":"https://opendata.reseaux-energies.fr/explore/dataset/eco2mix-national-tr/","quality":"observé provisoire · un relevé par heure UTC","generated_at":"2026-10-11T23:40:05+00:00","first_at":"2026-09-20T07:45:00+00:00","last_at":"2026-10-11T23:15:00+00:00","points":[{"at":"2026-09-20T07:45:00+00:00","load":36025,"nucleaire":29829,"gaz":500,"eolien":2997,"solaire":7923,"hydraulique":1416,"bioenergies":958,"charbon":0,"fioul":33,"ech_physiques":-5492},{"at":"2026-09-20T08:45:00+00:00","load":38871,"nucleaire":29547,"gaz":501,"eolien":2047,"solaire":9922,"hydraulique":1479,"bioenergies":963,"charbon":0,"fioul":35,"ech_physiques":-4670},{"at":"2026-09-20T09:45:00+00:00","load":40689,"nucleaire":28030,"gaz":500,"eolien":1418,"solaire":11731,"hydraulique":1322,"bioenergies":964,"charbon":0,"fioul":33,"ech_physiques":-1268},{"at":"2026-09-20T10:45:00+00:00","load":41846,"nucleaire":28134,"gaz":500,"eolien":1169,"solaire":11673,"hydraulique":1404,"bioenergies":967,"charbon":0,"fioul":33,"ech_physiques":-180},{"at":"2026-09-20T11:45:00+00:00","load":39522,"nucleaire":28324,"gaz":500,"eolien":1148,"solaire":12532,"hydraulique":1323,"bioenergies":970,"charbon":0,"fioul":33,"ech_physiques":-2692},{"at":"2026-09-20T12:45:00+00:00","load":39673,"nucleaire":28790,"gaz":496,"eolien":1150,"solaire":11886,"hydraulique":1260,"bioenergies":967,"charbon":0,"fioul":33,"ech_physiques":-2453},{"at":"2026-09-20T13:45:00+00:00","load":38997,"nucleaire":29659,"gaz":490,"eolien":1176,"solaire":10663,"hydraulique":1338,"bioenergies":967,"charbon":0,"fioul":33,"ech_physiques":-3117},{"at":"2026-09-20T14:45:00+00:00","load":38550,"nucleaire":29922,"gaz":499,"eolien":3321,"solaire":12748,"hydraulique":1861,"bioenergies":968,"charbon":0,"fioul":33,"ech_physiques":-8135},{"at":"2026-09-20T15:45:00+00:00","load":39191,"nucleaire":32201,"gaz":494,"eolien":3292,"solaire":7921,"hydraulique":2192,"bioenergies":961,"charbon":0,"fioul":33,"ech_physiques":-6448},{"at":"2026-09-20T16:45:00+00:00","load":41609,"nucleaire":35421,"gaz":1065,"eolien":2833,"solaire":3218,"hydraulique":3317,"bioenergies":962,"charbon":0,"fioul":34,"ech_physiques":-5214},{"at":"2026-09-20T17:45:00+00:00","load":43046,"nucleaire":35677,"gaz":1476,"eolien":2526,"solaire":538,"hydraulique":5257,"bioenergies":961,"charbon":0,"fioul":37,"ech_physiques":-3837},{"at":"2026-09-20T18:45:00+00:00","load":42371,"nucleaire":35876,"gaz":1496,"eolien":3034,"solaire":218,"hydraulique":5231,"bioenergies":958,"charbon":0,"fioul":35,"ech_physiques":-4801},{"at":"2026-09-20T19:45:00+00:00","load":39936,"nucleaire":36019,"gaz":1501,"eolien":3215,"solaire":0,"hydraulique":3738,"bioenergies":962,"charbon":0,"fioul":35,"ech_physiques":-5423},{"at":"2026-09-20T20:45:00+00:00","load":40364,"nucleaire":36062,"gaz":1544,"eolien":3302,"solaire":0,"hydraulique":4301,"bioenergies":958,"charbon":0,"fioul":35,"ech_physiques":-5378},{"at":"2026-09-20T21:45:00+00:00","load":40445,"nucleaire":37084,"gaz":1626,"eolien":3026,"solaire":0,"hydraulique":3226,"bioenergies":965,"charbon":0,"fioul":35,"ech_physiques":-5522},{"at":"2026-09-20T22:45:00+00:00","load":36809,"nucleaire":37165,"gaz":805,"eolien":2888,"solaire":0,"hydraulique":3217,"bioenergies":967,"charbon":0,"fioul":34,"ech_physiques":-8279},{"at":"2026-09-20T23:45:00+00:00","load":36085,"nucleaire":37180,"gaz":472,"eolien":2925,"solaire":0,"hydraulique":2744,"bioenergies":970,"charbon":0,"fioul":33,"ech_physiques":-8204},{"at":"2026-09-21T00:45:00+00:00","load":33681,"nucleaire":37177,"gaz":485,"eolien":2833,"solaire":0,"hydraulique":2387,"bioenergies":977,"charbon":0,"fioul":35,"ech_physiques":-9920},{"at":"2026-09-21T01:45:00+00:00","load":32352,"nucleaire":37063,"gaz":490,"eolien":2748,"solaire":0,"hydraulique":2247,"bioenergies":973,"charbon":0,"fioul":33,"ech_physiques":-10292},{"at":"2026-09-21T02:45:00+00:00","load":32402,"nucleaire":37190,"gaz":669,"eolien":2690,"solaire":0,"hydraulique":2320,"bioenergies":970,"charbon":0,"fioul":35,"ech_physiques":-11014},{"at":"2026-09-21T03:45:00+00:00","load":35055,"nucleaire":37181,"gaz":1161,"eolien":2449,"solaire":0,"hydraulique":3254,"bioenergies":967,"charbon":0,"fioul":37,"ech_physiques":-9823},{"at":"2026-09-21T04:45:00+00:00","load":39329,"nucleaire":37337,"gaz":2124,"eolien":2342,"solaire":0,"hydraulique":5292,"bioenergies":961,"charbon":0,"fioul":37,"ech_physiques":-8807},{"at":"2026-09-21T05:45:00+00:00","load":43271,"nucleaire":37355,"gaz":3121,"eolien":2397,"solaire":308,"hydraulique":7593,"bioenergies":968,"charbon":0,"fioul":328,"ech_physiques":-9217},{"at":"2026-09-21T06:45:00+00:00","load":44945,"nucleaire":37327,"gaz":3242,"eolien":2420,"solaire":2625,"hydraulique":6133,"bioenergies":968,"charbon":0,"fioul":352,"ech_physiques":-8395},{"at":"2026-09-21T07:45:00+00:00","load":45824,"nucleaire":37233,"gaz":1722,"eolien":1886,"solaire":7401,"hydraulique":4058,"bioenergies":960,"charbon":0,"fioul":37,"ech_physiques":-7454},{"at":"2026-09-21T08:45:00+00:00","load":46549,"nucleaire":37109,"gaz":783,"eolien":1711,"solaire":12802,"hydraulique":2941,"bioenergies":954,"charbon":0,"fioul":37,"ech_physiques":-8394},{"at":"2026-09-21T09:45:00+00:00","load":47199,"nucleaire":36506,"gaz":546,"eolien":1926,"solaire":16583,"hydraulique":2307,"bioenergies":951,"charbon":0,"fioul":36,"ech_physiques":-9798},{"at":"2026-09-21T10:45:00+00:00","load":47489,"nucleaire":34252,"gaz":317,"eolien":2091,"solaire":18601,"hydraulique":2136,"bioenergies":953,"charbon":0,"fioul":37,"ech_physiques":-8913},{"at":"2026-09-21T11:45:00+00:00","load":46132,"nucleaire":34065,"gaz":344,"eolien":2181,"solaire":19160,"hydraulique":2182,"bioenergies":963,"charbon":0,"fioul":37,"ech_physiques":-10590},{"at":"2026-09-21T12:45:00+00:00","load":46737,"nucleaire":33888,"gaz":396,"eolien":2350,"solaire":18198,"hydraulique":2008,"bioenergies":956,"charbon":0,"fioul":37,"ech_physiques":-9050},{"at":"2026-09-21T13:45:00+00:00","load":45306,"nucleaire":34095,"gaz":436,"eolien":2363,"solaire":16845,"hydraulique":1912,"bioenergies":957,"charbon":0,"fioul":36,"ech_physiques":-9548},{"at":"2026-09-21T14:45:00+00:00","load":44917,"nucleaire":35071,"gaz":454,"eolien":2746,"solaire":13709,"hydraulique":2826,"bioenergies":957,"charbon":0,"fioul":36,"ech_physiques":-9507},{"at":"2026-09-21T15:45:00+00:00","load":45056,"nucleaire":36422,"gaz":1591,"eolien":3244,"solaire":8907,"hydraulique":4058,"bioenergies":956,"charbon":0,"fioul":35,"ech_physiques":-10337},{"at":"2026-09-21T16:45:00+00:00","load":47409,"nucleaire":36425,"gaz":3480,"eolien":3655,"solaire":3658,"hydraulique":7569,"bioenergies":959,"charbon":0,"fioul":35,"ech_physiques":-8555},{"at":"2026-09-21T17:45:00+00:00","load":48103,"nucleaire":36371,"gaz":3693,"eolien":3185,"solaire":511,"hydraulique":7716,"bioenergies":956,"charbon":0,"fioul":35,"ech_physiques":-4407},{"at":"2026-09-21T18:45:00+00:00","load":45774,"nucleaire":36321,"gaz":3833,"eolien":3775,"solaire":200,"hydraulique":7623,"bioenergies":956,"charbon":0,"fioul":35,"ech_physiques":-7334},{"at":"2026-09-21T19:45:00+00:00","load":42691,"nucleaire":36812,"gaz":4124,"eolien":4337,"solaire":0,"hydraulique":6996,"bioenergies":959,"charbon":0,"fioul":36,"ech_physiques":-10296},{"at":"2026-09-21T20:45:00+00:00","load":43441,"nucleaire":37196,"gaz":3795,"eolien":4179,"solaire":0,"hydraulique":5451,"bioenergies":958,"charbon":0,"fioul":36,"ech_physiques":-8171},{"at":"2026-09-21T21:45:00+00:00","load":41864,"nucleaire":37296,"gaz":2861,"eolien":4355,"solaire":0,"hydraulique":3767,"bioenergies":962,"charbon":0,"fioul":36,"ech_physiques":-7280},{"at":"2026-09-21T22:45:00+00:00","load":38810,"nucleaire":37315,"gaz":3006,"eolien":4384,"solaire":0,"hydraulique":3451,"bioenergies":958,"charbon":0,"fioul":35,"ech_physiques":-10386},{"at":"2026-09-21T23:45:00+00:00","load":37667,"nucleaire":37369,"gaz":2029,"eolien":4136,"solaire":0,"hydraulique":3211,"bioenergies":964,"charbon":0,"fioul":37,"ech_physiques":-9903},{"at":"2026-09-22T00:45:00+00:00","load":35453,"nucleaire":37416,"gaz":1854,"eolien":4095,"solaire":0,"hydraulique":2846,"bioenergies":959,"charbon":0,"fioul":36,"ech_physiques":-11669},{"at":"2026-09-22T01:45:00+00:00","load":33906,"nucleaire":37353,"gaz":1920,"eolien":3980,"solaire":0,"hydraulique":2924,"bioenergies":942,"charbon":0,"fioul":37,"ech_physiques":-12962},{"at":"2026-09-22T02:45:00+00:00","load":33816,"nucleaire":37515,"gaz":1882,"eolien":3831,"solaire":0,"hydraulique":3044,"bioenergies":945,"charbon":0,"fioul":37,"ech_physiques":-13386},{"at":"2026-09-22T03:45:00+00:00","load":35811,"nucleaire":37554,"gaz":2235,"eolien":3913,"solaire":0,"hydraulique":3647,"bioenergies":947,"charbon":0,"fioul":37,"ech_physiques":-12473},{"at":"2026-09-22T04:45:00+00:00","load":40670,"nucleaire":37556,"gaz":3140,"eolien":3892,"solaire":0,"hydraulique":5623,"bioenergies":942,"charbon":0,"fioul":37,"ech_physiques":-10525},{"at":"2026-09-22T05:45:00+00:00","load":43892,"nucleaire":37581,"gaz":3819,"eolien":3777,"solaire":277,"hydraulique":7845,"bioenergies":940,"charbon":0,"fioul":37,"ech_physiques":-10696},{"at":"2026-09-22T06:45:00+00:00","load":45214,"nucleaire":37549,"gaz":3835,"eolien":3449,"solaire":3026,"hydraulique":6808,"bioenergies":964,"charbon":0,"fioul":36,"ech_physiques":-10803},{"at":"2026-09-22T07:45:00+00:00","load":45921,"nucleaire":37335,"gaz":1798,"eolien":2342,"solaire":8634,"hydraulique":3517,"bioenergies":948,"charbon":0,"fioul":37,"ech_physiques":-8654},{"at":"2026-09-22T08:45:00+00:00","load":46856,"nucleaire":37322,"gaz":506,"eolien":2145,"solaire":14396,"hydraulique":2786,"bioenergies":969,"charbon":0,"fioul":36,"ech_physiques":-9837},{"at":"2026-09-22T09:45:00+00:00","load":47886,"nucleaire":36314,"gaz":285,"eolien":2673,"solaire":18090,"hydraulique":2517,"bioenergies":967,"charbon":0,"fioul":37,"ech_physiques":-10964},{"at":"2026-09-22T10:45:00+00:00","load":48257,"nucleaire":34436,"gaz":284,"eolien":2694,"solaire":19975,"hydraulique":2460,"bioenergies":966,"charbon":0,"fioul":37,"ech_physiques":-10497},{"at":"2026-09-22T11:45:00+00:00","load":46257,"nucleaire":33481,"gaz":282,"eolien":2665,"solaire":20335,"hydraulique":2359,"bioenergies":973,"charbon":0,"fioul":36,"ech_physiques":-11828},{"at":"2026-09-22T12:45:00+00:00","load":46727,"nucleaire":33673,"gaz":287,"eolien":2674,"solaire":19372,"hydraulique":2409,"bioenergies":963,"charbon":0,"fioul":36,"ech_physiques":-10649},{"at":"2026-09-22T13:45:00+00:00","load":46218,"nucleaire":34155,"gaz":281,"eolien":2890,"solaire":18232,"hydraulique":2351,"bioenergies":969,"charbon":0,"fioul":36,"ech_physiques":-10616},{"at":"2026-09-22T14:45:00+00:00","load":45165,"nucleaire":34815,"gaz":438,"eolien":3271,"solaire":15056,"hydraulique":2803,"bioenergies":966,"charbon":0,"fioul":35,"ech_physiques":-10572},{"at":"2026-09-22T15:45:00+00:00","load":45292,"nucleaire":36992,"gaz":1241,"eolien":3743,"solaire":9895,"hydraulique":3710,"bioenergies":971,"charbon":0,"fioul":35,"ech_physiques":-11078},{"at":"2026-09-22T16:45:00+00:00","load":47766,"nucleaire":37417,"gaz":4038,"eolien":3918,"solaire":3978,"hydraulique":7994,"bioenergies":969,"charbon":0,"fioul":906,"ech_physiques":-11820},{"at":"2026-09-22T17:45:00+00:00","load":48151,"nucleaire":37464,"gaz":4280,"eolien":3955,"solaire":494,"hydraulique":8527,"bioenergies":973,"charbon":0,"fioul":920,"ech_physiques":-8463},{"at":"2026-09-22T18:45:00+00:00","load":46077,"nucleaire":37548,"gaz":4397,"eolien":5081,"solaire":190,"hydraulique":7143,"bioenergies":974,"charbon":0,"fioul":683,"ech_physiques":-9865},{"at":"2026-09-22T19:45:00+00:00","load":42530,"nucleaire":37606,"gaz":3933,"eolien":6127,"solaire":0,"hydraulique":5981,"bioenergies":977,"charbon":0,"fioul":161,"ech_physiques":-12212},{"at":"2026-09-22T20:45:00+00:00","load":43536,"nucleaire":37643,"gaz":3645,"eolien":6606,"solaire":0,"hydraulique":6906,"bioenergies":975,"charbon":0,"fioul":33,"ech_physiques":-12278},{"at":"2026-09-22T21:45:00+00:00","load":41579,"nucleaire":38369,"gaz":3623,"eolien":6307,"solaire":0,"hydraulique":4975,"bioenergies":979,"charbon":0,"fioul":33,"ech_physiques":-12705},{"at":"2026-09-22T22:45:00+00:00","load":38570,"nucleaire":38378,"gaz":2994,"eolien":5686,"solaire":0,"hydraulique":4046,"bioenergies":979,"charbon":0,"fioul":34,"ech_physiques":-13602},{"at":"2026-09-22T23:45:00+00:00","load":38069,"nucleaire":38407,"gaz":1616,"eolien":5285,"solaire":0,"hydraulique":3838,"bioenergies":974,"charbon":0,"fioul":36,"ech_physiques":-12043},{"at":"2026-09-23T00:45:00+00:00","load":35455,"nucleaire":38343,"gaz":1356,"eolien":4717,"solaire":0,"hydraulique":3417,"bioenergies":977,"charbon":0,"fioul":37,"ech_physiques":-13078},{"at":"2026-09-23T01:45:00+00:00","load":34011,"nucleaire":38474,"gaz":1626,"eolien":3799,"solaire":0,"hydraulique":3303,"bioenergies":975,"charbon":0,"fioul":37,"ech_physiques":-13875},{"at":"2026-09-23T02:45:00+00:00","load":34140,"nucleaire":38528,"gaz":1474,"eolien":3014,"solaire":0,"hydraulique":3685,"bioenergies":979,"charbon":0,"fioul":37,"ech_physiques":-13275},{"at":"2026-09-23T03:45:00+00:00","load":36016,"nucleaire":38563,"gaz":2426,"eolien":2537,"solaire":0,"hydraulique":3489,"bioenergies":994,"charbon":0,"fioul":37,"ech_physiques":-12037},{"at":"2026-09-23T04:45:00+00:00","load":40459,"nucleaire":38583,"gaz":3667,"eolien":2195,"solaire":0,"hydraulique":5351,"bioenergies":1007,"charbon":0,"fioul":37,"ech_physiques":-10435},{"at":"2026-09-23T05:45:00+00:00","load":43656,"nucleaire":38544,"gaz":3853,"eolien":2018,"solaire":274,"hydraulique":7197,"bioenergies":997,"charbon":0,"fioul":37,"ech_physiques":-9616},{"at":"2026-09-23T06:45:00+00:00","load":45625,"nucleaire":38563,"gaz":3487,"eolien":1847,"solaire":3043,"hydraulique":5813,"bioenergies":1003,"charbon":0,"fioul":37,"ech_physiques":-8204},{"at":"2026-09-23T07:45:00+00:00","load":46280,"nucleaire":38535,"gaz":2419,"eolien":1134,"solaire":8521,"hydraulique":3438,"bioenergies":1005,"charbon":0,"fioul":37,"ech_physiques":-8773},{"at":"2026-09-23T08:45:00+00:00","load":46899,"nucleaire":37905,"gaz":1337,"eolien":858,"solaire":14066,"hydraulique":2444,"bioenergies":1001,"charbon":0,"fioul":37,"ech_physiques":-9564},{"at":"2026-09-23T09:45:00+00:00","load":48382,"nucleaire":37708,"gaz":736,"eolien":756,"solaire":17818,"hydraulique":2288,"bioenergies":1001,"charbon":0,"fioul":37,"ech_physiques":-10311},{"at":"2026-09-23T10:45:00+00:00","load":48871,"nucleaire":36783,"gaz":532,"eolien":916,"solaire":19568,"hydraulique":2204,"bioenergies":1004,"charbon":0,"fioul":36,"ech_physiques":-10224},{"at":"2026-09-23T11:45:00+00:00","load":47556,"nucleaire":35788,"gaz":488,"eolien":988,"solaire":19881,"hydraulique":2107,"bioenergies":1007,"charbon":0,"fioul":36,"ech_physiques":-10415},{"at":"2026-09-23T12:45:00+00:00","load":47942,"nucleaire":36556,"gaz":352,"eolien":1039,"solaire":18799,"hydraulique":1993,"bioenergies":1007,"charbon":0,"fioul":35,"ech_physiques":-10078},{"at":"2026-09-23T13:45:00+00:00","load":47720,"nucleaire":36656,"gaz":462,"eolien":1333,"solaire":17845,"hydraulique":2385,"bioenergies":1002,"charbon":0,"fioul":35,"ech_physiques":-10245},{"at":"2026-09-23T14:45:00+00:00","load":46616,"nucleaire":36587,"gaz":704,"eolien":1883,"solaire":14631,"hydraulique":3477,"bioenergies":1007,"charbon":0,"fioul":35,"ech_physiques":-9714},{"at":"2026-09-23T15:45:00+00:00","load":47107,"nucleaire":37562,"gaz":1693,"eolien":1689,"solaire":9497,"hydraulique":4946,"bioenergies":1002,"charbon":0,"fioul":35,"ech_physiques":-9441},{"at":"2026-09-23T16:45:00+00:00","load":48955,"nucleaire":37737,"gaz":3809,"eolien":1793,"solaire":3639,"hydraulique":7986,"bioenergies":1009,"charbon":0,"fioul":321,"ech_physiques":-7395},{"at":"2026-09-23T17:45:00+00:00","load":48747,"nucleaire":37787,"gaz":4256,"eolien":2104,"solaire":464,"hydraulique":8231,"bioenergies":1007,"charbon":0,"fioul":835,"ech_physiques":-5964},{"at":"2026-09-23T18:45:00+00:00","load":46721,"nucleaire":37830,"gaz":4324,"eolien":2635,"solaire":181,"hydraulique":7749,"bioenergies":1011,"charbon":0,"fioul":44,"ech_physiques":-7444},{"at":"2026-09-23T19:45:00+00:00","load":43540,"nucleaire":37925,"gaz":4143,"eolien":2861,"solaire":0,"hydraulique":5991,"bioenergies":1014,"charbon":0,"fioul":36,"ech_physiques":-8419},{"at":"2026-09-23T20:45:00+00:00","load":44019,"nucleaire":37754,"gaz":3739,"eolien":3008,"solaire":0,"hydraulique":4820,"bioenergies":1010,"charbon":0,"fioul":36,"ech_physiques":-6340},{"at":"2026-09-23T21:45:00+00:00","load":42785,"nucleaire":37077,"gaz":2772,"eolien":3015,"solaire":0,"hydraulique":4208,"bioenergies":1009,"charbon":0,"fioul":36,"ech_physiques":-5322},{"at":"2026-09-23T22:45:00+00:00","load":39596,"nucleaire":37007,"gaz":1864,"eolien":2882,"solaire":0,"hydraulique":4974,"bioenergies":1014,"charbon":0,"fioul":36,"ech_physiques":-8155},{"at":"2026-09-23T23:45:00+00:00","load":38515,"nucleaire":36990,"gaz":1405,"eolien":2916,"solaire":0,"hydraulique":3473,"bioenergies":1019,"charbon":0,"fioul":35,"ech_physiques":-7296},{"at":"2026-09-24T00:45:00+00:00","load":35896,"nucleaire":37014,"gaz":755,"eolien":2804,"solaire":0,"hydraulique":3572,"bioenergies":1017,"charbon":0,"fioul":33,"ech_physiques":-8491},{"at":"2026-09-24T01:45:00+00:00","load":34323,"nucleaire":37046,"gaz":770,"eolien":2608,"solaire":0,"hydraulique":3154,"bioenergies":1015,"charbon":0,"fioul":98,"ech_physiques":-9255},{"at":"2026-09-24T02:45:00+00:00","load":34486,"nucleaire":37102,"gaz":771,"eolien":2309,"solaire":0,"hydraulique":3057,"bioenergies":1003,"charbon":0,"fioul":100,"ech_physiques":-9221},{"at":"2026-09-24T03:45:00+00:00","load":36224,"nucleaire":37095,"gaz":2096,"eolien":1976,"solaire":0,"hydraulique":3299,"bioenergies":999,"charbon":0,"fioul":101,"ech_physiques":-8878},{"at":"2026-09-24T04:45:00+00:00","load":40794,"nucleaire":37123,"gaz":3455,"eolien":1837,"solaire":0,"hydraulique":4266,"bioenergies":999,"charbon":0,"fioul":37,"ech_physiques":-7212},{"at":"2026-09-24T05:45:00+00:00","load":44431,"nucleaire":37127,"gaz":3561,"eolien":1713,"solaire":244,"hydraulique":6792,"bioenergies":1011,"charbon":0,"fioul":36,"ech_physiques":-6402},{"at":"2026-09-24T06:45:00+00:00","load":45971,"nucleaire":37045,"gaz":3559,"eolien":1650,"solaire":2646,"hydraulique":6124,"bioenergies":1011,"charbon":0,"fioul":37,"ech_physiques":-6425},{"at":"2026-09-24T07:45:00+00:00","load":46592,"nucleaire":36785,"gaz":3080,"eolien":1437,"solaire":6864,"hydraulique":3830,"bioenergies":1012,"charbon":0,"fioul":37,"ech_physiques":-6442},{"at":"2026-09-24T08:45:00+00:00","load":47584,"nucleaire":36688,"gaz":1119,"eolien":1008,"solaire":11675,"hydraulique":3055,"bioenergies":1005,"charbon":0,"fioul":37,"ech_physiques":-6455},{"at":"2026-09-24T09:45:00+00:00","load":48081,"nucleaire":36609,"gaz":949,"eolien":742,"solaire":15059,"hydraulique":3419,"bioenergies":1003,"charbon":0,"fioul":36,"ech_physiques":-8173},{"at":"2026-09-24T10:45:00+00:00","load":48795,"nucleaire":36711,"gaz":1059,"eolien":696,"solaire":16915,"hydraulique":3314,"bioenergies":1002,"charbon":0,"fioul":36,"ech_physiques":-8711},{"at":"2026-09-24T11:45:00+00:00","load":48126,"nucleaire":36540,"gaz":390,"eolien":704,"solaire":17300,"hydraulique":2744,"bioenergies":1007,"charbon":0,"fioul":36,"ech_physiques":-8850},{"at":"2026-09-24T12:45:00+00:00","load":48432,"nucleaire":36500,"gaz":681,"eolien":664,"solaire":16316,"hydraulique":2922,"bioenergies":1007,"charbon":0,"fioul":35,"ech_physiques":-7910},{"at":"2026-09-24T13:45:00+00:00","load":47374,"nucleaire":36644,"gaz":978,"eolien":721,"solaire":14582,"hydraulique":3064,"bioenergies":991,"charbon":0,"fioul":35,"ech_physiques":-8126},{"at":"2026-09-24T14:45:00+00:00","load":46801,"nucleaire":36459,"gaz":1104,"eolien":798,"solaire":11859,"hydraulique":3641,"bioenergies":995,"charbon":0,"fioul":35,"ech_physiques":-6931},{"at":"2026-09-24T15:45:00+00:00","load":46573,"nucleaire":36702,"gaz":3428,"eolien":819,"solaire":7614,"hydraulique":4208,"bioenergies":998,"charbon":0,"fioul":35,"ech_physiques":-7375},{"at":"2026-09-24T16:45:00+00:00","load":48474,"nucleaire":36740,"gaz":3878,"eolien":894,"solaire":3060,"hydraulique":6978,"bioenergies":999,"charbon":0,"fioul":35,"ech_physiques":-4107},{"at":"2026-09-24T17:45:00+00:00","load":48724,"nucleaire":36804,"gaz":4345,"eolien":1266,"solaire":435,"hydraulique":8483,"bioenergies":998,"charbon":0,"fioul":35,"ech_physiques":-3963},{"at":"2026-09-24T18:45:00+00:00","load":46471,"nucleaire":36838,"gaz":4641,"eolien":1919,"solaire":189,"hydraulique":7927,"bioenergies":999,"charbon":0,"fioul":35,"ech_physiques":-6351},{"at":"2026-09-24T19:45:00+00:00","load":43271,"nucleaire":36969,"gaz":4617,"eolien":2830,"solaire":0,"hydraulique":6592,"bioenergies":1000,"charbon":0,"fioul":36,"ech_physiques":-8627},{"at":"2026-09-24T20:45:00+00:00","load":44149,"nucleaire":37565,"gaz":4659,"eolien":3394,"solaire":0,"hydraulique":5071,"bioenergies":995,"charbon":0,"fioul":36,"ech_physiques":-7552},{"at":"2026-09-24T21:45:00+00:00","load":42584,"nucleaire":37723,"gaz":3884,"eolien":3723,"solaire":0,"hydraulique":4341,"bioenergies":1008,"charbon":0,"fioul":35,"ech_physiques":-8111},{"at":"2026-09-24T22:45:00+00:00","load":39586,"nucleaire":37852,"gaz":3407,"eolien":3962,"solaire":0,"hydraulique":3615,"bioenergies":997,"charbon":0,"fioul":37,"ech_physiques":-9909},{"at":"2026-09-24T23:45:00+00:00","load":38413,"nucleaire":37866,"gaz":2400,"eolien":4000,"solaire":0,"hydraulique":3058,"bioenergies":1009,"charbon":0,"fioul":36,"ech_physiques":-9858},{"at":"2026-09-25T00:45:00+00:00","load":35758,"nucleaire":37979,"gaz":1597,"eolien":3649,"solaire":0,"hydraulique":2850,"bioenergies":1007,"charbon":0,"fioul":37,"ech_physiques":-11075},{"at":"2026-09-25T01:45:00+00:00","load":34441,"nucleaire":38550,"gaz":1464,"eolien":3355,"solaire":0,"hydraulique":2756,"bioenergies":1008,"charbon":0,"fioul":36,"ech_physiques":-12356},{"at":"2026-09-25T02:45:00+00:00","load":34240,"nucleaire":39125,"gaz":1555,"eolien":3284,"solaire":0,"hydraulique":2797,"bioenergies":1008,"charbon":0,"fioul":37,"ech_physiques":-12678},{"at":"2026-09-25T03:45:00+00:00","load":36409,"nucleaire":39138,"gaz":1957,"eolien":3100,"solaire":0,"hydraulique":2919,"bioenergies":1018,"charbon":0,"fioul":37,"ech_physiques":-11404},{"at":"2026-09-25T04:45:00+00:00","load":40844,"nucleaire":38994,"gaz":3360,"eolien":3142,"solaire":0,"hydraulique":4540,"bioenergies":1007,"charbon":0,"fioul":37,"ech_physiques":-10223},{"at":"2026-09-25T05:45:00+00:00","load":44279,"nucleaire":39191,"gaz":3375,"eolien":3310,"solaire":236,"hydraulique":6806,"bioenergies":1005,"charbon":0,"fioul":37,"ech_physiques":-10068},{"at":"2026-09-25T06:45:00+00:00","load":45702,"nucleaire":38110,"gaz":3399,"eolien":3368,"solaire":2687,"hydraulique":6449,"bioenergies":994,"charbon":0,"fioul":36,"ech_physiques":-9449},{"at":"2026-09-25T07:45:00+00:00","load":46235,"nucleaire":38047,"gaz":1361,"eolien":2345,"solaire":8074,"hydraulique":4052,"bioenergies":1007,"charbon":0,"fioul":37,"ech_physiques":-8541},{"at":"2026-09-25T08:45:00+00:00","load":47507,"nucleaire":37250,"gaz":539,"eolien":1466,"solaire":13840,"hydraulique":2809,"bioenergies":1000,"charbon":0,"fioul":37,"ech_physiques":-8012},{"at":"2026-09-25T09:45:00+00:00","load":48343,"nucleaire":36080,"gaz":296,"eolien":1247,"solaire":17650,"hydraulique":2430,"bioenergies":988,"charbon":0,"fioul":37,"ech_physiques":-8545},{"at":"2026-09-25T10:45:00+00:00","load":48983,"nucleaire":35948,"gaz":292,"eolien":1326,"solaire":19651,"hydraulique":2298,"bioenergies":990,"charbon":0,"fioul":37,"ech_physiques":-9136},{"at":"2026-09-25T11:45:00+00:00","load":46770,"nucleaire":33906,"gaz":288,"eolien":1330,"solaire":19928,"hydraulique":2217,"bioenergies":990,"charbon":0,"fioul":37,"ech_physiques":-9183},{"at":"2026-09-25T12:45:00+00:00","load":47278,"nucleaire":34156,"gaz":323,"eolien":1421,"solaire":18953,"hydraulique":2011,"bioenergies":985,"charbon":0,"fioul":37,"ech_physiques":-8345},{"at":"2026-09-25T13:45:00+00:00","load":46873,"nucleaire":34660,"gaz":428,"eolien":1676,"solaire":17688,"hydraulique":2059,"bioenergies":986,"charbon":0,"fioul":153,"ech_physiques":-8511},{"at":"2026-09-25T14:45:00+00:00","load":46186,"nucleaire":35765,"gaz":999,"eolien":1909,"solaire":14394,"hydraulique":2576,"bioenergies":986,"charbon":0,"fioul":37,"ech_physiques":-8714},{"at":"2026-09-25T15:45:00+00:00","load":46662,"nucleaire":36175,"gaz":2179,"eolien":2464,"solaire":9092,"hydraulique":5213,"bioenergies":994,"charbon":0,"fioul":380,"ech_physiques":-9852},{"at":"2026-09-25T16:45:00+00:00","load":47715,"nucleaire":36346,"gaz":4367,"eolien":2540,"solaire":3261,"hydraulique":8852,"bioenergies":995,"charbon":0,"fioul":701,"ech_physiques":-9462},{"at":"2026-09-25T17:45:00+00:00","load":47537,"nucleaire":36374,"gaz":4504,"eolien":2582,"solaire":376,"hydraulique":8522,"bioenergies":997,"charbon":0,"fioul":718,"ech_physiques":-6625},{"at":"2026-09-25T18:45:00+00:00","load":45955,"nucleaire":35550,"gaz":4592,"eolien":2793,"solaire":188,"hydraulique":8560,"bioenergies":993,"charbon":0,"fioul":735,"ech_physiques":-7684},{"at":"2026-09-25T19:45:00+00:00","load":43206,"nucleaire":35320,"gaz":4553,"eolien":3590,"solaire":0,"hydraulique":6970,"bioenergies":1003,"charbon":0,"fioul":740,"ech_physiques":-8992},{"at":"2026-09-25T20:45:00+00:00","load":44175,"nucleaire":34542,"gaz":4490,"eolien":3979,"solaire":0,"hydraulique":6584,"bioenergies":1014,"charbon":0,"fioul":501,"ech_physiques":-6587},{"at":"2026-09-25T21:45:00+00:00","load":42041,"nucleaire":33914,"gaz":4298,"eolien":3894,"solaire":0,"hydraulique":5295,"bioenergies":1017,"charbon":0,"fioul":37,"ech_physiques":-6127},{"at":"2026-09-25T22:45:00+00:00","load":38630,"nucleaire":33841,"gaz":3980,"eolien":3494,"solaire":0,"hydraulique":5088,"bioenergies":1012,"charbon":0,"fioul":36,"ech_physiques":-8933},{"at":"2026-09-25T23:45:00+00:00","load":37425,"nucleaire":33742,"gaz":3991,"eolien":3197,"solaire":0,"hydraulique":3346,"bioenergies":1026,"charbon":0,"fioul":36,"ech_physiques":-7890},{"at":"2026-09-26T00:45:00+00:00","load":35188,"nucleaire":33833,"gaz":3835,"eolien":3168,"solaire":0,"hydraulique":2791,"bioenergies":1013,"charbon":0,"fioul":36,"ech_physiques":-9314},{"at":"2026-09-26T01:45:00+00:00","load":33413,"nucleaire":33919,"gaz":3494,"eolien":3242,"solaire":0,"hydraulique":2414,"bioenergies":1010,"charbon":0,"fioul":36,"ech_physiques":-10432},{"at":"2026-09-26T02:45:00+00:00","load":32636,"nucleaire":33898,"gaz":3541,"eolien":2921,"solaire":0,"hydraulique":2343,"bioenergies":1013,"charbon":0,"fioul":37,"ech_physiques":-10867},{"at":"2026-09-26T03:45:00+00:00","load":32878,"nucleaire":33854,"gaz":3582,"eolien":2634,"solaire":0,"hydraulique":2463,"bioenergies":1009,"charbon":0,"fioul":36,"ech_physiques":-10644},{"at":"2026-09-26T04:45:00+00:00","load":34212,"nucleaire":33897,"gaz":3740,"eolien":2637,"solaire":0,"hydraulique":3192,"bioenergies":1005,"charbon":0,"fioul":37,"ech_physiques":-10252},{"at":"2026-09-26T05:45:00+00:00","load":35422,"nucleaire":33946,"gaz":3610,"eolien":2750,"solaire":214,"hydraulique":3485,"bioenergies":1008,"charbon":0,"fioul":37,"ech_physiques":-9716},{"at":"2026-09-26T06:45:00+00:00","load":37748,"nucleaire":33694,"gaz":2287,"eolien":2872,"solaire":2027,"hydraulique":3339,"bioenergies":1008,"charbon":0,"fioul":33,"ech_physiques":-7295},{"at":"2026-09-26T07:45:00+00:00","load":39991,"nucleaire":33326,"gaz":661,"eolien":2413,"solaire":5721,"hydraulique":2602,"bioenergies":1005,"charbon":0,"fioul":33,"ech_physiques":-5502},{"at":"2026-09-26T08:45:00+00:00","load":41100,"nucleaire":32568,"gaz":553,"eolien":2209,"solaire":10109,"hydraulique":2094,"bioenergies":1005,"charbon":0,"fioul":33,"ech_physiques":-5284},{"at":"2026-09-26T09:45:00+00:00","load":42951,"nucleaire":31740,"gaz":278,"eolien":1927,"solaire":13153,"hydraulique":1882,"bioenergies":1008,"charbon":0,"fioul":33,"ech_physiques":-4610},{"at":"2026-09-26T10:45:00+00:00","load":43852,"nucleaire":28980,"gaz":274,"eolien":1630,"solaire":15141,"hydraulique":1869,"bioenergies":998,"charbon":0,"fioul":33,"ech_physiques":-2469},{"at":"2026-09-26T11:45:00+00:00","load":41333,"nucleaire":28690,"gaz":285,"eolien":1470,"solaire":16669,"hydraulique":1934,"bioenergies":1011,"charbon":0,"fioul":33,"ech_physiques":-5824},{"at":"2026-09-26T12:45:00+00:00","load":41280,"nucleaire":29515,"gaz":283,"eolien":1350,"solaire":16670,"hydraulique":1950,"bioenergies":1009,"charbon":0,"fioul":32,"ech_physiques":-6787},{"at":"2026-09-26T13:45:00+00:00","load":40458,"nucleaire":31056,"gaz":285,"eolien":1278,"solaire":16181,"hydraulique":2114,"bioenergies":1013,"charbon":0,"fioul":32,"ech_physiques":-9172},{"at":"2026-09-26T14:45:00+00:00","load":39865,"nucleaire":32357,"gaz":297,"eolien":1297,"solaire":13272,"hydraulique":2722,"bioenergies":971,"charbon":0,"fioul":33,"ech_physiques":-9317},{"at":"2026-09-26T15:45:00+00:00","load":40877,"nucleaire":33448,"gaz":2263,"eolien":1417,"solaire":8488,"hydraulique":3133,"bioenergies":1012,"charbon":0,"fioul":33,"ech_physiques":-8898},{"at":"2026-09-26T16:45:00+00:00","load":42110,"nucleaire":33525,"gaz":3636,"eolien":1547,"solaire":3033,"hydraulique":6232,"bioenergies":1013,"charbon":0,"fioul":35,"ech_physiques":-6903},{"at":"2026-09-26T17:45:00+00:00","load":42916,"nucleaire":33606,"gaz":3912,"eolien":1617,"solaire":356,"hydraulique":7065,"bioenergies":1013,"charbon":0,"fioul":35,"ech_physiques":-4692},{"at":"2026-09-26T18:45:00+00:00","load":41295,"nucleaire":33712,"gaz":3944,"eolien":1936,"solaire":186,"hydraulique":6333,"bioenergies":1014,"charbon":0,"fioul":34,"ech_physiques":-6213},{"at":"2026-09-26T19:45:00+00:00","load":39282,"nucleaire":33676,"gaz":3940,"eolien":2298,"solaire":0,"hydraulique":4832,"bioenergies":1004,"charbon":0,"fioul":36,"ech_physiques":-6753},{"at":"2026-09-26T20:45:00+00:00","load":40644,"nucleaire":33674,"gaz":3807,"eolien":2552,"solaire":0,"hydraulique":4380,"bioenergies":1016,"charbon":0,"fioul":35,"ech_physiques":-4804},{"at":"2026-09-26T21:45:00+00:00","load":39625,"nucleaire":33883,"gaz":3537,"eolien":2446,"solaire":0,"hydraulique":3401,"bioenergies":1015,"charbon":0,"fioul":37,"ech_physiques":-4657},{"at":"2026-09-26T22:45:00+00:00","load":36722,"nucleaire":34343,"gaz":3291,"eolien":2425,"solaire":0,"hydraulique":3663,"bioenergies":1015,"charbon":0,"fioul":37,"ech_physiques":-7614},{"at":"2026-09-26T23:45:00+00:00","load":35954,"nucleaire":34442,"gaz":2462,"eolien":2256,"solaire":0,"hydraulique":3038,"bioenergies":1018,"charbon":0,"fioul":37,"ech_physiques":-6911},{"at":"2026-09-27T00:45:00+00:00","load":33265,"nucleaire":34795,"gaz":226,"eolien":2163,"solaire":0,"hydraulique":2824,"bioenergies":1011,"charbon":0,"fioul":37,"ech_physiques":-6708},{"at":"2026-09-27T01:45:00+00:00","load":31603,"nucleaire":34556,"gaz":232,"eolien":2372,"solaire":0,"hydraulique":3193,"bioenergies":1015,"charbon":0,"fioul":36,"ech_physiques":-8700},{"at":"2026-09-27T02:45:00+00:00","load":30806,"nucleaire":34090,"gaz":239,"eolien":2400,"solaire":0,"hydraulique":2598,"bioenergies":1012,"charbon":0,"fioul":37,"ech_physiques":-8477},{"at":"2026-09-27T03:45:00+00:00","load":31146,"nucleaire":34130,"gaz":232,"eolien":2663,"solaire":0,"hydraulique":2083,"bioenergies":1017,"charbon":0,"fioul":37,"ech_physiques":-8312},{"at":"2026-09-27T04:45:00+00:00","load":32117,"nucleaire":34092,"gaz":244,"eolien":3016,"solaire":0,"hydraulique":2078,"bioenergies":1014,"charbon":0,"fioul":37,"ech_physiques":-7680},{"at":"2026-09-27T05:45:00+00:00","load":32303,"nucleaire":33997,"gaz":244,"eolien":3313,"solaire":195,"hydraulique":2183,"bioenergies":1017,"charbon":0,"fioul":37,"ech_physiques":-8005},{"at":"2026-09-27T06:45:00+00:00","load":33915,"nucleaire":33485,"gaz":243,"eolien":3594,"solaire":2171,"hydraulique":2069,"bioenergies":1007,"charbon":0,"fioul":37,"ech_physiques":-7225},{"at":"2026-09-27T07:45:00+00:00","load":35634,"nucleaire":32562,"gaz":488,"eolien":3373,"solaire":6409,"hydraulique":1657,"bioenergies":995,"charbon":0,"fioul":37,"ech_physiques":-7545},{"at":"2026-09-27T08:45:00+00:00","load":38023,"nucleaire":27590,"gaz":507,"eolien":2793,"solaire":11476,"hydraulique":1525,"bioenergies":988,"charbon":0,"fioul":37,"ech_physiques":-4159},{"at":"2026-09-27T09:45:00+00:00","load":40176,"nucleaire":25712,"gaz":492,"eolien":3093,"solaire":15064,"hydraulique":1571,"bioenergies":992,"charbon":0,"fioul":37,"ech_physiques":-4786},{"at":"2026-09-27T10:45:00+00:00","load":41374,"nucleaire":25711,"gaz":472,"eolien":2413,"solaire":12945,"hydraulique":1555,"bioenergies":1010,"charbon":0,"fioul":37,"ech_physiques":-441},{"at":"2026-09-27T11:45:00+00:00","load":38297,"nucleaire":26118,"gaz":264,"eolien":1359,"solaire":10811,"hydraulique":1574,"bioenergies":997,"charbon":0,"fioul":37,"ech_physiques":-46},{"at":"2026-09-27T12:45:00+00:00","load":39565,"nucleaire":25860,"gaz":255,"eolien":2081,"solaire":11073,"hydraulique":1811,"bioenergies":1006,"charbon":0,"fioul":36,"ech_physiques":12},{"at":"2026-09-27T13:45:00+00:00","load":38753,"nucleaire":26121,"gaz":255,"eolien":4147,"solaire":14165,"hydraulique":1909,"bioenergies":1005,"charbon":0,"fioul":37,"ech_physiques":-5920},{"at":"2026-09-27T14:45:00+00:00","load":38955,"nucleaire":29315,"gaz":726,"eolien":4150,"solaire":11078,"hydraulique":2306,"bioenergies":1011,"charbon":0,"fioul":37,"ech_physiques":-8015},{"at":"2026-09-27T15:45:00+00:00","load":40041,"nucleaire":32362,"gaz":1170,"eolien":3432,"solaire":6355,"hydraulique":2978,"bioenergies":1009,"charbon":0,"fioul":37,"ech_physiques":-6980},{"at":"2026-09-27T16:45:00+00:00","load":42493,"nucleaire":32492,"gaz":2651,"eolien":2553,"solaire":2119,"hydraulique":5413,"bioenergies":1011,"charbon":0,"fioul":37,"ech_physiques":-3805},{"at":"2026-09-27T17:45:00+00:00","load":44171,"nucleaire":32692,"gaz":2764,"eolien":2178,"solaire":335,"hydraulique":5737,"bioenergies":1011,"charbon":0,"fioul":37,"ech_physiques":-575},{"at":"2026-09-27T18:45:00+00:00","load":42401,"nucleaire":32753,"gaz":2878,"eolien":2334,"solaire":195,"hydraulique":4426,"bioenergies":1012,"charbon":0,"fioul":37,"ech_physiques":-1176},{"at":"2026-09-27T19:45:00+00:00","load":40182,"nucleaire":32793,"gaz":2480,"eolien":2493,"solaire":0,"hydraulique":3704,"bioenergies":1004,"charbon":0,"fioul":37,"ech_physiques":-2315},{"at":"2026-09-27T20:45:00+00:00","load":41264,"nucleaire":32819,"gaz":2490,"eolien":2599,"solaire":0,"hydraulique":3410,"bioenergies":1002,"charbon":0,"fioul":36,"ech_physiques":-1051},{"at":"2026-09-27T21:45:00+00:00","load":39849,"nucleaire":32879,"gaz":2105,"eolien":2731,"solaire":0,"hydraulique":2845,"bioenergies":998,"charbon":0,"fioul":37,"ech_physiques":-1732},{"at":"2026-09-27T22:45:00+00:00","load":37022,"nucleaire":33024,"gaz":1221,"eolien":2711,"solaire":0,"hydraulique":2314,"bioenergies":999,"charbon":0,"fioul":37,"ech_physiques":-2312},{"at":"2026-09-27T23:45:00+00:00","load":36178,"nucleaire":33200,"gaz":1293,"eolien":2519,"solaire":0,"hydraulique":2399,"bioenergies":998,"charbon":0,"fioul":37,"ech_physiques":-3653},{"at":"2026-09-28T00:45:00+00:00","load":33960,"nucleaire":33520,"gaz":1310,"eolien":2221,"solaire":0,"hydraulique":2096,"bioenergies":1005,"charbon":0,"fioul":37,"ech_physiques":-5810},{"at":"2026-09-28T01:45:00+00:00","load":32739,"nucleaire":33903,"gaz":1371,"eolien":2397,"solaire":0,"hydraulique":2068,"bioenergies":993,"charbon":0,"fioul":37,"ech_physiques":-7483},{"at":"2026-09-28T02:45:00+00:00","load":32640,"nucleaire":33875,"gaz":1347,"eolien":2800,"solaire":0,"hydraulique":2257,"bioenergies":996,"charbon":0,"fioul":37,"ech_physiques":-8405},{"at":"2026-09-28T03:45:00+00:00","load":35340,"nucleaire":34546,"gaz":3283,"eolien":3044,"solaire":0,"hydraulique":2549,"bioenergies":1000,"charbon":0,"fioul":37,"ech_physiques":-9066},{"at":"2026-09-28T04:45:00+00:00","load":40092,"nucleaire":34561,"gaz":3932,"eolien":2806,"solaire":0,"hydraulique":5019,"bioenergies":993,"charbon":0,"fioul":37,"ech_physiques":-7269},{"at":"2026-09-28T05:45:00+00:00","load":43563,"nucleaire":34554,"gaz":3983,"eolien":2990,"solaire":219,"hydraulique":6577,"bioenergies":991,"charbon":0,"fioul":37,"ech_physiques":-6121},{"at":"2026-09-28T06:45:00+00:00","load":45360,"nucleaire":34552,"gaz":3957,"eolien":2924,"solaire":1741,"hydraulique":5036,"bioenergies":978,"charbon":0,"fioul":37,"ech_physiques":-3993},{"at":"2026-09-28T07:45:00+00:00","load":46475,"nucleaire":34444,"gaz":3733,"eolien":2890,"solaire":4470,"hydraulique":4194,"bioenergies":987,"charbon":0,"fioul":36,"ech_physiques":-4259},{"at":"2026-09-28T08:45:00+00:00","load":47676,"nucleaire":34383,"gaz":3161,"eolien":2658,"solaire":8032,"hydraulique":2934,"bioenergies":991,"charbon":0,"fioul":37,"ech_physiques":-4026},{"at":"2026-09-28T09:45:00+00:00","load":48383,"nucleaire":34417,"gaz":1682,"eolien":2192,"solaire":11138,"hydraulique":2470,"bioenergies":995,"charbon":0,"fioul":37,"ech_physiques":-3828},{"at":"2026-09-28T10:45:00+00:00","load":48896,"nucleaire":33336,"gaz":1219,"eolien":2313,"solaire":12755,"hydraulique":2280,"bioenergies":992,"charbon":0,"fioul":37,"ech_physiques":-3126},{"at":"2026-09-28T11:45:00+00:00","load":47528,"nucleaire":33306,"gaz":1314,"eolien":2200,"solaire":13617,"hydraulique":2307,"bioenergies":991,"charbon":0,"fioul":37,"ech_physiques":-5020},{"at":"2026-09-28T12:45:00+00:00","load":48738,"nucleaire":33582,"gaz":1384,"eolien":2280,"solaire":13074,"hydraulique":2424,"bioenergies":996,"charbon":0,"fioul":37,"ech_physiques":-4338},{"at":"2026-09-28T13:45:00+00:00","load":47708,"nucleaire":33894,"gaz":1806,"eolien":2219,"solaire":11568,"hydraulique":2670,"bioenergies":980,"charbon":0,"fioul":37,"ech_physiques":-5186},{"at":"2026-09-28T14:45:00+00:00","load":46249,"nucleaire":34230,"gaz":3222,"eolien":2352,"solaire":8759,"hydraulique":4143,"bioenergies":982,"charbon":0,"fioul":37,"ech_physiques":-7462},{"at":"2026-09-28T15:45:00+00:00","load":46003,"nucleaire":34394,"gaz":3374,"eolien":2398,"solaire":5255,"hydraulique":6864,"bioenergies":991,"charbon":0,"fioul":37,"ech_physiques":-7544},{"at":"2026-09-28T16:45:00+00:00","load":47932,"nucleaire":34387,"gaz":3616,"eolien":2571,"solaire":1839,"hydraulique":7932,"bioenergies":999,"charbon":0,"fioul":382,"ech_physiques":-4045},{"at":"2026-09-28T17:45:00+00:00","load":49212,"nucleaire":34830,"gaz":3635,"eolien":2714,"solaire":331,"hydraulique":7484,"bioenergies":1024,"charbon":0,"fioul":384,"ech_physiques":-1221},{"at":"2026-09-28T18:45:00+00:00","load":46153,"nucleaire":34882,"gaz":3761,"eolien":3429,"solaire":203,"hydraulique":7100,"bioenergies":1033,"charbon":0,"fioul":305,"ech_physiques":-4836},{"at":"2026-09-28T19:45:00+00:00","load":43136,"nucleaire":34904,"gaz":3988,"eolien":4172,"solaire":0,"hydraulique":5137,"bioenergies":1047,"charbon":0,"fioul":37,"ech_physiques":-6135},{"at":"2026-09-28T20:45:00+00:00","load":43753,"nucleaire":34904,"gaz":3862,"eolien":4407,"solaire":0,"hydraulique":4707,"bioenergies":1053,"charbon":0,"fioul":37,"ech_physiques":-5177},{"at":"2026-09-28T21:45:00+00:00","load":41880,"nucleaire":34928,"gaz":3324,"eolien":4592,"solaire":0,"hydraulique":3431,"bioenergies":1053,"charbon":0,"fioul":37,"ech_physiques":-5402},{"at":"2026-09-28T22:45:00+00:00","load":38813,"nucleaire":34487,"gaz":3079,"eolien":4718,"solaire":0,"hydraulique":2560,"bioenergies":1063,"charbon":0,"fioul":36,"ech_physiques":-7111},{"at":"2026-09-28T23:45:00+00:00","load":38156,"nucleaire":33879,"gaz":2850,"eolien":4852,"solaire":0,"hydraulique":2499,"bioenergies":1057,"charbon":0,"fioul":37,"ech_physiques":-7009},{"at":"2026-09-29T00:45:00+00:00","load":35592,"nucleaire":33915,"gaz":2528,"eolien":4817,"solaire":0,"hydraulique":2291,"bioenergies":1060,"charbon":0,"fioul":37,"ech_physiques":-9048},{"at":"2026-09-29T01:45:00+00:00","load":33973,"nucleaire":33951,"gaz":2232,"eolien":4980,"solaire":0,"hydraulique":2344,"bioenergies":1060,"charbon":0,"fioul":37,"ech_physiques":-10224},{"at":"2026-09-29T02:45:00+00:00","load":34068,"nucleaire":34162,"gaz":2222,"eolien":4755,"solaire":0,"hydraulique":2252,"bioenergies":1050,"charbon":0,"fioul":37,"ech_physiques":-9446},{"at":"2026-09-29T03:45:00+00:00","load":36122,"nucleaire":34306,"gaz":2321,"eolien":5419,"solaire":0,"hydraulique":2761,"bioenergies":1047,"charbon":0,"fioul":37,"ech_physiques":-9667},{"at":"2026-09-29T04:45:00+00:00","load":40550,"nucleaire":34274,"gaz":3357,"eolien":5647,"solaire":0,"hydraulique":3579,"bioenergies":1052,"charbon":0,"fioul":37,"ech_physiques":-7496},{"at":"2026-09-29T05:45:00+00:00","load":44456,"nucleaire":34232,"gaz":3713,"eolien":5950,"solaire":220,"hydraulique":5278,"bioenergies":1052,"charbon":0,"fioul":37,"ech_physiques":-6361},{"at":"2026-09-29T06:45:00+00:00","load":46338,"nucleaire":34289,"gaz":3613,"eolien":6276,"solaire":1689,"hydraulique":4139,"bioenergies":1063,"charbon":0,"fioul":37,"ech_physiques":-4781},{"at":"2026-09-29T07:45:00+00:00","load":46901,"nucleaire":34282,"gaz":3091,"eolien":6058,"solaire":4588,"hydraulique":2762,"bioenergies":1076,"charbon":0,"fioul":37,"ech_physiques":-4978},{"at":"2026-09-29T08:45:00+00:00","load":47902,"nucleaire":34193,"gaz":1526,"eolien":5891,"solaire":8438,"hydraulique":1955,"bioenergies":1091,"charbon":0,"fioul":37,"ech_physiques":-5188},{"at":"2026-09-29T09:45:00+00:00","load":48637,"nucleaire":33886,"gaz":683,"eolien":5853,"solaire":11598,"hydraulique":1583,"bioenergies":1100,"charbon":0,"fioul":37,"ech_physiques":-5706},{"at":"2026-09-29T10:45:00+00:00","load":49123,"nucleaire":33501,"gaz":251,"eolien":6375,"solaire":13887,"hydraulique":1627,"bioenergies":1102,"charbon":0,"fioul":36,"ech_physiques":-6808},{"at":"2026-09-29T11:45:00+00:00","load":48237,"nucleaire":32852,"gaz":267,"eolien":6793,"solaire":15172,"hydraulique":1577,"bioenergies":1095,"charbon":0,"fioul":37,"ech_physiques":-8677},{"at":"2026-09-29T12:45:00+00:00","load":48972,"nucleaire":32860,"gaz":264,"eolien":7534,"solaire":14200,"hydraulique":1743,"bioenergies":1101,"charbon":0,"fioul":37,"ech_physiques":-8243},{"at":"2026-09-29T13:45:00+00:00","load":47951,"nucleaire":33371,"gaz":505,"eolien":7978,"solaire":12939,"hydraulique":2173,"bioenergies":1101,"charbon":0,"fioul":36,"ech_physiques":-9627},{"at":"2026-09-29T14:45:00+00:00","load":47114,"nucleaire":33919,"gaz":1541,"eolien":7761,"solaire":9717,"hydraulique":2482,"bioenergies":1097,"charbon":0,"fioul":36,"ech_physiques":-8933},{"at":"2026-09-29T15:45:00+00:00","load":46439,"nucleaire":33908,"gaz":2653,"eolien":7760,"solaire":5506,"hydraulique":3189,"bioenergies":1111,"charbon":0,"fioul":36,"ech_physiques":-7724},{"at":"2026-09-29T16:45:00+00:00","load":48162,"nucleaire":34044,"gaz":3504,"eolien":6815,"solaire":1950,"hydraulique":5407,"bioenergies":1109,"charbon":0,"fioul":36,"ech_physiques":-5065},{"at":"2026-09-29T17:45:00+00:00","load":49347,"nucleaire":34027,"gaz":3607,"eolien":6534,"solaire":312,"hydraulique":6079,"bioenergies":1118,"charbon":0,"fioul":36,"ech_physiques":-2527},{"at":"2026-09-29T18:45:00+00:00","load":46140,"nucleaire":34069,"gaz":3618,"eolien":8008,"solaire":200,"hydraulique":4524,"bioenergies":1122,"charbon":0,"fioul":36,"ech_physiques":-5663},{"at":"2026-09-29T19:45:00+00:00","load":43359,"nucleaire":34134,"gaz":2944,"eolien":9795,"solaire":0,"hydraulique":2770,"bioenergies":1121,"charbon":0,"fioul":37,"ech_physiques":-7267},{"at":"2026-09-29T20:45:00+00:00","load":43884,"nucleaire":34130,"gaz":942,"eolien":10796,"solaire":0,"hydraulique":2461,"bioenergies":1118,"charbon":0,"fioul":35,"ech_physiques":-5457},{"at":"2026-09-29T21:45:00+00:00","load":43079,"nucleaire":33904,"gaz":901,"eolien":11494,"solaire":0,"hydraulique":2248,"bioenergies":1120,"charbon":0,"fioul":33,"ech_physiques":-6320},{"at":"2026-09-29T22:45:00+00:00","load":39672,"nucleaire":33686,"gaz":487,"eolien":11636,"solaire":0,"hydraulique":2628,"bioenergies":1117,"charbon":0,"fioul":33,"ech_physiques":-9042},{"at":"2026-09-29T23:45:00+00:00","load":38995,"nucleaire":33854,"gaz":670,"eolien":11857,"solaire":0,"hydraulique":2451,"bioenergies":1121,"charbon":0,"fioul":37,"ech_physiques":-9849},{"at":"2026-09-30T00:45:00+00:00","load":36311,"nucleaire":32031,"gaz":290,"eolien":11502,"solaire":0,"hydraulique":2099,"bioenergies":1126,"charbon":0,"fioul":37,"ech_physiques":-9391},{"at":"2026-09-30T01:45:00+00:00","load":35434,"nucleaire":31743,"gaz":282,"eolien":11985,"solaire":0,"hydraulique":2092,"bioenergies":1105,"charbon":0,"fioul":37,"ech_physiques":-10092},{"at":"2026-09-30T02:45:00+00:00","load":34427,"nucleaire":30888,"gaz":282,"eolien":11607,"solaire":0,"hydraulique":2065,"bioenergies":1103,"charbon":0,"fioul":37,"ech_physiques":-10076},{"at":"2026-09-30T03:45:00+00:00","load":36283,"nucleaire":31012,"gaz":574,"eolien":10247,"solaire":0,"hydraulique":2896,"bioenergies":1102,"charbon":0,"fioul":37,"ech_physiques":-9385},{"at":"2026-09-30T04:45:00+00:00","load":40755,"nucleaire":31746,"gaz":2890,"eolien":9339,"solaire":0,"hydraulique":3272,"bioenergies":1099,"charbon":0,"fioul":37,"ech_physiques":-7626},{"at":"2026-09-30T05:45:00+00:00","load":44481,"nucleaire":31743,"gaz":3262,"eolien":8199,"solaire":201,"hydraulique":3444,"bioenergies":1117,"charbon":0,"fioul":37,"ech_physiques":-3766},{"at":"2026-09-30T06:45:00+00:00","load":46754,"nucleaire":31749,"gaz":3115,"eolien":7470,"solaire":1412,"hydraulique":3003,"bioenergies":1147,"charbon":0,"fioul":37,"ech_physiques":-1152},{"at":"2026-09-30T07:45:00+00:00","load":48183,"nucleaire":31447,"gaz":2018,"eolien":6717,"solaire":3231,"hydraulique":3008,"bioenergies":1137,"charbon":0,"fioul":37,"ech_physiques":591},{"at":"2026-09-30T08:45:00+00:00","load":48447,"nucleaire":30198,"gaz":1669,"eolien":5626,"solaire":5478,"hydraulique":2748,"bioenergies":1125,"charbon":0,"fioul":37,"ech_physiques":1296},{"at":"2026-09-30T09:45:00+00:00","load":49465,"nucleaire":29693,"gaz":1953,"eolien":5248,"solaire":7152,"hydraulique":2606,"bioenergies":1118,"charbon":0,"fioul":920,"ech_physiques":792},{"at":"2026-09-30T10:45:00+00:00","load":50394,"nucleaire":29811,"gaz":1411,"eolien":5154,"solaire":8268,"hydraulique":2656,"bioenergies":1125,"charbon":0,"fioul":37,"ech_physiques":2385},{"at":"2026-09-30T11:45:00+00:00","load":48455,"nucleaire":29924,"gaz":1140,"eolien":4601,"solaire":8263,"hydraulique":2452,"bioenergies":1129,"charbon":0,"fioul":36,"ech_physiques":1364},{"at":"2026-09-30T12:45:00+00:00","load":49247,"nucleaire":29944,"gaz":2235,"eolien":4223,"solaire":7692,"hydraulique":2065,"bioenergies":1133,"charbon":0,"fioul":35,"ech_physiques":2191},{"at":"2026-09-30T13:45:00+00:00","load":48401,"nucleaire":30331,"gaz":1823,"eolien":4363,"solaire":6725,"hydraulique":2331,"bioenergies":1130,"charbon":0,"fioul":36,"ech_physiques":1616},{"at":"2026-09-30T14:45:00+00:00","load":47196,"nucleaire":30415,"gaz":2315,"eolien":4921,"solaire":4876,"hydraulique":3642,"bioenergies":1131,"charbon":0,"fioul":37,"ech_physiques":-328},{"at":"2026-09-30T15:45:00+00:00","load":46505,"nucleaire":30492,"gaz":3242,"eolien":5102,"solaire":2858,"hydraulique":5234,"bioenergies":1135,"charbon":0,"fioul":195,"ech_physiques":-2145},{"at":"2026-09-30T16:45:00+00:00","load":48322,"nucleaire":30771,"gaz":3875,"eolien":4920,"solaire":1272,"hydraulique":6254,"bioenergies":1133,"charbon":0,"fioul":907,"ech_physiques":-809},{"at":"2026-09-30T17:45:00+00:00","load":49793,"nucleaire":31133,"gaz":4089,"eolien":4713,"solaire":291,"hydraulique":6120,"bioenergies":1136,"charbon":0,"fioul":913,"ech_physiques":1404},{"at":"2026-09-30T18:45:00+00:00","load":46516,"nucleaire":31197,"gaz":3839,"eolien":4598,"solaire":195,"hydraulique":5427,"bioenergies":985,"charbon":0,"fioul":280,"ech_physiques":-30},{"at":"2026-09-30T19:45:00+00:00","load":43127,"nucleaire":31193,"gaz":3735,"eolien":4348,"solaire":0,"hydraulique":4350,"bioenergies":990,"charbon":0,"fioul":37,"ech_physiques":-1479},{"at":"2026-09-30T20:45:00+00:00","load":44415,"nucleaire":31286,"gaz":3742,"eolien":4690,"solaire":0,"hydraulique":3283,"bioenergies":989,"charbon":0,"fioul":37,"ech_physiques":512},{"at":"2026-09-30T21:45:00+00:00","load":42707,"nucleaire":31293,"gaz":3526,"eolien":4985,"solaire":0,"hydraulique":3098,"bioenergies":985,"charbon":0,"fioul":37,"ech_physiques":-1120},{"at":"2026-09-30T22:45:00+00:00","load":39553,"nucleaire":31302,"gaz":2419,"eolien":5033,"solaire":0,"hydraulique":3364,"bioenergies":984,"charbon":0,"fioul":37,"ech_physiques":-3221},{"at":"2026-09-30T23:45:00+00:00","load":38528,"nucleaire":31348,"gaz":2489,"eolien":4094,"solaire":0,"hydraulique":3457,"bioenergies":985,"charbon":0,"fioul":37,"ech_physiques":-3052},{"at":"2026-10-01T00:45:00+00:00","load":35811,"nucleaire":31374,"gaz":3172,"eolien":3539,"solaire":0,"hydraulique":2917,"bioenergies":987,"charbon":0,"fioul":36,"ech_physiques":-4981},{"at":"2026-10-01T01:45:00+00:00","load":34452,"nucleaire":31419,"gaz":3227,"eolien":3760,"solaire":0,"hydraulique":2739,"bioenergies":991,"charbon":0,"fioul":37,"ech_physiques":-6183},{"at":"2026-10-01T02:45:00+00:00","load":34487,"nucleaire":31404,"gaz":3231,"eolien":4190,"solaire":0,"hydraulique":2695,"bioenergies":988,"charbon":0,"fioul":36,"ech_physiques":-6583},{"at":"2026-10-01T03:45:00+00:00","load":36392,"nucleaire":31397,"gaz":3263,"eolien":3813,"solaire":0,"hydraulique":2890,"bioenergies":987,"charbon":0,"fioul":37,"ech_physiques":-5173},{"at":"2026-10-01T04:45:00+00:00","load":40760,"nucleaire":31441,"gaz":3993,"eolien":3538,"solaire":0,"hydraulique":4135,"bioenergies":987,"charbon":0,"fioul":37,"ech_physiques":-3225},{"at":"2026-10-01T05:45:00+00:00","load":44712,"nucleaire":31416,"gaz":4141,"eolien":3320,"solaire":183,"hydraulique":4628,"bioenergies":980,"charbon":0,"fioul":36,"ech_physiques":-329},{"at":"2026-10-01T06:45:00+00:00","load":46881,"nucleaire":31146,"gaz":4209,"eolien":3027,"solaire":1041,"hydraulique":4705,"bioenergies":981,"charbon":0,"fioul":36,"ech_physiques":1401},{"at":"2026-10-01T07:45:00+00:00","load":47833,"nucleaire":30734,"gaz":4350,"eolien":2411,"solaire":3470,"hydraulique":4694,"bioenergies":981,"charbon":0,"fioul":36,"ech_physiques":1149},{"at":"2026-10-01T08:45:00+00:00","load":48446,"nucleaire":30691,"gaz":4201,"eolien":2217,"solaire":6448,"hydraulique":3524,"bioenergies":981,"charbon":0,"fioul":36,"ech_physiques":354},{"at":"2026-10-01T09:45:00+00:00","load":49294,"nucleaire":30729,"gaz":2957,"eolien":2040,"solaire":8736,"hydraulique":2957,"bioenergies":980,"charbon":0,"fioul":33,"ech_physiques":936},{"at":"2026-10-01T10:45:00+00:00","load":49138,"nucleaire":30600,"gaz":2805,"eolien":2125,"solaire":10053,"hydraulique":2625,"bioenergies":988,"charbon":0,"fioul":37,"ech_physiques":269},{"at":"2026-10-01T11:45:00+00:00","load":47536,"nucleaire":30685,"gaz":2594,"eolien":2336,"solaire":10229,"hydraulique":2871,"bioenergies":988,"charbon":0,"fioul":37,"ech_physiques":-1687},{"at":"2026-10-01T12:45:00+00:00","load":47223,"nucleaire":30638,"gaz":2340,"eolien":2410,"solaire":9299,"hydraulique":3445,"bioenergies":994,"charbon":0,"fioul":37,"ech_physiques":-1576},{"at":"2026-10-01T13:45:00+00:00","load":46421,"nucleaire":30719,"gaz":2576,"eolien":2594,"solaire":9030,"hydraulique":3505,"bioenergies":987,"charbon":0,"fioul":36,"ech_physiques":-2944},{"at":"2026-10-01T14:45:00+00:00","load":45081,"nucleaire":30719,"gaz":3259,"eolien":2708,"solaire":7204,"hydraulique":4268,"bioenergies":990,"charbon":0,"fioul":36,"ech_physiques":-4126},{"at":"2026-10-01T15:45:00+00:00","load":45013,"nucleaire":30739,"gaz":3962,"eolien":2533,"solaire":4747,"hydraulique":7003,"bioenergies":988,"charbon":0,"fioul":36,"ech_physiques":-5204},{"at":"2026-10-01T16:45:00+00:00","load":47059,"nucleaire":30752,"gaz":4032,"eolien":1686,"solaire":1736,"hydraulique":8969,"bioenergies":994,"charbon":0,"fioul":711,"ech_physiques":-2228},{"at":"2026-10-01T17:45:00+00:00","load":48807,"nucleaire":30744,"gaz":4057,"eolien":1415,"solaire":253,"hydraulique":8974,"bioenergies":989,"charbon":0,"fioul":716,"ech_physiques":1368},{"at":"2026-10-01T18:45:00+00:00","load":45491,"nucleaire":30733,"gaz":4250,"eolien":1542,"solaire":0,"hydraulique":8096,"bioenergies":994,"charbon":0,"fioul":91,"ech_physiques":-201},{"at":"2026-10-01T19:45:00+00:00","load":42841,"nucleaire":30761,"gaz":4071,"eolien":1679,"solaire":0,"hydraulique":5959,"bioenergies":996,"charbon":0,"fioul":33,"ech_physiques":-426},{"at":"2026-10-01T20:45:00+00:00","load":43929,"nucleaire":30768,"gaz":4039,"eolien":1725,"solaire":0,"hydraulique":4897,"bioenergies":989,"charbon":0,"fioul":35,"ech_physiques":1528},{"at":"2026-10-01T21:45:00+00:00","load":42703,"nucleaire":30797,"gaz":3353,"eolien":1743,"solaire":0,"hydraulique":4174,"bioenergies":991,"charbon":0,"fioul":33,"ech_physiques":1508},{"at":"2026-10-01T22:45:00+00:00","load":39313,"nucleaire":30914,"gaz":3470,"eolien":1564,"solaire":0,"hydraulique":4255,"bioenergies":989,"charbon":0,"fioul":35,"ech_physiques":-1853},{"at":"2026-10-01T23:45:00+00:00","load":38480,"nucleaire":31056,"gaz":3601,"eolien":1531,"solaire":0,"hydraulique":3931,"bioenergies":988,"charbon":0,"fioul":36,"ech_physiques":-2252},{"at":"2026-10-02T00:45:00+00:00","load":35829,"nucleaire":30648,"gaz":3544,"eolien":1411,"solaire":0,"hydraulique":3036,"bioenergies":987,"charbon":0,"fioul":37,"ech_physiques":-3239},{"at":"2026-10-02T01:45:00+00:00","load":34462,"nucleaire":30987,"gaz":3637,"eolien":1335,"solaire":0,"hydraulique":3002,"bioenergies":993,"charbon":0,"fioul":37,"ech_physiques":-4823},{"at":"2026-10-02T02:45:00+00:00","load":34534,"nucleaire":31117,"gaz":3527,"eolien":1422,"solaire":0,"hydraulique":2946,"bioenergies":992,"charbon":0,"fioul":37,"ech_physiques":-4612},{"at":"2026-10-02T03:45:00+00:00","load":36477,"nucleaire":31264,"gaz":3776,"eolien":1608,"solaire":0,"hydraulique":3590,"bioenergies":986,"charbon":0,"fioul":37,"ech_physiques":-4574},{"at":"2026-10-02T04:45:00+00:00","load":40563,"nucleaire":30871,"gaz":3931,"eolien":1750,"solaire":0,"hydraulique":6638,"bioenergies":992,"charbon":0,"fioul":37,"ech_physiques":-3664},{"at":"2026-10-02T05:45:00+00:00","load":44435,"nucleaire":30854,"gaz":4051,"eolien":1975,"solaire":175,"hydraulique":7629,"bioenergies":990,"charbon":0,"fioul":37,"ech_physiques":-1677},{"at":"2026-10-02T06:45:00+00:00","load":46108,"nucleaire":30856,"gaz":4065,"eolien":2081,"solaire":1524,"hydraulique":6434,"bioenergies":991,"charbon":0,"fioul":36,"ech_physiques":-199},{"at":"2026-10-02T07:45:00+00:00","load":46376,"nucleaire":29911,"gaz":3848,"eolien":1924,"solaire":5283,"hydraulique":4661,"bioenergies":985,"charbon":0,"fioul":36,"ech_physiques":-70},{"at":"2026-10-02T08:45:00+00:00","load":46629,"nucleaire":29880,"gaz":3912,"eolien":1229,"solaire":9825,"hydraulique":4050,"bioenergies":985,"charbon":0,"fioul":36,"ech_physiques":-3241},{"at":"2026-10-02T09:45:00+00:00","load":47163,"nucleaire":30176,"gaz":2870,"eolien":1196,"solaire":13236,"hydraulique":2675,"bioenergies":991,"charbon":0,"fioul":37,"ech_physiques":-3035},{"at":"2026-10-02T10:45:00+00:00","load":47562,"nucleaire":30729,"gaz":2398,"eolien":1372,"solaire":14902,"hydraulique":2463,"bioenergies":997,"charbon":0,"fioul":37,"ech_physiques":-3906},{"at":"2026-10-02T11:45:00+00:00","load":45458,"nucleaire":30656,"gaz":1898,"eolien":1214,"solaire":15471,"hydraulique":2311,"bioenergies":987,"charbon":0,"fioul":36,"ech_physiques":-5125},{"at":"2026-10-02T12:45:00+00:00","load":45981,"nucleaire":30608,"gaz":2152,"eolien":1153,"solaire":14452,"hydraulique":2208,"bioenergies":984,"charbon":0,"fioul":36,"ech_physiques":-4012},{"at":"2026-10-02T13:45:00+00:00","load":45027,"nucleaire":30621,"gaz":2146,"eolien":1091,"solaire":12811,"hydraulique":2378,"bioenergies":975,"charbon":0,"fioul":35,"ech_physiques":-3546},{"at":"2026-10-02T14:45:00+00:00","load":43691,"nucleaire":30543,"gaz":2321,"eolien":1052,"solaire":9572,"hydraulique":3801,"bioenergies":983,"charbon":0,"fioul":35,"ech_physiques":-3465},{"at":"2026-10-02T15:45:00+00:00","load":44557,"nucleaire":30498,"gaz":3844,"eolien":1200,"solaire":5482,"hydraulique":6194,"bioenergies":986,"charbon":0,"fioul":35,"ech_physiques":-3955},{"at":"2026-10-02T16:45:00+00:00","load":45862,"nucleaire":30544,"gaz":3950,"eolien":1375,"solaire":1768,"hydraulique":8849,"bioenergies":986,"charbon":0,"fioul":34,"ech_physiques":-1963},{"at":"2026-10-02T17:45:00+00:00","load":47490,"nucleaire":30689,"gaz":3978,"eolien":1741,"solaire":259,"hydraulique":9383,"bioenergies":970,"charbon":0,"fioul":35,"ech_physiques":258},{"at":"2026-10-02T18:45:00+00:00","load":44488,"nucleaire":31792,"gaz":3997,"eolien":2844,"solaire":0,"hydraulique":8089,"bioenergies":969,"charbon":0,"fioul":35,"ech_physiques":-3281},{"at":"2026-10-02T19:45:00+00:00","load":42177,"nucleaire":31815,"gaz":3969,"eolien":3545,"solaire":0,"hydraulique":5746,"bioenergies":972,"charbon":0,"fioul":37,"ech_physiques":-3665},{"at":"2026-10-02T20:45:00+00:00","load":42884,"nucleaire":31850,"gaz":3738,"eolien":3807,"solaire":0,"hydraulique":4201,"bioenergies":982,"charbon":0,"fioul":37,"ech_physiques":-1755},{"at":"2026-10-02T21:45:00+00:00","load":41912,"nucleaire":31269,"gaz":3734,"eolien":3640,"solaire":0,"hydraulique":3716,"bioenergies":986,"charbon":0,"fioul":37,"ech_physiques":-1440},{"at":"2026-10-02T22:45:00+00:00","load":38514,"nucleaire":31278,"gaz":3969,"eolien":3248,"solaire":0,"hydraulique":3880,"bioenergies":991,"charbon":0,"fioul":37,"ech_physiques":-4828},{"at":"2026-10-02T23:45:00+00:00","load":37566,"nucleaire":31180,"gaz":3968,"eolien":3012,"solaire":0,"hydraulique":3146,"bioenergies":998,"charbon":0,"fioul":37,"ech_physiques":-4642},{"at":"2026-10-03T00:45:00+00:00","load":34784,"nucleaire":30954,"gaz":3962,"eolien":2838,"solaire":0,"hydraulique":2697,"bioenergies":994,"charbon":0,"fioul":36,"ech_physiques":-6624},{"at":"2026-10-03T01:45:00+00:00","load":33042,"nucleaire":30837,"gaz":4085,"eolien":2468,"solaire":0,"hydraulique":2606,"bioenergies":986,"charbon":0,"fioul":35,"ech_physiques":-7956},{"at":"2026-10-03T02:45:00+00:00","load":32349,"nucleaire":30607,"gaz":4155,"eolien":2152,"solaire":0,"hydraulique":2711,"bioenergies":991,"charbon":0,"fioul":37,"ech_physiques":-8293},{"at":"2026-10-03T03:45:00+00:00","load":32944,"nucleaire":30728,"gaz":4092,"eolien":2116,"solaire":0,"hydraulique":2789,"bioenergies":985,"charbon":0,"fioul":37,"ech_physiques":-7775},{"at":"2026-10-03T04:45:00+00:00","load":34213,"nucleaire":31104,"gaz":4015,"eolien":2228,"solaire":0,"hydraulique":3524,"bioenergies":987,"charbon":0,"fioul":37,"ech_physiques":-7664},{"at":"2026-10-03T05:45:00+00:00","load":35724,"nucleaire":31762,"gaz":4030,"eolien":2221,"solaire":212,"hydraulique":3691,"bioenergies":982,"charbon":0,"fioul":37,"ech_physiques":-7202},{"at":"2026-10-03T06:45:00+00:00","load":37918,"nucleaire":31598,"gaz":3469,"eolien":2403,"solaire":1363,"hydraulique":2975,"bioenergies":983,"charbon":0,"fioul":36,"ech_physiques":-5009},{"at":"2026-10-03T07:45:00+00:00","load":40463,"nucleaire":31368,"gaz":2315,"eolien":2130,"solaire":4487,"hydraulique":2330,"bioenergies":975,"charbon":0,"fioul":33,"ech_physiques":-3152},{"at":"2026-10-03T08:45:00+00:00","load":41039,"nucleaire":31285,"gaz":1415,"eolien":1793,"solaire":8090,"hydraulique":2322,"bioenergies":975,"charbon":0,"fioul":33,"ech_physiques":-4153},{"at":"2026-10-03T09:45:00+00:00","load":42685,"nucleaire":31213,"gaz":1144,"eolien":1697,"solaire":11659,"hydraulique":1667,"bioenergies":974,"charbon":0,"fioul":37,"ech_physiques":-4130},{"at":"2026-10-03T10:45:00+00:00","load":44338,"nucleaire":31078,"gaz":844,"eolien":1944,"solaire":13349,"hydraulique":1667,"bioenergies":973,"charbon":0,"fioul":37,"ech_physiques":-3005},{"at":"2026-10-03T11:45:00+00:00","load":42240,"nucleaire":30961,"gaz":783,"eolien":1971,"solaire":14268,"hydraulique":1654,"bioenergies":972,"charbon":0,"fioul":37,"ech_physiques":-5424},{"at":"2026-10-03T12:45:00+00:00","load":42353,"nucleaire":30385,"gaz":624,"eolien":2145,"solaire":13397,"hydraulique":1731,"bioenergies":977,"charbon":0,"fioul":35,"ech_physiques":-4474},{"at":"2026-10-03T13:45:00+00:00","load":40086,"nucleaire":31104,"gaz":791,"eolien":2095,"solaire":11219,"hydraulique":1906,"bioenergies":983,"charbon":0,"fioul":35,"ech_physiques":-6003},{"at":"2026-10-03T14:45:00+00:00","load":39468,"nucleaire":31851,"gaz":1184,"eolien":2466,"solaire":7967,"hydraulique":2463,"bioenergies":986,"charbon":0,"fioul":36,"ech_physiques":-7056},{"at":"2026-10-03T15:45:00+00:00","load":39893,"nucleaire":32615,"gaz":3540,"eolien":2840,"solaire":4341,"hydraulique":4850,"bioenergies":986,"charbon":0,"fioul":36,"ech_physiques":-9698},{"at":"2026-10-03T16:45:00+00:00","load":40940,"nucleaire":33199,"gaz":4041,"eolien":3392,"solaire":1422,"hydraulique":7283,"bioenergies":989,"charbon":0,"fioul":36,"ech_physiques":-9431},{"at":"2026-10-03T17:45:00+00:00","load":43265,"nucleaire":33761,"gaz":4080,"eolien":4537,"solaire":270,"hydraulique":6963,"bioenergies":988,"charbon":0,"fioul":36,"ech_physiques":-7699},{"at":"2026-10-03T18:45:00+00:00","load":40528,"nucleaire":33889,"gaz":3700,"eolien":5672,"solaire":0,"hydraulique":5441,"bioenergies":981,"charbon":0,"fioul":36,"ech_physiques":-9174},{"at":"2026-10-03T19:45:00+00:00","load":38326,"nucleaire":33891,"gaz":3451,"eolien":6168,"solaire":0,"hydraulique":4059,"bioenergies":983,"charbon":0,"fioul":37,"ech_physiques":-10252},{"at":"2026-10-03T20:45:00+00:00","load":40176,"nucleaire":33873,"gaz":3468,"eolien":6294,"solaire":0,"hydraulique":3716,"bioenergies":989,"charbon":0,"fioul":37,"ech_physiques":-8183},{"at":"2026-10-03T21:45:00+00:00","load":39412,"nucleaire":33835,"gaz":3266,"eolien":5745,"solaire":0,"hydraulique":2714,"bioenergies":989,"charbon":0,"fioul":37,"ech_physiques":-7036},{"at":"2026-10-03T22:45:00+00:00","load":36587,"nucleaire":33847,"gaz":3079,"eolien":5498,"solaire":0,"hydraulique":2754,"bioenergies":995,"charbon":0,"fioul":36,"ech_physiques":-9560},{"at":"2026-10-03T23:45:00+00:00","load":35676,"nucleaire":34282,"gaz":2896,"eolien":5140,"solaire":0,"hydraulique":2894,"bioenergies":994,"charbon":0,"fioul":37,"ech_physiques":-10496},{"at":"2026-10-04T00:45:00+00:00","load":33032,"nucleaire":34476,"gaz":2667,"eolien":4829,"solaire":0,"hydraulique":2701,"bioenergies":991,"charbon":0,"fioul":36,"ech_physiques":-11937},{"at":"2026-10-04T01:45:00+00:00","load":31306,"nucleaire":34496,"gaz":2508,"eolien":4623,"solaire":0,"hydraulique":2306,"bioenergies":992,"charbon":0,"fioul":37,"ech_physiques":-12424},{"at":"2026-10-04T02:45:00+00:00","load":30349,"nucleaire":34512,"gaz":2491,"eolien":4678,"solaire":0,"hydraulique":2170,"bioenergies":987,"charbon":0,"fioul":37,"ech_physiques":-13136},{"at":"2026-10-04T03:45:00+00:00","load":30620,"nucleaire":34598,"gaz":2575,"eolien":4509,"solaire":0,"hydraulique":2203,"bioenergies":968,"charbon":0,"fioul":37,"ech_physiques":-13252},{"at":"2026-10-04T04:45:00+00:00","load":31346,"nucleaire":34663,"gaz":2613,"eolien":4087,"solaire":0,"hydraulique":2702,"bioenergies":967,"charbon":0,"fioul":37,"ech_physiques":-13472},{"at":"2026-10-04T05:45:00+00:00","load":32412,"nucleaire":34593,"gaz":2680,"eolien":4065,"solaire":215,"hydraulique":3560,"bioenergies":965,"charbon":0,"fioul":36,"ech_physiques":-13466},{"at":"2026-10-04T06:45:00+00:00","load":34114,"nucleaire":34628,"gaz":2287,"eolien":4010,"solaire":1479,"hydraulique":3253,"bioenergies":987,"charbon":0,"fioul":37,"ech_physiques":-11933},{"at":"2026-10-04T07:45:00+00:00","load":36502,"nucleaire":34610,"gaz":381,"eolien":3673,"solaire":4607,"hydraulique":2695,"bioenergies":982,"charbon":0,"fioul":37,"ech_physiques":-9606},{"at":"2026-10-04T08:45:00+00:00","load":38626,"nucleaire":34291,"gaz":371,"eolien":2794,"solaire":8675,"hydraulique":2074,"bioenergies":987,"charbon":0,"fioul":35,"ech_physiques":-9112},{"at":"2026-10-04T09:45:00+00:00","load":40336,"nucleaire":33137,"gaz":349,"eolien":2464,"solaire":12135,"hydraulique":1595,"bioenergies":981,"charbon":0,"fioul":36,"ech_physiques":-8407},{"at":"2026-10-04T10:45:00+00:00","load":42562,"nucleaire":30409,"gaz":353,"eolien":2466,"solaire":14244,"hydraulique":1536,"bioenergies":978,"charbon":0,"fioul":35,"ech_physiques":-5205},{"at":"2026-10-04T11:45:00+00:00","load":39537,"nucleaire":29475,"gaz":346,"eolien":2370,"solaire":14573,"hydraulique":1538,"bioenergies":988,"charbon":0,"fioul":34,"ech_physiques":-7062},{"at":"2026-10-04T12:45:00+00:00","load":39864,"nucleaire":30461,"gaz":355,"eolien":2142,"solaire":13634,"hydraulique":1641,"bioenergies":987,"charbon":0,"fioul":35,"ech_physiques":-6848},{"at":"2026-10-04T13:45:00+00:00","load":38385,"nucleaire":32991,"gaz":331,"eolien":2276,"solaire":11963,"hydraulique":1895,"bioenergies":985,"charbon":0,"fioul":36,"ech_physiques":-10173},{"at":"2026-10-04T14:45:00+00:00","load":37987,"nucleaire":35347,"gaz":411,"eolien":2307,"solaire":8864,"hydraulique":2128,"bioenergies":984,"charbon":0,"fioul":33,"ech_physiques":-10396},{"at":"2026-10-04T15:45:00+00:00","load":38359,"nucleaire":35683,"gaz":2164,"eolien":2447,"solaire":5292,"hydraulique":2654,"bioenergies":982,"charbon":0,"fioul":35,"ech_physiques":-10693},{"at":"2026-10-04T16:45:00+00:00","load":41400,"nucleaire":35838,"gaz":2957,"eolien":2641,"solaire":1657,"hydraulique":4989,"bioenergies":984,"charbon":0,"fioul":35,"ech_physiques":-7932},{"at":"2026-10-04T17:45:00+00:00","load":44105,"nucleaire":36266,"gaz":3126,"eolien":3005,"solaire":245,"hydraulique":6365,"bioenergies":982,"charbon":0,"fioul":35,"ech_physiques":-6246},{"at":"2026-10-04T18:45:00+00:00","load":41237,"nucleaire":36422,"gaz":3350,"eolien":3862,"solaire":0,"hydraulique":5335,"bioenergies":982,"charbon":0,"fioul":36,"ech_physiques":-8783},{"at":"2026-10-04T19:45:00+00:00","load":39174,"nucleaire":36426,"gaz":3448,"eolien":4328,"solaire":0,"hydraulique":3805,"bioenergies":982,"charbon":0,"fioul":36,"ech_physiques":-9740},{"at":"2026-10-04T20:45:00+00:00","load":40839,"nucleaire":36364,"gaz":3433,"eolien":4043,"solaire":0,"hydraulique":3379,"bioenergies":982,"charbon":0,"fioul":35,"ech_physiques":-7344},{"at":"2026-10-04T21:45:00+00:00","load":39650,"nucleaire":36402,"gaz":3381,"eolien":3632,"solaire":0,"hydraulique":2506,"bioenergies":986,"charbon":0,"fioul":37,"ech_physiques":-7251},{"at":"2026-10-04T22:45:00+00:00","load":36593,"nucleaire":36290,"gaz":1586,"eolien":3074,"solaire":0,"hydraulique":3354,"bioenergies":987,"charbon":0,"fioul":33,"ech_physiques":-8378},{"at":"2026-10-04T23:45:00+00:00","load":36081,"nucleaire":36145,"gaz":1461,"eolien":2528,"solaire":0,"hydraulique":2526,"bioenergies":983,"charbon":0,"fioul":33,"ech_physiques":-7552},{"at":"2026-10-05T00:45:00+00:00","load":33345,"nucleaire":36369,"gaz":1206,"eolien":2382,"solaire":0,"hydraulique":2083,"bioenergies":985,"charbon":0,"fioul":99,"ech_physiques":-8482},{"at":"2026-10-05T01:45:00+00:00","load":32277,"nucleaire":36871,"gaz":1406,"eolien":2190,"solaire":0,"hydraulique":1964,"bioenergies":983,"charbon":0,"fioul":98,"ech_physiques":-9521},{"at":"2026-10-05T02:45:00+00:00","load":32497,"nucleaire":36931,"gaz":1437,"eolien":1939,"solaire":0,"hydraulique":2162,"bioenergies":985,"charbon":0,"fioul":98,"ech_physiques":-9880},{"at":"2026-10-05T03:45:00+00:00","load":34816,"nucleaire":36933,"gaz":2068,"eolien":1862,"solaire":0,"hydraulique":2517,"bioenergies":976,"charbon":0,"fioul":100,"ech_physiques":-9626},{"at":"2026-10-05T04:45:00+00:00","load":39802,"nucleaire":36965,"gaz":3796,"eolien":1863,"solaire":0,"hydraulique":4618,"bioenergies":987,"charbon":0,"fioul":37,"ech_physiques":-8566},{"at":"2026-10-05T05:45:00+00:00","load":44215,"nucleaire":37246,"gaz":3936,"eolien":1834,"solaire":207,"hydraulique":5866,"bioenergies":977,"charbon":0,"fioul":36,"ech_physiques":-6201},{"at":"2026-10-05T06:45:00+00:00","load":45647,"nucleaire":37667,"gaz":3951,"eolien":1813,"solaire":1531,"hydraulique":4630,"bioenergies":961,"charbon":0,"fioul":37,"ech_physiques":-5131},{"at":"2026-10-05T07:45:00+00:00","load":46032,"nucleaire":37769,"gaz":2480,"eolien":1695,"solaire":5816,"hydraulique":3052,"bioenergies":968,"charbon":0,"fioul":37,"ech_physiques":-5541},{"at":"2026-10-05T08:45:00+00:00","load":47111,"nucleaire":37765,"gaz":997,"eolien":1263,"solaire":11601,"hydraulique":2305,"bioenergies":964,"charbon":0,"fioul":37,"ech_physiques":-6246},{"at":"2026-10-05T09:45:00+00:00","load":48038,"nucleaire":37423,"gaz":602,"eolien":1058,"solaire":16092,"hydraulique":1949,"bioenergies":964,"charbon":0,"fioul":37,"ech_physiques":-8003},{"at":"2026-10-05T10:45:00+00:00","load":49546,"nucleaire":37056,"gaz":586,"eolien":1058,"solaire":18080,"hydraulique":1940,"bioenergies":965,"charbon":0,"fioul":36,"ech_physiques":-8057},{"at":"2026-10-05T11:45:00+00:00","load":47352,"nucleaire":35181,"gaz":581,"eolien":1060,"solaire":18538,"hydraulique":1916,"bioenergies":965,"charbon":0,"fioul":36,"ech_physiques":-9402},{"at":"2026-10-05T12:45:00+00:00","load":47983,"nucleaire":35471,"gaz":547,"eolien":1089,"solaire":17433,"hydraulique":1915,"bioenergies":969,"charbon":0,"fioul":35,"ech_physiques":-7819},{"at":"2026-10-05T13:45:00+00:00","load":46637,"nucleaire":35485,"gaz":681,"eolien":1101,"solaire":15570,"hydraulique":2063,"bioenergies":967,"charbon":0,"fioul":35,"ech_physiques":-8214},{"at":"2026-10-05T14:45:00+00:00","load":45309,"nucleaire":36878,"gaz":1175,"eolien":1105,"solaire":12025,"hydraulique":2476,"bioenergies":970,"charbon":0,"fioul":35,"ech_physiques":-8375},{"at":"2026-10-05T15:45:00+00:00","load":45782,"nucleaire":37683,"gaz":3702,"eolien":1095,"solaire":7055,"hydraulique":3473,"bioenergies":982,"charbon":0,"fioul":34,"ech_physiques":-8235},{"at":"2026-10-05T16:45:00+00:00","load":47876,"nucleaire":37776,"gaz":4182,"eolien":1192,"solaire":1919,"hydraulique":7208,"bioenergies":995,"charbon":0,"fioul":35,"ech_physiques":-5530},{"at":"2026-10-05T17:45:00+00:00","load":49322,"nucleaire":37800,"gaz":4255,"eolien":1544,"solaire":219,"hydraulique":7555,"bioenergies":1001,"charbon":0,"fioul":34,"ech_physiques":-3435},{"at":"2026-10-05T18:45:00+00:00","load":45827,"nucleaire":37902,"gaz":4222,"eolien":2228,"solaire":0,"hydraulique":6527,"bioenergies":998,"charbon":0,"fioul":36,"ech_physiques":-5866},{"at":"2026-10-05T19:45:00+00:00","load":42706,"nucleaire":37922,"gaz":4145,"eolien":2717,"solaire":0,"hydraulique":5001,"bioenergies":1001,"charbon":0,"fioul":36,"ech_physiques":-7967},{"at":"2026-10-05T20:45:00+00:00","load":43624,"nucleaire":37945,"gaz":4209,"eolien":3036,"solaire":0,"hydraulique":4360,"bioenergies":1007,"charbon":0,"fioul":37,"ech_physiques":-6894},{"at":"2026-10-05T21:45:00+00:00","load":42062,"nucleaire":38101,"gaz":3850,"eolien":3045,"solaire":0,"hydraulique":3838,"bioenergies":1000,"charbon":0,"fioul":37,"ech_physiques":-7791},{"at":"2026-10-05T22:45:00+00:00","load":38905,"nucleaire":38145,"gaz":3483,"eolien":2874,"solaire":0,"hydraulique":2570,"bioenergies":1008,"charbon":0,"fioul":37,"ech_physiques":-9165},{"at":"2026-10-05T23:45:00+00:00","load":38126,"nucleaire":38188,"gaz":3485,"eolien":2599,"solaire":0,"hydraulique":2480,"bioenergies":988,"charbon":0,"fioul":37,"ech_physiques":-9511},{"at":"2026-10-06T00:45:00+00:00","load":35699,"nucleaire":38301,"gaz":3271,"eolien":2258,"solaire":0,"hydraulique":2396,"bioenergies":974,"charbon":0,"fioul":37,"ech_physiques":-10912},{"at":"2026-10-06T01:45:00+00:00","load":34171,"nucleaire":38404,"gaz":3294,"eolien":2006,"solaire":0,"hydraulique":2434,"bioenergies":974,"charbon":0,"fioul":37,"ech_physiques":-12642},{"at":"2026-10-06T02:45:00+00:00","load":34106,"nucleaire":38407,"gaz":3045,"eolien":1865,"solaire":0,"hydraulique":2464,"bioenergies":972,"charbon":0,"fioul":37,"ech_physiques":-12403},{"at":"2026-10-06T03:45:00+00:00","load":36229,"nucleaire":38476,"gaz":3422,"eolien":1794,"solaire":0,"hydraulique":2841,"bioenergies":973,"charbon":0,"fioul":37,"ech_physiques":-11276},{"at":"2026-10-06T04:45:00+00:00","load":40984,"nucleaire":38473,"gaz":3888,"eolien":1742,"solaire":0,"hydraulique":4545,"bioenergies":971,"charbon":0,"fioul":36,"ech_physiques":-8675},{"at":"2026-10-06T05:45:00+00:00","load":45199,"nucleaire":38441,"gaz":4339,"eolien":1827,"solaire":228,"hydraulique":5748,"bioenergies":967,"charbon":0,"fioul":36,"ech_physiques":-6781},{"at":"2026-10-06T06:45:00+00:00","load":46184,"nucleaire":38420,"gaz":4417,"eolien":1991,"solaire":1782,"hydraulique":5422,"bioenergies":992,"charbon":0,"fioul":36,"ech_physiques":-7142},{"at":"2026-10-06T07:45:00+00:00","load":46550,"nucleaire":38093,"gaz":4303,"eolien":1888,"solaire":6326,"hydraulique":4280,"bioenergies":984,"charbon":0,"fioul":37,"ech_physiques":-9346},{"at":"2026-10-06T08:45:00+00:00","load":47546,"nucleaire":37469,"gaz":3012,"eolien":1485,"solaire":11902,"hydraulique":3205,"bioenergies":1001,"charbon":0,"fioul":37,"ech_physiques":-10470},{"at":"2026-10-06T09:45:00+00:00","load":48912,"nucleaire":37040,"gaz":1601,"eolien":1405,"solaire":15521,"hydraulique":2495,"bioenergies":1002,"charbon":0,"fioul":37,"ech_physiques":-10019},{"at":"2026-10-06T10:45:00+00:00","load":49248,"nucleaire":37258,"gaz":1485,"eolien":1408,"solaire":17215,"hydraulique":2157,"bioenergies":1007,"charbon":0,"fioul":37,"ech_physiques":-10695},{"at":"2026-10-06T11:45:00+00:00","load":48143,"nucleaire":37115,"gaz":1340,"eolien":1594,"solaire":17366,"hydraulique":2034,"bioenergies":999,"charbon":0,"fioul":36,"ech_physiques":-11300},{"at":"2026-10-06T12:45:00+00:00","load":48689,"nucleaire":37054,"gaz":1757,"eolien":1724,"solaire":15748,"hydraulique":2049,"bioenergies":999,"charbon":0,"fioul":37,"ech_physiques":-9811},{"at":"2026-10-06T13:45:00+00:00","load":47208,"nucleaire":37023,"gaz":2336,"eolien":1679,"solaire":13668,"hydraulique":2470,"bioenergies":984,"charbon":0,"fioul":37,"ech_physiques":-10516},{"at":"2026-10-06T14:45:00+00:00","load":46489,"nucleaire":37227,"gaz":3447,"eolien":1748,"solaire":9644,"hydraulique":2934,"bioenergies":994,"charbon":0,"fioul":37,"ech_physiques":-9776},{"at":"2026-10-06T15:45:00+00:00","load":46036,"nucleaire":37619,"gaz":4124,"eolien":1735,"solaire":4941,"hydraulique":6256,"bioenergies":986,"charbon":0,"fioul":117,"ech_physiques":-10103},{"at":"2026-10-06T16:45:00+00:00","load":47997,"nucleaire":37601,"gaz":4300,"eolien":2220,"solaire":1396,"hydraulique":8928,"bioenergies":990,"charbon":0,"fioul":264,"ech_physiques":-7611},{"at":"2026-10-06T17:45:00+00:00","load":49415,"nucleaire":37756,"gaz":4536,"eolien":2691,"solaire":239,"hydraulique":8978,"bioenergies":993,"charbon":0,"fioul":270,"ech_physiques":-6295},{"at":"2026-10-06T18:45:00+00:00","load":45161,"nucleaire":37971,"gaz":4456,"eolien":3827,"solaire":0,"hydraulique":7863,"bioenergies":991,"charbon":0,"fioul":392,"ech_physiques":-10363},{"at":"2026-10-06T19:45:00+00:00","load":42226,"nucleaire":37950,"gaz":4267,"eolien":4878,"solaire":0,"hydraulique":6364,"bioenergies":992,"charbon":0,"fioul":192,"ech_physiques":-12119},{"at":"2026-10-06T20:45:00+00:00","load":43236,"nucleaire":37932,"gaz":4294,"eolien":5090,"solaire":0,"hydraulique":4443,"bioenergies":991,"charbon":0,"fioul":37,"ech_physiques":-9559},{"at":"2026-10-06T21:45:00+00:00","load":41125,"nucleaire":38014,"gaz":3790,"eolien":4834,"solaire":0,"hydraulique":3655,"bioenergies":994,"charbon":0,"fioul":37,"ech_physiques":-10154},{"at":"2026-10-06T22:45:00+00:00","load":38713,"nucleaire":38026,"gaz":4046,"eolien":4538,"solaire":0,"hydraulique":3224,"bioenergies":992,"charbon":0,"fioul":37,"ech_physiques":-12139},{"at":"2026-10-06T23:45:00+00:00","load":38063,"nucleaire":38022,"gaz":4120,"eolien":3897,"solaire":0,"hydraulique":3080,"bioenergies":993,"charbon":0,"fioul":37,"ech_physiques":-12137},{"at":"2026-10-07T00:45:00+00:00","load":35555,"nucleaire":37936,"gaz":3807,"eolien":3172,"solaire":0,"hydraulique":2727,"bioenergies":991,"charbon":0,"fioul":36,"ech_physiques":-12697},{"at":"2026-10-07T01:45:00+00:00","load":34267,"nucleaire":38058,"gaz":3669,"eolien":2978,"solaire":0,"hydraulique":2690,"bioenergies":993,"charbon":0,"fioul":37,"ech_physiques":-13462},{"at":"2026-10-07T02:45:00+00:00","load":34123,"nucleaire":37366,"gaz":3652,"eolien":2759,"solaire":0,"hydraulique":2806,"bioenergies":997,"charbon":0,"fioul":37,"ech_physiques":-12911},{"at":"2026-10-07T03:45:00+00:00","load":36037,"nucleaire":37465,"gaz":3810,"eolien":2670,"solaire":0,"hydraulique":3392,"bioenergies":991,"charbon":0,"fioul":37,"ech_physiques":-12030},{"at":"2026-10-07T04:45:00+00:00","load":40153,"nucleaire":37493,"gaz":4147,"eolien":2997,"solaire":0,"hydraulique":4417,"bioenergies":995,"charbon":0,"fioul":37,"ech_physiques":-9888},{"at":"2026-10-07T05:45:00+00:00","load":44538,"nucleaire":37465,"gaz":4305,"eolien":3157,"solaire":173,"hydraulique":6712,"bioenergies":990,"charbon":0,"fioul":36,"ech_physiques":-8585},{"at":"2026-10-07T06:45:00+00:00","load":46899,"nucleaire":37476,"gaz":4322,"eolien":3691,"solaire":1083,"hydraulique":5807,"bioenergies":990,"charbon":0,"fioul":36,"ech_physiques":-6811},{"at":"2026-10-07T07:45:00+00:00","load":48233,"nucleaire":36564,"gaz":4232,"eolien":3184,"solaire":2731,"hydraulique":4722,"bioenergies":993,"charbon":0,"fioul":37,"ech_physiques":-4204},{"at":"2026-10-07T08:45:00+00:00","load":49405,"nucleaire":36602,"gaz":3751,"eolien":2888,"solaire":4717,"hydraulique":3816,"bioenergies":966,"charbon":0,"fioul":37,"ech_physiques":-3339},{"at":"2026-10-07T09:45:00+00:00","load":50279,"nucleaire":36567,"gaz":2580,"eolien":3259,"solaire":6073,"hydraulique":3395,"bioenergies":979,"charbon":0,"fioul":37,"ech_physiques":-2506},{"at":"2026-10-07T10:45:00+00:00","load":51311,"nucleaire":36557,"gaz":2545,"eolien":3795,"solaire":6787,"hydraulique":3026,"bioenergies":953,"charbon":0,"fioul":37,"ech_physiques":-2123},{"at":"2026-10-07T11:45:00+00:00","load":49133,"nucleaire":36553,"gaz":2381,"eolien":4258,"solaire":6674,"hydraulique":3000,"bioenergies":959,"charbon":0,"fioul":36,"ech_physiques":-3543},{"at":"2026-10-07T12:45:00+00:00","load":48952,"nucleaire":36516,"gaz":2583,"eolien":4619,"solaire":6072,"hydraulique":3241,"bioenergies":969,"charbon":0,"fioul":37,"ech_physiques":-4314},{"at":"2026-10-07T13:45:00+00:00","load":47552,"nucleaire":36469,"gaz":2610,"eolien":5636,"solaire":5256,"hydraulique":3314,"bioenergies":975,"charbon":0,"fioul":37,"ech_physiques":-6390},{"at":"2026-10-07T14:45:00+00:00","load":46636,"nucleaire":36439,"gaz":3624,"eolien":5764,"solaire":3827,"hydraulique":3650,"bioenergies":961,"charbon":0,"fioul":37,"ech_physiques":-7817},{"at":"2026-10-07T15:45:00+00:00","load":46755,"nucleaire":36399,"gaz":4038,"eolien":6018,"solaire":2239,"hydraulique":6196,"bioenergies":972,"charbon":0,"fioul":37,"ech_physiques":-9148},{"at":"2026-10-07T16:45:00+00:00","load":49361,"nucleaire":36642,"gaz":4216,"eolien":6638,"solaire":853,"hydraulique":7932,"bioenergies":976,"charbon":0,"fioul":37,"ech_physiques":-8117},{"at":"2026-10-07T17:45:00+00:00","load":50268,"nucleaire":36591,"gaz":4219,"eolien":7280,"solaire":194,"hydraulique":7706,"bioenergies":982,"charbon":0,"fioul":37,"ech_physiques":-6861},{"at":"2026-10-07T18:45:00+00:00","load":46180,"nucleaire":36720,"gaz":4069,"eolien":8476,"solaire":0,"hydraulique":5838,"bioenergies":981,"charbon":0,"fioul":37,"ech_physiques":-9560},{"at":"2026-10-07T19:45:00+00:00","load":43422,"nucleaire":36708,"gaz":3146,"eolien":9966,"solaire":0,"hydraulique":4370,"bioenergies":985,"charbon":0,"fioul":37,"ech_physiques":-11579},{"at":"2026-10-07T20:45:00+00:00","load":44282,"nucleaire":36130,"gaz":2165,"eolien":11245,"solaire":0,"hydraulique":3917,"bioenergies":982,"charbon":0,"fioul":36,"ech_physiques":-10451},{"at":"2026-10-07T21:45:00+00:00","load":42539,"nucleaire":36645,"gaz":2074,"eolien":11916,"solaire":0,"hydraulique":3751,"bioenergies":985,"charbon":0,"fioul":37,"ech_physiques":-12724},{"at":"2026-10-07T22:45:00+00:00","load":39758,"nucleaire":36265,"gaz":1138,"eolien":12610,"solaire":0,"hydraulique":3777,"bioenergies":985,"charbon":0,"fioul":37,"ech_physiques":-13892},{"at":"2026-10-07T23:45:00+00:00","load":38608,"nucleaire":35355,"gaz":485,"eolien":12622,"solaire":0,"hydraulique":3453,"bioenergies":987,"charbon":0,"fioul":37,"ech_physiques":-12682},{"at":"2026-10-08T00:45:00+00:00","load":35807,"nucleaire":34702,"gaz":535,"eolien":12177,"solaire":0,"hydraulique":2910,"bioenergies":986,"charbon":0,"fioul":36,"ech_physiques":-13240},{"at":"2026-10-08T01:45:00+00:00","load":34694,"nucleaire":33761,"gaz":449,"eolien":13150,"solaire":0,"hydraulique":2618,"bioenergies":987,"charbon":0,"fioul":37,"ech_physiques":-13382},{"at":"2026-10-08T02:45:00+00:00","load":34939,"nucleaire":33469,"gaz":538,"eolien":13041,"solaire":0,"hydraulique":2659,"bioenergies":989,"charbon":0,"fioul":36,"ech_physiques":-12877},{"at":"2026-10-08T03:45:00+00:00","load":36590,"nucleaire":34248,"gaz":494,"eolien":13232,"solaire":0,"hydraulique":2994,"bioenergies":985,"charbon":0,"fioul":37,"ech_physiques":-12910},{"at":"2026-10-08T04:45:00+00:00","load":41327,"nucleaire":36912,"gaz":492,"eolien":14545,"solaire":0,"hydraulique":3498,"bioenergies":979,"charbon":0,"fioul":37,"ech_physiques":-14012},{"at":"2026-10-08T05:45:00+00:00","load":45034,"nucleaire":37230,"gaz":729,"eolien":13854,"solaire":177,"hydraulique":4138,"bioenergies":982,"charbon":0,"fioul":36,"ech_physiques":-12329},{"at":"2026-10-08T06:45:00+00:00","load":47285,"nucleaire":37309,"gaz":904,"eolien":13016,"solaire":1029,"hydraulique":5314,"bioenergies":983,"charbon":0,"fioul":36,"ech_physiques":-11653},{"at":"2026-10-08T07:45:00+00:00","load":47965,"nucleaire":37307,"gaz":909,"eolien":12330,"solaire":3720,"hydraulique":4088,"bioenergies":983,"charbon":0,"fioul":36,"ech_physiques":-11437},{"at":"2026-10-08T08:45:00+00:00","load":48752,"nucleaire":37134,"gaz":915,"eolien":12239,"solaire":7368,"hydraulique":3041,"bioenergies":981,"charbon":0,"fioul":37,"ech_physiques":-12182},{"at":"2026-10-08T09:45:00+00:00","load":50264,"nucleaire":37036,"gaz":726,"eolien":12596,"solaire":10269,"hydraulique":2922,"bioenergies":986,"charbon":0,"fioul":37,"ech_physiques":-12749},{"at":"2026-10-08T10:45:00+00:00","load":50172,"nucleaire":36264,"gaz":680,"eolien":11267,"solaire":11649,"hydraulique":2670,"bioenergies":996,"charbon":0,"fioul":36,"ech_physiques":-11697},{"at":"2026-10-08T11:45:00+00:00","load":48187,"nucleaire":35966,"gaz":685,"eolien":10393,"solaire":11659,"hydraulique":2607,"bioenergies":989,"charbon":0,"fioul":37,"ech_physiques":-11906},{"at":"2026-10-08T12:45:00+00:00","load":47345,"nucleaire":36175,"gaz":516,"eolien":9625,"solaire":10591,"hydraulique":2466,"bioenergies":989,"charbon":0,"fioul":37,"ech_physiques":-11162},{"at":"2026-10-08T13:45:00+00:00","load":46168,"nucleaire":36158,"gaz":717,"eolien":8989,"solaire":9726,"hydraulique":2748,"bioenergies":988,"charbon":0,"fioul":37,"ech_physiques":-11218},{"at":"2026-10-08T14:45:00+00:00","load":45127,"nucleaire":36280,"gaz":687,"eolien":8585,"solaire":7482,"hydraulique":2920,"bioenergies":985,"charbon":0,"fioul":37,"ech_physiques":-10954},{"at":"2026-10-08T15:45:00+00:00","load":45516,"nucleaire":37502,"gaz":1070,"eolien":7475,"solaire":4705,"hydraulique":4903,"bioenergies":986,"charbon":0,"fioul":37,"ech_physiques":-11154},{"at":"2026-10-08T16:45:00+00:00","load":48573,"nucleaire":37552,"gaz":2618,"eolien":6096,"solaire":1529,"hydraulique":7226,"bioenergies":994,"charbon":0,"fioul":37,"ech_physiques":-7613},{"at":"2026-10-08T17:45:00+00:00","load":49961,"nucleaire":37586,"gaz":3056,"eolien":5012,"solaire":267,"hydraulique":8340,"bioenergies":999,"charbon":0,"fioul":36,"ech_physiques":-5521},{"at":"2026-10-08T18:45:00+00:00","load":46531,"nucleaire":37623,"gaz":3038,"eolien":4719,"solaire":0,"hydraulique":7055,"bioenergies":998,"charbon":0,"fioul":37,"ech_physiques":-7139},{"at":"2026-10-08T19:45:00+00:00","load":43604,"nucleaire":37638,"gaz":2810,"eolien":4687,"solaire":0,"hydraulique":5167,"bioenergies":995,"charbon":0,"fioul":37,"ech_physiques":-7611},{"at":"2026-10-08T20:45:00+00:00","load":44852,"nucleaire":37764,"gaz":1349,"eolien":4388,"solaire":0,"hydraulique":4677,"bioenergies":996,"charbon":0,"fioul":37,"ech_physiques":-4253},{"at":"2026-10-08T21:45:00+00:00","load":43251,"nucleaire":37825,"gaz":1361,"eolien":4345,"solaire":0,"hydraulique":3887,"bioenergies":998,"charbon":0,"fioul":37,"ech_physiques":-4631},{"at":"2026-10-08T22:45:00+00:00","load":40230,"nucleaire":37611,"gaz":574,"eolien":4609,"solaire":0,"hydraulique":3606,"bioenergies":999,"charbon":0,"fioul":37,"ech_physiques":-5972},{"at":"2026-10-08T23:45:00+00:00","load":39158,"nucleaire":37014,"gaz":545,"eolien":5400,"solaire":0,"hydraulique":3360,"bioenergies":996,"charbon":0,"fioul":37,"ech_physiques":-6951},{"at":"2026-10-09T00:45:00+00:00","load":37026,"nucleaire":36582,"gaz":545,"eolien":6147,"solaire":0,"hydraulique":3131,"bioenergies":1003,"charbon":0,"fioul":37,"ech_physiques":-8303},{"at":"2026-10-09T01:45:00+00:00","load":35403,"nucleaire":36240,"gaz":500,"eolien":6886,"solaire":0,"hydraulique":2762,"bioenergies":994,"charbon":0,"fioul":37,"ech_physiques":-9564},{"at":"2026-10-09T02:45:00+00:00","load":35122,"nucleaire":36002,"gaz":541,"eolien":7601,"solaire":0,"hydraulique":2787,"bioenergies":987,"charbon":0,"fioul":37,"ech_physiques":-10259},{"at":"2026-10-09T03:45:00+00:00","load":37595,"nucleaire":36213,"gaz":497,"eolien":8517,"solaire":0,"hydraulique":2960,"bioenergies":986,"charbon":0,"fioul":37,"ech_physiques":-8962},{"at":"2026-10-09T04:45:00+00:00","load":41743,"nucleaire":36645,"gaz":492,"eolien":9322,"solaire":0,"hydraulique":3309,"bioenergies":969,"charbon":0,"fioul":36,"ech_physiques":-7807},{"at":"2026-10-09T05:45:00+00:00","load":46256,"nucleaire":36657,"gaz":491,"eolien":10584,"solaire":195,"hydraulique":4233,"bioenergies":970,"charbon":0,"fioul":37,"ech_physiques":-6227},{"at":"2026-10-09T06:45:00+00:00","load":48326,"nucleaire":37290,"gaz":530,"eolien":11490,"solaire":1290,"hydraulique":4681,"bioenergies":964,"charbon":0,"fioul":37,"ech_physiques":-7322},{"at":"2026-10-09T07:45:00+00:00","load":49121,"nucleaire":37717,"gaz":708,"eolien":11697,"solaire":5187,"hydraulique":3732,"bioenergies":971,"charbon":0,"fioul":115,"ech_physiques":-9839},{"at":"2026-10-09T08:45:00+00:00","load":49537,"nucleaire":37472,"gaz":710,"eolien":10724,"solaire":9005,"hydraulique":3391,"bioenergies":975,"charbon":0,"fioul":79,"ech_physiques":-11030},{"at":"2026-10-09T09:45:00+00:00","load":49647,"nucleaire":36959,"gaz":719,"eolien":10870,"solaire":11185,"hydraulique":2935,"bioenergies":974,"charbon":0,"fioul":37,"ech_physiques":-12216},{"at":"2026-10-09T10:45:00+00:00","load":50104,"nucleaire":35013,"gaz":712,"eolien":12601,"solaire":12612,"hydraulique":2600,"bioenergies":989,"charbon":0,"fioul":37,"ech_physiques":-12282},{"at":"2026-10-09T11:45:00+00:00","load":47877,"nucleaire":33791,"gaz":688,"eolien":13071,"solaire":12418,"hydraulique":2506,"bioenergies":989,"charbon":0,"fioul":37,"ech_physiques":-13082},{"at":"2026-10-09T12:45:00+00:00","load":48971,"nucleaire":33906,"gaz":697,"eolien":13591,"solaire":11324,"hydraulique":2472,"bioenergies":995,"charbon":0,"fioul":37,"ech_physiques":-11612},{"at":"2026-10-09T13:45:00+00:00","load":47305,"nucleaire":34145,"gaz":521,"eolien":13808,"solaire":9354,"hydraulique":2527,"bioenergies":998,"charbon":0,"fioul":37,"ech_physiques":-11463},{"at":"2026-10-09T14:45:00+00:00","load":45804,"nucleaire":35051,"gaz":498,"eolien":13691,"solaire":6606,"hydraulique":2717,"bioenergies":997,"charbon":0,"fioul":37,"ech_physiques":-11569},{"at":"2026-10-09T15:45:00+00:00","load":46419,"nucleaire":36848,"gaz":519,"eolien":13993,"solaire":3379,"hydraulique":3012,"bioenergies":994,"charbon":0,"fioul":37,"ech_physiques":-10717},{"at":"2026-10-09T16:45:00+00:00","load":48287,"nucleaire":37905,"gaz":571,"eolien":14484,"solaire":983,"hydraulique":4486,"bioenergies":991,"charbon":0,"fioul":37,"ech_physiques":-10504},{"at":"2026-10-09T17:45:00+00:00","load":49660,"nucleaire":37952,"gaz":565,"eolien":14613,"solaire":239,"hydraulique":5484,"bioenergies":1007,"charbon":0,"fioul":37,"ech_physiques":-9813},{"at":"2026-10-09T18:45:00+00:00","load":46299,"nucleaire":37989,"gaz":540,"eolien":14579,"solaire":0,"hydraulique":4502,"bioenergies":1014,"charbon":0,"fioul":37,"ech_physiques":-11793},{"at":"2026-10-09T19:45:00+00:00","load":43749,"nucleaire":37956,"gaz":546,"eolien":14965,"solaire":0,"hydraulique":3462,"bioenergies":1024,"charbon":0,"fioul":36,"ech_physiques":-12635},{"at":"2026-10-09T20:45:00+00:00","load":45387,"nucleaire":38033,"gaz":630,"eolien":14644,"solaire":0,"hydraulique":3563,"bioenergies":1022,"charbon":0,"fioul":36,"ech_physiques":-10936},{"at":"2026-10-09T21:45:00+00:00","load":43918,"nucleaire":37302,"gaz":577,"eolien":13931,"solaire":0,"hydraulique":3398,"bioenergies":1027,"charbon":0,"fioul":36,"ech_physiques":-10795},{"at":"2026-10-09T22:45:00+00:00","load":40851,"nucleaire":34732,"gaz":556,"eolien":12743,"solaire":0,"hydraulique":2695,"bioenergies":1027,"charbon":0,"fioul":37,"ech_physiques":-9347},{"at":"2026-10-09T23:45:00+00:00","load":39295,"nucleaire":34051,"gaz":539,"eolien":11630,"solaire":0,"hydraulique":2469,"bioenergies":1026,"charbon":0,"fioul":37,"ech_physiques":-8350},{"at":"2026-10-10T00:45:00+00:00","load":36552,"nucleaire":33130,"gaz":505,"eolien":10503,"solaire":0,"hydraulique":2398,"bioenergies":1028,"charbon":0,"fioul":36,"ech_physiques":-8385},{"at":"2026-10-10T01:45:00+00:00","load":34198,"nucleaire":32722,"gaz":504,"eolien":9294,"solaire":0,"hydraulique":2297,"bioenergies":1027,"charbon":0,"fioul":37,"ech_physiques":-9216},{"at":"2026-10-10T02:45:00+00:00","load":33127,"nucleaire":33122,"gaz":538,"eolien":7427,"solaire":0,"hydraulique":2302,"bioenergies":1029,"charbon":0,"fioul":37,"ech_physiques":-9204},{"at":"2026-10-10T03:45:00+00:00","load":33870,"nucleaire":33402,"gaz":516,"eolien":6781,"solaire":0,"hydraulique":2448,"bioenergies":1022,"charbon":0,"fioul":37,"ech_physiques":-8558},{"at":"2026-10-10T04:45:00+00:00","load":35481,"nucleaire":33371,"gaz":508,"eolien":6704,"solaire":0,"hydraulique":2718,"bioenergies":1026,"charbon":0,"fioul":37,"ech_physiques":-7911},{"at":"2026-10-10T05:45:00+00:00","load":37672,"nucleaire":35081,"gaz":521,"eolien":6555,"solaire":236,"hydraulique":3344,"bioenergies":1018,"charbon":0,"fioul":36,"ech_physiques":-8145},{"at":"2026-10-10T06:45:00+00:00","load":39631,"nucleaire":34932,"gaz":519,"eolien":6185,"solaire":1009,"hydraulique":3983,"bioenergies":1022,"charbon":0,"fioul":36,"ech_physiques":-7380},{"at":"2026-10-10T07:45:00+00:00","load":41510,"nucleaire":34861,"gaz":573,"eolien":5100,"solaire":4014,"hydraulique":3726,"bioenergies":1024,"charbon":0,"fioul":37,"ech_physiques":-7034},{"at":"2026-10-10T08:45:00+00:00","load":42117,"nucleaire":32547,"gaz":667,"eolien":4563,"solaire":8023,"hydraulique":2306,"bioenergies":1024,"charbon":0,"fioul":36,"ech_physiques":-5982},{"at":"2026-10-10T09:45:00+00:00","load":43759,"nucleaire":30470,"gaz":506,"eolien":5075,"solaire":11620,"hydraulique":1909,"bioenergies":1024,"charbon":0,"fioul":37,"ech_physiques":-5189},{"at":"2026-10-10T10:45:00+00:00","load":45273,"nucleaire":29947,"gaz":555,"eolien":5847,"solaire":12739,"hydraulique":1985,"bioenergies":1035,"charbon":0,"fioul":37,"ech_physiques":-4885},{"at":"2026-10-10T11:45:00+00:00","load":42419,"nucleaire":29913,"gaz":476,"eolien":6135,"solaire":12726,"hydraulique":1927,"bioenergies":1024,"charbon":0,"fioul":37,"ech_physiques":-7935},{"at":"2026-10-10T12:45:00+00:00","load":42417,"nucleaire":30855,"gaz":478,"eolien":6661,"solaire":11736,"hydraulique":2058,"bioenergies":1024,"charbon":0,"fioul":37,"ech_physiques":-8483},{"at":"2026-10-10T13:45:00+00:00","load":40039,"nucleaire":31576,"gaz":567,"eolien":4891,"solaire":8249,"hydraulique":2369,"bioenergies":1026,"charbon":0,"fioul":37,"ech_physiques":-7053},{"at":"2026-10-10T14:45:00+00:00","load":39695,"nucleaire":32428,"gaz":497,"eolien":7413,"solaire":7878,"hydraulique":2346,"bioenergies":1029,"charbon":0,"fioul":37,"ech_physiques":-10398},{"at":"2026-10-10T15:45:00+00:00","load":40400,"nucleaire":35510,"gaz":505,"eolien":6947,"solaire":4475,"hydraulique":2411,"bioenergies":1028,"charbon":0,"fioul":37,"ech_physiques":-10252},{"at":"2026-10-10T16:45:00+00:00","load":42795,"nucleaire":38160,"gaz":545,"eolien":6269,"solaire":1144,"hydraulique":5148,"bioenergies":1035,"charbon":0,"fioul":37,"ech_physiques":-9581},{"at":"2026-10-10T17:45:00+00:00","load":45015,"nucleaire":38331,"gaz":581,"eolien":5300,"solaire":220,"hydraulique":5579,"bioenergies":1026,"charbon":0,"fioul":37,"ech_physiques":-6232},{"at":"2026-10-10T18:45:00+00:00","load":42165,"nucleaire":38386,"gaz":396,"eolien":5321,"solaire":0,"hydraulique":3853,"bioenergies":1028,"charbon":0,"fioul":37,"ech_physiques":-6920},{"at":"2026-10-10T19:45:00+00:00","load":40146,"nucleaire":38379,"gaz":402,"eolien":5839,"solaire":0,"hydraulique":2812,"bioenergies":1031,"charbon":0,"fioul":36,"ech_physiques":-7656},{"at":"2026-10-10T20:45:00+00:00","load":42173,"nucleaire":38354,"gaz":487,"eolien":5766,"solaire":0,"hydraulique":2425,"bioenergies":1028,"charbon":0,"fioul":37,"ech_physiques":-4910},{"at":"2026-10-10T21:45:00+00:00","load":41867,"nucleaire":37768,"gaz":1039,"eolien":5617,"solaire":0,"hydraulique":2543,"bioenergies":1031,"charbon":0,"fioul":37,"ech_physiques":-4568},{"at":"2026-10-10T22:45:00+00:00","load":38656,"nucleaire":37767,"gaz":565,"eolien":5257,"solaire":0,"hydraulique":2797,"bioenergies":1033,"charbon":0,"fioul":37,"ech_physiques":-7549},{"at":"2026-10-10T23:45:00+00:00","load":37493,"nucleaire":37214,"gaz":563,"eolien":4623,"solaire":0,"hydraulique":2477,"bioenergies":1038,"charbon":0,"fioul":37,"ech_physiques":-7248},{"at":"2026-10-11T00:45:00+00:00","load":34594,"nucleaire":36919,"gaz":530,"eolien":4256,"solaire":0,"hydraulique":2397,"bioenergies":1034,"charbon":0,"fioul":37,"ech_physiques":-9373},{"at":"2026-10-11T01:45:00+00:00","load":32941,"nucleaire":36406,"gaz":529,"eolien":4046,"solaire":0,"hydraulique":2322,"bioenergies":1036,"charbon":0,"fioul":37,"ech_physiques":-10222},{"at":"2026-10-11T02:45:00+00:00","load":32230,"nucleaire":36458,"gaz":533,"eolien":3683,"solaire":0,"hydraulique":2262,"bioenergies":1035,"charbon":0,"fioul":37,"ech_physiques":-10339},{"at":"2026-10-11T03:45:00+00:00","load":32459,"nucleaire":36985,"gaz":599,"eolien":3476,"solaire":0,"hydraulique":2310,"bioenergies":1033,"charbon":0,"fioul":37,"ech_physiques":-10549},{"at":"2026-10-11T04:45:00+00:00","load":33352,"nucleaire":37650,"gaz":557,"eolien":3371,"solaire":0,"hydraulique":2576,"bioenergies":1030,"charbon":0,"fioul":37,"ech_physiques":-10470},{"at":"2026-10-11T05:45:00+00:00","load":34625,"nucleaire":37913,"gaz":570,"eolien":3184,"solaire":213,"hydraulique":3104,"bioenergies":1031,"charbon":0,"fioul":37,"ech_physiques":-10744},{"at":"2026-10-11T06:45:00+00:00","load":36430,"nucleaire":37892,"gaz":581,"eolien":3157,"solaire":1077,"hydraulique":3439,"bioenergies":1032,"charbon":0,"fioul":37,"ech_physiques":-10392},{"at":"2026-10-11T07:45:00+00:00","load":38255,"nucleaire":37821,"gaz":598,"eolien":2804,"solaire":4268,"hydraulique":2856,"bioenergies":1032,"charbon":0,"fioul":37,"ech_physiques":-10225},{"at":"2026-10-11T08:45:00+00:00","load":40275,"nucleaire":37632,"gaz":601,"eolien":2279,"solaire":8058,"hydraulique":1848,"bioenergies":1014,"charbon":0,"fioul":37,"ech_physiques":-9365},{"at":"2026-10-11T09:45:00+00:00","load":42193,"nucleaire":36540,"gaz":555,"eolien":2227,"solaire":11539,"hydraulique":1674,"bioenergies":1017,"charbon":0,"fioul":37,"ech_physiques":-9112},{"at":"2026-10-11T10:45:00+00:00","load":44527,"nucleaire":35936,"gaz":573,"eolien":2516,"solaire":13358,"hydraulique":1689,"bioenergies":1017,"charbon":0,"fioul":37,"ech_physiques":-8042},{"at":"2026-10-11T11:45:00+00:00","load":42116,"nucleaire":35794,"gaz":602,"eolien":2376,"solaire":13413,"hydraulique":1651,"bioenergies":1013,"charbon":0,"fioul":36,"ech_physiques":-10027},{"at":"2026-10-11T12:45:00+00:00","load":42340,"nucleaire":35933,"gaz":534,"eolien":2336,"solaire":12292,"hydraulique":1675,"bioenergies":1015,"charbon":0,"fioul":37,"ech_physiques":-9073},{"at":"2026-10-11T13:45:00+00:00","load":41288,"nucleaire":36659,"gaz":543,"eolien":2175,"solaire":9510,"hydraulique":1945,"bioenergies":1013,"charbon":0,"fioul":37,"ech_physiques":-8963},{"at":"2026-10-11T14:45:00+00:00","load":39498,"nucleaire":37724,"gaz":1094,"eolien":1817,"solaire":6501,"hydraulique":2136,"bioenergies":1015,"charbon":0,"fioul":37,"ech_physiques":-9903},{"at":"2026-10-11T15:45:00+00:00","load":40325,"nucleaire":37916,"gaz":1993,"eolien":1878,"solaire":3166,"hydraulique":4085,"bioenergies":984,"charbon":0,"fioul":37,"ech_physiques":-9628},{"at":"2026-10-11T16:45:00+00:00","load":43512,"nucleaire":37983,"gaz":3057,"eolien":1809,"solaire":867,"hydraulique":7324,"bioenergies":981,"charbon":0,"fioul":37,"ech_physiques":-8596},{"at":"2026-10-11T17:45:00+00:00","load":46537,"nucleaire":38008,"gaz":3500,"eolien":2083,"solaire":193,"hydraulique":6838,"bioenergies":1000,"charbon":0,"fioul":37,"ech_physiques":-5438},{"at":"2026-10-11T18:45:00+00:00","load":43664,"nucleaire":38033,"gaz":3527,"eolien":2426,"solaire":0,"hydraulique":5904,"bioenergies":990,"charbon":0,"fioul":37,"ech_physiques":-7280},{"at":"2026-10-11T19:45:00+00:00","load":41663,"nucleaire":38192,"gaz":3526,"eolien":2597,"solaire":0,"hydraulique":4014,"bioenergies":994,"charbon":0,"fioul":37,"ech_physiques":-7594},{"at":"2026-10-11T20:45:00+00:00","load":42769,"nucleaire":38324,"gaz":3550,"eolien":2770,"solaire":0,"hydraulique":3777,"bioenergies":1007,"charbon":0,"fioul":36,"ech_physiques":-6689},{"at":"2026-10-11T21:45:00+00:00","load":41827,"nucleaire":38486,"gaz":3399,"eolien":2957,"solaire":0,"hydraulique":2880,"bioenergies":1015,"charbon":0,"fioul":37,"ech_physiques":-6893},{"at":"2026-10-11T22:45:00+00:00","load":39069,"nucleaire":38638,"gaz":1713,"eolien":3283,"solaire":0,"hydraulique":2532,"bioenergies":1018,"charbon":0,"fioul":37,"ech_physiques":-8093},{"at":"2026-10-11T23:15:00+00:00","load":39056,"nucleaire":38691,"gaz":1426,"eolien":3401,"solaire":0,"hydraulique":2340,"bioenergies":1022,"charbon":0,"fioul":36,"ech_physiques":-7805}]}
</script>
  <script id="power-price-data" type="application/json">
{"schema":1,"source":"Fraunhofer ISE Energy-Charts","market":"day-ahead auction · France and DE-LU","unit":"EUR/MWh","generated_at":"2026-10-11T23:40:05+00:00","series":{"fr":[{"at":"2026-09-18T22:00:00+00:00","value":144.89},{"at":"2026-09-18T22:15:00+00:00","value":132.57},{"at":"2026-09-18T22:30:00+00:00","value":112.13},{"at":"2026-09-18T22:45:00+00:00","value":81.14},{"at":"2026-09-18T23:00:00+00:00","value":110.55},{"at":"2026-09-18T23:15:00+00:00","value":96.62},{"at":"2026-09-18T23:30:00+00:00","value":94.72},{"at":"2026-09-18T23:45:00+00:00","value":76.14},{"at":"2026-09-19T00:00:00+00:00","value":90.46},{"at":"2026-09-19T00:15:00+00:00","value":79.0},{"at":"2026-09-19T00:30:00+00:00","value":68.56},{"at":"2026-09-19T00:45:00+00:00","value":63.16},{"at":"2026-09-19T01:00:00+00:00","value":60.85},{"at":"2026-09-19T01:15:00+00:00","value":43.73},{"at":"2026-09-19T01:30:00+00:00","value":33.84},{"at":"2026-09-19T01:45:00+00:00","value":28.37},{"at":"2026-09-19T02:00:00+00:00","value":46.01},{"at":"2026-09-19T02:15:00+00:00","value":48.75},{"at":"2026-09-19T02:30:00+00:00","value":45.46},{"at":"2026-09-19T02:45:00+00:00","value":40.76},{"at":"2026-09-19T03:00:00+00:00","value":45.03},{"at":"2026-09-19T03:15:00+00:00","value":44.42},{"at":"2026-09-19T03:30:00+00:00","value":43.69},{"at":"2026-09-19T03:45:00+00:00","value":55.28},{"at":"2026-09-19T04:00:00+00:00","value":51.76},{"at":"2026-09-19T04:15:00+00:00","value":58.11},{"at":"2026-09-19T04:30:00+00:00","value":52.43},{"at":"2026-09-19T04:45:00+00:00","value":56.57},{"at":"2026-09-19T05:00:00+00:00","value":56.08},{"at":"2026-09-19T05:15:00+00:00","value":56.35},{"at":"2026-09-19T05:30:00+00:00","value":57.67},{"at":"2026-09-19T05:45:00+00:00","value":49.21},{"at":"2026-09-19T06:00:00+00:00","value":58.08},{"at":"2026-09-19T06:15:00+00:00","value":38.94},{"at":"2026-09-19T06:30:00+00:00","value":33.77},{"at":"2026-09-19T06:45:00+00:00","value":12.34},{"at":"2026-09-19T07:00:00+00:00","value":29.34},{"at":"2026-09-19T07:15:00+00:00","value":9.32},{"at":"2026-09-19T07:30:00+00:00","value":3.98},{"at":"2026-09-19T07:45:00+00:00","value":0.72},{"at":"2026-09-19T08:00:00+00:00","value":0.51},{"at":"2026-09-19T08:15:00+00:00","value":0.23},{"at":"2026-09-19T08:30:00+00:00","value":0.0},{"at":"2026-09-19T08:45:00+00:00","value":0.0},{"at":"2026-09-19T09:00:00+00:00","value":-0.01},{"at":"2026-09-19T09:15:00+00:00","value":-0.01},{"at":"2026-09-19T09:30:00+00:00","value":-0.01},{"at":"2026-09-19T09:45:00+00:00","value":-0.02},{"at":"2026-09-19T10:00:00+00:00","value":-0.11},{"at":"2026-09-19T10:15:00+00:00","value":-0.11},{"at":"2026-09-19T10:30:00+00:00","value":-0.11},{"at":"2026-09-19T10:45:00+00:00","value":-0.3},{"at":"2026-09-19T11:00:00+00:00","value":-0.7},{"at":"2026-09-19T11:15:00+00:00","value":-0.82},{"at":"2026-09-19T11:30:00+00:00","value":-1.06},{"at":"2026-09-19T11:45:00+00:00","value":-1.29},{"at":"2026-09-19T12:00:00+00:00","value":-1.0},{"at":"2026-09-19T12:15:00+00:00","value":-1.0},{"at":"2026-09-19T12:30:00+00:00","value":-0.91},{"at":"2026-09-19T12:45:00+00:00","value":-0.78},{"at":"2026-09-19T13:00:00+00:00","value":-0.5},{"at":"2026-09-19T13:15:00+00:00","value":-0.19},{"at":"2026-09-19T13:30:00+00:00","value":-0.11},{"at":"2026-09-19T13:45:00+00:00","value":-0.09},{"at":"2026-09-19T14:00:00+00:00","value":-0.1},{"at":"2026-09-19T14:15:00+00:00","value":-0.07},{"at":"2026-09-19T14:30:00+00:00","value":-0.01},{"at":"2026-09-19T14:45:00+00:00","value":-0.01},{"at":"2026-09-19T15:00:00+00:00","value":-0.01},{"at":"2026-09-19T15:15:00+00:00","value":0.0},{"at":"2026-09-19T15:30:00+00:00","value":0.51},{"at":"2026-09-19T15:45:00+00:00","value":2.51},{"at":"2026-09-19T16:00:00+00:00","value":19.17},{"at":"2026-09-19T16:15:00+00:00","value":64.08},{"at":"2026-09-19T16:30:00+00:00","value":94.5},{"at":"2026-09-19T16:45:00+00:00","value":115.03},{"at":"2026-09-19T17:00:00+00:00","value":115.0},{"at":"2026-09-19T17:15:00+00:00","value":136.34},{"at":"2026-09-19T17:30:00+00:00","value":149.32},{"at":"2026-09-19T17:45:00+00:00","value":154.22},{"at":"2026-09-19T18:00:00+00:00","value":147.94},{"at":"2026-09-19T18:15:00+00:00","value":134.32},{"at":"2026-09-19T18:30:00+00:00","value":120.54},{"at":"2026-09-19T18:45:00+00:00","value":110.84},{"at":"2026-09-19T19:00:00+00:00","value":121.37},{"at":"2026-09-19T19:15:00+00:00","value":111.72},{"at":"2026-09-19T19:30:00+00:00","value":107.12},{"at":"2026-09-19T19:45:00+00:00","value":87.06},{"at":"2026-09-19T20:00:00+00:00","value":103.17},{"at":"2026-09-19T20:15:00+00:00","value":102.91},{"at":"2026-09-19T20:30:00+00:00","value":102.44},{"at":"2026-09-19T20:45:00+00:00","value":100.74},{"at":"2026-09-19T21:00:00+00:00","value":103.81},{"at":"2026-09-19T21:15:00+00:00","value":98.49},{"at":"2026-09-19T21:30:00+00:00","value":97.84},{"at":"2026-09-19T21:45:00+00:00","value":89.06},{"at":"2026-09-19T22:00:00+00:00","value":38.91},{"at":"2026-09-19T22:15:00+00:00","value":39.31},{"at":"2026-09-19T22:30:00+00:00","value":36.87},{"at":"2026-09-19T22:45:00+00:00","value":33.78},{"at":"2026-09-19T23:00:00+00:00","value":40.7},{"at":"2026-09-19T23:15:00+00:00","value":35.64},{"at":"2026-09-19T23:30:00+00:00","value":35.19},{"at":"2026-09-19T23:45:00+00:00","value":32.15},{"at":"2026-09-20T00:00:00+00:00","value":30.83},{"at":"2026-09-20T00:15:00+00:00","value":32.73},{"at":"2026-09-20T00:30:00+00:00","value":32.93},{"at":"2026-09-20T00:45:00+00:00","value":28.67},{"at":"2026-09-20T01:00:00+00:00","value":28.29},{"at":"2026-09-20T01:15:00+00:00","value":28.37},{"at":"2026-09-20T01:30:00+00:00","value":27.98},{"at":"2026-09-20T01:45:00+00:00","value":25.51},{"at":"2026-09-20T02:00:00+00:00","value":27.21},{"at":"2026-09-20T02:15:00+00:00","value":24.79},{"at":"2026-09-20T02:30:00+00:00","value":23.69},{"at":"2026-09-20T02:45:00+00:00","value":23.11},{"at":"2026-09-20T03:00:00+00:00","value":27.35},{"at":"2026-09-20T03:15:00+00:00","value":27.48},{"at":"2026-09-20T03:30:00+00:00","value":23.59},{"at":"2026-09-20T03:45:00+00:00","value":24.68},{"at":"2026-09-20T04:00:00+00:00","value":27.51},{"at":"2026-09-20T04:15:00+00:00","value":30.91},{"at":"2026-09-20T04:30:00+00:00","value":31.69},{"at":"2026-09-20T04:45:00+00:00","value":33.31},{"at":"2026-09-20T05:00:00+00:00","value":33.43},{"at":"2026-09-20T05:15:00+00:00","value":32.67},{"at":"2026-09-20T05:30:00+00:00","value":34.73},{"at":"2026-09-20T05:45:00+00:00","value":22.25},{"at":"2026-09-20T06:00:00+00:00","value":40.93},{"at":"2026-09-20T06:15:00+00:00","value":20.4},{"at":"2026-09-20T06:30:00+00:00","value":10.61},{"at":"2026-09-20T06:45:00+00:00","value":5.12},{"at":"2026-09-20T07:00:00+00:00","value":8.98},{"at":"2026-09-20T07:15:00+00:00","value":5.19},{"at":"2026-09-20T07:30:00+00:00","value":1.4},{"at":"2026-09-20T07:45:00+00:00","value":0.01},{"at":"2026-09-20T08:00:00+00:00","value":0.01},{"at":"2026-09-20T08:15:00+00:00","value":0.0},{"at":"2026-09-20T08:30:00+00:00","value":-0.01},{"at":"2026-09-20T08:45:00+00:00","value":-0.03},{"at":"2026-09-20T09:00:00+00:00","value":-0.04},{"at":"2026-09-20T09:15:00+00:00","value":-0.09},{"at":"2026-09-20T09:30:00+00:00","value":-0.11},{"at":"2026-09-20T09:45:00+00:00","value":-0.11},{"at":"2026-09-20T10:00:00+00:00","value":-0.23},{"at":"2026-09-20T10:15:00+00:00","value":-0.23},{"at":"2026-09-20T10:30:00+00:00","value":-0.31},{"at":"2026-09-20T10:45:00+00:00","value":-0.81},{"at":"2026-09-20T11:00:00+00:00","value":-1.0},{"at":"2026-09-20T11:15:00+00:00","value":-1.06},{"at":"2026-09-20T11:30:00+00:00","value":-1.14},{"at":"2026-09-20T11:45:00+00:00","value":-1.11},{"at":"2026-09-20T12:00:00+00:00","value":-1.0},{"at":"2026-09-20T12:15:00+00:00","value":-1.0},{"at":"2026-09-20T12:30:00+00:00","value":-1.0},{"at":"2026-09-20T12:45:00+00:00","value":-1.0},{"at":"2026-09-20T13:00:00+00:00","value":-1.0},{"at":"2026-09-20T13:15:00+00:00","value":-0.82},{"at":"2026-09-20T13:30:00+00:00","value":-0.8},{"at":"2026-09-20T13:45:00+00:00","value":-0.78},{"at":"2026-09-20T14:00:00+00:00","value":-0.01},{"at":"2026-09-20T14:15:00+00:00","value":-0.01},{"at":"2026-09-20T14:30:00+00:00","value":0.0},{"at":"2026-09-20T14:45:00+00:00","value":0.0},{"at":"2026-09-20T15:00:00+00:00","value":7.0},{"at":"2026-09-20T15:15:00+00:00","value":18.8},{"at":"2026-09-20T15:30:00+00:00","value":42.01},{"at":"2026-09-20T15:45:00+00:00","value":72.19},{"at":"2026-09-20T16:00:00+00:00","value":70.23},{"at":"2026-09-20T16:15:00+00:00","value":114.46},{"at":"2026-09-20T16:30:00+00:00","value":148.34},{"at":"2026-09-20T16:45:00+00:00","value":237.8},{"at":"2026-09-20T17:00:00+00:00","value":162.96},{"at":"2026-09-20T17:15:00+00:00","value":230.0},{"at":"2026-09-20T17:30:00+00:00","value":200.74},{"at":"2026-09-20T17:45:00+00:00","value":225.57},{"at":"2026-09-20T18:00:00+00:00","value":198.9},{"at":"2026-09-20T18:15:00+00:00","value":200.74},{"at":"2026-09-20T18:30:00+00:00","value":205.71},{"at":"2026-09-20T18:45:00+00:00","value":200.74},{"at":"2026-09-20T19:00:00+00:00","value":211.13},{"at":"2026-09-20T19:15:00+00:00","value":200.99},{"at":"2026-09-20T19:30:00+00:00","value":191.42},{"at":"2026-09-20T19:45:00+00:00","value":192.36},{"at":"2026-09-20T20:00:00+00:00","value":200.74},{"at":"2026-09-20T20:15:00+00:00","value":189.94},{"at":"2026-09-20T20:30:00+00:00","value":195.87},{"at":"2026-09-20T20:45:00+00:00","value":186.76},{"at":"2026-09-20T21:00:00+00:00","value":180.56},{"at":"2026-09-20T21:15:00+00:00","value":186.76},{"at":"2026-09-20T21:30:00+00:00","value":186.18},{"at":"2026-09-20T21:45:00+00:00","value":166.5},{"at":"2026-09-20T22:00:00+00:00","value":200.76},{"at":"2026-09-20T22:15:00+00:00","value":190.0},{"at":"2026-09-20T22:30:00+00:00","value":165.94},{"at":"2026-09-20T22:45:00+00:00","value":145.17},{"at":"2026-09-20T23:00:00+00:00","value":169.93},{"at":"2026-09-20T23:15:00+00:00","value":148.45},{"at":"2026-09-20T23:30:00+00:00","value":153.27},{"at":"2026-09-20T23:45:00+00:00","value":136.33},{"at":"2026-09-21T00:00:00+00:00","value":150.9},{"at":"2026-09-21T00:15:00+00:00","value":135.56},{"at":"2026-09-21T00:30:00+00:00","value":130.4},{"at":"2026-09-21T00:45:00+00:00","value":139.13},{"at":"2026-09-21T01:00:00+00:00","value":139.24},{"at":"2026-09-21T01:15:00+00:00","value":143.39},{"at":"2026-09-21T01:30:00+00:00","value":136.01},{"at":"2026-09-21T01:45:00+00:00","value":120.87},{"at":"2026-09-21T02:00:00+00:00","value":131.59},{"at":"2026-09-21T02:15:00+00:00","value":134.24},{"at":"2026-09-21T02:30:00+00:00","value":137.99},{"at":"2026-09-21T02:45:00+00:00","value":129.67},{"at":"2026-09-21T03:00:00+00:00","value":124.48},{"at":"2026-09-21T03:15:00+00:00","value":149.01},{"at":"2026-09-21T03:30:00+00:00","value":141.87},{"at":"2026-09-21T03:45:00+00:00","value":158.0},{"at":"2026-09-21T04:00:00+00:00","value":163.14},{"at":"2026-09-21T04:15:00+00:00","value":186.53},{"at":"2026-09-21T04:30:00+00:00","value":182.99},{"at":"2026-09-21T04:45:00+00:00","value":187.69},{"at":"2026-09-21T05:00:00+00:00","value":211.7},{"at":"2026-09-21T05:15:00+00:00","value":224.0},{"at":"2026-09-21T05:30:00+00:00","value":227.0},{"at":"2026-09-21T05:45:00+00:00","value":230.57},{"at":"2026-09-21T06:00:00+00:00","value":263.9},{"at":"2026-09-21T06:15:00+00:00","value":246.23},{"at":"2026-09-21T06:30:00+00:00","value":226.0},{"at":"2026-09-21T06:45:00+00:00","value":195.0},{"at":"2026-09-21T07:00:00+00:00","value":212.25},{"at":"2026-09-21T07:15:00+00:00","value":186.25},{"at":"2026-09-21T07:30:00+00:00","value":167.52},{"at":"2026-09-21T07:45:00+00:00","value":110.77},{"at":"2026-09-21T08:00:00+00:00","value":131.12},{"at":"2026-09-21T08:15:00+00:00","value":91.6},{"at":"2026-09-21T08:30:00+00:00","value":83.6},{"at":"2026-09-21T08:45:00+00:00","value":48.5},{"at":"2026-09-21T09:00:00+00:00","value":55.68},{"at":"2026-09-21T09:15:00+00:00","value":46.38},{"at":"2026-09-21T09:30:00+00:00","value":35.94},{"at":"2026-09-21T09:45:00+00:00","value":33.22},{"at":"2026-09-21T10:00:00+00:00","value":32.17},{"at":"2026-09-21T10:15:00+00:00","value":28.15},{"at":"2026-09-21T10:30:00+00:00","value":28.0},{"at":"2026-09-21T10:45:00+00:00","value":23.34},{"at":"2026-09-21T11:00:00+00:00","value":23.47},{"at":"2026-09-21T11:15:00+00:00","value":20.17},{"at":"2026-09-21T11:30:00+00:00","value":16.75},{"at":"2026-09-21T11:45:00+00:00","value":16.38},{"at":"2026-09-21T12:00:00+00:00","value":20.02},{"at":"2026-09-21T12:15:00+00:00","value":22.08},{"at":"2026-09-21T12:30:00+00:00","value":22.54},{"at":"2026-09-21T12:45:00+00:00","value":26.11},{"at":"2026-09-21T13:00:00+00:00","value":25.67},{"at":"2026-09-21T13:15:00+00:00","value":31.3},{"at":"2026-09-21T13:30:00+00:00","value":20.24},{"at":"2026-09-21T13:45:00+00:00","value":17.24},{"at":"2026-09-21T14:00:00+00:00","value":37.19},{"at":"2026-09-21T14:15:00+00:00","value":76.19},{"at":"2026-09-21T14:30:00+00:00","value":54.27},{"at":"2026-09-21T14:45:00+00:00","value":52.38},{"at":"2026-09-21T15:00:00+00:00","value":75.23},{"at":"2026-09-21T15:15:00+00:00","value":111.75},{"at":"2026-09-21T15:30:00+00:00","value":163.93},{"at":"2026-09-21T15:45:00+00:00","value":208.84},{"at":"2026-09-21T16:00:00+00:00","value":174.12},{"at":"2026-09-21T16:15:00+00:00","value":202.94},{"at":"2026-09-21T16:30:00+00:00","value":224.23},{"at":"2026-09-21T16:45:00+00:00","value":261.77},{"at":"2026-09-21T17:00:00+00:00","value":221.71},{"at":"2026-09-21T17:15:00+00:00","value":224.92},{"at":"2026-09-21T17:30:00+00:00","value":251.9},{"at":"2026-09-21T17:45:00+00:00","value":276.54},{"at":"2026-09-21T18:00:00+00:00","value":251.3},{"at":"2026-09-21T18:15:00+00:00","value":250.28},{"at":"2026-09-21T18:30:00+00:00","value":243.48},{"at":"2026-09-21T18:45:00+00:00","value":219.04},{"at":"2026-09-21T19:00:00+00:00","value":232.7},{"at":"2026-09-21T19:15:00+00:00","value":219.22},{"at":"2026-09-21T19:30:00+00:00","value":215.05},{"at":"2026-09-21T19:45:00+00:00","value":207.8},{"at":"2026-09-21T20:00:00+00:00","value":216.63},{"at":"2026-09-21T20:15:00+00:00","value":205.54},{"at":"2026-09-21T20:30:00+00:00","value":206.93},{"at":"2026-09-21T20:45:00+00:00","value":197.26},{"at":"2026-09-21T21:00:00+00:00","value":199.01},{"at":"2026-09-21T21:15:00+00:00","value":185.42},{"at":"2026-09-21T21:30:00+00:00","value":187.25},{"at":"2026-09-21T21:45:00+00:00","value":172.4},{"at":"2026-09-21T22:00:00+00:00","value":191.21},{"at":"2026-09-21T22:15:00+00:00","value":184.04},{"at":"2026-09-21T22:30:00+00:00","value":177.73},{"at":"2026-09-21T22:45:00+00:00","value":176.79},{"at":"2026-09-21T23:00:00+00:00","value":178.2},{"at":"2026-09-21T23:15:00+00:00","value":175.61},{"at":"2026-09-21T23:30:00+00:00","value":177.48},{"at":"2026-09-21T23:45:00+00:00","value":176.66},{"at":"2026-09-22T00:00:00+00:00","value":176.87},{"at":"2026-09-22T00:15:00+00:00","value":175.45},{"at":"2026-09-22T00:30:00+00:00","value":173.57},{"at":"2026-09-22T00:45:00+00:00","value":172.68},{"at":"2026-09-22T01:00:00+00:00","value":174.62},{"at":"2026-09-22T01:15:00+00:00","value":171.86},{"at":"2026-09-22T01:30:00+00:00","value":171.27},{"at":"2026-09-22T01:45:00+00:00","value":172.25},{"at":"2026-09-22T02:00:00+00:00","value":175.15},{"at":"2026-09-22T02:15:00+00:00","value":174.73},{"at":"2026-09-22T02:30:00+00:00","value":176.45},{"at":"2026-09-22T02:45:00+00:00","value":181.0},{"at":"2026-09-22T03:00:00+00:00","value":170.03},{"at":"2026-09-22T03:15:00+00:00","value":181.47},{"at":"2026-09-22T03:30:00+00:00","value":192.99},{"at":"2026-09-22T03:45:00+00:00","value":185.53},{"at":"2026-09-22T04:00:00+00:00","value":199.28},{"at":"2026-09-22T04:15:00+00:00","value":201.5},{"at":"2026-09-22T04:30:00+00:00","value":202.1},{"at":"2026-09-22T04:45:00+00:00","value":210.0},{"at":"2026-09-22T05:00:00+00:00","value":226.0},{"at":"2026-09-22T05:15:00+00:00","value":228.72},{"at":"2026-09-22T05:30:00+00:00","value":237.23},{"at":"2026-09-22T05:45:00+00:00","value":244.71},{"at":"2026-09-22T06:00:00+00:00","value":282.29},{"at":"2026-09-22T06:15:00+00:00","value":268.06},{"at":"2026-09-22T06:30:00+00:00","value":240.76},{"at":"2026-09-22T06:45:00+00:00","value":204.98},{"at":"2026-09-22T07:00:00+00:00","value":215.0},{"at":"2026-09-22T07:15:00+00:00","value":193.91},{"at":"2026-09-22T07:30:00+00:00","value":186.93},{"at":"2026-09-22T07:45:00+00:00","value":166.18},{"at":"2026-09-22T08:00:00+00:00","value":163.0},{"at":"2026-09-22T08:15:00+00:00","value":120.5},{"at":"2026-09-22T08:30:00+00:00","value":95.06},{"at":"2026-09-22T08:45:00+00:00","value":40.0},{"at":"2026-09-22T09:00:00+00:00","value":52.0},{"at":"2026-09-22T09:15:00+00:00","value":38.99},{"at":"2026-09-22T09:30:00+00:00","value":38.66},{"at":"2026-09-22T09:45:00+00:00","value":27.0},{"at":"2026-09-22T10:00:00+00:00","value":20.01},{"at":"2026-09-22T10:15:00+00:00","value":19.64},{"at":"2026-09-22T10:30:00+00:00","value":12.96},{"at":"2026-09-22T10:45:00+00:00","value":10.01},{"at":"2026-09-22T11:00:00+00:00","value":4.61},{"at":"2026-09-22T11:15:00+00:00","value":3.43},{"at":"2026-09-22T11:30:00+00:00","value":1.99},{"at":"2026-09-22T11:45:00+00:00","value":2.0},{"at":"2026-09-22T12:00:00+00:00","value":6.07},{"at":"2026-09-22T12:15:00+00:00","value":15.1},{"at":"2026-09-22T12:30:00+00:00","value":20.17},{"at":"2026-09-22T12:45:00+00:00","value":24.11},{"at":"2026-09-22T13:00:00+00:00","value":25.0},{"at":"2026-09-22T13:15:00+00:00","value":24.01},{"at":"2026-09-22T13:30:00+00:00","value":22.14},{"at":"2026-09-22T13:45:00+00:00","value":24.01},{"at":"2026-09-22T14:00:00+00:00","value":32.5},{"at":"2026-09-22T14:15:00+00:00","value":39.09},{"at":"2026-09-22T14:30:00+00:00","value":54.41},{"at":"2026-09-22T14:45:00+00:00","value":70.0},{"at":"2026-09-22T15:00:00+00:00","value":92.55},{"at":"2026-09-22T15:15:00+00:00","value":107.32},{"at":"2026-09-22T15:30:00+00:00","value":156.64},{"at":"2026-09-22T15:45:00+00:00","value":169.11},{"at":"2026-09-22T16:00:00+00:00","value":207.24},{"at":"2026-09-22T16:15:00+00:00","value":218.14},{"at":"2026-09-22T16:30:00+00:00","value":244.63},{"at":"2026-09-22T16:45:00+00:00","value":268.06},{"at":"2026-09-22T17:00:00+00:00","value":250.0},{"at":"2026-09-22T17:15:00+00:00","value":268.06},{"at":"2026-09-22T17:30:00+00:00","value":287.94},{"at":"2026-09-22T17:45:00+00:00","value":300.0},{"at":"2026-09-22T18:00:00+00:00","value":285.0},{"at":"2026-09-22T18:15:00+00:00","value":290.01},{"at":"2026-09-22T18:30:00+00:00","value":278.18},{"at":"2026-09-22T18:45:00+00:00","value":276.51},{"at":"2026-09-22T19:00:00+00:00","value":272.51},{"at":"2026-09-22T19:15:00+00:00","value":251.44},{"at":"2026-09-22T19:30:00+00:00","value":255.83},{"at":"2026-09-22T19:45:00+00:00","value":227.5},{"at":"2026-09-22T20:00:00+00:00","value":253.01},{"at":"2026-09-22T20:15:00+00:00","value":231.8},{"at":"2026-09-22T20:30:00+00:00","value":232.19},{"at":"2026-09-22T20:45:00+00:00","value":224.41},{"at":"2026-09-22T21:00:00+00:00","value":224.0},{"at":"2026-09-22T21:15:00+00:00","value":214.54},{"at":"2026-09-22T21:30:00+00:00","value":210.21},{"at":"2026-09-22T21:45:00+00:00","value":201.18},{"at":"2026-09-22T22:00:00+00:00","value":194.55},{"at":"2026-09-22T22:15:00+00:00","value":188.51},{"at":"2026-09-22T22:30:00+00:00","value":186.39},{"at":"2026-09-22T22:45:00+00:00","value":166.66},{"at":"2026-09-22T23:00:00+00:00","value":175.28},{"at":"2026-09-22T23:15:00+00:00","value":174.88},{"at":"2026-09-22T23:30:00+00:00","value":173.68},{"at":"2026-09-22T23:45:00+00:00","value":179.76},{"at":"2026-09-23T00:00:00+00:00","value":174.52},{"at":"2026-09-23T00:15:00+00:00","value":171.1},{"at":"2026-09-23T00:30:00+00:00","value":164.07},{"at":"2026-09-23T00:45:00+00:00","value":161.89},{"at":"2026-09-23T01:00:00+00:00","value":152.23},{"at":"2026-09-23T01:15:00+00:00","value":156.85},{"at":"2026-09-23T01:30:00+00:00","value":155.77},{"at":"2026-09-23T01:45:00+00:00","value":160.27},{"at":"2026-09-23T02:00:00+00:00","value":151.49},{"at":"2026-09-23T02:15:00+00:00","value":155.69},{"at":"2026-09-23T02:30:00+00:00","value":157.22},{"at":"2026-09-23T02:45:00+00:00","value":161.57},{"at":"2026-09-23T03:00:00+00:00","value":161.23},{"at":"2026-09-23T03:15:00+00:00","value":167.04},{"at":"2026-09-23T03:30:00+00:00","value":175.01},{"at":"2026-09-23T03:45:00+00:00","value":157.83},{"at":"2026-09-23T04:00:00+00:00","value":179.66},{"at":"2026-09-23T04:15:00+00:00","value":205.12},{"at":"2026-09-23T04:30:00+00:00","value":170.94},{"at":"2026-09-23T04:45:00+00:00","value":197.13},{"at":"2026-09-23T05:00:00+00:00","value":206.5},{"at":"2026-09-23T05:15:00+00:00","value":219.88},{"at":"2026-09-23T05:30:00+00:00","value":225.0},{"at":"2026-09-23T05:45:00+00:00","value":226.9},{"at":"2026-09-23T06:00:00+00:00","value":257.65},{"at":"2026-09-23T06:15:00+00:00","value":240.5},{"at":"2026-09-23T06:30:00+00:00","value":224.31},{"at":"2026-09-23T06:45:00+00:00","value":189.12},{"at":"2026-09-23T07:00:00+00:00","value":207.12},{"at":"2026-09-23T07:15:00+00:00","value":193.88},{"at":"2026-09-23T07:30:00+00:00","value":170.82},{"at":"2026-09-23T07:45:00+00:00","value":146.46},{"at":"2026-09-23T08:00:00+00:00","value":166.24},{"at":"2026-09-23T08:15:00+00:00","value":148.1},{"at":"2026-09-23T08:30:00+00:00","value":134.95},{"at":"2026-09-23T08:45:00+00:00","value":93.3},{"at":"2026-09-23T09:00:00+00:00","value":90.0},{"at":"2026-09-23T09:15:00+00:00","value":73.59},{"at":"2026-09-23T09:30:00+00:00","value":57.59},{"at":"2026-09-23T09:45:00+00:00","value":38.99},{"at":"2026-09-23T10:00:00+00:00","value":40.0},{"at":"2026-09-23T10:15:00+00:00","value":35.0},{"at":"2026-09-23T10:30:00+00:00","value":35.0},{"at":"2026-09-23T10:45:00+00:00","value":30.0},{"at":"2026-09-23T11:00:00+00:00","value":24.01},{"at":"2026-09-23T11:15:00+00:00","value":15.0},{"at":"2026-09-23T11:30:00+00:00","value":11.1},{"at":"2026-09-23T11:45:00+00:00","value":10.02},{"at":"2026-09-23T12:00:00+00:00","value":24.01},{"at":"2026-09-23T12:15:00+00:00","value":23.38},{"at":"2026-09-23T12:30:00+00:00","value":25.58},{"at":"2026-09-23T12:45:00+00:00","value":27.23},{"at":"2026-09-23T13:00:00+00:00","value":25.71},{"at":"2026-09-23T13:15:00+00:00","value":28.28},{"at":"2026-09-23T13:30:00+00:00","value":34.08},{"at":"2026-09-23T13:45:00+00:00","value":38.77},{"at":"2026-09-23T14:00:00+00:00","value":38.77},{"at":"2026-09-23T14:15:00+00:00","value":51.51},{"at":"2026-09-23T14:30:00+00:00","value":74.0},{"at":"2026-09-23T14:45:00+00:00","value":107.72},{"at":"2026-09-23T15:00:00+00:00","value":114.94},{"at":"2026-09-23T15:15:00+00:00","value":111.65},{"at":"2026-09-23T15:30:00+00:00","value":141.64},{"at":"2026-09-23T15:45:00+00:00","value":152.38},{"at":"2026-09-23T16:00:00+00:00","value":175.05},{"at":"2026-09-23T16:15:00+00:00","value":187.45},{"at":"2026-09-23T16:30:00+00:00","value":191.65},{"at":"2026-09-23T16:45:00+00:00","value":230.21},{"at":"2026-09-23T17:00:00+00:00","value":240.5},{"at":"2026-09-23T17:15:00+00:00","value":255.32},{"at":"2026-09-23T17:30:00+00:00","value":264.47},{"at":"2026-09-23T17:45:00+00:00","value":274.36},{"at":"2026-09-23T18:00:00+00:00","value":266.17},{"at":"2026-09-23T18:15:00+00:00","value":252.97},{"at":"2026-09-23T18:30:00+00:00","value":237.18},{"at":"2026-09-23T18:45:00+00:00","value":212.96},{"at":"2026-09-23T19:00:00+00:00","value":219.26},{"at":"2026-09-23T19:15:00+00:00","value":210.39},{"at":"2026-09-23T19:30:00+00:00","value":196.79},{"at":"2026-09-23T19:45:00+00:00","value":184.9},{"at":"2026-09-23T20:00:00+00:00","value":189.38},{"at":"2026-09-23T20:15:00+00:00","value":181.48},{"at":"2026-09-23T20:30:00+00:00","value":179.9},{"at":"2026-09-23T20:45:00+00:00","value":172.87},{"at":"2026-09-23T21:00:00+00:00","value":176.08},{"at":"2026-09-23T21:15:00+00:00","value":164.18},{"at":"2026-09-23T21:30:00+00:00","value":166.93},{"at":"2026-09-23T21:45:00+00:00","value":161.77},{"at":"2026-09-23T22:00:00+00:00","value":194.36},{"at":"2026-09-23T22:15:00+00:00","value":177.51},{"at":"2026-09-23T22:30:00+00:00","value":173.33},{"at":"2026-09-23T22:45:00+00:00","value":179.6},{"at":"2026-09-23T23:00:00+00:00","value":186.71},{"at":"2026-09-23T23:15:00+00:00","value":177.91},{"at":"2026-09-23T23:30:00+00:00","value":180.46},{"at":"2026-09-23T23:45:00+00:00","value":160.68},{"at":"2026-09-24T00:00:00+00:00","value":156.42},{"at":"2026-09-24T00:15:00+00:00","value":147.84},{"at":"2026-09-24T00:30:00+00:00","value":142.51},{"at":"2026-09-24T00:45:00+00:00","value":134.99},{"at":"2026-09-24T01:00:00+00:00","value":141.93},{"at":"2026-09-24T01:15:00+00:00","value":135.29},{"at":"2026-09-24T01:30:00+00:00","value":141.99},{"at":"2026-09-24T01:45:00+00:00","value":136.17},{"at":"2026-09-24T02:00:00+00:00","value":147.26},{"at":"2026-09-24T02:15:00+00:00","value":147.99},{"at":"2026-09-24T02:30:00+00:00","value":149.37},{"at":"2026-09-24T02:45:00+00:00","value":158.24},{"at":"2026-09-24T03:00:00+00:00","value":174.82},{"at":"2026-09-24T03:15:00+00:00","value":149.98},{"at":"2026-09-24T03:30:00+00:00","value":153.0},{"at":"2026-09-24T03:45:00+00:00","value":169.69},{"at":"2026-09-24T04:00:00+00:00","value":164.62},{"at":"2026-09-24T04:15:00+00:00","value":179.25},{"at":"2026-09-24T04:30:00+00:00","value":196.3},{"at":"2026-09-24T04:45:00+00:00","value":200.0},{"at":"2026-09-24T05:00:00+00:00","value":200.0},{"at":"2026-09-24T05:15:00+00:00","value":210.0},{"at":"2026-09-24T05:30:00+00:00","value":215.37},{"at":"2026-09-24T05:45:00+00:00","value":220.42},{"at":"2026-09-24T06:00:00+00:00","value":250.0},{"at":"2026-09-24T06:15:00+00:00","value":238.03},{"at":"2026-09-24T06:30:00+00:00","value":214.97},{"at":"2026-09-24T06:45:00+00:00","value":195.98},{"at":"2026-09-24T07:00:00+00:00","value":221.84},{"at":"2026-09-24T07:15:00+00:00","value":194.99},{"at":"2026-09-24T07:30:00+00:00","value":174.0},{"at":"2026-09-24T07:45:00+00:00","value":161.75},{"at":"2026-09-24T08:00:00+00:00","value":165.1},{"at":"2026-09-24T08:15:00+00:00","value":167.14},{"at":"2026-09-24T08:30:00+00:00","value":147.56},{"at":"2026-09-24T08:45:00+00:00","value":116.36},{"at":"2026-09-24T09:00:00+00:00","value":126.36},{"at":"2026-09-24T09:15:00+00:00","value":78.86},{"at":"2026-09-24T09:30:00+00:00","value":60.02},{"at":"2026-09-24T09:45:00+00:00","value":53.68},{"at":"2026-09-24T10:00:00+00:00","value":50.1},{"at":"2026-09-24T10:15:00+00:00","value":38.55},{"at":"2026-09-24T10:30:00+00:00","value":35.48},{"at":"2026-09-24T10:45:00+00:00","value":38.55},{"at":"2026-09-24T11:00:00+00:00","value":27.0},{"at":"2026-09-24T11:15:00+00:00","value":23.5},{"at":"2026-09-24T11:30:00+00:00","value":17.62},{"at":"2026-09-24T11:45:00+00:00","value":20.0},{"at":"2026-09-24T12:00:00+00:00","value":30.0},{"at":"2026-09-24T12:15:00+00:00","value":34.99},{"at":"2026-09-24T12:30:00+00:00","value":38.66},{"at":"2026-09-24T12:45:00+00:00","value":38.55},{"at":"2026-09-24T13:00:00+00:00","value":38.66},{"at":"2026-09-24T13:15:00+00:00","value":38.77},{"at":"2026-09-24T13:30:00+00:00","value":38.99},{"at":"2026-09-24T13:45:00+00:00","value":73.61},{"at":"2026-09-24T14:00:00+00:00","value":74.07},{"at":"2026-09-24T14:15:00+00:00","value":95.13},{"at":"2026-09-24T14:30:00+00:00","value":118.13},{"at":"2026-09-24T14:45:00+00:00","value":152.8},{"at":"2026-09-24T15:00:00+00:00","value":141.6},{"at":"2026-09-24T15:15:00+00:00","value":170.89},{"at":"2026-09-24T15:30:00+00:00","value":171.17},{"at":"2026-09-24T15:45:00+00:00","value":214.43},{"at":"2026-09-24T16:00:00+00:00","value":169.37},{"at":"2026-09-24T16:15:00+00:00","value":218.93},{"at":"2026-09-24T16:30:00+00:00","value":233.27},{"at":"2026-09-24T16:45:00+00:00","value":261.0},{"at":"2026-09-24T17:00:00+00:00","value":251.4},{"at":"2026-09-24T17:15:00+00:00","value":265.8},{"at":"2026-09-24T17:30:00+00:00","value":267.94},{"at":"2026-09-24T17:45:00+00:00","value":288.23},{"at":"2026-09-24T18:00:00+00:00","value":272.65},{"at":"2026-09-24T18:15:00+00:00","value":265.8},{"at":"2026-09-24T18:30:00+00:00","value":253.5},{"at":"2026-09-24T18:45:00+00:00","value":248.05},{"at":"2026-09-24T19:00:00+00:00","value":240.29},{"at":"2026-09-24T19:15:00+00:00","value":230.9},{"at":"2026-09-24T19:30:00+00:00","value":224.17},{"at":"2026-09-24T19:45:00+00:00","value":210.4},{"at":"2026-09-24T20:00:00+00:00","value":222.09},{"at":"2026-09-24T20:15:00+00:00","value":205.95},{"at":"2026-09-24T20:30:00+00:00","value":202.67},{"at":"2026-09-24T20:45:00+00:00","value":194.87},{"at":"2026-09-24T21:00:00+00:00","value":198.86},{"at":"2026-09-24T21:15:00+00:00","value":190.36},{"at":"2026-09-24T21:30:00+00:00","value":187.58},{"at":"2026-09-24T21:45:00+00:00","value":182.5},{"at":"2026-09-24T22:00:00+00:00","value":197.12},{"at":"2026-09-24T22:15:00+00:00","value":184.82},{"at":"2026-09-24T22:30:00+00:00","value":176.3},{"at":"2026-09-24T22:45:00+00:00","value":170.83},{"at":"2026-09-24T23:00:00+00:00","value":175.34},{"at":"2026-09-24T23:15:00+00:00","value":171.96},{"at":"2026-09-24T23:30:00+00:00","value":171.6},{"at":"2026-09-24T23:45:00+00:00","value":170.96},{"at":"2026-09-25T00:00:00+00:00","value":168.83},{"at":"2026-09-25T00:15:00+00:00","value":167.62},{"at":"2026-09-25T00:30:00+00:00","value":166.96},{"at":"2026-09-25T00:45:00+00:00","value":162.32},{"at":"2026-09-25T01:00:00+00:00","value":165.48},{"at":"2026-09-25T01:15:00+00:00","value":163.57},{"at":"2026-09-25T01:30:00+00:00","value":163.99},{"at":"2026-09-25T01:45:00+00:00","value":169.14},{"at":"2026-09-25T02:00:00+00:00","value":158.58},{"at":"2026-09-25T02:15:00+00:00","value":155.25},{"at":"2026-09-25T02:30:00+00:00","value":157.09},{"at":"2026-09-25T02:45:00+00:00","value":164.94},{"at":"2026-09-25T03:00:00+00:00","value":167.4},{"at":"2026-09-25T03:15:00+00:00","value":169.26},{"at":"2026-09-25T03:30:00+00:00","value":187.11},{"at":"2026-09-25T03:45:00+00:00","value":177.6},{"at":"2026-09-25T04:00:00+00:00","value":196.18},{"at":"2026-09-25T04:15:00+00:00","value":197.12},{"at":"2026-09-25T04:30:00+00:00","value":199.56},{"at":"2026-09-25T04:45:00+00:00","value":210.94},{"at":"2026-09-25T05:00:00+00:00","value":219.93},{"at":"2026-09-25T05:15:00+00:00","value":237.02},{"at":"2026-09-25T05:30:00+00:00","value":243.97},{"at":"2026-09-25T05:45:00+00:00","value":246.06},{"at":"2026-09-25T06:00:00+00:00","value":261.99},{"at":"2026-09-25T06:15:00+00:00","value":251.3},{"at":"2026-09-25T06:30:00+00:00","value":235.0},{"at":"2026-09-25T06:45:00+00:00","value":200.0},{"at":"2026-09-25T07:00:00+00:00","value":201.18},{"at":"2026-09-25T07:15:00+00:00","value":199.3},{"at":"2026-09-25T07:30:00+00:00","value":189.27},{"at":"2026-09-25T07:45:00+00:00","value":157.5},{"at":"2026-09-25T08:00:00+00:00","value":163.0},{"at":"2026-09-25T08:15:00+00:00","value":148.0},{"at":"2026-09-25T08:30:00+00:00","value":140.99},{"at":"2026-09-25T08:45:00+00:00","value":100.01},{"at":"2026-09-25T09:00:00+00:00","value":97.06},{"at":"2026-09-25T09:15:00+00:00","value":85.2},{"at":"2026-09-25T09:30:00+00:00","value":72.89},{"at":"2026-09-25T09:45:00+00:00","value":55.88},{"at":"2026-09-25T10:00:00+00:00","value":52.88},{"at":"2026-09-25T10:15:00+00:00","value":38.99},{"at":"2026-09-25T10:30:00+00:00","value":47.76},{"at":"2026-09-25T10:45:00+00:00","value":42.75},{"at":"2026-09-25T11:00:00+00:00","value":38.99},{"at":"2026-09-25T11:15:00+00:00","value":36.12},{"at":"2026-09-25T11:30:00+00:00","value":26.14},{"at":"2026-09-25T11:45:00+00:00","value":19.17},{"at":"2026-09-25T12:00:00+00:00","value":23.12},{"at":"2026-09-25T12:15:00+00:00","value":35.0},{"at":"2026-09-25T12:30:00+00:00","value":38.99},{"at":"2026-09-25T12:45:00+00:00","value":39.1},{"at":"2026-09-25T13:00:00+00:00","value":39.1},{"at":"2026-09-25T13:15:00+00:00","value":39.1},{"at":"2026-09-25T13:30:00+00:00","value":38.66},{"at":"2026-09-25T13:45:00+00:00","value":44.01},{"at":"2026-09-25T14:00:00+00:00","value":65.0},{"at":"2026-09-25T14:15:00+00:00","value":69.0},{"at":"2026-09-25T14:30:00+00:00","value":74.61},{"at":"2026-09-25T14:45:00+00:00","value":106.82},{"at":"2026-09-25T15:00:00+00:00","value":142.48},{"at":"2026-09-25T15:15:00+00:00","value":171.9},{"at":"2026-09-25T15:30:00+00:00","value":178.75},{"at":"2026-09-25T15:45:00+00:00","value":204.01},{"at":"2026-09-25T16:00:00+00:00","value":202.24},{"at":"2026-09-25T16:15:00+00:00","value":229.77},{"at":"2026-09-25T16:30:00+00:00","value":239.54},{"at":"2026-09-25T16:45:00+00:00","value":272.29},{"at":"2026-09-25T17:00:00+00:00","value":242.5},{"at":"2026-09-25T17:15:00+00:00","value":248.58},{"at":"2026-09-25T17:30:00+00:00","value":255.1},{"at":"2026-09-25T17:45:00+00:00","value":287.13},{"at":"2026-09-25T18:00:00+00:00","value":270.0},{"at":"2026-09-25T18:15:00+00:00","value":255.0},{"at":"2026-09-25T18:30:00+00:00","value":247.73},{"at":"2026-09-25T18:45:00+00:00","value":237.51},{"at":"2026-09-25T19:00:00+00:00","value":244.81},{"at":"2026-09-25T19:15:00+00:00","value":232.14},{"at":"2026-09-25T19:30:00+00:00","value":219.97},{"at":"2026-09-25T19:45:00+00:00","value":204.46},{"at":"2026-09-25T20:00:00+00:00","value":220.92},{"at":"2026-09-25T20:15:00+00:00","value":210.0},{"at":"2026-09-25T20:30:00+00:00","value":203.67},{"at":"2026-09-25T20:45:00+00:00","value":196.65},{"at":"2026-09-25T21:00:00+00:00","value":201.18},{"at":"2026-09-25T21:15:00+00:00","value":198.5},{"at":"2026-09-25T21:30:00+00:00","value":194.86},{"at":"2026-09-25T21:45:00+00:00","value":185.3},{"at":"2026-09-25T22:00:00+00:00","value":207.72},{"at":"2026-09-25T22:15:00+00:00","value":201.51},{"at":"2026-09-25T22:30:00+00:00","value":194.81},{"at":"2026-09-25T22:45:00+00:00","value":186.47},{"at":"2026-09-25T23:00:00+00:00","value":189.42},{"at":"2026-09-25T23:15:00+00:00","value":185.76},{"at":"2026-09-25T23:30:00+00:00","value":184.41},{"at":"2026-09-25T23:45:00+00:00","value":182.59},{"at":"2026-09-26T00:00:00+00:00","value":183.13},{"at":"2026-09-26T00:15:00+00:00","value":181.63},{"at":"2026-09-26T00:30:00+00:00","value":176.13},{"at":"2026-09-26T00:45:00+00:00","value":169.87},{"at":"2026-09-26T01:00:00+00:00","value":169.43},{"at":"2026-09-26T01:15:00+00:00","value":166.35},{"at":"2026-09-26T01:30:00+00:00","value":165.51},{"at":"2026-09-26T01:45:00+00:00","value":165.12},{"at":"2026-09-26T02:00:00+00:00","value":163.01},{"at":"2026-09-26T02:15:00+00:00","value":163.56},{"at":"2026-09-26T02:30:00+00:00","value":163.56},{"at":"2026-09-26T02:45:00+00:00","value":164.07},{"at":"2026-09-26T03:00:00+00:00","value":161.62},{"at":"2026-09-26T03:15:00+00:00","value":161.59},{"at":"2026-09-26T03:30:00+00:00","value":163.54},{"at":"2026-09-26T03:45:00+00:00","value":168.06},{"at":"2026-09-26T04:00:00+00:00","value":170.16},{"at":"2026-09-26T04:15:00+00:00","value":178.75},{"at":"2026-09-26T04:30:00+00:00","value":184.15},{"at":"2026-09-26T04:45:00+00:00","value":190.61},{"at":"2026-09-26T05:00:00+00:00","value":194.92},{"at":"2026-09-26T05:15:00+00:00","value":196.88},{"at":"2026-09-26T05:30:00+00:00","value":195.6},{"at":"2026-09-26T05:45:00+00:00","value":196.76},{"at":"2026-09-26T06:00:00+00:00","value":211.34},{"at":"2026-09-26T06:15:00+00:00","value":203.0},{"at":"2026-09-26T06:30:00+00:00","value":187.34},{"at":"2026-09-26T06:45:00+00:00","value":166.4},{"at":"2026-09-26T07:00:00+00:00","value":193.17},{"at":"2026-09-26T07:15:00+00:00","value":165.98},{"at":"2026-09-26T07:30:00+00:00","value":139.03},{"at":"2026-09-26T07:45:00+00:00","value":127.59},{"at":"2026-09-26T08:00:00+00:00","value":132.41},{"at":"2026-09-26T08:15:00+00:00","value":120.56},{"at":"2026-09-26T08:30:00+00:00","value":104.99},{"at":"2026-09-26T08:45:00+00:00","value":97.54},{"at":"2026-09-26T09:00:00+00:00","value":78.49},{"at":"2026-09-26T09:15:00+00:00","value":59.02},{"at":"2026-09-26T09:30:00+00:00","value":46.32},{"at":"2026-09-26T09:45:00+00:00","value":39.62},{"at":"2026-09-26T10:00:00+00:00","value":30.3},{"at":"2026-09-26T10:15:00+00:00","value":26.93},{"at":"2026-09-26T10:30:00+00:00","value":22.31},{"at":"2026-09-26T10:45:00+00:00","value":16.15},{"at":"2026-09-26T11:00:00+00:00","value":11.42},{"at":"2026-09-26T11:15:00+00:00","value":2.22},{"at":"2026-09-26T11:30:00+00:00","value":0.76},{"at":"2026-09-26T11:45:00+00:00","value":0.76},{"at":"2026-09-26T12:00:00+00:00","value":8.99},{"at":"2026-09-26T12:15:00+00:00","value":12.51},{"at":"2026-09-26T12:30:00+00:00","value":23.3},{"at":"2026-09-26T12:45:00+00:00","value":25.02},{"at":"2026-09-26T13:00:00+00:00","value":23.0},{"at":"2026-09-26T13:15:00+00:00","value":40.0},{"at":"2026-09-26T13:30:00+00:00","value":35.93},{"at":"2026-09-26T13:45:00+00:00","value":59.07},{"at":"2026-09-26T14:00:00+00:00","value":62.43},{"at":"2026-09-26T14:15:00+00:00","value":95.77},{"at":"2026-09-26T14:30:00+00:00","value":106.77},{"at":"2026-09-26T14:45:00+00:00","value":160.1},{"at":"2026-09-26T15:00:00+00:00","value":141.25},{"at":"2026-09-26T15:15:00+00:00","value":158.98},{"at":"2026-09-26T15:30:00+00:00","value":128.03},{"at":"2026-09-26T15:45:00+00:00","value":181.76},{"at":"2026-09-26T16:00:00+00:00","value":169.94},{"at":"2026-09-26T16:15:00+00:00","value":202.75},{"at":"2026-09-26T16:30:00+00:00","value":219.48},{"at":"2026-09-26T16:45:00+00:00","value":234.23},{"at":"2026-09-26T17:00:00+00:00","value":222.0},{"at":"2026-09-26T17:15:00+00:00","value":230.46},{"at":"2026-09-26T17:30:00+00:00","value":243.61},{"at":"2026-09-26T17:45:00+00:00","value":251.08},{"at":"2026-09-26T18:00:00+00:00","value":238.97},{"at":"2026-09-26T18:15:00+00:00","value":232.0},{"at":"2026-09-26T18:30:00+00:00","value":222.48},{"at":"2026-09-26T18:45:00+00:00","value":211.99},{"at":"2026-09-26T19:00:00+00:00","value":218.18},{"at":"2026-09-26T19:15:00+00:00","value":210.24},{"at":"2026-09-26T19:30:00+00:00","value":205.53},{"at":"2026-09-26T19:45:00+00:00","value":200.0},{"at":"2026-09-26T20:00:00+00:00","value":207.0},{"at":"2026-09-26T20:15:00+00:00","value":200.62},{"at":"2026-09-26T20:30:00+00:00","value":197.73},{"at":"2026-09-26T20:45:00+00:00","value":191.89},{"at":"2026-09-26T21:00:00+00:00","value":195.2},{"at":"2026-09-26T21:15:00+00:00","value":188.45},{"at":"2026-09-26T21:30:00+00:00","value":182.55},{"at":"2026-09-26T21:45:00+00:00","value":177.8},{"at":"2026-09-26T22:00:00+00:00","value":192.07},{"at":"2026-09-26T22:15:00+00:00","value":187.0},{"at":"2026-09-26T22:30:00+00:00","value":183.34},{"at":"2026-09-26T22:45:00+00:00","value":172.83},{"at":"2026-09-26T23:00:00+00:00","value":180.7},{"at":"2026-09-26T23:15:00+00:00","value":178.0},{"at":"2026-09-26T23:30:00+00:00","value":176.62},{"at":"2026-09-26T23:45:00+00:00","value":178.0},{"at":"2026-09-27T00:00:00+00:00","value":176.0},{"at":"2026-09-27T00:15:00+00:00","value":171.31},{"at":"2026-09-27T00:30:00+00:00","value":169.97},{"at":"2026-09-27T00:45:00+00:00","value":168.08},{"at":"2026-09-27T01:00:00+00:00","value":168.16},{"at":"2026-09-27T01:15:00+00:00","value":166.78},{"at":"2026-09-27T01:30:00+00:00","value":165.4},{"at":"2026-09-27T01:45:00+00:00","value":165.39},{"at":"2026-09-27T02:00:00+00:00","value":165.0},{"at":"2026-09-27T02:15:00+00:00","value":160.83},{"at":"2026-09-27T02:30:00+00:00","value":160.44},{"at":"2026-09-27T02:45:00+00:00","value":160.0},{"at":"2026-09-27T03:00:00+00:00","value":160.44},{"at":"2026-09-27T03:15:00+00:00","value":158.08},{"at":"2026-09-27T03:30:00+00:00","value":159.4},{"at":"2026-09-27T03:45:00+00:00","value":156.76},{"at":"2026-09-27T04:00:00+00:00","value":156.25},{"at":"2026-09-27T04:15:00+00:00","value":156.79},{"at":"2026-09-27T04:30:00+00:00","value":163.19},{"at":"2026-09-27T04:45:00+00:00","value":163.77},{"at":"2026-09-27T05:00:00+00:00","value":169.21},{"at":"2026-09-27T05:15:00+00:00","value":160.68},{"at":"2026-09-27T05:30:00+00:00","value":147.95},{"at":"2026-09-27T05:45:00+00:00","value":134.63},{"at":"2026-09-27T06:00:00+00:00","value":160.43},{"at":"2026-09-27T06:15:00+00:00","value":143.86},{"at":"2026-09-27T06:30:00+00:00","value":119.48},{"at":"2026-09-27T06:45:00+00:00","value":95.84},{"at":"2026-09-27T07:00:00+00:00","value":110.16},{"at":"2026-09-27T07:15:00+00:00","value":80.97},{"at":"2026-09-27T07:30:00+00:00","value":37.22},{"at":"2026-09-27T07:45:00+00:00","value":23.14},{"at":"2026-09-27T08:00:00+00:00","value":36.14},{"at":"2026-09-27T08:15:00+00:00","value":15.85},{"at":"2026-09-27T08:30:00+00:00","value":4.47},{"at":"2026-09-27T08:45:00+00:00","value":1.5},{"at":"2026-09-27T09:00:00+00:00","value":0.89},{"at":"2026-09-27T09:15:00+00:00","value":0.0},{"at":"2026-09-27T09:30:00+00:00","value":0.0},{"at":"2026-09-27T09:45:00+00:00","value":0.0},{"at":"2026-09-27T10:00:00+00:00","value":-0.01},{"at":"2026-09-27T10:15:00+00:00","value":-0.01},{"at":"2026-09-27T10:30:00+00:00","value":-0.01},{"at":"2026-09-27T10:45:00+00:00","value":-0.01},{"at":"2026-09-27T11:00:00+00:00","value":-0.11},{"at":"2026-09-27T11:15:00+00:00","value":-0.11},{"at":"2026-09-27T11:30:00+00:00","value":-1.24},{"at":"2026-09-27T11:45:00+00:00","value":-2.03},{"at":"2026-09-27T12:00:00+00:00","value":-0.11},{"at":"2026-09-27T12:15:00+00:00","value":-0.11},{"at":"2026-09-27T12:30:00+00:00","value":-0.11},{"at":"2026-09-27T12:45:00+00:00","value":-0.11},{"at":"2026-09-27T13:00:00+00:00","value":-0.01},{"at":"2026-09-27T13:15:00+00:00","value":-0.01},{"at":"2026-09-27T13:30:00+00:00","value":0.0},{"at":"2026-09-27T13:45:00+00:00","value":0.0},{"at":"2026-09-27T14:00:00+00:00","value":0.0},{"at":"2026-09-27T14:15:00+00:00","value":0.15},{"at":"2026-09-27T14:30:00+00:00","value":7.01},{"at":"2026-09-27T14:45:00+00:00","value":45.25},{"at":"2026-09-27T15:00:00+00:00","value":41.25},{"at":"2026-09-27T15:15:00+00:00","value":92.71},{"at":"2026-09-27T15:30:00+00:00","value":144.61},{"at":"2026-09-27T15:45:00+00:00","value":179.2},{"at":"2026-09-27T16:00:00+00:00","value":168.79},{"at":"2026-09-27T16:15:00+00:00","value":189.78},{"at":"2026-09-27T16:30:00+00:00","value":198.61},{"at":"2026-09-27T16:45:00+00:00","value":202.34},{"at":"2026-09-27T17:00:00+00:00","value":195.34},{"at":"2026-09-27T17:15:00+00:00","value":196.64},{"at":"2026-09-27T17:30:00+00:00","value":205.0},{"at":"2026-09-27T17:45:00+00:00","value":210.26},{"at":"2026-09-27T18:00:00+00:00","value":201.21},{"at":"2026-09-27T18:15:00+00:00","value":201.0},{"at":"2026-09-27T18:30:00+00:00","value":197.33},{"at":"2026-09-27T18:45:00+00:00","value":186.26},{"at":"2026-09-27T19:00:00+00:00","value":191.66},{"at":"2026-09-27T19:15:00+00:00","value":185.6},{"at":"2026-09-27T19:30:00+00:00","value":175.53},{"at":"2026-09-27T19:45:00+00:00","value":168.22},{"at":"2026-09-27T20:00:00+00:00","value":181.92},{"at":"2026-09-27T20:15:00+00:00","value":173.66},{"at":"2026-09-27T20:30:00+00:00","value":172.32},{"at":"2026-09-27T20:45:00+00:00","value":163.89},{"at":"2026-09-27T21:00:00+00:00","value":168.36},{"at":"2026-09-27T21:15:00+00:00","value":162.42},{"at":"2026-09-27T21:30:00+00:00","value":159.91},{"at":"2026-09-27T21:45:00+00:00","value":153.85},{"at":"2026-09-27T22:00:00+00:00","value":162.9},{"at":"2026-09-27T22:15:00+00:00","value":163.01},{"at":"2026-09-27T22:30:00+00:00","value":163.54},{"at":"2026-09-27T22:45:00+00:00","value":162.51},{"at":"2026-09-27T23:00:00+00:00","value":168.03},{"at":"2026-09-27T23:15:00+00:00","value":163.02},{"at":"2026-09-27T23:30:00+00:00","value":163.54},{"at":"2026-09-27T23:45:00+00:00","value":162.2},{"at":"2026-09-28T00:00:00+00:00","value":160.05},{"at":"2026-09-28T00:15:00+00:00","value":157.65},{"at":"2026-09-28T00:30:00+00:00","value":156.03},{"at":"2026-09-28T00:45:00+00:00","value":154.49},{"at":"2026-09-28T01:00:00+00:00","value":155.15},{"at":"2026-09-28T01:15:00+00:00","value":157.06},{"at":"2026-09-28T01:30:00+00:00","value":157.44},{"at":"2026-09-28T01:45:00+00:00","value":159.56},{"at":"2026-09-28T02:00:00+00:00","value":158.58},{"at":"2026-09-28T02:15:00+00:00","value":160.0},{"at":"2026-09-28T02:30:00+00:00","value":163.54},{"at":"2026-09-28T02:45:00+00:00","value":168.69},{"at":"2026-09-28T03:00:00+00:00","value":169.26},{"at":"2026-09-28T03:15:00+00:00","value":173.1},{"at":"2026-09-28T03:30:00+00:00","value":178.08},{"at":"2026-09-28T03:45:00+00:00","value":185.9},{"at":"2026-09-28T04:00:00+00:00","value":193.68},{"at":"2026-09-28T04:15:00+00:00","value":204.99},{"at":"2026-09-28T04:30:00+00:00","value":214.84},{"at":"2026-09-28T04:45:00+00:00","value":231.02},{"at":"2026-09-28T05:00:00+00:00","value":229.39},{"at":"2026-09-28T05:15:00+00:00","value":244.02},{"at":"2026-09-28T05:30:00+00:00","value":246.3},{"at":"2026-09-28T05:45:00+00:00","value":245.84},{"at":"2026-09-28T06:00:00+00:00","value":275.95},{"at":"2026-09-28T06:15:00+00:00","value":254.9},{"at":"2026-09-28T06:30:00+00:00","value":241.63},{"at":"2026-09-28T06:45:00+00:00","value":227.52},{"at":"2026-09-28T07:00:00+00:00","value":255.75},{"at":"2026-09-28T07:15:00+00:00","value":241.6},{"at":"2026-09-28T07:30:00+00:00","value":233.16},{"at":"2026-09-28T07:45:00+00:00","value":213.58},{"at":"2026-09-28T08:00:00+00:00","value":225.99},{"at":"2026-09-28T08:15:00+00:00","value":210.02},{"at":"2026-09-28T08:30:00+00:00","value":201.81},{"at":"2026-09-28T08:45:00+00:00","value":177.7},{"at":"2026-09-28T09:00:00+00:00","value":181.66},{"at":"2026-09-28T09:15:00+00:00","value":177.98},{"at":"2026-09-28T09:30:00+00:00","value":180.8},{"at":"2026-09-28T09:45:00+00:00","value":175.58},{"at":"2026-09-28T10:00:00+00:00","value":175.43},{"at":"2026-09-28T10:15:00+00:00","value":155.0},{"at":"2026-09-28T10:30:00+00:00","value":153.75},{"at":"2026-09-28T10:45:00+00:00","value":148.56},{"at":"2026-09-28T11:00:00+00:00","value":151.94},{"at":"2026-09-28T11:15:00+00:00","value":147.32},{"at":"2026-09-28T11:30:00+00:00","value":149.5},{"at":"2026-09-28T11:45:00+00:00","value":152.53},{"at":"2026-09-28T12:00:00+00:00","value":152.4},{"at":"2026-09-28T12:15:00+00:00","value":155.42},{"at":"2026-09-28T12:30:00+00:00","value":159.0},{"at":"2026-09-28T12:45:00+00:00","value":163.58},{"at":"2026-09-28T13:00:00+00:00","value":158.1},{"at":"2026-09-28T13:15:00+00:00","value":164.76},{"at":"2026-09-28T13:30:00+00:00","value":165.0},{"at":"2026-09-28T13:45:00+00:00","value":182.0},{"at":"2026-09-28T14:00:00+00:00","value":169.95},{"at":"2026-09-28T14:15:00+00:00","value":186.87},{"at":"2026-09-28T14:30:00+00:00","value":201.93},{"at":"2026-09-28T14:45:00+00:00","value":217.88},{"at":"2026-09-28T15:00:00+00:00","value":207.45},{"at":"2026-09-28T15:15:00+00:00","value":231.26},{"at":"2026-09-28T15:30:00+00:00","value":241.07},{"at":"2026-09-28T15:45:00+00:00","value":266.9},{"at":"2026-09-28T16:00:00+00:00","value":234.14},{"at":"2026-09-28T16:15:00+00:00","value":252.66},{"at":"2026-09-28T16:30:00+00:00","value":294.11},{"at":"2026-09-28T16:45:00+00:00","value":390.6},{"at":"2026-09-28T17:00:00+00:00","value":350.0},{"at":"2026-09-28T17:15:00+00:00","value":354.0},{"at":"2026-09-28T17:30:00+00:00","value":349.99},{"at":"2026-09-28T17:45:00+00:00","value":314.86},{"at":"2026-09-28T18:00:00+00:00","value":320.83},{"at":"2026-09-28T18:15:00+00:00","value":280.59},{"at":"2026-09-28T18:30:00+00:00","value":260.91},{"at":"2026-09-28T18:45:00+00:00","value":246.9},{"at":"2026-09-28T19:00:00+00:00","value":252.58},{"at":"2026-09-28T19:15:00+00:00","value":234.44},{"at":"2026-09-28T19:30:00+00:00","value":223.98},{"at":"2026-09-28T19:45:00+00:00","value":205.0},{"at":"2026-09-28T20:00:00+00:00","value":216.93},{"at":"2026-09-28T20:15:00+00:00","value":208.16},{"at":"2026-09-28T20:30:00+00:00","value":201.99},{"at":"2026-09-28T20:45:00+00:00","value":186.32},{"at":"2026-09-28T21:00:00+00:00","value":197.01},{"at":"2026-09-28T21:15:00+00:00","value":187.78},{"at":"2026-09-28T21:30:00+00:00","value":179.24},{"at":"2026-09-28T21:45:00+00:00","value":168.66},{"at":"2026-09-28T22:00:00+00:00","value":201.22},{"at":"2026-09-28T22:15:00+00:00","value":191.39},{"at":"2026-09-28T22:30:00+00:00","value":181.38},{"at":"2026-09-28T22:45:00+00:00","value":175.18},{"at":"2026-09-28T23:00:00+00:00","value":183.46},{"at":"2026-09-28T23:15:00+00:00","value":177.19},{"at":"2026-09-28T23:30:00+00:00","value":174.89},{"at":"2026-09-28T23:45:00+00:00","value":169.09},{"at":"2026-09-29T00:00:00+00:00","value":173.53},{"at":"2026-09-29T00:15:00+00:00","value":171.98},{"at":"2026-09-29T00:30:00+00:00","value":170.98},{"at":"2026-09-29T00:45:00+00:00","value":169.56},{"at":"2026-09-29T01:00:00+00:00","value":166.26},{"at":"2026-09-29T01:15:00+00:00","value":167.06},{"at":"2026-09-29T01:30:00+00:00","value":165.29},{"at":"2026-09-29T01:45:00+00:00","value":166.9},{"at":"2026-09-29T02:00:00+00:00","value":163.39},{"at":"2026-09-29T02:15:00+00:00","value":163.53},{"at":"2026-09-29T02:30:00+00:00","value":161.95},{"at":"2026-09-29T02:45:00+00:00","value":158.41},{"at":"2026-09-29T03:00:00+00:00","value":157.1},{"at":"2026-09-29T03:15:00+00:00","value":160.7},{"at":"2026-09-29T03:30:00+00:00","value":172.94},{"at":"2026-09-29T03:45:00+00:00","value":180.0},{"at":"2026-09-29T04:00:00+00:00","value":172.8},{"at":"2026-09-29T04:15:00+00:00","value":185.0},{"at":"2026-09-29T04:30:00+00:00","value":194.62},{"at":"2026-09-29T04:45:00+00:00","value":210.37},{"at":"2026-09-29T05:00:00+00:00","value":211.75},{"at":"2026-09-29T05:15:00+00:00","value":228.1},{"at":"2026-09-29T05:30:00+00:00","value":228.64},{"at":"2026-09-29T05:45:00+00:00","value":228.1},{"at":"2026-09-29T06:00:00+00:00","value":239.17},{"at":"2026-09-29T06:15:00+00:00","value":231.15},{"at":"2026-09-29T06:30:00+00:00","value":216.12},{"at":"2026-09-29T06:45:00+00:00","value":193.96},{"at":"2026-09-29T07:00:00+00:00","value":215.83},{"at":"2026-09-29T07:15:00+00:00","value":189.43},{"at":"2026-09-29T07:30:00+00:00","value":178.12},{"at":"2026-09-29T07:45:00+00:00","value":169.02},{"at":"2026-09-29T08:00:00+00:00","value":200.25},{"at":"2026-09-29T08:15:00+00:00","value":187.45},{"at":"2026-09-29T08:30:00+00:00","value":180.36},{"at":"2026-09-29T08:45:00+00:00","value":161.46},{"at":"2026-09-29T09:00:00+00:00","value":157.73},{"at":"2026-09-29T09:15:00+00:00","value":143.77},{"at":"2026-09-29T09:30:00+00:00","value":119.08},{"at":"2026-09-29T09:45:00+00:00","value":106.43},{"at":"2026-09-29T10:00:00+00:00","value":103.05},{"at":"2026-09-29T10:15:00+00:00","value":93.72},{"at":"2026-09-29T10:30:00+00:00","value":93.45},{"at":"2026-09-29T10:45:00+00:00","value":79.93},{"at":"2026-09-29T11:00:00+00:00","value":86.38},{"at":"2026-09-29T11:15:00+00:00","value":77.99},{"at":"2026-09-29T11:30:00+00:00","value":70.21},{"at":"2026-09-29T11:45:00+00:00","value":64.07},{"at":"2026-09-29T12:00:00+00:00","value":65.66},{"at":"2026-09-29T12:15:00+00:00","value":79.03},{"at":"2026-09-29T12:30:00+00:00","value":88.03},{"at":"2026-09-29T12:45:00+00:00","value":93.47},{"at":"2026-09-29T13:00:00+00:00","value":89.63},{"at":"2026-09-29T13:15:00+00:00","value":105.31},{"at":"2026-09-29T13:30:00+00:00","value":96.11},{"at":"2026-09-29T13:45:00+00:00","value":110.73},{"at":"2026-09-29T14:00:00+00:00","value":95.83},{"at":"2026-09-29T14:15:00+00:00","value":127.17},{"at":"2026-09-29T14:30:00+00:00","value":143.77},{"at":"2026-09-29T14:45:00+00:00","value":181.17},{"at":"2026-09-29T15:00:00+00:00","value":167.13},{"at":"2026-09-29T15:15:00+00:00","value":171.48},{"at":"2026-09-29T15:30:00+00:00","value":160.52},{"at":"2026-09-29T15:45:00+00:00","value":205.22},{"at":"2026-09-29T16:00:00+00:00","value":182.9},{"at":"2026-09-29T16:15:00+00:00","value":222.41},{"at":"2026-09-29T16:30:00+00:00","value":232.88},{"at":"2026-09-29T16:45:00+00:00","value":250.12},{"at":"2026-09-29T17:00:00+00:00","value":243.54},{"at":"2026-09-29T17:15:00+00:00","value":240.44},{"at":"2026-09-29T17:30:00+00:00","value":243.03},{"at":"2026-09-29T17:45:00+00:00","value":236.24},{"at":"2026-09-29T18:00:00+00:00","value":238.94},{"at":"2026-09-29T18:15:00+00:00","value":227.55},{"at":"2026-09-29T18:30:00+00:00","value":213.58},{"at":"2026-09-29T18:45:00+00:00","value":198.14},{"at":"2026-09-29T19:00:00+00:00","value":189.14},{"at":"2026-09-29T19:15:00+00:00","value":187.65},{"at":"2026-09-29T19:30:00+00:00","value":180.22},{"at":"2026-09-29T19:45:00+00:00","value":168.64},{"at":"2026-09-29T20:00:00+00:00","value":176.0},{"at":"2026-09-29T20:15:00+00:00","value":168.49},{"at":"2026-09-29T20:30:00+00:00","value":173.0},{"at":"2026-09-29T20:45:00+00:00","value":153.89},{"at":"2026-09-29T21:00:00+00:00","value":151.87},{"at":"2026-09-29T21:15:00+00:00","value":144.36},{"at":"2026-09-29T21:30:00+00:00","value":140.33},{"at":"2026-09-29T21:45:00+00:00","value":128.83},{"at":"2026-09-29T22:00:00+00:00","value":122.15},{"at":"2026-09-29T22:15:00+00:00","value":107.57},{"at":"2026-09-29T22:30:00+00:00","value":94.26},{"at":"2026-09-29T22:45:00+00:00","value":40.96},{"at":"2026-09-29T23:00:00+00:00","value":100.0},{"at":"2026-09-29T23:15:00+00:00","value":73.01},{"at":"2026-09-29T23:30:00+00:00","value":75.91},{"at":"2026-09-29T23:45:00+00:00","value":32.72},{"at":"2026-09-30T00:00:00+00:00","value":90.0},{"at":"2026-09-30T00:15:00+00:00","value":101.94},{"at":"2026-09-30T00:30:00+00:00","value":55.41},{"at":"2026-09-30T00:45:00+00:00","value":20.59},{"at":"2026-09-30T01:00:00+00:00","value":80.76},{"at":"2026-09-30T01:15:00+00:00","value":34.54},{"at":"2026-09-30T01:30:00+00:00","value":30.53},{"at":"2026-09-30T01:45:00+00:00","value":44.95},{"at":"2026-09-30T02:00:00+00:00","value":32.45},{"at":"2026-09-30T02:15:00+00:00","value":53.12},{"at":"2026-09-30T02:30:00+00:00","value":55.0},{"at":"2026-09-30T02:45:00+00:00","value":60.67},{"at":"2026-09-30T03:00:00+00:00","value":20.95},{"at":"2026-09-30T03:15:00+00:00","value":40.04},{"at":"2026-09-30T03:30:00+00:00","value":38.56},{"at":"2026-09-30T03:45:00+00:00","value":114.24},{"at":"2026-09-30T04:00:00+00:00","value":150.0},{"at":"2026-09-30T04:15:00+00:00","value":164.0},{"at":"2026-09-30T04:30:00+00:00","value":171.59},{"at":"2026-09-30T04:45:00+00:00","value":174.0},{"at":"2026-09-30T05:00:00+00:00","value":192.88},{"at":"2026-09-30T05:15:00+00:00","value":207.0},{"at":"2026-09-30T05:30:00+00:00","value":211.81},{"at":"2026-09-30T05:45:00+00:00","value":207.07},{"at":"2026-09-30T06:00:00+00:00","value":223.94},{"at":"2026-09-30T06:15:00+00:00","value":208.48},{"at":"2026-09-30T06:30:00+00:00","value":189.98},{"at":"2026-09-30T06:45:00+00:00","value":169.59},{"at":"2026-09-30T07:00:00+00:00","value":201.94},{"at":"2026-09-30T07:15:00+00:00","value":184.99},{"at":"2026-09-30T07:30:00+00:00","value":173.54},{"at":"2026-09-30T07:45:00+00:00","value":162.41},{"at":"2026-09-30T08:00:00+00:00","value":185.87},{"at":"2026-09-30T08:15:00+00:00","value":175.5},{"at":"2026-09-30T08:30:00+00:00","value":145.1},{"at":"2026-09-30T08:45:00+00:00","value":132.08},{"at":"2026-09-30T09:00:00+00:00","value":132.35},{"at":"2026-09-30T09:15:00+00:00","value":130.0},{"at":"2026-09-30T09:30:00+00:00","value":124.79},{"at":"2026-09-30T09:45:00+00:00","value":115.15},{"at":"2026-09-30T10:00:00+00:00","value":103.41},{"at":"2026-09-30T10:15:00+00:00","value":108.7},{"at":"2026-09-30T10:30:00+00:00","value":108.7},{"at":"2026-09-30T10:45:00+00:00","value":100.0},{"at":"2026-09-30T11:00:00+00:00","value":89.99},{"at":"2026-09-30T11:15:00+00:00","value":90.7},{"at":"2026-09-30T11:30:00+00:00","value":90.0},{"at":"2026-09-30T11:45:00+00:00","value":85.6},{"at":"2026-09-30T12:00:00+00:00","value":89.4},{"at":"2026-09-30T12:15:00+00:00","value":94.99},{"at":"2026-09-30T12:30:00+00:00","value":100.0},{"at":"2026-09-30T12:45:00+00:00","value":118.55},{"at":"2026-09-30T13:00:00+00:00","value":112.93},{"at":"2026-09-30T13:15:00+00:00","value":121.87},{"at":"2026-09-30T13:30:00+00:00","value":127.87},{"at":"2026-09-30T13:45:00+00:00","value":123.68},{"at":"2026-09-30T14:00:00+00:00","value":120.68},{"at":"2026-09-30T14:15:00+00:00","value":135.59},{"at":"2026-09-30T14:30:00+00:00","value":171.38},{"at":"2026-09-30T14:45:00+00:00","value":191.47},{"at":"2026-09-30T15:00:00+00:00","value":174.62},{"at":"2026-09-30T15:15:00+00:00","value":196.78},{"at":"2026-09-30T15:30:00+00:00","value":213.58},{"at":"2026-09-30T15:45:00+00:00","value":233.17},{"at":"2026-09-30T16:00:00+00:00","value":214.87},{"at":"2026-09-30T16:15:00+00:00","value":228.7},{"at":"2026-09-30T16:30:00+00:00","value":235.0},{"at":"2026-09-30T16:45:00+00:00","value":251.77},{"at":"2026-09-30T17:00:00+00:00","value":243.77},{"at":"2026-09-30T17:15:00+00:00","value":250.0},{"at":"2026-09-30T17:30:00+00:00","value":260.0},{"at":"2026-09-30T17:45:00+00:00","value":261.03},{"at":"2026-09-30T18:00:00+00:00","value":249.79},{"at":"2026-09-30T18:15:00+00:00","value":248.59},{"at":"2026-09-30T18:30:00+00:00","value":232.14},{"at":"2026-09-30T18:45:00+00:00","value":221.41},{"at":"2026-09-30T19:00:00+00:00","value":243.15},{"at":"2026-09-30T19:15:00+00:00","value":230.45},{"at":"2026-09-30T19:30:00+00:00","value":212.76},{"at":"2026-09-30T19:45:00+00:00","value":175.86},{"at":"2026-09-30T20:00:00+00:00","value":223.49},{"at":"2026-09-30T20:15:00+00:00","value":201.93},{"at":"2026-09-30T20:30:00+00:00","value":200.96},{"at":"2026-09-30T20:45:00+00:00","value":190.0},{"at":"2026-09-30T21:00:00+00:00","value":202.38},{"at":"2026-09-30T21:15:00+00:00","value":184.3},{"at":"2026-09-30T21:30:00+00:00","value":199.6},{"at":"2026-09-30T21:45:00+00:00","value":173.72},{"at":"2026-09-30T22:00:00+00:00","value":190.18},{"at":"2026-09-30T22:15:00+00:00","value":176.95},{"at":"2026-09-30T22:30:00+00:00","value":160.18},{"at":"2026-09-30T22:45:00+00:00","value":159.07},{"at":"2026-09-30T23:00:00+00:00","value":165.58},{"at":"2026-09-30T23:15:00+00:00","value":166.16},{"at":"2026-09-30T23:30:00+00:00","value":167.47},{"at":"2026-09-30T23:45:00+00:00","value":167.47},{"at":"2026-10-01T00:00:00+00:00","value":169.18},{"at":"2026-10-01T00:15:00+00:00","value":165.4},{"at":"2026-10-01T00:30:00+00:00","value":163.69},{"at":"2026-10-01T00:45:00+00:00","value":160.83},{"at":"2026-10-01T01:00:00+00:00","value":165.32},{"at":"2026-10-01T01:15:00+00:00","value":165.39},{"at":"2026-10-01T01:30:00+00:00","value":163.26},{"at":"2026-10-01T01:45:00+00:00","value":161.58},{"at":"2026-10-01T02:00:00+00:00","value":162.32},{"at":"2026-10-01T02:15:00+00:00","value":162.19},{"at":"2026-10-01T02:30:00+00:00","value":159.74},{"at":"2026-10-01T02:45:00+00:00","value":163.84},{"at":"2026-10-01T03:00:00+00:00","value":161.85},{"at":"2026-10-01T03:15:00+00:00","value":163.0},{"at":"2026-10-01T03:30:00+00:00","value":172.54},{"at":"2026-10-01T03:45:00+00:00","value":185.1},{"at":"2026-10-01T04:00:00+00:00","value":179.67},{"at":"2026-10-01T04:15:00+00:00","value":205.24},{"at":"2026-10-01T04:30:00+00:00","value":219.13},{"at":"2026-10-01T04:45:00+00:00","value":233.76},{"at":"2026-10-01T05:00:00+00:00","value":229.21},{"at":"2026-10-01T05:15:00+00:00","value":243.11},{"at":"2026-10-01T05:30:00+00:00","value":246.58},{"at":"2026-10-01T05:45:00+00:00","value":238.18},{"at":"2026-10-01T06:00:00+00:00","value":261.71},{"at":"2026-10-01T06:15:00+00:00","value":238.11},{"at":"2026-10-01T06:30:00+00:00","value":226.94},{"at":"2026-10-01T06:45:00+00:00","value":214.79},{"at":"2026-10-01T07:00:00+00:00","value":238.12},{"at":"2026-10-01T07:15:00+00:00","value":231.84},{"at":"2026-10-01T07:30:00+00:00","value":228.3},{"at":"2026-10-01T07:45:00+00:00","value":212.82},{"at":"2026-10-01T08:00:00+00:00","value":248.23},{"at":"2026-10-01T08:15:00+00:00","value":224.14},{"at":"2026-10-01T08:30:00+00:00","value":205.61},{"at":"2026-10-01T08:45:00+00:00","value":192.49},{"at":"2026-10-01T09:00:00+00:00","value":180.71},{"at":"2026-10-01T09:15:00+00:00","value":176.63},{"at":"2026-10-01T09:30:00+00:00","value":184.6},{"at":"2026-10-01T09:45:00+00:00","value":191.85},{"at":"2026-10-01T10:00:00+00:00","value":185.54},{"at":"2026-10-01T10:15:00+00:00","value":179.0},{"at":"2026-10-01T10:30:00+00:00","value":178.56},{"at":"2026-10-01T10:45:00+00:00","value":160.98},{"at":"2026-10-01T11:00:00+00:00","value":169.22},{"at":"2026-10-01T11:15:00+00:00","value":168.25},{"at":"2026-10-01T11:30:00+00:00","value":166.65},{"at":"2026-10-01T11:45:00+00:00","value":165.54},{"at":"2026-10-01T12:00:00+00:00","value":172.44},{"at":"2026-10-01T12:15:00+00:00","value":166.67},{"at":"2026-10-01T12:30:00+00:00","value":169.32},{"at":"2026-10-01T12:45:00+00:00","value":169.07},{"at":"2026-10-01T13:00:00+00:00","value":159.74},{"at":"2026-10-01T13:15:00+00:00","value":157.65},{"at":"2026-10-01T13:30:00+00:00","value":159.0},{"at":"2026-10-01T13:45:00+00:00","value":170.1},{"at":"2026-10-01T14:00:00+00:00","value":149.7},{"at":"2026-10-01T14:15:00+00:00","value":166.6},{"at":"2026-10-01T14:30:00+00:00","value":196.75},{"at":"2026-10-01T14:45:00+00:00","value":243.68},{"at":"2026-10-01T15:00:00+00:00","value":179.92},{"at":"2026-10-01T15:15:00+00:00","value":211.92},{"at":"2026-10-01T15:30:00+00:00","value":250.0},{"at":"2026-10-01T15:45:00+00:00","value":275.0},{"at":"2026-10-01T16:00:00+00:00","value":246.19},{"at":"2026-10-01T16:15:00+00:00","value":265.01},{"at":"2026-10-01T16:30:00+00:00","value":276.58},{"at":"2026-10-01T16:45:00+00:00","value":310.98},{"at":"2026-10-01T17:00:00+00:00","value":289.7},{"at":"2026-10-01T17:15:00+00:00","value":300.22},{"at":"2026-10-01T17:30:00+00:00","value":314.78},{"at":"2026-10-01T17:45:00+00:00","value":297.47},{"at":"2026-10-01T18:00:00+00:00","value":280.0},{"at":"2026-10-01T18:15:00+00:00","value":268.11},{"at":"2026-10-01T18:30:00+00:00","value":251.93},{"at":"2026-10-01T18:45:00+00:00","value":230.01},{"at":"2026-10-01T19:00:00+00:00","value":250.03},{"at":"2026-10-01T19:15:00+00:00","value":229.97},{"at":"2026-10-01T19:30:00+00:00","value":221.01},{"at":"2026-10-01T19:45:00+00:00","value":204.42},{"at":"2026-10-01T20:00:00+00:00","value":221.64},{"at":"2026-10-01T20:15:00+00:00","value":207.5},{"at":"2026-10-01T20:30:00+00:00","value":203.9},{"at":"2026-10-01T20:45:00+00:00","value":186.95},{"at":"2026-10-01T21:00:00+00:00","value":201.71},{"at":"2026-10-01T21:15:00+00:00","value":190.04},{"at":"2026-10-01T21:30:00+00:00","value":182.58},{"at":"2026-10-01T21:45:00+00:00","value":171.38},{"at":"2026-10-01T22:00:00+00:00","value":185.11},{"at":"2026-10-01T22:15:00+00:00","value":180.76},{"at":"2026-10-01T22:30:00+00:00","value":171.32},{"at":"2026-10-01T22:45:00+00:00","value":168.45},{"at":"2026-10-01T23:00:00+00:00","value":169.0},{"at":"2026-10-01T23:15:00+00:00","value":166.71},{"at":"2026-10-01T23:30:00+00:00","value":164.72},{"at":"2026-10-01T23:45:00+00:00","value":161.45},{"at":"2026-10-02T00:00:00+00:00","value":162.95},{"at":"2026-10-02T00:15:00+00:00","value":161.0},{"at":"2026-10-02T00:30:00+00:00","value":161.43},{"at":"2026-10-02T00:45:00+00:00","value":161.47},{"at":"2026-10-02T01:00:00+00:00","value":160.29},{"at":"2026-10-02T01:15:00+00:00","value":159.51},{"at":"2026-10-02T01:30:00+00:00","value":161.62},{"at":"2026-10-02T01:45:00+00:00","value":161.2},{"at":"2026-10-02T02:00:00+00:00","value":162.92},{"at":"2026-10-02T02:15:00+00:00","value":163.12},{"at":"2026-10-02T02:30:00+00:00","value":162.05},{"at":"2026-10-02T02:45:00+00:00","value":166.6},{"at":"2026-10-02T03:00:00+00:00","value":163.55},{"at":"2026-10-02T03:15:00+00:00","value":170.49},{"at":"2026-10-02T03:30:00+00:00","value":184.84},{"at":"2026-10-02T03:45:00+00:00","value":192.61},{"at":"2026-10-02T04:00:00+00:00","value":195.55},{"at":"2026-10-02T04:15:00+00:00","value":216.11},{"at":"2026-10-02T04:30:00+00:00","value":229.62},{"at":"2026-10-02T04:45:00+00:00","value":242.53},{"at":"2026-10-02T05:00:00+00:00","value":246.83},{"at":"2026-10-02T05:15:00+00:00","value":258.53},{"at":"2026-10-02T05:30:00+00:00","value":265.5},{"at":"2026-10-02T05:45:00+00:00","value":268.82},{"at":"2026-10-02T06:00:00+00:00","value":288.93},{"at":"2026-10-02T06:15:00+00:00","value":269.79},{"at":"2026-10-02T06:30:00+00:00","value":255.8},{"at":"2026-10-02T06:45:00+00:00","value":232.9},{"at":"2026-10-02T07:00:00+00:00","value":259.45},{"at":"2026-10-02T07:15:00+00:00","value":229.15},{"at":"2026-10-02T07:30:00+00:00","value":215.16},{"at":"2026-10-02T07:45:00+00:00","value":181.4},{"at":"2026-10-02T08:00:00+00:00","value":206.8},{"at":"2026-10-02T08:15:00+00:00","value":184.27},{"at":"2026-10-02T08:30:00+00:00","value":172.76},{"at":"2026-10-02T08:45:00+00:00","value":167.74},{"at":"2026-10-02T09:00:00+00:00","value":182.1},{"at":"2026-10-02T09:15:00+00:00","value":171.42},{"at":"2026-10-02T09:30:00+00:00","value":163.46},{"at":"2026-10-02T09:45:00+00:00","value":149.73},{"at":"2026-10-02T10:00:00+00:00","value":150.71},{"at":"2026-10-02T10:15:00+00:00","value":147.1},{"at":"2026-10-02T10:30:00+00:00","value":147.83},{"at":"2026-10-02T10:45:00+00:00","value":144.41},{"at":"2026-10-02T11:00:00+00:00","value":142.7},{"at":"2026-10-02T11:15:00+00:00","value":136.42},{"at":"2026-10-02T11:30:00+00:00","value":127.56},{"at":"2026-10-02T11:45:00+00:00","value":130.46},{"at":"2026-10-02T12:00:00+00:00","value":137.04},{"at":"2026-10-02T12:15:00+00:00","value":136.14},{"at":"2026-10-02T12:30:00+00:00","value":139.27},{"at":"2026-10-02T12:45:00+00:00","value":140.04},{"at":"2026-10-02T13:00:00+00:00","value":141.04},{"at":"2026-10-02T13:15:00+00:00","value":142.71},{"at":"2026-10-02T13:30:00+00:00","value":140.71},{"at":"2026-10-02T13:45:00+00:00","value":144.16},{"at":"2026-10-02T14:00:00+00:00","value":127.49},{"at":"2026-10-02T14:15:00+00:00","value":148.1},{"at":"2026-10-02T14:30:00+00:00","value":157.44},{"at":"2026-10-02T14:45:00+00:00","value":152.3},{"at":"2026-10-02T15:00:00+00:00","value":164.12},{"at":"2026-10-02T15:15:00+00:00","value":194.4},{"at":"2026-10-02T15:30:00+00:00","value":189.59},{"at":"2026-10-02T15:45:00+00:00","value":231.89},{"at":"2026-10-02T16:00:00+00:00","value":239.98},{"at":"2026-10-02T16:15:00+00:00","value":250.44},{"at":"2026-10-02T16:30:00+00:00","value":275.42},{"at":"2026-10-02T16:45:00+00:00","value":294.16},{"at":"2026-10-02T17:00:00+00:00","value":282.7},{"at":"2026-10-02T17:15:00+00:00","value":301.3},{"at":"2026-10-02T17:30:00+00:00","value":315.28},{"at":"2026-10-02T17:45:00+00:00","value":307.27},{"at":"2026-10-02T18:00:00+00:00","value":282.7},{"at":"2026-10-02T18:15:00+00:00","value":279.83},{"at":"2026-10-02T18:30:00+00:00","value":261.82},{"at":"2026-10-02T18:45:00+00:00","value":248.08},{"at":"2026-10-02T19:00:00+00:00","value":244.78},{"at":"2026-10-02T19:15:00+00:00","value":238.14},{"at":"2026-10-02T19:30:00+00:00","value":224.99},{"at":"2026-10-02T19:45:00+00:00","value":211.92},{"at":"2026-10-02T20:00:00+00:00","value":220.23},{"at":"2026-10-02T20:15:00+00:00","value":215.0},{"at":"2026-10-02T20:30:00+00:00","value":209.39},{"at":"2026-10-02T20:45:00+00:00","value":201.39},{"at":"2026-10-02T21:00:00+00:00","value":201.62},{"at":"2026-10-02T21:15:00+00:00","value":197.52},{"at":"2026-10-02T21:30:00+00:00","value":194.55},{"at":"2026-10-02T21:45:00+00:00","value":185.1},{"at":"2026-10-02T22:00:00+00:00","value":204.51},{"at":"2026-10-02T22:15:00+00:00","value":200.76},{"at":"2026-10-02T22:30:00+00:00","value":190.88},{"at":"2026-10-02T22:45:00+00:00","value":183.13},{"at":"2026-10-02T23:00:00+00:00","value":188.0},{"at":"2026-10-02T23:15:00+00:00","value":181.35},{"at":"2026-10-02T23:30:00+00:00","value":175.38},{"at":"2026-10-02T23:45:00+00:00","value":173.15},{"at":"2026-10-03T00:00:00+00:00","value":176.96},{"at":"2026-10-03T00:15:00+00:00","value":174.99},{"at":"2026-10-03T00:30:00+00:00","value":172.6},{"at":"2026-10-03T00:45:00+00:00","value":169.5},{"at":"2026-10-03T01:00:00+00:00","value":173.4},{"at":"2026-10-03T01:15:00+00:00","value":169.4},{"at":"2026-10-03T01:30:00+00:00","value":166.63},{"at":"2026-10-03T01:45:00+00:00","value":167.0},{"at":"2026-10-03T02:00:00+00:00","value":166.04},{"at":"2026-10-03T02:15:00+00:00","value":166.31},{"at":"2026-10-03T02:30:00+00:00","value":166.24},{"at":"2026-10-03T02:45:00+00:00","value":165.7},{"at":"2026-10-03T03:00:00+00:00","value":169.43},{"at":"2026-10-03T03:15:00+00:00","value":168.46},{"at":"2026-10-03T03:30:00+00:00","value":169.8},{"at":"2026-10-03T03:45:00+00:00","value":171.9},{"at":"2026-10-03T04:00:00+00:00","value":175.0},{"at":"2026-10-03T04:15:00+00:00","value":180.0},{"at":"2026-10-03T04:30:00+00:00","value":185.0},{"at":"2026-10-03T04:45:00+00:00","value":189.0},{"at":"2026-10-03T05:00:00+00:00","value":200.0},{"at":"2026-10-03T05:15:00+00:00","value":201.08},{"at":"2026-10-03T05:30:00+00:00","value":199.13},{"at":"2026-10-03T05:45:00+00:00","value":199.71},{"at":"2026-10-03T06:00:00+00:00","value":202.94},{"at":"2026-10-03T06:15:00+00:00","value":198.06},{"at":"2026-10-03T06:30:00+00:00","value":188.0},{"at":"2026-10-03T06:45:00+00:00","value":167.84},{"at":"2026-10-03T07:00:00+00:00","value":199.51},{"at":"2026-10-03T07:15:00+00:00","value":180.99},{"at":"2026-10-03T07:30:00+00:00","value":171.4},{"at":"2026-10-03T07:45:00+00:00","value":157.51},{"at":"2026-10-03T08:00:00+00:00","value":181.63},{"at":"2026-10-03T08:15:00+00:00","value":174.06},{"at":"2026-10-03T08:30:00+00:00","value":171.37},{"at":"2026-10-03T08:45:00+00:00","value":170.85},{"at":"2026-10-03T09:00:00+00:00","value":170.9},{"at":"2026-10-03T09:15:00+00:00","value":150.39},{"at":"2026-10-03T09:30:00+00:00","value":130.01},{"at":"2026-10-03T09:45:00+00:00","value":120.61},{"at":"2026-10-03T10:00:00+00:00","value":110.0},{"at":"2026-10-03T10:15:00+00:00","value":100.88},{"at":"2026-10-03T10:30:00+00:00","value":95.4},{"at":"2026-10-03T10:45:00+00:00","value":83.51},{"at":"2026-10-03T11:00:00+00:00","value":75.83},{"at":"2026-10-03T11:15:00+00:00","value":70.0},{"at":"2026-10-03T11:30:00+00:00","value":63.94},{"at":"2026-10-03T11:45:00+00:00","value":66.0},{"at":"2026-10-03T12:00:00+00:00","value":66.91},{"at":"2026-10-03T12:15:00+00:00","value":75.27},{"at":"2026-10-03T12:30:00+00:00","value":84.57},{"at":"2026-10-03T12:45:00+00:00","value":98.01},{"at":"2026-10-03T13:00:00+00:00","value":103.1},{"at":"2026-10-03T13:15:00+00:00","value":105.2},{"at":"2026-10-03T13:30:00+00:00","value":118.82},{"at":"2026-10-03T13:45:00+00:00","value":134.63},{"at":"2026-10-03T14:00:00+00:00","value":121.56},{"at":"2026-10-03T14:15:00+00:00","value":145.0},{"at":"2026-10-03T14:30:00+00:00","value":162.69},{"at":"2026-10-03T14:45:00+00:00","value":200.02},{"at":"2026-10-03T15:00:00+00:00","value":166.29},{"at":"2026-10-03T15:15:00+00:00","value":188.49},{"at":"2026-10-03T15:30:00+00:00","value":204.9},{"at":"2026-10-03T15:45:00+00:00","value":215.27},{"at":"2026-10-03T16:00:00+00:00","value":216.49},{"at":"2026-10-03T16:15:00+00:00","value":221.69},{"at":"2026-10-03T16:30:00+00:00","value":229.46},{"at":"2026-10-03T16:45:00+00:00","value":243.06},{"at":"2026-10-03T17:00:00+00:00","value":236.13},{"at":"2026-10-03T17:15:00+00:00","value":240.45},{"at":"2026-10-03T17:30:00+00:00","value":238.7},{"at":"2026-10-03T17:45:00+00:00","value":233.15},{"at":"2026-10-03T18:00:00+00:00","value":230.0},{"at":"2026-10-03T18:15:00+00:00","value":227.18},{"at":"2026-10-03T18:30:00+00:00","value":222.64},{"at":"2026-10-03T18:45:00+00:00","value":214.93},{"at":"2026-10-03T19:00:00+00:00","value":221.81},{"at":"2026-10-03T19:15:00+00:00","value":216.2},{"at":"2026-10-03T19:30:00+00:00","value":214.02},{"at":"2026-10-03T19:45:00+00:00","value":208.71},{"at":"2026-10-03T20:00:00+00:00","value":212.14},{"at":"2026-10-03T20:15:00+00:00","value":210.0},{"at":"2026-10-03T20:30:00+00:00","value":206.41},{"at":"2026-10-03T20:45:00+00:00","value":205.5},{"at":"2026-10-03T21:00:00+00:00","value":204.8},{"at":"2026-10-03T21:15:00+00:00","value":197.51},{"at":"2026-10-03T21:30:00+00:00","value":192.85},{"at":"2026-10-03T21:45:00+00:00","value":184.86},{"at":"2026-10-03T22:00:00+00:00","value":208.08},{"at":"2026-10-03T22:15:00+00:00","value":203.56},{"at":"2026-10-03T22:30:00+00:00","value":190.17},{"at":"2026-10-03T22:45:00+00:00","value":182.08},{"at":"2026-10-03T23:00:00+00:00","value":192.74},{"at":"2026-10-03T23:15:00+00:00","value":190.78},{"at":"2026-10-03T23:30:00+00:00","value":191.57},{"at":"2026-10-03T23:45:00+00:00","value":183.16},{"at":"2026-10-04T00:00:00+00:00","value":192.54},{"at":"2026-10-04T00:15:00+00:00","value":180.23},{"at":"2026-10-04T00:30:00+00:00","value":180.1},{"at":"2026-10-04T00:45:00+00:00","value":178.4},{"at":"2026-10-04T01:00:00+00:00","value":183.09},{"at":"2026-10-04T01:15:00+00:00","value":178.85},{"at":"2026-10-04T01:30:00+00:00","value":172.89},{"at":"2026-10-04T01:45:00+00:00","value":168.01},{"at":"2026-10-04T02:00:00+00:00","value":175.68},{"at":"2026-10-04T02:15:00+00:00","value":175.65},{"at":"2026-10-04T02:30:00+00:00","value":173.09},{"at":"2026-10-04T02:45:00+00:00","value":172.34},{"at":"2026-10-04T03:00:00+00:00","value":172.54},{"at":"2026-10-04T03:15:00+00:00","value":169.28},{"at":"2026-10-04T03:30:00+00:00","value":165.78},{"at":"2026-10-04T03:45:00+00:00","value":171.01},{"at":"2026-10-04T04:00:00+00:00","value":169.0},{"at":"2026-10-04T04:15:00+00:00","value":178.0},{"at":"2026-10-04T04:30:00+00:00","value":181.0},{"at":"2026-10-04T04:45:00+00:00","value":189.46},{"at":"2026-10-04T05:00:00+00:00","value":174.4},{"at":"2026-10-04T05:15:00+00:00","value":184.45},{"at":"2026-10-04T05:30:00+00:00","value":187.77},{"at":"2026-10-04T05:45:00+00:00","value":190.55},{"at":"2026-10-04T06:00:00+00:00","value":200.74},{"at":"2026-10-04T06:15:00+00:00","value":192.58},{"at":"2026-10-04T06:30:00+00:00","value":187.44},{"at":"2026-10-04T06:45:00+00:00","value":166.0},{"at":"2026-10-04T07:00:00+00:00","value":198.82},{"at":"2026-10-04T07:15:00+00:00","value":194.92},{"at":"2026-10-04T07:30:00+00:00","value":182.18},{"at":"2026-10-04T07:45:00+00:00","value":165.59},{"at":"2026-10-04T08:00:00+00:00","value":179.4},{"at":"2026-10-04T08:15:00+00:00","value":158.1},{"at":"2026-10-04T08:30:00+00:00","value":148.07},{"at":"2026-10-04T08:45:00+00:00","value":141.28},{"at":"2026-10-04T09:00:00+00:00","value":140.0},{"at":"2026-10-04T09:15:00+00:00","value":123.82},{"at":"2026-10-04T09:30:00+00:00","value":111.06},{"at":"2026-10-04T09:45:00+00:00","value":100.0},{"at":"2026-10-04T10:00:00+00:00","value":100.0},{"at":"2026-10-04T10:15:00+00:00","value":95.0},{"at":"2026-10-04T10:30:00+00:00","value":86.69},{"at":"2026-10-04T10:45:00+00:00","value":76.36},{"at":"2026-10-04T11:00:00+00:00","value":70.88},{"at":"2026-10-04T11:15:00+00:00","value":59.0},{"at":"2026-10-04T11:30:00+00:00","value":50.42},{"at":"2026-10-04T11:45:00+00:00","value":50.28},{"at":"2026-10-04T12:00:00+00:00","value":46.62},{"at":"2026-10-04T12:15:00+00:00","value":53.39},{"at":"2026-10-04T12:30:00+00:00","value":60.94},{"at":"2026-10-04T12:45:00+00:00","value":74.07},{"at":"2026-10-04T13:00:00+00:00","value":65.84},{"at":"2026-10-04T13:15:00+00:00","value":85.2},{"at":"2026-10-04T13:30:00+00:00","value":96.46},{"at":"2026-10-04T13:45:00+00:00","value":112.5},{"at":"2026-10-04T14:00:00+00:00","value":109.5},{"at":"2026-10-04T14:15:00+00:00","value":134.08},{"at":"2026-10-04T14:30:00+00:00","value":151.52},{"at":"2026-10-04T14:45:00+00:00","value":166.2},{"at":"2026-10-04T15:00:00+00:00","value":162.2},{"at":"2026-10-04T15:15:00+00:00","value":182.94},{"at":"2026-10-04T15:30:00+00:00","value":168.45},{"at":"2026-10-04T15:45:00+00:00","value":197.8},{"at":"2026-10-04T16:00:00+00:00","value":191.8},{"at":"2026-10-04T16:15:00+00:00","value":206.2},{"at":"2026-10-04T16:30:00+00:00","value":226.31},{"at":"2026-10-04T16:45:00+00:00","value":234.97},{"at":"2026-10-04T17:00:00+00:00","value":232.51},{"at":"2026-10-04T17:15:00+00:00","value":240.42},{"at":"2026-10-04T17:30:00+00:00","value":245.07},{"at":"2026-10-04T17:45:00+00:00","value":237.19},{"at":"2026-10-04T18:00:00+00:00","value":234.5},{"at":"2026-10-04T18:15:00+00:00","value":237.12},{"at":"2026-10-04T18:30:00+00:00","value":228.22},{"at":"2026-10-04T18:45:00+00:00","value":219.84},{"at":"2026-10-04T19:00:00+00:00","value":223.03},{"at":"2026-10-04T19:15:00+00:00","value":217.36},{"at":"2026-10-04T19:30:00+00:00","value":213.99},{"at":"2026-10-04T19:45:00+00:00","value":213.63},{"at":"2026-10-04T20:00:00+00:00","value":215.66},{"at":"2026-10-04T20:15:00+00:00","value":214.92},{"at":"2026-10-04T20:30:00+00:00","value":213.99},{"at":"2026-10-04T20:45:00+00:00","value":205.54},{"at":"2026-10-04T21:00:00+00:00","value":213.63},{"at":"2026-10-04T21:15:00+00:00","value":199.19},{"at":"2026-10-04T21:30:00+00:00","value":189.95},{"at":"2026-10-04T21:45:00+00:00","value":174.76},{"at":"2026-10-04T22:00:00+00:00","value":168.6},{"at":"2026-10-04T22:15:00+00:00","value":171.01},{"at":"2026-10-04T22:30:00+00:00","value":175.01},{"at":"2026-10-04T22:45:00+00:00","value":170.45},{"at":"2026-10-04T23:00:00+00:00","value":170.04},{"at":"2026-10-04T23:15:00+00:00","value":160.47},{"at":"2026-10-04T23:30:00+00:00","value":167.32},{"at":"2026-10-04T23:45:00+00:00","value":164.0},{"at":"2026-10-05T00:00:00+00:00","value":165.29},{"at":"2026-10-05T00:15:00+00:00","value":159.88},{"at":"2026-10-05T00:30:00+00:00","value":161.68},{"at":"2026-10-05T00:45:00+00:00","value":158.96},{"at":"2026-10-05T01:00:00+00:00","value":157.41},{"at":"2026-10-05T01:15:00+00:00","value":156.43},{"at":"2026-10-05T01:30:00+00:00","value":156.54},{"at":"2026-10-05T01:45:00+00:00","value":156.54},{"at":"2026-10-05T02:00:00+00:00","value":159.09},{"at":"2026-10-05T02:15:00+00:00","value":157.06},{"at":"2026-10-05T02:30:00+00:00","value":153.82},{"at":"2026-10-05T02:45:00+00:00","value":157.8},{"at":"2026-10-05T03:00:00+00:00","value":156.1},{"at":"2026-10-05T03:15:00+00:00","value":159.44},{"at":"2026-10-05T03:30:00+00:00","value":154.08},{"at":"2026-10-05T03:45:00+00:00","value":163.17},{"at":"2026-10-05T04:00:00+00:00","value":181.36},{"at":"2026-10-05T04:15:00+00:00","value":202.47},{"at":"2026-10-05T04:30:00+00:00","value":212.14},{"at":"2026-10-05T04:45:00+00:00","value":215.7},{"at":"2026-10-05T05:00:00+00:00","value":217.7},{"at":"2026-10-05T05:15:00+00:00","value":226.19},{"at":"2026-10-05T05:30:00+00:00","value":234.29},{"at":"2026-10-05T05:45:00+00:00","value":241.71},{"at":"2026-10-05T06:00:00+00:00","value":265.01},{"at":"2026-10-05T06:15:00+00:00","value":241.39},{"at":"2026-10-05T06:30:00+00:00","value":225.4},{"at":"2026-10-05T06:45:00+00:00","value":206.68},{"at":"2026-10-05T07:00:00+00:00","value":235.16},{"at":"2026-10-05T07:15:00+00:00","value":214.42},{"at":"2026-10-05T07:30:00+00:00","value":187.57},{"at":"2026-10-05T07:45:00+00:00","value":161.5},{"at":"2026-10-05T08:00:00+00:00","value":191.87},{"at":"2026-10-05T08:15:00+00:00","value":172.61},{"at":"2026-10-05T08:30:00+00:00","value":154.51},{"at":"2026-10-05T08:45:00+00:00","value":128.17},{"at":"2026-10-05T09:00:00+00:00","value":151.94},{"at":"2026-10-05T09:15:00+00:00","value":133.65},{"at":"2026-10-05T09:30:00+00:00","value":110.29},{"at":"2026-10-05T09:45:00+00:00","value":97.79},{"at":"2026-10-05T10:00:00+00:00","value":115.03},{"at":"2026-10-05T10:15:00+00:00","value":83.21},{"at":"2026-10-05T10:30:00+00:00","value":68.12},{"at":"2026-10-05T10:45:00+00:00","value":46.57},{"at":"2026-10-05T11:00:00+00:00","value":68.76},{"at":"2026-10-05T11:15:00+00:00","value":61.56},{"at":"2026-10-05T11:30:00+00:00","value":52.6},{"at":"2026-10-05T11:45:00+00:00","value":49.09},{"at":"2026-10-05T12:00:00+00:00","value":35.67},{"at":"2026-10-05T12:15:00+00:00","value":51.29},{"at":"2026-10-05T12:30:00+00:00","value":64.31},{"at":"2026-10-05T12:45:00+00:00","value":80.54},{"at":"2026-10-05T13:00:00+00:00","value":78.14},{"at":"2026-10-05T13:15:00+00:00","value":98.87},{"at":"2026-10-05T13:30:00+00:00","value":109.82},{"at":"2026-10-05T13:45:00+00:00","value":129.92},{"at":"2026-10-05T14:00:00+00:00","value":97.57},{"at":"2026-10-05T14:15:00+00:00","value":143.01},{"at":"2026-10-05T14:30:00+00:00","value":156.81},{"at":"2026-10-05T14:45:00+00:00","value":175.28},{"at":"2026-10-05T15:00:00+00:00","value":159.21},{"at":"2026-10-05T15:15:00+00:00","value":187.92},{"at":"2026-10-05T15:30:00+00:00","value":205.01},{"at":"2026-10-05T15:45:00+00:00","value":212.7},{"at":"2026-10-05T16:00:00+00:00","value":211.52},{"at":"2026-10-05T16:15:00+00:00","value":231.88},{"at":"2026-10-05T16:30:00+00:00","value":238.75},{"at":"2026-10-05T16:45:00+00:00","value":261.8},{"at":"2026-10-05T17:00:00+00:00","value":248.58},{"at":"2026-10-05T17:15:00+00:00","value":258.78},{"at":"2026-10-05T17:30:00+00:00","value":271.93},{"at":"2026-10-05T17:45:00+00:00","value":261.9},{"at":"2026-10-05T18:00:00+00:00","value":262.64},{"at":"2026-10-05T18:15:00+00:00","value":236.06},{"at":"2026-10-05T18:30:00+00:00","value":226.27},{"at":"2026-10-05T18:45:00+00:00","value":210.02},{"at":"2026-10-05T19:00:00+00:00","value":225.98},{"at":"2026-10-05T19:15:00+00:00","value":213.11},{"at":"2026-10-05T19:30:00+00:00","value":212.96},{"at":"2026-10-05T19:45:00+00:00","value":187.64},{"at":"2026-10-05T20:00:00+00:00","value":221.14},{"at":"2026-10-05T20:15:00+00:00","value":209.03},{"at":"2026-10-05T20:30:00+00:00","value":210.0},{"at":"2026-10-05T20:45:00+00:00","value":190.51},{"at":"2026-10-05T21:00:00+00:00","value":198.76},{"at":"2026-10-05T21:15:00+00:00","value":173.24},{"at":"2026-10-05T21:30:00+00:00","value":167.09},{"at":"2026-10-05T21:45:00+00:00","value":154.03},{"at":"2026-10-05T22:00:00+00:00","value":169.9},{"at":"2026-10-05T22:15:00+00:00","value":163.16},{"at":"2026-10-05T22:30:00+00:00","value":158.07},{"at":"2026-10-05T22:45:00+00:00","value":154.52},{"at":"2026-10-05T23:00:00+00:00","value":157.02},{"at":"2026-10-05T23:15:00+00:00","value":156.38},{"at":"2026-10-05T23:30:00+00:00","value":155.88},{"at":"2026-10-05T23:45:00+00:00","value":159.61},{"at":"2026-10-06T00:00:00+00:00","value":161.84},{"at":"2026-10-06T00:15:00+00:00","value":158.05},{"at":"2026-10-06T00:30:00+00:00","value":158.74},{"at":"2026-10-06T00:45:00+00:00","value":156.99},{"at":"2026-10-06T01:00:00+00:00","value":158.58},{"at":"2026-10-06T01:15:00+00:00","value":158.54},{"at":"2026-10-06T01:30:00+00:00","value":158.39},{"at":"2026-10-06T01:45:00+00:00","value":160.03},{"at":"2026-10-06T02:00:00+00:00","value":158.06},{"at":"2026-10-06T02:15:00+00:00","value":153.32},{"at":"2026-10-06T02:30:00+00:00","value":160.79},{"at":"2026-10-06T02:45:00+00:00","value":163.53},{"at":"2026-10-06T03:00:00+00:00","value":154.21},{"at":"2026-10-06T03:15:00+00:00","value":163.27},{"at":"2026-10-06T03:30:00+00:00","value":178.47},{"at":"2026-10-06T03:45:00+00:00","value":195.57},{"at":"2026-10-06T04:00:00+00:00","value":195.53},{"at":"2026-10-06T04:15:00+00:00","value":205.99},{"at":"2026-10-06T04:30:00+00:00","value":210.0},{"at":"2026-10-06T04:45:00+00:00","value":221.86},{"at":"2026-10-06T05:00:00+00:00","value":227.81},{"at":"2026-10-06T05:15:00+00:00","value":245.52},{"at":"2026-10-06T05:30:00+00:00","value":252.04},{"at":"2026-10-06T05:45:00+00:00","value":256.11},{"at":"2026-10-06T06:00:00+00:00","value":286.59},{"at":"2026-10-06T06:15:00+00:00","value":258.05},{"at":"2026-10-06T06:30:00+00:00","value":244.68},{"at":"2026-10-06T06:45:00+00:00","value":214.74},{"at":"2026-10-06T07:00:00+00:00","value":259.0},{"at":"2026-10-06T07:15:00+00:00","value":222.13},{"at":"2026-10-06T07:30:00+00:00","value":205.0},{"at":"2026-10-06T07:45:00+00:00","value":163.73},{"at":"2026-10-06T08:00:00+00:00","value":202.57},{"at":"2026-10-06T08:15:00+00:00","value":173.53},{"at":"2026-10-06T08:30:00+00:00","value":170.53},{"at":"2026-10-06T08:45:00+00:00","value":153.58},{"at":"2026-10-06T09:00:00+00:00","value":165.68},{"at":"2026-10-06T09:15:00+00:00","value":165.33},{"at":"2026-10-06T09:30:00+00:00","value":149.33},{"at":"2026-10-06T09:45:00+00:00","value":139.66},{"at":"2026-10-06T10:00:00+00:00","value":153.24},{"at":"2026-10-06T10:15:00+00:00","value":147.41},{"at":"2026-10-06T10:30:00+00:00","value":147.91},{"at":"2026-10-06T10:45:00+00:00","value":137.6},{"at":"2026-10-06T11:00:00+00:00","value":141.5},{"at":"2026-10-06T11:15:00+00:00","value":134.98},{"at":"2026-10-06T11:30:00+00:00","value":130.04},{"at":"2026-10-06T11:45:00+00:00","value":132.7},{"at":"2026-10-06T12:00:00+00:00","value":137.9},{"at":"2026-10-06T12:15:00+00:00","value":144.1},{"at":"2026-10-06T12:30:00+00:00","value":150.56},{"at":"2026-10-06T12:45:00+00:00","value":153.89},{"at":"2026-10-06T13:00:00+00:00","value":144.32},{"at":"2026-10-06T13:15:00+00:00","value":152.69},{"at":"2026-10-06T13:30:00+00:00","value":155.0},{"at":"2026-10-06T13:45:00+00:00","value":167.68},{"at":"2026-10-06T14:00:00+00:00","value":155.77},{"at":"2026-10-06T14:15:00+00:00","value":167.94},{"at":"2026-10-06T14:30:00+00:00","value":168.2},{"at":"2026-10-06T14:45:00+00:00","value":176.47},{"at":"2026-10-06T15:00:00+00:00","value":168.2},{"at":"2026-10-06T15:15:00+00:00","value":201.38},{"at":"2026-10-06T15:30:00+00:00","value":222.98},{"at":"2026-10-06T15:45:00+00:00","value":285.57},{"at":"2026-10-06T16:00:00+00:00","value":259.6},{"at":"2026-10-06T16:15:00+00:00","value":274.52},{"at":"2026-10-06T16:30:00+00:00","value":293.34},{"at":"2026-10-06T16:45:00+00:00","value":406.0},{"at":"2026-10-06T17:00:00+00:00","value":319.43},{"at":"2026-10-06T17:15:00+00:00","value":354.3},{"at":"2026-10-06T17:30:00+00:00","value":390.36},{"at":"2026-10-06T17:45:00+00:00","value":350.88},{"at":"2026-10-06T18:00:00+00:00","value":343.76},{"at":"2026-10-06T18:15:00+00:00","value":297.02},{"at":"2026-10-06T18:30:00+00:00","value":280.42},{"at":"2026-10-06T18:45:00+00:00","value":264.75},{"at":"2026-10-06T19:00:00+00:00","value":274.7},{"at":"2026-10-06T19:15:00+00:00","value":255.08},{"at":"2026-10-06T19:30:00+00:00","value":249.04},{"at":"2026-10-06T19:45:00+00:00","value":227.0},{"at":"2026-10-06T20:00:00+00:00","value":233.35},{"at":"2026-10-06T20:15:00+00:00","value":228.62},{"at":"2026-10-06T20:30:00+00:00","value":226.87},{"at":"2026-10-06T20:45:00+00:00","value":219.29},{"at":"2026-10-06T21:00:00+00:00","value":219.29},{"at":"2026-10-06T21:15:00+00:00","value":214.18},{"at":"2026-10-06T21:30:00+00:00","value":208.1},{"at":"2026-10-06T21:45:00+00:00","value":201.63},{"at":"2026-10-06T22:00:00+00:00","value":209.71},{"at":"2026-10-06T22:15:00+00:00","value":201.53},{"at":"2026-10-06T22:30:00+00:00","value":174.89},{"at":"2026-10-06T22:45:00+00:00","value":175.43},{"at":"2026-10-06T23:00:00+00:00","value":188.88},{"at":"2026-10-06T23:15:00+00:00","value":177.6},{"at":"2026-10-06T23:30:00+00:00","value":182.9},{"at":"2026-10-06T23:45:00+00:00","value":178.85},{"at":"2026-10-07T00:00:00+00:00","value":180.04},{"at":"2026-10-07T00:15:00+00:00","value":177.11},{"at":"2026-10-07T00:30:00+00:00","value":166.81},{"at":"2026-10-07T00:45:00+00:00","value":158.46},{"at":"2026-10-07T01:00:00+00:00","value":177.24},{"at":"2026-10-07T01:15:00+00:00","value":167.86},{"at":"2026-10-07T01:30:00+00:00","value":162.86},{"at":"2026-10-07T01:45:00+00:00","value":160.52},{"at":"2026-10-07T02:00:00+00:00","value":163.52},{"at":"2026-10-07T02:15:00+00:00","value":153.68},{"at":"2026-10-07T02:30:00+00:00","value":150.08},{"at":"2026-10-07T02:45:00+00:00","value":170.72},{"at":"2026-10-07T03:00:00+00:00","value":154.06},{"at":"2026-10-07T03:15:00+00:00","value":171.54},{"at":"2026-10-07T03:30:00+00:00","value":167.76},{"at":"2026-10-07T03:45:00+00:00","value":173.51},{"at":"2026-10-07T04:00:00+00:00","value":175.77},{"at":"2026-10-07T04:15:00+00:00","value":195.52},{"at":"2026-10-07T04:30:00+00:00","value":205.0},{"at":"2026-10-07T04:45:00+00:00","value":210.86},{"at":"2026-10-07T05:00:00+00:00","value":230.66},{"at":"2026-10-07T05:15:00+00:00","value":238.17},{"at":"2026-10-07T05:30:00+00:00","value":246.33},{"at":"2026-10-07T05:45:00+00:00","value":256.0},{"at":"2026-10-07T06:00:00+00:00","value":280.42},{"at":"2026-10-07T06:15:00+00:00","value":264.88},{"at":"2026-10-07T06:30:00+00:00","value":244.02},{"at":"2026-10-07T06:45:00+00:00","value":224.97},{"at":"2026-10-07T07:00:00+00:00","value":259.37},{"at":"2026-10-07T07:15:00+00:00","value":235.4},{"at":"2026-10-07T07:30:00+00:00","value":217.78},{"at":"2026-10-07T07:45:00+00:00","value":184.54},{"at":"2026-10-07T08:00:00+00:00","value":212.01},{"at":"2026-10-07T08:15:00+00:00","value":194.66},{"at":"2026-10-07T08:30:00+00:00","value":183.4},{"at":"2026-10-07T08:45:00+00:00","value":175.2},{"at":"2026-10-07T09:00:00+00:00","value":175.2},{"at":"2026-10-07T09:15:00+00:00","value":173.92},{"at":"2026-10-07T09:30:00+00:00","value":162.32},{"at":"2026-10-07T09:45:00+00:00","value":170.94},{"at":"2026-10-07T10:00:00+00:00","value":183.81},{"at":"2026-10-07T10:15:00+00:00","value":183.09},{"at":"2026-10-07T10:30:00+00:00","value":180.48},{"at":"2026-10-07T10:45:00+00:00","value":155.89},{"at":"2026-10-07T11:00:00+00:00","value":163.16},{"at":"2026-10-07T11:15:00+00:00","value":149.59},{"at":"2026-10-07T11:30:00+00:00","value":139.85},{"at":"2026-10-07T11:45:00+00:00","value":143.0},{"at":"2026-10-07T12:00:00+00:00","value":147.61},{"at":"2026-10-07T12:15:00+00:00","value":147.49},{"at":"2026-10-07T12:30:00+00:00","value":152.0},{"at":"2026-10-07T12:45:00+00:00","value":154.0},{"at":"2026-10-07T13:00:00+00:00","value":143.9},{"at":"2026-10-07T13:15:00+00:00","value":153.28},{"at":"2026-10-07T13:30:00+00:00","value":160.17},{"at":"2026-10-07T13:45:00+00:00","value":179.94},{"at":"2026-10-07T14:00:00+00:00","value":158.05},{"at":"2026-10-07T14:15:00+00:00","value":173.4},{"at":"2026-10-07T14:30:00+00:00","value":174.26},{"at":"2026-10-07T14:45:00+00:00","value":173.41},{"at":"2026-10-07T15:00:00+00:00","value":183.09},{"at":"2026-10-07T15:15:00+00:00","value":178.45},{"at":"2026-10-07T15:30:00+00:00","value":208.37},{"at":"2026-10-07T15:45:00+00:00","value":216.82},{"at":"2026-10-07T16:00:00+00:00","value":202.82},{"at":"2026-10-07T16:15:00+00:00","value":225.85},{"at":"2026-10-07T16:30:00+00:00","value":251.16},{"at":"2026-10-07T16:45:00+00:00","value":254.23},{"at":"2026-10-07T17:00:00+00:00","value":255.51},{"at":"2026-10-07T17:15:00+00:00","value":241.49},{"at":"2026-10-07T17:30:00+00:00","value":237.12},{"at":"2026-10-07T17:45:00+00:00","value":230.0},{"at":"2026-10-07T18:00:00+00:00","value":226.69},{"at":"2026-10-07T18:15:00+00:00","value":216.5},{"at":"2026-10-07T18:30:00+00:00","value":207.65},{"at":"2026-10-07T18:45:00+00:00","value":186.46},{"at":"2026-10-07T19:00:00+00:00","value":197.67},{"at":"2026-10-07T19:15:00+00:00","value":178.19},{"at":"2026-10-07T19:30:00+00:00","value":173.5},{"at":"2026-10-07T19:45:00+00:00","value":170.09},{"at":"2026-10-07T20:00:00+00:00","value":184.46},{"at":"2026-10-07T20:15:00+00:00","value":182.9},{"at":"2026-10-07T20:30:00+00:00","value":178.98},{"at":"2026-10-07T20:45:00+00:00","value":165.62},{"at":"2026-10-07T21:00:00+00:00","value":163.2},{"at":"2026-10-07T21:15:00+00:00","value":150.3},{"at":"2026-10-07T21:30:00+00:00","value":152.17},{"at":"2026-10-07T21:45:00+00:00","value":132.45},{"at":"2026-10-07T22:00:00+00:00","value":179.06},{"at":"2026-10-07T22:15:00+00:00","value":154.11},{"at":"2026-10-07T22:30:00+00:00","value":118.01},{"at":"2026-10-07T22:45:00+00:00","value":63.05},{"at":"2026-10-07T23:00:00+00:00","value":124.18},{"at":"2026-10-07T23:15:00+00:00","value":112.44},{"at":"2026-10-07T23:30:00+00:00","value":96.36},{"at":"2026-10-07T23:45:00+00:00","value":41.99},{"at":"2026-10-08T00:00:00+00:00","value":62.99},{"at":"2026-10-08T00:15:00+00:00","value":42.1},{"at":"2026-10-08T00:30:00+00:00","value":19.18},{"at":"2026-10-08T00:45:00+00:00","value":20.0},{"at":"2026-10-08T01:00:00+00:00","value":17.0},{"at":"2026-10-08T01:15:00+00:00","value":0.16},{"at":"2026-10-08T01:30:00+00:00","value":24.85},{"at":"2026-10-08T01:45:00+00:00","value":12.97},{"at":"2026-10-08T02:00:00+00:00","value":15.97},{"at":"2026-10-08T02:15:00+00:00","value":3.19},{"at":"2026-10-08T02:30:00+00:00","value":3.87},{"at":"2026-10-08T02:45:00+00:00","value":3.19},{"at":"2026-10-08T03:00:00+00:00","value":41.1},{"at":"2026-10-08T03:15:00+00:00","value":28.07},{"at":"2026-10-08T03:30:00+00:00","value":17.31},{"at":"2026-10-08T03:45:00+00:00","value":42.87},{"at":"2026-10-08T04:00:00+00:00","value":93.35},{"at":"2026-10-08T04:15:00+00:00","value":121.28},{"at":"2026-10-08T04:30:00+00:00","value":120.18},{"at":"2026-10-08T04:45:00+00:00","value":146.98},{"at":"2026-10-08T05:00:00+00:00","value":149.0},{"at":"2026-10-08T05:15:00+00:00","value":164.45},{"at":"2026-10-08T05:30:00+00:00","value":176.93},{"at":"2026-10-08T05:45:00+00:00","value":184.63},{"at":"2026-10-08T06:00:00+00:00","value":204.4},{"at":"2026-10-08T06:15:00+00:00","value":203.0},{"at":"2026-10-08T06:30:00+00:00","value":194.95},{"at":"2026-10-08T06:45:00+00:00","value":179.72},{"at":"2026-10-08T07:00:00+00:00","value":192.89},{"at":"2026-10-08T07:15:00+00:00","value":182.51},{"at":"2026-10-08T07:30:00+00:00","value":163.7},{"at":"2026-10-08T07:45:00+00:00","value":155.67},{"at":"2026-10-08T08:00:00+00:00","value":161.03},{"at":"2026-10-08T08:15:00+00:00","value":109.88},{"at":"2026-10-08T08:30:00+00:00","value":83.88},{"at":"2026-10-08T08:45:00+00:00","value":26.45},{"at":"2026-10-08T09:00:00+00:00","value":42.81},{"at":"2026-10-08T09:15:00+00:00","value":60.05},{"at":"2026-10-08T09:30:00+00:00","value":73.89},{"at":"2026-10-08T09:45:00+00:00","value":48.39},{"at":"2026-10-08T10:00:00+00:00","value":59.16},{"at":"2026-10-08T10:15:00+00:00","value":24.26},{"at":"2026-10-08T10:30:00+00:00","value":35.02},{"at":"2026-10-08T10:45:00+00:00","value":36.67},{"at":"2026-10-08T11:00:00+00:00","value":6.01},{"at":"2026-10-08T11:15:00+00:00","value":3.19},{"at":"2026-10-08T11:30:00+00:00","value":0.0},{"at":"2026-10-08T11:45:00+00:00","value":0.0},{"at":"2026-10-08T12:00:00+00:00","value":12.0},{"at":"2026-10-08T12:15:00+00:00","value":15.33},{"at":"2026-10-08T12:30:00+00:00","value":23.01},{"at":"2026-10-08T12:45:00+00:00","value":40.99},{"at":"2026-10-08T13:00:00+00:00","value":37.99},{"at":"2026-10-08T13:15:00+00:00","value":17.15},{"at":"2026-10-08T13:30:00+00:00","value":19.49},{"at":"2026-10-08T13:45:00+00:00","value":31.7},{"at":"2026-10-08T14:00:00+00:00","value":19.77},{"at":"2026-10-08T14:15:00+00:00","value":56.58},{"at":"2026-10-08T14:30:00+00:00","value":94.85},{"at":"2026-10-08T14:45:00+00:00","value":125.05},{"at":"2026-10-08T15:00:00+00:00","value":113.62},{"at":"2026-10-08T15:15:00+00:00","value":135.8},{"at":"2026-10-08T15:30:00+00:00","value":160.01},{"at":"2026-10-08T15:45:00+00:00","value":183.51},{"at":"2026-10-08T16:00:00+00:00","value":166.97},{"at":"2026-10-08T16:15:00+00:00","value":183.73},{"at":"2026-10-08T16:30:00+00:00","value":199.69},{"at":"2026-10-08T16:45:00+00:00","value":250.25},{"at":"2026-10-08T17:00:00+00:00","value":204.27},{"at":"2026-10-08T17:15:00+00:00","value":233.01},{"at":"2026-10-08T17:30:00+00:00","value":253.7},{"at":"2026-10-08T17:45:00+00:00","value":249.22},{"at":"2026-10-08T18:00:00+00:00","value":223.32},{"at":"2026-10-08T18:15:00+00:00","value":203.8},{"at":"2026-10-08T18:30:00+00:00","value":200.0},{"at":"2026-10-08T18:45:00+00:00","value":195.28},{"at":"2026-10-08T19:00:00+00:00","value":188.33},{"at":"2026-10-08T19:15:00+00:00","value":187.14},{"at":"2026-10-08T19:30:00+00:00","value":188.08},{"at":"2026-10-08T19:45:00+00:00","value":179.79},{"at":"2026-10-08T20:00:00+00:00","value":168.32},{"at":"2026-10-08T20:15:00+00:00","value":166.79},{"at":"2026-10-08T20:30:00+00:00","value":177.99},{"at":"2026-10-08T20:45:00+00:00","value":174.31},{"at":"2026-10-08T21:00:00+00:00","value":172.23},{"at":"2026-10-08T21:15:00+00:00","value":160.6},{"at":"2026-10-08T21:30:00+00:00","value":156.91},{"at":"2026-10-08T21:45:00+00:00","value":149.0},{"at":"2026-10-08T22:00:00+00:00","value":126.7},{"at":"2026-10-08T22:15:00+00:00","value":118.98},{"at":"2026-10-08T22:30:00+00:00","value":115.37},{"at":"2026-10-08T22:45:00+00:00","value":112.6},{"at":"2026-10-08T23:00:00+00:00","value":107.23},{"at":"2026-10-08T23:15:00+00:00","value":103.77},{"at":"2026-10-08T23:30:00+00:00","value":102.27},{"at":"2026-10-08T23:45:00+00:00","value":81.84},{"at":"2026-10-09T00:00:00+00:00","value":96.34},{"at":"2026-10-09T00:15:00+00:00","value":84.76},{"at":"2026-10-09T00:30:00+00:00","value":78.39},{"at":"2026-10-09T00:45:00+00:00","value":21.66},{"at":"2026-10-09T01:00:00+00:00","value":85.46},{"at":"2026-10-09T01:15:00+00:00","value":57.73},{"at":"2026-10-09T01:30:00+00:00","value":43.84},{"at":"2026-10-09T01:45:00+00:00","value":26.0},{"at":"2026-10-09T02:00:00+00:00","value":51.0},{"at":"2026-10-09T02:15:00+00:00","value":38.13},{"at":"2026-10-09T02:30:00+00:00","value":32.34},{"at":"2026-10-09T02:45:00+00:00","value":11.29},{"at":"2026-10-09T03:00:00+00:00","value":33.99},{"at":"2026-10-09T03:15:00+00:00","value":6.06},{"at":"2026-10-09T03:30:00+00:00","value":41.57},{"at":"2026-10-09T03:45:00+00:00","value":70.01},{"at":"2026-10-09T04:00:00+00:00","value":27.31},{"at":"2026-10-09T04:15:00+00:00","value":92.01},{"at":"2026-10-09T04:30:00+00:00","value":97.19},{"at":"2026-10-09T04:45:00+00:00","value":124.56},{"at":"2026-10-09T05:00:00+00:00","value":137.99},{"at":"2026-10-09T05:15:00+00:00","value":143.55},{"at":"2026-10-09T05:30:00+00:00","value":146.66},{"at":"2026-10-09T05:45:00+00:00","value":144.33},{"at":"2026-10-09T06:00:00+00:00","value":175.72},{"at":"2026-10-09T06:15:00+00:00","value":164.39},{"at":"2026-10-09T06:30:00+00:00","value":158.03},{"at":"2026-10-09T06:45:00+00:00","value":132.88},{"at":"2026-10-09T07:00:00+00:00","value":149.32},{"at":"2026-10-09T07:15:00+00:00","value":135.22},{"at":"2026-10-09T07:30:00+00:00","value":123.55},{"at":"2026-10-09T07:45:00+00:00","value":75.5},{"at":"2026-10-09T08:00:00+00:00","value":128.02},{"at":"2026-10-09T08:15:00+00:00","value":106.71},{"at":"2026-10-09T08:30:00+00:00","value":84.55},{"at":"2026-10-09T08:45:00+00:00","value":59.51},{"at":"2026-10-09T09:00:00+00:00","value":80.92},{"at":"2026-10-09T09:15:00+00:00","value":68.65},{"at":"2026-10-09T09:30:00+00:00","value":51.65},{"at":"2026-10-09T09:45:00+00:00","value":53.99},{"at":"2026-10-09T10:00:00+00:00","value":55.41},{"at":"2026-10-09T10:15:00+00:00","value":45.0},{"at":"2026-10-09T10:30:00+00:00","value":40.83},{"at":"2026-10-09T10:45:00+00:00","value":36.27},{"at":"2026-10-09T11:00:00+00:00","value":30.0},{"at":"2026-10-09T11:15:00+00:00","value":19.86},{"at":"2026-10-09T11:30:00+00:00","value":14.0},{"at":"2026-10-09T11:45:00+00:00","value":12.05},{"at":"2026-10-09T12:00:00+00:00","value":39.45},{"at":"2026-10-09T12:15:00+00:00","value":30.34},{"at":"2026-10-09T12:30:00+00:00","value":28.36},{"at":"2026-10-09T12:45:00+00:00","value":27.83},{"at":"2026-10-09T13:00:00+00:00","value":24.83},{"at":"2026-10-09T13:15:00+00:00","value":13.03},{"at":"2026-10-09T13:30:00+00:00","value":17.18},{"at":"2026-10-09T13:45:00+00:00","value":10.76},{"at":"2026-10-09T14:00:00+00:00","value":7.76},{"at":"2026-10-09T14:15:00+00:00","value":19.0},{"at":"2026-10-09T14:30:00+00:00","value":23.86},{"at":"2026-10-09T14:45:00+00:00","value":34.68},{"at":"2026-10-09T15:00:00+00:00","value":39.41},{"at":"2026-10-09T15:15:00+00:00","value":44.14},{"at":"2026-10-09T15:30:00+00:00","value":68.03},{"at":"2026-10-09T15:45:00+00:00","value":89.05},{"at":"2026-10-09T16:00:00+00:00","value":65.5},{"at":"2026-10-09T16:15:00+00:00","value":100.0},{"at":"2026-10-09T16:30:00+00:00","value":121.0},{"at":"2026-10-09T16:45:00+00:00","value":130.84},{"at":"2026-10-09T17:00:00+00:00","value":135.67},{"at":"2026-10-09T17:15:00+00:00","value":127.42},{"at":"2026-10-09T17:30:00+00:00","value":123.81},{"at":"2026-10-09T17:45:00+00:00","value":118.68},{"at":"2026-10-09T18:00:00+00:00","value":118.08},{"at":"2026-10-09T18:15:00+00:00","value":107.87},{"at":"2026-10-09T18:30:00+00:00","value":104.79},{"at":"2026-10-09T18:45:00+00:00","value":103.55},{"at":"2026-10-09T19:00:00+00:00","value":108.01},{"at":"2026-10-09T19:15:00+00:00","value":97.73},{"at":"2026-10-09T19:30:00+00:00","value":81.46},{"at":"2026-10-09T19:45:00+00:00","value":64.95},{"at":"2026-10-09T20:00:00+00:00","value":75.36},{"at":"2026-10-09T20:15:00+00:00","value":65.15},{"at":"2026-10-09T20:30:00+00:00","value":83.78},{"at":"2026-10-09T20:45:00+00:00","value":73.7},{"at":"2026-10-09T21:00:00+00:00","value":49.22},{"at":"2026-10-09T21:15:00+00:00","value":31.65},{"at":"2026-10-09T21:30:00+00:00","value":40.68},{"at":"2026-10-09T21:45:00+00:00","value":44.01},{"at":"2026-10-09T22:00:00+00:00","value":23.21},{"at":"2026-10-09T22:15:00+00:00","value":32.04},{"at":"2026-10-09T22:30:00+00:00","value":29.92},{"at":"2026-10-09T22:45:00+00:00","value":23.83},{"at":"2026-10-09T23:00:00+00:00","value":25.31},{"at":"2026-10-09T23:15:00+00:00","value":20.56},{"at":"2026-10-09T23:30:00+00:00","value":25.6},{"at":"2026-10-09T23:45:00+00:00","value":26.23},{"at":"2026-10-10T00:00:00+00:00","value":23.73},{"at":"2026-10-10T00:15:00+00:00","value":23.09},{"at":"2026-10-10T00:30:00+00:00","value":24.53},{"at":"2026-10-10T00:45:00+00:00","value":27.41},{"at":"2026-10-10T01:00:00+00:00","value":25.43},{"at":"2026-10-10T01:15:00+00:00","value":25.92},{"at":"2026-10-10T01:30:00+00:00","value":25.42},{"at":"2026-10-10T01:45:00+00:00","value":27.96},{"at":"2026-10-10T02:00:00+00:00","value":5.86},{"at":"2026-10-10T02:15:00+00:00","value":8.71},{"at":"2026-10-10T02:30:00+00:00","value":8.55},{"at":"2026-10-10T02:45:00+00:00","value":21.61},{"at":"2026-10-10T03:00:00+00:00","value":21.46},{"at":"2026-10-10T03:15:00+00:00","value":20.99},{"at":"2026-10-10T03:30:00+00:00","value":24.61},{"at":"2026-10-10T03:45:00+00:00","value":29.18},{"at":"2026-10-10T04:00:00+00:00","value":18.73},{"at":"2026-10-10T04:15:00+00:00","value":35.08},{"at":"2026-10-10T04:30:00+00:00","value":39.4},{"at":"2026-10-10T04:45:00+00:00","value":40.1},{"at":"2026-10-10T05:00:00+00:00","value":49.84},{"at":"2026-10-10T05:15:00+00:00","value":45.92},{"at":"2026-10-10T05:30:00+00:00","value":45.0},{"at":"2026-10-10T05:45:00+00:00","value":35.45},{"at":"2026-10-10T06:00:00+00:00","value":62.82},{"at":"2026-10-10T06:15:00+00:00","value":63.7},{"at":"2026-10-10T06:30:00+00:00","value":57.59},{"at":"2026-10-10T06:45:00+00:00","value":52.86},{"at":"2026-10-10T07:00:00+00:00","value":59.11},{"at":"2026-10-10T07:15:00+00:00","value":47.96},{"at":"2026-10-10T07:30:00+00:00","value":45.0},{"at":"2026-10-10T07:45:00+00:00","value":36.08},{"at":"2026-10-10T08:00:00+00:00","value":46.28},{"at":"2026-10-10T08:15:00+00:00","value":34.93},{"at":"2026-10-10T08:30:00+00:00","value":21.17},{"at":"2026-10-10T08:45:00+00:00","value":1.95},{"at":"2026-10-10T09:00:00+00:00","value":1.95},{"at":"2026-10-10T09:15:00+00:00","value":1.07},{"at":"2026-10-10T09:30:00+00:00","value":0.51},{"at":"2026-10-10T09:45:00+00:00","value":0.01},{"at":"2026-10-10T10:00:00+00:00","value":3.69},{"at":"2026-10-10T10:15:00+00:00","value":0.99},{"at":"2026-10-10T10:30:00+00:00","value":0.0},{"at":"2026-10-10T10:45:00+00:00","value":0.0},{"at":"2026-10-10T11:00:00+00:00","value":0.0},{"at":"2026-10-10T11:15:00+00:00","value":0.0},{"at":"2026-10-10T11:30:00+00:00","value":0.0},{"at":"2026-10-10T11:45:00+00:00","value":0.0},{"at":"2026-10-10T12:00:00+00:00","value":0.0},{"at":"2026-10-10T12:15:00+00:00","value":0.0},{"at":"2026-10-10T12:30:00+00:00","value":0.0},{"at":"2026-10-10T12:45:00+00:00","value":0.0},{"at":"2026-10-10T13:00:00+00:00","value":-0.01},{"at":"2026-10-10T13:15:00+00:00","value":-0.01},{"at":"2026-10-10T13:30:00+00:00","value":-0.01},{"at":"2026-10-10T13:45:00+00:00","value":-0.01},{"at":"2026-10-10T14:00:00+00:00","value":-0.01},{"at":"2026-10-10T14:15:00+00:00","value":-0.01},{"at":"2026-10-10T14:30:00+00:00","value":0.0},{"at":"2026-10-10T14:45:00+00:00","value":0.0},{"at":"2026-10-10T15:00:00+00:00","value":1.07},{"at":"2026-10-10T15:15:00+00:00","value":11.3},{"at":"2026-10-10T15:30:00+00:00","value":44.6},{"at":"2026-10-10T15:45:00+00:00","value":59.27},{"at":"2026-10-10T16:00:00+00:00","value":94.57},{"at":"2026-10-10T16:15:00+00:00","value":129.55},{"at":"2026-10-10T16:30:00+00:00","value":144.32},{"at":"2026-10-10T16:45:00+00:00","value":180.3},{"at":"2026-10-10T17:00:00+00:00","value":175.58},{"at":"2026-10-10T17:15:00+00:00","value":173.05},{"at":"2026-10-10T17:30:00+00:00","value":170.66},{"at":"2026-10-10T17:45:00+00:00","value":173.1},{"at":"2026-10-10T18:00:00+00:00","value":160.11},{"at":"2026-10-10T18:15:00+00:00","value":152.19},{"at":"2026-10-10T18:30:00+00:00","value":148.99},{"at":"2026-10-10T18:45:00+00:00","value":143.27},{"at":"2026-10-10T19:00:00+00:00","value":140.47},{"at":"2026-10-10T19:15:00+00:00","value":135.78},{"at":"2026-10-10T19:30:00+00:00","value":132.77},{"at":"2026-10-10T19:45:00+00:00","value":125.85},{"at":"2026-10-10T20:00:00+00:00","value":132.13},{"at":"2026-10-10T20:15:00+00:00","value":127.43},{"at":"2026-10-10T20:30:00+00:00","value":132.54},{"at":"2026-10-10T20:45:00+00:00","value":136.9},{"at":"2026-10-10T21:00:00+00:00","value":125.93},{"at":"2026-10-10T21:15:00+00:00","value":124.7},{"at":"2026-10-10T21:30:00+00:00","value":126.16},{"at":"2026-10-10T21:45:00+00:00","value":120.41},{"at":"2026-10-10T22:00:00+00:00","value":148.2},{"at":"2026-10-10T22:15:00+00:00","value":123.35},{"at":"2026-10-10T22:30:00+00:00","value":111.6},{"at":"2026-10-10T22:45:00+00:00","value":104.75},{"at":"2026-10-10T23:00:00+00:00","value":117.56},{"at":"2026-10-10T23:15:00+00:00","value":111.13},{"at":"2026-10-10T23:30:00+00:00","value":110.15},{"at":"2026-10-10T23:45:00+00:00","value":103.26},{"at":"2026-10-11T00:00:00+00:00","value":112.99},{"at":"2026-10-11T00:15:00+00:00","value":105.81},{"at":"2026-10-11T00:30:00+00:00","value":108.04},{"at":"2026-10-11T00:45:00+00:00","value":104.9},{"at":"2026-10-11T01:00:00+00:00","value":105.13},{"at":"2026-10-11T01:15:00+00:00","value":106.0},{"at":"2026-10-11T01:30:00+00:00","value":108.45},{"at":"2026-10-11T01:45:00+00:00","value":105.54},{"at":"2026-10-11T02:00:00+00:00","value":105.76},{"at":"2026-10-11T02:15:00+00:00","value":106.96},{"at":"2026-10-11T02:30:00+00:00","value":108.42},{"at":"2026-10-11T02:45:00+00:00","value":109.26},{"at":"2026-10-11T03:00:00+00:00","value":107.5},{"at":"2026-10-11T03:15:00+00:00","value":104.24},{"at":"2026-10-11T03:30:00+00:00","value":107.05},{"at":"2026-10-11T03:45:00+00:00","value":108.89},{"at":"2026-10-11T04:00:00+00:00","value":106.08},{"at":"2026-10-11T04:15:00+00:00","value":109.47},{"at":"2026-10-11T04:30:00+00:00","value":113.6},{"at":"2026-10-11T04:45:00+00:00","value":119.96},{"at":"2026-10-11T05:00:00+00:00","value":132.13},{"at":"2026-10-11T05:15:00+00:00","value":134.06},{"at":"2026-10-11T05:30:00+00:00","value":129.51},{"at":"2026-10-11T05:45:00+00:00","value":131.17},{"at":"2026-10-11T06:00:00+00:00","value":145.31},{"at":"2026-10-11T06:15:00+00:00","value":142.72},{"at":"2026-10-11T06:30:00+00:00","value":143.87},{"at":"2026-10-11T06:45:00+00:00","value":138.91},{"at":"2026-10-11T07:00:00+00:00","value":140.67},{"at":"2026-10-11T07:15:00+00:00","value":133.36},{"at":"2026-10-11T07:30:00+00:00","value":114.77},{"at":"2026-10-11T07:45:00+00:00","value":99.37},{"at":"2026-10-11T08:00:00+00:00","value":109.73},{"at":"2026-10-11T08:15:00+00:00","value":90.0},{"at":"2026-10-11T08:30:00+00:00","value":79.26},{"at":"2026-10-11T08:45:00+00:00","value":56.76},{"at":"2026-10-11T09:00:00+00:00","value":49.36},{"at":"2026-10-11T09:15:00+00:00","value":37.28},{"at":"2026-10-11T09:30:00+00:00","value":32.58},{"at":"2026-10-11T09:45:00+00:00","value":40.09},{"at":"2026-10-11T10:00:00+00:00","value":35.06},{"at":"2026-10-11T10:15:00+00:00","value":33.19},{"at":"2026-10-11T10:30:00+00:00","value":29.0},{"at":"2026-10-11T10:45:00+00:00","value":24.48},{"at":"2026-10-11T11:00:00+00:00","value":20.63},{"at":"2026-10-11T11:15:00+00:00","value":17.43},{"at":"2026-10-11T11:30:00+00:00","value":13.43},{"at":"2026-10-11T11:45:00+00:00","value":17.68},{"at":"2026-10-11T12:00:00+00:00","value":22.23},{"at":"2026-10-11T12:15:00+00:00","value":27.41},{"at":"2026-10-11T12:30:00+00:00","value":36.82},{"at":"2026-10-11T12:45:00+00:00","value":46.53},{"at":"2026-10-11T13:00:00+00:00","value":43.01},{"at":"2026-10-11T13:15:00+00:00","value":59.02},{"at":"2026-10-11T13:30:00+00:00","value":76.02},{"at":"2026-10-11T13:45:00+00:00","value":98.92},{"at":"2026-10-11T14:00:00+00:00","value":94.25},{"at":"2026-10-11T14:15:00+00:00","value":106.35},{"at":"2026-10-11T14:30:00+00:00","value":112.06},{"at":"2026-10-11T14:45:00+00:00","value":148.34},{"at":"2026-10-11T15:00:00+00:00","value":151.31},{"at":"2026-10-11T15:15:00+00:00","value":190.3},{"at":"2026-10-11T15:30:00+00:00","value":216.16},{"at":"2026-10-11T15:45:00+00:00","value":233.45},{"at":"2026-10-11T16:00:00+00:00","value":216.93},{"at":"2026-10-11T16:15:00+00:00","value":228.39},{"at":"2026-10-11T16:30:00+00:00","value":228.8},{"at":"2026-10-11T16:45:00+00:00","value":238.57},{"at":"2026-10-11T17:00:00+00:00","value":223.63},{"at":"2026-10-11T17:15:00+00:00","value":234.01},{"at":"2026-10-11T17:30:00+00:00","value":239.92},{"at":"2026-10-11T17:45:00+00:00","value":241.59},{"at":"2026-10-11T18:00:00+00:00","value":241.52},{"at":"2026-10-11T18:15:00+00:00","value":234.58},{"at":"2026-10-11T18:30:00+00:00","value":233.52},{"at":"2026-10-11T18:45:00+00:00","value":226.37},{"at":"2026-10-11T19:00:00+00:00","value":225.52},{"at":"2026-10-11T19:15:00+00:00","value":218.0},{"at":"2026-10-11T19:30:00+00:00","value":212.34},{"at":"2026-10-11T19:45:00+00:00","value":207.97},{"at":"2026-10-11T20:00:00+00:00","value":207.08},{"at":"2026-10-11T20:15:00+00:00","value":204.1},{"at":"2026-10-11T20:30:00+00:00","value":204.66},{"at":"2026-10-11T20:45:00+00:00","value":191.54},{"at":"2026-10-11T21:00:00+00:00","value":200.13},{"at":"2026-10-11T21:15:00+00:00","value":190.9},{"at":"2026-10-11T21:30:00+00:00","value":183.07},{"at":"2026-10-11T21:45:00+00:00","value":167.15},{"at":"2026-10-11T22:00:00+00:00","value":181.97},{"at":"2026-10-11T22:15:00+00:00","value":181.48},{"at":"2026-10-11T22:30:00+00:00","value":179.68},{"at":"2026-10-11T22:45:00+00:00","value":177.96},{"at":"2026-10-11T23:00:00+00:00","value":176.63},{"at":"2026-10-11T23:15:00+00:00","value":172.1},{"at":"2026-10-11T23:30:00+00:00","value":174.68},{"at":"2026-10-11T23:45:00+00:00","value":175.07},{"at":"2026-10-12T00:00:00+00:00","value":175.93},{"at":"2026-10-12T00:15:00+00:00","value":172.65},{"at":"2026-10-12T00:30:00+00:00","value":167.72},{"at":"2026-10-12T00:45:00+00:00","value":164.3},{"at":"2026-10-12T01:00:00+00:00","value":168.59},{"at":"2026-10-12T01:15:00+00:00","value":168.26},{"at":"2026-10-12T01:30:00+00:00","value":166.49},{"at":"2026-10-12T01:45:00+00:00","value":168.76},{"at":"2026-10-12T02:00:00+00:00","value":162.98},{"at":"2026-10-12T02:15:00+00:00","value":159.48},{"at":"2026-10-12T02:30:00+00:00","value":163.72},{"at":"2026-10-12T02:45:00+00:00","value":162.87},{"at":"2026-10-12T03:00:00+00:00","value":164.67},{"at":"2026-10-12T03:15:00+00:00","value":174.58},{"at":"2026-10-12T03:30:00+00:00","value":178.22},{"at":"2026-10-12T03:45:00+00:00","value":189.25},{"at":"2026-10-12T04:00:00+00:00","value":197.62},{"at":"2026-10-12T04:15:00+00:00","value":200.0},{"at":"2026-10-12T04:30:00+00:00","value":209.7},{"at":"2026-10-12T04:45:00+00:00","value":217.93},{"at":"2026-10-12T05:00:00+00:00","value":237.99},{"at":"2026-10-12T05:15:00+00:00","value":257.54},{"at":"2026-10-12T05:30:00+00:00","value":253.5},{"at":"2026-10-12T05:45:00+00:00","value":269.29},{"at":"2026-10-12T06:00:00+00:00","value":288.49},{"at":"2026-10-12T06:15:00+00:00","value":277.17},{"at":"2026-10-12T06:30:00+00:00","value":254.0},{"at":"2026-10-12T06:45:00+00:00","value":236.57},{"at":"2026-10-12T07:00:00+00:00","value":263.34},{"at":"2026-10-12T07:15:00+00:00","value":226.02},{"at":"2026-10-12T07:30:00+00:00","value":209.94},{"at":"2026-10-12T07:45:00+00:00","value":186.76},{"at":"2026-10-12T08:00:00+00:00","value":206.39},{"at":"2026-10-12T08:15:00+00:00","value":192.96},{"at":"2026-10-12T08:30:00+00:00","value":184.83},{"at":"2026-10-12T08:45:00+00:00","value":177.88},{"at":"2026-10-12T09:00:00+00:00","value":190.88},{"at":"2026-10-12T09:15:00+00:00","value":173.98},{"at":"2026-10-12T09:30:00+00:00","value":167.11},{"at":"2026-10-12T09:45:00+00:00","value":164.36},{"at":"2026-10-12T10:00:00+00:00","value":163.06},{"at":"2026-10-12T10:15:00+00:00","value":158.15},{"at":"2026-10-12T10:30:00+00:00","value":154.1},{"at":"2026-10-12T10:45:00+00:00","value":154.27},{"at":"2026-10-12T11:00:00+00:00","value":154.62},{"at":"2026-10-12T11:15:00+00:00","value":150.6},{"at":"2026-10-12T11:30:00+00:00","value":146.21},{"at":"2026-10-12T11:45:00+00:00","value":142.59},{"at":"2026-10-12T12:00:00+00:00","value":143.4},{"at":"2026-10-12T12:15:00+00:00","value":147.82},{"at":"2026-10-12T12:30:00+00:00","value":154.61},{"at":"2026-10-12T12:45:00+00:00","value":161.36},{"at":"2026-10-12T13:00:00+00:00","value":154.85},{"at":"2026-10-12T13:15:00+00:00","value":157.39},{"at":"2026-10-12T13:30:00+00:00","value":162.42},{"at":"2026-10-12T13:45:00+00:00","value":165.53},{"at":"2026-10-12T14:00:00+00:00","value":155.34},{"at":"2026-10-12T14:15:00+00:00","value":169.68},{"at":"2026-10-12T14:30:00+00:00","value":186.68},{"at":"2026-10-12T14:45:00+00:00","value":195.99},{"at":"2026-10-12T15:00:00+00:00","value":176.46},{"at":"2026-10-12T15:15:00+00:00","value":176.18},{"at":"2026-10-12T15:30:00+00:00","value":190.29},{"at":"2026-10-12T15:45:00+00:00","value":240.71},{"at":"2026-10-12T16:00:00+00:00","value":199.59},{"at":"2026-10-12T16:15:00+00:00","value":256.43},{"at":"2026-10-12T16:30:00+00:00","value":273.73},{"at":"2026-10-12T16:45:00+00:00","value":291.47},{"at":"2026-10-12T17:00:00+00:00","value":283.89},{"at":"2026-10-12T17:15:00+00:00","value":281.84},{"at":"2026-10-12T17:30:00+00:00","value":280.1},{"at":"2026-10-12T17:45:00+00:00","value":272.31},{"at":"2026-10-12T18:00:00+00:00","value":273.01},{"at":"2026-10-12T18:15:00+00:00","value":257.06},{"at":"2026-10-12T18:30:00+00:00","value":247.6},{"at":"2026-10-12T18:45:00+00:00","value":225.35},{"at":"2026-10-12T19:00:00+00:00","value":235.4},{"at":"2026-10-12T19:15:00+00:00","value":215.05},{"at":"2026-10-12T19:30:00+00:00","value":198.55},{"at":"2026-10-12T19:45:00+00:00","value":190.52},{"at":"2026-10-12T20:00:00+00:00","value":200.81},{"at":"2026-10-12T20:15:00+00:00","value":193.39},{"at":"2026-10-12T20:30:00+00:00","value":194.06},{"at":"2026-10-12T20:45:00+00:00","value":188.01},{"at":"2026-10-12T21:00:00+00:00","value":186.44},{"at":"2026-10-12T21:15:00+00:00","value":180.92},{"at":"2026-10-12T21:30:00+00:00","value":178.91},{"at":"2026-10-12T21:45:00+00:00","value":173.71}],"de":[{"at":"2026-09-18T22:00:00+00:00","value":132.52},{"at":"2026-09-18T22:15:00+00:00","value":117.76},{"at":"2026-09-18T22:30:00+00:00","value":97.43},{"at":"2026-09-18T22:45:00+00:00","value":65.83},{"at":"2026-09-18T23:00:00+00:00","value":96.05},{"at":"2026-09-18T23:15:00+00:00","value":82.44},{"at":"2026-09-18T23:30:00+00:00","value":79.18},{"at":"2026-09-18T23:45:00+00:00","value":60.43},{"at":"2026-09-19T00:00:00+00:00","value":73.77},{"at":"2026-09-19T00:15:00+00:00","value":62.38},{"at":"2026-09-19T00:30:00+00:00","value":52.75},{"at":"2026-09-19T00:45:00+00:00","value":48.02},{"at":"2026-09-19T01:00:00+00:00","value":45.15},{"at":"2026-09-19T01:15:00+00:00","value":32.75},{"at":"2026-09-19T01:30:00+00:00","value":26.48},{"at":"2026-09-19T01:45:00+00:00","value":23.16},{"at":"2026-09-19T02:00:00+00:00","value":33.57},{"at":"2026-09-19T02:15:00+00:00","value":36.04},{"at":"2026-09-19T02:30:00+00:00","value":36.9},{"at":"2026-09-19T02:45:00+00:00","value":36.66},{"at":"2026-09-19T03:00:00+00:00","value":34.79},{"at":"2026-09-19T03:15:00+00:00","value":34.41},{"at":"2026-09-19T03:30:00+00:00","value":34.03},{"at":"2026-09-19T03:45:00+00:00","value":39.94},{"at":"2026-09-19T04:00:00+00:00","value":40.74},{"at":"2026-09-19T04:15:00+00:00","value":46.66},{"at":"2026-09-19T04:30:00+00:00","value":40.08},{"at":"2026-09-19T04:45:00+00:00","value":43.47},{"at":"2026-09-19T05:00:00+00:00","value":41.38},{"at":"2026-09-19T05:15:00+00:00","value":41.99},{"at":"2026-09-19T05:30:00+00:00","value":45.07},{"at":"2026-09-19T05:45:00+00:00","value":40.1},{"at":"2026-09-19T06:00:00+00:00","value":47.71},{"at":"2026-09-19T06:15:00+00:00","value":36.53},{"at":"2026-09-19T06:30:00+00:00","value":27.96},{"at":"2026-09-19T06:45:00+00:00","value":11.8},{"at":"2026-09-19T07:00:00+00:00","value":16.9},{"at":"2026-09-19T07:15:00+00:00","value":6.55},{"at":"2026-09-19T07:30:00+00:00","value":2.74},{"at":"2026-09-19T07:45:00+00:00","value":0.01},{"at":"2026-09-19T08:00:00+00:00","value":0.1},{"at":"2026-09-19T08:15:00+00:00","value":0.0},{"at":"2026-09-19T08:30:00+00:00","value":-0.03},{"at":"2026-09-19T08:45:00+00:00","value":-0.09},{"at":"2026-09-19T09:00:00+00:00","value":-0.13},{"at":"2026-09-19T09:15:00+00:00","value":-0.16},{"at":"2026-09-19T09:30:00+00:00","value":-0.21},{"at":"2026-09-19T09:45:00+00:00","value":-0.74},{"at":"2026-09-19T10:00:00+00:00","value":-0.78},{"at":"2026-09-19T10:15:00+00:00","value":-0.65},{"at":"2026-09-19T10:30:00+00:00","value":-0.71},{"at":"2026-09-19T10:45:00+00:00","value":-0.86},{"at":"2026-09-19T11:00:00+00:00","value":-1.01},{"at":"2026-09-19T11:15:00+00:00","value":-1.06},{"at":"2026-09-19T11:30:00+00:00","value":-1.34},{"at":"2026-09-19T11:45:00+00:00","value":-1.62},{"at":"2026-09-19T12:00:00+00:00","value":-1.27},{"at":"2026-09-19T12:15:00+00:00","value":-1.26},{"at":"2026-09-19T12:30:00+00:00","value":-1.21},{"at":"2026-09-19T12:45:00+00:00","value":-1.46},{"at":"2026-09-19T13:00:00+00:00","value":-1.85},{"at":"2026-09-19T13:15:00+00:00","value":-1.5},{"at":"2026-09-19T13:30:00+00:00","value":-1.43},{"at":"2026-09-19T13:45:00+00:00","value":-1.94},{"at":"2026-09-19T14:00:00+00:00","value":-0.1},{"at":"2026-09-19T14:15:00+00:00","value":-0.07},{"at":"2026-09-19T14:30:00+00:00","value":-0.01},{"at":"2026-09-19T14:45:00+00:00","value":0.0},{"at":"2026-09-19T15:00:00+00:00","value":0.0},{"at":"2026-09-19T15:15:00+00:00","value":0.0},{"at":"2026-09-19T15:30:00+00:00","value":8.2},{"at":"2026-09-19T15:45:00+00:00","value":25.0},{"at":"2026-09-19T16:00:00+00:00","value":30.0},{"at":"2026-09-19T16:15:00+00:00","value":51.74},{"at":"2026-09-19T16:30:00+00:00","value":79.66},{"at":"2026-09-19T16:45:00+00:00","value":100.43},{"at":"2026-09-19T17:00:00+00:00","value":99.98},{"at":"2026-09-19T17:15:00+00:00","value":119.52},{"at":"2026-09-19T17:30:00+00:00","value":129.37},{"at":"2026-09-19T17:45:00+00:00","value":134.25},{"at":"2026-09-19T18:00:00+00:00","value":133.07},{"at":"2026-09-19T18:15:00+00:00","value":119.19},{"at":"2026-09-19T18:30:00+00:00","value":107.0},{"at":"2026-09-19T18:45:00+00:00","value":99.94},{"at":"2026-09-19T19:00:00+00:00","value":101.57},{"at":"2026-09-19T19:15:00+00:00","value":99.95},{"at":"2026-09-19T19:30:00+00:00","value":91.05},{"at":"2026-09-19T19:45:00+00:00","value":67.32},{"at":"2026-09-19T20:00:00+00:00","value":88.87},{"at":"2026-09-19T20:15:00+00:00","value":86.21},{"at":"2026-09-19T20:30:00+00:00","value":83.64},{"at":"2026-09-19T20:45:00+00:00","value":75.7},{"at":"2026-09-19T21:00:00+00:00","value":85.0},{"at":"2026-09-19T21:15:00+00:00","value":80.0},{"at":"2026-09-19T21:30:00+00:00","value":77.65},{"at":"2026-09-19T21:45:00+00:00","value":70.82},{"at":"2026-09-19T22:00:00+00:00","value":18.2},{"at":"2026-09-19T22:15:00+00:00","value":16.37},{"at":"2026-09-19T22:30:00+00:00","value":14.99},{"at":"2026-09-19T22:45:00+00:00","value":13.61},{"at":"2026-09-19T23:00:00+00:00","value":14.85},{"at":"2026-09-19T23:15:00+00:00","value":13.05},{"at":"2026-09-19T23:30:00+00:00","value":12.49},{"at":"2026-09-19T23:45:00+00:00","value":11.04},{"at":"2026-09-20T00:00:00+00:00","value":8.57},{"at":"2026-09-20T00:15:00+00:00","value":11.25},{"at":"2026-09-20T00:30:00+00:00","value":12.2},{"at":"2026-09-20T00:45:00+00:00","value":8.0},{"at":"2026-09-20T01:00:00+00:00","value":8.19},{"at":"2026-09-20T01:15:00+00:00","value":7.92},{"at":"2026-09-20T01:30:00+00:00","value":8.05},{"at":"2026-09-20T01:45:00+00:00","value":7.09},{"at":"2026-09-20T02:00:00+00:00","value":9.69},{"at":"2026-09-20T02:15:00+00:00","value":8.95},{"at":"2026-09-20T02:30:00+00:00","value":8.75},{"at":"2026-09-20T02:45:00+00:00","value":8.6},{"at":"2026-09-20T03:00:00+00:00","value":10.12},{"at":"2026-09-20T03:15:00+00:00","value":9.62},{"at":"2026-09-20T03:30:00+00:00","value":9.47},{"at":"2026-09-20T03:45:00+00:00","value":10.81},{"at":"2026-09-20T04:00:00+00:00","value":8.13},{"at":"2026-09-20T04:15:00+00:00","value":8.96},{"at":"2026-09-20T04:30:00+00:00","value":10.37},{"at":"2026-09-20T04:45:00+00:00","value":12.55},{"at":"2026-09-20T05:00:00+00:00","value":11.51},{"at":"2026-09-20T05:15:00+00:00","value":12.74},{"at":"2026-09-20T05:30:00+00:00","value":13.34},{"at":"2026-09-20T05:45:00+00:00","value":11.49},{"at":"2026-09-20T06:00:00+00:00","value":13.4},{"at":"2026-09-20T06:15:00+00:00","value":12.51},{"at":"2026-09-20T06:30:00+00:00","value":8.34},{"at":"2026-09-20T06:45:00+00:00","value":5.12},{"at":"2026-09-20T07:00:00+00:00","value":8.15},{"at":"2026-09-20T07:15:00+00:00","value":5.06},{"at":"2026-09-20T07:30:00+00:00","value":1.4},{"at":"2026-09-20T07:45:00+00:00","value":0.01},{"at":"2026-09-20T08:00:00+00:00","value":0.01},{"at":"2026-09-20T08:15:00+00:00","value":0.0},{"at":"2026-09-20T08:30:00+00:00","value":-0.01},{"at":"2026-09-20T08:45:00+00:00","value":-0.04},{"at":"2026-09-20T09:00:00+00:00","value":-0.04},{"at":"2026-09-20T09:15:00+00:00","value":-0.1},{"at":"2026-09-20T09:30:00+00:00","value":-0.12},{"at":"2026-09-20T09:45:00+00:00","value":-0.17},{"at":"2026-09-20T10:00:00+00:00","value":-1.0},{"at":"2026-09-20T10:15:00+00:00","value":-1.0},{"at":"2026-09-20T10:30:00+00:00","value":-1.05},{"at":"2026-09-20T10:45:00+00:00","value":-1.59},{"at":"2026-09-20T11:00:00+00:00","value":-1.92},{"at":"2026-09-20T11:15:00+00:00","value":-1.97},{"at":"2026-09-20T11:30:00+00:00","value":-2.02},{"at":"2026-09-20T11:45:00+00:00","value":-2.02},{"at":"2026-09-20T12:00:00+00:00","value":-1.94},{"at":"2026-09-20T12:15:00+00:00","value":-1.95},{"at":"2026-09-20T12:30:00+00:00","value":-1.94},{"at":"2026-09-20T12:45:00+00:00","value":-1.91},{"at":"2026-09-20T13:00:00+00:00","value":-1.56},{"at":"2026-09-20T13:15:00+00:00","value":-1.39},{"at":"2026-09-20T13:30:00+00:00","value":-1.01},{"at":"2026-09-20T13:45:00+00:00","value":-1.0},{"at":"2026-09-20T14:00:00+00:00","value":-0.18},{"at":"2026-09-20T14:15:00+00:00","value":-0.1},{"at":"2026-09-20T14:30:00+00:00","value":-0.08},{"at":"2026-09-20T14:45:00+00:00","value":-0.01},{"at":"2026-09-20T15:00:00+00:00","value":-0.03},{"at":"2026-09-20T15:15:00+00:00","value":0.0},{"at":"2026-09-20T15:30:00+00:00","value":0.01},{"at":"2026-09-20T15:45:00+00:00","value":10.72},{"at":"2026-09-20T16:00:00+00:00","value":15.13},{"at":"2026-09-20T16:15:00+00:00","value":35.62},{"at":"2026-09-20T16:30:00+00:00","value":58.37},{"at":"2026-09-20T16:45:00+00:00","value":92.51},{"at":"2026-09-20T17:00:00+00:00","value":61.64},{"at":"2026-09-20T17:15:00+00:00","value":79.14},{"at":"2026-09-20T17:30:00+00:00","value":86.21},{"at":"2026-09-20T17:45:00+00:00","value":102.24},{"at":"2026-09-20T18:00:00+00:00","value":86.69},{"at":"2026-09-20T18:15:00+00:00","value":88.42},{"at":"2026-09-20T18:30:00+00:00","value":82.02},{"at":"2026-09-20T18:45:00+00:00","value":89.48},{"at":"2026-09-20T19:00:00+00:00","value":90.08},{"at":"2026-09-20T19:15:00+00:00","value":79.26},{"at":"2026-09-20T19:30:00+00:00","value":67.9},{"at":"2026-09-20T19:45:00+00:00","value":65.36},{"at":"2026-09-20T20:00:00+00:00","value":76.2},{"at":"2026-09-20T20:15:00+00:00","value":80.07},{"at":"2026-09-20T20:30:00+00:00","value":67.31},{"at":"2026-09-20T20:45:00+00:00","value":61.68},{"at":"2026-09-20T21:00:00+00:00","value":63.74},{"at":"2026-09-20T21:15:00+00:00","value":60.09},{"at":"2026-09-20T21:30:00+00:00","value":57.78},{"at":"2026-09-20T21:45:00+00:00","value":51.76},{"at":"2026-09-20T22:00:00+00:00","value":50.68},{"at":"2026-09-20T22:15:00+00:00","value":50.29},{"at":"2026-09-20T22:30:00+00:00","value":45.28},{"at":"2026-09-20T22:45:00+00:00","value":40.81},{"at":"2026-09-20T23:00:00+00:00","value":45.61},{"at":"2026-09-20T23:15:00+00:00","value":41.88},{"at":"2026-09-20T23:30:00+00:00","value":42.85},{"at":"2026-09-20T23:45:00+00:00","value":40.01},{"at":"2026-09-21T00:00:00+00:00","value":41.33},{"at":"2026-09-21T00:15:00+00:00","value":37.85},{"at":"2026-09-21T00:30:00+00:00","value":38.38},{"at":"2026-09-21T00:45:00+00:00","value":39.82},{"at":"2026-09-21T01:00:00+00:00","value":40.85},{"at":"2026-09-21T01:15:00+00:00","value":41.02},{"at":"2026-09-21T01:30:00+00:00","value":39.9},{"at":"2026-09-21T01:45:00+00:00","value":37.99},{"at":"2026-09-21T02:00:00+00:00","value":37.53},{"at":"2026-09-21T02:15:00+00:00","value":39.24},{"at":"2026-09-21T02:30:00+00:00","value":43.76},{"at":"2026-09-21T02:45:00+00:00","value":47.2},{"at":"2026-09-21T03:00:00+00:00","value":43.27},{"at":"2026-09-21T03:15:00+00:00","value":54.93},{"at":"2026-09-21T03:30:00+00:00","value":60.38},{"at":"2026-09-21T03:45:00+00:00","value":76.69},{"at":"2026-09-21T04:00:00+00:00","value":91.43},{"at":"2026-09-21T04:15:00+00:00","value":124.61},{"at":"2026-09-21T04:30:00+00:00","value":130.5},{"at":"2026-09-21T04:45:00+00:00","value":148.88},{"at":"2026-09-21T05:00:00+00:00","value":160.88},{"at":"2026-09-21T05:15:00+00:00","value":187.01},{"at":"2026-09-21T05:30:00+00:00","value":194.48},{"at":"2026-09-21T05:45:00+00:00","value":170.08},{"at":"2026-09-21T06:00:00+00:00","value":257.09},{"at":"2026-09-21T06:15:00+00:00","value":195.49},{"at":"2026-09-21T06:30:00+00:00","value":154.11},{"at":"2026-09-21T06:45:00+00:00","value":108.01},{"at":"2026-09-21T07:00:00+00:00","value":121.74},{"at":"2026-09-21T07:15:00+00:00","value":103.29},{"at":"2026-09-21T07:30:00+00:00","value":63.51},{"at":"2026-09-21T07:45:00+00:00","value":43.74},{"at":"2026-09-21T08:00:00+00:00","value":62.15},{"at":"2026-09-21T08:15:00+00:00","value":33.39},{"at":"2026-09-21T08:30:00+00:00","value":28.43},{"at":"2026-09-21T08:45:00+00:00","value":11.39},{"at":"2026-09-21T09:00:00+00:00","value":19.82},{"at":"2026-09-21T09:15:00+00:00","value":13.13},{"at":"2026-09-21T09:30:00+00:00","value":2.66},{"at":"2026-09-21T09:45:00+00:00","value":0.03},{"at":"2026-09-21T10:00:00+00:00","value":0.76},{"at":"2026-09-21T10:15:00+00:00","value":0.01},{"at":"2026-09-21T10:30:00+00:00","value":0.02},{"at":"2026-09-21T10:45:00+00:00","value":0.01},{"at":"2026-09-21T11:00:00+00:00","value":0.0},{"at":"2026-09-21T11:15:00+00:00","value":0.0},{"at":"2026-09-21T11:30:00+00:00","value":0.0},{"at":"2026-09-21T11:45:00+00:00","value":0.0},{"at":"2026-09-21T12:00:00+00:00","value":0.0},{"at":"2026-09-21T12:15:00+00:00","value":0.0},{"at":"2026-09-21T12:30:00+00:00","value":0.01},{"at":"2026-09-21T12:45:00+00:00","value":0.03},{"at":"2026-09-21T13:00:00+00:00","value":0.0},{"at":"2026-09-21T13:15:00+00:00","value":0.03},{"at":"2026-09-21T13:30:00+00:00","value":0.1},{"at":"2026-09-21T13:45:00+00:00","value":5.47},{"at":"2026-09-21T14:00:00+00:00","value":0.08},{"at":"2026-09-21T14:15:00+00:00","value":20.95},{"at":"2026-09-21T14:30:00+00:00","value":33.95},{"at":"2026-09-21T14:45:00+00:00","value":59.32},{"at":"2026-09-21T15:00:00+00:00","value":22.71},{"at":"2026-09-21T15:15:00+00:00","value":67.08},{"at":"2026-09-21T15:30:00+00:00","value":135.63},{"at":"2026-09-21T15:45:00+00:00","value":203.34},{"at":"2026-09-21T16:00:00+00:00","value":166.62},{"at":"2026-09-21T16:15:00+00:00","value":198.79},{"at":"2026-09-21T16:30:00+00:00","value":222.59},{"at":"2026-09-21T16:45:00+00:00","value":261.72},{"at":"2026-09-21T17:00:00+00:00","value":220.8},{"at":"2026-09-21T17:15:00+00:00","value":223.97},{"at":"2026-09-21T17:30:00+00:00","value":251.23},{"at":"2026-09-21T17:45:00+00:00","value":275.9},{"at":"2026-09-21T18:00:00+00:00","value":251.3},{"at":"2026-09-21T18:15:00+00:00","value":250.28},{"at":"2026-09-21T18:30:00+00:00","value":243.48},{"at":"2026-09-21T18:45:00+00:00","value":219.04},{"at":"2026-09-21T19:00:00+00:00","value":232.28},{"at":"2026-09-21T19:15:00+00:00","value":218.15},{"at":"2026-09-21T19:30:00+00:00","value":213.93},{"at":"2026-09-21T19:45:00+00:00","value":206.68},{"at":"2026-09-21T20:00:00+00:00","value":216.0},{"at":"2026-09-21T20:15:00+00:00","value":204.58},{"at":"2026-09-21T20:30:00+00:00","value":206.08},{"at":"2026-09-21T20:45:00+00:00","value":196.23},{"at":"2026-09-21T21:00:00+00:00","value":197.98},{"at":"2026-09-21T21:15:00+00:00","value":184.14},{"at":"2026-09-21T21:30:00+00:00","value":186.58},{"at":"2026-09-21T21:45:00+00:00","value":172.11},{"at":"2026-09-21T22:00:00+00:00","value":189.97},{"at":"2026-09-21T22:15:00+00:00","value":183.05},{"at":"2026-09-21T22:30:00+00:00","value":176.66},{"at":"2026-09-21T22:45:00+00:00","value":175.81},{"at":"2026-09-21T23:00:00+00:00","value":177.29},{"at":"2026-09-21T23:15:00+00:00","value":174.96},{"at":"2026-09-21T23:30:00+00:00","value":176.55},{"at":"2026-09-21T23:45:00+00:00","value":175.61},{"at":"2026-09-22T00:00:00+00:00","value":175.89},{"at":"2026-09-22T00:15:00+00:00","value":174.39},{"at":"2026-09-22T00:30:00+00:00","value":172.41},{"at":"2026-09-22T00:45:00+00:00","value":171.52},{"at":"2026-09-22T01:00:00+00:00","value":173.57},{"at":"2026-09-22T01:15:00+00:00","value":170.91},{"at":"2026-09-22T01:30:00+00:00","value":170.42},{"at":"2026-09-22T01:45:00+00:00","value":171.42},{"at":"2026-09-22T02:00:00+00:00","value":172.65},{"at":"2026-09-22T02:15:00+00:00","value":172.33},{"at":"2026-09-22T02:30:00+00:00","value":174.19},{"at":"2026-09-22T02:45:00+00:00","value":180.34},{"at":"2026-09-22T03:00:00+00:00","value":167.7},{"at":"2026-09-22T03:15:00+00:00","value":180.53},{"at":"2026-09-22T03:30:00+00:00","value":193.44},{"at":"2026-09-22T03:45:00+00:00","value":224.33},{"at":"2026-09-22T04:00:00+00:00","value":198.34},{"at":"2026-09-22T04:15:00+00:00","value":225.83},{"at":"2026-09-22T04:30:00+00:00","value":253.32},{"at":"2026-09-22T04:45:00+00:00","value":277.03},{"at":"2026-09-22T05:00:00+00:00","value":289.86},{"at":"2026-09-22T05:15:00+00:00","value":302.05},{"at":"2026-09-22T05:30:00+00:00","value":293.4},{"at":"2026-09-22T05:45:00+00:00","value":276.47},{"at":"2026-09-22T06:00:00+00:00","value":282.29},{"at":"2026-09-22T06:15:00+00:00","value":268.06},{"at":"2026-09-22T06:30:00+00:00","value":240.76},{"at":"2026-09-22T06:45:00+00:00","value":204.98},{"at":"2026-09-22T07:00:00+00:00","value":247.86},{"at":"2026-09-22T07:15:00+00:00","value":217.86},{"at":"2026-09-22T07:30:00+00:00","value":191.48},{"at":"2026-09-22T07:45:00+00:00","value":166.18},{"at":"2026-09-22T08:00:00+00:00","value":186.02},{"at":"2026-09-22T08:15:00+00:00","value":173.99},{"at":"2026-09-22T08:30:00+00:00","value":167.25},{"at":"2026-09-22T08:45:00+00:00","value":161.83},{"at":"2026-09-22T09:00:00+00:00","value":162.63},{"at":"2026-09-22T09:15:00+00:00","value":151.03},{"at":"2026-09-22T09:30:00+00:00","value":144.7},{"at":"2026-09-22T09:45:00+00:00","value":135.85},{"at":"2026-09-22T10:00:00+00:00","value":128.76},{"at":"2026-09-22T10:15:00+00:00","value":130.54},{"at":"2026-09-22T10:30:00+00:00","value":125.51},{"at":"2026-09-22T10:45:00+00:00","value":118.22},{"at":"2026-09-22T11:00:00+00:00","value":119.31},{"at":"2026-09-22T11:15:00+00:00","value":117.72},{"at":"2026-09-22T11:30:00+00:00","value":114.92},{"at":"2026-09-22T11:45:00+00:00","value":112.14},{"at":"2026-09-22T12:00:00+00:00","value":115.15},{"at":"2026-09-22T12:15:00+00:00","value":119.39},{"at":"2026-09-22T12:30:00+00:00","value":119.08},{"at":"2026-09-22T12:45:00+00:00","value":122.93},{"at":"2026-09-22T13:00:00+00:00","value":124.89},{"at":"2026-09-22T13:15:00+00:00","value":130.22},{"at":"2026-09-22T13:30:00+00:00","value":139.62},{"at":"2026-09-22T13:45:00+00:00","value":151.71},{"at":"2026-09-22T14:00:00+00:00","value":147.3},{"at":"2026-09-22T14:15:00+00:00","value":161.28},{"at":"2026-09-22T14:30:00+00:00","value":185.78},{"at":"2026-09-22T14:45:00+00:00","value":213.13},{"at":"2026-09-22T15:00:00+00:00","value":164.68},{"at":"2026-09-22T15:15:00+00:00","value":211.86},{"at":"2026-09-22T15:30:00+00:00","value":241.96},{"at":"2026-09-22T15:45:00+00:00","value":289.06},{"at":"2026-09-22T16:00:00+00:00","value":253.0},{"at":"2026-09-22T16:15:00+00:00","value":317.94},{"at":"2026-09-22T16:30:00+00:00","value":417.93},{"at":"2026-09-22T16:45:00+00:00","value":510.34},{"at":"2026-09-22T17:00:00+00:00","value":564.09},{"at":"2026-09-22T17:15:00+00:00","value":647.5},{"at":"2026-09-22T17:30:00+00:00","value":640.67},{"at":"2026-09-22T17:45:00+00:00","value":533.26},{"at":"2026-09-22T18:00:00+00:00","value":543.39},{"at":"2026-09-22T18:15:00+00:00","value":442.38},{"at":"2026-09-22T18:30:00+00:00","value":389.22},{"at":"2026-09-22T18:45:00+00:00","value":357.66},{"at":"2026-09-22T19:00:00+00:00","value":315.72},{"at":"2026-09-22T19:15:00+00:00","value":292.8},{"at":"2026-09-22T19:30:00+00:00","value":291.88},{"at":"2026-09-22T19:45:00+00:00","value":256.14},{"at":"2026-09-22T20:00:00+00:00","value":258.79},{"at":"2026-09-22T20:15:00+00:00","value":252.99},{"at":"2026-09-22T20:30:00+00:00","value":249.35},{"at":"2026-09-22T20:45:00+00:00","value":225.58},{"at":"2026-09-22T21:00:00+00:00","value":226.09},{"at":"2026-09-22T21:15:00+00:00","value":214.54},{"at":"2026-09-22T21:30:00+00:00","value":210.21},{"at":"2026-09-22T21:45:00+00:00","value":201.18},{"at":"2026-09-22T22:00:00+00:00","value":194.51},{"at":"2026-09-22T22:15:00+00:00","value":188.57},{"at":"2026-09-22T22:30:00+00:00","value":190.3},{"at":"2026-09-22T22:45:00+00:00","value":182.46},{"at":"2026-09-22T23:00:00+00:00","value":181.76},{"at":"2026-09-22T23:15:00+00:00","value":174.93},{"at":"2026-09-22T23:30:00+00:00","value":173.68},{"at":"2026-09-22T23:45:00+00:00","value":179.0},{"at":"2026-09-23T00:00:00+00:00","value":174.52},{"at":"2026-09-23T00:15:00+00:00","value":171.11},{"at":"2026-09-23T00:30:00+00:00","value":177.24},{"at":"2026-09-23T00:45:00+00:00","value":183.06},{"at":"2026-09-23T01:00:00+00:00","value":176.72},{"at":"2026-09-23T01:15:00+00:00","value":178.53},{"at":"2026-09-23T01:30:00+00:00","value":178.72},{"at":"2026-09-23T01:45:00+00:00","value":173.43},{"at":"2026-09-23T02:00:00+00:00","value":173.39},{"at":"2026-09-23T02:15:00+00:00","value":178.13},{"at":"2026-09-23T02:30:00+00:00","value":178.35},{"at":"2026-09-23T02:45:00+00:00","value":173.94},{"at":"2026-09-23T03:00:00+00:00","value":171.61},{"at":"2026-09-23T03:15:00+00:00","value":188.0},{"at":"2026-09-23T03:30:00+00:00","value":202.0},{"at":"2026-09-23T03:45:00+00:00","value":232.86},{"at":"2026-09-23T04:00:00+00:00","value":236.07},{"at":"2026-09-23T04:15:00+00:00","value":260.63},{"at":"2026-09-23T04:30:00+00:00","value":355.5},{"at":"2026-09-23T04:45:00+00:00","value":347.79},{"at":"2026-09-23T05:00:00+00:00","value":370.63},{"at":"2026-09-23T05:15:00+00:00","value":385.35},{"at":"2026-09-23T05:30:00+00:00","value":348.25},{"at":"2026-09-23T05:45:00+00:00","value":280.09},{"at":"2026-09-23T06:00:00+00:00","value":274.32},{"at":"2026-09-23T06:15:00+00:00","value":240.5},{"at":"2026-09-23T06:30:00+00:00","value":224.31},{"at":"2026-09-23T06:45:00+00:00","value":189.12},{"at":"2026-09-23T07:00:00+00:00","value":217.94},{"at":"2026-09-23T07:15:00+00:00","value":193.88},{"at":"2026-09-23T07:30:00+00:00","value":170.82},{"at":"2026-09-23T07:45:00+00:00","value":146.46},{"at":"2026-09-23T08:00:00+00:00","value":166.24},{"at":"2026-09-23T08:15:00+00:00","value":148.1},{"at":"2026-09-23T08:30:00+00:00","value":134.95},{"at":"2026-09-23T08:45:00+00:00","value":116.12},{"at":"2026-09-23T09:00:00+00:00","value":119.82},{"at":"2026-09-23T09:15:00+00:00","value":107.13},{"at":"2026-09-23T09:30:00+00:00","value":86.82},{"at":"2026-09-23T09:45:00+00:00","value":75.87},{"at":"2026-09-23T10:00:00+00:00","value":85.87},{"at":"2026-09-23T10:15:00+00:00","value":73.37},{"at":"2026-09-23T10:30:00+00:00","value":69.72},{"at":"2026-09-23T10:45:00+00:00","value":63.26},{"at":"2026-09-23T11:00:00+00:00","value":64.74},{"at":"2026-09-23T11:15:00+00:00","value":60.02},{"at":"2026-09-23T11:30:00+00:00","value":55.07},{"at":"2026-09-23T11:45:00+00:00","value":49.47},{"at":"2026-09-23T12:00:00+00:00","value":41.99},{"at":"2026-09-23T12:15:00+00:00","value":64.85},{"at":"2026-09-23T12:30:00+00:00","value":85.33},{"at":"2026-09-23T12:45:00+00:00","value":108.18},{"at":"2026-09-23T13:00:00+00:00","value":72.09},{"at":"2026-09-23T13:15:00+00:00","value":101.31},{"at":"2026-09-23T13:30:00+00:00","value":126.3},{"at":"2026-09-23T13:45:00+00:00","value":141.93},{"at":"2026-09-23T14:00:00+00:00","value":124.17},{"at":"2026-09-23T14:15:00+00:00","value":148.07},{"at":"2026-09-23T14:30:00+00:00","value":165.54},{"at":"2026-09-23T14:45:00+00:00","value":189.45},{"at":"2026-09-23T15:00:00+00:00","value":158.94},{"at":"2026-09-23T15:15:00+00:00","value":186.1},{"at":"2026-09-23T15:30:00+00:00","value":211.46},{"at":"2026-09-23T15:45:00+00:00","value":239.54},{"at":"2026-09-23T16:00:00+00:00","value":206.0},{"at":"2026-09-23T16:15:00+00:00","value":225.83},{"at":"2026-09-23T16:30:00+00:00","value":267.94},{"at":"2026-09-23T16:45:00+00:00","value":275.11},{"at":"2026-09-23T17:00:00+00:00","value":271.83},{"at":"2026-09-23T17:15:00+00:00","value":257.33},{"at":"2026-09-23T17:30:00+00:00","value":272.89},{"at":"2026-09-23T17:45:00+00:00","value":284.31},{"at":"2026-09-23T18:00:00+00:00","value":262.21},{"at":"2026-09-23T18:15:00+00:00","value":249.7},{"at":"2026-09-23T18:30:00+00:00","value":223.83},{"at":"2026-09-23T18:45:00+00:00","value":210.76},{"at":"2026-09-23T19:00:00+00:00","value":213.26},{"at":"2026-09-23T19:15:00+00:00","value":205.96},{"at":"2026-09-23T19:30:00+00:00","value":190.73},{"at":"2026-09-23T19:45:00+00:00","value":170.84},{"at":"2026-09-23T20:00:00+00:00","value":182.87},{"at":"2026-09-23T20:15:00+00:00","value":170.36},{"at":"2026-09-23T20:30:00+00:00","value":165.74},{"at":"2026-09-23T20:45:00+00:00","value":161.5},{"at":"2026-09-23T21:00:00+00:00","value":166.95},{"at":"2026-09-23T21:15:00+00:00","value":154.16},{"at":"2026-09-23T21:30:00+00:00","value":150.68},{"at":"2026-09-23T21:45:00+00:00","value":144.2},{"at":"2026-09-23T22:00:00+00:00","value":124.78},{"at":"2026-09-23T22:15:00+00:00","value":136.68},{"at":"2026-09-23T22:30:00+00:00","value":130.6},{"at":"2026-09-23T22:45:00+00:00","value":129.4},{"at":"2026-09-23T23:00:00+00:00","value":121.01},{"at":"2026-09-23T23:15:00+00:00","value":118.29},{"at":"2026-09-23T23:30:00+00:00","value":119.7},{"at":"2026-09-23T23:45:00+00:00","value":116.49},{"at":"2026-09-24T00:00:00+00:00","value":117.38},{"at":"2026-09-24T00:15:00+00:00","value":114.96},{"at":"2026-09-24T00:30:00+00:00","value":114.36},{"at":"2026-09-24T00:45:00+00:00","value":111.35},{"at":"2026-09-24T01:00:00+00:00","value":109.27},{"at":"2026-09-24T01:15:00+00:00","value":107.97},{"at":"2026-09-24T01:30:00+00:00","value":106.5},{"at":"2026-09-24T01:45:00+00:00","value":104.39},{"at":"2026-09-24T02:00:00+00:00","value":106.36},{"at":"2026-09-24T02:15:00+00:00","value":106.43},{"at":"2026-09-24T02:30:00+00:00","value":105.65},{"at":"2026-09-24T02:45:00+00:00","value":110.85},{"at":"2026-09-24T03:00:00+00:00","value":118.13},{"at":"2026-09-24T03:15:00+00:00","value":118.67},{"at":"2026-09-24T03:30:00+00:00","value":121.55},{"at":"2026-09-24T03:45:00+00:00","value":128.45},{"at":"2026-09-24T04:00:00+00:00","value":123.98},{"at":"2026-09-24T04:15:00+00:00","value":142.78},{"at":"2026-09-24T04:30:00+00:00","value":156.71},{"at":"2026-09-24T04:45:00+00:00","value":167.77},{"at":"2026-09-24T05:00:00+00:00","value":161.37},{"at":"2026-09-24T05:15:00+00:00","value":167.17},{"at":"2026-09-24T05:30:00+00:00","value":172.69},{"at":"2026-09-24T05:45:00+00:00","value":170.83},{"at":"2026-09-24T06:00:00+00:00","value":185.99},{"at":"2026-09-24T06:15:00+00:00","value":175.9},{"at":"2026-09-24T06:30:00+00:00","value":172.6},{"at":"2026-09-24T06:45:00+00:00","value":160.57},{"at":"2026-09-24T07:00:00+00:00","value":172.79},{"at":"2026-09-24T07:15:00+00:00","value":162.39},{"at":"2026-09-24T07:30:00+00:00","value":144.42},{"at":"2026-09-24T07:45:00+00:00","value":130.04},{"at":"2026-09-24T08:00:00+00:00","value":136.4},{"at":"2026-09-24T08:15:00+00:00","value":122.77},{"at":"2026-09-24T08:30:00+00:00","value":106.24},{"at":"2026-09-24T08:45:00+00:00","value":81.51},{"at":"2026-09-24T09:00:00+00:00","value":98.66},{"at":"2026-09-24T09:15:00+00:00","value":78.86},{"at":"2026-09-24T09:30:00+00:00","value":60.02},{"at":"2026-09-24T09:45:00+00:00","value":36.1},{"at":"2026-09-24T10:00:00+00:00","value":25.01},{"at":"2026-09-24T10:15:00+00:00","value":15.11},{"at":"2026-09-24T10:30:00+00:00","value":13.88},{"at":"2026-09-24T10:45:00+00:00","value":10.0},{"at":"2026-09-24T11:00:00+00:00","value":14.0},{"at":"2026-09-24T11:15:00+00:00","value":10.03},{"at":"2026-09-24T11:30:00+00:00","value":12.32},{"at":"2026-09-24T11:45:00+00:00","value":10.05},{"at":"2026-09-24T12:00:00+00:00","value":8.86},{"at":"2026-09-24T12:15:00+00:00","value":10.9},{"at":"2026-09-24T12:30:00+00:00","value":24.0},{"at":"2026-09-24T12:45:00+00:00","value":34.99},{"at":"2026-09-24T13:00:00+00:00","value":38.66},{"at":"2026-09-24T13:15:00+00:00","value":61.86},{"at":"2026-09-24T13:30:00+00:00","value":95.0},{"at":"2026-09-24T13:45:00+00:00","value":108.0},{"at":"2026-09-24T14:00:00+00:00","value":76.9},{"at":"2026-09-24T14:15:00+00:00","value":108.86},{"at":"2026-09-24T14:30:00+00:00","value":132.15},{"at":"2026-09-24T14:45:00+00:00","value":152.8},{"at":"2026-09-24T15:00:00+00:00","value":141.6},{"at":"2026-09-24T15:15:00+00:00","value":170.89},{"at":"2026-09-24T15:30:00+00:00","value":193.19},{"at":"2026-09-24T15:45:00+00:00","value":214.43},{"at":"2026-09-24T16:00:00+00:00","value":186.47},{"at":"2026-09-24T16:15:00+00:00","value":218.93},{"at":"2026-09-24T16:30:00+00:00","value":236.02},{"at":"2026-09-24T16:45:00+00:00","value":262.74},{"at":"2026-09-24T17:00:00+00:00","value":249.33},{"at":"2026-09-24T17:15:00+00:00","value":263.79},{"at":"2026-09-24T17:30:00+00:00","value":267.94},{"at":"2026-09-24T17:45:00+00:00","value":288.23},{"at":"2026-09-24T18:00:00+00:00","value":272.65},{"at":"2026-09-24T18:15:00+00:00","value":265.8},{"at":"2026-09-24T18:30:00+00:00","value":253.5},{"at":"2026-09-24T18:45:00+00:00","value":248.05},{"at":"2026-09-24T19:00:00+00:00","value":240.29},{"at":"2026-09-24T19:15:00+00:00","value":230.0},{"at":"2026-09-24T19:30:00+00:00","value":223.38},{"at":"2026-09-24T19:45:00+00:00","value":209.62},{"at":"2026-09-24T20:00:00+00:00","value":220.96},{"at":"2026-09-24T20:15:00+00:00","value":204.52},{"at":"2026-09-24T20:30:00+00:00","value":201.0},{"at":"2026-09-24T20:45:00+00:00","value":192.99},{"at":"2026-09-24T21:00:00+00:00","value":196.93},{"at":"2026-09-24T21:15:00+00:00","value":188.32},{"at":"2026-09-24T21:30:00+00:00","value":185.64},{"at":"2026-09-24T21:45:00+00:00","value":181.14},{"at":"2026-09-24T22:00:00+00:00","value":196.99},{"at":"2026-09-24T22:15:00+00:00","value":184.4},{"at":"2026-09-24T22:30:00+00:00","value":175.79},{"at":"2026-09-24T22:45:00+00:00","value":170.59},{"at":"2026-09-24T23:00:00+00:00","value":175.13},{"at":"2026-09-24T23:15:00+00:00","value":171.84},{"at":"2026-09-24T23:30:00+00:00","value":171.43},{"at":"2026-09-24T23:45:00+00:00","value":170.27},{"at":"2026-09-25T00:00:00+00:00","value":167.76},{"at":"2026-09-25T00:15:00+00:00","value":166.49},{"at":"2026-09-25T00:30:00+00:00","value":165.93},{"at":"2026-09-25T00:45:00+00:00","value":162.38},{"at":"2026-09-25T01:00:00+00:00","value":164.46},{"at":"2026-09-25T01:15:00+00:00","value":165.55},{"at":"2026-09-25T01:30:00+00:00","value":169.18},{"at":"2026-09-25T01:45:00+00:00","value":169.27},{"at":"2026-09-25T02:00:00+00:00","value":172.29},{"at":"2026-09-25T02:15:00+00:00","value":170.87},{"at":"2026-09-25T02:30:00+00:00","value":169.82},{"at":"2026-09-25T02:45:00+00:00","value":165.87},{"at":"2026-09-25T03:00:00+00:00","value":168.41},{"at":"2026-09-25T03:15:00+00:00","value":169.79},{"at":"2026-09-25T03:30:00+00:00","value":192.29},{"at":"2026-09-25T03:45:00+00:00","value":221.15},{"at":"2026-09-25T04:00:00+00:00","value":204.38},{"at":"2026-09-25T04:15:00+00:00","value":236.08},{"at":"2026-09-25T04:30:00+00:00","value":236.44},{"at":"2026-09-25T04:45:00+00:00","value":264.16},{"at":"2026-09-25T05:00:00+00:00","value":252.93},{"at":"2026-09-25T05:15:00+00:00","value":266.66},{"at":"2026-09-25T05:30:00+00:00","value":273.61},{"at":"2026-09-25T05:45:00+00:00","value":252.41},{"at":"2026-09-25T06:00:00+00:00","value":290.87},{"at":"2026-09-25T06:15:00+00:00","value":260.69},{"at":"2026-09-25T06:30:00+00:00","value":243.4},{"at":"2026-09-25T06:45:00+00:00","value":203.99},{"at":"2026-09-25T07:00:00+00:00","value":235.46},{"at":"2026-09-25T07:15:00+00:00","value":202.74},{"at":"2026-09-25T07:30:00+00:00","value":189.27},{"at":"2026-09-25T07:45:00+00:00","value":157.5},{"at":"2026-09-25T08:00:00+00:00","value":182.5},{"at":"2026-09-25T08:15:00+00:00","value":165.0},{"at":"2026-09-25T08:30:00+00:00","value":148.66},{"at":"2026-09-25T08:45:00+00:00","value":137.99},{"at":"2026-09-25T09:00:00+00:00","value":137.82},{"at":"2026-09-25T09:15:00+00:00","value":123.02},{"at":"2026-09-25T09:30:00+00:00","value":100.36},{"at":"2026-09-25T09:45:00+00:00","value":72.42},{"at":"2026-09-25T10:00:00+00:00","value":85.78},{"at":"2026-09-25T10:15:00+00:00","value":62.83},{"at":"2026-09-25T10:30:00+00:00","value":49.38},{"at":"2026-09-25T10:45:00+00:00","value":42.75},{"at":"2026-09-25T11:00:00+00:00","value":39.01},{"at":"2026-09-25T11:15:00+00:00","value":36.12},{"at":"2026-09-25T11:30:00+00:00","value":26.14},{"at":"2026-09-25T11:45:00+00:00","value":19.17},{"at":"2026-09-25T12:00:00+00:00","value":23.12},{"at":"2026-09-25T12:15:00+00:00","value":35.0},{"at":"2026-09-25T12:30:00+00:00","value":39.94},{"at":"2026-09-25T12:45:00+00:00","value":61.49},{"at":"2026-09-25T13:00:00+00:00","value":40.0},{"at":"2026-09-25T13:15:00+00:00","value":73.58},{"at":"2026-09-25T13:30:00+00:00","value":107.83},{"at":"2026-09-25T13:45:00+00:00","value":126.76},{"at":"2026-09-25T14:00:00+00:00","value":119.91},{"at":"2026-09-25T14:15:00+00:00","value":142.44},{"at":"2026-09-25T14:30:00+00:00","value":165.0},{"at":"2026-09-25T14:45:00+00:00","value":190.71},{"at":"2026-09-25T15:00:00+00:00","value":157.71},{"at":"2026-09-25T15:15:00+00:00","value":192.8},{"at":"2026-09-25T15:30:00+00:00","value":206.21},{"at":"2026-09-25T15:45:00+00:00","value":239.26},{"at":"2026-09-25T16:00:00+00:00","value":202.24},{"at":"2026-09-25T16:15:00+00:00","value":230.0},{"at":"2026-09-25T16:30:00+00:00","value":248.72},{"at":"2026-09-25T16:45:00+00:00","value":284.74},{"at":"2026-09-25T17:00:00+00:00","value":291.76},{"at":"2026-09-25T17:15:00+00:00","value":305.47},{"at":"2026-09-25T17:30:00+00:00","value":315.78},{"at":"2026-09-25T17:45:00+00:00","value":300.7},{"at":"2026-09-25T18:00:00+00:00","value":270.0},{"at":"2026-09-25T18:15:00+00:00","value":255.0},{"at":"2026-09-25T18:30:00+00:00","value":246.96},{"at":"2026-09-25T18:45:00+00:00","value":236.7},{"at":"2026-09-25T19:00:00+00:00","value":244.18},{"at":"2026-09-25T19:15:00+00:00","value":231.25},{"at":"2026-09-25T19:30:00+00:00","value":218.38},{"at":"2026-09-25T19:45:00+00:00","value":202.89},{"at":"2026-09-25T20:00:00+00:00","value":219.99},{"at":"2026-09-25T20:15:00+00:00","value":208.59},{"at":"2026-09-25T20:30:00+00:00","value":202.11},{"at":"2026-09-25T20:45:00+00:00","value":194.72},{"at":"2026-09-25T21:00:00+00:00","value":199.81},{"at":"2026-09-25T21:15:00+00:00","value":193.53},{"at":"2026-09-25T21:30:00+00:00","value":182.41},{"at":"2026-09-25T21:45:00+00:00","value":171.29},{"at":"2026-09-25T22:00:00+00:00","value":205.94},{"at":"2026-09-25T22:15:00+00:00","value":199.14},{"at":"2026-09-25T22:30:00+00:00","value":194.54},{"at":"2026-09-25T22:45:00+00:00","value":185.56},{"at":"2026-09-25T23:00:00+00:00","value":187.85},{"at":"2026-09-25T23:15:00+00:00","value":184.4},{"at":"2026-09-25T23:30:00+00:00","value":182.86},{"at":"2026-09-25T23:45:00+00:00","value":181.02},{"at":"2026-09-26T00:00:00+00:00","value":181.33},{"at":"2026-09-26T00:15:00+00:00","value":179.17},{"at":"2026-09-26T00:30:00+00:00","value":173.17},{"at":"2026-09-26T00:45:00+00:00","value":166.7},{"at":"2026-09-26T01:00:00+00:00","value":165.93},{"at":"2026-09-26T01:15:00+00:00","value":163.25},{"at":"2026-09-26T01:30:00+00:00","value":162.56},{"at":"2026-09-26T01:45:00+00:00","value":162.47},{"at":"2026-09-26T02:00:00+00:00","value":159.61},{"at":"2026-09-26T02:15:00+00:00","value":160.35},{"at":"2026-09-26T02:30:00+00:00","value":161.3},{"at":"2026-09-26T02:45:00+00:00","value":161.76},{"at":"2026-09-26T03:00:00+00:00","value":159.09},{"at":"2026-09-26T03:15:00+00:00","value":158.03},{"at":"2026-09-26T03:30:00+00:00","value":160.44},{"at":"2026-09-26T03:45:00+00:00","value":164.62},{"at":"2026-09-26T04:00:00+00:00","value":167.7},{"at":"2026-09-26T04:15:00+00:00","value":176.77},{"at":"2026-09-26T04:30:00+00:00","value":181.6},{"at":"2026-09-26T04:45:00+00:00","value":188.88},{"at":"2026-09-26T05:00:00+00:00","value":192.05},{"at":"2026-09-26T05:15:00+00:00","value":194.29},{"at":"2026-09-26T05:30:00+00:00","value":194.14},{"at":"2026-09-26T05:45:00+00:00","value":196.76},{"at":"2026-09-26T06:00:00+00:00","value":210.93},{"at":"2026-09-26T06:15:00+00:00","value":203.0},{"at":"2026-09-26T06:30:00+00:00","value":187.34},{"at":"2026-09-26T06:45:00+00:00","value":166.4},{"at":"2026-09-26T07:00:00+00:00","value":193.17},{"at":"2026-09-26T07:15:00+00:00","value":165.98},{"at":"2026-09-26T07:30:00+00:00","value":139.03},{"at":"2026-09-26T07:45:00+00:00","value":127.59},{"at":"2026-09-26T08:00:00+00:00","value":132.41},{"at":"2026-09-26T08:15:00+00:00","value":120.56},{"at":"2026-09-26T08:30:00+00:00","value":104.99},{"at":"2026-09-26T08:45:00+00:00","value":90.0},{"at":"2026-09-26T09:00:00+00:00","value":78.49},{"at":"2026-09-26T09:15:00+00:00","value":59.07},{"at":"2026-09-26T09:30:00+00:00","value":46.32},{"at":"2026-09-26T09:45:00+00:00","value":28.53},{"at":"2026-09-26T10:00:00+00:00","value":17.33},{"at":"2026-09-26T10:15:00+00:00","value":12.51},{"at":"2026-09-26T10:30:00+00:00","value":9.47},{"at":"2026-09-26T10:45:00+00:00","value":4.71},{"at":"2026-09-26T11:00:00+00:00","value":4.64},{"at":"2026-09-26T11:15:00+00:00","value":3.73},{"at":"2026-09-26T11:30:00+00:00","value":2.43},{"at":"2026-09-26T11:45:00+00:00","value":2.42},{"at":"2026-09-26T12:00:00+00:00","value":9.02},{"at":"2026-09-26T12:15:00+00:00","value":12.51},{"at":"2026-09-26T12:30:00+00:00","value":23.3},{"at":"2026-09-26T12:45:00+00:00","value":28.97},{"at":"2026-09-26T13:00:00+00:00","value":23.0},{"at":"2026-09-26T13:15:00+00:00","value":40.0},{"at":"2026-09-26T13:30:00+00:00","value":59.82},{"at":"2026-09-26T13:45:00+00:00","value":83.28},{"at":"2026-09-26T14:00:00+00:00","value":91.58},{"at":"2026-09-26T14:15:00+00:00","value":122.8},{"at":"2026-09-26T14:30:00+00:00","value":135.09},{"at":"2026-09-26T14:45:00+00:00","value":160.1},{"at":"2026-09-26T15:00:00+00:00","value":154.56},{"at":"2026-09-26T15:15:00+00:00","value":194.8},{"at":"2026-09-26T15:30:00+00:00","value":215.13},{"at":"2026-09-26T15:45:00+00:00","value":203.04},{"at":"2026-09-26T16:00:00+00:00","value":196.0},{"at":"2026-09-26T16:15:00+00:00","value":206.37},{"at":"2026-09-26T16:30:00+00:00","value":220.86},{"at":"2026-09-26T16:45:00+00:00","value":234.23},{"at":"2026-09-26T17:00:00+00:00","value":222.0},{"at":"2026-09-26T17:15:00+00:00","value":230.46},{"at":"2026-09-26T17:30:00+00:00","value":243.61},{"at":"2026-09-26T17:45:00+00:00","value":251.08},{"at":"2026-09-26T18:00:00+00:00","value":238.97},{"at":"2026-09-26T18:15:00+00:00","value":232.0},{"at":"2026-09-26T18:30:00+00:00","value":222.48},{"at":"2026-09-26T18:45:00+00:00","value":211.99},{"at":"2026-09-26T19:00:00+00:00","value":218.18},{"at":"2026-09-26T19:15:00+00:00","value":210.24},{"at":"2026-09-26T19:30:00+00:00","value":205.53},{"at":"2026-09-26T19:45:00+00:00","value":200.0},{"at":"2026-09-26T20:00:00+00:00","value":207.0},{"at":"2026-09-26T20:15:00+00:00","value":200.62},{"at":"2026-09-26T20:30:00+00:00","value":197.73},{"at":"2026-09-26T20:45:00+00:00","value":191.89},{"at":"2026-09-26T21:00:00+00:00","value":195.2},{"at":"2026-09-26T21:15:00+00:00","value":188.45},{"at":"2026-09-26T21:30:00+00:00","value":182.55},{"at":"2026-09-26T21:45:00+00:00","value":177.8},{"at":"2026-09-26T22:00:00+00:00","value":192.07},{"at":"2026-09-26T22:15:00+00:00","value":185.95},{"at":"2026-09-26T22:30:00+00:00","value":182.68},{"at":"2026-09-26T22:45:00+00:00","value":172.18},{"at":"2026-09-26T23:00:00+00:00","value":180.47},{"at":"2026-09-26T23:15:00+00:00","value":178.0},{"at":"2026-09-26T23:30:00+00:00","value":176.62},{"at":"2026-09-26T23:45:00+00:00","value":178.0},{"at":"2026-09-27T00:00:00+00:00","value":176.0},{"at":"2026-09-27T00:15:00+00:00","value":171.31},{"at":"2026-09-27T00:30:00+00:00","value":169.97},{"at":"2026-09-27T00:45:00+00:00","value":168.08},{"at":"2026-09-27T01:00:00+00:00","value":168.16},{"at":"2026-09-27T01:15:00+00:00","value":166.78},{"at":"2026-09-27T01:30:00+00:00","value":165.4},{"at":"2026-09-27T01:45:00+00:00","value":165.39},{"at":"2026-09-27T02:00:00+00:00","value":165.0},{"at":"2026-09-27T02:15:00+00:00","value":160.83},{"at":"2026-09-27T02:30:00+00:00","value":160.44},{"at":"2026-09-27T02:45:00+00:00","value":160.0},{"at":"2026-09-27T03:00:00+00:00","value":160.44},{"at":"2026-09-27T03:15:00+00:00","value":158.08},{"at":"2026-09-27T03:30:00+00:00","value":159.4},{"at":"2026-09-27T03:45:00+00:00","value":156.76},{"at":"2026-09-27T04:00:00+00:00","value":156.03},{"at":"2026-09-27T04:15:00+00:00","value":156.05},{"at":"2026-09-27T04:30:00+00:00","value":162.42},{"at":"2026-09-27T04:45:00+00:00","value":162.85},{"at":"2026-09-27T05:00:00+00:00","value":165.56},{"at":"2026-09-27T05:15:00+00:00","value":157.95},{"at":"2026-09-27T05:30:00+00:00","value":146.68},{"at":"2026-09-27T05:45:00+00:00","value":134.63},{"at":"2026-09-27T06:00:00+00:00","value":160.43},{"at":"2026-09-27T06:15:00+00:00","value":143.86},{"at":"2026-09-27T06:30:00+00:00","value":119.48},{"at":"2026-09-27T06:45:00+00:00","value":87.03},{"at":"2026-09-27T07:00:00+00:00","value":101.36},{"at":"2026-09-27T07:15:00+00:00","value":76.32},{"at":"2026-09-27T07:30:00+00:00","value":30.96},{"at":"2026-09-27T07:45:00+00:00","value":18.32},{"at":"2026-09-27T08:00:00+00:00","value":5.51},{"at":"2026-09-27T08:15:00+00:00","value":0.06},{"at":"2026-09-27T08:30:00+00:00","value":0.0},{"at":"2026-09-27T08:45:00+00:00","value":0.0},{"at":"2026-09-27T09:00:00+00:00","value":0.0},{"at":"2026-09-27T09:15:00+00:00","value":-0.01},{"at":"2026-09-27T09:30:00+00:00","value":-0.09},{"at":"2026-09-27T09:45:00+00:00","value":-0.19},{"at":"2026-09-27T10:00:00+00:00","value":-1.01},{"at":"2026-09-27T10:15:00+00:00","value":-1.76},{"at":"2026-09-27T10:30:00+00:00","value":-2.02},{"at":"2026-09-27T10:45:00+00:00","value":-2.99},{"at":"2026-09-27T11:00:00+00:00","value":-2.21},{"at":"2026-09-27T11:15:00+00:00","value":-2.95},{"at":"2026-09-27T11:30:00+00:00","value":-2.76},{"at":"2026-09-27T11:45:00+00:00","value":-2.02},{"at":"2026-09-27T12:00:00+00:00","value":-2.0},{"at":"2026-09-27T12:15:00+00:00","value":-1.02},{"at":"2026-09-27T12:30:00+00:00","value":-0.21},{"at":"2026-09-27T12:45:00+00:00","value":-0.12},{"at":"2026-09-27T13:00:00+00:00","value":-0.01},{"at":"2026-09-27T13:15:00+00:00","value":-0.01},{"at":"2026-09-27T13:30:00+00:00","value":0.0},{"at":"2026-09-27T13:45:00+00:00","value":0.0},{"at":"2026-09-27T14:00:00+00:00","value":0.0},{"at":"2026-09-27T14:15:00+00:00","value":0.15},{"at":"2026-09-27T14:30:00+00:00","value":7.01},{"at":"2026-09-27T14:45:00+00:00","value":45.25},{"at":"2026-09-27T15:00:00+00:00","value":41.25},{"at":"2026-09-27T15:15:00+00:00","value":92.71},{"at":"2026-09-27T15:30:00+00:00","value":144.61},{"at":"2026-09-27T15:45:00+00:00","value":178.48},{"at":"2026-09-27T16:00:00+00:00","value":168.79},{"at":"2026-09-27T16:15:00+00:00","value":188.35},{"at":"2026-09-27T16:30:00+00:00","value":193.27},{"at":"2026-09-27T16:45:00+00:00","value":194.45},{"at":"2026-09-27T17:00:00+00:00","value":190.84},{"at":"2026-09-27T17:15:00+00:00","value":191.93},{"at":"2026-09-27T17:30:00+00:00","value":198.95},{"at":"2026-09-27T17:45:00+00:00","value":201.28},{"at":"2026-09-27T18:00:00+00:00","value":194.32},{"at":"2026-09-27T18:15:00+00:00","value":188.0},{"at":"2026-09-27T18:30:00+00:00","value":185.68},{"at":"2026-09-27T18:45:00+00:00","value":167.39},{"at":"2026-09-27T19:00:00+00:00","value":174.16},{"at":"2026-09-27T19:15:00+00:00","value":164.44},{"at":"2026-09-27T19:30:00+00:00","value":151.86},{"at":"2026-09-27T19:45:00+00:00","value":148.56},{"at":"2026-09-27T20:00:00+00:00","value":164.94},{"at":"2026-09-27T20:15:00+00:00","value":156.51},{"at":"2026-09-27T20:30:00+00:00","value":152.22},{"at":"2026-09-27T20:45:00+00:00","value":148.03},{"at":"2026-09-27T21:00:00+00:00","value":149.36},{"at":"2026-09-27T21:15:00+00:00","value":147.47},{"at":"2026-09-27T21:30:00+00:00","value":145.18},{"at":"2026-09-27T21:45:00+00:00","value":143.72},{"at":"2026-09-27T22:00:00+00:00","value":150.75},{"at":"2026-09-27T22:15:00+00:00","value":150.76},{"at":"2026-09-27T22:30:00+00:00","value":150.58},{"at":"2026-09-27T22:45:00+00:00","value":150.75},{"at":"2026-09-27T23:00:00+00:00","value":152.64},{"at":"2026-09-27T23:15:00+00:00","value":150.22},{"at":"2026-09-27T23:30:00+00:00","value":151.75},{"at":"2026-09-27T23:45:00+00:00","value":151.03},{"at":"2026-09-28T00:00:00+00:00","value":150.96},{"at":"2026-09-28T00:15:00+00:00","value":151.36},{"at":"2026-09-28T00:30:00+00:00","value":151.75},{"at":"2026-09-28T00:45:00+00:00","value":151.89},{"at":"2026-09-28T01:00:00+00:00","value":152.62},{"at":"2026-09-28T01:15:00+00:00","value":153.8},{"at":"2026-09-28T01:30:00+00:00","value":154.6},{"at":"2026-09-28T01:45:00+00:00","value":157.33},{"at":"2026-09-28T02:00:00+00:00","value":156.68},{"at":"2026-09-28T02:15:00+00:00","value":158.24},{"at":"2026-09-28T02:30:00+00:00","value":162.04},{"at":"2026-09-28T02:45:00+00:00","value":166.87},{"at":"2026-09-28T03:00:00+00:00","value":167.67},{"at":"2026-09-28T03:15:00+00:00","value":170.36},{"at":"2026-09-28T03:30:00+00:00","value":176.77},{"at":"2026-09-28T03:45:00+00:00","value":185.9},{"at":"2026-09-28T04:00:00+00:00","value":193.68},{"at":"2026-09-28T04:15:00+00:00","value":204.99},{"at":"2026-09-28T04:30:00+00:00","value":214.84},{"at":"2026-09-28T04:45:00+00:00","value":231.02},{"at":"2026-09-28T05:00:00+00:00","value":228.23},{"at":"2026-09-28T05:15:00+00:00","value":244.02},{"at":"2026-09-28T05:30:00+00:00","value":246.17},{"at":"2026-09-28T05:45:00+00:00","value":245.5},{"at":"2026-09-28T06:00:00+00:00","value":275.95},{"at":"2026-09-28T06:15:00+00:00","value":250.74},{"at":"2026-09-28T06:30:00+00:00","value":231.15},{"at":"2026-09-28T06:45:00+00:00","value":210.77},{"at":"2026-09-28T07:00:00+00:00","value":235.13},{"at":"2026-09-28T07:15:00+00:00","value":220.36},{"at":"2026-09-28T07:30:00+00:00","value":202.0},{"at":"2026-09-28T07:45:00+00:00","value":182.95},{"at":"2026-09-28T08:00:00+00:00","value":203.48},{"at":"2026-09-28T08:15:00+00:00","value":185.07},{"at":"2026-09-28T08:30:00+00:00","value":172.75},{"at":"2026-09-28T08:45:00+00:00","value":155.95},{"at":"2026-09-28T09:00:00+00:00","value":157.93},{"at":"2026-09-28T09:15:00+00:00","value":158.52},{"at":"2026-09-28T09:30:00+00:00","value":150.4},{"at":"2026-09-28T09:45:00+00:00","value":147.22},{"at":"2026-09-28T10:00:00+00:00","value":145.33},{"at":"2026-09-28T10:15:00+00:00","value":126.73},{"at":"2026-09-28T10:30:00+00:00","value":117.8},{"at":"2026-09-28T10:45:00+00:00","value":114.68},{"at":"2026-09-28T11:00:00+00:00","value":116.98},{"at":"2026-09-28T11:15:00+00:00","value":114.49},{"at":"2026-09-28T11:30:00+00:00","value":126.85},{"at":"2026-09-28T11:45:00+00:00","value":127.03},{"at":"2026-09-28T12:00:00+00:00","value":120.78},{"at":"2026-09-28T12:15:00+00:00","value":134.99},{"at":"2026-09-28T12:30:00+00:00","value":145.51},{"at":"2026-09-28T12:45:00+00:00","value":151.87},{"at":"2026-09-28T13:00:00+00:00","value":146.6},{"at":"2026-09-28T13:15:00+00:00","value":150.9},{"at":"2026-09-28T13:30:00+00:00","value":151.9},{"at":"2026-09-28T13:45:00+00:00","value":165.54},{"at":"2026-09-28T14:00:00+00:00","value":156.69},{"at":"2026-09-28T14:15:00+00:00","value":172.33},{"at":"2026-09-28T14:30:00+00:00","value":198.69},{"at":"2026-09-28T14:45:00+00:00","value":224.59},{"at":"2026-09-28T15:00:00+00:00","value":207.45},{"at":"2026-09-28T15:15:00+00:00","value":231.26},{"at":"2026-09-28T15:30:00+00:00","value":241.07},{"at":"2026-09-28T15:45:00+00:00","value":266.9},{"at":"2026-09-28T16:00:00+00:00","value":247.48},{"at":"2026-09-28T16:15:00+00:00","value":284.36},{"at":"2026-09-28T16:30:00+00:00","value":319.88},{"at":"2026-09-28T16:45:00+00:00","value":390.6},{"at":"2026-09-28T17:00:00+00:00","value":350.0},{"at":"2026-09-28T17:15:00+00:00","value":354.0},{"at":"2026-09-28T17:30:00+00:00","value":349.99},{"at":"2026-09-28T17:45:00+00:00","value":314.86},{"at":"2026-09-28T18:00:00+00:00","value":320.83},{"at":"2026-09-28T18:15:00+00:00","value":280.59},{"at":"2026-09-28T18:30:00+00:00","value":260.91},{"at":"2026-09-28T18:45:00+00:00","value":246.9},{"at":"2026-09-28T19:00:00+00:00","value":252.58},{"at":"2026-09-28T19:15:00+00:00","value":234.44},{"at":"2026-09-28T19:30:00+00:00","value":223.98},{"at":"2026-09-28T19:45:00+00:00","value":205.0},{"at":"2026-09-28T20:00:00+00:00","value":216.93},{"at":"2026-09-28T20:15:00+00:00","value":208.16},{"at":"2026-09-28T20:30:00+00:00","value":201.99},{"at":"2026-09-28T20:45:00+00:00","value":186.32},{"at":"2026-09-28T21:00:00+00:00","value":197.01},{"at":"2026-09-28T21:15:00+00:00","value":187.78},{"at":"2026-09-28T21:30:00+00:00","value":179.24},{"at":"2026-09-28T21:45:00+00:00","value":161.14},{"at":"2026-09-28T22:00:00+00:00","value":191.82},{"at":"2026-09-28T22:15:00+00:00","value":189.19},{"at":"2026-09-28T22:30:00+00:00","value":180.22},{"at":"2026-09-28T22:45:00+00:00","value":174.22},{"at":"2026-09-28T23:00:00+00:00","value":181.81},{"at":"2026-09-28T23:15:00+00:00","value":175.85},{"at":"2026-09-28T23:30:00+00:00","value":171.4},{"at":"2026-09-28T23:45:00+00:00","value":166.79},{"at":"2026-09-29T00:00:00+00:00","value":170.78},{"at":"2026-09-29T00:15:00+00:00","value":168.95},{"at":"2026-09-29T00:30:00+00:00","value":168.78},{"at":"2026-09-29T00:45:00+00:00","value":167.64},{"at":"2026-09-29T01:00:00+00:00","value":164.24},{"at":"2026-09-29T01:15:00+00:00","value":165.16},{"at":"2026-09-29T01:30:00+00:00","value":165.14},{"at":"2026-09-29T01:45:00+00:00","value":165.1},{"at":"2026-09-29T02:00:00+00:00","value":162.1},{"at":"2026-09-29T02:15:00+00:00","value":161.64},{"at":"2026-09-29T02:30:00+00:00","value":159.64},{"at":"2026-09-29T02:45:00+00:00","value":158.22},{"at":"2026-09-29T03:00:00+00:00","value":154.64},{"at":"2026-09-29T03:15:00+00:00","value":158.2},{"at":"2026-09-29T03:30:00+00:00","value":170.54},{"at":"2026-09-29T03:45:00+00:00","value":179.47},{"at":"2026-09-29T04:00:00+00:00","value":191.32},{"at":"2026-09-29T04:15:00+00:00","value":216.62},{"at":"2026-09-29T04:30:00+00:00","value":229.85},{"at":"2026-09-29T04:45:00+00:00","value":226.6},{"at":"2026-09-29T05:00:00+00:00","value":231.37},{"at":"2026-09-29T05:15:00+00:00","value":233.0},{"at":"2026-09-29T05:30:00+00:00","value":226.86},{"at":"2026-09-29T05:45:00+00:00","value":223.25},{"at":"2026-09-29T06:00:00+00:00","value":239.11},{"at":"2026-09-29T06:15:00+00:00","value":230.33},{"at":"2026-09-29T06:30:00+00:00","value":213.57},{"at":"2026-09-29T06:45:00+00:00","value":180.74},{"at":"2026-09-29T07:00:00+00:00","value":212.3},{"at":"2026-09-29T07:15:00+00:00","value":187.84},{"at":"2026-09-29T07:30:00+00:00","value":173.02},{"at":"2026-09-29T07:45:00+00:00","value":163.64},{"at":"2026-09-29T08:00:00+00:00","value":179.29},{"at":"2026-09-29T08:15:00+00:00","value":166.3},{"at":"2026-09-29T08:30:00+00:00","value":158.59},{"at":"2026-09-29T08:45:00+00:00","value":143.09},{"at":"2026-09-29T09:00:00+00:00","value":146.58},{"at":"2026-09-29T09:15:00+00:00","value":137.15},{"at":"2026-09-29T09:30:00+00:00","value":115.77},{"at":"2026-09-29T09:45:00+00:00","value":101.85},{"at":"2026-09-29T10:00:00+00:00","value":98.32},{"at":"2026-09-29T10:15:00+00:00","value":89.79},{"at":"2026-09-29T10:30:00+00:00","value":88.93},{"at":"2026-09-29T10:45:00+00:00","value":76.72},{"at":"2026-09-29T11:00:00+00:00","value":82.26},{"at":"2026-09-29T11:15:00+00:00","value":74.88},{"at":"2026-09-29T11:30:00+00:00","value":68.67},{"at":"2026-09-29T11:45:00+00:00","value":63.94},{"at":"2026-09-29T12:00:00+00:00","value":65.66},{"at":"2026-09-29T12:15:00+00:00","value":79.03},{"at":"2026-09-29T12:30:00+00:00","value":88.03},{"at":"2026-09-29T12:45:00+00:00","value":93.47},{"at":"2026-09-29T13:00:00+00:00","value":89.63},{"at":"2026-09-29T13:15:00+00:00","value":108.68},{"at":"2026-09-29T13:30:00+00:00","value":120.71},{"at":"2026-09-29T13:45:00+00:00","value":130.04},{"at":"2026-09-29T14:00:00+00:00","value":115.21},{"at":"2026-09-29T14:15:00+00:00","value":144.04},{"at":"2026-09-29T14:30:00+00:00","value":161.18},{"at":"2026-09-29T14:45:00+00:00","value":199.62},{"at":"2026-09-29T15:00:00+00:00","value":179.02},{"at":"2026-09-29T15:15:00+00:00","value":201.77},{"at":"2026-09-29T15:30:00+00:00","value":213.69},{"at":"2026-09-29T15:45:00+00:00","value":218.93},{"at":"2026-09-29T16:00:00+00:00","value":219.11},{"at":"2026-09-29T16:15:00+00:00","value":227.88},{"at":"2026-09-29T16:30:00+00:00","value":231.77},{"at":"2026-09-29T16:45:00+00:00","value":244.45},{"at":"2026-09-29T17:00:00+00:00","value":242.68},{"at":"2026-09-29T17:15:00+00:00","value":233.35},{"at":"2026-09-29T17:30:00+00:00","value":227.37},{"at":"2026-09-29T17:45:00+00:00","value":215.79},{"at":"2026-09-29T18:00:00+00:00","value":218.43},{"at":"2026-09-29T18:15:00+00:00","value":207.01},{"at":"2026-09-29T18:30:00+00:00","value":196.85},{"at":"2026-09-29T18:45:00+00:00","value":185.29},{"at":"2026-09-29T19:00:00+00:00","value":183.94},{"at":"2026-09-29T19:15:00+00:00","value":174.47},{"at":"2026-09-29T19:30:00+00:00","value":168.62},{"at":"2026-09-29T19:45:00+00:00","value":152.73},{"at":"2026-09-29T20:00:00+00:00","value":161.51},{"at":"2026-09-29T20:15:00+00:00","value":155.92},{"at":"2026-09-29T20:30:00+00:00","value":153.74},{"at":"2026-09-29T20:45:00+00:00","value":145.44},{"at":"2026-09-29T21:00:00+00:00","value":139.69},{"at":"2026-09-29T21:15:00+00:00","value":134.04},{"at":"2026-09-29T21:30:00+00:00","value":128.69},{"at":"2026-09-29T21:45:00+00:00","value":119.12},{"at":"2026-09-29T22:00:00+00:00","value":112.61},{"at":"2026-09-29T22:15:00+00:00","value":101.44},{"at":"2026-09-29T22:30:00+00:00","value":110.12},{"at":"2026-09-29T22:45:00+00:00","value":114.22},{"at":"2026-09-29T23:00:00+00:00","value":105.64},{"at":"2026-09-29T23:15:00+00:00","value":102.58},{"at":"2026-09-29T23:30:00+00:00","value":103.07},{"at":"2026-09-29T23:45:00+00:00","value":110.7},{"at":"2026-09-30T00:00:00+00:00","value":97.63},{"at":"2026-09-30T00:15:00+00:00","value":101.73},{"at":"2026-09-30T00:30:00+00:00","value":100.05},{"at":"2026-09-30T00:45:00+00:00","value":107.42},{"at":"2026-09-30T01:00:00+00:00","value":100.1},{"at":"2026-09-30T01:15:00+00:00","value":103.65},{"at":"2026-09-30T01:30:00+00:00","value":104.97},{"at":"2026-09-30T01:45:00+00:00","value":102.77},{"at":"2026-09-30T02:00:00+00:00","value":107.32},{"at":"2026-09-30T02:15:00+00:00","value":98.65},{"at":"2026-09-30T02:30:00+00:00","value":101.6},{"at":"2026-09-30T02:45:00+00:00","value":109.62},{"at":"2026-09-30T03:00:00+00:00","value":115.64},{"at":"2026-09-30T03:15:00+00:00","value":119.08},{"at":"2026-09-30T03:30:00+00:00","value":124.14},{"at":"2026-09-30T03:45:00+00:00","value":129.93},{"at":"2026-09-30T04:00:00+00:00","value":144.69},{"at":"2026-09-30T04:15:00+00:00","value":159.42},{"at":"2026-09-30T04:30:00+00:00","value":166.78},{"at":"2026-09-30T04:45:00+00:00","value":170.57},{"at":"2026-09-30T05:00:00+00:00","value":189.56},{"at":"2026-09-30T05:15:00+00:00","value":202.12},{"at":"2026-09-30T05:30:00+00:00","value":204.29},{"at":"2026-09-30T05:45:00+00:00","value":199.67},{"at":"2026-09-30T06:00:00+00:00","value":218.13},{"at":"2026-09-30T06:15:00+00:00","value":203.6},{"at":"2026-09-30T06:30:00+00:00","value":187.45},{"at":"2026-09-30T06:45:00+00:00","value":165.82},{"at":"2026-09-30T07:00:00+00:00","value":189.23},{"at":"2026-09-30T07:15:00+00:00","value":170.85},{"at":"2026-09-30T07:30:00+00:00","value":156.01},{"at":"2026-09-30T07:45:00+00:00","value":144.76},{"at":"2026-09-30T08:00:00+00:00","value":140.0},{"at":"2026-09-30T08:15:00+00:00","value":130.9},{"at":"2026-09-30T08:30:00+00:00","value":123.18},{"at":"2026-09-30T08:45:00+00:00","value":95.15},{"at":"2026-09-30T09:00:00+00:00","value":114.95},{"at":"2026-09-30T09:15:00+00:00","value":90.16},{"at":"2026-09-30T09:30:00+00:00","value":77.97},{"at":"2026-09-30T09:45:00+00:00","value":42.6},{"at":"2026-09-30T10:00:00+00:00","value":60.08},{"at":"2026-09-30T10:15:00+00:00","value":43.85},{"at":"2026-09-30T10:30:00+00:00","value":37.69},{"at":"2026-09-30T10:45:00+00:00","value":30.01},{"at":"2026-09-30T11:00:00+00:00","value":26.32},{"at":"2026-09-30T11:15:00+00:00","value":20.84},{"at":"2026-09-30T11:30:00+00:00","value":13.33},{"at":"2026-09-30T11:45:00+00:00","value":19.51},{"at":"2026-09-30T12:00:00+00:00","value":13.65},{"at":"2026-09-30T12:15:00+00:00","value":24.3},{"at":"2026-09-30T12:30:00+00:00","value":38.14},{"at":"2026-09-30T12:45:00+00:00","value":73.93},{"at":"2026-09-30T13:00:00+00:00","value":43.7},{"at":"2026-09-30T13:15:00+00:00","value":78.46},{"at":"2026-09-30T13:30:00+00:00","value":106.55},{"at":"2026-09-30T13:45:00+00:00","value":111.0},{"at":"2026-09-30T14:00:00+00:00","value":104.98},{"at":"2026-09-30T14:15:00+00:00","value":132.62},{"at":"2026-09-30T14:30:00+00:00","value":169.76},{"at":"2026-09-30T14:45:00+00:00","value":186.5},{"at":"2026-09-30T15:00:00+00:00","value":173.04},{"at":"2026-09-30T15:15:00+00:00","value":194.45},{"at":"2026-09-30T15:30:00+00:00","value":211.78},{"at":"2026-09-30T15:45:00+00:00","value":229.4},{"at":"2026-09-30T16:00:00+00:00","value":213.68},{"at":"2026-09-30T16:15:00+00:00","value":226.5},{"at":"2026-09-30T16:30:00+00:00","value":232.95},{"at":"2026-09-30T16:45:00+00:00","value":248.18},{"at":"2026-09-30T17:00:00+00:00","value":241.78},{"at":"2026-09-30T17:15:00+00:00","value":246.58},{"at":"2026-09-30T17:30:00+00:00","value":255.24},{"at":"2026-09-30T17:45:00+00:00","value":255.37},{"at":"2026-09-30T18:00:00+00:00","value":245.44},{"at":"2026-09-30T18:15:00+00:00","value":242.99},{"at":"2026-09-30T18:30:00+00:00","value":227.16},{"at":"2026-09-30T18:45:00+00:00","value":216.56},{"at":"2026-09-30T19:00:00+00:00","value":235.36},{"at":"2026-09-30T19:15:00+00:00","value":215.39},{"at":"2026-09-30T19:30:00+00:00","value":203.95},{"at":"2026-09-30T19:45:00+00:00","value":170.0},{"at":"2026-09-30T20:00:00+00:00","value":203.49},{"at":"2026-09-30T20:15:00+00:00","value":190.78},{"at":"2026-09-30T20:30:00+00:00","value":184.24},{"at":"2026-09-30T20:45:00+00:00","value":169.04},{"at":"2026-09-30T21:00:00+00:00","value":178.34},{"at":"2026-09-30T21:15:00+00:00","value":164.76},{"at":"2026-09-30T21:30:00+00:00","value":171.04},{"at":"2026-09-30T21:45:00+00:00","value":156.4},{"at":"2026-09-30T22:00:00+00:00","value":166.13},{"at":"2026-09-30T22:15:00+00:00","value":158.82},{"at":"2026-09-30T22:30:00+00:00","value":153.43},{"at":"2026-09-30T22:45:00+00:00","value":153.6},{"at":"2026-09-30T23:00:00+00:00","value":159.4},{"at":"2026-09-30T23:15:00+00:00","value":160.34},{"at":"2026-09-30T23:30:00+00:00","value":159.94},{"at":"2026-09-30T23:45:00+00:00","value":158.79},{"at":"2026-10-01T00:00:00+00:00","value":159.8},{"at":"2026-10-01T00:15:00+00:00","value":158.74},{"at":"2026-10-01T00:30:00+00:00","value":158.79},{"at":"2026-10-01T00:45:00+00:00","value":156.4},{"at":"2026-10-01T01:00:00+00:00","value":161.1},{"at":"2026-10-01T01:15:00+00:00","value":161.11},{"at":"2026-10-01T01:30:00+00:00","value":158.71},{"at":"2026-10-01T01:45:00+00:00","value":157.1},{"at":"2026-10-01T02:00:00+00:00","value":158.59},{"at":"2026-10-01T02:15:00+00:00","value":158.04},{"at":"2026-10-01T02:30:00+00:00","value":155.85},{"at":"2026-10-01T02:45:00+00:00","value":159.72},{"at":"2026-10-01T03:00:00+00:00","value":158.06},{"at":"2026-10-01T03:15:00+00:00","value":158.8},{"at":"2026-10-01T03:30:00+00:00","value":168.39},{"at":"2026-10-01T03:45:00+00:00","value":181.29},{"at":"2026-10-01T04:00:00+00:00","value":177.0},{"at":"2026-10-01T04:15:00+00:00","value":203.11},{"at":"2026-10-01T04:30:00+00:00","value":218.61},{"at":"2026-10-01T04:45:00+00:00","value":233.97},{"at":"2026-10-01T05:00:00+00:00","value":228.14},{"at":"2026-10-01T05:15:00+00:00","value":242.75},{"at":"2026-10-01T05:30:00+00:00","value":243.32},{"at":"2026-10-01T05:45:00+00:00","value":234.76},{"at":"2026-10-01T06:00:00+00:00","value":258.14},{"at":"2026-10-01T06:15:00+00:00","value":235.27},{"at":"2026-10-01T06:30:00+00:00","value":226.0},{"at":"2026-10-01T06:45:00+00:00","value":214.02},{"at":"2026-10-01T07:00:00+00:00","value":238.12},{"at":"2026-10-01T07:15:00+00:00","value":211.99},{"at":"2026-10-01T07:30:00+00:00","value":200.44},{"at":"2026-10-01T07:45:00+00:00","value":182.66},{"at":"2026-10-01T08:00:00+00:00","value":209.53},{"at":"2026-10-01T08:15:00+00:00","value":189.53},{"at":"2026-10-01T08:30:00+00:00","value":173.94},{"at":"2026-10-01T08:45:00+00:00","value":160.6},{"at":"2026-10-01T09:00:00+00:00","value":165.28},{"at":"2026-10-01T09:15:00+00:00","value":158.92},{"at":"2026-10-01T09:30:00+00:00","value":158.8},{"at":"2026-10-01T09:45:00+00:00","value":157.42},{"at":"2026-10-01T10:00:00+00:00","value":160.89},{"at":"2026-10-01T10:15:00+00:00","value":164.01},{"at":"2026-10-01T10:30:00+00:00","value":160.45},{"at":"2026-10-01T10:45:00+00:00","value":163.41},{"at":"2026-10-01T11:00:00+00:00","value":153.31},{"at":"2026-10-01T11:15:00+00:00","value":152.45},{"at":"2026-10-01T11:30:00+00:00","value":151.37},{"at":"2026-10-01T11:45:00+00:00","value":150.96},{"at":"2026-10-01T12:00:00+00:00","value":152.14},{"at":"2026-10-01T12:15:00+00:00","value":147.09},{"at":"2026-10-01T12:30:00+00:00","value":150.64},{"at":"2026-10-01T12:45:00+00:00","value":151.47},{"at":"2026-10-01T13:00:00+00:00","value":150.03},{"at":"2026-10-01T13:15:00+00:00","value":151.34},{"at":"2026-10-01T13:30:00+00:00","value":156.05},{"at":"2026-10-01T13:45:00+00:00","value":170.1},{"at":"2026-10-01T14:00:00+00:00","value":149.7},{"at":"2026-10-01T14:15:00+00:00","value":166.6},{"at":"2026-10-01T14:30:00+00:00","value":196.75},{"at":"2026-10-01T14:45:00+00:00","value":243.68},{"at":"2026-10-01T15:00:00+00:00","value":179.92},{"at":"2026-10-01T15:15:00+00:00","value":224.21},{"at":"2026-10-01T15:30:00+00:00","value":250.0},{"at":"2026-10-01T15:45:00+00:00","value":275.0},{"at":"2026-10-01T16:00:00+00:00","value":246.19},{"at":"2026-10-01T16:15:00+00:00","value":265.01},{"at":"2026-10-01T16:30:00+00:00","value":276.58},{"at":"2026-10-01T16:45:00+00:00","value":310.98},{"at":"2026-10-01T17:00:00+00:00","value":289.7},{"at":"2026-10-01T17:15:00+00:00","value":300.22},{"at":"2026-10-01T17:30:00+00:00","value":314.78},{"at":"2026-10-01T17:45:00+00:00","value":297.47},{"at":"2026-10-01T18:00:00+00:00","value":280.0},{"at":"2026-10-01T18:15:00+00:00","value":268.11},{"at":"2026-10-01T18:30:00+00:00","value":251.93},{"at":"2026-10-01T18:45:00+00:00","value":230.01},{"at":"2026-10-01T19:00:00+00:00","value":250.03},{"at":"2026-10-01T19:15:00+00:00","value":229.97},{"at":"2026-10-01T19:30:00+00:00","value":221.13},{"at":"2026-10-01T19:45:00+00:00","value":204.53},{"at":"2026-10-01T20:00:00+00:00","value":221.64},{"at":"2026-10-01T20:15:00+00:00","value":207.5},{"at":"2026-10-01T20:30:00+00:00","value":203.9},{"at":"2026-10-01T20:45:00+00:00","value":186.95},{"at":"2026-10-01T21:00:00+00:00","value":201.71},{"at":"2026-10-01T21:15:00+00:00","value":190.04},{"at":"2026-10-01T21:30:00+00:00","value":182.58},{"at":"2026-10-01T21:45:00+00:00","value":171.38},{"at":"2026-10-01T22:00:00+00:00","value":185.11},{"at":"2026-10-01T22:15:00+00:00","value":177.65},{"at":"2026-10-01T22:30:00+00:00","value":169.68},{"at":"2026-10-01T22:45:00+00:00","value":167.69},{"at":"2026-10-01T23:00:00+00:00","value":168.19},{"at":"2026-10-01T23:15:00+00:00","value":164.95},{"at":"2026-10-01T23:30:00+00:00","value":162.32},{"at":"2026-10-01T23:45:00+00:00","value":160.15},{"at":"2026-10-02T00:00:00+00:00","value":161.39},{"at":"2026-10-02T00:15:00+00:00","value":160.34},{"at":"2026-10-02T00:30:00+00:00","value":160.93},{"at":"2026-10-02T00:45:00+00:00","value":161.16},{"at":"2026-10-02T01:00:00+00:00","value":159.59},{"at":"2026-10-02T01:15:00+00:00","value":159.07},{"at":"2026-10-02T01:30:00+00:00","value":160.61},{"at":"2026-10-02T01:45:00+00:00","value":160.99},{"at":"2026-10-02T02:00:00+00:00","value":162.92},{"at":"2026-10-02T02:15:00+00:00","value":162.2},{"at":"2026-10-02T02:30:00+00:00","value":161.4},{"at":"2026-10-02T02:45:00+00:00","value":166.02},{"at":"2026-10-02T03:00:00+00:00","value":163.55},{"at":"2026-10-02T03:15:00+00:00","value":170.49},{"at":"2026-10-02T03:30:00+00:00","value":184.83},{"at":"2026-10-02T03:45:00+00:00","value":192.61},{"at":"2026-10-02T04:00:00+00:00","value":195.55},{"at":"2026-10-02T04:15:00+00:00","value":216.11},{"at":"2026-10-02T04:30:00+00:00","value":231.79},{"at":"2026-10-02T04:45:00+00:00","value":243.23},{"at":"2026-10-02T05:00:00+00:00","value":246.83},{"at":"2026-10-02T05:15:00+00:00","value":258.54},{"at":"2026-10-02T05:30:00+00:00","value":266.08},{"at":"2026-10-02T05:45:00+00:00","value":269.89},{"at":"2026-10-02T06:00:00+00:00","value":288.93},{"at":"2026-10-02T06:15:00+00:00","value":270.74},{"at":"2026-10-02T06:30:00+00:00","value":257.21},{"at":"2026-10-02T06:45:00+00:00","value":240.27},{"at":"2026-10-02T07:00:00+00:00","value":261.39},{"at":"2026-10-02T07:15:00+00:00","value":233.97},{"at":"2026-10-02T07:30:00+00:00","value":220.1},{"at":"2026-10-02T07:45:00+00:00","value":186.51},{"at":"2026-10-02T08:00:00+00:00","value":211.67},{"at":"2026-10-02T08:15:00+00:00","value":188.27},{"at":"2026-10-02T08:30:00+00:00","value":175.21},{"at":"2026-10-02T08:45:00+00:00","value":172.25},{"at":"2026-10-02T09:00:00+00:00","value":183.88},{"at":"2026-10-02T09:15:00+00:00","value":173.18},{"at":"2026-10-02T09:30:00+00:00","value":165.69},{"at":"2026-10-02T09:45:00+00:00","value":157.52},{"at":"2026-10-02T10:00:00+00:00","value":154.91},{"at":"2026-10-02T10:15:00+00:00","value":152.2},{"at":"2026-10-02T10:30:00+00:00","value":153.69},{"at":"2026-10-02T10:45:00+00:00","value":149.63},{"at":"2026-10-02T11:00:00+00:00","value":146.07},{"at":"2026-10-02T11:15:00+00:00","value":141.96},{"at":"2026-10-02T11:30:00+00:00","value":140.68},{"at":"2026-10-02T11:45:00+00:00","value":134.72},{"at":"2026-10-02T12:00:00+00:00","value":143.79},{"at":"2026-10-02T12:15:00+00:00","value":140.9},{"at":"2026-10-02T12:30:00+00:00","value":141.41},{"at":"2026-10-02T12:45:00+00:00","value":143.15},{"at":"2026-10-02T13:00:00+00:00","value":141.08},{"at":"2026-10-02T13:15:00+00:00","value":143.59},{"at":"2026-10-02T13:30:00+00:00","value":155.09},{"at":"2026-10-02T13:45:00+00:00","value":160.64},{"at":"2026-10-02T14:00:00+00:00","value":156.21},{"at":"2026-10-02T14:15:00+00:00","value":163.79},{"at":"2026-10-02T14:30:00+00:00","value":187.3},{"at":"2026-10-02T14:45:00+00:00","value":216.81},{"at":"2026-10-02T15:00:00+00:00","value":180.08},{"at":"2026-10-02T15:15:00+00:00","value":219.62},{"at":"2026-10-02T15:30:00+00:00","value":238.22},{"at":"2026-10-02T15:45:00+00:00","value":261.49},{"at":"2026-10-02T16:00:00+00:00","value":239.98},{"at":"2026-10-02T16:15:00+00:00","value":250.44},{"at":"2026-10-02T16:30:00+00:00","value":276.08},{"at":"2026-10-02T16:45:00+00:00","value":299.72},{"at":"2026-10-02T17:00:00+00:00","value":328.58},{"at":"2026-10-02T17:15:00+00:00","value":328.11},{"at":"2026-10-02T17:30:00+00:00","value":315.28},{"at":"2026-10-02T17:45:00+00:00","value":307.27},{"at":"2026-10-02T18:00:00+00:00","value":282.7},{"at":"2026-10-02T18:15:00+00:00","value":279.83},{"at":"2026-10-02T18:30:00+00:00","value":261.82},{"at":"2026-10-02T18:45:00+00:00","value":248.08},{"at":"2026-10-02T19:00:00+00:00","value":244.78},{"at":"2026-10-02T19:15:00+00:00","value":238.14},{"at":"2026-10-02T19:30:00+00:00","value":224.99},{"at":"2026-10-02T19:45:00+00:00","value":211.92},{"at":"2026-10-02T20:00:00+00:00","value":220.23},{"at":"2026-10-02T20:15:00+00:00","value":215.0},{"at":"2026-10-02T20:30:00+00:00","value":209.39},{"at":"2026-10-02T20:45:00+00:00","value":201.39},{"at":"2026-10-02T21:00:00+00:00","value":201.62},{"at":"2026-10-02T21:15:00+00:00","value":197.52},{"at":"2026-10-02T21:30:00+00:00","value":194.55},{"at":"2026-10-02T21:45:00+00:00","value":185.1},{"at":"2026-10-02T22:00:00+00:00","value":204.51},{"at":"2026-10-02T22:15:00+00:00","value":200.0},{"at":"2026-10-02T22:30:00+00:00","value":189.89},{"at":"2026-10-02T22:45:00+00:00","value":182.18},{"at":"2026-10-02T23:00:00+00:00","value":187.51},{"at":"2026-10-02T23:15:00+00:00","value":180.3},{"at":"2026-10-02T23:30:00+00:00","value":174.97},{"at":"2026-10-02T23:45:00+00:00","value":173.15},{"at":"2026-10-03T00:00:00+00:00","value":176.96},{"at":"2026-10-03T00:15:00+00:00","value":174.99},{"at":"2026-10-03T00:30:00+00:00","value":172.6},{"at":"2026-10-03T00:45:00+00:00","value":169.5},{"at":"2026-10-03T01:00:00+00:00","value":173.4},{"at":"2026-10-03T01:15:00+00:00","value":169.4},{"at":"2026-10-03T01:30:00+00:00","value":166.63},{"at":"2026-10-03T01:45:00+00:00","value":167.0},{"at":"2026-10-03T02:00:00+00:00","value":166.04},{"at":"2026-10-03T02:15:00+00:00","value":166.31},{"at":"2026-10-03T02:30:00+00:00","value":166.24},{"at":"2026-10-03T02:45:00+00:00","value":165.7},{"at":"2026-10-03T03:00:00+00:00","value":169.43},{"at":"2026-10-03T03:15:00+00:00","value":168.46},{"at":"2026-10-03T03:30:00+00:00","value":169.8},{"at":"2026-10-03T03:45:00+00:00","value":171.9},{"at":"2026-10-03T04:00:00+00:00","value":175.01},{"at":"2026-10-03T04:15:00+00:00","value":180.1},{"at":"2026-10-03T04:30:00+00:00","value":185.98},{"at":"2026-10-03T04:45:00+00:00","value":190.61},{"at":"2026-10-03T05:00:00+00:00","value":197.45},{"at":"2026-10-03T05:15:00+00:00","value":198.61},{"at":"2026-10-03T05:30:00+00:00","value":198.85},{"at":"2026-10-03T05:45:00+00:00","value":199.51},{"at":"2026-10-03T06:00:00+00:00","value":202.94},{"at":"2026-10-03T06:15:00+00:00","value":198.06},{"at":"2026-10-03T06:30:00+00:00","value":187.8},{"at":"2026-10-03T06:45:00+00:00","value":167.71},{"at":"2026-10-03T07:00:00+00:00","value":199.21},{"at":"2026-10-03T07:15:00+00:00","value":180.51},{"at":"2026-10-03T07:30:00+00:00","value":161.37},{"at":"2026-10-03T07:45:00+00:00","value":152.22},{"at":"2026-10-03T08:00:00+00:00","value":164.83},{"at":"2026-10-03T08:15:00+00:00","value":154.84},{"at":"2026-10-03T08:30:00+00:00","value":148.08},{"at":"2026-10-03T08:45:00+00:00","value":140.1},{"at":"2026-10-03T09:00:00+00:00","value":151.08},{"at":"2026-10-03T09:15:00+00:00","value":131.62},{"at":"2026-10-03T09:30:00+00:00","value":113.24},{"at":"2026-10-03T09:45:00+00:00","value":104.21},{"at":"2026-10-03T10:00:00+00:00","value":96.39},{"at":"2026-10-03T10:15:00+00:00","value":86.64},{"at":"2026-10-03T10:30:00+00:00","value":81.91},{"at":"2026-10-03T10:45:00+00:00","value":71.65},{"at":"2026-10-03T11:00:00+00:00","value":62.08},{"at":"2026-10-03T11:15:00+00:00","value":57.41},{"at":"2026-10-03T11:30:00+00:00","value":52.77},{"at":"2026-10-03T11:45:00+00:00","value":54.56},{"at":"2026-10-03T12:00:00+00:00","value":55.82},{"at":"2026-10-03T12:15:00+00:00","value":62.66},{"at":"2026-10-03T12:30:00+00:00","value":72.76},{"at":"2026-10-03T12:45:00+00:00","value":89.58},{"at":"2026-10-03T13:00:00+00:00","value":97.94},{"at":"2026-10-03T13:15:00+00:00","value":105.2},{"at":"2026-10-03T13:30:00+00:00","value":118.82},{"at":"2026-10-03T13:45:00+00:00","value":134.63},{"at":"2026-10-03T14:00:00+00:00","value":121.56},{"at":"2026-10-03T14:15:00+00:00","value":145.0},{"at":"2026-10-03T14:30:00+00:00","value":162.69},{"at":"2026-10-03T14:45:00+00:00","value":200.02},{"at":"2026-10-03T15:00:00+00:00","value":165.12},{"at":"2026-10-03T15:15:00+00:00","value":188.49},{"at":"2026-10-03T15:30:00+00:00","value":204.92},{"at":"2026-10-03T15:45:00+00:00","value":218.74},{"at":"2026-10-03T16:00:00+00:00","value":216.49},{"at":"2026-10-03T16:15:00+00:00","value":221.69},{"at":"2026-10-03T16:30:00+00:00","value":229.46},{"at":"2026-10-03T16:45:00+00:00","value":243.06},{"at":"2026-10-03T17:00:00+00:00","value":236.13},{"at":"2026-10-03T17:15:00+00:00","value":240.45},{"at":"2026-10-03T17:30:00+00:00","value":238.7},{"at":"2026-10-03T17:45:00+00:00","value":233.15},{"at":"2026-10-03T18:00:00+00:00","value":230.0},{"at":"2026-10-03T18:15:00+00:00","value":226.71},{"at":"2026-10-03T18:30:00+00:00","value":221.65},{"at":"2026-10-03T18:45:00+00:00","value":214.52},{"at":"2026-10-03T19:00:00+00:00","value":221.81},{"at":"2026-10-03T19:15:00+00:00","value":216.2},{"at":"2026-10-03T19:30:00+00:00","value":214.02},{"at":"2026-10-03T19:45:00+00:00","value":208.71},{"at":"2026-10-03T20:00:00+00:00","value":211.83},{"at":"2026-10-03T20:15:00+00:00","value":210.0},{"at":"2026-10-03T20:30:00+00:00","value":206.41},{"at":"2026-10-03T20:45:00+00:00","value":205.5},{"at":"2026-10-03T21:00:00+00:00","value":204.8},{"at":"2026-10-03T21:15:00+00:00","value":197.36},{"at":"2026-10-03T21:30:00+00:00","value":192.85},{"at":"2026-10-03T21:45:00+00:00","value":184.86},{"at":"2026-10-03T22:00:00+00:00","value":205.83},{"at":"2026-10-03T22:15:00+00:00","value":201.45},{"at":"2026-10-03T22:30:00+00:00","value":188.81},{"at":"2026-10-03T22:45:00+00:00","value":180.21},{"at":"2026-10-03T23:00:00+00:00","value":191.68},{"at":"2026-10-03T23:15:00+00:00","value":189.72},{"at":"2026-10-03T23:30:00+00:00","value":190.8},{"at":"2026-10-03T23:45:00+00:00","value":182.18},{"at":"2026-10-04T00:00:00+00:00","value":192.54},{"at":"2026-10-04T00:15:00+00:00","value":180.23},{"at":"2026-10-04T00:30:00+00:00","value":180.1},{"at":"2026-10-04T00:45:00+00:00","value":177.9},{"at":"2026-10-04T01:00:00+00:00","value":183.09},{"at":"2026-10-04T01:15:00+00:00","value":180.85},{"at":"2026-10-04T01:30:00+00:00","value":180.25},{"at":"2026-10-04T01:45:00+00:00","value":174.74},{"at":"2026-10-04T02:00:00+00:00","value":175.7},{"at":"2026-10-04T02:15:00+00:00","value":175.7},{"at":"2026-10-04T02:30:00+00:00","value":178.67},{"at":"2026-10-04T02:45:00+00:00","value":176.87},{"at":"2026-10-04T03:00:00+00:00","value":176.91},{"at":"2026-10-04T03:15:00+00:00","value":176.9},{"at":"2026-10-04T03:30:00+00:00","value":181.87},{"at":"2026-10-04T03:45:00+00:00","value":189.63},{"at":"2026-10-04T04:00:00+00:00","value":179.68},{"at":"2026-10-04T04:15:00+00:00","value":185.34},{"at":"2026-10-04T04:30:00+00:00","value":192.05},{"at":"2026-10-04T04:45:00+00:00","value":201.46},{"at":"2026-10-04T05:00:00+00:00","value":200.45},{"at":"2026-10-04T05:15:00+00:00","value":201.19},{"at":"2026-10-04T05:30:00+00:00","value":193.93},{"at":"2026-10-04T05:45:00+00:00","value":190.55},{"at":"2026-10-04T06:00:00+00:00","value":200.74},{"at":"2026-10-04T06:15:00+00:00","value":192.58},{"at":"2026-10-04T06:30:00+00:00","value":187.44},{"at":"2026-10-04T06:45:00+00:00","value":166.0},{"at":"2026-10-04T07:00:00+00:00","value":190.78},{"at":"2026-10-04T07:15:00+00:00","value":178.23},{"at":"2026-10-04T07:30:00+00:00","value":170.09},{"at":"2026-10-04T07:45:00+00:00","value":153.27},{"at":"2026-10-04T08:00:00+00:00","value":162.75},{"at":"2026-10-04T08:15:00+00:00","value":149.18},{"at":"2026-10-04T08:30:00+00:00","value":136.24},{"at":"2026-10-04T08:45:00+00:00","value":126.73},{"at":"2026-10-04T09:00:00+00:00","value":127.93},{"at":"2026-10-04T09:15:00+00:00","value":115.41},{"at":"2026-10-04T09:30:00+00:00","value":108.02},{"at":"2026-10-04T09:45:00+00:00","value":90.85},{"at":"2026-10-04T10:00:00+00:00","value":87.26},{"at":"2026-10-04T10:15:00+00:00","value":81.31},{"at":"2026-10-04T10:30:00+00:00","value":74.08},{"at":"2026-10-04T10:45:00+00:00","value":64.97},{"at":"2026-10-04T11:00:00+00:00","value":60.76},{"at":"2026-10-04T11:15:00+00:00","value":50.72},{"at":"2026-10-04T11:30:00+00:00","value":44.47},{"at":"2026-10-04T11:45:00+00:00","value":44.81},{"at":"2026-10-04T12:00:00+00:00","value":42.33},{"at":"2026-10-04T12:15:00+00:00","value":48.94},{"at":"2026-10-04T12:30:00+00:00","value":59.77},{"at":"2026-10-04T12:45:00+00:00","value":72.28},{"at":"2026-10-04T13:00:00+00:00","value":65.84},{"at":"2026-10-04T13:15:00+00:00","value":85.2},{"at":"2026-10-04T13:30:00+00:00","value":96.46},{"at":"2026-10-04T13:45:00+00:00","value":112.5},{"at":"2026-10-04T14:00:00+00:00","value":109.5},{"at":"2026-10-04T14:15:00+00:00","value":136.74},{"at":"2026-10-04T14:30:00+00:00","value":160.26},{"at":"2026-10-04T14:45:00+00:00","value":190.74},{"at":"2026-10-04T15:00:00+00:00","value":164.41},{"at":"2026-10-04T15:15:00+00:00","value":190.33},{"at":"2026-10-04T15:30:00+00:00","value":214.99},{"at":"2026-10-04T15:45:00+00:00","value":225.86},{"at":"2026-10-04T16:00:00+00:00","value":213.91},{"at":"2026-10-04T16:15:00+00:00","value":222.2},{"at":"2026-10-04T16:30:00+00:00","value":226.39},{"at":"2026-10-04T16:45:00+00:00","value":234.97},{"at":"2026-10-04T17:00:00+00:00","value":232.42},{"at":"2026-10-04T17:15:00+00:00","value":240.33},{"at":"2026-10-04T17:30:00+00:00","value":244.9},{"at":"2026-10-04T17:45:00+00:00","value":237.19},{"at":"2026-10-04T18:00:00+00:00","value":234.5},{"at":"2026-10-04T18:15:00+00:00","value":237.12},{"at":"2026-10-04T18:30:00+00:00","value":228.22},{"at":"2026-10-04T18:45:00+00:00","value":219.72},{"at":"2026-10-04T19:00:00+00:00","value":222.06},{"at":"2026-10-04T19:15:00+00:00","value":216.93},{"at":"2026-10-04T19:30:00+00:00","value":213.99},{"at":"2026-10-04T19:45:00+00:00","value":213.63},{"at":"2026-10-04T20:00:00+00:00","value":214.98},{"at":"2026-10-04T20:15:00+00:00","value":214.92},{"at":"2026-10-04T20:30:00+00:00","value":213.99},{"at":"2026-10-04T20:45:00+00:00","value":205.25},{"at":"2026-10-04T21:00:00+00:00","value":212.69},{"at":"2026-10-04T21:15:00+00:00","value":197.84},{"at":"2026-10-04T21:30:00+00:00","value":188.14},{"at":"2026-10-04T21:45:00+00:00","value":171.02},{"at":"2026-10-04T22:00:00+00:00","value":161.27},{"at":"2026-10-04T22:15:00+00:00","value":167.29},{"at":"2026-10-04T22:30:00+00:00","value":172.81},{"at":"2026-10-04T22:45:00+00:00","value":168.07},{"at":"2026-10-04T23:00:00+00:00","value":167.38},{"at":"2026-10-04T23:15:00+00:00","value":157.66},{"at":"2026-10-04T23:30:00+00:00","value":164.2},{"at":"2026-10-04T23:45:00+00:00","value":158.55},{"at":"2026-10-05T00:00:00+00:00","value":161.07},{"at":"2026-10-05T00:15:00+00:00","value":153.12},{"at":"2026-10-05T00:30:00+00:00","value":154.33},{"at":"2026-10-05T00:45:00+00:00","value":151.25},{"at":"2026-10-05T01:00:00+00:00","value":150.54},{"at":"2026-10-05T01:15:00+00:00","value":149.83},{"at":"2026-10-05T01:30:00+00:00","value":149.81},{"at":"2026-10-05T01:45:00+00:00","value":149.67},{"at":"2026-10-05T02:00:00+00:00","value":151.79},{"at":"2026-10-05T02:15:00+00:00","value":152.17},{"at":"2026-10-05T02:30:00+00:00","value":146.6},{"at":"2026-10-05T02:45:00+00:00","value":149.38},{"at":"2026-10-05T03:00:00+00:00","value":151.11},{"at":"2026-10-05T03:15:00+00:00","value":152.2},{"at":"2026-10-05T03:30:00+00:00","value":154.08},{"at":"2026-10-05T03:45:00+00:00","value":163.17},{"at":"2026-10-05T04:00:00+00:00","value":171.44},{"at":"2026-10-05T04:15:00+00:00","value":193.66},{"at":"2026-10-05T04:30:00+00:00","value":212.02},{"at":"2026-10-05T04:45:00+00:00","value":215.0},{"at":"2026-10-05T05:00:00+00:00","value":206.13},{"at":"2026-10-05T05:15:00+00:00","value":213.46},{"at":"2026-10-05T05:30:00+00:00","value":230.0},{"at":"2026-10-05T05:45:00+00:00","value":237.6},{"at":"2026-10-05T06:00:00+00:00","value":260.02},{"at":"2026-10-05T06:15:00+00:00","value":238.01},{"at":"2026-10-05T06:30:00+00:00","value":223.58},{"at":"2026-10-05T06:45:00+00:00","value":204.19},{"at":"2026-10-05T07:00:00+00:00","value":221.8},{"at":"2026-10-05T07:15:00+00:00","value":202.08},{"at":"2026-10-05T07:30:00+00:00","value":173.89},{"at":"2026-10-05T07:45:00+00:00","value":154.27},{"at":"2026-10-05T08:00:00+00:00","value":169.09},{"at":"2026-10-05T08:15:00+00:00","value":155.74},{"at":"2026-10-05T08:30:00+00:00","value":143.4},{"at":"2026-10-05T08:45:00+00:00","value":116.2},{"at":"2026-10-05T09:00:00+00:00","value":131.92},{"at":"2026-10-05T09:15:00+00:00","value":94.96},{"at":"2026-10-05T09:30:00+00:00","value":81.85},{"at":"2026-10-05T09:45:00+00:00","value":61.06},{"at":"2026-10-05T10:00:00+00:00","value":85.58},{"at":"2026-10-05T10:15:00+00:00","value":60.43},{"at":"2026-10-05T10:30:00+00:00","value":52.11},{"at":"2026-10-05T10:45:00+00:00","value":40.47},{"at":"2026-10-05T11:00:00+00:00","value":10.66},{"at":"2026-10-05T11:15:00+00:00","value":6.03},{"at":"2026-10-05T11:30:00+00:00","value":5.1},{"at":"2026-10-05T11:45:00+00:00","value":5.03},{"at":"2026-10-05T12:00:00+00:00","value":12.59},{"at":"2026-10-05T12:15:00+00:00","value":24.37},{"at":"2026-10-05T12:30:00+00:00","value":44.4},{"at":"2026-10-05T12:45:00+00:00","value":62.42},{"at":"2026-10-05T13:00:00+00:00","value":42.26},{"at":"2026-10-05T13:15:00+00:00","value":60.02},{"at":"2026-10-05T13:30:00+00:00","value":85.35},{"at":"2026-10-05T13:45:00+00:00","value":94.92},{"at":"2026-10-05T14:00:00+00:00","value":74.07},{"at":"2026-10-05T14:15:00+00:00","value":129.11},{"at":"2026-10-05T14:30:00+00:00","value":148.43},{"at":"2026-10-05T14:45:00+00:00","value":164.27},{"at":"2026-10-05T15:00:00+00:00","value":152.16},{"at":"2026-10-05T15:15:00+00:00","value":172.66},{"at":"2026-10-05T15:30:00+00:00","value":198.46},{"at":"2026-10-05T15:45:00+00:00","value":213.97},{"at":"2026-10-05T16:00:00+00:00","value":197.97},{"at":"2026-10-05T16:15:00+00:00","value":219.44},{"at":"2026-10-05T16:30:00+00:00","value":230.99},{"at":"2026-10-05T16:45:00+00:00","value":250.49},{"at":"2026-10-05T17:00:00+00:00","value":243.31},{"at":"2026-10-05T17:15:00+00:00","value":252.51},{"at":"2026-10-05T17:30:00+00:00","value":261.43},{"at":"2026-10-05T17:45:00+00:00","value":250.96},{"at":"2026-10-05T18:00:00+00:00","value":251.3},{"at":"2026-10-05T18:15:00+00:00","value":220.98},{"at":"2026-10-05T18:30:00+00:00","value":215.0},{"at":"2026-10-05T18:45:00+00:00","value":200.06},{"at":"2026-10-05T19:00:00+00:00","value":212.92},{"at":"2026-10-05T19:15:00+00:00","value":202.83},{"at":"2026-10-05T19:30:00+00:00","value":204.62},{"at":"2026-10-05T19:45:00+00:00","value":180.41},{"at":"2026-10-05T20:00:00+00:00","value":205.73},{"at":"2026-10-05T20:15:00+00:00","value":194.69},{"at":"2026-10-05T20:30:00+00:00","value":189.23},{"at":"2026-10-05T20:45:00+00:00","value":167.39},{"at":"2026-10-05T21:00:00+00:00","value":192.13},{"at":"2026-10-05T21:15:00+00:00","value":167.61},{"at":"2026-10-05T21:30:00+00:00","value":161.71},{"at":"2026-10-05T21:45:00+00:00","value":148.63},{"at":"2026-10-05T22:00:00+00:00","value":160.55},{"at":"2026-10-05T22:15:00+00:00","value":152.98},{"at":"2026-10-05T22:30:00+00:00","value":148.16},{"at":"2026-10-05T22:45:00+00:00","value":145.34},{"at":"2026-10-05T23:00:00+00:00","value":150.27},{"at":"2026-10-05T23:15:00+00:00","value":148.69},{"at":"2026-10-05T23:30:00+00:00","value":147.89},{"at":"2026-10-05T23:45:00+00:00","value":152.69},{"at":"2026-10-06T00:00:00+00:00","value":155.4},{"at":"2026-10-06T00:15:00+00:00","value":150.89},{"at":"2026-10-06T00:30:00+00:00","value":151.51},{"at":"2026-10-06T00:45:00+00:00","value":149.71},{"at":"2026-10-06T01:00:00+00:00","value":151.38},{"at":"2026-10-06T01:15:00+00:00","value":151.29},{"at":"2026-10-06T01:30:00+00:00","value":150.78},{"at":"2026-10-06T01:45:00+00:00","value":152.69},{"at":"2026-10-06T02:00:00+00:00","value":150.09},{"at":"2026-10-06T02:15:00+00:00","value":152.98},{"at":"2026-10-06T02:30:00+00:00","value":153.69},{"at":"2026-10-06T02:45:00+00:00","value":156.04},{"at":"2026-10-06T03:00:00+00:00","value":145.83},{"at":"2026-10-06T03:15:00+00:00","value":154.65},{"at":"2026-10-06T03:30:00+00:00","value":169.33},{"at":"2026-10-06T03:45:00+00:00","value":197.96},{"at":"2026-10-06T04:00:00+00:00","value":191.35},{"at":"2026-10-06T04:15:00+00:00","value":204.64},{"at":"2026-10-06T04:30:00+00:00","value":211.38},{"at":"2026-10-06T04:45:00+00:00","value":222.19},{"at":"2026-10-06T05:00:00+00:00","value":222.55},{"at":"2026-10-06T05:15:00+00:00","value":241.72},{"at":"2026-10-06T05:30:00+00:00","value":247.77},{"at":"2026-10-06T05:45:00+00:00","value":252.0},{"at":"2026-10-06T06:00:00+00:00","value":286.08},{"at":"2026-10-06T06:15:00+00:00","value":255.39},{"at":"2026-10-06T06:30:00+00:00","value":244.68},{"at":"2026-10-06T06:45:00+00:00","value":213.05},{"at":"2026-10-06T07:00:00+00:00","value":259.0},{"at":"2026-10-06T07:15:00+00:00","value":221.84},{"at":"2026-10-06T07:30:00+00:00","value":203.06},{"at":"2026-10-06T07:45:00+00:00","value":157.49},{"at":"2026-10-06T08:00:00+00:00","value":198.27},{"at":"2026-10-06T08:15:00+00:00","value":172.96},{"at":"2026-10-06T08:30:00+00:00","value":167.04},{"at":"2026-10-06T08:45:00+00:00","value":149.22},{"at":"2026-10-06T09:00:00+00:00","value":153.97},{"at":"2026-10-06T09:15:00+00:00","value":144.02},{"at":"2026-10-06T09:30:00+00:00","value":137.84},{"at":"2026-10-06T09:45:00+00:00","value":132.45},{"at":"2026-10-06T10:00:00+00:00","value":132.57},{"at":"2026-10-06T10:15:00+00:00","value":133.34},{"at":"2026-10-06T10:30:00+00:00","value":133.67},{"at":"2026-10-06T10:45:00+00:00","value":130.37},{"at":"2026-10-06T11:00:00+00:00","value":129.42},{"at":"2026-10-06T11:15:00+00:00","value":128.34},{"at":"2026-10-06T11:30:00+00:00","value":124.33},{"at":"2026-10-06T11:45:00+00:00","value":126.0},{"at":"2026-10-06T12:00:00+00:00","value":130.01},{"at":"2026-10-06T12:15:00+00:00","value":133.32},{"at":"2026-10-06T12:30:00+00:00","value":138.08},{"at":"2026-10-06T12:45:00+00:00","value":145.28},{"at":"2026-10-06T13:00:00+00:00","value":144.32},{"at":"2026-10-06T13:15:00+00:00","value":152.69},{"at":"2026-10-06T13:30:00+00:00","value":155.0},{"at":"2026-10-06T13:45:00+00:00","value":166.19},{"at":"2026-10-06T14:00:00+00:00","value":155.77},{"at":"2026-10-06T14:15:00+00:00","value":169.19},{"at":"2026-10-06T14:30:00+00:00","value":201.39},{"at":"2026-10-06T14:45:00+00:00","value":233.65},{"at":"2026-10-06T15:00:00+00:00","value":194.67},{"at":"2026-10-06T15:15:00+00:00","value":225.0},{"at":"2026-10-06T15:30:00+00:00","value":256.04},{"at":"2026-10-06T15:45:00+00:00","value":324.32},{"at":"2026-10-06T16:00:00+00:00","value":276.65},{"at":"2026-10-06T16:15:00+00:00","value":310.91},{"at":"2026-10-06T16:30:00+00:00","value":365.04},{"at":"2026-10-06T16:45:00+00:00","value":406.0},{"at":"2026-10-06T17:00:00+00:00","value":404.99},{"at":"2026-10-06T17:15:00+00:00","value":383.05},{"at":"2026-10-06T17:30:00+00:00","value":390.36},{"at":"2026-10-06T17:45:00+00:00","value":350.88},{"at":"2026-10-06T18:00:00+00:00","value":343.76},{"at":"2026-10-06T18:15:00+00:00","value":297.02},{"at":"2026-10-06T18:30:00+00:00","value":280.42},{"at":"2026-10-06T18:45:00+00:00","value":263.51},{"at":"2026-10-06T19:00:00+00:00","value":274.7},{"at":"2026-10-06T19:15:00+00:00","value":252.73},{"at":"2026-10-06T19:30:00+00:00","value":245.85},{"at":"2026-10-06T19:45:00+00:00","value":222.62},{"at":"2026-10-06T20:00:00+00:00","value":231.11},{"at":"2026-10-06T20:15:00+00:00","value":226.1},{"at":"2026-10-06T20:30:00+00:00","value":226.15},{"at":"2026-10-06T20:45:00+00:00","value":219.29},{"at":"2026-10-06T21:00:00+00:00","value":217.0},{"at":"2026-10-06T21:15:00+00:00","value":211.99},{"at":"2026-10-06T21:30:00+00:00","value":207.78},{"at":"2026-10-06T21:45:00+00:00","value":201.63},{"at":"2026-10-06T22:00:00+00:00","value":209.71},{"at":"2026-10-06T22:15:00+00:00","value":201.53},{"at":"2026-10-06T22:30:00+00:00","value":192.24},{"at":"2026-10-06T22:45:00+00:00","value":189.04},{"at":"2026-10-06T23:00:00+00:00","value":190.04},{"at":"2026-10-06T23:15:00+00:00","value":188.22},{"at":"2026-10-06T23:30:00+00:00","value":183.05},{"at":"2026-10-06T23:45:00+00:00","value":178.93},{"at":"2026-10-07T00:00:00+00:00","value":180.03},{"at":"2026-10-07T00:15:00+00:00","value":177.63},{"at":"2026-10-07T00:30:00+00:00","value":178.47},{"at":"2026-10-07T00:45:00+00:00","value":180.73},{"at":"2026-10-07T01:00:00+00:00","value":177.33},{"at":"2026-10-07T01:15:00+00:00","value":183.38},{"at":"2026-10-07T01:30:00+00:00","value":182.0},{"at":"2026-10-07T01:45:00+00:00","value":182.72},{"at":"2026-10-07T02:00:00+00:00","value":183.89},{"at":"2026-10-07T02:15:00+00:00","value":186.36},{"at":"2026-10-07T02:30:00+00:00","value":187.31},{"at":"2026-10-07T02:45:00+00:00","value":186.67},{"at":"2026-10-07T03:00:00+00:00","value":181.5},{"at":"2026-10-07T03:15:00+00:00","value":177.26},{"at":"2026-10-07T03:30:00+00:00","value":190.17},{"at":"2026-10-07T03:45:00+00:00","value":205.49},{"at":"2026-10-07T04:00:00+00:00","value":213.74},{"at":"2026-10-07T04:15:00+00:00","value":238.99},{"at":"2026-10-07T04:30:00+00:00","value":251.49},{"at":"2026-10-07T04:45:00+00:00","value":263.04},{"at":"2026-10-07T05:00:00+00:00","value":277.57},{"at":"2026-10-07T05:15:00+00:00","value":276.88},{"at":"2026-10-07T05:30:00+00:00","value":277.41},{"at":"2026-10-07T05:45:00+00:00","value":256.0},{"at":"2026-10-07T06:00:00+00:00","value":280.42},{"at":"2026-10-07T06:15:00+00:00","value":264.88},{"at":"2026-10-07T06:30:00+00:00","value":244.02},{"at":"2026-10-07T06:45:00+00:00","value":224.97},{"at":"2026-10-07T07:00:00+00:00","value":259.37},{"at":"2026-10-07T07:15:00+00:00","value":235.4},{"at":"2026-10-07T07:30:00+00:00","value":217.78},{"at":"2026-10-07T07:45:00+00:00","value":184.54},{"at":"2026-10-07T08:00:00+00:00","value":212.01},{"at":"2026-10-07T08:15:00+00:00","value":191.31},{"at":"2026-10-07T08:30:00+00:00","value":175.47},{"at":"2026-10-07T08:45:00+00:00","value":161.14},{"at":"2026-10-07T09:00:00+00:00","value":171.42},{"at":"2026-10-07T09:15:00+00:00","value":158.07},{"at":"2026-10-07T09:30:00+00:00","value":155.18},{"at":"2026-10-07T09:45:00+00:00","value":150.09},{"at":"2026-10-07T10:00:00+00:00","value":140.41},{"at":"2026-10-07T10:15:00+00:00","value":126.97},{"at":"2026-10-07T10:30:00+00:00","value":125.69},{"at":"2026-10-07T10:45:00+00:00","value":125.25},{"at":"2026-10-07T11:00:00+00:00","value":122.91},{"at":"2026-10-07T11:15:00+00:00","value":124.07},{"at":"2026-10-07T11:30:00+00:00","value":124.43},{"at":"2026-10-07T11:45:00+00:00","value":124.15},{"at":"2026-10-07T12:00:00+00:00","value":126.95},{"at":"2026-10-07T12:15:00+00:00","value":129.44},{"at":"2026-10-07T12:30:00+00:00","value":141.09},{"at":"2026-10-07T12:45:00+00:00","value":149.36},{"at":"2026-10-07T13:00:00+00:00","value":143.9},{"at":"2026-10-07T13:15:00+00:00","value":153.15},{"at":"2026-10-07T13:30:00+00:00","value":159.69},{"at":"2026-10-07T13:45:00+00:00","value":177.09},{"at":"2026-10-07T14:00:00+00:00","value":157.52},{"at":"2026-10-07T14:15:00+00:00","value":173.4},{"at":"2026-10-07T14:30:00+00:00","value":189.15},{"at":"2026-10-07T14:45:00+00:00","value":206.21},{"at":"2026-10-07T15:00:00+00:00","value":196.03},{"at":"2026-10-07T15:15:00+00:00","value":224.33},{"at":"2026-10-07T15:30:00+00:00","value":244.05},{"at":"2026-10-07T15:45:00+00:00","value":254.78},{"at":"2026-10-07T16:00:00+00:00","value":240.45},{"at":"2026-10-07T16:15:00+00:00","value":252.44},{"at":"2026-10-07T16:30:00+00:00","value":255.33},{"at":"2026-10-07T16:45:00+00:00","value":254.23},{"at":"2026-10-07T17:00:00+00:00","value":254.74},{"at":"2026-10-07T17:15:00+00:00","value":241.39},{"at":"2026-10-07T17:30:00+00:00","value":235.25},{"at":"2026-10-07T17:45:00+00:00","value":226.72},{"at":"2026-10-07T18:00:00+00:00","value":224.19},{"at":"2026-10-07T18:15:00+00:00","value":212.07},{"at":"2026-10-07T18:30:00+00:00","value":203.64},{"at":"2026-10-07T18:45:00+00:00","value":182.93},{"at":"2026-10-07T19:00:00+00:00","value":193.71},{"at":"2026-10-07T19:15:00+00:00","value":173.11},{"at":"2026-10-07T19:30:00+00:00","value":169.74},{"at":"2026-10-07T19:45:00+00:00","value":168.06},{"at":"2026-10-07T20:00:00+00:00","value":179.91},{"at":"2026-10-07T20:15:00+00:00","value":178.89},{"at":"2026-10-07T20:30:00+00:00","value":175.63},{"at":"2026-10-07T20:45:00+00:00","value":162.04},{"at":"2026-10-07T21:00:00+00:00","value":158.39},{"at":"2026-10-07T21:15:00+00:00","value":151.61},{"at":"2026-10-07T21:30:00+00:00","value":148.09},{"at":"2026-10-07T21:45:00+00:00","value":137.09},{"at":"2026-10-07T22:00:00+00:00","value":178.0},{"at":"2026-10-07T22:15:00+00:00","value":151.47},{"at":"2026-10-07T22:30:00+00:00","value":142.27},{"at":"2026-10-07T22:45:00+00:00","value":137.9},{"at":"2026-10-07T23:00:00+00:00","value":141.0},{"at":"2026-10-07T23:15:00+00:00","value":136.64},{"at":"2026-10-07T23:30:00+00:00","value":133.34},{"at":"2026-10-07T23:45:00+00:00","value":130.43},{"at":"2026-10-08T00:00:00+00:00","value":128.57},{"at":"2026-10-08T00:15:00+00:00","value":128.06},{"at":"2026-10-08T00:30:00+00:00","value":129.15},{"at":"2026-10-08T00:45:00+00:00","value":130.1},{"at":"2026-10-08T01:00:00+00:00","value":130.53},{"at":"2026-10-08T01:15:00+00:00","value":129.15},{"at":"2026-10-08T01:30:00+00:00","value":128.3},{"at":"2026-10-08T01:45:00+00:00","value":129.96},{"at":"2026-10-08T02:00:00+00:00","value":130.3},{"at":"2026-10-08T02:15:00+00:00","value":130.12},{"at":"2026-10-08T02:30:00+00:00","value":129.87},{"at":"2026-10-08T02:45:00+00:00","value":130.7},{"at":"2026-10-08T03:00:00+00:00","value":130.11},{"at":"2026-10-08T03:15:00+00:00","value":131.29},{"at":"2026-10-08T03:30:00+00:00","value":129.11},{"at":"2026-10-08T03:45:00+00:00","value":133.49},{"at":"2026-10-08T04:00:00+00:00","value":131.76},{"at":"2026-10-08T04:15:00+00:00","value":143.76},{"at":"2026-10-08T04:30:00+00:00","value":157.05},{"at":"2026-10-08T04:45:00+00:00","value":160.37},{"at":"2026-10-08T05:00:00+00:00","value":178.46},{"at":"2026-10-08T05:15:00+00:00","value":173.65},{"at":"2026-10-08T05:30:00+00:00","value":176.93},{"at":"2026-10-08T05:45:00+00:00","value":180.83},{"at":"2026-10-08T06:00:00+00:00","value":204.4},{"at":"2026-10-08T06:15:00+00:00","value":199.52},{"at":"2026-10-08T06:30:00+00:00","value":191.29},{"at":"2026-10-08T06:45:00+00:00","value":178.11},{"at":"2026-10-08T07:00:00+00:00","value":190.18},{"at":"2026-10-08T07:15:00+00:00","value":177.59},{"at":"2026-10-08T07:30:00+00:00","value":163.09},{"at":"2026-10-08T07:45:00+00:00","value":155.67},{"at":"2026-10-08T08:00:00+00:00","value":161.03},{"at":"2026-10-08T08:15:00+00:00","value":148.64},{"at":"2026-10-08T08:30:00+00:00","value":138.84},{"at":"2026-10-08T08:45:00+00:00","value":132.09},{"at":"2026-10-08T09:00:00+00:00","value":137.43},{"at":"2026-10-08T09:15:00+00:00","value":134.16},{"at":"2026-10-08T09:30:00+00:00","value":127.65},{"at":"2026-10-08T09:45:00+00:00","value":125.49},{"at":"2026-10-08T10:00:00+00:00","value":120.0},{"at":"2026-10-08T10:15:00+00:00","value":114.33},{"at":"2026-10-08T10:30:00+00:00","value":112.29},{"at":"2026-10-08T10:45:00+00:00","value":109.44},{"at":"2026-10-08T11:00:00+00:00","value":115.12},{"at":"2026-10-08T11:15:00+00:00","value":108.55},{"at":"2026-10-08T11:30:00+00:00","value":103.58},{"at":"2026-10-08T11:45:00+00:00","value":96.84},{"at":"2026-10-08T12:00:00+00:00","value":103.27},{"at":"2026-10-08T12:15:00+00:00","value":97.8},{"at":"2026-10-08T12:30:00+00:00","value":98.9},{"at":"2026-10-08T12:45:00+00:00","value":100.84},{"at":"2026-10-08T13:00:00+00:00","value":95.59},{"at":"2026-10-08T13:15:00+00:00","value":100.28},{"at":"2026-10-08T13:30:00+00:00","value":114.65},{"at":"2026-10-08T13:45:00+00:00","value":113.48},{"at":"2026-10-08T14:00:00+00:00","value":104.45},{"at":"2026-10-08T14:15:00+00:00","value":110.68},{"at":"2026-10-08T14:30:00+00:00","value":121.78},{"at":"2026-10-08T14:45:00+00:00","value":125.05},{"at":"2026-10-08T15:00:00+00:00","value":113.62},{"at":"2026-10-08T15:15:00+00:00","value":135.8},{"at":"2026-10-08T15:30:00+00:00","value":153.05},{"at":"2026-10-08T15:45:00+00:00","value":171.1},{"at":"2026-10-08T16:00:00+00:00","value":152.87},{"at":"2026-10-08T16:15:00+00:00","value":159.26},{"at":"2026-10-08T16:30:00+00:00","value":163.31},{"at":"2026-10-08T16:45:00+00:00","value":169.68},{"at":"2026-10-08T17:00:00+00:00","value":171.39},{"at":"2026-10-08T17:15:00+00:00","value":174.97},{"at":"2026-10-08T17:30:00+00:00","value":173.59},{"at":"2026-10-08T17:45:00+00:00","value":174.83},{"at":"2026-10-08T18:00:00+00:00","value":162.51},{"at":"2026-10-08T18:15:00+00:00","value":159.23},{"at":"2026-10-08T18:30:00+00:00","value":162.56},{"at":"2026-10-08T18:45:00+00:00","value":155.87},{"at":"2026-10-08T19:00:00+00:00","value":152.46},{"at":"2026-10-08T19:15:00+00:00","value":156.59},{"at":"2026-10-08T19:30:00+00:00","value":148.24},{"at":"2026-10-08T19:45:00+00:00","value":123.78},{"at":"2026-10-08T20:00:00+00:00","value":135.34},{"at":"2026-10-08T20:15:00+00:00","value":136.61},{"at":"2026-10-08T20:30:00+00:00","value":130.51},{"at":"2026-10-08T20:45:00+00:00","value":123.34},{"at":"2026-10-08T21:00:00+00:00","value":127.2},{"at":"2026-10-08T21:15:00+00:00","value":116.76},{"at":"2026-10-08T21:30:00+00:00","value":107.11},{"at":"2026-10-08T21:45:00+00:00","value":100.96},{"at":"2026-10-08T22:00:00+00:00","value":107.03},{"at":"2026-10-08T22:15:00+00:00","value":103.02},{"at":"2026-10-08T22:30:00+00:00","value":99.97},{"at":"2026-10-08T22:45:00+00:00","value":96.16},{"at":"2026-10-08T23:00:00+00:00","value":90.31},{"at":"2026-10-08T23:15:00+00:00","value":87.97},{"at":"2026-10-08T23:30:00+00:00","value":90.31},{"at":"2026-10-08T23:45:00+00:00","value":88.57},{"at":"2026-10-09T00:00:00+00:00","value":86.87},{"at":"2026-10-09T00:15:00+00:00","value":81.31},{"at":"2026-10-09T00:30:00+00:00","value":85.08},{"at":"2026-10-09T00:45:00+00:00","value":91.15},{"at":"2026-10-09T01:00:00+00:00","value":86.44},{"at":"2026-10-09T01:15:00+00:00","value":83.01},{"at":"2026-10-09T01:30:00+00:00","value":82.85},{"at":"2026-10-09T01:45:00+00:00","value":83.17},{"at":"2026-10-09T02:00:00+00:00","value":82.77},{"at":"2026-10-09T02:15:00+00:00","value":83.16},{"at":"2026-10-09T02:30:00+00:00","value":86.29},{"at":"2026-10-09T02:45:00+00:00","value":87.9},{"at":"2026-10-09T03:00:00+00:00","value":89.52},{"at":"2026-10-09T03:15:00+00:00","value":93.6},{"at":"2026-10-09T03:30:00+00:00","value":92.86},{"at":"2026-10-09T03:45:00+00:00","value":104.19},{"at":"2026-10-09T04:00:00+00:00","value":109.02},{"at":"2026-10-09T04:15:00+00:00","value":114.62},{"at":"2026-10-09T04:30:00+00:00","value":117.14},{"at":"2026-10-09T04:45:00+00:00","value":125.9},{"at":"2026-10-09T05:00:00+00:00","value":137.99},{"at":"2026-10-09T05:15:00+00:00","value":143.55},{"at":"2026-10-09T05:30:00+00:00","value":145.63},{"at":"2026-10-09T05:45:00+00:00","value":140.73},{"at":"2026-10-09T06:00:00+00:00","value":166.56},{"at":"2026-10-09T06:15:00+00:00","value":154.25},{"at":"2026-10-09T06:30:00+00:00","value":145.69},{"at":"2026-10-09T06:45:00+00:00","value":125.72},{"at":"2026-10-09T07:00:00+00:00","value":134.45},{"at":"2026-10-09T07:15:00+00:00","value":123.26},{"at":"2026-10-09T07:30:00+00:00","value":112.57},{"at":"2026-10-09T07:45:00+00:00","value":67.29},{"at":"2026-10-09T08:00:00+00:00","value":117.33},{"at":"2026-10-09T08:15:00+00:00","value":90.41},{"at":"2026-10-09T08:30:00+00:00","value":60.08},{"at":"2026-10-09T08:45:00+00:00","value":55.0},{"at":"2026-10-09T09:00:00+00:00","value":46.06},{"at":"2026-10-09T09:15:00+00:00","value":26.36},{"at":"2026-10-09T09:30:00+00:00","value":14.49},{"at":"2026-10-09T09:45:00+00:00","value":0.11},{"at":"2026-10-09T10:00:00+00:00","value":13.33},{"at":"2026-10-09T10:15:00+00:00","value":0.2},{"at":"2026-10-09T10:30:00+00:00","value":0.08},{"at":"2026-10-09T10:45:00+00:00","value":1.5},{"at":"2026-10-09T11:00:00+00:00","value":8.94},{"at":"2026-10-09T11:15:00+00:00","value":9.28},{"at":"2026-10-09T11:30:00+00:00","value":4.69},{"at":"2026-10-09T11:45:00+00:00","value":1.09},{"at":"2026-10-09T12:00:00+00:00","value":0.08},{"at":"2026-10-09T12:15:00+00:00","value":1.1},{"at":"2026-10-09T12:30:00+00:00","value":13.3},{"at":"2026-10-09T12:45:00+00:00","value":27.83},{"at":"2026-10-09T13:00:00+00:00","value":29.61},{"at":"2026-10-09T13:15:00+00:00","value":32.4},{"at":"2026-10-09T13:30:00+00:00","value":49.62},{"at":"2026-10-09T13:45:00+00:00","value":50.0},{"at":"2026-10-09T14:00:00+00:00","value":51.0},{"at":"2026-10-09T14:15:00+00:00","value":60.21},{"at":"2026-10-09T14:30:00+00:00","value":64.87},{"at":"2026-10-09T14:45:00+00:00","value":71.63},{"at":"2026-10-09T15:00:00+00:00","value":78.0},{"at":"2026-10-09T15:15:00+00:00","value":85.0},{"at":"2026-10-09T15:30:00+00:00","value":87.77},{"at":"2026-10-09T15:45:00+00:00","value":89.05},{"at":"2026-10-09T16:00:00+00:00","value":97.0},{"at":"2026-10-09T16:15:00+00:00","value":100.0},{"at":"2026-10-09T16:30:00+00:00","value":113.17},{"at":"2026-10-09T16:45:00+00:00","value":114.4},{"at":"2026-10-09T17:00:00+00:00","value":120.99},{"at":"2026-10-09T17:15:00+00:00","value":114.93},{"at":"2026-10-09T17:30:00+00:00","value":111.41},{"at":"2026-10-09T17:45:00+00:00","value":107.26},{"at":"2026-10-09T18:00:00+00:00","value":102.01},{"at":"2026-10-09T18:15:00+00:00","value":94.01},{"at":"2026-10-09T18:30:00+00:00","value":90.31},{"at":"2026-10-09T18:45:00+00:00","value":95.0},{"at":"2026-10-09T19:00:00+00:00","value":96.9},{"at":"2026-10-09T19:15:00+00:00","value":93.08},{"at":"2026-10-09T19:30:00+00:00","value":76.67},{"at":"2026-10-09T19:45:00+00:00","value":64.95},{"at":"2026-10-09T20:00:00+00:00","value":81.92},{"at":"2026-10-09T20:15:00+00:00","value":72.03},{"at":"2026-10-09T20:30:00+00:00","value":74.43},{"at":"2026-10-09T20:45:00+00:00","value":64.11},{"at":"2026-10-09T21:00:00+00:00","value":56.85},{"at":"2026-10-09T21:15:00+00:00","value":48.17},{"at":"2026-10-09T21:30:00+00:00","value":45.44},{"at":"2026-10-09T21:45:00+00:00","value":40.03},{"at":"2026-10-09T22:00:00+00:00","value":10.25},{"at":"2026-10-09T22:15:00+00:00","value":18.74},{"at":"2026-10-09T22:30:00+00:00","value":21.35},{"at":"2026-10-09T22:45:00+00:00","value":16.74},{"at":"2026-10-09T23:00:00+00:00","value":14.88},{"at":"2026-10-09T23:15:00+00:00","value":12.48},{"at":"2026-10-09T23:30:00+00:00","value":16.96},{"at":"2026-10-09T23:45:00+00:00","value":17.96},{"at":"2026-10-10T00:00:00+00:00","value":14.4},{"at":"2026-10-10T00:15:00+00:00","value":13.76},{"at":"2026-10-10T00:30:00+00:00","value":15.29},{"at":"2026-10-10T00:45:00+00:00","value":18.54},{"at":"2026-10-10T01:00:00+00:00","value":15.95},{"at":"2026-10-10T01:15:00+00:00","value":15.69},{"at":"2026-10-10T01:30:00+00:00","value":15.71},{"at":"2026-10-10T01:45:00+00:00","value":16.69},{"at":"2026-10-10T02:00:00+00:00","value":17.64},{"at":"2026-10-10T02:15:00+00:00","value":18.38},{"at":"2026-10-10T02:30:00+00:00","value":18.38},{"at":"2026-10-10T02:45:00+00:00","value":17.63},{"at":"2026-10-10T03:00:00+00:00","value":14.65},{"at":"2026-10-10T03:15:00+00:00","value":14.34},{"at":"2026-10-10T03:30:00+00:00","value":14.44},{"at":"2026-10-10T03:45:00+00:00","value":17.96},{"at":"2026-10-10T04:00:00+00:00","value":18.25},{"at":"2026-10-10T04:15:00+00:00","value":24.69},{"at":"2026-10-10T04:30:00+00:00","value":25.81},{"at":"2026-10-10T04:45:00+00:00","value":26.68},{"at":"2026-10-10T05:00:00+00:00","value":43.47},{"at":"2026-10-10T05:15:00+00:00","value":45.0},{"at":"2026-10-10T05:30:00+00:00","value":45.0},{"at":"2026-10-10T05:45:00+00:00","value":42.8},{"at":"2026-10-10T06:00:00+00:00","value":54.79},{"at":"2026-10-10T06:15:00+00:00","value":59.0},{"at":"2026-10-10T06:30:00+00:00","value":57.59},{"at":"2026-10-10T06:45:00+00:00","value":52.86},{"at":"2026-10-10T07:00:00+00:00","value":54.8},{"at":"2026-10-10T07:15:00+00:00","value":46.33},{"at":"2026-10-10T07:30:00+00:00","value":45.0},{"at":"2026-10-10T07:45:00+00:00","value":36.08},{"at":"2026-10-10T08:00:00+00:00","value":34.81},{"at":"2026-10-10T08:15:00+00:00","value":32.9},{"at":"2026-10-10T08:30:00+00:00","value":21.17},{"at":"2026-10-10T08:45:00+00:00","value":11.47},{"at":"2026-10-10T09:00:00+00:00","value":16.23},{"at":"2026-10-10T09:15:00+00:00","value":7.26},{"at":"2026-10-10T09:30:00+00:00","value":0.51},{"at":"2026-10-10T09:45:00+00:00","value":0.0},{"at":"2026-10-10T10:00:00+00:00","value":2.0},{"at":"2026-10-10T10:15:00+00:00","value":0.24},{"at":"2026-10-10T10:30:00+00:00","value":0.01},{"at":"2026-10-10T10:45:00+00:00","value":0.0},{"at":"2026-10-10T11:00:00+00:00","value":0.0},{"at":"2026-10-10T11:15:00+00:00","value":0.0},{"at":"2026-10-10T11:30:00+00:00","value":0.0},{"at":"2026-10-10T11:45:00+00:00","value":0.0},{"at":"2026-10-10T12:00:00+00:00","value":0.0},{"at":"2026-10-10T12:15:00+00:00","value":0.0},{"at":"2026-10-10T12:30:00+00:00","value":0.0},{"at":"2026-10-10T12:45:00+00:00","value":0.0},{"at":"2026-10-10T13:00:00+00:00","value":-0.01},{"at":"2026-10-10T13:15:00+00:00","value":0.0},{"at":"2026-10-10T13:30:00+00:00","value":0.0},{"at":"2026-10-10T13:45:00+00:00","value":0.01},{"at":"2026-10-10T14:00:00+00:00","value":0.0},{"at":"2026-10-10T14:15:00+00:00","value":0.08},{"at":"2026-10-10T14:30:00+00:00","value":20.93},{"at":"2026-10-10T14:45:00+00:00","value":36.71},{"at":"2026-10-10T15:00:00+00:00","value":35.56},{"at":"2026-10-10T15:15:00+00:00","value":73.1},{"at":"2026-10-10T15:30:00+00:00","value":120.4},{"at":"2026-10-10T15:45:00+00:00","value":138.97},{"at":"2026-10-10T16:00:00+00:00","value":118.88},{"at":"2026-10-10T16:15:00+00:00","value":124.87},{"at":"2026-10-10T16:30:00+00:00","value":137.28},{"at":"2026-10-10T16:45:00+00:00","value":174.01},{"at":"2026-10-10T17:00:00+00:00","value":170.26},{"at":"2026-10-10T17:15:00+00:00","value":166.93},{"at":"2026-10-10T17:30:00+00:00","value":165.27},{"at":"2026-10-10T17:45:00+00:00","value":168.1},{"at":"2026-10-10T18:00:00+00:00","value":152.91},{"at":"2026-10-10T18:15:00+00:00","value":146.51},{"at":"2026-10-10T18:30:00+00:00","value":142.6},{"at":"2026-10-10T18:45:00+00:00","value":137.34},{"at":"2026-10-10T19:00:00+00:00","value":131.63},{"at":"2026-10-10T19:15:00+00:00","value":126.37},{"at":"2026-10-10T19:30:00+00:00","value":124.99},{"at":"2026-10-10T19:45:00+00:00","value":119.36},{"at":"2026-10-10T20:00:00+00:00","value":126.01},{"at":"2026-10-10T20:15:00+00:00","value":122.04},{"at":"2026-10-10T20:30:00+00:00","value":128.07},{"at":"2026-10-10T20:45:00+00:00","value":132.76},{"at":"2026-10-10T21:00:00+00:00","value":117.33},{"at":"2026-10-10T21:15:00+00:00","value":117.4},{"at":"2026-10-10T21:30:00+00:00","value":118.96},{"at":"2026-10-10T21:45:00+00:00","value":114.22},{"at":"2026-10-10T22:00:00+00:00","value":142.0},{"at":"2026-10-10T22:15:00+00:00","value":117.7},{"at":"2026-10-10T22:30:00+00:00","value":103.39},{"at":"2026-10-10T22:45:00+00:00","value":97.2},{"at":"2026-10-10T23:00:00+00:00","value":111.0},{"at":"2026-10-10T23:15:00+00:00","value":104.87},{"at":"2026-10-10T23:30:00+00:00","value":103.89},{"at":"2026-10-10T23:45:00+00:00","value":96.43},{"at":"2026-10-11T00:00:00+00:00","value":104.8},{"at":"2026-10-11T00:15:00+00:00","value":98.85},{"at":"2026-10-11T00:30:00+00:00","value":100.96},{"at":"2026-10-11T00:45:00+00:00","value":98.79},{"at":"2026-10-11T01:00:00+00:00","value":97.48},{"at":"2026-10-11T01:15:00+00:00","value":99.53},{"at":"2026-10-11T01:30:00+00:00","value":102.42},{"at":"2026-10-11T01:45:00+00:00","value":100.45},{"at":"2026-10-11T02:00:00+00:00","value":101.07},{"at":"2026-10-11T02:15:00+00:00","value":102.39},{"at":"2026-10-11T02:30:00+00:00","value":103.4},{"at":"2026-10-11T02:45:00+00:00","value":103.32},{"at":"2026-10-11T03:00:00+00:00","value":102.39},{"at":"2026-10-11T03:15:00+00:00","value":98.77},{"at":"2026-10-11T03:30:00+00:00","value":100.59},{"at":"2026-10-11T03:45:00+00:00","value":102.81},{"at":"2026-10-11T04:00:00+00:00","value":99.04},{"at":"2026-10-11T04:15:00+00:00","value":103.01},{"at":"2026-10-11T04:30:00+00:00","value":106.66},{"at":"2026-10-11T04:45:00+00:00","value":113.29},{"at":"2026-10-11T05:00:00+00:00","value":121.59},{"at":"2026-10-11T05:15:00+00:00","value":125.99},{"at":"2026-10-11T05:30:00+00:00","value":120.6},{"at":"2026-10-11T05:45:00+00:00","value":125.79},{"at":"2026-10-11T06:00:00+00:00","value":134.91},{"at":"2026-10-11T06:15:00+00:00","value":135.17},{"at":"2026-10-11T06:30:00+00:00","value":138.0},{"at":"2026-10-11T06:45:00+00:00","value":133.29},{"at":"2026-10-11T07:00:00+00:00","value":125.97},{"at":"2026-10-11T07:15:00+00:00","value":116.51},{"at":"2026-10-11T07:30:00+00:00","value":100.0},{"at":"2026-10-11T07:45:00+00:00","value":83.98},{"at":"2026-10-11T08:00:00+00:00","value":99.18},{"at":"2026-10-11T08:15:00+00:00","value":78.6},{"at":"2026-10-11T08:30:00+00:00","value":74.22},{"at":"2026-10-11T08:45:00+00:00","value":52.09},{"at":"2026-10-11T09:00:00+00:00","value":44.51},{"at":"2026-10-11T09:15:00+00:00","value":29.93},{"at":"2026-10-11T09:30:00+00:00","value":25.0},{"at":"2026-10-11T09:45:00+00:00","value":32.84},{"at":"2026-10-11T10:00:00+00:00","value":23.66},{"at":"2026-10-11T10:15:00+00:00","value":24.77},{"at":"2026-10-11T10:30:00+00:00","value":22.25},{"at":"2026-10-11T10:45:00+00:00","value":17.32},{"at":"2026-10-11T11:00:00+00:00","value":14.62},{"at":"2026-10-11T11:15:00+00:00","value":13.78},{"at":"2026-10-11T11:30:00+00:00","value":14.55},{"at":"2026-10-11T11:45:00+00:00","value":18.66},{"at":"2026-10-11T12:00:00+00:00","value":17.35},{"at":"2026-10-11T12:15:00+00:00","value":23.58},{"at":"2026-10-11T12:30:00+00:00","value":33.63},{"at":"2026-10-11T12:45:00+00:00","value":46.53},{"at":"2026-10-11T13:00:00+00:00","value":38.81},{"at":"2026-10-11T13:15:00+00:00","value":55.83},{"at":"2026-10-11T13:30:00+00:00","value":74.01},{"at":"2026-10-11T13:45:00+00:00","value":98.02},{"at":"2026-10-11T14:00:00+00:00","value":93.75},{"at":"2026-10-11T14:15:00+00:00","value":103.5},{"at":"2026-10-11T14:30:00+00:00","value":111.88},{"at":"2026-10-11T14:45:00+00:00","value":142.45},{"at":"2026-10-11T15:00:00+00:00","value":149.41},{"at":"2026-10-11T15:15:00+00:00","value":189.74},{"at":"2026-10-11T15:30:00+00:00","value":215.64},{"at":"2026-10-11T15:45:00+00:00","value":231.67},{"at":"2026-10-11T16:00:00+00:00","value":216.93},{"at":"2026-10-11T16:15:00+00:00","value":228.39},{"at":"2026-10-11T16:30:00+00:00","value":228.8},{"at":"2026-10-11T16:45:00+00:00","value":238.16},{"at":"2026-10-11T17:00:00+00:00","value":223.63},{"at":"2026-10-11T17:15:00+00:00","value":234.01},{"at":"2026-10-11T17:30:00+00:00","value":239.92},{"at":"2026-10-11T17:45:00+00:00","value":241.59},{"at":"2026-10-11T18:00:00+00:00","value":235.46},{"at":"2026-10-11T18:15:00+00:00","value":234.03},{"at":"2026-10-11T18:30:00+00:00","value":231.22},{"at":"2026-10-11T18:45:00+00:00","value":215.77},{"at":"2026-10-11T19:00:00+00:00","value":225.52},{"at":"2026-10-11T19:15:00+00:00","value":214.99},{"at":"2026-10-11T19:30:00+00:00","value":212.34},{"at":"2026-10-11T19:45:00+00:00","value":205.02},{"at":"2026-10-11T20:00:00+00:00","value":205.01},{"at":"2026-10-11T20:15:00+00:00","value":202.13},{"at":"2026-10-11T20:30:00+00:00","value":200.07},{"at":"2026-10-11T20:45:00+00:00","value":188.53},{"at":"2026-10-11T21:00:00+00:00","value":197.3},{"at":"2026-10-11T21:15:00+00:00","value":188.01},{"at":"2026-10-11T21:30:00+00:00","value":180.29},{"at":"2026-10-11T21:45:00+00:00","value":164.84},{"at":"2026-10-11T22:00:00+00:00","value":178.73},{"at":"2026-10-11T22:15:00+00:00","value":177.82},{"at":"2026-10-11T22:30:00+00:00","value":176.58},{"at":"2026-10-11T22:45:00+00:00","value":175.0},{"at":"2026-10-11T23:00:00+00:00","value":173.3},{"at":"2026-10-11T23:15:00+00:00","value":168.9},{"at":"2026-10-11T23:30:00+00:00","value":169.81},{"at":"2026-10-11T23:45:00+00:00","value":170.94},{"at":"2026-10-12T00:00:00+00:00","value":172.23},{"at":"2026-10-12T00:15:00+00:00","value":168.25},{"at":"2026-10-12T00:30:00+00:00","value":163.78},{"at":"2026-10-12T00:45:00+00:00","value":162.35},{"at":"2026-10-12T01:00:00+00:00","value":164.06},{"at":"2026-10-12T01:15:00+00:00","value":164.64},{"at":"2026-10-12T01:30:00+00:00","value":163.49},{"at":"2026-10-12T01:45:00+00:00","value":165.85},{"at":"2026-10-12T02:00:00+00:00","value":163.08},{"at":"2026-10-12T02:15:00+00:00","value":162.76},{"at":"2026-10-12T02:30:00+00:00","value":164.54},{"at":"2026-10-12T02:45:00+00:00","value":171.34},{"at":"2026-10-12T03:00:00+00:00","value":164.99},{"at":"2026-10-12T03:15:00+00:00","value":168.67},{"at":"2026-10-12T03:30:00+00:00","value":176.42},{"at":"2026-10-12T03:45:00+00:00","value":198.76},{"at":"2026-10-12T04:00:00+00:00","value":193.17},{"at":"2026-10-12T04:15:00+00:00","value":217.07},{"at":"2026-10-12T04:30:00+00:00","value":228.76},{"at":"2026-10-12T04:45:00+00:00","value":243.95},{"at":"2026-10-12T05:00:00+00:00","value":239.36},{"at":"2026-10-12T05:15:00+00:00","value":256.38},{"at":"2026-10-12T05:30:00+00:00","value":262.98},{"at":"2026-10-12T05:45:00+00:00","value":269.22},{"at":"2026-10-12T06:00:00+00:00","value":287.59},{"at":"2026-10-12T06:15:00+00:00","value":275.33},{"at":"2026-10-12T06:30:00+00:00","value":253.75},{"at":"2026-10-12T06:45:00+00:00","value":236.22},{"at":"2026-10-12T07:00:00+00:00","value":262.71},{"at":"2026-10-12T07:15:00+00:00","value":227.01},{"at":"2026-10-12T07:30:00+00:00","value":209.38},{"at":"2026-10-12T07:45:00+00:00","value":186.29},{"at":"2026-10-12T08:00:00+00:00","value":211.28},{"at":"2026-10-12T08:15:00+00:00","value":193.18},{"at":"2026-10-12T08:30:00+00:00","value":184.83},{"at":"2026-10-12T08:45:00+00:00","value":173.8},{"at":"2026-10-12T09:00:00+00:00","value":183.11},{"at":"2026-10-12T09:15:00+00:00","value":169.17},{"at":"2026-10-12T09:30:00+00:00","value":162.71},{"at":"2026-10-12T09:45:00+00:00","value":159.22},{"at":"2026-10-12T10:00:00+00:00","value":155.45},{"at":"2026-10-12T10:15:00+00:00","value":152.08},{"at":"2026-10-12T10:30:00+00:00","value":148.06},{"at":"2026-10-12T10:45:00+00:00","value":146.84},{"at":"2026-10-12T11:00:00+00:00","value":146.23},{"at":"2026-10-12T11:15:00+00:00","value":141.61},{"at":"2026-10-12T11:30:00+00:00","value":139.49},{"at":"2026-10-12T11:45:00+00:00","value":136.09},{"at":"2026-10-12T12:00:00+00:00","value":137.2},{"at":"2026-10-12T12:15:00+00:00","value":140.36},{"at":"2026-10-12T12:30:00+00:00","value":147.73},{"at":"2026-10-12T12:45:00+00:00","value":152.61},{"at":"2026-10-12T13:00:00+00:00","value":148.84},{"at":"2026-10-12T13:15:00+00:00","value":153.59},{"at":"2026-10-12T13:30:00+00:00","value":160.0},{"at":"2026-10-12T13:45:00+00:00","value":162.31},{"at":"2026-10-12T14:00:00+00:00","value":154.96},{"at":"2026-10-12T14:15:00+00:00","value":169.68},{"at":"2026-10-12T14:30:00+00:00","value":190.29},{"at":"2026-10-12T14:45:00+00:00","value":207.77},{"at":"2026-10-12T15:00:00+00:00","value":188.44},{"at":"2026-10-12T15:15:00+00:00","value":231.0},{"at":"2026-10-12T15:30:00+00:00","value":259.02},{"at":"2026-10-12T15:45:00+00:00","value":272.84},{"at":"2026-10-12T16:00:00+00:00","value":257.05},{"at":"2026-10-12T16:15:00+00:00","value":260.37},{"at":"2026-10-12T16:30:00+00:00","value":277.14},{"at":"2026-10-12T16:45:00+00:00","value":291.47},{"at":"2026-10-12T17:00:00+00:00","value":283.89},{"at":"2026-10-12T17:15:00+00:00","value":281.84},{"at":"2026-10-12T17:30:00+00:00","value":280.1},{"at":"2026-10-12T17:45:00+00:00","value":272.31},{"at":"2026-10-12T18:00:00+00:00","value":273.01},{"at":"2026-10-12T18:15:00+00:00","value":257.06},{"at":"2026-10-12T18:30:00+00:00","value":246.56},{"at":"2026-10-12T18:45:00+00:00","value":224.85},{"at":"2026-10-12T19:00:00+00:00","value":241.82},{"at":"2026-10-12T19:15:00+00:00","value":216.35},{"at":"2026-10-12T19:30:00+00:00","value":195.04},{"at":"2026-10-12T19:45:00+00:00","value":187.34},{"at":"2026-10-12T20:00:00+00:00","value":197.68},{"at":"2026-10-12T20:15:00+00:00","value":188.72},{"at":"2026-10-12T20:30:00+00:00","value":190.29},{"at":"2026-10-12T20:45:00+00:00","value":183.31},{"at":"2026-10-12T21:00:00+00:00","value":182.37},{"at":"2026-10-12T21:15:00+00:00","value":178.8},{"at":"2026-10-12T21:30:00+00:00","value":178.26},{"at":"2026-10-12T21:45:00+00:00","value":173.43}]},"licence":{"fr":"CC BY 4.0 (creativecommons.org/licenses/by/4.0) from Bundesnetzagentur | SMARD.de","de":"CC BY 4.0 (creativecommons.org/licenses/by/4.0) from Bundesnetzagentur | SMARD.de"}}
</script>
  <script>
    let snapshot = JSON.parse(document.getElementById('snapshot-data').textContent);
    let powerHistory = JSON.parse(document.getElementById('power-history-data').textContent);
    let powerPrices = JSON.parse(document.getElementById('power-price-data').textContent);
    let powerSpan = 7;
    let powerPriceSpan = 2;
    let powerMeasure = 'load';
    let metrics = Array.isArray(snapshot.metrics) ? snapshot.metrics : [];
    let byId = Object.fromEntries(metrics.map(item => [item.id, item]));
    const sectors = {oil: 'Pétrole · cotations séparées des mesures physiques', gas: 'Gaz · France, Europe, GNL et États-Unis',
      agri: 'Agriculture · bilans USDA et état des cultures', metals: 'Métaux · offre, demande et stocks'};
    let selectedSector = 'oil';

    function number(value, digits = 1) {
      return new Intl.NumberFormat('fr-FR', {maximumFractionDigits: digits, minimumFractionDigits: digits}).format(value);
    }
    function period(value) {
      if (!value) return 'date inconnue';
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return new Intl.DateTimeFormat('fr-FR', {day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC'}).format(new Date(value + 'T12:00:00Z'));
      }
      if (/^\d{4}-\d{2}$/.test(value)) {
        return new Intl.DateTimeFormat('fr-FR', {month: 'long', year: 'numeric', timeZone: 'UTC'}).format(new Date(value + '-01T12:00:00Z'));
      }
      return value;
    }
    function age(item) {
      const sourceDate = item.as_of.length === 4 ? item.as_of + '-01-01' : item.as_of.length === 7 ? item.as_of + '-01' : item.as_of;
      return (Date.now() - Date.parse(sourceDate + 'T12:00:00Z')) / 86400000;
    }
    function stale(item) {
      const limit = item.id === 'oil_norway_liquids' ? 80 : item.id.startsWith('price_') ? 8 :
        item.source?.startsWith('GIE') ? 4 : ({oil: 13, gas: 13, agri: 49, metals: 800}[item.sector] || 14);
      return age(item) > limit;
    }
    function safeLink(url) {
      try {
        const parsed = new URL(url);
        const hosts = ['www.eia.gov', 'ir.eia.gov', 'www.usda.gov', 'pubs.usgs.gov',
          'agsi.gie.eu', 'alsi.gie.eu', 'fred.stlouisfed.org', 'www.sodir.no', 'www.eex.com',
          'www.ice.com', 'www.tradingview.com', 'transparency.entsog.eu'];
        return parsed.protocol === 'https:' && hosts.includes(parsed.hostname) ? parsed.href : null;
      } catch { return null; }
    }
    function line(text, tag = 'div', className = '') {
      const element = document.createElement(tag);
      element.className = className;
      element.textContent = text;
      return element;
    }
    function changeText(item) {
      if (item.change === null || item.change === undefined) return item.comparison;
      const symbol = item.change > 0 ? '+' : item.change < 0 ? '−' : '';
      if (item.id === 'gas_eu' || item.id === 'gas_fr') return symbol + number(Math.abs(item.change), 2) + ' point(s) vs veille';
      return symbol + number(Math.abs(item.change), digits(item)) + ' ' + item.unit + ' ' + item.comparison;
    }
    function digits(item) {
      return item.unit === 'Bcf' || item.unit === 'M bu' ? 0 : item.unit.startsWith('M bbl') ? 3 : 2;
    }

    function switchPage(page) {
      for (const button of document.querySelectorAll('.nav button')) {
        button.setAttribute('aria-selected', String(button.dataset.page === page));
      }
      for (const section of document.querySelectorAll('.page')) section.hidden = section.id !== page;
      if (page === 'power') {refreshPowerDirect();refreshRteDirect();}
    }
    document.querySelectorAll('.nav button, [data-open]').forEach(button => {
      button.addEventListener('click', event => {
        event.preventDefault();
        switchPage(button.dataset.page || button.dataset.open);
      });
    });

    function renderMetric(item) {
      const card = line('', 'article', 'card metric');
      card.append(line(item.label, 'small'));
      card.append(line(number(item.value, digits(item)) + ' ' + item.unit, 'div', 'number'));
      card.append(line(changeText(item), 'div', 'change'));
      card.append(line((stale(item) ? 'ARCHIVE · ' : '') + 'Période : ' + period(item.as_of), 'div', 'meta'));
      if (['gas_fr','gas_eu'].includes(item.id)) {
        const track = line('', 'div', 'gauge');
        const fill = line('', 'i');
        fill.style.width = Math.max(0, Math.min(100, item.value)) + '%';
        track.append(fill);
        card.append(track);
      }
      if (item.detail) card.append(line(item.detail, 'div', 'detail'));
      const explanations = {
        oil_crude:'Stocks US en baisse : moins de barils disponibles, signal à confronter aux importations et aux raffineries.',
        oil_cushing:'Cushing est le point de livraison du WTI : une baisse locale peut compter davantage pour le WTI que pour le Brent.',
        oil_norway_liquids:'Production mensuelle de pétrole et liquides en mer du Nord : un repère d’offre, avec publication différée.',
        gas_fr:'Niveau de remplissage, à interpréter par rapport à la saison et à l’année précédente.',
        gas_fr_net:'Positif = soutirage du stockage ; négatif = injection. Un débit quotidien, pas un prix.',
        lng_fr_sendout:'Quantité de gaz issue des terminaux et envoyée au réseau français chaque jour.',
        ag_corn_stocks:'Stocks de fin de campagne prévus : moins de stocks rendent le marché plus sensible aux aléas de récolte.',
        ag_world_wheat:'Stocks mondiaux prévus ; vérifier aussi la part exportable avant de conclure sur MATIF.',
        metal_copper:'Tonnage minier annuel : aucune conclusion de court terme sans inventaires et demande.',
        metal_aluminum:'Aluminium primaire mondial. Son coût marginal dépend notamment de l’électricité ; ce total annuel ne renseigne pas sur les stocks du jour.',
        ag_corn_condition:'Bon + excellent selon les enquêtes USDA ; comparer à la même semaine de l’année passée, pas au niveau des stocks.',
        ag_soy_condition:'La condition de culture reflète déjà une partie des effets météo sur le rendement potentiel.',
        ag_corn_harvest:'Avancement de récolte : l’écart à la moyenne cinq ans renseigne sur le rythme d’arrivée du grain.',
        ag_soy_harvest:'Comparer à la moyenne cinq ans ; une récolte rapide augmente temporairement les disponibilités.'
      };
      if (explanations[item.id]) card.append(line(explanations[item.id], 'div', 'detail'));
      const href = safeLink(item.url);
      if (href) {
        const source = line(item.source + ' ↗', 'a', 'detail');
        source.href = href;
        source.target = '_blank';
        source.rel = 'noopener noreferrer';
        card.append(source);
      }
      return card;
    }

    function renderStatus() {
      const container = document.getElementById('source-status');
      const labels = {brent: 'Brent spot', wti: 'WTI spot', henry: 'Henry Hub spot',
        norway: 'Production Norvège',
        oil: 'EIA stocks pétrole', oil_flows: 'EIA flux pétrole', gas: 'EIA gaz US', wasde: 'USDA WASDE',
        news: 'Analyses EIA', gie: 'GIE stockage UE', gie_fr: 'GIE stockage France',
        alsi: 'GIE GNL UE', alsi_fr: 'GIE GNL France', metals: 'USGS métaux'};
      for (const [id, label] of Object.entries(labels)) {
        const source = snapshot.sources?.[id] || {};
        const sample = {brent:'price_brent',wti:'price_wti',henry:'price_henry',
          norway:'oil_norway_liquids',
          oil:'oil_crude',oil_flows:'oil_imports',gas:'gas_us',wasde:'ag_corn_stocks',
          gie:'gas_eu',gie_fr:'gas_fr',alsi:'lng_eu_inventory',
          alsi_fr:'lng_fr_inventory',metals:'metal_copper'}[id];
        const hasValue = Boolean(sample && byId[sample]) || (id === 'news' && (snapshot.stories || []).length > 0);
        const status = source.status === 'ok' ? period(source.as_of || '') +
          (byId[sample] && stale(byId[sample]) ? ' · archive' : '') :
          source.status === 'needs_key' ? 'clé requise' :
          source.status === 'structural' ? 'repère annuel' :
          source.status === 'manual' ? 'repère mensuel daté' :
          hasValue ? 'dernière valeur conservée' : 'source indisponible';
        container.append(line(label + ' · ' + status, 'span',
          'badge ' + (source.status === 'ok' && (!byId[sample] || !stale(byId[sample])) ? 'good' : 'warn')));
      }
      document.getElementById('updated').textContent = snapshot.generated_at ?
        'Collecte : ' + new Intl.DateTimeFormat('fr-FR', {dateStyle:'medium', timeStyle:'short', timeZone:'Europe/Paris'}).format(new Date(snapshot.generated_at)) + ' · Paris' :
        'Instantané local';
    }

    function renderMini() {
      const grid = document.getElementById('mini-grid');
      for (const id of ['price_brent', 'oil_crude', 'gas_fr', 'lng_fr_sendout', 'gas_us', 'ag_world_corn']) {
        const item = byId[id];
        if (!item) continue;
        const card = line('', 'div', 'mini');
        card.append(line(item.label, 'small'));
        card.append(line(number(item.value, digits(item)) + ' ' + item.unit, 'strong'));
        card.append(line(period(item.as_of) + ' · ' + changeText(item) + (stale(item) ? ' · archive' : ''), 'span'));
      grid.append(card);
      }
      if (!grid.children.length) grid.append(line('La collecte des chiffres physiques est en attente.', 'p', 'empty'));
    }

    function renderMarketSummary() {
      const box = document.getElementById('market-snapshot');
      for (const id of ['gas_fr', 'lng_fr_sendout', 'oil_norway_liquids', 'oil_crude', 'gas_us']) {
        const item = byId[id];
        if (!item) continue;
        const row = line('', 'div', 'row');
        const left = line(item.label, 'span');
        const right = line(number(item.value, digits(item)) + ' ' + item.unit, 'b');
        row.append(left, right);
        box.append(row);
      }
      if (box.children.length === 1) box.append(line('Collecte des chiffres en attente.', 'small'));
    }

    const marketLinks = [
      {label: 'TTF · indice spot EEX', note: 'Prix en séance sur la source · pas le future M+1',
       url: 'https://www.eex.com/en/market-data/market-data-hub/natural-gas/indices'},
      {label: 'TTF · future ICE', note: 'Échéance et délai de cotation sur TradingView',
       url: 'https://www.tradingview.com/symbols/ICEEUR-TFN1%21/'},
      {label: 'PEG France · indice spot EEX', note: 'Référence PEG · prix en séance sur la source',
       url: 'https://www.eex.com/en/market-data/market-data-hub/natural-gas/indices'},
      {label: 'JKM · future ICE', note: 'Contrat financier indexé sur le JKM Platts · $/MMBtu',
       url: 'https://www.ice.com/products/6753280/jkm-lng-platts-future'},
    ];
    const charts = [
      {name:'Brent', symbol:'OANDA:BCOUSD', url:'https://www.tradingview.com/symbols/BCOUSD/?exchange=OANDA'},
      {name:'WTI', symbol:'OANDA:WTICOUSD', url:'https://www.tradingview.com/symbols/WTICOUSD/?exchange=OANDA'},
      {name:'Gaz US', symbol:'OANDA:NATGASUSD', url:'https://www.tradingview.com/symbols/NATGASUSD/?exchange=OANDA'},
      {name:'Cuivre', symbol:'OANDA:XCUUSD', url:'https://www.tradingview.com/symbols/XCUUSD/?exchange=OANDA'},
      {name:'Or', symbol:'OANDA:XAUUSD', url:'https://www.tradingview.com/symbols/XAUUSD/?exchange=OANDA'}
    ];
    function embed(container, scriptUrl, config) {
      container.replaceChildren();
      const frame = line('', 'div', 'tradingview-widget-container');
      frame.append(line('', 'div', 'tradingview-widget-container__widget'));
      const script = document.createElement('script');
      script.async = true;
      script.src = scriptUrl;
      script.textContent = JSON.stringify(config);
      frame.append(script);
      container.append(frame);
    }
    function renderLive() {
      const box = document.getElementById('live-strip');
      const quotes = [
        ['Brent · indicatif', 'OANDA:BCOUSD', 'https://www.tradingview.com/symbols/BCOUSD/?exchange=OANDA'],
        ['WTI · indicatif', 'OANDA:WTICOUSD', 'https://www.tradingview.com/symbols/WTICOUSD/?exchange=OANDA'],
        ['Gaz US · indicatif', 'OANDA:NATGASUSD', 'https://www.tradingview.com/symbols/NATGASUSD/?exchange=OANDA'],
        ['Cuivre · indicatif', 'OANDA:XCUUSD', 'https://www.tradingview.com/symbols/XCUUSD/?exchange=OANDA'],
        ['Or · indicatif', 'OANDA:XAUUSD', 'https://www.tradingview.com/symbols/XAUUSD/?exchange=OANDA']
      ];
      for (const [name, symbol, href] of quotes) {
        const tile = line('', 'article', 'live-tile');
        tile.append(line(name, 'small'));
        const widget = line('Chargement du cours…', 'div', 'widget');
        tile.append(widget);
        const link = line('Source, horaire et délai ↗', 'a');
        link.href = href; link.target = '_blank'; link.rel = 'noopener noreferrer';
        tile.append(link); box.append(tile);
        embed(widget, 'https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js',
          {symbol,width:'100%',locale:'fr',colorTheme:'dark',isTransparent:true});
      }
    }
    function renderChart(index = 0) {
      const choice = charts[index];
      document.getElementById('market-chart-title').textContent = choice.name + ' · indicatif OANDA';
      document.getElementById('market-chart-link').href = choice.url;
      document.querySelectorAll('#chart-picks button').forEach((button, i) => {
        button.classList.toggle('active', i === index);
        button.setAttribute('aria-pressed', String(i === index));
      });
      embed(document.getElementById('market-chart'),
        'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js',
        {autosize:true,symbol:choice.symbol,interval:'60',timezone:'Europe/Paris',
         theme:'dark',style:'1',locale:'fr',allow_symbol_change:true,
         hide_top_toolbar:false,support_host:'https://www.tradingview.com'});
    }
    function renderQuotes() {
      const picks = document.getElementById('chart-picks');
      charts.forEach((choice, index) => {
        const button = line(choice.name, 'button');
        button.type = 'button';
        button.addEventListener('click', () => renderChart(index));
        picks.append(button);
      });
      renderChart();
      embed(document.getElementById('market-quotes'),
        'https://s3.tradingview.com/external-embedding/embed-widget-market-quotes.js',
        {width:'100%',height:'100%',symbolsGroups:[
          {name:'Énergie · indicatif OANDA',symbols:[
            {name:'OANDA:BCOUSD',displayName:'Brent · indicatif'},
            {name:'OANDA:WTICOUSD',displayName:'WTI · indicatif'},
            {name:'OANDA:NATGASUSD',displayName:'Gaz US · indicatif'}]},
          {name:'Métaux · indicatif OANDA',symbols:[
            {name:'OANDA:XCUUSD',displayName:'Cuivre · USD/lb'},
            {name:'OANDA:XAUUSD',displayName:'Or · USD/oz'}]}],
         showSymbolLogo:false, isTransparent:true,colorTheme:'dark',locale:'fr'});
      const gas = document.getElementById('gas-prices');
      for (const [title,detail,href] of [
        ['TTF','Spot EEX et future M+1 ICE · €/MWh','https://www.eex.com/en/market-data/market-data-hub/natural-gas/indices'],
        ['PEG France','Indice spot EEX · €/MWh','https://www.eex.com/en/market-data/market-data-hub/natural-gas/indices'],
        ['JKM','Future ICE indexé sur le JKM Platts · $/MMBtu','https://www.ice.com/products/6753280/jkm-lng-platts-future']]) {
        const card = line('', 'article', 'price-link');
        card.append(line(title, 'strong'), line(detail, 'small'));
        const link = line('Consulter le cours et son horaire ↗', 'a');
        link.href = href; link.target = '_blank'; link.rel = 'noopener noreferrer';
        card.append(link, line('Cotation non redistribuée sur ce tableau.', 'p'));
        gas.append(card);
      }
    }
    function renderWatch() {
      const box = document.getElementById('watch-list');
      box.append(line('COTATIONS EN SÉANCE · INDICATIVES', 'div', 'watch-group'));
      for (const [name,symbol,detail] of [
        ['Brent · OANDA','OANDA:BCOUSD','USD/baril · CFD indicatif, distinct du future ICE'],
        ['WTI · OANDA','OANDA:WTICOUSD','USD/baril · CFD indicatif'],
        ['Gaz US · OANDA','OANDA:NATGASUSD','USD/MMBtu · indicatif, distinct du spot Henry Hub']]) {
        const row = line('', 'div', 'quote-row');
        row.append(line(name, 'strong'));
        const widget = line('', 'div', 'quote-value');
        widget.style.width = '220px'; widget.style.height = '70px';
        row.append(widget,line(detail + ' · cours et horaire chez TradingView', 'small', 'quote-note'));
        box.append(row);
        embed(widget,'https://s3.tradingview.com/external-embedding/embed-widget-symbol-info.js',
          {symbol,width:'100%',locale:'fr',colorTheme:'dark',isTransparent:true});
      }
      box.append(line('REPÈRES SPOT OFFICIELS · CLÔTURES DATÉES', 'div', 'watch-group'));
      for (const id of ['price_brent', 'price_wti', 'price_henry']) {
        const item = byId[id];
        const row = line('', 'div', 'quote-row');
        const label = {price_brent:'Brent Europe · spot',price_wti:'WTI Cushing · spot',
          price_henry:'Henry Hub · spot'}[id];
        row.append(line(label, 'strong'));
        const price = line(item ? number(item.value, 2) + ' ' + item.unit + ' ↗' :
          'En attente', item ? 'a' : 'span', 'quote-value');
        if (item) {
          price.href = safeLink(item.url);
          price.target = '_blank';
          price.rel = 'noopener noreferrer';
        }
        row.append(price);
        row.append(line(item ? 'EIA spot · ' + period(item.as_of) +
          (stale(item) ? ' · ARCHIVE' : '') : 'Collecte officielle en cours', 'small', 'quote-note'));
        box.append(row);
      }
      box.append(line('CONTRATS ET AUTRES MATIÈRES · ACCÈS DIRECT', 'div', 'watch-group'));
      const other = [
        ...marketLinks.slice(1, 2),
        {label:'Aluminium · LME',note:'Cours et unité sur la bourse',url:'https://www.lme.com/Metals/Non-ferrous/LME-Aluminium'},
        {label:'Cacao · ICE',note:'Future CC1! · échéance à vérifier',url:'https://www.tradingview.com/symbols/ICEUS-CC1%21/'},
        {label:'Café Arabica · ICE',note:'Future KC1! · échéance à vérifier',url:'https://www.tradingview.com/symbols/ICEUS-KC1%21/'}
      ];
      for (const item of other) {
        const row = line('', 'div', 'quote-row');
        row.append(line(item.label, 'strong'));
        const wrap = line('', 'span', 'quote-value');
        const link = line('Voir cours ↗', 'a');
        link.href = item.url;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        wrap.append(link);
        row.append(wrap, line(item.note, 'small', 'quote-note'));
        box.append(row);
      }
      box.append(line('JKM–TTF : mêmes échéances et même unité indispensables pour comparer un spread.', 'div', 'caption'));
    }

    function renderAgenda() {
      const box = document.getElementById('agenda');
      const upcoming = (snapshot.calendar || []).filter(event =>
        event.day_only ? Date.parse(event.at) + 86400000 > Date.now() :
          Date.parse(event.at) > Date.now()).slice(0, 4);
      for (const event of upcoming) {
        const row = line('', 'div', 'agenda-row');
        const when = line('', 'span', 'agenda-when');
        const moment = new Date(event.at);
        when.append(line(new Intl.DateTimeFormat('fr-FR', {day:'2-digit', month:'short',
          timeZone:'Europe/Paris'}).format(moment), 'span'));
        when.append(line(event.day_only ? 'heure à confirmer' :
          new Intl.DateTimeFormat('fr-FR', {hour:'2-digit', minute:'2-digit',
          timeZone:'Europe/Paris'}).format(moment), 'small'));
        const detail = line('', 'div');
        const link = line(event.title + ' ↗', 'a');
        link.href = safeLink(event.url) || 'https://www.eia.gov/';
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        detail.append(link, line(event.context, 'p'));
        row.append(when, detail);
        box.append(row);
      }
      if (!upcoming.length) box.append(line('Dates à vérifier sur les calendriers officiels avant de nouvelles prévisions.', 'p', 'empty'));
    }

    function renderReleases() {
      const box = document.getElementById('release-list');
      for (const [id, label] of [['oil_crude','EIA pétrole'], ['gas_fr','GIE stockage France'],
                                 ['gas_us','EIA gaz US'], ['ag_corn_stocks','USDA WASDE']]) {
        const item = byId[id];
        if (!item) continue;
        const row = line('', 'div', 'row');
        const link = line(label + ' ↗', 'a');
        link.href = safeLink(item.url);
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        row.append(link, line(period(item.as_of) + (stale(item) ? ' · archive' : ''), 'b'));
        box.append(row);
      }
      if (box.children.length === 1) box.append(line('En attente de publications vérifiées.', 'small'));
    }

    function renderTakeaways() {
      const box = document.getElementById('takeaway-list');
      box.replaceChildren();
      const selected = metrics.filter(item => item.sector === selectedSector && item.change !== null && item.change !== undefined);
      for (const item of selected.slice(0, 3)) {
        const note = line('', 'div', 'story');
        note.append(line(item.label + ' : ' + changeText(item) + '.', 'div'));
        note.append(line('Observation ' + item.source + ' · ' + period(item.as_of) + (stale(item) ? ' · archive' : ''), 'small'));
        box.append(note);
      }
      if (!box.children.length) box.append(line('Aucune variation vérifiée pour cette catégorie.', 'p'));
    }

    const signalRules = {
      oil: [
        {id:'oil_crude', label:'Brut US · stocks', market:'Brent / WTI', rising:'Stocks en hausse : offre disponible plus abondante, pression possible à la baisse.', falling:'Stocks en baisse : offre plus resserrée, pression possible à la hausse.'},
        {id:'oil_cushing', label:'Cushing · stocks WTI', market:'WTI', rising:'Cushing se remplit : facteur potentiellement baissier pour le WTI.', falling:'Cushing se vide : facteur potentiellement haussier pour le WTI.'},
        {id:'oil_imports', label:'Importations US', market:'Brent / WTI', rising:'Entrées plus élevées : peuvent alimenter les stocks et les raffineries.', falling:'Entrées plus faibles : peuvent resserrer le brut disponible.'}],
      gas: [
        {id:'gas_fr', label:'Stockage France', market:'PEG / TTF', rising:'Remplissage en hausse : coussin de sécurité en progression.', falling:'Remplissage en baisse : coussin de sécurité en recul.'},
        {id:'gas_eu', label:'Stockage Europe', market:'TTF', rising:'Stock européen en hausse : tension potentielle moindre.', falling:'Stock européen en baisse : tension potentielle accrue.'},
        {id:'lng_fr_sendout', label:'GNL · terminaux France', market:'PEG / TTF', rising:'Émission plus forte : davantage de gaz arrive au réseau français.', falling:'Émission plus faible : apport des terminaux plus limité.'}],
      agri: [
        {id:'ag_corn_condition',label:'Maïs US · état des cultures',market:'CBOT maïs',rising:'Part bon/excellent supérieure à N−1 : potentiel de rendement plus confortable.',falling:'Part bon/excellent inférieure à N−1 : récolte plus vulnérable ; surveiller météo et rendement final.'},
        {id:'ag_world_corn', label:'Stocks mondiaux de maïs', market:'Maïs', rising:'Révision des stocks à la hausse : pression potentielle à la baisse.', falling:'Révision des stocks à la baisse : pression potentielle à la hausse.'}],
      metals: [
        {id:'metal_aluminum',label:'Aluminium · offre mondiale annuelle',market:'Aluminium',rising:'Production 2025 supérieure à 2024 : offre structurelle plus abondante. Ce n’est pas un signal de séance.',falling:'Production annuelle plus faible : vérifier stocks LME et demande avant d’interpréter le prix.'}]
    };
    function renderSignals() {
      const box = document.getElementById('signals');
      box.replaceChildren();
      const rules = signalRules[selectedSector] || [];
      for (const rule of rules) {
        const item = byId[rule.id];
        if (!item) continue;
        const delta = item.change;
        const known = Number.isFinite(delta) && !stale(item);
        const cls = !known || !delta ? 'flat' : delta < 0 ? 'down' : '';
        const card = line('', 'article', 'card signal ' + cls);
        card.append(line(rule.label + ' · ' + period(item.as_of), 'small'));
        card.append(line(number(item.value, digits(item)) + ' ' + item.unit, 'strong'));
        card.append(line(known ? changeText(item) : 'Variation récente non vérifiée', 'small'));
        card.append(line(known && delta ? delta > 0 ? rule.rising : rule.falling :
          'Pas de signal directionnel récent. Vérifier la prochaine publication.', 'p'));
        card.append(line('Marché concerné : ' + rule.market + ' · ' +
          (selectedSector === 'metals' ? 'repère annuel, sans implication instantanée.' : 'scénario, pas une réaction de cours.'), 'small'));
        box.append(card);
      }
      if (!box.children.length) box.append(line('Pas encore de variation récente exploitable pour ce secteur. Les chiffres datés restent accessibles ci-dessous.', 'p', 'empty'));
    }

    function renderStories() {
      const box = document.getElementById('stories');
      const relevant = (snapshot.stories || []).filter(item =>
        /crude|oil|natural gas|\blng\b|diesel|refin|petroleum|gasoline|fuel|storage/i.test(item.title + ' ' + item.summary));
      for (const item of relevant.slice(0, 5)) {
        const href = safeLink(item.url);
        if (!href) continue;
        const story = line('', 'article', 'story');
        const title = line(item.title, 'a');
        title.href = href;
        title.target = '_blank';
        title.rel = 'noopener noreferrer';
        story.append(title);
        if (item.summary) story.append(line(item.summary, 'p'));
        story.append(line(item.source + ' · ' + period(item.date) +
          ((Date.now() - Date.parse(item.date + 'T12:00:00Z')) / 86400000 > 30 ? ' · ARCHIVE' : ''), 'small'));
        box.append(story);
      }
      if (!box.children.length) box.append(line('Aucun article EIA sur le pétrole ou le gaz dans le flux actuel.', 'p'));
    }

    function drawTrend(panelId, lineId, startId, endId, titleId, title, points) {
      const panel = document.getElementById(panelId);
      panel.hidden = !Array.isArray(points) || points.length < 2;
      if (panel.hidden) return;
      const nums = points.map(point => point.value);
      const span = Math.max(0.1, Math.max(...nums) - Math.min(...nums));
      const low = Math.min(...nums) - span * .15;
      const high = Math.max(...nums) + span * .15;
      const coords = nums.map((value, index) => {
        const x = 4 + (index * 392 / (nums.length - 1));
        const y = 100 - ((value - low) / (high - low) * 90);
        return x.toFixed(1) + ',' + y.toFixed(1);
      });
      document.getElementById(lineId).setAttribute('points', coords.join(' '));
      document.getElementById(startId).textContent = period(points[0].date) + ' · ' + number(nums[0], 1);
      document.getElementById(endId).textContent = period(points[points.length - 1].date) + ' · ' + number(nums[nums.length - 1], 1);
      document.getElementById(titleId).textContent = title;
    }
    function renderTrend() {
      const history = snapshot.history || {};
      const pairs = selectedSector === 'oil' ?
        [['Stocks brut US · millions de barils · 26 semaines',history.oil_crude],null] :
        selectedSector === 'gas' ? [
          ['Stockage France · % · données quotidiennes GIE',history.gas_fr],
          ['GNL France · émission GWh/j · données GIE',history.lng_fr_sendout]] : [null,null];
      for (const [index, pair] of pairs.entries()) {
        const suffix = index ? '-two' : '';
        drawTrend('trend' + suffix, 'trend' + suffix + '-line',
          'trend' + suffix + '-start', 'trend' + suffix + '-end',
          'trend' + suffix + '-title', pair?.[0] || '', pair?.[1] || []);
      }
      renderComparison(history);
    }

    function renderComparison(history) {
      const card = document.getElementById('comparison-chart');
      card.replaceChildren();
      let title, a, b, unit, note;
      if (selectedSector === 'oil' && !history.oil_prices) {
        card.hidden = false;
        card.append(line('Brent et WTI · un an · cotations indicatives', 'h3'));
        card.append(line('Historique spot officiel temporairement indisponible. Ces deux courbes OANDA restent séparées et suivent le prix indicatif de leur fournisseur.', 'p', 'detail'));
        const duo = line('', 'div', 'chart-duo');
        for (const [name,symbol] of [['Brent','OANDA:BCOUSD'],['WTI','OANDA:WTICOUSD']]) {
          const panel = line('', 'div', 'widget');
          panel.style.height = '240px';
          duo.append(panel);
          embed(panel,'https://s3.tradingview.com/external-embedding/embed-widget-symbol-overview.js',
            {symbols:[[name,symbol+'|1D']],dateRanges:['12m|1D'],colorTheme:'dark',isTransparent:true,
             locale:'fr',autosize:true,width:'100%',height:'100%',chartOnly:false});
        }
        card.append(duo); return;
      }
      if (selectedSector === 'oil' && history.oil_prices) {
        title = 'Brent vs WTI · 12 mois · clôtures spot officielles';
        a = history.oil_prices.brent || []; b = history.oil_prices.wti || [];
        unit = '$/bbl';
        note = 'Séries EIA historiques via ' + (snapshot.sources?.oil_price_history?.provenance || 'FRED') + ', publiées avec retard. Ce graphique ne remplace pas la cotation en séance au-dessus.';
      } else if (selectedSector === 'gas' && Array.isArray(history.gas_fr)) {
        title = 'Stockage France · 90 derniers jours vs mêmes dates N−1';
        const all = history.gas_fr;
        a = all.slice(-90);
        const byDay = new Map(all.map(point => [point.date, point]));
        b = a.map(point => byDay.get(String(Number(point.date.slice(0, 4)) - 1) + point.date.slice(4)))
          .filter(Boolean);
        unit = '% plein';
        note = 'Comparer au même moment de l’année évite de confondre remplissage saisonnier et tension exceptionnelle.';
      } else { card.hidden = true; return; }
      if (a.length < 5 || b.length < 5) { card.hidden = true; return; }
      card.hidden = false;
      card.append(line(title, 'h3'));
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 640 175');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('class', 'chart-figure');
      svg.setAttribute('role', 'img'); svg.setAttribute('aria-label', title + ' en ' + unit);
      const allValues = [...a, ...b].map(point => point.value).filter(Number.isFinite);
      const low = Math.floor(Math.min(...allValues) / 5) * 5;
      const high = Math.ceil(Math.max(...allValues) / 5) * 5 + (Math.max(...allValues) === low ? 5 : 0);
      const first = Date.parse(a[0].date), last = Date.parse(a[a.length - 1].date);
      const element = (tag, attrs) => {
        const node = document.createElementNS('http://www.w3.org/2000/svg', tag);
        for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, String(value));
        svg.append(node); return node;
      };
      for (let i = 0; i <= 4; i++) {
        const y = 147 - i * 33;
        element('line', {x1:45,x2:633,y1:y,y2:y});
        element('text', {x:2,y:y+3}).textContent = number(low + (high-low)*i/4, 0);
      }
      const path = (points, secondary, shiftYear) => points.map(point => {
        const date = shiftYear ? String(Number(point.date.slice(0,4)) + 1) + point.date.slice(4) : point.date;
        const x = 45 + 588 * (Date.parse(date) - first) / Math.max(1, last-first);
        const y = 147 - 132 * (point.value - low) / (high-low);
        return x.toFixed(1) + ',' + y.toFixed(1);
      }).join(' ');
      element('polyline', {points:path(a),class:'primary'});
      element('polyline', {points:path(b,true,selectedSector === 'gas'),class:'secondary'});
      card.append(svg);
      const legend = line('', 'div', 'trend-key');
      for (const [label, cls] of [[selectedSector === 'gas' ? 'Cette année' : 'Brent', ''],
                                  [selectedSector === 'gas' ? 'Année précédente' : 'WTI', 'secondary']]) {
        const span = line(label, 'span'); const marker = line('', 'i', cls); span.prepend(marker); legend.append(span);
      }
      card.append(legend);
      card.append(line(period(a[0].date) + ' → ' + period(a[a.length-1].date) + ' · axe : ' + unit, 'small'));
      card.append(line(note, 'p', 'detail'));
    }

    function renderSector() {
      document.getElementById('sector-heading').textContent = sectors[selectedSector];
      const box = document.getElementById('metrics');
      box.replaceChildren();
      const preferred = selectedSector === 'oil' ? ['oil_crude','oil_cushing','oil_gasoline',
        'oil_refinery','oil_imports','oil_exports','oil_norway_liquids'] :
        selectedSector === 'gas' ? ['gas_fr','gas_fr_twh','gas_fr_net','lng_fr_sendout',
          'gas_eu','lng_fr_inventory','gas_us'] :
        selectedSector === 'agri' ? ['ag_corn_condition','ag_corn_harvest','ag_soy_condition',
          'ag_soy_harvest','ag_corn_stocks','ag_world_wheat','ag_soy_stocks'] :
        ['metal_copper','metal_aluminum'];
      const order = new Map(preferred.map((id, index) => [id, index]));
      const sorted = metrics.filter(metric => metric.sector === selectedSector)
        .sort((a, b) => (order.get(a.id) ?? 999) - (order.get(b.id) ?? 999));
      for (const item of sorted.filter(item => preferred.includes(item.id))) box.append(renderMetric(item));
      const others = sorted.filter(item => !preferred.includes(item.id));
      if (others.length) {
        const details = line('', 'details', 'card side-pad');
        details.style.gridColumn = '1 / -1';
        details.append(line('Autres mesures datées (' + others.length + ')', 'summary'));
        const extra = line('', 'div', 'metrics');
        for (const item of others) extra.append(renderMetric(item));
        details.append(extra); box.append(details);
      }
      if (!box.children.length) box.append(line('Aucune valeur vérifiée disponible pour ce secteur.', 'p', 'empty'));
      document.querySelectorAll('.filters button').forEach(button => button.classList.toggle('active', button.dataset.sector === selectedSector));
      renderTakeaways();
      renderSignals();
      renderTrend();
      const context = document.getElementById('sector-context');
      const notes = {
        oil: 'Stocks US : variation hebdomadaire, pertinente surtout pour le WTI. Production norvégienne : repère européen mensuel, pétrole et liquides confondus. Le Brent en séance figure dans Marchés ; le spot EIA ci-dessous est daté.',
        gas: 'Un remplissage quotidien positif en septembre est normal. Compare les stocks France à la même saison l’an dernier, puis les émissions GNL et le soutirage net. Le prix PEG/TTF peut réagir à d’autres nouvelles en même temps.',
        agri: 'USDA WASDE mesure l’offre et la demande prévues : moins de stocks finaux tend à soutenir les prix, toutes choses égales par ailleurs. Suivre la météo et les cultures avant le prochain rapport : FranceAgriMer Céré’Obs (France) et USDA Crop Progress (US).',
        metals: 'La production minière annuelle décrit l’offre structurelle, pas la tension du jour. Pour interpréter le cuivre ou l’aluminium, rapprocher inventaires LME, production et demande industrielle ; aucune variation de prix immédiate ne se déduit du seul tonnage.'
      };
      context.textContent = notes[selectedSector];
      const references = selectedSector === 'agri' ? [
        ['FranceAgriMer · Céré’Obs ↗','https://cereobs.franceagrimer.fr/'],
        ['USDA · Crop Progress ↗','https://www.nass.usda.gov/Publications/National_Crop_Progress/'],
        ['Météo-France · bulletins agricoles ↗','https://meteofrance.com/actualites-et-dossiers/actualites/climat'],
        ['NOAA · suivi sécheresse US ↗','https://www.drought.gov/']
      ] : selectedSector === 'metals' ? [
        ['LME · inventaires entrepôts ↗','https://www.lme.com/Market-data/Reports-and-data/Warehouse-and-stocks-reports'],
        ['USGS · fiches métaux ↗','https://www.usgs.gov/centers/national-minerals-information-center/mineral-commodity-summaries']
      ] : [];
      for (const [label, href] of references) {
        const link = line(label, 'a'); link.href = href;
        link.target = '_blank'; link.rel = 'noopener noreferrer';
        context.append(' · ',link);
      }
    }

    function parisTime(value) {
      const stamp = new Date(value);
      return Number.isNaN(stamp.getTime()) ? 'heure indisponible' :
        new Intl.DateTimeFormat('fr-FR', {day:'numeric',month:'short',hour:'2-digit',minute:'2-digit',
          timeZone:'Europe/Paris'}).format(stamp) + ' · Paris';
    }

    const powerMeasures = [
      ['load', 'Demande', row => row.load],
      ['residual', 'Résiduelle calculée', row => Number.isFinite(row.eolien) && Number.isFinite(row.solaire) ?
        row.load - row.eolien - row.solaire : null],
      ['wind_solar', 'Éolien + solaire', row => Number.isFinite(row.eolien) && Number.isFinite(row.solaire) ?
        row.eolien + row.solaire : null],
      ['gaz', 'Gaz électrique', row => row.gaz],
      ['ech_physiques', 'Échanges nets', row => row.ech_physiques]
    ];

    function renderPowerHistory() {
      const chart = document.getElementById('power-history-chart');
      const meta = document.getElementById('power-history-meta');
      const reading = document.getElementById('power-history-reading');
      const span = document.getElementById('power-span');
      const series = document.getElementById('power-series');
      chart.replaceChildren(); span.replaceChildren(); series.replaceChildren();
      for (const [days, label] of [[1,'24 h'],[7,'7 j'],[30,'30 j'],[365,'1 an']]) {
        const button = line(label, 'button'); button.type = 'button';
        button.setAttribute('aria-pressed', String(powerSpan === days));
        button.addEventListener('click', () => { powerSpan = days; renderPowerHistory(); });
        span.append(button);
      }
      for (const [key, label] of powerMeasures) {
        const button = line(label, 'button'); button.type = 'button';
        button.setAttribute('aria-pressed', String(powerMeasure === key));
        button.addEventListener('click', () => { powerMeasure = key; renderPowerHistory(); });
        series.append(button);
      }
      const historic = Array.isArray(powerHistory?.points) && powerHistory.points.length ?
        powerHistory.points : snapshot.history?.power_fr || [];
      const ordered = historic.filter(row => row && Number.isFinite(row.load) && Number.isFinite(Date.parse(row.at)))
        .sort((a,b) => Date.parse(a.at) - Date.parse(b.at));
      if (ordered.length < 3) {
        chart.append(line('Historique RTE en attente : la prochaine collecte construira les séries.', 'span', 'empty'));
        meta.textContent = ''; reading.textContent = ''; return;
      }
      const last = Date.parse(ordered[ordered.length - 1].at);
      const start = last - powerSpan * 86400000;
      const read = powerMeasures.find(([key]) => key === powerMeasure)[2];
      const selected = ordered.filter(row => Date.parse(row.at) >= start)
        .map(row => ({at:Date.parse(row.at), value:read(row)}))
        .filter(row => Number.isFinite(row.value));
      if (selected.length < 2) {
        chart.append(line('Pas assez de mesures pour cette série.', 'span', 'empty'));
        meta.textContent = 'Dernière observation : ' + parisTime(ordered[ordered.length-1].at);
        reading.textContent = ''; return;
      }
      const values = selected.map(row => row.value);
      let min = Math.min(...values), max = Math.max(...values);
      const padding = Math.max(500, (max - min) * .1);
      min -= padding; max += padding;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox','0 0 720 235'); svg.setAttribute('preserveAspectRatio','none');
      svg.setAttribute('role','img');
      svg.setAttribute('aria-label', powerMeasures.find(([key]) => key === powerMeasure)[1] +
        ' en MW sur ' + powerSpan + ' jour(s), selon les observations disponibles');
      const add = (tag, attrs) => {
        const node = document.createElementNS('http://www.w3.org/2000/svg',tag);
        for (const [key,value] of Object.entries(attrs)) node.setAttribute(key,String(value));
        svg.append(node); return node;
      };
      const x = stamp => 56 + 651 * (stamp - selected[0].at) /
        Math.max(1, selected[selected.length-1].at - selected[0].at);
      const y = value => 198 - 166 * (value-min) / (max-min);
      for (let i=0;i<=4;i++) {
        const level = min + (max-min)*i/4, ordinate = y(level);
        add('line',{x1:56,x2:707,y1:ordinate,y2:ordinate});
        add('text',{x:2,y:ordinate-4}).textContent = number(level,0);
      }
      if (min < 0 && max > 0) add('line',{x1:56,x2:707,y1:y(0),y2:y(0),class:'zero'});
      const stride = Math.max(1, Math.ceil(selected.length/700));
      const sampled = selected.filter((_,i) => i%stride===0 || i===selected.length-1);
      let segment = [], segments = [];
      for (let i=0;i<sampled.length;i++) {
        if (i && sampled[i].at-sampled[i-1].at > Math.max(2.5, stride*2.5)*3600000) {
          if (segment.length>1) segments.push(segment);
          segment = [];
        }
        segment.push(x(sampled[i].at).toFixed(1)+','+y(sampled[i].value).toFixed(1));
      }
      if (segment.length>1) segments.push(segment);
      for (const points of segments) add('polyline',{points:points.join(' ')});
      for (const [stamp, anchor] of [[selected[0].at,56],[selected[selected.length-1].at,602]])
        add('text',{x:anchor,y:222}).textContent = parisTime(stamp).replace(' · Paris','');
      chart.append(svg);
      const duration = Math.max(1, (last - Date.parse(ordered[0].at))/86400000);
      const expected = Math.max(1, Math.round((selected[selected.length-1].at-selected[0].at)/3600000)+1);
      const coverage = Math.min(100,Math.round(selected.length/expected*100));
      meta.textContent = 'RTE · observé provisoire · ' + selected.length + ' relevés · couverture ' +
        coverage + '% entre les premières et dernières mesures affichées · historique accumulé : ' +
        number(duration,1) + ' j / 365 j · dernier relevé : ' + parisTime(ordered[ordered.length-1].at);
      const recent = selected[selected.length-1];
      reading.textContent = 'Dernière mesure : ' + number(recent.value,0) + ' MW. ' +
        (powerMeasure === 'residual' ? 'Une résiduelle plus élevée peut augmenter le besoin de moyens pilotables ; aucun effet de prix instantané ne se déduit de ce seul chiffre.' :
         powerMeasure === 'ech_physiques' ? 'Solde négatif = exportations nettes ; positif = importations nettes. Ce flux ne donne pas le prix de marché.' :
         'Ce niveau physique est un repère observé, sans prévision automatique du prix.');
    }

    function renderMarketPowerPulse() {
      const fr=powerPrices?.series?.fr||[],now=Date.now();
      const active=[...fr].reverse().find(p=>Date.parse(p.at)<=now&&Date.parse(p.at)>=now-3600000);
      const formatter=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',
        month:'2-digit',day:'2-digit'});
      const day=at=>{const parts=Object.fromEntries(formatter.formatToParts(new Date(at))
        .filter(p=>['year','month','day'].includes(p.type)).map(p=>[p.type,p.value]));
        return parts.year+'-'+parts.month+'-'+parts.day;};
      const tomorrow=day(Date.parse(day(now)+'T12:00:00Z')+86400000);
      const points=fr.slice(-300).filter(p=>day(p.at)===tomorrow&&Number.isFinite(p.value));
      const step=fr.length>1 ? Math.max(15,Math.min(60,Math.round((Date.parse(fr[1].at)-Date.parse(fr[0].at))/60000))) : 60;
      const complete=points.length>=Math.floor(24*60/step*.8);
      document.getElementById('market-power-now').textContent=active?number(active.value,2)+' €':'—';
      document.getElementById('market-power-tomorrow').textContent=complete?
        number(points.reduce((sum,p)=>sum+p.value,0)/points.length,2)+' €':'—';
      const verified=powerPrices.live_checked_at||powerPrices.generated_at;
      document.getElementById('market-power-note').textContent=verified ?
        'Prix fixés la veille · source '+(powerPrices.live_checked_at?'vérifiée ':'archivée ')+
        parisTime(verified)+' · €/MWh' : 'Prix day-ahead en attente.';
    }

    function renderPowerPrices() {
      const cards = document.getElementById('power-price-grid');
      const control = document.getElementById('power-price-span');
      const chart = document.getElementById('power-price-chart');
      const meta = document.getElementById('power-price-meta');
      const reading = document.getElementById('power-price-reading');
      const context = document.getElementById('power-price-context');
      const licence = document.getElementById('power-price-license');
      const hero = document.getElementById('power-now-value');
      const heroTime = document.getElementById('power-now-delivery');
      const heroDelta = document.getElementById('power-now-delta');
      const status = document.getElementById('power-price-status');
      const hours = document.getElementById('power-price-hours');
      const takeaway = document.getElementById('power-market-takeaway');
      const evidence = document.getElementById('power-market-evidence');
      const drivers = document.getElementById('power-driver-list');
      const alerts = document.getElementById('power-alert-list');
      cards.replaceChildren(); control.replaceChildren(); chart.replaceChildren(); hours.replaceChildren(); drivers.replaceChildren(); alerts.replaceChildren();
      context.textContent = ''; hero.textContent = '—'; heroTime.textContent = 'Période de livraison en attente';
      heroDelta.textContent = 'Prix fixé lors de l’enchère de la veille.';
      const series = powerPrices?.series || {};
      const fr = Array.isArray(series.fr) ? series.fr.filter(point => Number.isFinite(point.value) &&
        Number.isFinite(Date.parse(point.at))) : [];
      const de = Array.isArray(series.de) ? series.de.filter(point => Number.isFinite(point.value) &&
        Number.isFinite(Date.parse(point.at))) : [];
      renderMarketPowerPulse();
      if (!fr.length) {
        chart.append(line('Prix day-ahead non publiés dans le cockpit : collecte ou licence de la source en attente.', 'span', 'empty'));
        meta.textContent = snapshot.sources?.power_price_fr?.status === 'error' ?
          'Source indisponible lors de la dernière collecte ; aucun prix inventé.' : 'Collecte des prix en attente.';
        status.textContent = 'Prix · indisponibles'; status.className='badge warn';
        takeaway.textContent='Aucune donnée de prix vérifiée disponible pour cette période.';
        evidence.textContent='Les mesures physiques restent consultables ci-dessous.';
        reading.textContent = ''; return;
      }
      const attribution = powerPrices.licence?.fr;
      licence.textContent = attribution && attribution === powerPrices.licence?.de ?
        'Licence et attribution déclarées pour France et DE-LU : ' + attribution + '. ' :
        'Licence et attribution déclarées par la source : ' + (attribution || 'à vérifier') + '. ';
      for (const [days,label] of [[2,'48 h'],[7,'7 j'],[30,'30 j'],[365,'1 an']]) {
        const button = line(label,'button'); button.type='button';
        button.setAttribute('aria-pressed',String(powerPriceSpan===days));
        button.addEventListener('click',()=>{powerPriceSpan=days;renderPowerPrices();});
        control.append(button);
      }
      const dayFormatter = new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',
        month:'2-digit',day:'2-digit'});
      const localDay = at => {const parts=Object.fromEntries(dayFormatter.formatToParts(new Date(at))
        .filter(p=>['year','month','day'].includes(p.type)).map(p=>[p.type,p.value]));
        return parts.year+'-'+parts.month+'-'+parts.day;};
      const today = localDay(Date.now());
      const tomorrow = localDay(Date.parse(today+'T12:00:00Z')+86400000);
      const latestFor = (items, now) => [...items].reverse().find(p => Date.parse(p.at)<=now &&
        Date.parse(p.at)>=now-3600000);
      const now = Date.now(), current = latestFor(fr,now);
      const counterpart = current && de.find(p => Date.parse(p.at)===Date.parse(current.at));
      const delivery = fr.filter(p => localDay(p.at)===tomorrow);
      const todayDelivery = fr.filter(p => localDay(p.at)===today);
      const interval = fr.length>1 ? Math.max(15,Math.min(60,Math.round((Date.parse(fr[1].at)-Date.parse(fr[0].at))/60000))) : 60;
      const complete = items => items.length >= Math.floor(24*60/interval*.8);
      const todayAverage = complete(todayDelivery) ?
        todayDelivery.reduce((sum,p)=>sum+p.value,0)/todayDelivery.length : null;
      const average = complete(delivery) ? delivery.reduce((sum,p)=>sum+p.value,0)/delivery.length : null;
      const peak = average!==null ? delivery.reduce((a,b)=>a.value>b.value?a:b) : null;
      const countNegative = delivery.filter(p=>p.value<0).length;
      const previous = current && fr.find(p=>Date.parse(p.at)===Date.parse(current.at)-86400000);
      const latestCheck = powerPrices.live_checked_at || powerPrices.generated_at || snapshot.generated_at;
      const age = Date.now()-Date.parse(latestCheck||0);
      const direct = Boolean(powerPrices.live_checked_at) && age<10*60000;
      status.textContent = direct ? 'Prix · API vérifiée '+parisTime(latestCheck) :
        'Prix · archive '+(latestCheck?parisTime(latestCheck):'sans date');
      status.className = 'badge '+(direct || age<4*3600000 ? 'good' : 'warn');
      hero.textContent=current ? number(current.value,2) : '—';
      heroTime.textContent=current ? 'Livraison '+parisTime(current.at) : 'Créneau actuel non publié';
      heroDelta.textContent=current&&previous ? 'Même créneau il y a 24 h : '+
        (current.value-previous.value>=0?'+':'')+number(current.value-previous.value,2)+
        ' €/MWh · comparaison des enchères' : 'Prix fixé lors de l’enchère de la veille · pas une cotation intraday.';
      for (const [title,value,detail] of [
        ['Demain · moyenne France',average!==null ? number(average,2)+' €/MWh' : '—',
          average!==null ? delivery.length+' créneaux publiés' : delivery.length ? 'Publication partielle' : 'Enchère en attente'],
        ['Demain vs aujourd’hui',average!==null&&todayAverage!==null ?
          (average>=todayAverage?'+':'')+number(average-todayAverage,2)+' €/MWh' : '—',
          average!==null&&todayAverage!==null ? 'Moyennes des jours de livraison' : 'Deux journées complètes requises'],
        ['France − DE-LU · maintenant',current&&counterpart ?
          number(current.value-counterpart.value,2)+' €/MWh' : '—',
          current&&counterpart ? 'Même livraison · positif = France plus chère' : 'Créneau comparable en attente'],
        ['Demain · point haut',peak ? number(peak.value,2)+' €/MWh' : '—',
          peak ? parisTime(peak.at)+' · '+countNegative*interval+' min négatives' : 'Publication à venir']
      ]) {
        const card=line('','article');
        card.append(line(title,'small'),line(value,'strong'),line(detail,'span'));
        cards.append(card);
      }
      if(average!==null){
        const hour=p=>Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Paris',hour:'2-digit',hourCycle:'h23'}).format(new Date(p.at)));
        for(const [from,to] of [[0,6],[6,12],[12,18],[18,24]]){
          const block=delivery.filter(p=>hour(p)>=from&&hour(p)<to);
          if(!block.length)continue;
          const mean=block.reduce((sum,p)=>sum+p.value,0)/block.length;
          const tile=line('','article');
          tile.append(line(String(from).padStart(2,'0')+'–'+String(to).padStart(2,'0')+' h · Paris','small'),
            line(number(mean,1)+' €/MWh','strong'),
            line('de '+number(Math.min(...block.map(p=>p.value)),0)+' à '+
              number(Math.max(...block.map(p=>p.value)),0)+' · '+block.length+' créneaux','span'));
          hours.append(tile);
        }
      }
      const end = Math.max(Date.parse(fr[fr.length-1].at),de.length ? Date.parse(de[de.length-1].at) : 0);
      const start = end-powerPriceSpan*86400000;
      const f = fr.filter(p=>Date.parse(p.at)>=start), d = de.filter(p=>Date.parse(p.at)>=start);
      const values=[...f,...d].map(p=>p.value);
      if (f.length<2) {chart.append(line('Historique insuffisant pour cette période.','span','empty'));return;}
      let low=Infinity,high=-Infinity;
      for (const value of values) {if(value<low)low=value;if(value>high)high=value;}
      const pad=Math.max(10,(high-low)*.12);low-=pad;high+=pad;
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('viewBox','0 0 720 225');svg.setAttribute('preserveAspectRatio','none');
      svg.setAttribute('role','img');svg.setAttribute('aria-label','Prix day-ahead France et DE-LU en euros par MWh');
      const add=(tag,attrs)=>{const el=document.createElementNS('http://www.w3.org/2000/svg',tag);
        for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));svg.append(el);return el;};
      const t0=Math.min(Date.parse(f[0].at),d.length?Date.parse(d[0].at):Infinity);
      const t1=Math.max(Date.parse(f[f.length-1].at),d.length?Date.parse(d[d.length-1].at):0);
      const x=at=>55+650*(Date.parse(at)-t0)/Math.max(1,t1-t0);
      const y=value=>192-160*(value-low)/(high-low);
      for(let i=0;i<=4;i++){
        const v=low+(high-low)*i/4, ordinate=y(v);
        add('line',{x1:55,x2:705,y1:ordinate,y2:ordinate});
        add('text',{x:2,y:ordinate-4}).textContent=number(v,0);
      }
      if(low<0&&high>0)add('line',{x1:55,x2:705,y1:y(0),y2:y(0),class:'zero'});
      for(const [items,css] of [[f,''],[d,'secondary']]){
        const stride=Math.max(1,Math.ceil(items.length/700));
        const sample=items.filter((_,i)=>i%stride===0||i===items.length-1);
        let group=[],groups=[];
        for(let i=0;i<sample.length;i++){
          if(i&&Date.parse(sample[i].at)-Date.parse(sample[i-1].at)>Math.max(2,stride*2.5)*3600000){
            if(group.length>1)groups.push(group);group=[];
          }
          group.push(x(sample[i].at).toFixed(1)+','+y(sample[i].value).toFixed(1));
        }
        if(group.length>1)groups.push(group);
        for(const points of groups)add('polyline',{points:points.join(' '),class:css});
      }
      add('text',{x:55,y:218}).textContent=parisTime(t0).replace(' · Paris','');
      add('text',{x:585,y:218}).textContent=parisTime(t1).replace(' · Paris','');
      chart.append(svg);
      meta.textContent='France (vert) · DE-LU (orange) · même échelle €/MWh · '+f.length+
        ' périodes France affichées · première donnée '+parisTime(fr[0].at)+
        ' · dernière livraison '+parisTime(fr[fr.length-1].at)+
        (snapshot.sources?.power_price_fr?.status==='error'?' · source en erreur : archive':'');
      const rte = snapshot.history?.power_fr || [];
      const observed = rte[rte.length-1];
      const direction=average!==null&&todayAverage!==null ? average-todayAverage : null;
      takeaway.textContent=direction!==null ?
        'Le marché valorise la livraison de demain à '+number(average,2)+' €/MWh en moyenne ('+
        (direction>=0?'+':'')+number(direction,2)+' €/MWh face à aujourd’hui). '+
        (peak?'Point haut '+number(peak.value,2)+' €/MWh à '+parisTime(peak.at)+'.':'') :
        'Le profil day-ahead de demain est encore en attente ou incomplet : la comparaison journalière est suspendue.';
      evidence.textContent=(current&&counterpart ? 'France − DE-LU sur le créneau livré : '+
        (current.value-counterpart.value>=0?'+':'')+number(current.value-counterpart.value,2)+' €/MWh. ' : '')+
        (average!==null ? countNegative*interval+' minute(s) à prix négatif demain. ' : '')+
        'Prix de l’enchère, pas des transactions intraday en cours.';
      const addAlert=(label,value,note,warm=false)=>{
        const tile=line('','article','power-alert'+(warm?' warm':''));
        tile.append(line(label,'small'),line(value,'strong'),line(note,'span'));alerts.append(tile);
      };
      addAlert('REPRICING J+1',direction!==null ?
        (direction>=0?'+':'')+number(direction,2)+' €/MWh' : 'En attente',
        direction!==null?'Moyenne demain vs aujourd’hui · enchère day-ahead':'Deux jours complets requis',
        direction!==null&&Math.abs(direction)>=20);
      addAlert('HEURE DE POINTE',peak ? number(peak.value,2)+' €/MWh' : 'En attente',
        peak ? 'Livraison '+parisTime(peak.at)+' · '+number(peak.value-average,1)+
          ' €/MWh au-dessus de la moyenne de demain':'Enchère de demain non complète',
        peak&&peak.value-average>=50);
      addAlert('ÉCART FRANCE / DE-LU',current&&counterpart ?
        (current.value-counterpart.value>=0?'+':'')+number(current.value-counterpart.value,2)+' €/MWh' : 'En attente',
        'Même créneau de livraison · positif = France plus chère',
        current&&counterpart&&Math.abs(current.value-counterpart.value)>=20);
      if(countNegative&&average!==null)addAlert('PRIX NÉGATIFS DEMAIN',countNegative*interval+' min',
        'Durée publiée à prix inférieur à 0 €/MWh',true);
      reading.textContent='Le prix day-ahead est fixé la veille pour chaque période de livraison. '+
        (observed ? 'Dernière mesure physique RTE : '+parisTime(observed.at)+'. ' : '')+
        'Pour expliquer un mouvement, examiner aussi la météo, les disponibilités des centrales, les interconnexions et le gaz ; ces facteurs ne sont pas tous mesurés ici.';
      const byTime = new Map(fr.map(p=>[Date.parse(p.at),p.value]));
      const historicRte = Array.isArray(powerHistory?.points) && powerHistory.points.length ?
        powerHistory.points : rte;
      const latestRte=historicRte[historicRte.length-1];
      const rteAge=latestRte ? now-Date.parse(latestRte.at) : Infinity;
      const previousRte=latestRte&&historicRte.reduce((best,p)=>{
        const gap=Math.abs(Date.parse(p.at)-(Date.parse(latestRte.at)-86400000));
        return gap<=3600000&&(!best||gap<best.gap)?{row:p,gap}:best;
      },null)?.row;
      const addDriver=(label,value,description)=>{
        const row=line('','div','power-driver');
        row.append(line(label,'small'),line(value,'strong'),line(description,'span'));
        drivers.append(row);
      };
      if(latestRte&&previousRte){
        const residual=p=>p.load-p.eolien-p.solaire;
        const delta=residual(latestRte)-residual(previousRte);
        const renewable=(latestRte.eolien+latestRte.solaire)-(previousRte.eolien+previousRte.solaire);
        const gas=latestRte.gaz-previousRte.gaz;
        const prefix=rteAge>6*3600000?'Archive RTE · ':'RTE · ';
        addDriver('Demande résiduelle vs même heure J−1',
          (delta>=0?'+':'')+number(delta,0)+' MW',prefix+parisTime(latestRte.at)+
          '. Hausse = besoin pilotable potentiellement accru ; le prix n’en découle pas mécaniquement.');
        addDriver('Éolien + solaire vs J−1',(renewable>=0?'+':'')+number(renewable,0)+' MW',
          'Production observée à la même heure. Une hausse peut détendre la résiduelle.');
        addDriver('Production au gaz vs J−1',(gas>=0?'+':'')+number(gas,0)+' MW',
          'Moyens gaz effectivement mobilisés ; ce chiffre ne mesure pas leur coût marginal.');
      } else addDriver('Observations physiques','—','Historique RTE insuffisant pour une comparaison à la même heure hier.');
      if(latestRte&&Number.isFinite(latestRte.ech_physiques))addDriver('Échanges physiques France',
        number(Math.abs(latestRte.ech_physiques),0)+' MW',
        latestRte.ech_physiques<0?'Exportations nettes observées.':
        latestRte.ech_physiques>0?'Importations nettes observées.':'Solde net proche de zéro.');
      const matched = historicRte.filter(p=>Date.parse(p.at)<=now&&Date.parse(p.at)>=now-7*86400000 &&
        Number.isFinite(p.load)&&Number.isFinite(p.eolien)&&Number.isFinite(p.solaire))
        .map(p=>({residual:p.load-p.eolien-p.solaire,price:byTime.get(Date.parse(p.at))}))
        .filter(p=>Number.isFinite(p.price));
      if(matched.length>=48){
        const ordered=matched.map(p=>p.residual).sort((a,b)=>a-b);
        const pivot=ordered[Math.floor(ordered.length/2)];
        const lower=matched.filter(p=>p.residual<pivot),upper=matched.filter(p=>p.residual>=pivot);
        const mean=items=>items.reduce((sum,p)=>sum+p.price,0)/items.length;
        context.textContent=lower.length&&upper.length ?
          'Repère historique · '+matched.length+' créneaux prix/RTE appariés sur 7 jours : '+
          'prix day-ahead moyen '+
          number(mean(upper),2)+' €/MWh quand la demande résiduelle observée est ≥ '+number(pivot,0)+
          ' MW (n='+upper.length+'), contre '+number(mean(lower),2)+' €/MWh en dessous (n='+lower.length+
          '). Lecture descriptive : prix fixé la veille, demande mesurée ensuite, autres facteurs non isolés.' :
          'Comparaison prix et demande résiduelle en cours de constitution.';
      } else {
        context.textContent='Comparaison prix et demande résiduelle : '+matched.length+
          ' créneaux exactement appariés sur 7 jours ; 48 requis pour afficher un repère.';
      }
    }

    let priceFetchBusy = false;
    let priceLastAttempt = 0;
    async function refreshPowerDirect(force = false) {
      if (priceFetchBusy || (!force && Date.now()-priceLastAttempt < 60000)) return;
      priceFetchBusy = true; priceLastAttempt = Date.now();
      const status = document.getElementById('power-price-status');
      status.textContent = 'Prix · vérification API…';
      try {
        const start = new Date(Date.now()-2*86400000).toISOString().slice(0,10);
        const end = new Date(Date.now()+2*86400000).toISOString().slice(0,10);
        const read = async zone => {
          const url = 'https://api.energy-charts.info/price?bzn='+encodeURIComponent(zone)+
            '&start='+start+'&end='+end;
          const response = await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(12000)});
          if(!response.ok)throw new Error('Prix '+zone+' HTTP '+response.status);
          const data = await response.json();
          if(typeof data.license_info!=='string'||!data.license_info.includes('CC BY 4.0')||
             !String(data.unit||'').toUpperCase().includes('EUR')||
             !Array.isArray(data.unix_seconds)||!Array.isArray(data.price)||
             data.unix_seconds.length!==data.price.length)throw new Error('Prix '+zone+' non validés');
          const points=data.unix_seconds.map((stamp,i)=>({stamp,value:data.price[i]}))
            .filter(p=>Number.isInteger(p.stamp)&&Number.isFinite(p.value)&&
              p.value>=-5000&&p.value<=5000&&p.stamp*1000<Date.now()+3*86400000)
            .map(p=>({at:new Date(p.stamp*1000).toISOString(),value:p.value}))
            .sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
          if(points.length<20||Date.parse(points[points.length-1].at)<Date.now()-86400000)
            throw new Error('Prix '+zone+' incomplets');
          return {points,licence:data.license_info};
        };
        const [fr,de]=await Promise.all([read('FR'),read('DE-LU')]);
        const merge=(old,incoming)=>{
          const cutoff=Date.now()-365*86400000,byTime=new Map();
          for(const row of [...(old||[]),...incoming]){
            const stamp=Date.parse(row.at);
            if(Number.isFinite(stamp)&&stamp>=cutoff&&stamp<Date.now()+3*86400000&&
               Number.isFinite(row.value))byTime.set(stamp,{at:new Date(stamp).toISOString(),value:row.value});
          }
          return [...byTime.values()].sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
        };
        powerPrices={...powerPrices,series:{fr:merge(powerPrices.series?.fr,fr.points),
          de:merge(powerPrices.series?.de,de.points)},licence:{fr:fr.licence,de:de.licence},
          live_checked_at:new Date().toISOString()};
        renderPowerPrices();
      } catch(error) {
        console.warn('API prix directe indisponible, archive conservée :',error);
        renderPowerPrices();
        status.textContent += ' · accès direct indisponible';
        status.className='badge warn';
      } finally {priceFetchBusy=false;}
    }

    let rteFetchBusy = false;
    let rteLastAttempt = 0;
    async function refreshRteDirect(force = false) {
      if (rteFetchBusy || (!force && Date.now()-rteLastAttempt < 10*60000)) return;
      rteFetchBusy=true;rteLastAttempt=Date.now();
      try {
        const url='https://odre.opendatasoft.com/api/explore/v2.1/catalog/datasets/'+
          'eco2mix-national-tr/records?limit=100&where=date_heure%20%3C%3D%20now%28%29'+
          '&order_by=date_heure%20desc';
        const response=await fetch(url,{cache:'no-store',signal:AbortSignal.timeout(12000)});
        if(!response.ok)throw new Error('RTE HTTP '+response.status);
        const data=await response.json();
        if(!Array.isArray(data.results))throw new Error('RTE : format invalide');
        const fields=['prevision_j','prevision_j1','nucleaire','gaz','eolien','solaire',
          'hydraulique','bioenergies','charbon','fioul','ech_physiques','pompage','taux_co2'];
        const points=data.results.map(row=>{
          const t=Date.parse(row.date_heure),load=Number(row.consommation);
          if(!Number.isFinite(t)||t>Date.now()||t<Date.now()-48*3600000||
             !Number.isFinite(load)||load<5000||load>120000)return null;
          const point={at:new Date(t).toISOString(),load:Math.round(load)};
          for(const key of fields){
            if(row[key]===null||row[key]===undefined||row[key]==='')continue;
            const value=Number(row[key]);
            if(Number.isFinite(value)&&value>=-35000&&value<=120000)point[key]=Math.round(value);
          }
          return point;
        }).filter(Boolean).sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
        const latest=points[points.length-1];
        if(points.length<12||Date.now()-Date.parse(latest.at)>3*3600000||
          !['eolien','solaire','gaz','ech_physiques'].every(k=>Number.isFinite(latest[k])))
          throw new Error('RTE : relevés incomplets ou trop anciens');
        const byTime=new Map((powerHistory.points||[]).map(p=>[Date.parse(p.at),p]));
        for(const row of points){
          const stamp=Date.parse(row.at),hour=Math.floor(stamp/3600000)*3600000;
          const older=[...byTime.keys()].find(t=>Math.floor(t/3600000)*3600000===hour);
          if(older!==undefined&&older<stamp)byTime.delete(older);
          if(older===undefined||older<=stamp)byTime.set(stamp,row);
        }
        const cutoff=Date.now()-365*86400000;
        const historic=[...byTime.values()].filter(p=>Date.parse(p.at)>=cutoff)
          .sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
        powerHistory={...powerHistory,points:historic,first_at:historic[0]?.at,
          last_at:historic[historic.length-1]?.at,generated_at:new Date().toISOString()};
        snapshot.history.power_fr=points.slice(-96);
        snapshot.sources.rte_power={status:'ok',as_of:latest.at,checked_at:new Date().toISOString(),
          url:'https://opendata.reseaux-energies.fr/explore/dataset/eco2mix-national-tr/',direct:true};
        const values={power_load:['Demande France',latest.load],power_gaz:['Gaz électrique',latest.gaz],
          power_eolien:['Éolien',latest.eolien],power_solaire:['Solaire',latest.solaire],
          power_exchange:['Solde des échanges physiques',latest.ech_physiques],
          power_residual:['Demande résiduelle indicative',latest.load-latest.eolien-latest.solaire],
          power_load_gap:['Écart à prévision de demande J',latest.load-latest.prevision_j]};
        for(const [id,[label,value]] of Object.entries(values)){
          delete byId[id];
          if(Number.isFinite(value))byId[id]={id,sector:'power',label,value,unit:'MW',
            as_of:latest.at.slice(0,10),source:'RTE éCO2mix',comparison:'observé'};
        }
        refreshPanels();
      } catch(error) {console.warn('RTE direct indisponible, archive conservée :',error);}
      finally {rteFetchBusy=false;}
    }

    function renderPower() {
      const grid = document.getElementById('power-grid');
      const points = Array.isArray(snapshot.history?.power_fr) ? snapshot.history.power_fr : [];
      const latest = points[points.length - 1];
      const measuredAt = latest && Date.parse(latest.at);
      const powerOld = !measuredAt || Date.now() - measuredAt > 6 * 3600000;
      const source = snapshot.sources?.rte_power || {};
      const rte = document.getElementById('power-rte-status');
      rte.textContent = latest ?
        'RTE · ' + (powerOld ? 'archive · ' : '') + parisTime(latest.at) +
          (source.status === 'error' ? ' · dernière valeur conservée' : '') :
        'RTE · première collecte en attente';
      rte.classList.toggle('good', !!latest && !powerOld && source.status === 'ok');
      rte.classList.toggle('warn', !latest || powerOld || source.status === 'error');
      const checked=source.checked_at||snapshot.generated_at;
      document.getElementById('power-updated').textContent = checked ?
        (source.direct?'RTE vérifié : ':'Instantané : ')+parisTime(checked) : 'Instantané local';
      const picks = [
        ['power_load', 'consommation observée'],
        ['power_gaz', 'production électrique au gaz'],
        ['power_exchange', 'négatif : export / positif : import'],
        ['power_residual', 'calcul : demande − éolien − solaire']
      ];
      for (const [id, hint] of picks) {
        const item = byId[id];
        const card = line('', 'article', 'card power-card');
        card.append(line(item?.label || id, 'small'));
        card.append(line(item ? number(item.value, 0) + ' MW' : '—', 'strong'));
        card.append(line(item ? (powerOld ? 'Archive · ' : '') + hint : 'Mesure en attente', 'span'));
        grid.append(card);
      }
      const entsoe = document.getElementById('power-entsoe-status');
      const entsoeRows = ['fr', 'de'].map(zone => ({zone, item:byId['power_forecast_' + zone],
        source:snapshot.sources?.['entsoe_' + zone] || {}}));
      const configured = entsoeRows.some(entry => entry.source.status !== 'needs_key' && entry.source.status);
      entsoe.textContent = configured ? 'ENTSO-E · ' +
        (entsoeRows.every(entry => entry.source.status === 'ok') ? 'prévisions collectées' : 'collecte partielle') :
        'ENTSO-E · clé non configurée';
      entsoe.classList.toggle('good', entsoeRows.every(entry => entry.source.status === 'ok'));
      entsoe.classList.toggle('warn', !entsoeRows.every(entry => entry.source.status === 'ok'));
      const forecast = document.getElementById('power-forecast');
      for (const entry of entsoeRows) {
        const box = line('', 'div');
        box.append(line(entry.zone === 'fr' ? 'France' : 'DE-LU', 'small'));
        const m = entry.item;
        box.append(line(m ? number(m.value, 0) + ' MW' : '—', 'strong'));
        const forecastAt = entry.source.as_of;
        const valid = m && forecastAt && Date.parse(forecastAt) >= Date.now();
        box.append(line(m ? (valid ? 'Pic prévu : ' : 'Prévision archivée : ') +
          parisTime(forecastAt) : entry.source.status === 'needs_key' ? 'Clé requise' :
          'Publication indisponible', 'span'));
        forecast.append(box);
      }
      document.getElementById('power-forecast-note').textContent = !configured ?
        'Activer : Settings → Secrets and variables → Actions → ENTSOE_API_TOKEN ; puis relancer le workflow.' :
        'Prévisions datées : valeur du pic prévu, pas un prix ni la consommation déjà réalisée.';
      if (!latest) return;
      const gas = byId.power_gaz?.value;
      const exchange = byId.power_exchange?.value;
      const wind = byId.power_eolien?.value;
      const solar = byId.power_solaire?.value;
      const facts = [];
      if (gas !== undefined) facts.push('Gaz mobilisé : ' + number(gas, 0) + ' MW.');
      const loadGap = byId.power_load_gap?.value;
      if (loadGap !== undefined) facts.push('Demande réalisée ' +
        number(Math.abs(loadGap), 0) + ' MW ' + (loadGap < 0 ? 'sous' : loadGap > 0 ? 'au-dessus de' : 'égale à') +
        ' la prévision RTE du jour.');
      if (wind !== undefined && solar !== undefined) facts.push('Éolien + solaire : ' + number(wind + solar, 0) + ' MW.');
      if (exchange !== undefined) facts.push('Solde physique : ' + number(Math.abs(exchange), 0) +
        ' MW d’' + (exchange < 0 ? 'exportations nettes' : exchange > 0 ? 'importations nettes' : 'équilibre net') + '.');
      document.getElementById('power-readout').textContent = facts.join(' ') +
        ' Observation du ' + parisTime(latest.at) + (powerOld ? ' (archivée).' : '.');
      const fuels = [
        ['Nucléaire', 'nucleaire', '#8dc4f5'], ['Gaz', 'gaz', '#f1c984'],
        ['Éolien', 'eolien', '#78dda8'], ['Solaire', 'solaire', '#edaa75'],
        ['Hydraulique', 'hydraulique', '#82c8df'], ['Bioénergies', 'bioenergies', '#bba5ef'],
        ['Charbon', 'charbon', '#b7aa9d'], ['Fioul', 'fioul', '#d9a2a2']
      ].filter(([, key]) => Number.isFinite(latest[key]) && latest[key] >= 0);
      const total = fuels.reduce((sum, [,key]) => sum + latest[key], 0);
      const mix = document.getElementById('power-mix');
      mix.replaceChildren();
      if (total) {
        for (const [name, key, color] of fuels) {
          const row = line('', 'div', 'power-mix-row');
          row.append(line(name, 'span'));
          const track = line('', 'div', 'track');
          const bar = line('', 'i');
          bar.style.width = Math.max(0, Math.min(100, latest[key] / total * 100)) + '%';
          bar.style.background = color;
          track.append(bar);
          row.append(track, line(number(latest[key], 0), 'strong'));
          mix.append(row);
        }
        document.getElementById('power-mix-time').textContent = 'Mesure : ' + parisTime(latest.at) + ' · RTE.';
      } else mix.append(line('Répartition des filières indisponible.', 'span'));
      const observed = points.filter(row => Number.isFinite(row.load) &&
        Date.parse(row.at) >= measuredAt - 24 * 3600000);
      if (observed.length < 3) return;
      const residual = row => Number.isFinite(row.eolien) && Number.isFinite(row.solaire) ?
        row.load - row.eolien - row.solaire : null;
      const all = observed.flatMap(row => [row.load, residual(row)]).filter(Number.isFinite);
      const min = Math.floor(Math.min(...all) / 5000) * 5000;
      const max = Math.ceil(Math.max(...all) / 5000) * 5000;
      const start = Date.parse(observed[0].at), end = Date.parse(observed[observed.length - 1].at);
      if (max <= min || start === end) return;
      const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
      svg.setAttribute('viewBox', '0 0 600 225');
      svg.setAttribute('preserveAspectRatio', 'none');
      svg.setAttribute('class', 'power-chart');
      svg.setAttribute('role', 'img');
      svg.setAttribute('aria-label', 'Puissance sur 24 heures : demande et demande résiduelle indicatives');
      for (const level of [0, .5, 1]) {
        const y = 200 - level * 180;
        const guide = document.createElementNS('http://www.w3.org/2000/svg', 'line');
        for (const [key, value] of [['x1',0],['x2',600],['y1',y],['y2',y]])
          guide.setAttribute(key, String(value));
        svg.append(guide);
        const tick = document.createElementNS('http://www.w3.org/2000/svg', 'text');
        tick.setAttribute('x','5'); tick.setAttribute('y',String(y-4));
        tick.setAttribute('fill','#a4b9ab'); tick.setAttribute('font-size','11');
        tick.textContent = number(min + level * (max-min),0) + ' MW';
        svg.append(tick);
      }
      for (const [read, css] of [[row => row.load, 'demand-line'], [residual, 'residual-line']]) {
        const lineSvg = document.createElementNS('http://www.w3.org/2000/svg', 'polyline');
        lineSvg.setAttribute('class', css);
        lineSvg.setAttribute('points', observed.map(row => {
          const value = read(row);
          if (!Number.isFinite(value)) return null;
          return ((Date.parse(row.at) - start) / (end - start) * 600).toFixed(1) + ',' +
                 (200 - (value - min) / (max - min) * 180).toFixed(1);
        }).filter(Boolean).join(' '));
        svg.append(lineSvg);
      }
      document.getElementById('power-curve').replaceChildren(svg);
      document.getElementById('power-axis').replaceChildren(
        line('● Demande · ' + parisTime(observed[0].at), 'span'),
        line('● Résiduelle indicative · ' + parisTime(observed[observed.length - 1].at), 'span'));
    }

    document.querySelectorAll('.filters button').forEach(button => button.addEventListener('click', () => {
      selectedSector = button.dataset.sector;
      renderSector();
    }));
    function refreshPanels() {
      for (const id of ['source-status','watch-list','agenda','mini-grid','stories',
                         'signals','metrics','power-grid','power-mix','power-forecast'])
        document.getElementById(id).replaceChildren();
      document.getElementById('release-list').replaceChildren(line('Dernières publications vérifiées','h3'));
      const curve = document.getElementById('power-curve');
      curve.replaceChildren(line('Collecte RTE en attente.','span'));
      for (const fn of [renderStatus,renderWatch,renderAgenda,renderMini,renderReleases,
                        renderStories,renderSector,renderPower,renderPowerHistory,renderPowerPrices]) {
        try { fn(); } catch (error) { console.error('Panneau indisponible :', fn.name, error); }
      }
    }
    renderLive();
    renderQuotes();
    refreshPanels();
    async function refreshSnapshot() {
      const button = document.getElementById('refresh-data');
      button.disabled = true; button.textContent = 'Synchronisation…';
      try {
        const url = 'https://raw.githubusercontent.com/TheoTaillandier/Test2/main/data/snapshot.json?t=' + Date.now();
        const response = await fetch(url, {cache:'no-store'});
        if (!response.ok) throw new Error('HTTP ' + response.status);
        const next = await response.json();
        if (!next.generated_at || !Array.isArray(next.metrics) || !next.history) {
          throw new Error('Instantané incomplet');
        }
        const newer=Date.parse(next.generated_at)>Date.parse(snapshot.generated_at||0);
        if(newer){
          const liveSource=snapshot.sources?.rte_power?.direct&&snapshot.sources.rte_power;
          const livePoints=liveSource&&snapshot.history?.power_fr;
          const liveMetrics=liveSource&&Object.fromEntries(Object.entries(byId)
            .filter(([id])=>id.startsWith('power_')));
          snapshot=next;metrics=next.metrics;
          byId=Object.fromEntries(metrics.map(item=>[item.id,item]));
          if(liveSource&&Date.parse(liveSource.checked_at)>Date.parse(next.generated_at)){
            snapshot.history.power_fr=livePoints;
            snapshot.sources.rte_power=liveSource;
            Object.assign(byId,liveMetrics);
          }
        }
        try {
          const powerResponse = await fetch('https://raw.githubusercontent.com/TheoTaillandier/Test2/main/data/power_fr.json?t=' + Date.now(), {cache:'no-store'});
          if (powerResponse.ok) {
            const power = await powerResponse.json();
            if (power.schema === 1 && Array.isArray(power.points) && power.points.length &&
                Date.parse(power.last_at) >= Date.parse(powerHistory.last_at || 0)) powerHistory = power;
          }
        } catch (error) { console.warn('Historique Power non synchronisé :', error); }
        try {
          const priceResponse = await fetch('https://raw.githubusercontent.com/TheoTaillandier/Test2/main/data/power_prices.json?t=' + Date.now(), {cache:'no-store'});
          if (priceResponse.ok) {
            const prices = await priceResponse.json();
            if (prices.schema===1&&Array.isArray(prices.series?.fr)&&
                Date.parse(prices.generated_at)>=Date.parse(powerPrices.generated_at||0)) {
              const recent=powerPrices.live_checked_at&&
                Date.parse(powerPrices.live_checked_at)>Date.parse(prices.generated_at);
              if(recent){
                const combine=(archive,live)=>{
                  const byTime=new Map();
                  for(const p of [...(archive||[]),...(live||[])]){
                    const t=Date.parse(p.at);
                    if(Number.isFinite(t)&&Number.isFinite(p.value))byTime.set(t,p);
                  }
                  return [...byTime.values()].sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
                };
                powerPrices={...prices,series:{fr:combine(prices.series.fr,powerPrices.series?.fr),
                  de:combine(prices.series.de,powerPrices.series?.de)},
                  licence:powerPrices.licence,live_checked_at:powerPrices.live_checked_at};
              } else powerPrices=prices;
            }
          }
        } catch (error) { console.warn('Prix Power non synchronisés :', error); }
        refreshPanels();
        button.textContent = newer ? 'Données synchronisées' : 'Données déjà à jour';
      } catch (error) {
        button.textContent = 'Hors connexion · instantané daté';
        console.warn('Synchronisation impossible :', error);
      } finally { button.disabled = false; }
    }
    document.getElementById('refresh-data').addEventListener('click', refreshSnapshot);
    document.getElementById('power-refresh').addEventListener('click',async()=>{
      const button=document.getElementById('power-refresh');
      button.disabled=true;button.textContent='Vérification…';
      try {await refreshSnapshot();await Promise.all([refreshPowerDirect(true),refreshRteDirect(true)]);}
      finally {button.disabled=false;button.textContent='Rafraîchir ↻';}
    });
    refreshSnapshot().then(()=>refreshPowerDirect());
    let lastDeliverySlot=Math.floor(Date.now()/900000);
    setInterval(()=>{const slot=Math.floor(Date.now()/900000);
      if(slot===lastDeliverySlot)return;
      lastDeliverySlot=slot;
      if(!document.getElementById('power').hidden)renderPowerPrices();
      else renderMarketPowerPulse();},60000);
    setInterval(()=>{if(!document.hidden)refreshPowerDirect();},1800000);
    setInterval(()=>{if(!document.hidden&&!document.getElementById('power').hidden)refreshRteDirect();},900000);
  </script>
</body>
</html>

```
