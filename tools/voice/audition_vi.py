"""Vietnamese casting pass.

OmniVoice's accent attributes only apply to English text, so Vietnamese takes of different
characters can collapse onto similar timbres. For each character this tries several seeds
for a Vietnamese anchor (same instruct as the English voice), measures clarity (Whisper CER)
and continuity with the character's English voice, then picks one seed per character
jointly so that every pair of Vietnamese voices stays distinct.

    D:\\AI\\OmniVoice\\.venv\\Scripts\\python.exe tools/voice/audition_vi.py
Writes voices/<voiceId>.vi.pt and "vi": {...} into src/game/data/voiceCast.json.
"""
from __future__ import annotations

import itertools

import numpy as np

import voicekit as vk

ANCHOR = "Khu rừng ghi nhớ từng bước chân và từng tiếng vọng ta để lại."
SEED_OFFSETS = [0, 1000, 2000, 3000]
PITCH = ["very low pitch", "low pitch", "moderate pitch", "high pitch", "very high pitch"]


def pitch_variants(instruct: str) -> list[str]:
    """The original instruct plus one pitch step away (the direction that moves it toward the
    middle of the range), giving Vietnamese a timbre lever that accents cannot provide."""
    parts = [p.strip() for p in instruct.split(",")]
    i = next((k for k, p in enumerate(parts) if p in PITCH), None)
    if i is None:
        return [instruct]
    lvl = PITCH.index(parts[i])
    step = 1 if lvl < 2 else -1 if lvl > 2 else 1
    alt = parts.copy(); alt[i] = PITCH[lvl + step]
    return [instruct, ", ".join(alt)]
DISTINCT_MAX = 0.80
OUT = vk.TOOLS / "audition" / "vi"


def main() -> None:
    cast_doc = vk.load_json(vk.CAST_FILE)
    cast = cast_doc["characters"]
    lines = vk.load_json(vk.LINES_FILE)
    model = vk.omnivoice()
    pools: dict[str, list[dict]] = {}
    for role, spec in cast.items():
        allv = sorted((l["vi"] for t in lines[role].values() if isinstance(t, list) for l in t), key=len)
        probe = allv[:2] + allv[-2:]
        en_clips = [vk.sf.read(f, dtype="float32")[0] for f in sorted((vk.PUBLIC_VOICE / role / "en").glob("*.mp3"))[:4]]
        en_emb = np.mean([vk.speaker_embedding(a, vk.SR) for a in en_clips], axis=0)
        pools[role] = []
        for instruct, off in [(ins, o) for ins in pitch_variants(spec["instruct"]) for o in SEED_OFFSETS]:
            seed = spec["seed"] + off
            tag = f"{'p' if instruct != spec['instruct'] else ''}s{seed}"
            d = OUT / role / tag
            d.mkdir(parents=True, exist_ok=True)
            vk.seed_all(seed)
            a = vk.trim(np.asarray(model.generate(text=ANCHOR, instruct=instruct, speed=spec["speed"])[0], np.float32))
            vk.sf.write(d / "anchor.wav", a, vk.SR, subtype="PCM_16")
            prompt = model.create_voice_clone_prompt(ref_audio=str(d / "anchor.wav"), ref_text=ANCHOR)
            prompt.save(str(d / "prompt.pt"))
            errs, embs = [], []
            for i, text in enumerate(probe):
                vk.seed_all(seed)
                y = vk.trim(np.asarray(model.generate(text=text, voice_clone_prompt=prompt, speed=spec["speed"])[0], np.float32))
                errs.append(vk.cer(text, vk.asr(y, vk.SR, "vi")))
                y = vk.loudness(vk.apply_fx(y, spec.get("fx")))
                vk.sf.write(d / f"probe{i}.wav", y, vk.SR, subtype="PCM_16")
                embs.append(vk.speaker_embedding(y, vk.SR))
            emb = np.mean(embs, axis=0)
            c = {"seed": seed, "instruct": instruct, "tag": tag, "cer": round(float(np.mean(errs)), 3), "continuity": round(vk.cosine(emb, en_emb), 3), "emb": emb}
            c["score"] = round(3 * (1 - min(1.0, c["cer"] * 2.5)) + 1.5 * c["continuity"], 3)
            pools[role].append(c)
            print(f"{role:9s} {tag:7s} {instruct:45s} cer {c['cer']:.2f}  continuity {c['continuity']:.2f}  score {c['score']:.2f}", flush=True)

    roles = list(pools)
    best, best_key = None, None
    for combo in itertools.product(*(pools[r] for r in roles)):
        worst = max(vk.cosine(a["emb"], b["emb"]) for a, b in itertools.combinations(combo, 2))
        total = sum(c["score"] for c in combo)
        key = (worst < DISTINCT_MAX, total if worst < DISTINCT_MAX else -worst, -worst)
        if best_key is None or key > best_key:
            best, best_key = combo, key
    print("vi casting valid:", best_key[0], "worst pair similarity:", round(-best_key[2], 3), flush=True)
    for role, c in zip(roles, best):
        spec = cast[role]
        src = OUT / role / c["tag"]
        (vk.TOOLS / "voices" / f"{spec['voiceId']}.vi.pt").write_bytes((src / "prompt.pt").read_bytes())
        (vk.TOOLS / "voices" / f"{spec['voiceId']}.vi.wav").write_bytes((src / "anchor.wav").read_bytes())
        spec["vi"] = {"seed": c["seed"], "instruct": c["instruct"], "cer": c["cer"], "continuityWithEnglish": c["continuity"],
                      "compared": [f"{p['instruct']} / seed {p['seed']}" for p in pools[role] if p is not c]}
        print(f"  {role}: {c['instruct']} / seed {c['seed']}", flush=True)
    vk.save_json(vk.CAST_FILE, cast_doc)


if __name__ == "__main__":
    main()
