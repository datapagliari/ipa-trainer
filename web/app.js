import {segments,shuffle,chooseWeighted,recordAnswer,symbolOptions,nextSessionStreak,unlockedIds} from './core.mjs?v=5';
const $=id=>document.getElementById(id), key='ipa-lab-progress-v1';
const languages={en:'Inglés',fr:'Francés',de:'Alemán'};
let config={},symbolAudio={},sounds=[],manifest={},progress={},question=null,answered=false,playing=null,storageOK=true,sessionStreak=0;
try{const stored=JSON.parse(localStorage.getItem(key)||'{}'); for(const [id,v] of Object.entries(stored)){if(v&&['streak','correct','wrong'].every(k=>Number.isInteger(v[k])&&v[k]>=0)) progress[id]={...v,legacyUnlocked:Boolean(v.legacyUnlocked||(!v.unlockVersion&&(v.correct+v.wrong>0))),everApproved:Boolean(v.everApproved||v.streak>=3)};}}catch{storageOK=false;}
const el=(tag,text,cls)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;if(cls)e.className=cls;return e;};
function save(){try{localStorage.setItem(key,JSON.stringify(progress));}catch{storageOK=false;}}
function stopAudio(){if(playing){playing.pause();playing.currentTime=0;playing=null;}}
function playFile(audio){stopAudio();playing=new Audio(audio);playing.play().catch(()=>{$('hint').textContent='No se pudo reproducir este archivo. Podés continuar en Palabra → símbolo.';});}
function play(sound){playFile(manifest[sound.id].audio);}
function audioButton(sound,label='▶ Escuchar palabra'){const b=el('button',label,'audio-button');b.onclick=()=>play(sound);return b;}
function highlighted(sound){const [start,end]=segments[sound.id];const word=el('div',undefined,'word');word.append(document.createTextNode(sound.example_word.slice(0,start)),el('mark',sound.example_word.slice(start,end)),document.createTextNode(sound.example_word.slice(end)));return word;}
function showDetail(sound){const box=$('detail');box.replaceChildren();const heading=el('div');heading.append(el('span','/'+sound.symbol+'/','detail-symbol'),el('span',sound.example_word,'detail-word'));box.append(el('p',languages[sound.language],'eyebrow'),heading,el('p',sound.note,'detail-note'),el('p','Palabra completa: /'+sound.word_ipa+'/'));
 if(manifest[sound.id]){box.append(audioButton(sound));}else box.append(el('span','Audio pendiente','pending'));
 document.querySelectorAll('.tile').forEach(b=>b.classList.toggle('selected',b.dataset.id===sound.id));}
function renderProgress(){
 const unlocked=unlockedIds(sounds,progress,config);
 const count=sounds.filter(s=>progress[s.id]?.streak>=3).length;
 $('mastered').textContent=count+' / '+sounds.length;$('progress').value=count;$('progress').max=sounds.length;
 $('collection').replaceChildren();
 for(const sound of sounds){
  const locked=!unlocked.has(sound.id),approved=progress[sound.id]?.streak>=3;
  const button=el('button',undefined,'tile'+(approved?' approved':'')+(locked?' locked':''));
  button.append(el('span',sound.symbol));if(locked)button.append(el('small','🔒'));
  button.dataset.id=sound.id;button.title=languages[sound.language]+' · '+(locked?'Bloqueado':sound.example_word+' · '+(progress[sound.id]?.streak||0)+'/3');
  button.setAttribute('aria-label',button.title);
  button.onclick=()=>{if(locked){$('detail').replaceChildren(el('p','Aprendé otro sonido con 3 aciertos para desbloquear más.'));}else showDetail(sound);};
  $('collection').append(button);
 }
}
function answer(value){if(answered||!question)return;answered=true;const correct=value===question.symbol;const before=unlockedIds(sounds,progress,config);progress=recordAnswer(progress,question.id,correct);const newlyUnlocked=sounds.filter(s=>!before.has(s.id)&&unlockedIds(sounds,progress,config).has(s.id));sessionStreak=nextSessionStreak(sessionStreak,correct);save();document.querySelectorAll('.option').forEach(b=>{b.disabled=true;b.classList.toggle('correct',b.dataset.value===question.symbol);b.classList.toggle('wrong',b.dataset.value===value&&!correct);});const streak=progress[question.id].streak;const result=correct?'¡Bien! Racha: '+sessionStreak+' · Sonido: '+streak+'/3':'Era /'+question.symbol+'/. Volvé a intentarlo.';
 const counter=$('sound-streak');if(counter)counter.textContent='Sonido: '+streak+'/3 · Racha: '+sessionStreak;
 $('feedback').textContent=result+(newlyUnlocked.length?' · Nuevo: '+newlyUnlocked.map(s=>'/'+s.symbol+'/').join(' '):'');$('next').hidden=false;renderProgress();showDetail(question);}
function newQuestion(){stopAudio();answered=false;$('feedback').textContent='';$('next').hidden=true;const mode=$('mode').value,lang=$('language').value;const unlocked=unlockedIds(sounds,progress,config);const all=sounds.filter(s=>unlocked.has(s.id)&&(lang==='all'||s.language===lang));const pool=mode==='visual'?all:all.filter(s=>manifest[s.id]);const box=$('exercise');box.replaceChildren();$('hint').textContent=storageOK?'':'Progreso temporal: el navegador no permite guardarlo.';
 if(!pool.length||(mode==='sound'&&pool.length<2)){question=null;box.append(el('p','Todavía no hay suficientes audios para este idioma. Probá Todos los idiomas o Palabra → símbolo.','empty'));return;}
 question=chooseWeighted(pool,progress);const meta=el('div',undefined,'question-meta');meta.append(el('span',languages[question.language]+' · '+(mode==='visual'?'Práctica visual':'Práctica con audio')),Object.assign(el('span','Sonido: '+(progress[question.id]?.streak||0)+'/3 · Racha: '+sessionStreak),{id:'sound-streak'}));box.append(meta);
 if(mode==='sound'){
  box.append(el('h2','¿Qué palabra contiene este sonido?','question-title'),el('div','/'+question.symbol+'/','word'),el('p','Escuchá las opciones y elegí.','target-label'));
  const candidates=shuffle([question,...shuffle(pool.filter(s=>s.symbol!==question.symbol)).slice(0,3)]);const options=el('div',undefined,'sound-options');candidates.forEach((s,i)=>{const card=el('div',undefined,'sound-card');card.append(audioButton(s,'▶ Opción '+(i+1)));const b=el('button','Elegir '+(i+1),'option');b.dataset.value=s.symbol;b.onclick=()=>answer(s.symbol);card.append(b);options.append(card);});box.append(options);
 }else{
  const target=segments[question.id][2];box.append(el('h2',mode==='visual'?'¿Qué símbolo representa la parte marcada?':'¿Qué símbolo escuchás en la '+target+'?','question-title'));
  if(mode==='visual'){box.append(highlighted(question),el('p',target.charAt(0).toUpperCase()+target.slice(1),'target-label'));if(manifest[question.id])box.append(audioButton(question));else box.append(el('p','Pronunciación pendiente','pending word-pending'));}
  else{box.append(audioButton(question,'▶ Escuchar palabra'),el('p','Identificá solo la '+target+'.','target-label'));}
  const options=el('div',undefined,'options');symbolOptions(question).forEach((symbol,i)=>{const b=el('button',undefined,'option');b.dataset.value=symbol;b.append(el('small',String(i+1)),document.createTextNode(symbol));b.onclick=()=>answer(symbol);const card=el('div',undefined,'symbol-card');const preview=el('button','▶','symbol-preview');preview.setAttribute('aria-label','Escuchar /'+symbol+'/');preview.title=symbolAudio[symbol]?'Escuchar /'+symbol+'/':'Audio pendiente';preview.disabled=!symbolAudio[symbol];preview.onclick=()=>playFile(symbolAudio[symbol].audio);card.append(b,preview);options.append(card);});box.append(options);
 }
 // No mostrar pistas ni transcripción de la pregunta antes de responder.
 $('detail').replaceChildren(el('p','Elegí un símbolo del recorrido.'));
}
function renderCredits(){const box=$('credits');box.append(el('h2','Grabaciones y atribución'));for(const [id,m] of [...Object.entries(manifest),...Object.entries(symbolAudio)]){const s=sounds.find(s=>s.id===id);const row=el('p');row.append(document.createTextNode(`${s?.example_word||id} — ${m.author} — `));for(const [label,url] of [[m.license,m.license_url],['Fuente',m.source_url]]){if(url&&/^https?:/.test(url)){const a=el('a',label);a.href=url;a.target='_blank';a.rel='noopener';row.append(a,document.createTextNode(' · '));}else row.append(document.createTextNode(label+' · '));}row.append(document.createTextNode('Cambios: '+m.changes+'. Revisión auditiva pendiente.'));box.append(row);}box.append(el('p','La práctica visual asocia grafías con símbolos: no mide reconocimiento auditivo. Se señala una correspondencia escrita aproximada, no un recorte temporal del audio.'));
}
$('mode').onchange=newQuestion;$('language').onchange=newQuestion;$('next').onclick=newQuestion;
$('reset').onclick=()=>{if(confirm('¿Borrar el progreso de este navegador?')){progress={};sessionStreak=0;save();renderProgress();newQuestion();}};
$('credits-toggle').onclick=()=>{$('credits').hidden=!$('credits').hidden;};
document.addEventListener('keydown',e=>{if(['SELECT','INPUT','BUTTON'].includes(document.activeElement.tagName))return;if(/^[1-4]$/.test(e.key)&&!answered){const b=document.querySelectorAll('.option')[Number(e.key)-1];b?.click();}else if(e.key==='Enter'&&answered)newQuestion();});
try{const responses=await Promise.all([fetch('dataset/sounds.json',{cache:'no-store'}),fetch('dataset/audio_manifest.json',{cache:'no-store'}),fetch('dataset/config.json',{cache:'no-store'}),fetch('dataset/symbol_audio.json',{cache:'no-store'})]);if(responses.some(r=>!r.ok))throw Error('dataset');[sounds,manifest,config,symbolAudio]=await Promise.all(responses.map(r=>r.json()));renderProgress();renderCredits();newQuestion();}catch{$('exercise').append(el('p','No se pudieron cargar los datos. Abrí el juego con start.cmd y revisá la consola del servidor.','empty'));}
