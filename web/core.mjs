export const segments = {
 en_esh_ship:[0,2,'consonante inicial'], en_tesh_chip:[0,2,'consonante inicial'], en_dzh_judge:[0,1,'consonante inicial'],
 en_theta_thin:[0,2,'consonante inicial'], en_eth_this:[0,2,'consonante inicial'], en_ih_ship:[2,3,'vocal'],
 en_ee_sheep:[2,4,'vocal'], en_ae_cat:[1,2,'vocal'], en_ah_cut:[1,2,'vocal'], en_schwa_about:[0,1,'vocal inicial'],
 fr_y_tu:[1,2,'vocal'], fr_o_deux:[1,3,'vocal'], fr_oe_soeur:[1,2,'vocal'], fr_nasal_a_sans:[1,3,'vocal nasal'],
 fr_nasal_e_vin:[1,3,'vocal nasal'], fr_nasal_o_bon:[1,3,'vocal nasal'], de_ich_ch:[1,3,'consonante final'],
 de_bach_x:[2,4,'consonante final'], de_ts_zeit:[0,1,'consonante inicial'], de_pf_pferd:[0,2,'consonante inicial']
};
export function shuffle(items, random=Math.random){return [...items].map(v=>({v,n:random()})).sort((a,b)=>a.n-b.n).map(x=>x.v);}
export function chooseWeighted(items, progress, random=Math.random){
 const weights=items.map(s=>progress[s.id]?.streak>=3?0.5:1);
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
 // Conservar los objetivos que ya practicó el usuario antes de los desbloqueos.
 for(const s of sounds)if(progress[s.id]?.legacyUnlocked||(!progress[s.id]?.unlockVersion&&((progress[s.id]?.correct||0)+(progress[s.id]?.wrong||0)>0)))unlocked.add(s.id);
 let rewards=earned;
 for(const id of order){if(rewards>0&&!unlocked.has(id)){unlocked.add(id);rewards--;}}
 return unlocked;
}
