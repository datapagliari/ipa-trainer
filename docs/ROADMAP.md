# IPA Lab: phased roadmap

## Product goal

Build a local, playable learning path through the standard International Phonetic Alphabet chart. English, French, and German provide the first examples; they do not limit the eventual sound inventory. Expand the repertoire in reviewed chapters rather than requiring all recordings before the game can be used.

Scope reference: [the official IPA chart](https://www.internationalphoneticassociation.org/content/ipa-chart). Pin a chart edition when building the full catalog. Completion means covering the declared chart symbols and learning objectives, not every possible combination of symbols, diacritics, accents, and languages. Extended IPA is outside the first full-chart milestone.

## Agreed learning rule

| State | Appearance | Selection weight |
| --- | --- | --- |
| Locked | Outlined tile with lock | Not eligible for questions |
| Available, not learned | Normal tile | 1 |
| Learned | Green tile with a small ✓ | 1/3 |

- Initially, every eligible, unlearned symbol has the same weight.
- Three consecutive correct answers **for that symbol** mark it as learned. Questions about other symbols do not reset its streak.
- A mistake resets that symbol's streak to zero, removes its learned mark, and restores weight 1. It does not reset other symbols.
- Learned symbols stay in rotation. Weight 1/3 means one third of the weight of an unlearned symbol in the current pool, not a fixed absolute probability. If all available symbols have the same state, they are equally likely again.
- The session-wide streak is a separate display metric and never awards learning status.
- A symbol's first learning milestone unlocks one next eligible symbol. Unlocks are permanent; losing and regaining learning status does not award another unlock.
- The reduction is experimental. Setting `approved_weight_multiplier` to `1` disables it without clearing progress. No spaced-repetition schedule is added at this stage.
- Weighting applies after language, mode, unlock, and audio-availability filters. Future selection must choose a symbol first and an example second, so symbols with more examples do not appear more often.

Current status: the one-third weight, learned mark, reset behavior, and configurable reduction are implemented for the existing 20 entries. Stage 1 is implemented locally with 20 targets and 21 examples. Stage 2 is next.

## Stage 1 — Separate symbols from examples

**Purpose:** make the inventory independent of language before expanding audio acquisition.

Deliverables:

- A catalog of stable learning-target IDs, IPA notation, category, chapter, and prerequisites.
- Separate examples referencing a target: language, accent where known, word, full transcription, written highlight, definition, and word-audio reference.
- Separate audio records for word recordings and phonetic demonstrations, including source, author, license, changes, review state, and whether supporting vowels are present.
- One progress record per learning target; avoid rewarding the same symbol again because a new word or language was added.
- A migration from existing entry IDs to target IDs, preserving unlocks and review history. Do not sum unrelated old streaks into a learned status. Document ambiguous mappings before migrating them.
- Distinguish plain symbols from compound learning targets: /iː/ includes duration, nasal vowels include a diacritic, and affricates can require linked-symbol notation. Assign these to explicit objectives rather than counting every JSON record as a separate basic IPA letter.

**Complete when:** the current 20 entries still work with their highlights and definitions, saved progress survives migration, and adding an example does not change a target's selection weight or grant an extra unlock.

## Stage 2 — Finish the six-target starter audio chapter

This audio acquisition batch covers six targets. New and reset games unlock the first ten targets in the configured order. Prefer consonant demonstrations in Ca and aCa contexts where available. Preview isolated vowels twice with a short pause.

**Purpose:** deliver a small learning loop with complete reviewed audio.

Starter targets: /ʃ/, /θ/, /ɪ/, /y/, /ç/, and /pf/.

Deliverables:

- Inventory the union of targets, answer distractors, and example words before downloading.
- Obtain word pronunciations and phonetic demonstrations for every audio option used in the starter chapter. Replace an example word if a suitable recording cannot be found.
- Complete attribution metadata, including author fields missing from existing records. Store license links and adaptation details.
- Download serially, respect rate limits and retry instructions, cache metadata, and resume successful downloads without repeating them.
- Review each recording for target accuracy, intelligibility, accent consistency, noise, clipping, and supporting vowels. Preserve originals if volume or silence edits are made.
- Define study previews versus listening questions clearly so the player knows whether an option is a hint or an answer.

**Complete when:** every enabled starter audio exercise can be played offline after setup, every offered playback control has a working recording, and every recording has reviewed attribution and listening status.

Downloading and format checks can be automated. A valid Ogg header alone does not establish phonetic accuracy; listening review remains an explicit acceptance step.

## Stage 3 — Complete the current 20-target chapter

**Purpose:** validate the learning loop before expanding the inventory.

Deliverables:

- Apply the same audio acceptance process to the remaining current targets and their distractors.
- Order unlocks by useful contrasts, with prerequisites for unfamiliar distractors or an explanation available in study mode.
- Add more than one reviewed example where feasible, so recognition does not depend on memorizing one voice or word.
- Check sound-specific streaks, loss of learned status, permanent unlocks, save/reload behavior, filters, and keyboard/mobile controls across a complete playthrough.
- Keep definitions and pronunciation notes concise and in English.

**Complete when:** all 20 current targets are playable in their declared modes, no question has multiple valid answers, and the one-third review rule works consistently throughout the chapter.

## Stage 4 — Map and unlock the core IPA chart

**Purpose:** make the full destination visible while adding playable content incrementally.

Deliverables:

- Build a versioned checklist from the standard IPA chart: vowels, pulmonic consonants, non-pulmonic consonants, and other segmental symbols.
- Group it into manageable chapters using articulation and useful perceptual contrasts rather than limiting chapters to English, French, and German.
- Add examples from further languages as required, with their definitions and accent/context notes.
- Show the complete catalog map, with distinct states for locked-but-ready content and planned content whose recordings are still missing. Do not imply that an unavailable recording is a player unlock requirement.
- Unlock only ready targets; skip unavailable ones and explain when the end of the currently playable material has been reached.
- Show chapter progress and an overall total derived from the catalog, rather than a hard-coded number.

**Complete when:** every core chart target has a declared lesson and content status, each ready chapter is playable, and the visible path clearly distinguishes learning progress from content still in development. Mark the core chart complete only after every declared target is playable and reviewed.

## Stage 5 — Add diacritics, duration, stress, and tones

**Purpose:** cover the remaining chart categories using appropriate exercise formats.

Deliverables:

- Dedicated objectives for modifiers such as nasalization and aspiration, with paired recordings that demonstrate the contrast.
- Duration and stress exercises using matched words or syllables rather than relying on spelling alone.
- Tone and intonation objectives with suitable syllable or phrase recordings; introduce visual pitch guidance where it helps.
- Explicit decisions about overlap with existing compound targets, preserving already earned progress and avoiding duplicate rewards.
- A per-lesson acceptance criterion for what the player must distinguish. Keep the agreed learned/unlearned rule for each objective unless playtesting supports a later change.

**Complete when:** every in-scope diacritic, suprasegmental, and tone objective has a suitable playable lesson and reviewed material. Arbitrary combinations are practice extensions, not an endless completion requirement.

## Stage 6 — Validate and package the complete local path

**Purpose:** make the game dependable to install, use, and resume.

Deliverables:

- Reproducible audio preparation with a clear availability report and no broken playback controls.
- A credits inventory covering every distributed recording. Decide how to distribute audio only after attribution and license review; the present Git exclusion remains unchanged until that decision is authorized.
- Portable progress export/import and migration tests for future catalog changes.
- Playtesting for difficulty, useful distractors, review frequency, and whether players recognize unfamiliar recordings of learned sounds.
- If review at one-third weight proves unsuitable, adjust or disable the multiplier without discarding progress. Three correct answers remain a game milestone, not proof of lasting mastery.
- Updated English setup instructions and a screenshot supplied by the project owner.

**Complete when:** a fresh checkout can be prepared and played locally using documented steps, progress can be preserved, and the full declared route has passed a content and gameplay audit.

## Desktop and mobile playtesting follow-up

- Prioritize the desktop web game during Stage 2. Check Sound notes at normal desktop zoom: increase the legibility of the language label, full-word pronunciation and heading arrow.
- Revisit left-rail controls once their intended actions are defined.
- In a later mobile pass, test the entire answer, feedback and tooltip flow on narrow touch screens in both themes.
- Add reviewed examples to existing targets to reduce repeated words, retaining target-first selection and shared progress.

## Immediate sequence

1. Implement and test the agreed review rule — done for the current dataset.
2. Separate learning targets, examples, and audio records, including progress migration (complete).
3. Finish and review the starter chapter's recordings.
4. Complete the current 20 targets.
5. Expand through the chart chapters, then modifiers and prosody.

No hosting, external accounts, new design tools, or cloud runtime are required for these stages. Work remains local unless a repository upload or publication is requested.

## Word expansion update

Added feet, petit, feu, peur and Buch with synthetic audio. Map and sun now have audio. Listening review is pending. Zahn generation reached the authenticated demo quota and remains pending.

## Expanded playtest catalog

The local catalog now has 40 objectives and 24 initially unlocked targets.
The original target IDs and unlock order prefix are preserved. Added 19 symbols
previously used only as distractors, plus /ʊ/. Each has a visual word example.
Additional highlighted segments reuse existing word recordings. Four archive
words (bed, hat, cat and book) are integrated with source and license metadata;
listening and exact accent review remain pending. Other targets still need word
audio and further vocabulary. Ten-turn exclusion and one-third learned weight
continue to apply.

## Audio coverage update

All 40 target previews and all 55 distinct words in the 66-example catalog now
have local audio. Imported 27 exact-word archive recordings with Commons credits.
Generated six remaining words with the authenticated free Magpie demo.
Added /ʊ/, three nasal vowels and a German /iː/ demonstration. New recordings
retain pending listening/accent review. Presence and decoding are verified;
phonetic quality still needs playtesting. Existing reviewed recordings remain
available. Run scripts/audio_inventory.py for the current file availability.

## Expanded archive vocabulary and report storage

The catalog now contains 88 examples across 77 distinct words, with local audio
for every word and all 40 target previews. Added 22 words from the reviewed
archive shortlist, retaining source attribution and pending listening/accent
review. This includes fish, cheese, good, beurre, blanc, Milch and Zahn.

Audio reports now sync to data/audio_reports.json through scripts/local_server.py.
Launch through start.bat or start.cmd. Old browser notes upload automatically on
page load from the same browser and origin. Each report ID is stored once even
when requests are retried. Browser backups and manual exports remain available.
File notes are local user data and are excluded from Git. Future agents should
read this file when investigating reported recordings.

## Long-term goal: Android app

The owner would like IPA Trainer to become an Android app in the distant future.
First stabilize the desktop web game, review audio quality and content, and
complete a dedicated mobile layout and touch interaction pass. When Android
work begins, evaluate packaging and distribution options against the mature web
app, with offline audio, portable progress and audio reports in mind.
Implementation technology and release timing remain undecided.

## Vocabulary coverage update — 2026-11-18

Added pain, jeu, zip, van, nez, lit, mer and chat with the free Magpie quota.
Added bol, tout, mot, calm and head from Commons with source attribution.
The catalog now has 101 examples and 90 words with audio. Every target has
at least two distinct word examples. New audio remains pending listening and
accent review. The Magpie quota was exhausted after eight clips in this batch.

## Future feature: articulation diagrams

Provide an image, drawing or diagram for each learning target showing how to
produce the sound. Include a side view of tongue position and relevant contact
points, a front view of lip shape when useful, and airflow or voicing indications
where appropriate. Affricates need a sequence showing closure and release;
nasal sounds need an indication of nasal airflow.

Make the illustrations available from Sound notes and the collection. Keep
them optional during exercises so they can serve as hints or post-answer
explanations. Prioritize a consistent, legible style and verify anatomical and
phonetic accuracy against reliable references. Record source and license for
reused illustrations. Review each diagram before treating it as instruction.

## Coverage matrix and seven added objectives

Added /m n l ɡ ʁ ɥ ʏ/ with two word examples each. Existing example recordings
serve the first five objectives. French huit/huile and German Hütte/Mütter
have Commons recordings. The seven objectives append to the existing unlock
order; the initial 24 and earned progress are preserved.

dataset/language_coverage.json records a working inventory by reference language
profile. scripts/language_coverage.py derives current example/audio counts for
docs/LANGUAGE_COVERAGE.md. Usage can be contextual, accent-dependent, from
loanwords or a notation variant. Unknown recording accents remain marked for
review. The matrix is a working segmental scope, with further narrow detail and
prosody still to define.

## Wishlist: Spanish

Add Spanish as a future example language. Choose the target varieties and
document regional pronunciation before selecting recordings. Reuse shared IPA
targets and add missing objectives as needed. Spanish is planned; examples
and the game language selector currently cover English, French and German.
