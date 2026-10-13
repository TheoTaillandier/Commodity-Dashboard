/* Observe the provider's real response; do not substitute a different instrument. */
const {chromium}=require('playwright');
const fs=require('node:fs/promises');
const http=require('node:http');
const path=require('node:path');

(async()=>{
  const html=await fs.readFile('index.html');
  const server=http.createServer((req,res)=>{res.writeHead(200,{'Content-Type':'text/html; charset=utf-8'});res.end(html);});
  await new Promise(resolve=>server.listen(0,'127.0.0.1',resolve));
  const url='http://127.0.0.1:'+server.address().port;
  const browser=await chromium.launch({headless:true});
  const reports=[];
  try{
    const page=await browser.newPage({viewport:{width:1440,height:1000}});
    await page.route('**/*',route=>{
      const target=new URL(route.request().url());
      const permitted=target.hostname==='127.0.0.1'||/(^|\.)(tradingview\.com|tradingview-widget\.com|tvwdb\.com)$/.test(target.hostname);
      return permitted?route.continue():route.abort();
    });
    await page.goto(url,{waitUntil:'domcontentloaded'});
    for(const [group,name] of [['Énergie','Brent'],['Énergie','TTF'],['Énergie','LNG JKM'],['Métaux','Cuivre LME'],['Métaux','Aluminium LME'],['Agriculture','Blé France'],['Agriculture','Maïs France'],['Agriculture','Blé US'],['Agriculture','Café'],['FX','EURJPY'],['Énergie'],['Agriculture','Blé indicatif'],['Agriculture','Maïs indicatif'],['Agriculture','Café indicatif'],['Agriculture','Cacao indicatif']]){
      await page.locator('#chart-groups').getByRole('button',{name:group,exact:true}).click();
      await page.locator('#chart-picks').getByRole('button',{name,exact:true}).click();
      // Bound each provider observation, including a refusal or network failure.
      if(!await page.locator('.market-external-access').count())await page.waitForTimeout(6500);
      const iframe=page.locator('#market-chart iframe');
      let text=await page.locator('#market-chart').innerText(),frameURL=null;
      if(await iframe.count()){
        const frame=await (await iframe.first().elementHandle()).contentFrame();
        if(frame){frameURL=frame.url();text=await frame.locator('body').innerText({timeout:3000}).catch(()=> 'Frame unreadable');}
      }
      const report={instrument:name,source:await page.locator('#market-chart-link').getAttribute('href'),frameURL,
        message:text.slice(0,700),refused:/only available on tradingview|not available|not supported|cannot be displayed|unavailable|uniquement sur TradingView|symbole n.existe pas|intégration.*refusée/i.test(text),
        widgetPresent:(await iframe.count())>0};
      reports.push(report);
      await page.locator('.chart').screenshot({path:path.join('ui-report','live-'+name.replaceAll(/[^a-z0-9]/gi,'-')+'.png')});
    }
    await fs.writeFile('ui-report/live-widgets.json',JSON.stringify(reports,null,2));
    console.log('PROVIDER OBSERVATIONS: '+JSON.stringify(reports));
  }finally{await browser.close();await new Promise(resolve=>server.close(resolve));}
})().catch(error=>{console.error(error);process.exitCode=1;});
