"""Download Commons phonetic recordings. Listening review is still required."""
import html
import json
import re
import time
from download_audio import ROOT, fetch
from urllib.parse import urlencode
from urllib.error import HTTPError

FILES = {
 'ʃ':'Voiceless palato-alveolar sibilant', 's':'Voiceless alveolar sibilant',
 'tʃ':'Voiceless palato-alveolar affricate', 'ʒ':'Voiced palato-alveolar sibilant',
 'dʒ':'Voiced palato-alveolar affricate', 'θ':'Voiceless dental fricative',
 'ð':'Voiced dental fricative', 'f':'Voiceless labiodental fricative',
 't':'Voiceless alveolar plosive', 'd':'Voiced alveolar plosive',
 'z':'Voiced alveolar sibilant', 'v':'Voiced labiodental fricative',
 'ɪ':'Near-close near-front unrounded vowel', 'i':'Close front unrounded vowel',
 'e':'Close-mid front unrounded vowel', 'ə':'Mid-central vowel',
 'æ':'Near-open front unrounded vowel', 'ɛ':'Open-mid front unrounded vowel',
 'ʌ':'Open-mid back unrounded vowel', 'a':'Open front unrounded vowel',
 'ɔ':'Open-mid back rounded vowel', 'y':'Close front rounded vowel',
 'u':'Close back rounded vowel', 'ø':'Close-mid front rounded vowel',
 'œ':'Open-mid front rounded vowel', 'o':'Close-mid back rounded vowel',
 'ɑ':'Open back unrounded vowel', 'ç':'Voiceless palatal fricative',
 'x':'Voiceless velar fricative', 'h':'Voiceless glottal fricative',
 'k':'Voiceless velar plosive', 'ts':'Voiceless alveolar affricate',
 'pf':'Voiceless labiodental affricate', 'p':'Voiceless bilabial plosive',
 'b':'Voiced bilabial plosive',
}

def main():
 path=ROOT/'dataset/symbol_audio.json'
 manifest=json.loads(path.read_text(encoding='utf-8')) if path.exists() else {}
 titles=['File:'+name+'.ogg' for symbol,name in FILES.items() if symbol not in manifest]
 if not titles:
  return
 query=urlencode(dict(action='query',format='json',prop='imageinfo',iiprop='url|extmetadata',titles='|'.join(titles)))
 pages=json.loads(fetch('https://commons.wikimedia.org/w/api.php?'+query))['query']['pages']
 lookup={p['title']:p for p in pages.values()}
 for index,(symbol,name) in enumerate(FILES.items()):
  if symbol in manifest:
   continue
  try:
   info=lookup['File:'+name+'.ogg']['imageinfo'][0]
   meta=info['extmetadata']
   clean=lambda key:html.unescape(re.sub('<[^>]+>','',meta.get(key,{}).get('value','')))
   license_name=clean('LicenseShortName')
   if not (license_name.startswith('CC BY') or license_name in ('Public domain','CC0')):
    raise ValueError('Unrecognized license: '+license_name)
   data=fetch(info['url'])
   if not data.startswith(b'OggS'):
    raise ValueError('Not an Ogg file')
   audio='audio/phonemes/'+name.lower().replace(' ','_')+'.ogg'
   (ROOT/audio).write_bytes(data)
   manifest[symbol]=dict(audio=audio,source_url=info['descriptionurl'],author=clean('Artist'),license=license_name,license_url=clean('LicenseUrl'),changes='None',listening_validated=False)
   path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
   print('OK:',name,flush=True)
  except HTTPError as exc:
   print('Download stopped:',exc,flush=True)
   if exc.code == 429:
    break
  except Exception as exc:
   print('Pending:',name,str(exc),flush=True)
  time.sleep(0.8)
 path.write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

if __name__=='__main__':
 main()
