import {practicePool,withExample,progressKey,loadProgress,shuffle,chooseWeighted,recordAnswer,symbolOptions,nextSessionStreak,unlockedIds} from './core.mjs?v=12';
const $=id=>document.getElementById(id);
const languages={en:'English',fr:'French',de:'German'};
let optionNotes={},config={},symbolAudio={},sounds=[],examples=[],manifest={},progress={},question=null,answered=false,playing=null,storageOK=true,sessionStreak=0;
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
function save(){try{localStorage.setItem(progressKey,JSON.stringify(progress));}catch{storageOK=false;}}
function stopAudio(){if(playing){playing.pause();playing.currentTime=0;playing=null;}}
function playFile(audio){stopAudio();playing=new Audio(audio);playing.play().catch(()=>{$('hint').textContent='Unable to play this file. Try Word → symbol.';});}
function play(sound){playFile(manifest[sound.recording_id].audio);}
function audioButton(sound,label='▶ Play word'){const b=el('button',label,'audio-button');b.onclick=()=>play(sound);return b;}
function highlighted(sound){const [start,end]=sound.segment;const word=el('div',undefined,'word');word.append(document.createTextNode(sound.example_word.slice(0,start)),el('mark',sound.example_word.slice(start,end)),document.createTextNode(sound.example_word.slice(end)));return word;}
function showDetail(sound){$('explore').hidden=false;const box=$('detail');box.replaceChildren();const heading=el('div');heading.append(el('span','/'+sound.symbol+'/','detail-symbol'),el('span',sound.example_word,'detail-word'));box.append(el('p',languages[sound.language],'eyebrow'),heading,el('p',sound.note,'detail-note'),el('p','Full word: /'+sound.word_ipa+'/'));if(sound.definition){const meaning=el('p',undefined,'definition');meaning.append(el('strong','Meaning: '),document.createTextNode(sound.definition));box.append(meaning);}
 if(manifest[sound.recording_id]){box.append(audioButton(sound));}else box.append(el('span','Audio pending','pending'));
 document.querySelectorAll('.tile').forEach(b=>b.classList.toggle('selected',b.dataset.id===sound.id));}
function renderProgress(){
 const unlocked=unlockedIds(sounds,progress,config);
 const count=sounds.filter(s=>progress[s.id]?.streak>=3).length;
 $('mastered').textContent=count+' / '+sounds.length;$('unlocked-count').textContent=unlocked.size+' / '+sounds.length;$('session-streak').textContent=sessionStreak;$('progress').value=count;$('progress').max=sounds.length;
 $('collection').replaceChildren();
 for(const target of sounds){
  const example=examples.find(item=>item.target_id===target.id);
  const sound={...example,...target};
  const locked=!unlocked.has(sound.id),approved=progress[sound.id]?.streak>=3;
  const button=el('button',undefined,'tile'+(approved?' approved':'')+(locked?' locked':''));
  button.append(el('span',sound.symbol));if(approved)button.append(el('small','✓','learned-badge'));if(locked)button.append(el('small','🔒'));
  button.dataset.id=sound.id;button.title=languages[sound.language]+' · '+(locked?'Locked':sound.example_word+' · '+(progress[sound.id]?.streak||0)+'/3');
  if(approved)button.title+=' · Learned';button.setAttribute('aria-label',button.title);
  button.onclick=()=>{if(locked){$('explore').hidden=false;$('detail').replaceChildren(el('p','Learn a sound with 3 correct answers to unlock more.'));}else showDetail(sound);};
  $('collection').append(button);
 }
}
function enableOptionNote(button, index) {
 const symbol = button.dataset.value;
 const target = sounds.find(item => item.symbol === symbol);
 const matches = examples.filter(item => item.target_id === target?.id);
 const example = matches.find(item => item.id === button.dataset.example) ??
  matches.find(item => item.language === question.language) ?? matches[0] ?? optionNotes[symbol];
 if (!example) return;
 const tip = el('div', undefined, 'option-tip');
 tip.id = 'option-note-' + index;
 tip.setAttribute('role', 'tooltip');
 tip.hidden = true;
 tip.append(el('strong', '/' + symbol + '/ · ' + example.example_word),
  el('small', languages[example.language]), el('p', example.note),
  el('p', 'Full word: /' + example.word_ipa + '/'), el('p', 'Meaning: ' + example.definition));
 button.after(tip);
 button.disabled = false;
 button.classList.add('review-option');
 button.setAttribute('aria-describedby', tip.id);
 const open = () => {
  document.querySelectorAll('.option-tip').forEach(other => { other.hidden = other !== tip; });
 };
 button.onpointerenter = event => { if (event.pointerType !== 'touch') open(); };
 button.onfocus = open;
 button.onclick = open;
 button.onblur = () => { tip.hidden = true; };
 button.parentElement.onpointerleave = () => { tip.hidden = true; };
 button.onkeydown = event => { if (event.key === 'Escape') tip.hidden = true; };
}

function answer(value){if(answered||!question)return;answered=true;const correct=value===question.symbol;const before=unlockedIds(sounds,progress,config);progress=recordAnswer(progress,question.id,correct);const newlyUnlocked=sounds.filter(s=>!before.has(s.id)&&unlockedIds(sounds,progress,config).has(s.id));sessionStreak=nextSessionStreak(sessionStreak,correct);save();document.querySelectorAll('.option').forEach((b,i)=>{b.disabled=true;b.classList.toggle('correct',b.dataset.value===question.symbol);b.classList.toggle('wrong',b.dataset.value===value&&!correct);if(b.dataset.value!==question.symbol)enableOptionNote(b,i);});const streak=progress[question.id].streak;const result=correct?'Nice! Streak: '+sessionStreak+' · Sound: '+streak+'/3':'It was /'+question.symbol+'/. Try again.';
 const counter=$('sound-streak');if(counter)counter.textContent='Sound: '+streak+'/3 · Streak: '+sessionStreak;
 $('feedback').textContent=result+(newlyUnlocked.length?' · Unlocked: '+newlyUnlocked.map(s=>'/'+s.symbol+'/').join(' '):'');$('next').hidden=false;renderProgress();showDetail(question);}
function newQuestion(){stopAudio();answered=false;$('feedback').textContent='';$('next').hidden=true;const mode=$('mode').value,lang=$('language').value;const unlocked=unlockedIds(sounds,progress,config);const eligible=practicePool(sounds,examples,unlocked,lang,manifest,mode);const pool=mode==='sound'?eligible.filter(target=>eligible.some(other=>other.id!==target.id && other.examples.some(example=>!example.word_ipa.includes(target.symbol)))):eligible;const box=$('exercise');box.replaceChildren();$('answers').replaceChildren();$('detail').replaceChildren();$('explore').hidden=true;$('hint').textContent=storageOK?'':'Progress is temporary: browser storage is unavailable.';
 if(!pool.length||(mode==='sound'&&eligible.length<2)){question=null;box.append(el('p','Not enough recordings for this language yet. Try All languages or Word → symbol.','empty'));return;}
 question=withExample(chooseWeighted(pool,progress,Math.random,config.approved_weight_multiplier??1/3));const meta=el('div',undefined,'question-meta');meta.append(el('span',languages[question.language]+' · '+(mode==='visual'?'Visual practice':'Listening practice')),Object.assign(el('span','Sound: '+(progress[question.id]?.streak||0)+'/3 · Streak: '+sessionStreak),{id:'sound-streak'}));box.append(meta);
 if(mode==='sound'){
  box.append(el('h2','Which word contains this sound?','question-title'),el('div','/'+question.symbol+'/','word'),el('p','Listen and choose.','target-label'));
  const alternatives = eligible.filter(target => target.id !== question.id)
   .map(target => ({...target, examples: target.examples.filter(example =>
    example.recording_id !== question.recording_id && !example.word_ipa.includes(question.symbol))}))
   .filter(target => target.examples.length);
  const candidates = shuffle([question, ...shuffle(alternatives).slice(0,3).map(target => withExample(target))]);
  const options=el('div',undefined,'sound-options');candidates.forEach((s,i)=>{const card=el('div',undefined,'sound-card');card.append(audioButton(s,'▶ Option '+(i+1)));const b=el('button','Choose '+(i+1),'option');b.dataset.value=s.symbol;b.dataset.example=s.exampleId;b.onclick=()=>answer(s.symbol);card.append(b);options.append(card);});$('answers').append(options);
 }else{
  const target=question.segment[2];box.append(el('h2',mode==='visual'?'Which symbol matches the highlighted part?':'Which symbol do you hear in the '+target+'?','question-title'));
  if(mode==='visual'){box.append(highlighted(question),el('p',target.charAt(0).toUpperCase()+target.slice(1),'target-label'));if(manifest[question.recording_id])box.append(audioButton(question));else box.append(el('p','Pronunciation pending','pending word-pending'));}
  else{box.append(audioButton(question,'▶ Play word'),el('p','Identify only the '+target+'.','target-label'));}
  const options=el('div',undefined,'options');symbolOptions(question).forEach((symbol,i)=>{const b=el('button',undefined,'option');b.dataset.value=symbol;b.append(el('small',String(i+1)),document.createTextNode(symbol));b.onclick=()=>answer(symbol);const card=el('div',undefined,'symbol-card');const preview=el('button','▶','symbol-preview');preview.setAttribute('aria-label','Play /'+symbol+'/');preview.title=symbolAudio[symbol]?'Play /'+symbol+'/':'Audio pending';preview.disabled=!symbolAudio[symbol];preview.onclick=()=>playFile(symbolAudio[symbol].audio);card.append(b,preview);options.append(card);});$('answers').append(options);
 }
 // Do not reveal hints or the transcription before an answer.

}
function renderCredits(){const box=$('credits');box.append(el('h2','Recordings and attribution'));for(const [id,m] of [...Object.entries(manifest),...Object.entries(symbolAudio)]){const s=examples.find(example=>example.recording_id===id);const row=el('p');row.append(document.createTextNode(`${s?.example_word||id} — ${m.author} — `));for(const [label,url] of [[m.license,m.license_url],['Source',m.source_url]]){if(url&&/^https?:/.test(url)){const a=el('a',label);a.href=url;a.target='_blank';a.rel='noopener';row.append(a,document.createTextNode(' · '));}else row.append(document.createTextNode(label+' · '));}row.append(document.createTextNode('Changes: '+m.changes+(m.listening_validated?'. Listening reviewed.':'. Listening review pending.')));box.append(row);}box.append(el('p','Visual practice connects spelling with symbols; it does not test listening recognition. Highlights show approximate spelling correspondences, not audio timestamps.'));
}
$('mode').onchange=newQuestion;$('language').onchange=newQuestion;$('next').onclick=newQuestion;
$('reset').onclick=()=>{if(confirm('Clear progress in this browser?')){progress={};sessionStreak=0;save();renderProgress();newQuestion();}};
$('credits-toggle').onclick=()=>{$('credits').hidden=!$('credits').hidden;$('credits-toggle').setAttribute('aria-expanded',String(!$('credits').hidden));};
document.addEventListener('keydown',e=>{if(['SELECT','INPUT','BUTTON'].includes(document.activeElement.tagName))return;if(/^[1-4]$/.test(e.key)&&!answered){const b=document.querySelectorAll('.option')[Number(e.key)-1];b?.click();}else if(e.key==='Enter'&&answered)newQuestion();});
try {
 const files = ['targets','examples','audio_manifest','config','symbol_audio','legacy_targets','option_notes'];
 const data = await Promise.all(files.map(async name => {
  const response = await fetch('dataset/'+name+'.json',{cache:'no-store'});
  if (!response.ok) throw Error(name);
  return response.json();
 }));
 const [targets, words, recordings, settings, previews, legacyTargets, extraNotes] = data;
 optionNotes = extraNotes;
 sounds = targets;
 examples = words;
 config = settings;
 symbolAudio = previews;
 manifest = Object.fromEntries(Object.entries(recordings).filter(([,record]) => record.available !== false));
 try { progress = loadProgress(localStorage, legacyTargets); } catch { storageOK = false; }
 renderProgress();renderCredits();newQuestion();}catch{$('exercise').append(el('p','Unable to load the data. Run start.cmd and check the server output.','empty'));}

document.querySelectorAll('.rail-link').forEach(link=>link.addEventListener('click',()=>{document.querySelectorAll('.rail-link').forEach(item=>item.classList.toggle('active',item===link));}));
