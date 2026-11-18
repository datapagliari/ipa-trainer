"""Find exact word recordings for the current catalog in the local archive."""
import json
import re
import tarfile
from pathlib import Path
from urllib.parse import unquote

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "data/word_sample"
examples = json.loads((ROOT / "dataset/examples.json").read_text(encoding="utf-8"))
wanted = {(e["language"], e["example_word"].lower()) for e in examples}
found = []
with open(r"D:\wiktionary-audios.tar", "rb", buffering=8*1024*1024) as archive:
 with tarfile.open(fileobj=archive, mode="r|", bufsize=1024*1024) as tar:
  for count, member in enumerate(tar, 1):
   if not member.isfile(): continue
   name = unquote(Path(member.name).name)
   stem = re.sub(r"(\.wav)?\.ogg(\.mp3)?$", "", name, flags=re.I)
   if stem == name: continue
   if name.startswith("LL-"):
    lang = next((k for k,c in [("en","eng"),("fr","fra"),("de","deu")] if "("+c+")" in name), None)
    word = stem.split("-",3)[-1]
   else:
    lang = stem[:2].lower()
    word = stem.split("-",1)[-1]
    if lang == "en":
     word = re.sub(r"^(us|uk|au)-", "", word, flags=re.I)
   if (lang, word.lower()) in wanted:
    found.append(dict(language=lang, word=word, name=name, member=member.name, offset=member.offset_data, size=member.size))
   if count % 200000 == 0: print(count, len(found), flush=True)
(DEST / "catalog_candidates.json").write_text(json.dumps(found,indent=2,ensure_ascii=False),encoding="utf-8")
print("Finished",len(found),"candidates",flush=True)
