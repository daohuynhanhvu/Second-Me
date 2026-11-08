# Second Me voice-over (OmniVoice)

All speech is rendered **offline** with [OmniVoice](https://github.com/k2-fsa/OmniVoice).
The game only plays the finished files in `public/assets/voice/`. Nothing is synthesised
while playing, and missing files play as silence.

## How "voices" work here

OmniVoice has **no built-in voice catalogue or voice IDs**. A voice comes from one of two
places:

- **Voice Design**: an `instruct` built from attributes (gender, age, pitch, whisper, English
  accent). See `D:\AI\OmniVoice\docs\voice-design.md`.
- **Voice Cloning**: a reference clip.

The project combines them:

1. Design a voice from `instruct` + `seed` reading a fixed test line (the *anchor*).
2. Save that anchor as a `VoiceClonePrompt` at `tools/voice/voices/<voiceId>.pt`.
3. Speak every line of that character through the clone, so the timbre stays identical.

The voice ID (e.g. `sm.kael.k1-s29`) is the project's own name for one saved prompt.

Vietnamese uses a separate prompt, `<voiceId>.vi.pt`. Accent attributes don't apply to
Vietnamese text, so `audition_vi.py` picks a native Vietnamese anchor per character that
stays distinct from the others.

## Files

| File | Purpose |
|---|---|
| `src/game/data/voiceLines.json` | What every character says (en and vi), by type: intro, dialogue, idle, attack, skill, damage, victory, defeat. Narrator intro lines also set `at` / `until` (intro timeline seconds). |
| `src/game/data/voiceCast.json` | Which voice each character uses: voiceId, instruct, seed, speed, post-FX, gain, and the measurements behind the choice. |
| `tools/voice/candidates.json` | Audition pool: role profiles and candidate instructs. |
| `tools/voice/audition.py` | Renders every candidate, measures it and casts the English voices jointly. Also writes `audition/index.html` (listening board). |
| `tools/voice/audition_vi.py` | Casts the Vietnamese voices. |
| `tools/voice/generate_lines.py` | Renders all lines. Retries takes Whisper mishears, levels loudness, applies FX, writes the manifest and `generation-report.md`. Cached by content hash. |
| `src/game/logic/voice.ts` | In-game player: priority, cooldowns, no overlaps, intro timeline. |

## Commands

Use the OmniVoice environment on drive D:

```powershell
$env:HF_HOME='D:\AI\hf-cache'
D:\AI\OmniVoice\.venv\Scripts\python.exe tools/voice/audition.py        # English casting + listening board
D:\AI\OmniVoice\.venv\Scripts\python.exe tools/voice/audition_vi.py     # Vietnamese casting
D:\AI\OmniVoice\.venv\Scripts\python.exe tools/voice/generate_lines.py  # render lines (only changed ones)
D:\AI\OmniVoice\.venv\Scripts\python.exe tools/voice/generate_lines.py --lang vi --redo-above 0.15 --tries 15  # retry unclear lines, keep only clearer takes
```

## Changing a character's voice

1. Open `tools/voice/audition/index.html` and listen. Each row is one candidate (`K4-s11`, …).
2. In `src/game/data/voiceCast.json`, set that character's `instruct` and `seed` to the
   candidate's values. Set `voiceId` to `sm.<role>.<key>`, e.g. `sm.kael.k4-s11`.
3. Copy `tools/voice/audition/<role>/<KEY>/prompt.pt` to `tools/voice/voices/<voiceId>.pt`.
4. For Vietnamese, delete that character's `"vi"` block and run `audition_vi.py`.
5. Run `generate_lines.py`. Only that character's lines re-render.

To try a brand-new voice, add a candidate to `candidates.json` and run `audition.py`
(earlier takes are reused).

## Other edits

- **Volume per character:** change `gain` in `voiceCast.json`. No re-render is needed.
- **Pace:** change `speed` (below 1 is slower), then re-render.
- **Bark frequency:** `RULES` and `PRIORITY` in `src/game/logic/voice.ts`.
- **Wording:** edit `voiceLines.json`, then run `generate_lines.py`. Narrator lines can be
  retimed with `at` / `until` without re-rendering.
