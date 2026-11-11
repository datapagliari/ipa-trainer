"""Descarga una muestra de Commons y conserva sus metadatos de atribución."""
import json
import re
from pathlib import Path
from urllib.parse import urlencode
from urllib.request import Request, urlopen

ROOT = Path(__file__).resolve().parents[1]
SAMPLES = {
    "en_theta_thin": "En-us-thin.ogg",
    "fr_y_tu": "Fr-tu.ogg",
    "de_ich_ch": "De-Ich.ogg",
    "de_pf_pferd": "De-Pferd.ogg",
}


def fetch(url):
    return urlopen(Request(url, headers={"User-Agent": "IPATrainer/0.1 (local educational prototype)"}), timeout=25).read()


def main():
    sounds = json.loads((ROOT / "dataset/sounds.json").read_text(encoding="utf-8"))
    manifest_path = ROOT / "dataset/audio_manifest.json"
    manifest = json.loads(manifest_path.read_text(encoding="utf-8")) if manifest_path.exists() else {}
    for sound in sounds:
        if sound["id"] not in SAMPLES:
            continue
        if sound["id"] in manifest and (ROOT / sound["audio"]).exists():
            continue
        try:
            query = urlencode(dict(action="query", format="json", prop="imageinfo", iiprop="url|extmetadata", titles="File:" + SAMPLES[sound["id"]]))
            pages = json.loads(fetch("https://commons.wikimedia.org/w/api.php?" + query))["query"]["pages"]
            info = next(iter(pages.values()))["imageinfo"][0]
            meta = info["extmetadata"]
            clean = lambda key: re.sub("<[^>]+>", "", meta.get(key, {}).get("value", ""))
            license_name = clean("LicenseShortName")
            if not (license_name.startswith("CC BY") or license_name in ("Public domain", "CC0")):
                raise ValueError("Licencia no reconocida: " + license_name)
            content = fetch(info["url"])
            if not content.startswith(b"OggS"):
                raise ValueError("La descarga no es un archivo Ogg")
            (ROOT / sound["audio"]).write_bytes(content)
            manifest[sound["id"]] = dict(audio=sound["audio"], source_url=info["descriptionurl"], author=clean("Artist"), license=license_name, license_url=clean("LicenseUrl"), changes="Ninguno", listening_validated=False)
            print("Descargado:", sound["id"], len(content), "bytes")
        except Exception as exc:
            print("Pendiente:", sound["id"], str(exc))
    manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


if __name__ == "__main__":
    main()
