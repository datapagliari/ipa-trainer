"""Download Commons phonetic recordings. Listening review is still required."""
import html
import json
import re
import sys
import subprocess
import time
from datetime import datetime, timezone
from email.utils import parsedate_to_datetime
from urllib.parse import urlsplit
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
 'm':'Bilabial nasal', 'n':'Alveolar nasal',
 'l':'Alveolar lateral approximant', 'ɡ':'Voiced velar plosive',
 'ʁ':'Voiced uvular fricative', 'ɥ':'LL-Q150 (fra)-WikiLucas00-IPA ɥ.wav',
 'ʏ':'Near-close near-front rounded vowel',
 'ʊ':'Near-close near-back rounded vowel',
 'iː':'De-i',
 'ɔ̃':'Nasalised open-mid back rounded vowel',
 'ɑ̃':'Nasalised open back unrounded vowel',
 'ɛ̃':'Nasalised open-mid front unrounded vowel',
}

STATE_DIR = ROOT / "data" / "phoneme_downloads"
MANIFEST = ROOT / "dataset" / "symbol_audio.json"


def write_json(path, value):
    temp = path.with_suffix(".tmp")
    temp.write_text(json.dumps(value, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    temp.replace(path)


def report(message):
    stamp = datetime.now(timezone.utc).isoformat(timespec="seconds")
    with (STATE_DIR / "requests.log").open("a", encoding="utf-8") as log:
        print(stamp, message, file=log)
    if sys.stdout is not None:
        print(stamp, message, flush=True)


def download(symbol, name, manifest):
    title = "File:" + name + ("" if name.endswith((".wav", ".ogg")) else ".ogg")
    query = urlencode(dict(action="query", format="json", prop="imageinfo",
                           iiprop="url|extmetadata", titles=title, redirects=1))
    pages = json.loads(fetch("https://commons.wikimedia.org/w/api.php?" + query))["query"]["pages"]
    info = next(iter(pages.values())).get("imageinfo")
    if not info:
        raise ValueError("No audio at " + title)
    info = info[0]
    meta = info["extmetadata"]
    def field(key):
        return html.unescape(re.sub("<[^>]+>", "", meta.get(key, {}).get("value", "")))
    license_name = field("LicenseShortName")
    if not (license_name.startswith("CC BY") or license_name in ("Public domain", "CC0")):
        raise ValueError("Unrecognized license: " + license_name)
    blob = fetch(info["url"])
    changes = "None"
    if not blob.startswith((b"OggS", b"RIFF")):
        raise ValueError("Invalid audio data")
    audio = manifest.get(symbol, {}).get("audio") or "audio/phonemes/" + name.lower().replace(" ", "_") + ".ogg"
    path = ROOT / audio
    temp = path.with_suffix(".part")
    if blob.startswith(b"OggS"):
        temp.write_bytes(blob)
    else:
        subprocess.run(["ffmpeg", "-v", "error", "-i", "pipe:0", "-c:a", "libvorbis",
                        "-q:a", "6", "-f", "ogg", str(temp)], input=blob, check=True)
        changes = "Converted to Ogg Vorbis"
    temp.replace(path)
    manifest.setdefault(symbol, dict(audio=audio, source_url=info["descriptionurl"],
        author=field("Artist"), license=license_name, license_url=field("LicenseUrl"),
        changes=changes, listening_validated=False, supporting_vowels=None,
        repeat_preview="vowel" in name.lower()))
    write_json(MANIFEST, manifest)


def main():
    STATE_DIR.mkdir(parents=True, exist_ok=True)
    state_file = STATE_DIR / "schedule.json"
    state = json.loads(state_file.read_text(encoding="utf-8")) if state_file.exists() else {}
    if time.time() < state.get("next_attempt", 0):
        return
    manifest = json.loads(MANIFEST.read_text(encoding="utf-8"))
    targets = json.loads((ROOT / "dataset/targets.json").read_text(encoding="utf-8"))
    config = json.loads((ROOT / "dataset/config.json").read_text(encoding="utf-8"))
    initial = config["unlock_order"][:config["initial_active_count"]]
    targets.sort(key=lambda item: item["id"] not in initial)
    skipped = state.setdefault("needs_source_review", {})
    candidates = dict.fromkeys(s for t in targets for s in [t["symbol"], *t["confusers"]])
    pending = [s for s in candidates if s in FILES and s not in skipped and
               (s not in manifest or not (ROOT / manifest[s]["audio"]).is_file())]
    if not pending:
        return
    symbol = pending[0]
    try:
        download(symbol, FILES[symbol], manifest)
        report(f"/{symbol}/ saved")
        state["failures"] = 0
    except (ValueError, KeyError) as error:
        skipped[symbol] = str(error)
        report(f"/{symbol}/ needs source review: {error}")
    except OSError as error:
        failures = state.get("failures", 0) + 1
        state["failures"] = failures
        delay = min(6 * 3600, 900 * 2 ** min(failures - 1, 5))
        if isinstance(error, HTTPError):
            retry = error.headers.get("Retry-After")
            if retry:
                seconds = int(retry) if retry.isdigit() else parsedate_to_datetime(retry).timestamp() - time.time()
                delay = max(delay, seconds)
            report(f"/{symbol}/ {urlsplit(error.url).hostname} HTTP {error.code}, Retry-After={retry}")
        report(f"/{symbol}/ {error}; waiting at least {delay:.0f} seconds")
        state["next_attempt"] = time.time() + delay
    write_json(state_file, state)


if __name__ == "__main__":
    main()
