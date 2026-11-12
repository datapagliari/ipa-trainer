# Agent handoff: IPA Lab

Prepared on 2026-11-11 for continuation by GPT Astra or another coding agent. Read this file, [ROADMAP.md](ROADMAP.md), and [the README](../README.md) before implementing the next stage.

## Scope and user decisions

- The long-term goal is a learning path through the full standard IPA chart. English, French, and German are starter examples, not an inventory limit.
- Work locally and keep the app playable. Do not introduce design tools, hosting, frameworks, or cloud services for the planned work.
- Repository documentation, game text, definitions, source comments, and tool messages are in English. Conversation with the owner is in Spanish.
- Preserve the current sage/charcoal/lime dashboard layout, navigation, sound collection, audio controls, green correct answers, red wrong answers, and word definitions in Sound Notes.
- The owner will add a README screenshot later. Do not automatically add a screenshot to GitHub.
- This handoff request authorizes a local commit, not a push or publication. Keep audio excluded from Git unless the owner explicitly changes that decision.

## Repository and starting state

- Independent repository at `experimental/ipa_trainer` inside the larger patocodes workspace. It has its own `.git`; do not stage from the parent repository.
- Remote: `https://github.com/datapagliari/ipa-trainer.git` (private, owner confirmed).
- Branch: `main`.
- The previous pushed commit is `7507611` (dashboard refresh, word definitions, green correct-answer feedback).
- This handoff commit adds the agreed one-third review rule, learned badges, tests, roadmap, and continuation notes. Inspect `git status` and `git log` when resuming; do not assume remote synchronization.
- Follow the parent AGENTS.md as well as any applicable project instructions. Preserve existing local changes, saved progress, and audio files.

## Implemented gameplay rule

1. Locked targets do not enter the question pool.
2. Available, unlearned targets all have selection weight 1.
3. Three consecutive correct answers for that target mark it learned: a green tile with a small check mark.
4. Learned targets have selection weight 1/3 relative to unlearned targets in the same eligible pool.
5. A wrong answer resets only that target's streak to zero, removes its learned state, and restores weight 1.
6. Each target grants one unlock reward only on its first learning milestone. Unlocks remain available after mistakes; relearning does not grant another reward.
7. The session streak is independent of target learning and resets on reload or a wrong answer.

`dataset/config.json` has `approved_weight_multiplier: 0.3333333333333333`. The app now passes this setting into `chooseWeighted`; set it to 1 to disable the reduction without clearing progress. This is a relative weight, not an absolute 33% selection probability. The three-answer threshold is currently hard-coded in several core/UI functions despite the historical `approval_streak` config field; keep the accepted threshold at three during the refactor.

There are 20 current target entries and six initially available targets: /ʃ/, /θ/, /ɪ/, /y/, /ç/, /pf/. Older player progress can expose more than six because previously practiced entries are preserved. Do not reset the owner's progress to demonstrate a clean initial state.

## Runtime and files

Buildless HTML/CSS/JavaScript with Python's static server. No package installation is required.

```powershell
# Run from the project directory.
python -m http.server 8765 --bind 127.0.0.1
# Open http://localhost:8765, or use start.cmd.
```

Do not open index.html through file://. Check whether port 8765 is already serving the project before starting another process. A server may have been left running for the owner's local preview; do not assume it is still running in a new session.

- `index.html`: dashboard shell and accessible controls.
- `web/style.css`: responsive sage/charcoal/lime styling and feedback states.
- `web/app.js`: data loading, question UI, definitions, playback, credits, filters, and browser storage.
- `web/core.mjs`: weighting, per-target progress, unlocks, and manually curated written segments.
- `dataset/sounds.json`: 20 records combining a symbol, language, word, definition, note, transcription, distractors, and word-audio reference.
- `dataset/config.json`: six initial targets, multiplier, and unlock order.
- `dataset/audio_manifest.json`: four word recordings and attribution metadata.
- `dataset/symbol_audio.json`: two phonetic demonstrations and attribution metadata.
- `scripts/download_audio.py`, `scripts/download_symbols.py`: Commons download helpers.
- `scripts/test_game.mjs`: current regression checks.
- `scripts/validate_dataset.py`: dataset shape/definition checks; missing media and source URLs are warnings.
- `docs/PLAN.md`: historical proposal with obsolete half-weight examples; ROADMAP.md and README take precedence.

Cache versions in index.html and the core import in app.js were advanced to `v=9`. Reload after editing; advance versions consistently if browser caching retains old assets.

## Saved progress: migration is required

The app stores JSON in localStorage under `ipa-lab-progress-v1`. Records are keyed by the current learning-entry ID, with fields `streak`, `correct`, `wrong`, `everApproved`, `unlockVersion`, and `legacyUnlocked`.

`data/user_progress.example.json` is a historical illustration, not the web app's live save. Do not delete or overwrite browser storage. Before a schema migration, provide a backup/export path or equivalent preservation strategy. Do not combine separate old streaks by addition and inadvertently approve a new target. Retain the one-time unlock history even when the current streak is zero.

## Audio status and limitations

Four local word recordings: thin, tu, Ich, Pferd. Two phonetic demonstrations: /ʃ/ and /θ/. These total approximately 200 KB; exclusion is an existing repository policy, not a size limit.

- Files remain ignored under `audio/**/*.ogg`, `*.wav`, and `*.mp3`; do not force-add them.
- Listening validation is pending for all six files. A valid Ogg header does not establish phonetic accuracy.
- Some demonstrations contain supporting vowels, not isolated consonants.
- The /θ/ manifest currently has an empty author field. Source-page attribution must be reviewed before any release.
- Commons returned HTTP 429 during bulk acquisition. Do not repeatedly hammer endpoints or bypass limits. Use serial requests, informative identification, retry instructions/backoff, metadata caching, and resumable downloads.
- The word downloader skips existing files. The **symbol downloader currently skips symbols already present in its manifest even when the local file is missing**. This means a fresh clone cannot reliably restore the two recorded symbols yet; fix this during the audio-preparation stage.
- Candidate Commons filenames in the symbol downloader are search candidates, not proof that every target has a usable recording.
- Audio modes use whole words; word highlights are written correspondences, not time-aligned audio segments.
- Visual and listening practice currently share progress. Limited word recordings allow memorization; learned is a game state, not verified lasting mastery.
- Before adding more word-audio options, validate the actual sounds in each word: a word can contain several target sounds. Filtering candidates only by their target symbol does not guarantee an unambiguous question.

## Current continuation point

Stage 1 is implemented locally. The earlier sections describe the pre-migration baseline.
Use the current README for file roles and storage keys. The target catalog has 20
stable IDs and 21 examples. The extra visual example, *shoe*, shares /ʃ/ with *ship*.
The old entries map one-to-one through `dataset/legacy_targets.json`. No streaks
are combined. The original v1 save remains available after writing v2.

Word recording records live in `audio_manifest.json`. Entries marked
`available: false` reserve a path for a pending recording and do not enable
audio practice. A null example recording reference also means audio is pending.
Phonetic previews use `symbol_audio.json`, with a nullable supporting-vowels flag.

Next implement Stage 2 in ROADMAP.md. Inventory all recordings needed by the six
starter targets, including distractors. Repair restoration on a fresh clone,
review attribution and listen to each recording. Keep local audio outside Git.
Run the game tests and dataset validator as documented in the README.
