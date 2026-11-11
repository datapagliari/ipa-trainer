import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {segments,recordAnswer,chooseWeighted,symbolOptions,nextSessionStreak,unlockedIds} from '../web/core.mjs';
const root=new URL('../',import.meta.url);
const sounds=JSON.parse(readFileSync(new URL('dataset/sounds.json',root),'utf8'));
const manifest=JSON.parse(readFileSync(new URL('dataset/audio_manifest.json',root),'utf8'));
let p={};
for(let i=0;i<3;i++) p=recordAnswer(p,'target',true);
assert.equal(p.target.streak,3);
p=recordAnswer(p,'target',true);assert.equal(p.target.streak,3);
p=recordAnswer(p,'target',false);assert.equal(p.target.streak,0);assert.equal(p.target.correct,4);assert.equal(p.target.wrong,1);
const pool=[{id:'learned'},{id:'new'}];
assert.equal(chooseWeighted(pool,{learned:{streak:3}},()=>0.32).id,'learned');
assert.equal(chooseWeighted(pool,{learned:{streak:3}},()=>0.34).id,'new');
for(const s of sounds){const [start,end,label]=segments[s.id];assert.ok(start>=0&&end>start&&end<=s.example_word.length&&label);const options=symbolOptions(s);assert.equal(options.length,4);assert.ok(options.includes(s.symbol));assert.equal(new Set(options).size,4);}
assert.equal('ship'.slice(...segments.en_esh_ship.slice(0,2)),'sh');
assert.equal('ship'.slice(...segments.en_ih_ship.slice(0,2)),'i');
for(const m of Object.values(manifest)){assert.ok(existsSync(new URL(m.audio,root)));assert.equal(readFileSync(new URL(m.audio,root)).subarray(0,4).toString(),'OggS');assert.ok(m.source_url&&m.license&&m.author);}
console.log('OK: streaks, mistakes, weighting, 20 segments, distractors, and audio files.');

// Interleaved answers advance the session while preserving per-target streaks.
let mixed={}, session=0;
for(const id of ['a','b','a']){mixed=recordAnswer(mixed,id,true);session=nextSessionStreak(session,true);}
assert.equal(session,3);assert.equal(mixed.a.streak,2);assert.equal(mixed.b.streak,1);
mixed=recordAnswer(mixed,'b',false);session=nextSessionStreak(session,false);
assert.equal(session,0);assert.equal(mixed.b.streak,0);assert.equal(mixed.a.streak,2);
console.log('OK: session streak across interleaved targets and reset on error.');

const config=JSON.parse(readFileSync(new URL('dataset/config.json',root),'utf8'));
let fresh={};assert.equal(unlockedIds(sounds,fresh,config).size,6);
const first=config.unlock_order[0];for(let i=0;i<3;i++)fresh=recordAnswer(fresh,first,true);
assert.equal(unlockedIds(sounds,fresh,config).size,7);
fresh=recordAnswer(fresh,first,false);assert.equal(unlockedIds(sounds,fresh,config).size,7);
for(let i=0;i<3;i++)fresh=recordAnswer(fresh,first,true);
assert.equal(unlockedIds(sounds,fresh,config).size,7);
const legacy={...fresh,[config.unlock_order.at(-1)]:{streak:1,correct:1,wrong:0}};
assert.ok(unlockedIds(sounds,legacy,config).has(config.unlock_order.at(-1)));
assert.equal(unlockedIds(sounds,legacy,config).size,8);
const symbols=JSON.parse(readFileSync(new URL('dataset/symbol_audio.json',root),'utf8'));
for(const m of Object.values(symbols)){assert.equal(readFileSync(new URL(m.audio,root)).subarray(0,4).toString(),'OggS');assert.ok(m.license&&m.source_url);}
console.log('OK: 6 initial targets, permanent unlocks, unique rewards, legacy progress, and symbol audio.');

let journey={};for(let i=0;i<3;i++)journey=recordAnswer(journey,first,true);
journey=recordAnswer(journey,config.unlock_order[6],true);
assert.equal(unlockedIds(sounds,journey,config).size,7,'Practicing a newly unlocked target does not unlock another');
for(let i=0;i<2;i++)journey=recordAnswer(journey,config.unlock_order[6],true);
assert.equal(unlockedIds(sounds,journey,config).size,8);
console.log('OK: unlocking requires learning, not just practicing.');
