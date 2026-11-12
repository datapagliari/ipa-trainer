import assert from 'node:assert/strict';
import {readFileSync,existsSync} from 'node:fs';
import {loadProgress,progressKey,practicePool,withExample,recordAnswer,chooseWeighted,symbolOptions,nextSessionStreak,unlockedIds} from '../web/core.mjs';
const root=new URL('../',import.meta.url);
const sounds=JSON.parse(readFileSync(new URL('dataset/targets.json',root),'utf8'));
const manifest=JSON.parse(readFileSync(new URL('dataset/audio_manifest.json',root),'utf8'));
let p={};
for(let i=0;i<3;i++) p=recordAnswer(p,'target',true);
assert.equal(p.target.streak,3);
p=recordAnswer(p,'target',true);assert.equal(p.target.streak,3);
p=recordAnswer(p,'target',false);assert.equal(p.target.streak,0);assert.equal(p.target.correct,4);assert.equal(p.target.wrong,1);
const pool=[{id:'learned'},{id:'new'}];
assert.equal(chooseWeighted(pool,{learned:{streak:3}},()=>0.24).id,'learned');
assert.equal(chooseWeighted(pool,{learned:{streak:3}},()=>0.26).id,'new');
const examples=JSON.parse(readFileSync(new URL('dataset/examples.json',root),'utf8'));
for(const s of sounds){const options=symbolOptions(s);assert.equal(options.length,4);assert.ok(options.includes(s.symbol));assert.equal(new Set(options).size,4);}
for(const example of examples){const [start,end,label]=example.segment;assert.ok(start>=0&&end>start&&end<=example.example_word.length&&label);}
const highlight=id=>{const e=examples.find(e=>e.id===id);return e.example_word.slice(...e.segment.slice(0,2));};
assert.equal(highlight('en_esh_ship'),'sh');
assert.equal(highlight('en_ih_ship'),'i');
const recordings=Object.fromEntries(Object.entries(manifest).filter(([,m])=>m.available!==false));
for(const m of Object.values(recordings)){assert.ok(existsSync(new URL(m.audio,root)));assert.equal(readFileSync(new URL(m.audio,root)).subarray(0,4).toString(),'OggS');assert.ok(m.source_url&&m.license&&m.author);}
console.log('OK: streaks, mistakes, weighting, word segments, distractors, and audio files.');

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

// A learned target has one third of an active target's weight.
const learnedState={learned:{streak:3,correct:3,wrong:0}};
const sampled={learned:0,new:0};
for(let i=0;i<400;i++)sampled[chooseWeighted(pool,learnedState,()=>(i+.5)/400).id]++;
assert.deepEqual(sampled,{learned:100,new:300});
const restored=recordAnswer(learnedState,'learned',false);
assert.equal(chooseWeighted(pool,restored,()=>.49).id,'learned');
assert.equal(chooseWeighted(pool,restored,()=>.51).id,'new');
assert.equal(chooseWeighted(pool,{},()=>.49).id,'learned');
assert.equal(chooseWeighted(pool,{},()=>.51).id,'new');
assert.equal(chooseWeighted(pool,learnedState,()=>.49,1).id,'learned');
assert.equal(chooseWeighted(pool,learnedState,()=>.51,1).id,'new');
assert.equal(config.approved_weight_multiplier,1/3);
console.log('OK: equal initial weights, one-third review weight, reset on error, and configurable reduction.');

const mapping=JSON.parse(readFileSync(new URL('dataset/legacy_targets.json',root),'utf8'));
const oldSave={
 en_esh_ship:{correct:4,wrong:1,streak:0,everApproved:true,unlockVersion:1},
 de_ts_zeit:{correct:1,wrong:0,streak:1},
 fr_y_tu:{correct:3,wrong:0,streak:3}
};
const storage=new Map([['ipa-lab-progress-v1',JSON.stringify(oldSave)]]);
const browserStorage={getItem:key=>storage.get(key)??null};
const migrated=loadProgress(browserStorage,mapping);
assert.equal(migrated.esh.everApproved,true);
assert.equal(migrated.esh.streak,0);
assert.equal(migrated['ts-affricate'].legacyUnlocked,true);
const oldOrder=config.unlock_order.map(id=>Object.keys(mapping).find(key=>mapping[key]===id));
const oldUnlocked=unlockedIds(Object.keys(mapping).map(id=>({id})),oldSave,{...config,unlock_order:oldOrder});
assert.deepEqual(unlockedIds(sounds,migrated,config),new Set([...oldUnlocked].map(id=>mapping[id])));
storage.set(progressKey,'{}');
assert.deepEqual(loadProgress(browserStorage,mapping),{});
assert.deepEqual(JSON.parse(storage.get('ipa-lab-progress-v1')),oldSave);

const available=unlockedIds(sounds,{},config);
const visual=practicePool(sounds,examples,available,'all',recordings,'visual');
const original=practicePool(sounds,examples.filter(e=>e.id!=='en_esh_shoe'),available,'all',recordings,'visual');
assert.equal(visual.length,6);
for(let i=0;i<100;i++)assert.equal(chooseWeighted(visual,migrated,()=>i/100).id,chooseWeighted(original,migrated,()=>i/100).id);
const sh=visual.find(s=>s.id==='esh');
const ship=withExample(sh,()=>0),shoe=withExample(sh,()=>.99);
assert.equal(ship.example_word,'ship');assert.equal(shoe.example_word,'shoe');
let practice={};
for(const item of [ship,shoe,ship,shoe])practice=recordAnswer(practice,item.id,true);
assert.equal(practice.esh.streak,3);assert.equal(unlockedIds(sounds,practice,config).size,7);
for(const mode of ['listen','sound']){
 const german=practicePool(sounds,examples,available,'de',recordings,mode);
 assert.equal(german.length,2);
 for(const item of german)assert.ok(recordings[withExample(item).recording_id]);
}
console.log('OK: v1 backup, v2 precedence, unlock migration, multiple examples and filtered audio modes.');
