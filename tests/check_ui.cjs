/* Browser verification on the compiled file, with no third-party data substitution. */
const {chromium}=require('playwright');
const fs=require('node:fs/promises');
const path=require('node:path');
const assert=require('node:assert/strict');
const http=require('node:http');

(async()=>{
  const html=await fs.readFile(path.resolve('index.html'));
  const server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({headless:true});
  const output=path.resolve('ui-report');await fs.mkdir(output,{recursive:true});
  const reports=[];
  try{
    for(const viewport of [{width:1440,height:1000},{width:390,height:844},{width:320,height:760}]){
      const page=await browser.newPage({viewport}),errors=[];
      page.on('pageerror',error=>errors.push(error.message));
      page.on('console',message=>{if(message.type()==='error'&&message.text().includes('Panneau indisponible'))errors.push(message.text());});
      // Offline is a real supported operating mode. Abort external calls;
      // retain the actual embedded data and exercise the visible fallback.
      await page.route('**/*',route=>route.request().url().startsWith(url)?route.continue():route.abort());
      await page.goto(url,{waitUntil:'domcontentloaded'});
      assert.equal(await page.locator('#live-strip .live-tile').count(),10,'Five original quotes and five additional commodities');
      assert.deepEqual(await page.locator('#live-strip .live-title span').allTextContents(),
        ['Brent','WTI','Gaz US','Or','EURUSD','Blé US','Maïs US','Café','Cacao','Aluminium']);
      if(viewport.width===1440){
        const positions=await page.locator('#live-strip .live-tile').evaluateAll(tiles=>tiles.map(tile=>{
          const box=tile.getBoundingClientRect();return {top:box.top,left:box.left};}));
        assert.ok(positions.slice(0,5).every(p=>p.top===positions[0].top),'Five cards in the first row');
        assert.ok(positions.slice(5).every(p=>p.top===positions[5].top),'Five cards in the second row');
        assert.ok(positions[5].top>positions[0].top,'New commodities are below the original five');
      }
      await page.getByRole('button',{name:'Historique publié',exact:true}).click();
      assert.ok(await page.locator('#market-native-chart svg').count(),'Market native fallback chart');
      await page.locator('#chart-live-mode').click();
      await page.locator('#live-strip').getByRole('button',{name:'Afficher le graphique Aluminium',exact:true}).click();
      assert.ok((await page.locator('#market-chart-title').innerText()).includes('Aluminium indicatif'),'Quote opens its actual CFD graph');
      for(const [group,names] of Object.entries({
        'Énergie':['Brent','WTI','Gaz US','TTF','LNG JKM'],
        'Métaux':['Cuivre LME','Aluminium LME','Or','Cuivre indicatif','Aluminium indicatif'],
        'Agriculture':['Blé US','Blé France','Maïs US','Maïs France','Café','Cacao','Blé indicatif','Maïs indicatif','Café indicatif','Cacao indicatif'],
        'FX':['EURUSD','EURGBP','EURJPY']
      })){
        await page.locator('#chart-groups').getByRole('button',{name:group,exact:true}).click();
        for(const name of names){
          await page.locator('#chart-picks').getByRole('button',{name,exact:true}).click();
          assert.ok((await page.locator('#market-chart-title').innerText()).includes(name),'Selected instrument remains identified');
          assert.ok((await page.locator('#market-chart-link').getAttribute('href')).includes('symbol='),'Exact source symbol is accessible');
          assert.equal(await page.locator('#chart-picks [aria-pressed="true"]').count(),1,'One selected instrument');
        }
      }
      await page.locator('#chart-groups').getByRole('button',{name:'Énergie',exact:true}).click();
      await page.locator('#chart-picks').getByRole('button',{name:'TTF',exact:true}).click();
      await page.locator('#chart-history-mode').click();
      assert.ok((await page.locator('#market-native-chart').innerText()).includes('moyennes mensuelles'),'TTF fallback is monthly, never live');
      await page.locator('#chart-picks').getByRole('button',{name:'Brent',exact:true}).click();
      for(const tab of ['markets','physical','power']){
        await page.locator('[data-page="'+tab+'"]').click();
        const sectors=tab==='physical'?['oil','gas','agri','metals']:[null];
        for(const sector of sectors){
          if(sector)await page.locator('[data-sector="'+sector+'"]').click();
          const state=await page.evaluate(()=>({
            width:innerWidth,scrollWidth:document.documentElement.scrollWidth,
            badLinks:document.querySelectorAll('a[href="null"]').length,
            missingValues:[...document.querySelectorAll('table td strong')].filter(e=>/NaN|undefined/.test(e.textContent)).length,
            visiblePage:document.querySelector('.page:not([hidden])').id,
            annualCurves:document.querySelector('.page:not([hidden])').querySelectorAll('.year-line').length
          }));
          assert.equal(state.visiblePage,tab);
          assert.ok(state.scrollWidth<=state.width+1,'Page overflow '+JSON.stringify(state));
          assert.equal(state.badLinks,0,'Source URLs must remain valid');
          assert.equal(state.missingValues,0,'No invalid numeric values');
          if(sector)assert.ok(await page.locator('#metrics tbody tr').count(),'Official measurements are visible');
          if((sector==='oil'||tab==='power'))assert.ok(state.annualCurves>=3,'Three years of genuine observations');
          if(sector==='oil'){
            const positions=await page.evaluate(()=>['seasonal-physical','comparison-chart','oil-stock-seasonal'].map(id=>document.getElementById(id).getBoundingClientRect().top));
            assert.ok(positions[0]<positions[1]&&positions[1]<positions[2],'Brent annual, Brent/WTI, stocks order');
            assert.equal(await page.locator('#oil-stock-seasonal .year-line').count(),4,'Four actual years of crude inventories');
            assert.ok(!(await page.locator('#oil-stock-seasonal .seasonal-comparisons').innerText()).includes('Non publié'),'Four weekly comparisons use the closest comparable week');
            await page.locator('#comparison-chart .spread-panel summary').click();
            await page.locator('#comparison-chart .spread-panel svg').waitFor({state:'visible'});
            assert.equal(await page.locator('#comparison-chart .spread-panel svg').count(),1,'Brent/WTI spot spread is available');
          }
          if(sector==='agri'){
            for(const [focus,label,expected] of [['fr','Grains France','FranceAgriMer'],['coffee','Café','USDA FAS'],['cocoa','Cacao','ICCO']]){
              await page.locator('#agri-filters').getByRole('button',{name:label,exact:true}).click();
              assert.ok((await page.locator('#metrics').innerText()).includes(expected),'Real '+label+' physical measurements');
              assert.ok(await page.locator('#metrics tbody tr').count(),'Physical source values are present');
              const width=await page.evaluate(()=>document.documentElement.scrollWidth);
              assert.ok(width<=viewport.width+1,'Agricultural submarket overflow');
              if(viewport.width!==320)await page.screenshot({path:path.join(output,[viewport.width,'physical',focus].join('-')+'.png'),fullPage:true});
              reports.push({viewport,tab,sector,focus,scrollWidth:width});
            }
            await page.locator('#agri-filters').getByRole('button',{name:'Grains US',exact:true}).click();
          }
          if(tab==='power'){
            assert.equal(await page.locator('#power-grid article').count(),6,'Six physical indicators including exchanges');
            assert.ok(await page.locator('#power-mix .mix-stack span').count(),'Production mix shares');
            assert.equal(await page.locator('#power-price-span').getByRole('button',{name:'1 an',exact:true}).count(),0,'No year option for a short price archive');
            assert.equal(await page.locator('#power-span').getByRole('button',{name:'1 an',exact:true}).count(),0,'No year option for a short physical archive');
            for(const market of ['Belgique','Italie du Nord','DE-LU']){
              await page.locator('#power-market-picks').getByRole('button',{name:market,exact:true}).click();
              assert.ok((await page.locator('#power-comparison-title').innerText()).includes(market));
              assert.ok((await page.locator('#power-price-meta').innerText()).includes('périodes du marché comparé'),'Comparator has actual embedded data');
              assert.equal(await page.locator('#power-price-chart svg').count(),1);
            }
            await page.locator('#power-spread-panel summary').click();
            await page.locator('#power-spread-chart svg').waitFor({state:'visible'});
            assert.equal(await page.locator('#power-spread-chart svg').count(),1,'Aligned delivery price spread is available');
            const positions=await page.evaluate(()=>['power-seasonal','power-grid','power-prices-panel'].map(id=>document.getElementById(id).getBoundingClientRect().top));
            assert.ok(positions[0]<positions[1]&&positions[1]<positions[2],'Annual and physical balance are above European comparison');
          }
          await page.evaluate(()=>window.scrollTo({top:0,behavior:'instant'}));
          if(viewport.width!==320)await page.screenshot({path:path.join(output,[viewport.width,tab,sector||'overview'].join('-')+'.png'),fullPage:true});
          reports.push({viewport,tab,sector,...state});
        }
      }
      assert.deepEqual(errors,[],'No uncaught UI exception');
      // The export is hidden on mobile, so only test it on desktop.
      if(viewport.width===1440){const downloadPromise=page.waitForEvent('download');await page.getByRole('button',{name:'Exporter CSV ↓',exact:true}).click();const download=await downloadPromise;await download.saveAs(path.join(output,'measurements.csv'));}
      await page.close();
    }
    await fs.writeFile(path.join(output,'checks.json'),JSON.stringify(reports,null,2));
    console.log('UI VERIFIED: '+reports.length+' page/viewport checks; official tables, annual charts, offline mode, no overflow.');
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
