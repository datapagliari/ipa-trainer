"""Attach exact-word archive recordings to examples that still lack audio."""
import html
import json
import re
import subprocess
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load(name):
    return json.loads((ROOT / "dataset" / (name + ".json")).read_text(encoding="utf-8"))


def save(name, value):
    path = ROOT / "dataset" / (name + ".json")
    temp = path.with_suffix(".tmp")
    temp.write_text(json.dumps(value, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")
    temp.replace(path)


def main():
    examples = load("examples")
    manifest = load("audio_manifest")
    candidates = json.loads((ROOT / "data/word_sample/catalog_candidates.json").read_text(encoding="utf-8"))
    selected = {}
    for example in examples:
        existing = manifest.get(example.get("recording_id"), {})
        if existing and existing.get("available", True) and (ROOT / existing["audio"]).is_file():
            continue
        key = (example["language"], example["example_word"].lower())
        matches = [item for item in candidates if (item["language"], item["word"].lower()) == key]
        if not matches:
            continue
        matches.sort(key=lambda item: (not item["name"].lower().startswith("en-us-" if key[0] == "en" else key[0] + "-"), item["name"].endswith(".mp3"), item["name"]))
        selected[key] = matches[0]
    items = list(selected.values())
    metadata = {}
    for start in range(0, len(items), 25):
        titles = ["File:" + item["name"].removesuffix(".mp3") for item in items[start:start+25]]
        query = urllib.parse.urlencode(dict(action="query", format="json", prop="imageinfo", iiprop="extmetadata", titles="|".join(titles), redirects=1))
        request = urllib.request.Request("https://commons.wikimedia.org/w/api.php?" + query,
            headers={"User-Agent": "IPA-Trainer/0.1 (https://github.com/datapagliari/ipa-trainer)"})
        with urllib.request.urlopen(request, timeout=40) as response:
            data = json.load(response)["query"]
        aliases = {entry["from"]:entry["to"] for entry in data.get("normalized", []) + data.get("redirects", [])}
        pages = {page["title"]:page for page in data["pages"].values()}
        for title in titles:
            canonical = title
            for _ in range(4):
                canonical = aliases.get(canonical, canonical)
            infos = pages.get(canonical, {}).get("imageinfo", [])
            if infos:
                metadata[title] = infos[0]["extmetadata"]

    imported = {}
    with open(r"D:\wiktionary-audios.tar", "rb") as archive:
        for key, item in selected.items():
            title = "File:" + item["name"].removesuffix(".mp3")
            meta = metadata.get(title, {})
            def field(name):
                return html.unescape(re.sub("<[^>]+>", "", meta.get(name, {}).get("value", "")))
            license_name = field("LicenseShortName")
            if not (license_name.startswith("CC BY") or license_name in ("Public domain", "CC0")):
                print("License review pending:", key, flush=True)
                continue
            archive.seek(item["offset"])
            blob = archive.read(item["size"])
            assert len(blob) == item["size"]
            safe = re.sub("[^a-z0-9]+", "-", item["word"].lower()).strip("-")
            recording_id = "archive-" + key[0] + "-" + safe
            relative = "audio/" + key[0] + "/" + recording_id + ".ogg"
            if blob.startswith(b"OggS"):
                (ROOT / relative).write_bytes(blob)
                changes = "None"
            else:
                subprocess.run(["ffmpeg", "-v", "error", "-n", "-i", "pipe:0", "-c:a", "libvorbis", "-q:a", "6", str(ROOT / relative)], input=blob, check=True)
                changes = "Converted to Ogg Vorbis"
            manifest[recording_id] = dict(audio=relative, source_url="https://commons.wikimedia.org/wiki/" + urllib.parse.quote(title),
                author=field("Artist") or "Not specified in source metadata", license=license_name,
                license_url=field("LicenseUrl"), changes=changes, listening_validated=False,
                synthetic=False, archive_member=item["member"], transcription_review="Pending listening/accent review")
            imported[key] = recording_id
            print("Imported:", key, flush=True)
    # Reuse a complete recording for other learning objectives sharing this word.
    for example in examples:
        record = manifest.get(example.get("recording_id"), {})
        if record and record.get("available", True) and (ROOT / record["audio"]).is_file():
            continue
        key = (example["language"], example["example_word"].lower())
        reuse = imported.get(key)
        if not reuse:
            reuse = next((other["recording_id"] for other in examples if
                (other["language"], other["example_word"].lower()) == key and
                other.get("recording_id") in manifest and
                manifest[other["recording_id"]].get("available", True) and
                (ROOT / manifest[other["recording_id"]]["audio"]).is_file()), None)
        if reuse:
            example["recording_id"] = reuse
    save("audio_manifest", manifest)
    save("examples", examples)
    print("New word recordings:", len(imported), flush=True)


if __name__ == "__main__":
    main()
