# Audio sources

Record the source and license of every downloaded file. Keep original attribution information with the recording.

## Sources considered

1. **Wiktionary**: example words, IPA transcriptions, and pronunciation recordings.
2. **Wikimedia Commons**: word recordings and phonetic demonstrations.
3. **Forvo**: listening reference only in the original plan; not used as a bundled audio source.

## Entry template

```text
id: en_theta_thin
file: audio/en/thin__theta.ogg
word: thin
source: Wiktionary / Wikimedia Commons
source_url:
license:
license_url:
author:
listening_validated: false
notes:
```

## Acceptance checklist

- [ ] Native speaker or reliable phonetic source
- [ ] Target sound is clear in the example
- [ ] No excessive background noise
- [ ] Source URL, author, and license recorded
- [ ] Played and reviewed by listening

## Prototype word recordings

| Target | Author | License | Source |
| --- | --- | --- | --- |
| en_theta_thin | Muke | Public domain | [En-us-thin.ogg](https://commons.wikimedia.org/wiki/File:En-us-thin.ogg) |
| fr_y_tu | Vion Nicolas | CC BY 2.0 France | [Fr-tu.ogg](https://commons.wikimedia.org/wiki/File:Fr-tu.ogg) |
| de_ich_ch | Jeuwre | CC BY-SA 4.0 | [De-Ich.ogg](https://commons.wikimedia.org/wiki/File:De-Ich.ogg) |
| de_pf_pferd | Kampy | CC BY-SA 3.0 | [De-Pferd.ogg](https://commons.wikimedia.org/wiki/File:De-Pferd.ogg) |

The first three were downloaded on 2026-11-06; Pferd was added on 2026-11-11. Files are unmodified originals and contain complete words. License URLs are stored in `audio_manifest.json` and shown in the game credits. Listening review is pending.

## Phonetic recordings

Recordings for /ʃ/ and /θ/ were added on 2026-11-11. Their source pages and license metadata are stored in `symbol_audio.json`. Files are unmodified originals. Author metadata and listening quality still need review; some phonetic demonstrations include supporting vowels.

Other downloads were rate-limited by Commons (HTTP 429).
