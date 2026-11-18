"""Render the language coverage matrix from profiles and the current catalog."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load(name):
    return json.loads((ROOT / "dataset" / (name + ".json")).read_text(encoding="utf-8"))


def main():
    coverage = load("language_coverage")
    targets = load("targets")
    examples = load("examples")
    recordings = load("audio_manifest")
    previews = load("symbol_audio")
    ids = {target["id"] for target in targets}
    rows = coverage["rows"]
    assert len({row["symbol"] for row in rows}) == len(rows)
    assert {row["target_id"] for row in rows if row["target_id"]} == ids
    lines = ["# Language coverage matrix", "",
        coverage["scope"], "",
        "Each language cell combines expected usage with the current number of examples and word recordings.",
        "Reference means included in the working language profile. Contextual, regional, loanword and notation cases are marked.",
        "Outside profile means outside the selected reference scope; it does not rule out every dialect, borrowing or phonetic realization.",
        "Recorded examples and reference usage are separate. An example count of zero is a content gap.",
        "The profiles guide content selection. They are not a completed survey of every dialect.",
        "Recording accent and pronunciation pairing remain pending unless explicitly reviewed.", "",
        "| Sound | Target | English | French | German | Preview |",
        "| --- | --- | --- | --- | --- | --- |"]
    labels = {"reference": "Reference", "contextual": "Contextual", "accent-dependent": "Regional",
              "loanwords": "Loanwords", "notation-variant": "Notation variant", "outside-profile": "Outside profile"}
    for row in rows:
        cells = []
        for language in ("en", "fr", "de"):
            entries = [e for e in examples if e["target_id"] == row["target_id"] and e["language"] == language]
            audio = sum(bool((record := recordings.get(e.get("recording_id"))) and
                record.get("available", True) and (ROOT / record["audio"]).is_file()) for e in entries)
            cells.append(labels[row["usage"][language]] + f"; {len(entries)} examples / {audio} audio")
        record = previews.get(row["symbol"])
        has_preview = record and (ROOT / record["audio"]).is_file()
        preview = ("Reviewed" if record.get("listening_validated") else "Review pending") if has_preview else "Missing"
        lines.append("| /" + row["symbol"] + "/ | " + ("Added" if row["target_id"] else "Planned") +
                     " | " + " | ".join(cells) + " | " + preview + " |")
    lines += ["", "## Transcription and accent notes", ""]
    for row in rows:
        if row["note"]:
            lines.append("- /" + row["symbol"] + "/ — " + row["note"])
    lines += ["", "## Reference profiles", ""]
    for profile in coverage["profiles"].values():
        lines.append("- " + profile["name"] + ". " + profile["accent"] + ". [Reference](" + profile["source"] + ")")
    lines += ["", "Rebuild with python scripts/language_coverage.py.", "",
              "Spanish is a wishlist language and has no active profile or exercises yet."]
    (ROOT / "docs/LANGUAGE_COVERAGE.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(len(ids), "active targets;", sum(not row["target_id"] for row in rows), "planned objectives in the working matrix")


if __name__ == "__main__":
    main()
