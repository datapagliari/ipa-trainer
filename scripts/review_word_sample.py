"""Complete source attribution and render the local listening shortlist."""
import html
import json
import re
import urllib.parse
import urllib.request
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
DEST = ROOT / "data/word_sample"


def main():
    path = DEST / "sample.json"
    rows = json.loads(path.read_text(encoding="utf-8"))
    for start in range(0, len(rows), 25):
        batch = rows[start:start + 25]
        titles = ["File:" + urllib.parse.unquote(row["source_url"].split("File:", 1)[1]) for row in batch]
        query = urllib.parse.urlencode(dict(action="query", format="json", prop="imageinfo",
            iiprop="extmetadata", titles="|".join(titles), redirects=1))
        request = urllib.request.Request("https://commons.wikimedia.org/w/api.php?" + query,
            headers={"User-Agent": "IPA-Trainer/0.1 (https://github.com/datapagliari/ipa-trainer)"})
        with urllib.request.urlopen(request, timeout=40) as response:
            data = json.load(response)
        pages = {page["title"]: page for page in data["query"]["pages"].values()}
        aliases = {entry["from"]: entry["to"] for entry in
                   data["query"].get("normalized", []) + data["query"].get("redirects", [])}
        for row, title in zip(batch, titles):
            for _ in range(4):
                title = aliases.get(title, title)
            info = pages.get(title, {}).get("imageinfo", [])
            if info:
                metadata = info[0].get("extmetadata", {})
                def field(name):
                    return html.unescape(re.sub("<[^>]+>", "", metadata.get(name, {}).get("value", "")))
                row.update(author=field("Artist"), license=field("LicenseShortName"),
                           license_url=field("LicenseUrl"))
            row["attribution_status"] = "Available" if row.get("author") and row.get("license") else "Source review required"
        path.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")

    cards = []
    for row in rows:
        escape = html.escape
        matched = row["matched_audio_records"]
        tags = sorted({tag for sound in matched for tag in sound.get("tags", [])})
        row["audio_tags"] = tags
        exact = sorted({sound["audio-ipa"] for sound in matched if sound.get("audio-ipa")})
        row["audio_ipa"] = exact
        cards.append("<article><h2>" + escape(row["word"]) + " <small>" + row["language"] +
            "</small></h2><audio controls preload='none' src='" + urllib.parse.quote(row["file"]) +
            "'></audio><p>Recording tags: " + escape(", ".join(tags) or "Unspecified") +
            "</p><p>Audio-linked IPA: " + escape(" · ".join(exact) or "Review required") +
            "</p><details><summary>Other dictionary pronunciations</summary>" +
            escape(" · ".join(row["ipa_candidates"])) + "</details><p>" +
            escape(" / ".join(row["definitions"][:1])) + "</p><p>" +
            escape(row.get("author", "Author pending")) + " · " + escape(row.get("license", "License pending")) +
            "</p><a href='" + escape(row["source_url"], quote=True) +
            "' target='_blank' rel='noopener'>Source and license</a><p>Listening review pending.</p></article>")
    path.write_text(json.dumps(rows, ensure_ascii=False, indent=2), encoding="utf-8")
    page = """<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width">
<title>50-word audio shortlist</title><style>
body{font:16px system-ui;background:#18221d;color:#edf3e8;margin:24px}
main{display:grid;grid-template-columns:repeat(auto-fit,minmax(320px,1fr));gap:16px}
article{background:#2a372e;padding:18px;border-radius:16px}audio{max-width:100%}
small,a{color:#d9ed99}p{line-height:1.5}summary{cursor:pointer}
</style><h1>50-word audio shortlist</h1>
<p>Review each recording before game integration. Dictionary pronunciations can describe several accents.</p><main>"""
    (DEST / "index.html").write_text(page + "".join(cards) + "</main></html>", encoding="utf-8")
    print("Attribution available:", sum(row["attribution_status"] == "Available" for row in rows), "/", len(rows))
    print("Audio-linked IPA:", sum(bool(row["audio_ipa"]) for row in rows), "/", len(rows))


if __name__ == "__main__":
    main()
