"""Validate the local target catalog, examples, migration map and recordings."""
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]


def load(name):
    return json.loads((ROOT / "dataset" / f"{name}.json").read_text(encoding="utf-8"))


def require(condition, message):
    if not condition:
        raise ValueError(message)


def main():
    targets = load("targets")
    examples = load("examples")
    recordings = load("audio_manifest")
    ids = {t["id"] for t in targets}
    order = load("config")["unlock_order"]
    require(len(ids) == len(targets), "Duplicate target ID")
    require(len(order) == len(ids) and set(order) == ids, "Invalid unlock order")
    legacy = list(load("legacy_targets").values())
    require(len(legacy) == len(set(legacy)) and set(legacy) <= ids, "Invalid legacy mapping")
    for target in targets:
        require(target["chapter"] and target["objective"] and target["kind"], target["id"])
        require(set(target["prerequisites"]) <= ids, target["id"])
        options = [target["symbol"], *target["confusers"]]
        require(len(options) == len(set(options)) == 4, target["id"])

    require(len({e["id"] for e in examples}) == len(examples), "Duplicate example ID")
    require({e["target_id"] for e in examples} == ids, "Invalid example coverage")
    for example in examples:
        start, end, label = example["segment"]
        require(0 <= start < end <= len(example["example_word"]) and label, example["id"])
        require(all(example[k].strip() for k in ("word_ipa", "definition", "note")), example["id"])
        require(example["language"] in {"en", "fr", "de"}, example["id"])
        key = example["recording_id"]
        require(key is None or key in recordings, example["id"])

    for key, record in [*recordings.items(), *load("symbol_audio").items()]:
        if not record.get("available", True) or not (ROOT / record["audio"]).is_file():
            print(f"Audio pending: {key}")
        else:
            require(record["source_url"] and record["license"], key)
    print(f"OK: {len(targets)} targets, {len(examples)} examples, valid references.")


if __name__ == "__main__":
    main()
