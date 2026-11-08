"""Render every line in src/game/data/voiceLines.json with the cast in voiceCast.json.

    D:\\AI\\OmniVoice\\.venv\\Scripts\\python.exe tools/voice/generate_lines.py [--role kael] [--lang vi]

Output: public/assets/voice/<role>/<lang>/<lineId>.mp3 plus public/assets/voice/manifest.json
(durations, used by the game to avoid overlaps) and tools/voice/generation-report.md
(what Whisper heard for every line). Each line is retried with new seeds when Whisper
mishears it, keeping the clearest take. Files are cached: a line is only re-rendered
when its text, voice or settings change (hash stored in the manifest).
"""
from __future__ import annotations

import argparse
import hashlib
import json

import numpy as np

import voicekit as vk

MAX_TRIES = {"en": 3, "vi": 5}
# Performance per kind: which reference drives the delivery ("battle" = the character's own
# voice in its aroused battle take, built by expressive.py) and a pace multiplier.
STYLE = {
    "intro": ("base", 1.0), "dialogue": ("base", 1.0), "idle": ("base", 0.97), "victory": ("base", 1.0),
    "defeat": ("base", 0.9), "lowHealth": ("base", 0.88),
    "combatStart": ("battle", 1.0), "attack": ("battle", 1.12), "skill": ("battle", 1.06),
    "ultimate": ("battle", 0.98), "damage": ("battle", 1.12), "dodge": ("battle", 1.1),
    "kill": ("battle", 1.05), "event": ("battle", 0.95),
}
GOOD = {"en": 0.15, "vi": 0.12}   # WER (en) / CER (vi) considered clean enough


def measure(lang: str, text: str, audio: np.ndarray) -> tuple[float, str]:
    heard = vk.asr(audio, vk.SR, lang)
    return (vk.wer(text, heard) if lang == "en" else vk.cer(text, heard)), heard


def render(model, prompt, text: str, speed: float, lang: str, base_seed: int, tries: int | None = None) -> tuple[np.ndarray, float, str]:
    best = None
    for i in range(tries or MAX_TRIES[lang]):
        vk.seed_all(base_seed + 101 * i)
        a = vk.trim(np.asarray(model.generate(text=text, voice_clone_prompt=prompt, speed=speed)[0], np.float32))
        err, heard = measure(lang, text, a)
        if best is None or err < best[1]:
            best = (a, err, heard)
        if err <= GOOD[lang]:
            break
    return best  # type: ignore[return-value]


def vi_prompt(model, role: str, spec: dict, en_prompt, lines: dict):
    """Vietnamese: compare the English-anchored clone with a clone anchored on a Vietnamese
    take of the same designed voice; keep whichever Whisper understands better."""
    from omnivoice import VoiceClonePrompt  # noqa: F401
    # Probe with long and very short lines: short barks are where an accent hurts most.
    allv = sorted((l["vi"] for t in lines[role].values() if isinstance(t, list) for l in t), key=len)
    probe = (allv[:2] + allv[-2:]) if len(allv) >= 4 else allv
    path = vk.TOOLS / "voices" / f"{spec['voiceId']}.vi.pt"
    vk.seed_all(spec["seed"])
    anchor_text = "Khu rừng ghi nhớ từng bước chân và từng tiếng vọng ta để lại."
    a = vk.trim(np.asarray(model.generate(text=anchor_text, instruct=spec["instruct"], speed=spec["speed"])[0], np.float32))
    wav = vk.TOOLS / "voices" / f"{spec['voiceId']}.vi.wav"
    vk.sf.write(wav, a, vk.SR, subtype="PCM_16")
    vi_native = model.create_voice_clone_prompt(ref_audio=str(wav), ref_text=anchor_text)
    scores = {}
    for name, p in (("en-anchor", en_prompt), ("vi-anchor", vi_native)):
        errs = [render(model, p, t, spec["speed"], "vi", spec["seed"])[1] for t in probe]
        scores[name] = float(np.mean(errs))
    # Prefer the native Vietnamese anchor (no foreign accent) unless it is clearly less clear.
    pick = "en-anchor" if scores["en-anchor"] + 0.05 < scores["vi-anchor"] else "vi-anchor"
    if pick == "vi-anchor":
        vi_native.save(str(path))
    print(f"  [{role}] vi method: {pick}  (CER en-anchor {scores['en-anchor']:.2f}, vi-anchor {scores['vi-anchor']:.2f})", flush=True)
    return (vi_native if pick == "vi-anchor" else en_prompt), pick, scores


def main() -> None:
    ap = argparse.ArgumentParser()
    ap.add_argument("--role", nargs="*")
    ap.add_argument("--lang", nargs="*", default=["en", "vi"])
    ap.add_argument("--redo-above", type=float, default=None,
                    help="re-render cached lines whose Whisper error is above this; keep the new take only if clearer")
    ap.add_argument("--tries", type=int, default=None, help="takes per line (default: 3 en / 5 vi)")
    args = ap.parse_args()
    from omnivoice import VoiceClonePrompt

    cast = vk.load_json(vk.CAST_FILE)["characters"]
    for _r, _kinds in vk.load_json(vk.LINES_FILE).items():  # ids must be unique per character (manifest key)
        if isinstance(_kinds, dict):
            _ids = [l["id"] for ls in _kinds.values() for l in ls]
            assert len(_ids) == len(set(_ids)), f"duplicate line id in {_r}"
    lines = vk.load_json(vk.LINES_FILE)
    manifest_path = vk.PUBLIC_VOICE / "manifest.json"
    manifest = vk.load_json(manifest_path) if manifest_path.exists() else {}
    model = vk.omnivoice()
    report = ["# Voice generation report", "", "| Role | Lang | Line | Seconds | Error | Script | Whisper heard |", "|---|---|---|---|---|---|---|"]

    for role, spec in cast.items():
        if args.role and role not in args.role:
            continue
        en_prompt = VoiceClonePrompt.load(str(vk.TOOLS / "voices" / f"{spec['voiceId']}.pt"))
        for lang in args.lang:
            prompt, method = en_prompt, "en-anchor"
            if lang == "vi":
                if spec.get("vi"):  # cast by audition_vi.py: a distinct, native Vietnamese voice
                    prompt = VoiceClonePrompt.load(str(vk.TOOLS / "voices" / f"{spec['voiceId']}.vi.pt"))
                    method = f"vi-cast-{spec['vi'].get('instruct', '')}-{spec['vi']['seed']}"
                else:
                    prompt, method, _ = vi_prompt(model, role, spec, en_prompt, lines)
            battle_file = (spec.get("battle") or {}).get(lang, {}).get("prompt")
            battle = VoiceClonePrompt.load(str(vk.TOOLS / "voices" / battle_file)) if battle_file else None
            wanted = set()
            for kind, entries in lines[role].items():
                if not isinstance(entries, list):
                    continue
                style, pace = STYLE.get(kind, ("base", 1.0))
                use = battle if (style == "battle" and battle is not None) else prompt
                tag = battle_file if use is battle else method
                for line in entries:
                    wanted.add(line["id"])
                    text = line[lang]
                    speed = round(spec["speed"] * pace, 3)
                    key = hashlib.sha1(json.dumps([text, spec["voiceId"], speed, spec.get("fx"), tag]).encode()).hexdigest()[:12]
                    slot = manifest.setdefault(role, {}).setdefault(lang, {})
                    old = slot.get(line["id"])
                    cached = old and old.get("hash") == key and (vk.PUBLIC_VOICE / role / lang / old["file"]).exists()
                    redo = cached and args.redo_above is not None and old["error"] > args.redo_above
                    if cached and not redo:
                        report.append(f"| {role} | {lang} | {line['id']} | {old['seconds']} | {old['error']} | {text} | (cached) |")
                        continue
                    # A redo starts from fresh seeds so it never repeats the takes already rejected.
                    audio, err, heard = render(model, use, text, speed, lang, spec["seed"] + (7919 if redo else 0), args.tries)
                    if redo and err >= old["error"]:
                        report.append(f"| {role} | {lang} | {line['id']} | {old['seconds']} | {old['error']} | {text} | (kept, redo {err:.2f}) |")
                        print(f"{role:9s} {lang} {line['id']:7s} kept old take (redo err {err:.2f} >= {old['error']})", flush=True)
                        continue
                    audio = vk.loudness(vk.apply_fx(audio, spec.get("fx")))
                    path = vk.write_audio(vk.PUBLIC_VOICE / role / lang / line["id"], audio)
                    slot[line["id"]] = {"file": path.name, "kind": kind, "style": "battle" if use is battle else "base",
                                        "seconds": round(audio.size / vk.SR, 2), "error": round(err, 3), "hash": key}
                    report.append(f"| {role} | {lang} | {line['id']} | {audio.size / vk.SR:.2f} | {err:.2f} | {text} | {heard} |")
                    print(f"{role:9s} {lang} {line['id']:7s} {audio.size / vk.SR:5.2f}s err {err:.2f}  heard: {heard}", flush=True)
                vk.save_json(manifest_path, manifest)
            # Drop lines that no longer exist so the game can never play a stale take.
            slot = manifest.get(role, {}).get(lang, {})
            for old_id in [i for i in slot if i not in wanted]:
                (vk.PUBLIC_VOICE / role / lang / slot[old_id]["file"]).unlink(missing_ok=True)
                del slot[old_id]
            vk.save_json(manifest_path, manifest)
    (vk.TOOLS / "generation-report.md").write_text("\n".join(report) + "\n", encoding="utf-8")
    print("DONE", flush=True)


if __name__ == "__main__":
    main()
