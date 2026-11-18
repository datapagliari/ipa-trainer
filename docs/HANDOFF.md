# IPA Trainer handoff

Updated 2026-11-18. Read README.md and ROADMAP.md for product scope and setup.

## Current local game

- 47 stable learning targets, 115 examples and 94 distinct words across English,
  French and German. All words have local audio. Symbol previews exist for
  41 targets; /m n l ɡ ʁ ʏ/ remain in the Commons download queue.
- 24 targets are initially unlocked. Three consecutive correct answers for a
  target mark it learned, reduce its relative selection weight to 1/3, and grant
  a permanent one-time unlock reward. A mistake resets that target's streak and
  weight. Relearning does not grant another reward.
- The ten most recently presented target sounds are excluded in the same tab,
  including across mode/filter changes and reloads. Small pools can exhaust
  eligible targets and offer a return to the full visual pool.
- Symbol quiz supports highlighted word to symbol, word audio to symbol, and
  symbol to word audio. Same or different and Sort by sound are also playable
  from the left rail. These two modes update only the session streak.
- Autoplay audio remembers its setting. Comparison words play in sequence.
  Next is above the question and stays near the exercise during scrolling.
- Dark/light themes, correct/wrong colors, definitions, and post-answer
  distractor tooltips are implemented.
- Right-click a playback control to report its exact recording. Browser notes
  automatically sync to data/audio_reports.json. This file is available to
  agents and excluded from Git. Do not discard user reports.
- The reported feu and vin clips were replaced with human recordings.
  Replacement review is pending. Details are in AUDIO_FIXES.md.

## Runtime and saved data

Use start.bat to serve and open the browser, or start.cmd for server only.
Both use scripts/launch.py and scripts/local_server.py on loopback port 8765.
The earlier python -m http.server launcher cannot persist report files.
Restart an old server to enable the report API.

The report API merges immutable IDs with atomic writes and serializes concurrent
updates. Browser backups and JSON exports remain available. Repeated uploads
do not duplicate reports. Existing browser-only notes migrate after the owner
opens the same origin in the same browser.

Player progress uses localStorage key ipa-lab-progress-v2. The original v1 save
remains as a backup. dataset/legacy_targets.json maps old entry IDs one-to-one.
The session history uses sessionStorage; theme, autoplay and report backups use
their own localStorage keys. Preserve these records during changes.

## Content and acquisition

The language matrix is dataset/language_coverage.json, rendered by
scripts/language_coverage.py into docs/LANGUAGE_COVERAGE.md. It distinguishes
reference usage, contextual realizations, regional contrasts, loanwords and
notation variants from actual example coverage. Recording accent validation is
incomplete. It is a working scope, not an exhaustive survey of every dialect.

Audio combines Commons recordings and free Magpie TTS samples. Most recordings
still need listening and exact IPA/accent review. File presence and decoding
do not establish phonetic accuracy. Avoid questions with multiple valid answers.

The large archive was supplied at D:/wiktionary-audios.tar. It was unavailable
in the most recent environment, so check its presence before an archive scan.
The local shortlist, metadata caches and candidates are under data/word_sample/.
Do not extract the entire archive. Exact-word selection must reject compounds
that merely end in the requested word.

A Windows task named IPA Trainer - Commons phonemes was configured to run
scripts/download_symbols.py every 15 minutes while the user is logged in.
Check Task Scheduler and data/phoneme_downloads/requests.log before assuming it
is active in another environment. The downloader attempts one mapped target per
run and persists backoff after errors. Respect Wikimedia rate limits.

Magpie generation used the authenticated official NVIDIA Hugging Face demo.
Credentials are stored outside the repository. Free quotas have repeatedly
limited batches. Paid generation has not been authorized.

## Next work

1. Review the owner's audio reports and test replacement clips.
2. Complete the six missing isolated previews and verify their pronunciation.
3. Add examples to missing language cells in the coverage matrix.
4. Visually verify the newer modes, report dialog, autoplay and desktop layout.
5. Decide how alternate modes contribute to learning and unlocks.
6. Implement the remaining agreed games: Odd one out, Find the sound in a word,
   and Detect the transcription error.

Later work includes a dedicated mobile pass, articulation diagrams, Spanish
examples and an Android app. Spanish variety, Android tooling and publication
timing remain undecided. The owner will supply a README screenshot.

## Repository and checks

This is an independent repository inside experimental/ipa_trainer. Remote is
the private datapagliari/ipa-trainer repository. Stage and commit from this
project only. Audio, reports, caches and diagnostic outputs stay local.
The owner authorized updating GitHub with source, documentation and metadata.

Run the following from the project directory:

    node scripts/test_game.mjs
    node --check web/app.js
    node --check web/reports.mjs
    python scripts/validate_dataset.py
    python scripts/test_reports.py
    python scripts/audio_inventory.py
    python scripts/language_coverage.py

Game checks currently need the local audio files. Report tests use temporary
files and a temporary loopback server. Fresh-clone audio restoration remains
incomplete, especially for synthetic and processed clips. Most recent UI
verification used a simulated DOM; a full browser playthrough is still pending.
