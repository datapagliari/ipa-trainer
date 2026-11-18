"""Regenerate availability from the game catalog and local audio files."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load(name):
    return json.loads((ROOT / "dataset" / (name + ".json")).read_text(encoding="utf-8"))


def available(record):
    return bool(record and record.get("available", True) and (ROOT / record["audio"]).is_file())


def main():
    targets, examples, words, previews, config = [load(name) for name in
        ("targets", "examples", "audio_manifest", "symbol_audio", "config")]
    initial = set(config["unlock_order"][:config["initial_active_count"]])
    starter = {symbol for target in targets if target["id"] in initial for symbol in [target["symbol"], *target["confusers"]]}
    symbols = list(dict.fromkeys(s for target in targets for s in [target["symbol"], *target["confusers"]]))
    groups = {}
    for example in examples:
        groups.setdefault((example["language"], example["example_word"]), []).append(example)
    preview_count = sum(available(previews.get(symbol)) for symbol in symbols)
    word_count = sum(any(available(words.get(e.get("recording_id"))) for e in entries) for entries in groups.values())
    lines = ["# Audio inventory", "",
        f"Local snapshot: {preview_count}/{len(symbols)} symbol previews and {word_count}/{len(groups)} words have audio.",
        "Availability describes files. Listening and accent checks are tracked separately.", "",
        "| Symbol | First needed | Local preview | Listening review |",
        "| --- | --- | --- | --- |"]
    for symbol in symbols:
        record = previews.get(symbol, {})
        present = available(record)
        lines.append("| /" + symbol + "/ | " + ("Initial" if symbol in starter else "Unlockable") +
            " | " + ("Present" if present else "Missing") + " | " +
            ("Reviewed" if record.get("listening_validated") else "Pending" if present else "—") + " |")
    lines += ["", "## Word recordings", "",
        "| Language | Word | Targets | Local audio |",
        "| --- | --- | --- | --- |"]
    notation = {target["id"]: target["symbol"] for target in targets}
    for (language, word), entries in groups.items():
        present = any(available(words.get(e.get("recording_id"))) for e in entries)
        target_symbols = ", ".join("/" + notation[e["target_id"]] + "/" for e in entries)
        lines.append(f"| {language} | {word} | {target_symbols} | " + ("Present" if present else "Missing") + " |")
    (ROOT / "docs/AUDIO_INVENTORY.md").write_text("\n".join(lines) + "\n", encoding="utf-8")
    print(lines[2])


if __name__ == "__main__":
    main()
