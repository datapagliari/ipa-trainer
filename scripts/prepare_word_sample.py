"""Build a 50-word listening shortlist from the locally indexed audio archive."""
import json
import html
import urllib.request
import urllib.parse
import time
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "data/word_sample"
LANGUAGES = {"en": "English", "fr": "French", "de": "German"}


def fetch(url):
    request = urllib.request.Request(url, headers={"User-Agent": "IPA-Trainer/0.1 (https://github.com/datapagliari/ipa-trainer)"})
    with urllib.request.urlopen(request, timeout=30) as response:
        return response.read()


def main():
    candidates = json.loads((DEST / "candidates.json").read_text(encoding="utf-8"))
    selected = []
    for language, limit in [("en", 22), ("fr", 15), ("de", 13)]:
        groups = {}
        for item in candidates:
            if item["language"] == language:
                groups.setdefault(item["word"], []).append(item)
        for word, recordings in sorted(groups.items())[:limit]:
            recordings.sort(key=lambda r: (not r["name"].lower().startswith(language + "-us-" if language == "en" else language + "-"), not r["name"].endswith(".ogg"), r["name"]))
            selected.append(recordings[0].copy())
    assert len(selected) == 50, f"Only {len(selected)} matched words"
    audio_dir = DEST / "audio"
    audio_dir.mkdir(exist_ok=True)
    with open(r"D:\wiktionary-audios.tar", "rb") as archive:
        for item in selected:
            filename = item["language"] + "-" + item["word"] + Path(item["name"]).suffix
            item["file"] = "audio/" + filename
            archive.seek(item["offset"])
            blob = archive.read(item["size"])
            assert len(blob) == item["size"]
            (DEST / item["file"]).write_bytes(blob)
            result = subprocess.run(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", str(DEST / item["file"])], capture_output=True, text=True, check=True)
            item["duration"] = float(result.stdout.strip())
            word = item["word"]
            url = "https://kaikki.org/dictionary/" + LANGUAGES[item["language"]] + "/meaning/" + "/".join(urllib.parse.quote(part, safe="") for part in [word[:1], word[:2], word]) + ".jsonl"
            item["dictionary_url"] = url
            item["listening_validated"] = False
            item["ipa_candidates"] = []
            item["definitions"] = []
            item["matched_audio_records"] = []
            cache = DEST / (item["language"] + "-" + word + ".jsonl")
            try:
                if not cache.exists():
                    cache.write_bytes(fetch(url))
                    time.sleep(0.4)
                entries = [json.loads(line) for line in cache.read_text(encoding="utf-8").splitlines() if line.strip()]
                for entry in entries:
                    for sound in entry.get("sounds", []):
                        names = [urllib.parse.unquote(str(sound.get("audio", "")))]
                        names.extend(urllib.parse.unquote(urllib.parse.urlsplit(sound.get(k, "")).path.rsplit("/",1)[-1]) for k in ("ogg_url","mp3_url"))
                        if item["name"].lower() in [name.lower() for name in names]:
                            item["matched_audio_records"].append(sound)
                        if sound.get("ipa") and sound["ipa"] not in item["ipa_candidates"]:
                            item["ipa_candidates"].append(sound["ipa"])
                    for sense in entry.get("senses", []):
                        item["definitions"].extend(sense.get("glosses", []))
                item["definitions"] = item["definitions"][:3]
            except Exception as error:
                item["metadata_error"] = str(error)
            item["pairing_review"] = "IPA candidates belong to the word; exact audio/accent pairing pending."
            print(item["language"],word,"audio OK",len(item["ipa_candidates"]),"IPA candidates",flush=True)
    (DEST / "sample.json").write_text(json.dumps(selected, ensure_ascii=False, indent=2), encoding="utf-8")
    cards = []
    for item in selected:
        name = item["name"]
        source_name = name[:-4] if name.endswith(".ogg.mp3") else name
        source = "https://commons.wikimedia.org/wiki/File:" + urllib.parse.quote(source_name)
        item["source_url"] = source
        cards.append("<article><h2>" + html.escape(item["word"]) + " <small>" + item["language"] + "</small></h2><audio controls preload='none' src='" + urllib.parse.quote(item["file"]) + "'></audio><p>" + html.escape(" · ".join(item["ipa_candidates"])) + "</p><p>" + html.escape(" / ".join(item["definitions"][:1])) + "</p><a href='" + source + "'>Source and license</a><p>Listening and exact IPA pairing pending.</p></article>")
    (DEST / "sample.json").write_text(json.dumps(selected, ensure_ascii=False, indent=2), encoding="utf-8")
    page = "<!doctype html><html lang='en'><meta charset='utf-8'><meta name='viewport' content='width=device-width'><title>50-word audio shortlist</title><style>body{font:16px system-ui;background:#18221d;color:#edf3e8;margin:24px}main{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px}article{background:#2a372e;padding:18px;border-radius:16px}audio{max-width:100%}small,a{color:#d9ed99}</style><h1>50-word audio shortlist</h1><p>Local archive excerpts. Review pronunciation, accent and attribution before game integration.</p><main>" + "".join(cards) + "</main></html>"
    (DEST / "index.html").write_text(page, encoding="utf-8")
    print("Sample bytes", sum(i["size"] for i in selected), flush=True)


if __name__ == "__main__":
    main()

