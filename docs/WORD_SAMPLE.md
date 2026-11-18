# Local Wiktionary word sample

Archive source: https://kaikki.org/dictionary/rawdata.html

Local archive: D:/wiktionary-audios.tar (21,911,224,320 bytes).

The indexer scanned 942,567 entries. The corrected shortlist contains 22 English,
15 French and 13 German words. Lingua Libre filename matching requires the
complete word after the speaker field, excluding compounds such as grille-pain
when requesting pain. Original Ogg files are preferred.

The 50 selected clips total 665,251 bytes. All were decoded by ffprobe.
Commons returned license metadata for every selected file and author metadata
for 48. Fish and good are marked public domain with an empty Artist field.
All clips await listening review and exact pronunciation pairing.

The local review page is at ../data/word_sample/index.html. When serving the game,
open /data/word_sample/ to listen. The sample is excluded from Git.

The JSONL dictionary snapshots supply pronunciation candidates and definitions.
An entry may contain several accents or senses. The sample retains matching
audio records separately; a list of candidate IPA strings is not a verified
transcription of the selected recording. Listening review and exact IPA pairing
are required before promoting any example into the game.

The archive is preserved. Only the 50 selected members are extracted via their
byte offsets; archive paths are never used as extraction destinations.

To rebuild the candidate index, run python scripts/index_word_sample.py.
To extract the shortlist and cache dictionary data, run
python scripts/prepare_word_sample.py. The latter needs network access for
uncached metadata.

Run python scripts/review_word_sample.py to refresh attribution and the review page. This requires network access.
