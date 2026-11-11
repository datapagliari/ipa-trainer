# IPA learning game: dataset and progression plan

This document preserves the original design proposal in English. Its examples describe a proposed architecture, not necessarily the current implementation. The project now uses a web frontend, six initially available targets, and permanent unlock rewards; see [README.md](../README.md) for current behavior.

## Initial goal

Build a small, usable, portable dataset with 20 initial sounds, reliable audio, examples by language, distractors, and a progress system. Curate the data before building the complete application.

## 1. Define the initial scope

Start with 20 mixed targets in English, French, and German, prioritizing useful contrasts that can be challenging for Spanish speakers.

| Proposed ID | Symbol | Main language(s) | Example(s) |
| --- | --- | --- | --- |
| en_ʃ | /ʃ/ | English / French / German | ship, chat, schön |
| en_tʃ | /tʃ/ | English | chip |
| en_dʒ | /dʒ/ | English | judge |
| en_θ | /θ/ | English | thin |
| en_ð | /ð/ | English | this |
| en_ɪ | /ɪ/ | English / German | ship, ich |
| en_iː | /iː/ | English / German | sheep, Liebe |
| en_æ | /æ/ | English | cat |
| en_ʌ | /ʌ/ | English | cut |
| en_ə | /ə/ | English / French / German | about, le, bitte |
| fr_y | /y/ | French / German | tu, über |
| fr_ø | /ø/ | French / German | deux, schön |
| fr_œ | /œ/ | French / German | sœur, können |
| fr_ɑ̃ | /ɑ̃/ | French | sans |
| fr_ɛ̃ | /ɛ̃/ | French | vin |
| fr_ɔ̃ | /ɔ̃/ | French | bon |
| de_ç | /ç/ | German | ich |
| de_x | /x/ | German | Bach |
| de_ts | /ts/ | German | Zeit |
| de_pf | /pf/ | German | Pferd |

Symbols are not exclusive to one language. An ID can identify the main learning module without making an absolute phonetic claim.

## 2. Create the directory structure

```text
ipa_trainer/
  dataset/
    sounds.json
    words.json         # optional separate word inventory
    sources.md
  audio/
    en/
    fr/
    de/
    phonemes/
  scripts/
    validate_dataset.py
```

A minimal version can use one sounds.json and language audio directories, but separating dataset files from media from the start is preferable.

## 3. Find audio

For each target, first look for an example word, not necessarily an isolated sound:

```text
/y/ → French: tu
/ç/ → German: ich
/θ/ → English: thin
```

Wiktionary is useful for word → IPA → audio lookup. Commons is useful for phonetic demonstrations. Example searches:

```text
Wiktionary tu French pronunciation audio
Wiktionary ich German pronunciation audio
Wiktionary thin English pronunciation audio
Wikimedia Commons voiceless dental fricative audio
Wikimedia Commons close front rounded vowel audio
Wikimedia Commons voiceless palatal fricative audio
```

The original plan considered Forvo a listening reference rather than the main bundled audio source. Check the terms of any recording before including it in a distributed application.

## 4. Audio acceptance criteria

- [ ] Native speaker or reliable phonetic source
- [ ] Example clearly contains the target sound
- [ ] Target is not obscured or too fast
- [ ] No excessive background noise
- [ ] License recorded and checked for the intended use
- [ ] Original source URL saved

Do not collect unidentified recordings without recording their sources.

## 5. File naming

Prefer descriptive ASCII names for portability across Windows, Android, and Git:

```text
audio/en/ship__esh.ogg
audio/en/thin__theta.ogg
audio/fr/tu__close_front_rounded.ogg
audio/fr/vin__nasal_e.ogg
audio/de/ich__palatal_fricative.ogg
audio/de/bach__velar_fricative.ogg
```

Keep the actual IPA symbols inside JSON:

```json
{
  "symbol": "ç",
  "audio": "audio/de/ich__palatal_fricative.ogg"
}
```

## 6. Initial data model

Use a single sounds.json array. Each record includes an ID, language, symbol, sound type, example word, full transcription, audio path, at least three distractors, a note, source URL, and license. Complete examples appear in section 16.

## 7. Progress file

Keep fixed learning content separate from personal progress:

```text
dataset/sounds.json → fixed learning content
user_progress.json  → personal progress (original proposal)
```

An early model used correct_count, wrong_count, approved, and weight_multiplier:

```json
{
  "fr_y_tu": {
    "correct_count": 2,
    "wrong_count": 1,
    "approved": false,
    "weight_multiplier": 1.0
  },
  "en_theta_thin": {
    "correct_count": 3,
    "wrong_count": 0,
    "approved": true,
    "weight_multiplier": 0.5
  }
}
```

## 8. Progression logic

Initially, an available target has a streak of zero, is not approved, and has normal selection weight (1.0).

A correct answer increases its consecutive-correct count. At three, the target is approved, its selection weight becomes 0.5, and another target is unlocked.

An incorrect answer resets the streak to zero. If the target was approved, it becomes active again with weight 1.0. An unapproved target also loses its streak on a mistake. This prevents correct → correct → incorrect → correct from counting as three consecutive successes.

## 9. Active targets

Use three states:

| State | Meaning | Weight |
| --- | --- | --- |
| locked | Not yet available | 0.0 |
| active | Currently being practiced | 1.0 |
| approved | Learned, still reviewed | 0.5 |

Avoid redundant lists of active and locked targets when a per-target state is sufficient:

```json
{
  "en_esh_ship": {"status": "active", "correct_streak": 1, "weight_multiplier": 1.0},
  "en_theta_thin": {"status": "approved", "correct_streak": 3, "weight_multiplier": 0.5},
  "fr_nasal_a_sans": {"status": "locked", "correct_streak": 0, "weight_multiplier": 0.0}
}
```

## 10. Unlock rule

The original rule: when a target crosses from active to approved, unlock one locked target. Do not unlock another target on every correct answer after approval.

```python
def handle_correct(sound_id):
    progress = user_progress[sound_id]
    if progress["status"] == "approved":
        return
    progress["correct_streak"] += 1
    if progress["correct_streak"] >= 3:
        progress["status"] = "approved"
        progress["weight_multiplier"] = 0.5
        unlock_next_sound()


def handle_wrong(sound_id):
    progress = user_progress[sound_id]
    progress["correct_streak"] = 0
    if progress["status"] == "approved":
        progress["status"] = "active"
        progress["weight_multiplier"] = 1.0
```

Implementation update: unlock rewards are now granted only once per target, even after a mistake and subsequent relearning. Unlocked targets remain available.

## 11. Selection probability

Choose questions using relative weights. An approved target has half the weight of an active one; this does not mean an absolute 50% probability of selection.

```python
import random


def pick_sound(sounds, progress):
    available = []
    weights = []
    for sound in sounds:
        state = progress[sound["id"]]
        if state["status"] == "locked":
            continue
        available.append(sound)
        weights.append(state["weight_multiplier"])
    return random.choices(available, weights=weights, k=1)[0]
```

## 12. Visual states

Make approved targets visually distinct. The original palette suggestions were:

| State | Suggested appearance | Meaning |
| --- | --- | --- |
| locked | Gray | Unavailable |
| active | Normal / white | In practice |
| approved | Green or blue | Learned |
| failed recently | Brief red highlight | Just answered incorrectly |
| newly unlocked | Brief yellow highlight | New target |

The current web prototype uses a warmer palette. A compact collection can display active, approved, and locked symbols together, for example: /θ/, /ʃ/ ✓, /y/, /ç/ 🔒.

## 13. Unlock order

Use a curated order rather than completely random unlocks. Read the actual sequence from dataset/config.json; proposal IDs are examples, not a definitive inventory.

If all 20 initial targets are active, unlocks need a backlog starting with target 21. An example configuration was:

```json
{
  "initial_active_count": 20,
  "unlock_order": ["sound_001", "sound_002", "sound_003"]
}
```

This abbreviated array illustrates the format only. On initialization, the first initial_active_count targets become active and the rest stay locked. The current implementation starts with six of the 20 targets instead.

## 14. Work phases

### Phase 1: minimal dataset

Create the project and sounds.json. Define 20 targets with language, example word, transcription, distractors, and notes. Find recordings, save sources and licenses, normalize file names, and check playback. Expected result: 20 playable targets.

### Phase 2: extended dataset

Add 10–20 locked targets and define unlock_order. Validate audio, symbol, word, distractors, and language for each target. Create a validator. Expected result: the initial set plus an unlockable backlog.

### Phase 3: console prototype

Test audio → options → answer → progress before polishing the interface. Validate weighting, approval, and unlock logic.

### Phase 4: Pygame prototype

The original proposal called for a minimal screen with a playback button, a symbol question, four choices, score, active-target count, approved-target count, and a symbol collection. The implemented prototype uses a web interface instead.

### Phase 5: portability

Freeze the JSON format, keep audio in Ogg format, use portable paths, and separate game logic from the frontend. Potential later platforms included Godot, Kotlin Android, and the web.

## 15. Per-entry checklist

- [ ] id
- [ ] language
- [ ] symbol
- [ ] kind: vowel / consonant / diphthong / affricate
- [ ] example_word
- [ ] word_ipa
- [ ] audio file
- [ ] At least three confusers
- [ ] note
- [ ] source_url
- [ ] license
- [ ] Validated by listening

## 16. Complete sounds.json examples

```json
[
  {
    "id": "en_theta_thin",
    "language": "en",
    "symbol": "θ",
    "kind": "consonant",
    "example_word": "thin",
    "word_ipa": "θɪn",
    "audio": "audio/en/thin__theta.ogg",
    "confusers": ["s", "f", "t"],
    "note": "Voiceless English TH. The vocal folds do not vibrate.",
    "source_url": "",
    "license": ""
  },
  {
    "id": "fr_y_tu",
    "language": "fr",
    "symbol": "y",
    "kind": "vowel",
    "example_word": "tu",
    "word_ipa": "ty",
    "audio": "audio/fr/tu__close_front_rounded.ogg",
    "confusers": ["i", "u", "ø"],
    "note": "Close front rounded vowel. Think of /i/ with the lips rounded for /u/.",
    "source_url": "",
    "license": ""
  },
  {
    "id": "de_ich_ch",
    "language": "de",
    "symbol": "ç",
    "kind": "consonant",
    "example_word": "ich",
    "word_ipa": "ɪç",
    "audio": "audio/de/ich__palatal_fricative.ogg",
    "confusers": ["ʃ", "x", "h"],
    "note": "Soft German CH. Do not confuse it with /x/ in Bach.",
    "source_url": "",
    "license": ""
  }
]
```

Source and license placeholders must be completed before accepting an audio file.

## 17. Sound versus learning entry

Treat each learning entry as a combination of symbol + language + example word rather than a purely abstract symbol. Realizations of /r/, /ʁ/, /x/, /ə/, and /i/ can depend on language, accent, and context. For example, fr_ʁ_rue and de_ʁ_rot can be separate entries despite sharing a symbol.

## 18. Final progression rule

Every entry starts active or locked. Three consecutive correct answers for an active entry mark it as approved, change its appearance, reduce its selection weight by half, and unlock another entry. If an approved entry is answered incorrectly, it becomes active again, returns to its normal appearance and weight, and loses its streak.

Learned targets remain in circulation at a reduced frequency. In the current implementation, unlocking is permanent and each target grants its unlock reward only once.
