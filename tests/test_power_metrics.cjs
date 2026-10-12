const assert=require('node:assert/strict');
const {summarize}=require('../app/power_metrics.js');
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
