/* Price calculations share one definition across cards and the market overview. */
(function () {
  'use strict';
  const dayFormatter=new Intl.DateTimeFormat('en-CA',{timeZone:'Europe/Paris',year:'numeric',month:'2-digit',day:'2-digit'});
  const offsetFormatter=new Intl.DateTimeFormat('en-GB',{timeZone:'Europe/Paris',timeZoneName:'shortOffset'});
  const parisDay = at => {
    const parts=Object.fromEntries(dayFormatter.formatToParts(new Date(at))
      .filter(p=>['year','month','day'].includes(p.type)).map(p=>[p.type,p.value]));
    return parts.year+'-'+parts.month+'-'+parts.day;
  };
  function midnight(day) {
    const utc=Date.parse(day+'T00:00:00Z');
    const offset=offsetFormatter.formatToParts(new Date(utc)).find(p=>p.type==='timeZoneName').value;
    const hours=Number(offset.match(/GMT([+-]\d+)/)?.[1]||0);
    return utc-hours*3600000;
  }
  function summarize(items) {
    const points=[...new Map((items||[]).filter(p=>Number.isFinite(p.value)&&Number.isFinite(Date.parse(p.at)))
      .map(p=>[Date.parse(p.at),p])).values()].sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
    if(points.length<2)return null;
    const day=parisDay(points[0].at);
    if(points.some(p=>parisDay(p.at)!==day))return null;
    const next=new Date(Date.parse(day+'T00:00Z')+86400000).toISOString().slice(0,10);
    const start=midnight(day),end=midnight(next),expected=(end-start)/60000;
    const gaps=points.slice(1).map((p,i)=>(Date.parse(p.at)-Date.parse(points[i].at))/60000)
      .filter(m=>m>0&&m<=60);
    if(!gaps.length)return null;
    const step=Math.min(...gaps);
    if(![15,30,60].includes(step))return null;
    let minutes=0,total=0,negativeMinutes=0;
    for(let i=0;i<points.length;i++){
      const at=Date.parse(points[i].at),nextAt=i+1<points.length?Date.parse(points[i+1].at):end;
      // A gap cannot stretch a quoted delivery interval into missing periods.
      const duration=Math.max(0,Math.min(step,(nextAt-at)/60000,(end-at)/60000));
      if(at<start||at>=end)continue;
      minutes+=duration;total+=duration*points[i].value;
      if(points[i].value<0)negativeMinutes+=duration;
    }
    if(minutes<expected*.99)return null;
    return {day,mean:total/minutes,minutes,expectedMinutes:expected,negativeMinutes,step};
  }
  function mergePriceArchive(archive,current) {
    if(!(Date.parse(current.live_checked_at)>Date.parse(archive.generated_at)))return archive;
    const series={};
    for(const zone of new Set([...Object.keys(archive.series||{}),...Object.keys(current.series||{})])){
      const byTime=new Map();
      for(const p of [...(archive.series?.[zone]||[]),...(current.series?.[zone]||[])]){
        const t=Date.parse(p.at);
        if(Number.isFinite(t)&&Number.isFinite(p.value))byTime.set(t,p);
      }
      series[zone]=[...byTime.values()].sort((a,b)=>Date.parse(a.at)-Date.parse(b.at));
    }
    return {...archive,series,licence:{...archive.licence,...current.licence},live_checked_at:current.live_checked_at};
  }
  const api={summarize,parisDay,mergePriceArchive};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  else window.CockpitPowerMetrics=api;
})();
