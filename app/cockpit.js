(() => {
    'use strict';

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
      if (!item.as_of) return Infinity;
      const sourceDate = item.as_of.length === 4 ? item.as_of + '-01-01' : item.as_of.length === 7 ? item.as_of + '-01' : item.as_of;
      return (Date.now() - Date.parse(sourceDate + 'T12:00:00Z')) / 86400000;
    }
    function stale(item) {
      const limit = /ag_(corn|soy)_(condition|harvest)/.test(item.id) ? 9 : item.id === 'oil_norway_liquids' ? 80 : item.id.startsWith('price_') ? 8 :
        item.source?.startsWith('GIE') ? 4 : ({oil: 13, gas: 13, agri: 49, metals: 800}[item.sector] || 14);
      return age(item) > limit;
    }
    function safeLink(url) {
      try {
        const parsed = new URL(url);
        const hosts = ['www.eia.gov', 'ir.eia.gov', 'www.usda.gov', 'pubs.usgs.gov',
          'agsi.gie.eu', 'alsi.gie.eu', 'fred.stlouisfed.org', 'www.sodir.no', 'www.eex.com',
          'www.ice.com', 'www.tradingview.com', 'transparency.entsog.eu', 'esmis.nal.usda.gov',
          'www.worldbank.org', 'www.energy-charts.info', 'api.energy-charts.info', 'data.ecb.europa.eu'];
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
      if (item.unit === '%') return symbol + number(Math.abs(item.change), 2) + ' point(s) ' + item.comparison.replace(/^points /,'');
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
      if (page === 'power') {renderPowerPrices();refreshPowerDirect();refreshRteDirect();}
      if (page === 'physical') renderTrend();
      if (page === 'markets' && marketChartMode === 'history') renderMarketHistory();
      window.scrollTo({top:0,behavior:'instant'});
    }
    document.querySelectorAll('.nav button, [data-open]').forEach(button => {
      button.addEventListener('click', event => {
        event.preventDefault();
        switchPage(button.dataset.page || button.dataset.open);
      });
    });

    document.querySelectorAll('.nav button').forEach((button,index)=>button.addEventListener('keydown',event=>{
      if(!['ArrowLeft','ArrowRight','Home','End'].includes(event.key))return;event.preventDefault();
      const tabs=[...document.querySelectorAll('.nav button')],next=event.key==='Home'?0:event.key==='End'?tabs.length-1:(index+(event.key==='ArrowRight'?1:-1)+tabs.length)%tabs.length;tabs[next].focus();tabs[next].click();
    }));

    function renderStatus() {
      const container = document.getElementById('source-status');
      const labels = {brent: 'Brent spot', wti: 'WTI spot', henry: 'Henry Hub spot', ttf_ngp:'TTF spot',
        norway: 'Production Norvège',
        oil: 'EIA stocks pétrole', oil_flows: 'EIA flux pétrole', gas: 'EIA gaz US', wasde: 'USDA WASDE', crop_progress:'État & récoltes US',
        news: 'Analyses EIA', gie: 'GIE stockage UE', gie_fr: 'GIE stockage France',
        alsi: 'GIE GNL UE', alsi_fr: 'GIE GNL France', metals: 'USGS métaux'};
      for (const [id, label] of Object.entries(labels)) {
        const source = snapshot.sources?.[id] || {};
        const sample = {brent:'price_brent',wti:'price_wti',henry:'price_henry',ttf_ngp:'price_ttf',
          norway:'oil_norway_liquids',
          oil:'oil_crude',oil_flows:'oil_imports',gas:'gas_us',wasde:'ag_corn_stocks',crop_progress:'ag_corn_harvest',
          gie:'gas_eu',gie_fr:'gas_fr',alsi:'lng_eu_inventory',
          alsi_fr:'lng_fr_inventory',metals:'metal_copper'}[id];
        const hasValue = Boolean(sample && byId[sample]) || (id === 'news' && (snapshot.stories || []).length > 0);
        const status = source.status === 'ok' ? period(source.as_of || '') +
          (byId[sample] && stale(byId[sample]) ? ' · archive' : '') :
          source.status === 'needs_key' ? 'clé requise' : source.status === 'needs_licence' ? 'flux sous licence non connecté' :
          source.status === 'structural' ? 'repère annuel' :
          source.status === 'manual' ? 'repère mensuel daté' :
          hasValue ? 'dernière valeur conservée' : 'source indisponible';
        container.append(line(label + ' · ' + status, 'span',
          'badge ' + (source.status === 'ok' && (!byId[sample] || !stale(byId[sample])) ? 'good' : 'warn')));
      }
      const warnings=Object.values(snapshot.sources||{}).filter(src=>['error','needs_key'].includes(src.status)).length;
      document.getElementById('source-summary').textContent='Qualité des sources · '+metrics.length+' mesures datées · '+warnings+' accès à vérifier';
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

    const charts = [
      {name:'Brent', symbol:'OANDA:BCOUSD', url:'https://www.tradingview.com/symbols/BCOUSD/?exchange=OANDA'},
      {name:'WTI', symbol:'OANDA:WTICOUSD', url:'https://www.tradingview.com/symbols/WTICOUSD/?exchange=OANDA'},
      {name:'Gaz US', symbol:'OANDA:NATGASUSD', url:'https://www.tradingview.com/symbols/NATGASUSD/?exchange=OANDA'},
      {name:'Cuivre', symbol:'OANDA:XCUUSD', url:'https://www.tradingview.com/symbols/XCUUSD/?exchange=OANDA'},
      {name:'Or', symbol:'OANDA:XAUUSD', url:'https://www.tradingview.com/symbols/XAUUSD/?exchange=OANDA'}
    ];
    function embed(container, scriptUrl, config, fallback) {
      container.replaceChildren();
      const frame = line('', 'div', 'tradingview-widget-container');
      frame.append(line('', 'div', 'tradingview-widget-container__widget'));
      const script = document.createElement('script');
      script.async = true;
      script.src = scriptUrl;
      if (fallback) {
        let failed = false;
        const fail = () => {if (!failed && container.contains(frame)) {failed = true; fallback();}};
        script.addEventListener('error', fail, {once:true});
        setTimeout(() => {if (!frame.querySelector('iframe')) fail();}, 18000);
      }
      script.textContent = JSON.stringify(config);
      frame.append(script);
      container.append(frame);
    }
    function renderLive() {
      const box = document.getElementById('live-strip');box.replaceChildren();
      for (const choice of charts) {
        const tile = line('', 'article', 'live-tile');
        const title=line('', 'div', 'live-title');title.append(line('','i'),line(choice.name,'span'));
        const widget = line('Chargement du cours…', 'div', 'widget');
        const footer=line('','div','live-footer'),link=line('Instrument & horaire ↗','a');
        link.href=choice.url;link.target='_blank';link.rel='noopener noreferrer';footer.append(link);
        tile.append(title,widget,footer);box.append(tile);
        embed(widget, 'https://s3.tradingview.com/external-embedding/embed-widget-single-quote.js',
          {symbol:choice.symbol,width:'100%',locale:'fr',colorTheme:'dark',isTransparent:false}, () => {
            const id={Brent:'price_brent',WTI:'price_wti','Gaz US':'price_henry'}[choice.name];
            const item=byId[id], fallback=line('','div','widget-fallback');
            fallback.append(line(item ? number(item.value,2)+' '+item.unit : 'Flux non chargé','strong'),
              line(item ? 'Repli : spot EIA · '+period(item.as_of) : 'Accès fournisseur requis','small'));
            widget.replaceChildren(fallback);
            footer.prepend(line('En séance indisponible · ','span'));
          });
      }
    }

    let marketChartIndex=0, marketChartMode='live';
    function renderChart(index = 0) {
      marketChartIndex=index;
      const choice = charts[index];
      document.getElementById('market-chart-title').textContent = choice.name + ' · indicatif OANDA';
      document.getElementById('market-chart-link').href = choice.url;
      document.querySelectorAll('#chart-picks button').forEach((button, i) => {
        button.classList.toggle('active', i === index);
        button.setAttribute('aria-pressed', String(i === index));
      });
      if (marketChartMode === 'history') {renderMarketHistory(); return;}
      embed(document.getElementById('market-chart'),
        'https://s3.tradingview.com/external-embedding/embed-widget-advanced-chart.js',
        {autosize:true,symbol:choice.symbol,interval:'60',timezone:'Europe/Paris',
         theme:'dark',style:'1',locale:'fr',allow_symbol_change:true,
         hide_top_toolbar:false,support_host:'https://www.tradingview.com'}, () => {
          const box=document.getElementById('market-chart');
          box.replaceChildren(line('Le cours du fournisseur n’a pas chargé. Utilise « Historique publié » pour consulter les données embarquées.','p','empty'));
        });
    }
    function renderQuotes() {
      const picks = document.getElementById('chart-picks');picks.replaceChildren();
      charts.forEach((choice,index)=>{const button=line(choice.name,'button');button.type='button';
        button.addEventListener('click',()=>renderChart(index));picks.append(button);});
      renderChart();renderGasPrices();
    }
    function renderGasPrices() {
      const gas=document.getElementById('gas-prices');gas.replaceChildren();
      for(const [title,detail,href] of [
        ['TTF','TTF · €/MWh · fréquence affichée','https://www.eex.com/en/markets/natural-gas/gas-market-transparency'],
        ['PEG France','Indice spot EEX · €/MWh','https://www.eex.com/en/market-data/market-data-hub/natural-gas/indices'],
        ['JKM','Indice GNL Asie · $/MMBtu','https://www.ice.com/products/6753280/jkm-lng-platts-future']]){
        const card=line('','article','price-link');card.append(line(title,'strong'),line(detail,'small'));
        const item=title==='TTF'&&byId.price_ttf;
        if(item){card.append(line(number(item.value,2)+' €/MWh','div','gas-price-value'),
          line((item.quality==='provisoire'?'Provisoire · ':'Final · ')+parisTime(item.observed_at||item.as_of),'small'),
          line(changeText(item),'p'));
          const compare=line('Comparer aux trois années précédentes ↗','a');compare.href='#physical';
          compare.addEventListener('click',event=>{event.preventDefault();selectedSector='gas';
            document.querySelectorAll('.filters button').forEach(b=>b.classList.toggle('active',b.dataset.sector==='gas'));
            switchPage('physical');renderSector();});card.append(compare);
        }else if(title==='TTF' && snapshot.history?.ttf_monthly?.length){
          const last=snapshot.history.ttf_monthly.at(-1);
          card.append(line(number(last.value,2)+' €/MWh','div','gas-price-value'),
            line('Moyenne mensuelle · '+period(last.date.slice(0,7)),'small'),
            line('Repère Banque mondiale / BCE. Cours en séance non connecté.','p'));
        }else{card.append(line('—','div','unavailable-price'),line('Flux de cotation sous licence non connecté','p'));}
        const link=line('Source et définition ↗','a');link.href=href;link.target='_blank';link.rel='noopener noreferrer';
        card.append(link);gas.append(card);
      }
    }

    function renderWatch() {
      const box=document.getElementById('watch-list');box.replaceChildren();
      box.append(line('SPOT PHYSIQUE · PUBLICATIONS EIA','div','watch-group'));
      for(const id of ['price_brent','price_wti','price_henry']){
        const item=byId[id],row=line('','div','quote-row');
        row.append(line({price_brent:'Brent Europe',price_wti:'WTI Cushing',price_henry:'Henry Hub'}[id],'strong'),
          line(item?number(item.value,2)+' '+item.unit:'Publication en attente','span','quote-value'),
          line(item?'EIA · '+period(item.as_of)+(stale(item)?' · archive':''):'Source officielle indisponible','small','quote-note'));
        box.append(row);
      }
      const ttf=byId.price_ttf;
      if(ttf){box.append(line('GAZ EUROPÉEN · INDICE SPOT','div','watch-group'));
        const row=line('','div','quote-row');row.append(line('TTF · NGP EEX','strong'),
          line(number(ttf.value,2)+' €/MWh','span','quote-value'),
          line(parisTime(ttf.observed_at||ttf.as_of)+' · '+(ttf.quality||'daté'),'small','quote-note'));box.append(row);}
      const details=line('','details','watch-more');details.append(line('Autres contrats & sources','summary'));
      for(const [label,url] of [['Aluminium · LME','https://www.lme.com/Metals/Non-ferrous/LME-Aluminium'],
        ['Cacao · ICE','https://www.tradingview.com/symbols/ICEUS-CC1%21/'],
        ['Café Arabica · ICE','https://www.tradingview.com/symbols/ICEUS-KC1%21/']]){
        const link=line(label+' ↗','a');link.href=url;link.target='_blank';link.rel='noopener noreferrer';details.append(link);}
      box.append(details);
    }

    function renderAgenda() {
      const box = document.getElementById('agenda');
      const upcoming = (snapshot.calendar || []).filter(event =>
        event.day_only ? Date.parse(event.at) + 86400000 > Date.now() :
          Date.parse(event.at) > Date.now()).slice(0, 3);
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
      const priority=selectedSector==='gas'?['gas_fr','gas_eu','lng_fr_sendout']:selectedSector==='agri'?['ag_world_wheat','ag_corn_stocks','ag_soy_stocks']:[];
      const selected=metrics.filter(item=>item.sector===selectedSector&&Number.isFinite(item.change))
        .sort((a,b)=>(priority.includes(a.id)?priority.indexOf(a.id):999)-(priority.includes(b.id)?priority.indexOf(b.id):999));
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
          known ? 'Variation nulle sur la comparaison publiée : aucun sens directionnel à déduire de cette seule mesure.' : 'Dernière valeur datée : attendre une variation récente vérifiée avant d’en déduire une pression sur le prix.', 'p'));
        card.append(line('Marché concerné : ' + rule.market + ' · ' +
          (selectedSector === 'metals' ? 'repère annuel, sans implication instantanée.' : 'scénario, pas une réaction de cours.'), 'small'));
        box.append(card);
      }
      if (!box.children.length) box.append(line('Pas encore de variation récente exploitable pour ce secteur. Les chiffres datés restent accessibles ci-dessous.', 'p', 'empty'));
    }

    function renderStories() {
      const box = document.getElementById('stories');
      box.replaceChildren();
      const relevant = (snapshot.stories || []).filter(item =>
        /crude|oil|natural gas|\blng\b|diesel|refin|petroleum|gasoline|fuel|storage/i.test(item.title + ' ' + item.summary));
      for (const item of relevant.slice(0, 3)) {
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

    function timeChart(host, config) {
      host.replaceChildren();
      const series=(config.series||[]).map((s,i)=>({...s,color:s.color||['#70dfbf','#edc27d'][i],
        points:(s.points||[]).filter(p=>Number.isFinite(p.value)&&Number.isFinite(Date.parse(p.date))).sort((a,b)=>a.date.localeCompare(b.date))}));
      const all=series.flatMap(s=>s.points);
      if(all.length<2){host.append(line('Historique non reçu pour cette période.','p','empty'));return;}
      const start=Math.min(...all.map(p=>Date.parse(p.date))),end=Math.max(...all.map(p=>Date.parse(p.date)));
      const vals=all.map(p=>p.value),pad=Math.max(.5,(Math.max(...vals)-Math.min(...vals))*.12);
      const low=config.scale?.[0]??Math.min(...vals)-pad, high=config.scale?.[1]??Math.max(...vals)+pad;
      const width=Math.max(315,Math.min(1000,host.clientWidth||800)),right=width-16,plot=right-55;
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
      svg.setAttribute('viewBox','0 0 '+width+' 260');svg.setAttribute('class','time-chart');
      svg.setAttribute('role','img');svg.setAttribute('aria-label',config.title+' · '+config.unit);
      const add=(tag,attrs)=>{const n=document.createElementNS(svg.namespaceURI,tag);
        Object.entries(attrs).forEach(([k,v])=>n.setAttribute(k,v));svg.append(n);return n;};
      const x=t=>55+plot*(t-start)/Math.max(1,end-start),y=v=>213-179*(v-low)/Math.max(.01,high-low);
      add('text',{x:55,y:16}).textContent=config.unit;
      for(let i=0;i<5;i++){const v=low+(high-low)*i/4;
        add('line',{x1:55,x2:right,y1:y(v),y2:y(v),class:'grid'});
        add('text',{x:45,y:y(v)+4,'text-anchor':'end'}).textContent=number(v,config.digits??0);}
      if(low<0&&high>0)add('line',{x1:55,x2:right,y1:y(0),y2:y(0),class:'zero'});
      const ticks=width<500?3:5;
      for(let i=0;i<ticks;i++){const t=start+(end-start)*i/(ticks-1);
        add('text',{x:x(t),y:240,'text-anchor':i===0?'start':i===ticks-1?'end':'middle'}).textContent=
          new Intl.DateTimeFormat('fr-FR',{month:'short',day:'numeric',timeZone:'UTC'}).format(new Date(t));}
      for(const seriesItem of series){
        let part=[];const draw=()=>{if(part.length>1)add('polyline',{points:part.map(p=>x(Date.parse(p.date)).toFixed(2)+','+y(p.value).toFixed(2)).join(' '),stroke:seriesItem.color});
          else if(part.length)add('circle',{cx:x(Date.parse(part[0].date)),cy:y(part[0].value),r:2.5,fill:seriesItem.color});part=[];};
        for(const p of seriesItem.points){if(part.length&&Date.parse(p.date)-Date.parse(part.at(-1).date)>(config.maxGap||10)*86400000)draw();part.push(p);}draw();
        const last=seriesItem.points.at(-1);if(last)add('circle',{cx:x(Date.parse(last.date)),cy:y(last.value),r:3.5,fill:seriesItem.color});
      }
      const cursor=add('line',{x1:55,x2:55,y1:30,y2:213,class:'hover-line',visibility:'hidden'});
      const readout=line('Survole ou touche le graphique pour lire la date et les valeurs.','div','seasonal-readout');
      const overlay=add('rect',{x:55,y:30,width:plot,height:183,fill:'transparent',class:'hover-area'});
      overlay.addEventListener('pointermove',event=>{
        const point=svg.createSVGPoint();point.x=event.clientX;point.y=event.clientY;
        const local=point.matrixTransform(svg.getScreenCTM().inverse()),t=start+Math.max(0,Math.min(1,(local.x-55)/plot))*(end-start);
        cursor.setAttribute('x1',x(t));cursor.setAttribute('x2',x(t));cursor.setAttribute('visibility','visible');
        readout.replaceChildren();
        for(const s of series){const p=s.points.reduce((a,p)=>Math.abs(Date.parse(p.date)-t)<(a?Math.abs(Date.parse(a.date)-t):Infinity)?p:a,null);
          if(!p)continue;const valid=Math.abs(Date.parse(p.date)-t)<=(config.maxGap||10)*86400000;
          const cell=line(s.name+' · '+(valid?number(p.value,2)+' '+config.unit+' · '+period(p.date):'pas de mesure proche'),'span');cell.style.color=s.color;readout.append(cell);}
      });
      overlay.addEventListener('pointerleave',()=>cursor.setAttribute('visibility','hidden'));
      host.append(svg,readout);
      if(series.length>1){const legend=line('','div','trend-key');for(const s of series){const cell=line(s.name,'span'),marker=line('','i');marker.style.background=s.color;cell.prepend(marker);legend.append(cell);}host.append(legend);}
      host.append(line(all.length+' observations · '+period(new Date(start).toISOString().slice(0,10))+' → '+period(new Date(end).toISOString().slice(0,10)), 'div','chart-source'));
    }
    function drawTrend(panelId, lineId, startId, endId, titleId, title, points) {
      const host=document.getElementById(panelId);host.hidden=!Array.isArray(points)||points.length<2;
      if(host.hidden)return;
      host.replaceChildren(line(title,'h3'));
      const chart=line('','div');host.append(chart);
      timeChart(chart,{title,unit:selectedSector==='oil'?'M bbl':'GWh/j',series:[{name:selectedSector==='oil'?'Stocks brut US':'Émission GNL France',points}],maxGap:selectedSector==='oil'?10:3,digits:0});
      host.append(line(selectedSector==='oil'?'EIA WPSR · fréquence hebdomadaire':'GIE ALSI · débit quotidien', 'div','chart-source'));
    }
    const seasonalChoices = new Map();
    function parisDay(at = Date.now()) {
      const parts = Object.fromEntries(new Intl.DateTimeFormat('en-CA', {timeZone:'Europe/Paris',
        year:'numeric',month:'2-digit',day:'2-digit'}).formatToParts(new Date(at))
        .filter(p=>['year','month','day'].includes(p.type)).map(p=>[p.type,p.value]));
      return parts.year+'-'+parts.month+'-'+parts.day;
    }
    function renderSeasonalChart(host, config) {
      host.replaceChildren(); host.classList.add('seasonal-panel');
      const heading = line('', 'div', 'seasonal-heading');
      const titleBox = line('', 'div');
      titleBox.append(line(config.eyebrow || 'COMPARAISON PAR ANNÉE','div','eyebrow'),line(config.title,'h3'));
      heading.append(titleBox); host.append(heading);
      const points = (config.points || []).filter(p=>/^\d{4}-\d{2}-\d{2}$/.test(p.date) && Number.isFinite(p.value));
      if (!points.length) {host.append(line('Historique indisponible lors de la dernière collecte.','p','empty'),line(config.note,'p','seasonal-note'));const link=line(config.sourceLabel+' ↗','a','seasonal-source');link.href=safeLink(config.sourceUrl)||config.sourceUrl;link.target='_blank';link.rel='noopener noreferrer';host.append(link);return;}
      const year = Number(parisDay().slice(0,4));
      const years = [year,year-1,year-2,year-3];
      const palette = ['#71dfc2','#facb80','#73a7ff','#bc9ae8'];
      const latest = points.filter(p=>p.date.startsWith(String(year))).at(-1) || points.at(-1);
      const reference = config.reference || latest;
      const isCurrent = reference && Number(reference.date.slice(0,4))===year;
      if(reference){const valueBox=line('','div','seasonal-current');
        valueBox.append(line(number(reference.value,2)+' '+config.unit,'strong'),
          line(config.referenceLabel || (config.monthly?'Dernière moyenne · '+period(reference.date.slice(0,7)):'Dernière observation · '+period(reference.date)),'small'));
        heading.append(valueBox);}
      host.append(line(config.subtitle || 'Mêmes mois de l’année · une échelle commune pour les quatre courbes.','p','seasonal-subtitle'));
      const active = seasonalChoices.get(config.id) || new Set(years);
      const legend = line('','div','seasonal-legend');
      years.forEach((y,i)=>{
        const count=points.filter(p=>p.date.startsWith(String(y))).length;
        const button=line('','button'); button.type='button';button.style.setProperty('--year-color',palette[i]);
        button.append(line('','i'),line(String(y),'b'),line(i?'N−'+i:'N','small'));
        button.setAttribute('aria-pressed',String(active.has(y)));button.disabled=!count;
        button.title=count ? count+' observations · cliquer pour masquer ou afficher' : 'Année non reçue';
        button.addEventListener('click',()=>{const next=new Set(active);next.has(y)?next.delete(y):next.add(y);
          seasonalChoices.set(config.id,next);renderSeasonalChart(host,config);});legend.append(button);
      }); host.append(legend);
      const base=Date.UTC(2001,0,1), dayMs=86400000;
      const seasonalDay=date=>(Date.UTC(2001,Number(date.slice(5,7))-1,Number(date.slice(8,10)))-base)/dayMs;
      const groups=years.map(y=>points.filter(p=>p.date.startsWith(String(y)) && p.date.slice(5)!=='02-29')
        .map(p=>({...p,x:seasonalDay(p.date)})).sort((a,b)=>a.x-b.x));
      const visible=groups.flatMap((g,i)=>active.has(years[i])?g:[]);
      if(!visible.length){host.append(line('Sélectionne une année pour afficher sa courbe.','p','empty'));return;}
      const values=visible.map(p=>p.value);if(reference)values.push(reference.value);
      let low=Math.min(...values),high=Math.max(...values);
      if(config.fixedScale){[low,high]=config.fixedScale;}else{const pad=Math.max(2,(high-low)*.12);low-=pad;high+=pad;}
      const svg=document.createElementNS('http://www.w3.org/2000/svg','svg');
      const chartWidth=Math.max(330,Math.min(920,host.clientWidth?host.clientWidth-44:920));
      const plotRight=chartWidth-15,plotWidth=plotRight-60;
      svg.setAttribute('viewBox','0 0 '+chartWidth+' 300');svg.setAttribute('role','img');
      svg.setAttribute('aria-label',config.title+' · '+years.join(', ')+' · '+config.unit);
      svg.setAttribute('class','seasonal-svg');
      const add=(tag,attrs,parent=svg)=>{const el=document.createElementNS(svg.namespaceURI,tag);
        for(const [k,v] of Object.entries(attrs))el.setAttribute(k,String(v));parent.append(el);return el;};
      const x=d=>60+plotWidth*d/364, y=v=>247-207*(v-low)/Math.max(.01,high-low);
      add('text',{x:60,y:19,class:'unit'}).textContent=config.unit;
      for(let i=0;i<=4;i++){const value=low+(high-low)*i/4;
        add('line',{x1:60,x2:plotRight,y1:y(value),y2:y(value),class:'grid'});
        add('text',{x:49,y:y(value)+4,'text-anchor':'end'}).textContent=number(value,0);}
      if(low<0&&high>0)add('line',{x1:60,x2:plotRight,y1:y(0),y2:y(0),class:'zero'});
      const months=['Jan.','Fév.','Mars','Avr.','Mai','Juin','Juil.','Août','Sept.','Oct.','Nov.','Déc.'];
      months.forEach((m,i)=>{if(chartWidth<560&&i%2)return;const xx=x((Date.UTC(2001,i,1)-base)/dayMs);
        add('text',{x:xx,y:273,'text-anchor':'middle',class:'month'}).textContent=m;});
      groups.forEach((group,i)=>{
        if(!active.has(years[i]))return;
        const segments=[];let segment=[];
        for(const p of group){if(segment.length&&p.x-segment.at(-1).x>(config.maxGap||7)){segments.push(segment);segment=[];}segment.push(p);}
        if(segment.length)segments.push(segment);
        for(const part of segments){if(part.length>1)add('polyline',{points:part.map(p=>x(p.x).toFixed(2)+','+y(p.value).toFixed(2)).join(' '),
          stroke:palette[i],'stroke-width':i?1.8:3,class:'year-line'});
          else add('circle',{cx:x(part[0].x),cy:y(part[0].value),r:2.3,fill:palette[i]});}
        if(group.length&&i===0)add('circle',{cx:x(group.at(-1).x),cy:y(group.at(-1).value),r:4,fill:palette[i],stroke:'#121d27','stroke-width':2});
      });
      if(reference){add('line',{x1:60,x2:plotRight,y1:y(reference.value),y2:y(reference.value),class:'reference-line'});
        if(isCurrent){const xx=x(seasonalDay(reference.date));add('line',{x1:xx,x2:xx,y1:30,y2:247,class:'today-line'});
          add('circle',{cx:xx,cy:y(reference.value),r:5,fill:'#f1f6f7',stroke:'#090f17','stroke-width':2});}}
      const cursor=add('line',{x1:0,x2:0,y1:30,y2:247,class:'hover-line',visibility:'hidden'});
      const readout=line('Survole ou touche la courbe pour lire les valeurs de chaque année.','div','seasonal-readout');
      const overlay=add('rect',{x:60,y:30,width:plotWidth,height:217,fill:'transparent',class:'hover-area'});
      overlay.addEventListener('pointermove',event=>{
        const position=svg.createSVGPoint();position.x=event.clientX;position.y=event.clientY;
        const local=position.matrixTransform(svg.getScreenCTM().inverse());
        const day=Math.max(0,Math.min(364,Math.round((local.x-60)/plotWidth*364)));
        cursor.setAttribute('x1',x(day));cursor.setAttribute('x2',x(day));cursor.setAttribute('visibility','visible');
        const date=new Date(base+day*dayMs),label=new Intl.DateTimeFormat('fr-FR',{day:'2-digit',month:'short',timeZone:'UTC'}).format(date);
        readout.replaceChildren(line(label,'b'));
        groups.forEach((g,i)=>{if(!active.has(years[i]))return;
          const p=config.monthly ? g.find(p=>p.date.slice(5,7)===String(date.getUTCMonth()+1).padStart(2,'0')) :
            g.reduce((found,p)=>Math.abs(p.x-day)<Math.abs((found?.x??Infinity)-day)?p:found,null);
          const valid=p&&(config.monthly||Math.abs(p.x-day)<=(config.hoverTolerance??3));
          const cell=line(years[i]+' : '+(valid?number(p.value,2)+' '+config.unit:'pas de mesure'),'span');cell.style.color=palette[i];
          cell.title=valid?(config.monthly?'Moyenne de ':'Observation du ')+period(p.date):'';readout.append(cell);});
      });
      overlay.addEventListener('pointerleave',()=>cursor.setAttribute('visibility','hidden'));
      host.append(svg,readout);
      const anchor=config.monthly&&reference?reference.date:latest.date;
      const comparisons=line('','div','seasonal-comparisons');
      years.forEach((yr,i)=>{
        const sameDate=String(yr)+anchor.slice(4);
        const group=groups[i];
        const exact=config.monthly?group.find(p=>p.date.slice(5,7)===anchor.slice(5,7)):group.find(p=>p.date===sameDate);
        const liveMonthly=config.monthly&&i===0&&config.reference;
        const prior=liveMonthly?config.reference:exact||(!config.monthly&&config.allowPrevious?group.filter(p=>p.date<=sameDate&&Date.parse(sameDate)-Date.parse(p.date)<=4*dayMs).at(-1):null);
        const card=line('','div');card.style.setProperty('--year-color',palette[i]);
        card.append(line(String(yr)+(i?' · N−'+i:' · N'),'small'),line(prior?number(prior.value,2)+' '+config.unit:'Non publié','strong'),
          line(prior?(liveMonthly?'NGP spot · '+period(prior.date):config.monthly?'Moyenne '+new Intl.DateTimeFormat('fr-FR',{month:'long',timeZone:'UTC'}).format(new Date(prior.date)):
            period(prior.date)+(exact?'':' · dernier jour ouvré')):'Période sans observation','span'));
        comparisons.append(card);
      });host.append(comparisons);
      host.append(line(config.note,'p','seasonal-note'));
      const source=line(config.sourceLabel+' ↗','a','seasonal-source');source.href=safeLink(config.sourceUrl);source.target='_blank';source.rel='noopener noreferrer';host.append(source);
    }
    function renderPhysicalSeasonal() {
      const host=document.getElementById('seasonal-physical');host.replaceChildren();
      if(selectedSector==='oil'){
        const card=line('','section','card');host.append(card);
        renderSeasonalChart(card,{id:'brent-years',title:'Brent · clôtures spot par année',
          points:snapshot.history?.oil_prices?.brent,unit:'$/bbl',allowPrevious:true,
          subtitle:'2026 face à 2025, 2024 et 2023 · mêmes mois · clôtures spot EIA.',
          note:'Les jours non publiés restent absents. Le repère blanc est la dernière clôture disponible ; les cases comparent la même date, ou le dernier jour ouvré précédent.',
          sourceLabel:snapshot.sources?.oil_price_history?.provenance||'EIA · historique FRED',sourceUrl:'https://fred.stlouisfed.org/series/DCOILBRENTEU'});
      }else if(selectedSector==='gas'){
        const storage=line('','section','card'),ttf=line('','section','card');host.append(storage,ttf);
        renderSeasonalChart(storage,{id:'gas-fr-years',title:'Stockage France · comparer les saisons',
          points:snapshot.history?.gas_fr,unit:'%',fixedScale:[0,100],maxGap:3,hoverTolerance:0,
          subtitle:'2026, 2025, 2024, 2023 · janvier à décembre · pourcentage des capacités disponibles.',
          note:'GIE AGSI+ · observations quotidiennes. Un niveau plus bas au même moment signifie un coussin de gaz moins rempli ; les capacités peuvent évoluer entre les années.',
          sourceLabel:'GIE AGSI+ · France',sourceUrl:'https://agsi.gie.eu/'});
        const spot=byId.price_ttf;
        renderSeasonalChart(ttf,{id:'ttf-years',title:spot?'TTF · historique mensuel et indice spot du jour':'TTF · niveaux mensuels sur quatre années',
          points:snapshot.history?.ttf_monthly,unit:'€/MWh',monthly:true,maxGap:45,
          reference:spot?{date:spot.as_of,value:spot.value}:null,
          referenceLabel:spot?'NGP spot '+(spot.quality||'daté')+' · '+parisTime(spot.observed_at||spot.as_of):null,
          subtitle:spot?'Courbes : moyennes mensuelles TTF · repère blanc : indice spot NGP EEX.':'Courbes : moyennes mensuelles TTF · chaque année sur une même échelle. Spot en séance non connecté.',
          note:'Historique Banque mondiale converti en €/MWh avec le change mensuel BCE. Chaque point est une moyenne mensuelle, aucune clôture quotidienne n’est déduite.'+(spot?' Le repère blanc et la case de l’année courante montrent le NGP autorisé du jour ; les autres cases montrent les moyennes du même mois.':' Le dernier mois publié sert de repère ; les cases comparent le même mois des quatre années.'),
          sourceLabel:'Banque mondiale · Pink Sheet / BCE',sourceUrl:'https://www.worldbank.org/en/research/commodity-markets'});
      }
    }
    function renderPowerSeasonal() {
      const host=document.getElementById('power-seasonal');
      const fr=powerPrices?.series?.fr||[],today=parisDay();
      const current=[...fr].reverse().find(p=>Date.parse(p.at)<=Date.now()&&Date.parse(p.at)>Date.now()-3600000);
      renderSeasonalChart(host,{id:'power-fr-years',eyebrow:'SPOT ÉLECTRICITÉ · REPÈRE HISTORIQUE',
        title:'Power France · aujourd’hui face aux trois années précédentes',
        points:snapshot.history?.power_prices_daily,unit:'€/MWh',maxGap:2,hoverTolerance:0,
        reference:current?{date:today,value:current.value}:null,
        referenceLabel:current?'Créneau livré · '+parisTime(current.at):null,
        subtitle:'2026, 2025, 2024, 2023 · courbes de prix day-ahead moyens de chaque journée de livraison.',
        note:'Le repère blanc est le prix day-ahead du créneau actuel. Les courbes et les cases montrent des moyennes de journées complètes, pondérées par durée, y compris les jours de 23 ou 25 h. Ces repères ont des horizons différents.',
        sourceLabel:'Fraunhofer ISE / Bundesnetzagentur · SMARD · CC BY 4.0',sourceUrl:'https://www.energy-charts.info/charts/price_spot_market/chart.htm?c=FR'});
    }

    function renderTrend() {
      const history = snapshot.history || {};
      const pairs = selectedSector === 'oil' ?
        [['Stocks brut US · millions de barils · 26 semaines',history.oil_crude],null] :
        selectedSector === 'gas' ? [
          ['GNL France · émission GWh/j · données GIE',history.lng_fr_sendout],null] : [null,null];
      for (const [index, pair] of pairs.entries()) {
        const suffix = index ? '-two' : '';
        drawTrend('trend' + suffix, 'trend' + suffix + '-line',
          'trend' + suffix + '-start', 'trend' + suffix + '-end',
          'trend' + suffix + '-title', pair?.[0] || '', pair?.[1] || []);
      }
      renderComparison(history);
      renderPhysicalSeasonal();
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
        const cutoff=Date.now()-365*86400000;
        a=(history.oil_prices.brent||[]).filter(p=>Date.parse(p.date)>=cutoff);
        b=(history.oil_prices.wti||[]).filter(p=>Date.parse(p.date)>=cutoff);
        unit = '$/bbl';
        note = 'Séries EIA historiques via ' + (snapshot.sources?.oil_price_history?.provenance || 'FRED') + ', publiées avec retard. Ce graphique ne remplace pas la cotation en séance au-dessus.';
      } else { card.hidden = true; return; }
      if (a.length < 5 || b.length < 5) { card.hidden = true; return; }
      card.hidden = false;
      card.append(line(title, 'h3'));
      const chart=line('','div');card.append(chart);
      timeChart(chart,{title,unit,series:[{name:'Brent',points:a},{name:'WTI',points:b}],maxGap:5});
      card.append(line(note,'p','detail'));
    }

    const metricNotes={
      oil_crude:'Disponibilité de brut US ; rapprocher le mouvement des flux et du raffinage.',
      oil_cushing:'Point de livraison du WTI : un repère local de tension sur le brut.',
      oil_gasoline:'Disponibilités d’essence ; demande routière et activité des raffineries.',
      oil_refinery:'Plus de brut traité augmente la demande des raffineries.',
      oil_imports:'Entrées de brut : elles alimentent les raffineries et les stocks.',
      oil_exports:'Sorties de brut US vers le marché mondial.',
      oil_norway_liquids:'Offre mensuelle de mer du Nord · pétrole et liquides.',
      gas_fr:'Comparer le remplissage à la même saison des années précédentes.',
      gas_fr_twh:'Gaz contenu dans les stockages français, exprimé en énergie.',
      gas_fr_net:'Positif : soutirage net. Négatif : injection nette.',
      lng_fr_sendout:'Gaz fourni au réseau par les terminaux français.',
      gas_eu:'Le coussin européen compte pour l’équilibre hivernal du TTF.',
      lng_fr_inventory:'Volume de GNL liquide dans les cuves, distinct du débit émis.',
      gas_us:'Disponibilités US · à confronter à la demande domestique et aux exportations GNL.',
      ag_corn_condition:'État des cultures : une part plus faible accroît la sensibilité à la météo.',
      ag_soy_condition:'État du soja US, comparé à la même semaine de N−1.',
      ag_corn_harvest:'Rythme d’arrivée du maïs, comparé à la moyenne cinq ans.',
      ag_soy_harvest:'Avancement de la récolte par rapport à la moyenne cinq ans.',
      ag_corn_stocks:'Prévision de stocks finaux ; un coussin plus faible accroît la sensibilité aux aléas.',
      ag_world_wheat:'Stock mondial prévu ; sa part exportable reste déterminante pour MATIF.',
      ag_soy_stocks:'Stocks de fin de campagne estimés, révisables au prochain WASDE.',
      metal_copper:'Offre minière annuelle, à distinguer des stocks disponibles.',
      metal_aluminum:'Offre primaire annuelle ; énergie et inventaires comptent à court terme.'
    };
    function metricsTable(items) {
      const table=line('','table','metrics-table'),thead=line('','thead'),head=line('','tr');
      for(const label of ['Mesure','Valeur','Variation & période','À retenir'])head.append(line(label,'th'));
      thead.append(head);table.append(thead);const body=line('','tbody');
      for(const item of items){const row=line('','tr'),name=line('','td');name.append(line(item.label,'span'));
        const href=safeLink(item.url);if(href){const source=line(item.source+' ↗','a');source.href=href;source.target='_blank';source.rel='noopener noreferrer';const meta=line('','small');meta.append(source);name.append(meta);}
        const value=line('','td');value.append(line(number(item.value,digits(item))+' '+item.unit,'strong'));
        const comparison=line('','td');comparison.append(line(changeText(item)||'Non publiée','span'),line(period(item.as_of)+(stale(item)?' · archive':''),'small'));
        const note=line('','td');note.append(line(metricNotes[item.id]||item.detail||'Mesure datée, à rapprocher des autres facteurs.','span','metric-explanation'));
        if(item.detail && metricNotes[item.id])note.append(line(item.detail,'small'));
        row.append(name,value,comparison,note);body.append(row);}
      table.append(body);return table;
    }
    function renderSectorVisuals() {
      const host=document.getElementById('sector-visuals');host.replaceChildren();
      if(selectedSector==='agri'){
        for(const [id,title] of [['ag_corn_harvest','Maïs US · rythme de récolte'],['ag_soy_harvest','Soja US · rythme de récolte']]){
          const item=byId[id];if(!item)continue;const card=line('','section','card crop-panel');card.append(line(title,'h3'));
          const reference=Number.isFinite(item.change)?item.value-item.change:null;
          for(const [label,value,color] of [['Mesuré · '+period(item.as_of),item.value,false],['Moyenne cinq ans',reference,true]]){
            if(!Number.isFinite(value))continue;const bar=line('','div','crop-compare'),caption=line('','div','crop-label');caption.append(line(label,'span'),line(number(value,0)+' %','b'));
            const track=line('','div','crop-track'),fill=line('','i',color?'reference':'');fill.style.width=Math.max(0,Math.min(100,value))+'%';track.append(fill);bar.append(caption,track);card.append(bar);}
          card.append(line('Échelle 0–100 % · USDA NASS'+(stale(item)?' · dernière archive':''),'small','chart-source'),line('Une récolte rapide peut accélérer l’arrivée de grain. La qualité finale et la météo restent à surveiller.','p'));host.append(card);
        }
      } else if(selectedSector==='metals'){
        for(const [title,rows] of [['Cuivre · facteurs à confronter',[
          ['Stocks disponibles','Une baisse des inventaires peut signaler une disponibilité plus tendue.'],['Demande industrielle','Comparer activité manufacturière et consommation ; aucun chiffre quotidien collecté ici.'],['Mines & transport','Perturbations d’offre à confirmer par des publications datées.']]],
          ['Aluminium · facteurs à confronter',[
          ['Électricité','Coût et disponibilité de l’énergie peuvent modifier la production des fonderies.'],['Stocks LME','Inventaires et métal effectivement livrable à consulter sur la source.'],['Production annuelle','Repère USGS de long terme ; aucune conclusion de séance automatique.']]]]){
          const card=line('','section','card factor-card');card.append(line(title,'h3'));const list=line('','div','factor-list');
          rows.forEach(([label,note])=>{const row=line('','div');row.append(line(label,'b'),line(note,'small'));list.append(row);});card.append(list);host.append(card);}
      }
    }

    function renderMeasureGuide() {
      document.getElementById('sector-news').hidden=!['oil','gas'].includes(selectedSector);
      const details=document.getElementById('measure-reading'),paragraph=details.querySelector('p');
      const guides={
        oil:'Stocks en M bbl : millions de barils. Flux en M bbl/j : millions de barils par jour. Le WPSR mesure les États-Unis ; la production norvégienne éclaire la mer du Nord. Le spot EIA est un prix physique quotidien publié avec retard.',
        gas:'AGSI+ mesure le gaz stocké (% ou TWh), ALSI le GNL en cuves et l’émission vers le réseau (GWh/j). Un stock et un débit décrivent deux choses différentes. Soutirage net positif = stock qui se réduit. Comparer les mêmes saisons.',
        agri:'WASDE : prévisions de bilan, révisables chaque mois. M bu = millions de boisseaux, Mt = millions de tonnes. Crop Progress : enquête d’état et d’avancement ; conditions vs N−1, récolte vs moyenne cinq ans. Les liens météo restent des sources à consulter.',
        metals:'USGS : tonnages annuels estimés. Un chiffre de production ne mesure pas le métal disponible immédiatement. Inventaires LME, coûts électriques et demande industrielle doivent être vérifiés séparément.'
      };
      paragraph.textContent=guides[selectedSector];
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
      const main=sorted.filter(item=>preferred.includes(item.id));
      if(main.length)box.append(metricsTable(main));
      const others = sorted.filter(item => !preferred.includes(item.id));
      if (others.length) {
        const details = line('', 'details', 'metrics-more');
        details.style.gridColumn = '1 / -1';
        details.append(line('Autres mesures datées (' + others.length + ')', 'summary'));
        details.append(metricsTable(others));box.append(details);
      }
      if (!box.children.length) box.append(line('Aucune valeur vérifiée disponible pour ce secteur.', 'p', 'empty'));
      document.querySelectorAll('.filters button').forEach(button => button.classList.toggle('active', button.dataset.sector === selectedSector));
      renderTakeaways();
      renderSignals();
      renderTrend();renderSectorVisuals();renderMeasureGuide();
      const context = document.getElementById('sector-context');
      const notes = {
        oil: 'Stocks US : variation hebdomadaire, pertinente surtout pour le WTI. Production norvégienne : repère européen mensuel, pétrole et liquides confondus. Le Brent en séance figure dans Marchés ; le spot EIA ci-dessous est daté.',
        gas: 'Les injections et soutirages suivent une saisonnalité. Compare les stocks France au même moment sur les quatre années, puis les émissions GNL et le soutirage net. Le prix PEG/TTF peut réagir à d’autres nouvelles en même temps.',
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
      const daily=window.CockpitPowerMetrics.summarize(points),complete=!!daily;
      document.getElementById('market-power-now').textContent=active?number(active.value,2)+' €':'—';
      document.getElementById('market-power-tomorrow').textContent=complete?
        number(daily.mean,2)+' €':'Après l’enchère';
      const verified=powerPrices.live_checked_at||powerPrices.generated_at;
      document.getElementById('market-power-note').textContent=verified ?
        'Prix fixés la veille · source '+(powerPrices.live_checked_at?'vérifiée ':'archivée ')+
        parisTime(verified)+' · €/MWh' : 'Prix day-ahead en attente.';
    }

    function renderPowerPrices() {
      renderPowerSeasonal();
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
      const summary=items=>window.CockpitPowerMetrics.summarize(items);
      const complete=items=>summary(items)!==null;
      const todayAverage = complete(todayDelivery) ?
        summary(todayDelivery).mean : null;
      const average = complete(delivery) ? summary(delivery).mean : null;
      const peak = average!==null ? delivery.reduce((a,b)=>a.value>b.value?a:b) : null;
      const countNegative = delivery.filter(p=>p.value<0).length;
      const previous = current && fr.find(p=>Date.parse(p.at)===Date.parse(current.at)-86400000);
      const latestCheck = powerPrices.live_checked_at || powerPrices.generated_at || snapshot.generated_at;
      const age = Date.now()-Date.parse(latestCheck||0);
      const direct = Boolean(powerPrices.live_checked_at) && age<10*60000;
      status.textContent = direct ? 'Prix · API vérifiée '+parisTime(latestCheck) :
        complete(todayDelivery) ? 'Prix · day-ahead d’aujourd’hui connu' : 'Prix · archive '+(latestCheck?parisTime(latestCheck):'sans date');
      status.className = 'badge '+(direct || complete(todayDelivery) ? 'good' : 'warn');
      hero.textContent=current ? number(current.value,2) : '—';
      heroTime.textContent=current ? 'Livraison '+parisTime(current.at) : 'Créneau actuel non publié';
      heroDelta.textContent=current&&previous ? 'Même créneau il y a 24 h : '+
        (current.value-previous.value>=0?'+':'')+number(current.value-previous.value,2)+
        ' €/MWh · comparaison des enchères' : 'Prix fixé lors de l’enchère de la veille · pas une cotation intraday.';
      const yesterday=localDay(Date.parse(today+'T12:00:00Z')-86400000);
      const yesterdayDelivery=fr.filter(p=>localDay(p.at)===yesterday);
      const yesterdayMean=complete(yesterdayDelivery)?summary(yesterdayDelivery).mean:null;
      const nextPublished=average!==null;
      const shownDay=nextPublished?delivery:todayDelivery;
      const shownMean=nextPublished?average:todayAverage;
      const compareMean=nextPublished?todayAverage:yesterdayMean;
      const shownPeak=shownDay.length?shownDay.reduce((a,b)=>a.value>b.value?a:b):null;
      for (const [title,value,detail] of [
        [nextPublished?'Demain · moyenne France':'Aujourd’hui · moyenne France',
          shownMean!==null?number(shownMean,2)+' €/MWh':'Non publié',
          nextPublished?delivery.length+' créneaux publiés':'Demain : publication de l’enchère en attente'],
        [nextPublished?'Demain vs aujourd’hui':'Aujourd’hui vs hier',shownMean!==null&&compareMean!==null?
          (shownMean>=compareMean?'+':'')+number(shownMean-compareMean,2)+' €/MWh':'Comparaison en attente',
          'Moyennes des journées de livraison'],
        ['France − DE-LU · maintenant',current&&counterpart?
          number(current.value-counterpart.value,2)+' €/MWh':'Créneau non reçu',
          current&&counterpart?'Même livraison · positif = France plus chère':'Dernière synchronisation à relancer'],
        [nextPublished?'Demain · point haut':'Aujourd’hui · point haut',shownPeak?number(shownPeak.value,2)+' €/MWh':'Non publié',
          shownPeak?parisTime(shownPeak.at)+' · '+shownDay.filter(p=>p.value<0).length*interval+' min négatives':'Source indisponible']
      ]) {
        const card=line('','article');card.append(line(title,'small'),line(value,'strong'),line(detail,'span'));cards.append(card);
      }
      if(shownMean!==null){
        const hour=p=>Number(new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Paris',hour:'2-digit',hourCycle:'h23'}).format(new Date(p.at)));
        for(const [from,to] of [[0,6],[6,12],[12,18],[18,24]]){
          const block=shownDay.filter(p=>hour(p)>=from&&hour(p)<to);
          if(!block.length)continue;
          const mean=block.reduce((sum,p)=>sum+p.value,0)/block.length;
          const tile=line('','article');tile.append(
            line((nextPublished?'Demain · ':'Aujourd’hui · ')+String(from).padStart(2,'0')+'–'+String(to).padStart(2,'0')+' h','small'),
            line(number(mean,1)+' €/MWh','strong'),
            line('de '+number(Math.min(...block.map(p=>p.value)),0)+' à '+number(Math.max(...block.map(p=>p.value)),0)+' · '+block.length+' créneaux','span'));
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
        shownMean!==null ? 'Aujourd’hui : '+number(shownMean,2)+' €/MWh en moyenne'+(compareMean!==null?' ('+(shownMean>=compareMean?'+':'')+number(shownMean-compareMean,2)+' €/MWh face à hier).':'.')+' Le profil de demain n’est pas encore reçu.' : 'Profil de livraison incomplet : aucune moyenne journalière publiée ici.';
      evidence.textContent=(current&&counterpart ? 'France − DE-LU sur le créneau livré : '+
        (current.value-counterpart.value>=0?'+':'')+number(current.value-counterpart.value,2)+' €/MWh. ' : '')+
        (average!==null ? countNegative*interval+' minute(s) à prix négatif demain. ' : '')+
        'Prix de l’enchère, pas des transactions intraday en cours.';
      const addAlert=(label,value,note,warm=false)=>{
        const tile=line('','article','power-alert'+(warm?' warm':''));
        tile.append(line(label,'small'),line(value,'strong'),line(note,'span'));alerts.append(tile);
      };
      const shownDirection=shownMean!==null&&compareMean!==null?shownMean-compareMean:null;
      if(shownDirection!==null)addAlert(nextPublished?'DEMAIN VS AUJOURD’HUI':'AUJOURD’HUI VS HIER',
        (shownDirection>=0?'+':'')+number(shownDirection,2)+' €/MWh',
        'Moyennes des journées de livraison complètes',Math.abs(shownDirection)>=20);
      if(shownPeak&&shownMean!==null)addAlert(nextPublished?'POINTE DE DEMAIN':'POINTE D’AUJOURD’HUI',
        number(shownPeak.value,2)+' €/MWh','Livraison '+parisTime(shownPeak.at)+' · '+
          number(shownPeak.value-shownMean,1)+' €/MWh au-dessus de la moyenne',shownPeak.value-shownMean>=50);
      if(current&&counterpart)addAlert('ÉCART FRANCE / DE-LU',
        (current.value-counterpart.value>=0?'+':'')+number(current.value-counterpart.value,2)+' €/MWh',
        'Même créneau de livraison · positif = France plus chère',Math.abs(current.value-counterpart.value)>=20);
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
      document.getElementById('market-updated').textContent='Collecte : '+parisTime(snapshot.generated_at);
      const curve = document.getElementById('power-curve');
      curve.replaceChildren(line('Collecte RTE en attente.','span'));
      for (const fn of [renderStatus,renderWatch,renderAgenda,renderMini,renderReleases,
                        renderStories,renderSector,renderPower,renderPowerHistory,renderPowerPrices,renderGasPrices,renderMarketBrief]) {
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
    document.getElementById('market-refresh').addEventListener('click',async()=>{
      const button=document.getElementById('market-refresh');button.disabled=true;button.textContent='Vérification…';
      try{await refreshSnapshot();await refreshPowerDirect(true);}
      finally{button.disabled=false;button.textContent='Rafraîchir ↻';}
    });
    window.addEventListener('resize',()=>{
      if(!document.getElementById('physical').hidden)renderTrend();
      if(marketChartMode==='history'&&!document.getElementById('markets').hidden)renderMarketHistory();
      if(!document.getElementById('power').hidden)renderPowerSeasonal();
    });
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
  
    function setMarketMode(mode) {
      marketChartMode=mode;
      document.getElementById('market-chart').hidden=mode==='history';
      document.getElementById('market-native-chart').hidden=mode!=='history';
      for(const [id,value] of [['chart-live-mode','live'],['chart-history-mode','history']]){
        const button=document.getElementById(id);button.classList.toggle('active',mode===value);button.setAttribute('aria-pressed',String(mode===value));}
      document.getElementById('chart-mode-note').textContent=mode==='history'?'Données datées · disponibles hors connexion':'Cotation indicative du fournisseur';
      renderChart(marketChartIndex);
    }
    function renderMarketHistory() {
      const host=document.getElementById('market-native-chart'),choice=charts[marketChartIndex];host.replaceChildren();
      const name={Brent:'brent',WTI:'wti'}[choice.name];
      document.getElementById('market-chart-title').textContent=choice.name+' · historique spot publié';
      if(!name){host.append(line('Pas d’historique quotidien vérifié pour cet instrument dans le cockpit.','p','empty'));return;}
      const points=(snapshot.history?.oil_prices?.[name]||[]).filter(p=>Date.parse(p.date)>=Date.now()-365*86400000);
      const last=points.at(-1);if(last)host.append(line(number(last.value,2)+' $/bbl · '+period(last.date),'h2'));
      const chart=line('','div');host.append(chart);timeChart(chart,{title:choice.name+' spot · 12 mois',unit:'$/bbl',series:[{name:choice.name,points}],maxGap:5});
      host.append(line('Spot physique EIA · publié avec retard. Les jours sans observation restent absents. Source : '+(snapshot.sources?.oil_price_history?.provenance||'FRED / EIA')+'.','p'));
    }
    function renderMarketBrief() {
      const host=document.getElementById('market-brief');host.replaceChildren();
      for(const [id,title] of [['oil_crude','Brut US · disponibilité'],['gas_fr','Stockage France · coussin gaz'],['ag_world_wheat','Blé · bilan mondial']]){
        const item=byId[id];if(!item)continue;const box=line('','article','brief-item');
        box.append(line(title,'small'),line(number(item.value,digits(item))+' '+item.unit+' · '+changeText(item),'strong'),line(period(item.as_of)+' · '+item.source+(stale(item)?' · archive':''),'p'));host.append(box);
      }
    }
    document.getElementById('chart-live-mode').addEventListener('click',()=>setMarketMode('live'));
    document.getElementById('chart-history-mode').addEventListener('click',()=>setMarketMode('history'));
    function updateClock() {document.getElementById('header-clock').textContent=new Intl.DateTimeFormat('fr-FR',{
      day:'2-digit',month:'short',hour:'2-digit',minute:'2-digit',timeZone:'Europe/Paris'}).format(new Date())+' · Paris';}
    updateClock();setInterval(updateClock,60000);
    document.getElementById('export-data').addEventListener('click',()=>{
      const fields=['id','label','value','unit','change','comparison','as_of','source','url'];
      const quote=value=>'"'+String(value??'').replaceAll('"','""')+'"';
      const csv='\uFEFF'+[fields,...metrics.map(item=>fields.map(key=>item[key]))].map(row=>row.map(quote).join(';')).join('\r\n');
      const url=URL.createObjectURL(new Blob([csv],{type:'text/csv;charset=utf-8;'})),link=line('','a');
      link.href=url;link.download='commodity-cockpit-'+parisDay()+'.csv';document.body.append(link);link.click();link.remove();setTimeout(()=>URL.revokeObjectURL(url),1000);
    });

})();
