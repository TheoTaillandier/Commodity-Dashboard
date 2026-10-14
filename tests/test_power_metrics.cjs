const assert=require('node:assert/strict');
const {summarize,mergePriceArchive}=require('../app/power_metrics.js');
const points=(start,hours,step=60)=>Array.from({length:hours*60/step},(_,i)=>({
  at:new Date(Date.parse(start)+i*step*60000).toISOString(),value:i}));
// Hand-calculated daily means, including the two DST transitions in Paris.
assert.equal(summarize(points('2026-03-28T23:00Z',23)).mean,11);
assert.equal(summarize(points('2026-10-24T22:00Z',25)).mean,12);
const quarters=points('2026-10-11T22:00Z',24,15);
assert.equal(summarize(quarters).mean,47.5);
assert.equal(summarize(quarters).minutes,1440);
assert.equal(summarize(quarters.filter((_,i)=>i!==20)),null);
assert.equal(summarize(quarters.slice(0,80)),null);
assert.equal(summarize([...quarters,quarters[0]]).mean,47.5);
console.log('Power browser calculations verified: DST, missing intervals, duplicates.');
const oldPoint={at:'2026-10-14T00:00:00Z',value:80};
const archive={generated_at:'2026-10-14T07:00:00Z',series:{fr:[oldPoint],de:[oldPoint],be:[oldPoint],it_north:[oldPoint]},licence:{fr:'CC BY 4.0',be:'Belgium attribution'}};
const current={live_checked_at:'2026-10-14T08:00:00Z',series:{fr:[{...oldPoint,value:90}],de:[oldPoint],be:[{at:'invalid',value:3}],it_north:[oldPoint]},licence:{fr:'French attribution'}};
const merged=mergePriceArchive(archive,current);
assert.deepEqual(Object.keys(merged.series),['fr','de','be','it_north']);
assert.equal(merged.series.fr[0].value,90);
assert.deepEqual(merged.series.be,[oldPoint]);
assert.equal(merged.licence.be,'Belgium attribution');
assert.equal(mergePriceArchive({...archive,generated_at:'2026-10-14T09:00:00Z'},current).series.fr[0].value,80);
console.log('Power synchronization preserves all markets and the newest verified values.');
