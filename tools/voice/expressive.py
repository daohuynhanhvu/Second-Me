"""Build a "battle" performance for each fighting character WITHOUT changing its voice.

OmniVoice has no emotion parameter. Its docs say: when a reference clip and instruct conflict,
the model follows the *style of the reference audio*. So intensity is steered through the
reference: the character's own clone reads a battle cry many times, the most aroused take that
still sounds like the same speaker (WavLM similarity to the cast voice) and stays intelligible
becomes <voiceId>[.vi].battle.pt. A second round re-clones from that take to push intensity.

Then a text test measures which way of writing a skill name actually gives the strongest shout.

    D:\\AI\\OmniVoice\\.venv\\Scripts\\python.exe tools/voice/expressive.py
Writes voices/*.battle.pt, tools/voice/expressive-report.json and adds "battle" to voiceCast.json.
"""
from __future__ import annotations

import numpy as np

import voicekit as vk

ROLES = ["aeris", "kael", "rivet", "guardian"]
SEEDS = [5, 17, 23, 41, 58, 77]
MIN_SIM = 0.85          # must still be the cast voice
MAX_ERR = 0.25
CRIES = {
    "aeris": {"en": "By storm and echo, I command you! Fall!", "vi": "Hỡi bão tố và tiếng vọng, ta ra lệnh! Ngã xuống!"},
    "kael": {"en": "Stand your ground! For the forge, charge!", "vi": "Giữ vững trận địa! Vì lò rèn, xông lên!"},
    "rivet": {"en": "Combat protocol engaged! Target locked!", "vi": "Giao thức chiến đấu kích hoạt! Đã khóa mục tiêu!"},
    "guardian": {"en": "Kneel before the eternal winter!", "vi": "Quỳ xuống trước mùa đông vĩnh cửu!"},
}
SHOUT_TESTS = {"en": {"aeris": "storm orbs", "kael": "light sanctuary", "rivet": "overdrive", "guardian": "hailstorm"}}


def rms_db(a: np.ndarray) -> float:
    v = a[np.abs(a) > 0.01]
    return float(20 * np.log10(np.sqrt(np.mean(v ** 2)) + 1e-9)) if v.size else -80.0


def arousal(a: np.ndarray, base_f0: float) -> dict:
    f0, spread = vk.pitch_stats(a)
    up = 12 * np.log2(max(f0, 1) / base_f0)
    return {"f0": round(f0, 1), "pitch_up_st": round(up, 2), "spread": round(spread, 2), "rms_db": round(rms_db(a), 2),
            "arousal": round(up + 0.35 * spread + 0.15 * (rms_db(a) + 20), 3)}


BOOST_CRIES = {  # the shout test showed CAPS + "!" lifts pitch/energy the most
    "kael": {"en": "STAND YOUR GROUND!!! FOR THE FORGE... CHARGE!!!", "vi": "Giữ vững trận địa!!! Vì lò rèn... xông lên!!!"},
    "guardian": {"en": "KNEEL!!! KNEEL BEFORE THE ETERNAL WINTER!!!", "vi": "Quỳ xuống!!! Quỳ trước mùa đông vĩnh cửu!!!"},
    "aeris": {"en": "BY STORM AND ECHO... FALL!!!", "vi": "Hỡi bão tố... ngã xuống!!!"},
    "rivet": {"en": "COMBAT PROTOCOL ENGAGED!!! TARGET LOCKED!!!", "vi": "Giao thức chiến đấu!!! Khóa mục tiêu!!!"},
}


def main() -> None:
    import argparse
    ap = argparse.ArgumentParser()
    ap.add_argument("--roles", nargs="*", default=ROLES)
    ap.add_argument("--langs", nargs="*", default=["en", "vi"])
    ap.add_argument("--boost", action="store_true", help="CAPS cries, more seeds, 3 rounds; keeps the old prompt unless beaten")
    args = ap.parse_args()
    from omnivoice import VoiceClonePrompt
    doc = vk.load_json(vk.CAST_FILE)
    cast = doc["characters"]
    model = vk.omnivoice()
    report: dict = {}
    seeds = SEEDS + [91, 104, 133, 150] if args.boost else SEEDS
    for role in args.roles:
        spec = cast[role]
        report[role] = {}
        for lang in args.langs:
            suffix = "" if lang == "en" else ".vi"
            base_path = vk.TOOLS / "voices" / f"{spec['voiceId']}{suffix}.pt"
            base_wav = vk.TOOLS / "voices" / f"{spec['voiceId']}{suffix}.wav"
            base_prompt = VoiceClonePrompt.load(str(base_path))
            ref, _ = vk.sf.read(base_wav, dtype="float32")
            ref_emb = vk.speaker_embedding(ref, vk.SR)
            base_f0 = vk.pitch_stats(ref)[0] or 120.0
            cry = (BOOST_CRIES if args.boost else CRIES)[role][lang]
            prompt, rounds = base_prompt, []
            prior = (spec.get("battle") or {}).get(lang, {}).get("arousal") if args.boost else None
            if prior is not None:
                rounds.append({"round": 0, "_arousal": prior, "note": "existing battle prompt"})
            for rnd in ((1, 2, 3) if args.boost else (1, 2)):
                takes = []
                for s in seeds:
                    vk.seed_all(s)
                    y = vk.trim(np.asarray(model.generate(text=cry, voice_clone_prompt=prompt, speed=1.06)[0], np.float32))
                    heard = vk.asr(y, vk.SR, lang)
                    err = vk.wer(cry, heard) if lang == "en" else vk.cer(cry, heard)
                    sim = vk.cosine(vk.speaker_embedding(y, vk.SR), ref_emb)
                    takes.append({"seed": s, "err": round(err, 3), "sim": round(sim, 3), **arousal(y, base_f0), "_y": y})
                ok = [t for t in takes if t["sim"] >= MIN_SIM and t["err"] <= MAX_ERR]
                best = max(ok, key=lambda t: t["arousal"]) if ok else None
                rounds.append({"round": rnd, "takes": [{k: v for k, v in t.items() if k != "_y"} for t in takes],
                               "picked": best and best["seed"]})
                beat = max([r.get("_arousal", -99) for r in rounds[:-1]], default=-99)
                if not best or best["arousal"] <= beat:
                    break
                d = vk.TOOLS / "voices" / f"{spec['voiceId']}{suffix}.battle.wav"
                vk.sf.write(d, best["_y"], vk.SR, subtype="PCM_16")
                prompt = model.create_voice_clone_prompt(ref_audio=str(d), ref_text=cry)
                prompt.save(str(vk.TOOLS / "voices" / f"{spec['voiceId']}{suffix}.battle.pt"))
                rounds[-1]["_arousal"] = best["arousal"]
                rounds[0].setdefault("_arousal", best["arousal"])
                print(f"{role:9s} {lang} round {rnd}: seed {best['seed']}  arousal {best['arousal']:.2f}  "
                      f"pitch +{best['pitch_up_st']:.1f}st  sim {best['sim']:.2f}  err {best['err']:.2f}", flush=True)
            report[role][lang] = rounds
            if prompt is not base_prompt:
                best_a = max(r.get("_arousal", -99) for r in rounds)
                spec.setdefault("battle", {})[lang] = {"prompt": f"{spec['voiceId']}{suffix}.battle.pt", "cry": cry, "arousal": best_a}

            # Which spelling of a skill name shouts hardest (English only: case/punctuation)?
            if lang == "en" and not args.boost:
                name = SHOUT_TESTS["en"][role]
                variants = {"plain": f"{name.capitalize()}.", "bang": f"{name.capitalize()}!",
                            "caps": f"{name.upper()}!", "caps_bang3": f"{name.upper()}!!!",
                            "beat": f"{name.split()[0].capitalize()}... {' '.join(name.split()[1:]).upper() or name.upper()}!"}
                res = {}
                for vname, text in variants.items():
                    scores = []
                    for s in SEEDS[:3]:
                        vk.seed_all(s)
                        y = vk.trim(np.asarray(model.generate(text=text, voice_clone_prompt=prompt, speed=1.08)[0], np.float32))
                        scores.append({**arousal(y, base_f0), "err": vk.wer(name, vk.asr(y, vk.SR, "en"))})
                    res[vname] = {k: round(float(np.mean([x[k] for x in scores])), 3) for k in ("arousal", "pitch_up_st", "rms_db", "err")}
                    print(f"  {role} shout '{text}': {res[vname]}", flush=True)
                report[role]["shout_text_test"] = res
    for role in report:
        for lang in ("en", "vi"):
            for r in report[role].get(lang, []):
                r.pop("_arousal", None)
    vk.save_json(vk.TOOLS / ("expressive-boost-report.json" if args.boost else "expressive-report.json"), report)
    vk.save_json(vk.CAST_FILE, doc)
    print("DONE", flush=True)


if __name__ == "__main__":
    main()
