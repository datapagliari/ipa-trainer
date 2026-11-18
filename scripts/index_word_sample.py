"""Index candidate word recordings without extracting the archive."""
import json
import re
import tarfile
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
WORDS = {
 "en": set("ship sheep shoe thin bath thick three teeth this they those chip chair cheese judge jam juice cat map hat cut sun cup about ago feet see sit fish big book good moon food blue red bed pen".split()),
 "fr": set("tu lune rue sur deux feu peu bleu sœur peur fleur beurre sans blanc grand vin pain main bon nom pont".split()),
 "de": set("ich Licht Milch nicht Buch Bach Dach Nacht Pferd Pfanne Pfund Zeit Zahn zehn".split())
}
words = {k: {w.lower(): w for w in v} for k,v in WORDS.items()}
pattern = re.compile(r"-(?P<word>[^-]+?)(?:\.wav)?\.ogg(?:\.mp3)?$", re.I)
found = []
dest = ROOT / "data/word_sample"
dest.mkdir(parents=True, exist_ok=True)
with open(r"D:\wiktionary-audios.tar", "rb", buffering=8*1024*1024) as archive:
 with tarfile.open(fileobj=archive, mode="r|", bufsize=1024*1024) as tar:
  for count, member in enumerate(tar, 1):
   if not member.isfile(): continue
   name = unquote(Path(member.name).name)
   lower = name.lower()
   lang = lower[:2] if lower[:3] in ("en-","fr-","de-") else next((k for k,c in [("en","eng"),("fr","fra"),("de","deu")] if "("+c+")" in lower), None)
   if lang:
    match = pattern.search(name)
    if match and match["word"].lower() in words[lang] and (not name.startswith("LL-") or re.sub(r"(\.wav)?\.ogg(\.mp3)?$", "", name.split("-",3)[-1], flags=re.I).lower() == match["word"].lower()):
     found.append(dict(language=lang, word=words[lang][match["word"].lower()], member=member.name, name=name, offset=member.offset_data, size=member.size))
   if count % 100000 == 0:
    print(count, len(found), flush=True)
(dest / "candidates.json").write_text(json.dumps(found,ensure_ascii=False,indent=2),encoding="utf-8")
print("Finished",count,"entries",len(found),"recordings",flush=True)
