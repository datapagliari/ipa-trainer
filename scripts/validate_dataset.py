#!/usr/bin/env python3
"""Valida sounds.json: esquema, IDs únicos y archivos de audio referenciados."""

from __future__ import annotations

import json
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
SOUNDS_PATH = ROOT / "dataset" / "sounds.json"

REQUIRED_FIELDS = {
    "id",
    "language",
    "symbol",
    "kind",
    "example_word",
    "word_ipa",
    "audio",
    "confusers",
    "note",
    "source_url",
    "license",
}
VALID_KINDS = {"vowel", "consonant", "affricate", "diphthong"}
VALID_LANGUAGES = {"en", "fr", "de"}


def load_sounds() -> list[dict]:
    with SOUNDS_PATH.open(encoding="utf-8") as f:
        data = json.load(f)
    if not isinstance(data, list):
        raise ValueError("sounds.json debe ser un array")
    return data


def validate_entry(
    entry: dict, index: int, errors: list[str], warnings: list[str]
) -> None:
    missing = REQUIRED_FIELDS - set(entry)
    if missing:
        errors.append(f"[{index}] faltan campos: {sorted(missing)}")
        return

    if entry["language"] not in VALID_LANGUAGES:
        errors.append(f"[{index}] idioma inválido: {entry['language']}")

    if entry["kind"] not in VALID_KINDS:
        errors.append(f"[{index}] kind inválido: {entry['kind']}")

    confusers = entry["confusers"]
    if not isinstance(confusers, list) or len(confusers) < 3:
        errors.append(f"[{index}] confusers debe tener al menos 3 elementos")

    audio_path = ROOT / entry["audio"]
    if not audio_path.exists():
        warnings.append(f"[{index}] audio pendiente: {entry['audio']}")

    if not entry.get("source_url"):
        warnings.append(f"[{index}] source_url vacío: {entry.get('id')}")


def main() -> int:
    errors: list[str] = []
    warnings: list[str] = []

    try:
        sounds = load_sounds()
    except (OSError, json.JSONDecodeError, ValueError) as exc:
        print(f"ERROR: {exc}", file=sys.stderr)
        return 1

    seen_ids: set[str] = set()
    for index, entry in enumerate(sounds):
        if not isinstance(entry, dict):
            errors.append(f"[{index}] entrada no es un objeto")
            continue

        entry_id = entry.get("id")
        if not entry_id:
            errors.append(f"[{index}] id vacío")
        elif entry_id in seen_ids:
            errors.append(f"[{index}] id duplicado: {entry_id}")
        else:
            seen_ids.add(entry_id)

        validate_entry(entry, index, errors, warnings)

    if warnings:
        print(f"Avisos ({len(warnings)}):")
        for warning in warnings:
            print(f"  - {warning}")

    if errors:
        print(f"Dataset inválido ({len(errors)} problemas):")
        for error in errors:
            print(f"  - {error}")
        return 1

    print(f"OK: {len(sounds)} entradas, IDs únicos, esquema correcto.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
