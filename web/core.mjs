export function shuffle(items, random=Math.random){return [...items].map(v=>({v,n:random()})).sort((a,b)=>a.n-b.n).map(x=>x.v);}
export function chooseWeighted(items, progress, random=Math.random, learnedWeight=1/3){
 const weights=items.map(s=>progress[s.id]?.streak>=3?learnedWeight:1);
 let n=random()*weights.reduce((a,b)=>a+b,0);
 return items.find((s,i)=>(n-=weights[i])<0)||items.at(-1);
}
export function recordAnswer(progress,id,correct){
 const old=progress[id]||{streak:0,correct:0,wrong:0};
 return {...progress,[id]:{streak:correct?Math.min(3,old.streak+1):0,correct:old.correct+(correct?1:0),wrong:old.wrong+(correct?0:1),unlockVersion:1,legacyUnlocked:Boolean(old.legacyUnlocked||(!old.unlockVersion&&((old.correct||0)+(old.wrong||0)>0))),everApproved:Boolean(old.everApproved||old.streak>=3||(correct&&old.streak+1>=3))}};
}
export function symbolOptions(sound){return shuffle([...new Set([sound.symbol,...sound.confusers])]).slice(0,4);}

export function nextSessionStreak(streak, correct){return correct ? streak + 1 : 0;}

export function unlockedIds(sounds,progress,config){
 const ids=new Set(sounds.map(s=>s.id));
 const earned=sounds.filter(s=>progress[s.id]?.everApproved||progress[s.id]?.streak>=3).length;
 const order=[...new Set([...config.unlock_order,...ids])].filter(id=>ids.has(id));
 const unlocked=new Set(order.slice(0,config.initial_active_count));
 // Keep targets practiced before unlocks were introduced.
 for(const s of sounds)if(progress[s.id]?.legacyUnlocked||(!progress[s.id]?.unlockVersion&&((progress[s.id]?.correct||0)+(progress[s.id]?.wrong||0)>0)))unlocked.add(s.id);
 let rewards=earned;
 for(const id of order){if(rewards>0&&!unlocked.has(id)){unlocked.add(id);rewards--;}}
 return unlocked;
}

// One pool entry per target, regardless of how many eligible words it has.
export function practicePool(targets, examples, unlocked, language, recordings, mode) {
 const pool = [];
 for (const target of targets) {
  if (!unlocked.has(target.id)) continue;
  const eligible = examples.filter(example =>
   example.target_id === target.id &&
   (language === 'all' || example.language === language) &&
   (mode === 'visual' || recordings[example.recording_id])
  );
  if (eligible.length) pool.push({...target, examples: eligible});
 }
 return pool;
}

export function withExample(target, random = Math.random) {
 const example = target.examples[Math.floor(random() * target.examples.length)];
 return {...example, ...target, exampleId: example.id};
}

export function migrateProgress(stored, legacyTargets) {
 const progress = {};
 for (const [oldId, id] of Object.entries(legacyTargets)) {
  const record = stored[oldId];
  if (!record || !['correct','wrong','streak'].every(key =>
   Number.isInteger(record[key]) && record[key] >= 0)) continue;
  progress[id] = {...record,
   legacyUnlocked: Boolean(record.legacyUnlocked ||
    (!record.unlockVersion && record.correct + record.wrong > 0)),
   everApproved: Boolean(record.everApproved || record.streak >= 3)
  };
 }
 return progress;
}

export const progressKey = 'ipa-lab-progress-v2';
export function loadProgress(storage, legacyTargets) {
 const current = storage.getItem(progressKey);
 if (current !== null) return JSON.parse(current);
 const previous = storage.getItem('ipa-lab-progress-v1');
 return previous === null ? {} : migrateProgress(JSON.parse(previous), legacyTargets);
}

export function freshTargets(pool, history) {
 const recent = new Set(history.slice(-10));
 return pool.filter(target => !recent.has(target.symbol));
}

export function comparisonPartners(target, pool, same) {
 return pool.filter(other => (other.symbol === target.symbol) === same)
  .flatMap(other => other.examples.map(example => ({...example, ...other, exampleId: example.id})))
  .filter(example => example.example_word !== target.example_word &&
   example.recording_id !== target.recording_id && example.language === target.language &&
   (example.segment[2].includes('vowel') === target.segment[2].includes('vowel')));
}

export function classificationPool(pool, history) {
 return freshTargets(pool, history).map(target => ({
  ...target,
  examples: target.examples.filter(example =>
   comparisonPartners({...example, ...target}, pool, false).length > 0)
 })).filter(target => target.examples.length > 0);
}
