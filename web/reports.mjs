const storageKey = 'ipa-lab-audio-reports-v1';
let serverReports = [];
let syncQueue = Promise.resolve();
let dialog, form, context, comment, error, list, count, replay, current;
const make = (tag, text, className) => {
 const node = document.createElement(tag);
 if (text !== undefined) node.textContent = text;
 if (className) node.className = className;
 return node;
};

function loadReports() {
 const rows = JSON.parse(localStorage.getItem(storageKey) || '[]');
 if (!Array.isArray(rows)) throw Error('Invalid report storage');
 return [...new Map([...serverReports,...rows].map(row=>[row.id,row])).values()];
}

function syncReports() {
 const attempt = syncQueue.catch(()=>{}).then(async () => {
  const local = loadReports();
  for (let offset=0;offset<local.length;offset+=100) {
   const response=await fetch('/api/audio-reports',{
    method:'POST',headers:{'Content-Type':'application/json'},
    body:JSON.stringify(local.slice(offset,offset+100))
   });
   if(!response.ok)throw Error('Report file unavailable');
  }
  const response=await fetch('/api/audio-reports',{cache:'no-store'});
  if(!response.ok)throw Error('Report file unavailable');
  const saved=await response.json();
  if(!Array.isArray(saved))throw Error('Invalid report file');
  serverReports=saved;
  // Keep an offline copy, including old browser-only notes.
  try { localStorage.setItem(storageKey,JSON.stringify(loadReports())); } catch {}
  refresh();
 });
 syncQueue=attempt;
 return attempt;
}

function refresh() {
 list.replaceChildren();
 try {
  const reports = loadReports();
  count.textContent = 'Audio reports (' + reports.length + ')';
  for (const report of [...reports].reverse()) {
   const row = make('article', undefined, 'saved-report');
   row.append(make('strong', report.word || '/' + report.symbol + '/'),
    make('small', new Date(report.createdAt).toLocaleString()),
    make('p', report.comment));
   list.append(row);
  }
  if (!reports.length) list.append(make('p', 'No saved reports yet.'));
 } catch {
  error.textContent = 'Unable to read saved reports in this browser.';
 }
}

export function attachAudioReport(button, metadata) {
 button.title = (button.title ? button.title + ' · ' : '') + 'Right-click to report audio';
 button.addEventListener('contextmenu', event => {
  event.preventDefault();
  current = {...metadata};
  context.textContent = (metadata.word || '/' + metadata.symbol + '/') +
   (metadata.language ? ' · ' + metadata.language : '');
  comment.value = '';
  comment.setCustomValidity('');
  error.textContent = '';
  form.hidden = false;
  refresh();
  dialog.showModal();
  comment.focus();
 });
}

export function initAudioReports(playFile) {
 dialog = make('dialog', undefined, 'report-dialog');
 dialog.setAttribute('aria-labelledby', 'report-heading');
 const heading = make('h2', 'Audio reports');
 heading.id = 'report-heading';
 const close = make('button', 'Close', 'text-button');
 close.type = 'button';
 close.onclick = () => dialog.close();
 const header = make('div', undefined, 'panel-heading');
 header.append(heading, close);
 form = make('form');
 context = make('p', undefined, 'report-context');
 replay = make('button', '▶ Play audio', 'audio-button');
 replay.type = 'button';
 replay.onclick = () => playFile(current.audio, current.repeatPreview);
 const label = make('label', 'What needs improving?');
 comment = make('textarea');
 comment.required = true;
 comment.maxLength = 2000;
 comment.rows = 4;
 label.append(comment);
 const save = make('button', 'Save report', 'primary');
 save.type = 'submit';
 form.append(context, replay, label, save);
 error = make('p', undefined, 'report-status');
 error.setAttribute('role', 'status');
 form.onsubmit = async event => {
  event.preventDefault();
  if (!comment.value.trim()) {
   comment.setCustomValidity('Please add a comment.');
   comment.reportValidity();
   return;
  }
  try {
   const reports = loadReports();
   reports.push({...current, comment: comment.value.trim(),
    id: crypto.randomUUID(), createdAt: new Date().toISOString()});
   localStorage.setItem(storageKey, JSON.stringify(reports));
   form.hidden = true;
   error.textContent = 'Saving report…';
   refresh();
   try {
    await syncReports();
    error.textContent = 'Report saved to the local file.';
   } catch {
    error.textContent = 'Saved in this browser. Restart IPA Trainer to sync the local file.';
   }
  } catch {
   error.textContent = 'Unable to save. Keep your comment and try again.';
  }
 };
 comment.oninput = () => comment.setCustomValidity('');
 list = make('div', undefined, 'report-list');
 const download = make('button', 'Export reports', 'text-button');
 download.type = 'button';
 download.onclick = () => {
  try {
   const blob = new Blob([JSON.stringify(loadReports(), null, 2)], {type:'application/json'});
   const url = URL.createObjectURL(blob);
   const link = make('a');
   link.href = url;
   link.download = 'ipa-audio-reports.json';
   link.click();
   setTimeout(() => URL.revokeObjectURL(url), 1000);
  } catch { error.textContent = 'Unable to export reports.'; }
 };
 dialog.append(header, form, error, download, list);
 document.body.append(dialog);
 count = document.getElementById('audio-reports');
 count.onclick = () => {
  form.hidden = true;
  error.textContent = '';
  refresh();
  dialog.showModal();
  syncReports().catch(()=>{
   error.textContent='Local file unavailable. Browser reports are safe; restart IPA Trainer to sync.';
  });
 };
 refresh();
 syncReports().catch(()=>{});
}
