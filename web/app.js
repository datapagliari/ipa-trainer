import {attachAudioReport,initAudioReports} from './reports.mjs?v=20';
import {classificationPool,comparisonPartners,freshTargets,practicePool,withExample,progressKey,loadProgress,shuffle,chooseWeighted,recordAnswer,symbolOptions,nextSessionStreak,unlockedIds} from './core.mjs?v=19';
const $=id=>document.getElementById(id);
const autoplayKey = 'ipa-lab-autoplay';
let autoplayClips = [];
try { $('autoplay').checked = localStorage.getItem(autoplayKey) === 'true'; } catch {}
function playAutoplay() {
 if (!$('autoplay').checked || !autoplayClips.length) return;
 const clips = [...autoplayClips];
 function playNext() {
  if (!$('autoplay').checked || !clips.length) return;
  const clip = clips.shift();
  playFile(clip.audio, clip.repeat, playNext);
 }
 playNext();
}
$('autoplay').onchange = () => {
 try { localStorage.setItem(autoplayKey, String($('autoplay').checked)); } catch {}
 if ($('autoplay').checked) playAutoplay();
 else stopAudio();
};
const historyKey = 'ipa-lab-recent-symbols';
let recentSymbols = [];
try {
 const saved = JSON.parse(sessionStorage.getItem(historyKey));
 if (Array.isArray(saved)) recentSymbols = saved.slice(-10);
} catch {}
function remember(symbol) {
 recentSymbols = [...recentSymbols, symbol].slice(-10);
 try { sessionStorage.setItem(historyKey, JSON.stringify(recentSymbols)); } catch {}
}
const languages={en:'English',fr:'French',de:'German'};
let optionNotes={},config={},symbolAudio={},sounds=[],examples=[],manifest={},progress={},question=null,answered=false,playing=null,storageOK=true,sessionStreak=0;
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
function save(){try{localStorage.setItem(progressKey,JSON.stringify(progress));}catch{storageOK=false;}}
let previewTimer;
function stopAudio(){clearTimeout(previewTimer);if(playing){playing.onended=null;playing.pause();playing.currentTime=0;playing=null;}}
function playFile(audio, repeat = false, onComplete){
 stopAudio();
 const clip = new Audio(audio);
 playing = clip;
 if (repeat) clip.onended = () => {
  clip.onended = null;
  previewTimer = setTimeout(() => {
   if (playing === clip) {
    clip.currentTime = 0;
    clip.onended = onComplete || null;
    clip.play().catch(() => {});
   }
  }, 300);
 };
 if (!repeat) clip.onended = onComplete || null;
 playing.play().catch(()=>{$('hint').textContent='Unable to play this file. Try Word → symbol.';});}
function play(sound){playFile(manifest[sound.recording_id].audio);}
function audioButton(sound,label='▶ Play word'){
 const b=el('button',label,'audio-button');
 b.onclick=()=>play(sound);
 attachAudioReport(b,{
  kind:'word', recordingId:sound.recording_id, audio:manifest[sound.recording_id].audio,
  sourceUrl:manifest[sound.recording_id].source_url,
  word:sound.example_word, language:sound.language, ipa:sound.word_ipa,
  symbol:sound.symbol, targetId:sound.target_id||sound.id,
  exampleId:sound.exampleId||sound.id, mode:$('mode').value
 });
 return b;
}
function symbolPreview(symbol) {
 const preview=el('button','▶','symbol-preview');
 const recording=symbolAudio[symbol];
 preview.type='button';
 preview.setAttribute('aria-label','Play /'+symbol+'/');
 preview.title=recording?'Play /'+symbol+'/':'Audio pending';
 preview.disabled=!recording;
 if(recording){
  preview.onclick=()=>playFile(recording.audio,recording.repeat_preview);
  attachAudioReport(preview,{
   kind:'symbol',symbol,audio:recording.audio,sourceUrl:recording.source_url,
   repeatPreview:Boolean(recording.repeat_preview),mode:$('mode').value,word:null
  });
 }
 return preview;
}
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
 $('feedback').textContent=result+(newlyUnlocked.length?' · Unlocked: '+newlyUnlocked.map(s=>'/'+s.symbol+'/').join(' '):'');$('next').disabled=false;renderProgress();showDetail(question);}
function comparisonQuestion(pool, box) {
 const same = Math.random() < 0.5;
 const candidates = freshTargets(pool, recentSymbols).map(target => ({
  ...target, examples: target.examples.filter(example =>
   comparisonPartners({...example, ...target}, pool, same).length)
 })).filter(target => target.examples.length);
 if (!candidates.length) {
  question = null;
  box.append(el('p','No new pair available with these filters. Try all languages or Symbol quiz.','empty'));
  const resume = el('button','Continue with Symbol quiz','audio-button');
  resume.onclick = () => { $('mode').value='visual'; $('language').value='all'; newQuestion(); };
  box.append(resume);
  return;
 }
 question = withExample(chooseWeighted(candidates,progress,Math.random,config.approved_weight_multiplier));
 const partners = comparisonPartners(question,pool,same);
 const partner = partners[Math.floor(Math.random()*partners.length)];
 remember(question.symbol);
 box.append(el('h2','Do the highlighted parts have the same sound?','question-title'));
 const cards = el('div',undefined,'sound-options');
 for (const word of [question,partner]) {
  const card = el('div',undefined,'sound-card');
  card.append(highlighted(word),el('p',languages[word.language]+' · '+word.segment[2],'target-label'),audioButton(word));
  cards.append(card);
 }
 box.append(cards);
 const options = el('div',undefined,'options');
 for (const [label,value] of [['Same',true],['Different',false]]) {
  const button = el('button',label,'option');
  button.style.fontSize='20px';
  button.onclick = () => {
   if (answered) return;
   answered = true;
   const correct = value === same;
   sessionStreak = nextSessionStreak(sessionStreak,correct);
   for (const item of options.children) {
    item.disabled = true;
    item.classList.toggle('correct',item.dataset.same===String(same));
   }
   button.classList.toggle('wrong',!correct);
   $('feedback').textContent = (correct?'Correct. ':'Listen again. ')+question.example_word+' /'+question.symbol+'/ · '+partner.example_word+' /'+partner.symbol+'/';
   $('next').disabled = false;
   renderProgress();
   showDetail(question);
  };
  button.dataset.same=String(value);
  options.append(button);
 }
 $('answers').append(options);
 autoplayClips = [question,partner].map(word => ({audio:manifest[word.recording_id].audio}));
 playAutoplay();
}
function classificationQuestion(pool, box) {
 const candidates=classificationPool(pool,recentSymbols);
 if(!candidates.length){
  question=null;
  box.append(el('p','No new sounds to sort with these filters.','empty'));
  const resume=el('button','Continue with all sounds','audio-button');
  resume.onclick=()=>{ $('mode').value='visual'; $('language').value='all'; newQuestion(); };
  box.append(resume);
  return;
 }
 question=withExample(chooseWeighted(candidates,progress,Math.random,config.approved_weight_multiplier));
 const partners=comparisonPartners(question,pool,false);
 const contrasts=partners.filter(partner=>question.confusers.includes(partner.symbol));
 const partner=shuffle(contrasts.length?contrasts:partners)[0];
 remember(question.symbol);
 box.append(el('h2','Which group does the highlighted sound belong to?','question-title'),
  highlighted(question),el('p',languages[question.language]+' · '+question.segment[2],'target-label'),
  audioButton(question));
 const groups=el('div',undefined,'classification-groups');
 for(const target of shuffle([question,partner])){
  const card=el('div',undefined,'classification-group');
  const button=el('button','/'+target.symbol+'/','option');
  button.dataset.value=target.symbol;
  button.setAttribute('aria-label','Place word in /'+target.symbol+'/ group');
  const placed=el('div',undefined,'placed-word');
  button.onclick=()=>{
   if(answered)return;
   answered=true;
   const correct=target.symbol===question.symbol;
   sessionStreak=nextSessionStreak(sessionStreak,correct);
   for(const group of groups.children){
    const choice=group.querySelector('.option');
    choice.disabled=true;
    choice.classList.toggle('correct',choice.dataset.value===question.symbol);
    if(choice.dataset.value===question.symbol){
     group.querySelector('.placed-word').textContent=question.example_word;
    }
   }
   button.classList.toggle('wrong',!correct);
   $('feedback').textContent=(correct?'Correct. ':'Listen again. ')+question.example_word+' belongs to /'+question.symbol+'/.';
   $('next').disabled=false;
   renderProgress();
   showDetail(question);
  };
  card.append(button,symbolPreview(target.symbol),placed);
  groups.append(card);
 }
 $('answers').append(groups);
 autoplayClips=[{audio:manifest[question.recording_id].audio}];
 playAutoplay();
}
function newQuestion(){stopAudio();answered=false;$('feedback').textContent='';$('next').disabled=true;autoplayClips=[];const mode=$('mode').value,lang=$('language').value;const unlocked=unlockedIds(sounds,progress,config);const eligible=practicePool(sounds,examples,unlocked,lang,manifest,mode);const pool=mode==='sound'?eligible.filter(target=>eligible.some(other=>other.id!==target.id && other.examples.some(example=>!example.word_ipa.includes(target.symbol)))):eligible;const box=$('exercise');box.replaceChildren();$('answers').replaceChildren();$('detail').replaceChildren();$('explore').hidden=true;$('hint').textContent=storageOK?'':'Progress is temporary: browser storage is unavailable.';
 $('trivia-nav').classList.toggle('active',mode!=='compare'&&mode!=='classify');
 $('compare-nav').classList.toggle('active',mode==='compare');
 $('classify-nav').classList.toggle('active',mode==='classify');
 if(mode==='classify'){classificationQuestion(eligible,box);return;}
 if(mode==='compare'){comparisonQuestion(eligible,box);return;}
 if(!pool.length||(mode==='sound'&&eligible.length<2)){question=null;box.append(el('p','Not enough recordings for this language yet. Try All languages or Word → symbol.','empty'));return;}
 const fresh = freshTargets(pool, recentSymbols);
 if (!fresh.length) {
  question = null;
  box.append(el('p','All available sounds here appeared in the last 10 turns.','empty'));
  const resume = el('button','Continue with all sounds','audio-button');
  resume.onclick = () => { $('mode').value='visual'; $('language').value='all'; newQuestion(); };
  box.append(resume);
  return;
 }
 question=withExample(chooseWeighted(fresh,progress,Math.random,config.approved_weight_multiplier??1/3));remember(question.symbol);const meta=el('div',undefined,'question-meta');meta.append(el('span',languages[question.language]+' · '+(mode==='visual'?'Visual practice':'Listening practice')),Object.assign(el('span','Sound: '+(progress[question.id]?.streak||0)+'/3 · Streak: '+sessionStreak),{id:'sound-streak'}));box.append(meta);
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
  const options=el('div',undefined,'options');symbolOptions(question).forEach((symbol,i)=>{const b=el('button',undefined,'option');b.dataset.value=symbol;b.append(el('small',String(i+1)),document.createTextNode(symbol));b.onclick=()=>answer(symbol);const card=el('div',undefined,'symbol-card');const preview=symbolPreview(symbol);card.append(b,preview);options.append(card);});$('answers').append(options);
 }
 const recording = mode==='sound' ? symbolAudio[question.symbol] : manifest[question.recording_id];
 if (recording) autoplayClips = [{audio:recording.audio, repeat:mode==='sound' && recording.repeat_preview}];
 playAutoplay();
 // Do not reveal hints or the transcription before an answer.

}
function renderCredits(){const box=$('credits');box.append(el('h2','Recordings and attribution'));for(const [id,m] of [...Object.entries(manifest),...Object.entries(symbolAudio)]){const s=examples.find(example=>example.recording_id===id);const row=el('p');row.append(document.createTextNode(`${s?.example_word||id} — ${m.author} — `));for(const [label,url] of [[m.license,m.license_url],['Source',m.source_url]]){if(url&&/^https?:/.test(url)){const a=el('a',label);a.href=url;a.target='_blank';a.rel='noopener';row.append(a,document.createTextNode(' · '));}else row.append(document.createTextNode(label+' · '));}row.append(document.createTextNode('Changes: '+m.changes+(m.listening_validated?'. Listening reviewed.':'. Listening review pending.')));box.append(row);}box.append(el('p','Visual practice connects spelling with symbols; it does not test listening recognition. Highlights show approximate spelling correspondences, not audio timestamps.'));
}
$('classify-nav').onclick=()=>{ $('mode').value='classify'; newQuestion(); };
$('compare-nav').onclick=()=>{ $('mode').value='compare'; newQuestion(); };
$('trivia-nav').onclick=()=>{ $('mode').value='visual'; newQuestion(); };
$('mode').onchange=newQuestion;$('language').onchange=newQuestion;$('next').onclick=newQuestion;
$('reset').onclick=()=>{if(confirm('Clear learned sounds and streaks? You will start again with '+config.initial_active_count+' unlocked sounds.')){progress={};recentSymbols=[];sessionStreak=0;$('language').value='all';$('mode').value='visual';save();renderProgress();newQuestion();}};
$('credits-toggle').onclick=()=>{$('credits').hidden=!$('credits').hidden;$('credits-toggle').setAttribute('aria-expanded',String(!$('credits').hidden));};
document.addEventListener('keydown',e=>{if(['SELECT','INPUT','TEXTAREA','BUTTON'].includes(document.activeElement.tagName))return;if(/^[1-4]$/.test(e.key)&&!answered){const b=document.querySelectorAll('.option')[Number(e.key)-1];b?.click();}else if(e.key==='Enter'&&answered)newQuestion();});
initAudioReports(playFile);
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
