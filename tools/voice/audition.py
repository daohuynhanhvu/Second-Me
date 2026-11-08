"""Audition every candidate voice, measure it, pick one per role, and build a listening page.

    D:\\AI\\OmniVoice\\.venv\\Scripts\\python.exe tools/voice/audition.py

For each candidate (instruct + seed):
  1. Voice Design reads the shared test line -> the "anchor" take (this defines the voice).
  2. The anchor becomes a VoiceClonePrompt; the role's own line is spoken by that clone,
     exactly as the game lines will be produced later.
Measured: intelligibility (Whisper WER on both takes), clone consistency (WavLM speaker
similarity anchor vs clone), pitch and pitch movement, speaking rate.
Selection keeps chosen voices apart from each other (speaker similarity), so no two
roles share a timbre. Results: tools/voice/audition/{results.json,index.html} and
src/game/data/voiceCast.json (the cast the game and generate_lines.py read).
"""
from __future__ import annotations

import html
import shutil

import numpy as np

import voicekit as vk

OUT = vk.TOOLS / "audition"
VOICES = vk.TOOLS / "voices"
DISTINCT_MAX = 0.80   # max speaker similarity allowed between two chosen voices
GENDER_NORM = {"male": 120.0, "female": 205.0}


def role_line(lines: dict, role: str) -> str:
    entries = lines[role]["intro"]
    return entries[0]["en"]


def score(c: dict, targets: dict) -> tuple[float, dict]:
    gender = "female" if c["instruct"].startswith("female") else "male"
    f0 = c["f0"]
    clarity = 1 - min(1.0, c["wer"] * 2.5)
    stability = float(np.clip((c["consistency"] - 0.80) / 0.18, 0, 1))
    expressive = float(np.clip((c["spread_st"] - 1.5) / 3.0, 0, 1)) * 2 - 1
    lowness = float(np.clip((GENDER_NORM[gender] - f0) / (GENDER_NORM[gender] * 0.3), -1, 1))
    slowness = float(np.clip((2.9 - c["rate"]) / 1.0, -1, 1))
    # The design should actually honour the requested gender.
    compliance = -2.0 if (gender == "male" and f0 > 175) or (gender == "female" and f0 < 145) else 0.0
    parts = {
        "clarity": 3 * clarity, "stability": 2 * stability,
        "expressive": targets.get("expressive", 0) * expressive,
        "low": targets.get("low", 0) * lowness, "slow": targets.get("slow", 0) * slowness,
        "compliance": compliance,
    }
    return round(sum(parts.values()), 3), {k: round(v, 2) for k, v in parts.items()}


def main() -> None:
    cfg = vk.load_json(vk.TOOLS / "candidates.json")
    lines = vk.load_json(vk.LINES_FILE)
    model = vk.omnivoice()
    test = cfg["test_line"]
    OUT.mkdir(parents=True, exist_ok=True)
    results: dict[str, list] = {}

    for role, spec in cfg["roles"].items():
        results[role] = []
        line = role_line(lines, role)
        for cand in spec["candidates"]:
            for seed in cfg["seeds"]:
                key = f"{cand['key']}-s{seed}"
                d = OUT / role / key
                d.mkdir(parents=True, exist_ok=True)
                if (d / "prompt.pt").exists() and (d / "line.wav").exists():
                    # Reuse an earlier take; only the measurements are recomputed.
                    anchor = vk.sf.read(d / "anchor.wav", dtype="float32")[0]
                    spoken = vk.sf.read(d / "line.wav", dtype="float32")[0]
                else:
                    vk.seed_all(seed)
                    anchor = np.asarray(model.generate(text=test, instruct=cand["instruct"], speed=spec["speed"])[0], np.float32)
                    anchor = vk.trim(anchor)
                    vk.sf.write(d / "anchor.wav", anchor, vk.SR, subtype="PCM_16")
                    prompt = model.create_voice_clone_prompt(ref_audio=str(d / "anchor.wav"), ref_text=test)
                    prompt.save(str(d / "prompt.pt"))
                    vk.seed_all(seed)
                    spoken = vk.trim(np.asarray(model.generate(text=line, voice_clone_prompt=prompt, speed=spec["speed"])[0], np.float32))
                    vk.sf.write(d / "line.wav", spoken, vk.SR, subtype="PCM_16")
                if spec.get("fx"):
                    vk.sf.write(d / "line_fx.wav", vk.loudness(vk.apply_fx(spoken, spec["fx"])), vk.SR, subtype="PCM_16")

                heard_a, heard_l = vk.asr(anchor, vk.SR, "en"), vk.asr(spoken, vk.SR, "en")
                f0, spread = vk.pitch_stats(np.concatenate([anchor, spoken]))
                emb_a, emb_l = vk.speaker_embedding(anchor, vk.SR), vk.speaker_embedding(spoken, vk.SR)
                # Distinctness is judged on what players hear: post-processed for FX roles.
                heard_as = (vk.speaker_embedding(vk.apply_fx(anchor, spec["fx"]), vk.SR) + vk.speaker_embedding(vk.apply_fx(spoken, spec["fx"]), vk.SR)) / 2                     if spec.get("fx") else (emb_a + emb_l) / 2
                c = {
                    "key": key, "instruct": cand["instruct"], "seed": seed,
                    "wer": round((vk.wer(test, heard_a) + vk.wer(line, heard_l)) / 2, 3),
                    "heard": [heard_a, heard_l],
                    "consistency": round(vk.cosine(emb_a, emb_l), 3),
                    "f0": round(f0, 1), "spread_st": round(spread, 2),
                    "rate": round(len(vk.words(test)) / (anchor.size / vk.SR), 2),
                    "emb": heard_as.tolist(),
                }
                c["score"], c["parts"] = score(c, spec["targets"])
                results[role].append(c)
                print(f"{role:9s} {key:7s} score {c['score']:6.2f}  wer {c['wer']:.2f}  cons {c['consistency']:.2f}  "
                      f"f0 {c['f0']:5.1f}Hz  spread {c['spread_st']:.1f}st  rate {c['rate']:.2f}w/s", flush=True)

    # ---- casting: search every combination; maximise total score with all voices distinct ----
    import itertools
    order = ["narrator", "guardian", "aeris", "kael", "rivet"]
    pools = [sorted(results[r], key=lambda c: -c["score"]) for r in order]
    embs = {id(c): np.array(c["emb"]) for pool in pools for c in pool}
    best, best_key = None, None
    for combo in itertools.product(*pools):
        worst = max(vk.cosine(embs[id(a)], embs[id(b)]) for a, b in itertools.combinations(combo, 2))
        total = sum(c["score"] for c in combo)
        # Valid combos (all pairs below the limit) beat invalid ones; then highest total; then most distinct.
        key = (worst < DISTINCT_MAX, total if worst < DISTINCT_MAX else -worst, -worst)
        if best_key is None or key > best_key:
            best, best_key = combo, key
    chosen = dict(zip(order, best))
    for role, c in chosen.items():
        c["similar_to_cast"] = {r: round(vk.cosine(embs[id(c)], embs[id(o)]), 3) for r, o in chosen.items() if r != role}
    print("casting valid:", best_key[0], "worst pair similarity:", round(-best_key[2], 3), flush=True)

    cast = {"_doc": "Chosen voice per character. voiceId -> tools/voice/voices/<voiceId>.pt (an OmniVoice VoiceClonePrompt). "
                    "To recast: edit voiceId/instruct/seed here (any key from tools/voice/audition/results.json), "
                    "copy that candidate's prompt.pt to tools/voice/voices/<voiceId>.pt, then run generate_lines.py.",
            "characters": {}}
    VOICES.mkdir(parents=True, exist_ok=True)
    for role in order:
        c, spec = chosen[role], cfg["roles"][role]
        voice_id = f"sm.{role}.{c['key'].lower()}"
        shutil.copy(OUT / role / c["key"] / "prompt.pt", VOICES / f"{voice_id}.pt")
        shutil.copy(OUT / role / c["key"] / "anchor.wav", VOICES / f"{voice_id}.wav")
        others = sorted(results[role], key=lambda x: -x["score"])
        cast["characters"][role] = {
            "voiceId": voice_id, "instruct": c["instruct"], "seed": c["seed"], "speed": spec["speed"],
            "fx": spec.get("fx"), "gain": 1.0, "profile": spec["profile"],
            "measured": {k: c[k] for k in ("score", "wer", "consistency", "f0", "spread_st", "rate")},
            "comparedWith": [f"{o['key']} ({o['score']})" for o in others if o is not c],
        }
    vk.save_json(vk.CAST_FILE, cast)
    for role in results:
        for c in results[role]:
            c.pop("emb", None)
    vk.save_json(OUT / "results.json", {"chosen": {r: chosen[r]["key"] for r in chosen}, "results": results})
    build_page(cfg, lines, results, {r: chosen[r]["key"] for r in chosen})
    print("CAST", {r: cast["characters"][r]["voiceId"] for r in order})


def build_page(cfg: dict, lines: dict, results: dict, chosen: dict) -> None:
    rows = []
    for role, cands in results.items():
        spec = cfg["roles"][role]
        rows.append(f"<h2>{html.escape(role.title())}</h2><p class=profile>{html.escape(spec['profile'])}</p>"
                    f"<p class=lines>Test line: <i>{html.escape(cfg['test_line'])}</i><br>Role line: <i>{html.escape(role_line(lines, role))}</i></p>"
                    "<table><tr><th>Candidate</th><th>Instruct</th><th>Score</th><th>WER</th><th>Consistency</th><th>F0</th>"
                    "<th>Movement</th><th>Rate</th><th>Test line</th><th>Role line</th></tr>")
        for c in sorted(cands, key=lambda x: -x["score"]):
            pick = c["key"] == chosen[role]
            fx = f"<br><audio controls preload=none src='{role}/{c['key']}/line_fx.wav'></audio><small>with in-game FX</small>" if spec.get("fx") else ""
            rows.append(
                f"<tr class='{'pick' if pick else ''}'><td><b>{c['key']}</b>{' ✔ chosen' if pick else ''}</td><td>{html.escape(c['instruct'])}</td>"
                f"<td>{c['score']}</td><td>{c['wer']}</td><td>{c['consistency']}</td><td>{c['f0']} Hz</td><td>{c['spread_st']} st</td><td>{c['rate']} w/s</td>"
                f"<td><audio controls preload=none src='{role}/{c['key']}/anchor.wav'></audio></td>"
                f"<td><audio controls preload=none src='{role}/{c['key']}/line.wav'></audio>{fx}</td></tr>")
        rows.append("</table>")
    page = f"""<!doctype html><html lang=en><meta charset=utf-8><meta name=viewport content="width=device-width,initial-scale=1">
<title>Second Me voice audition</title>
<style>body{{font:14px system-ui,sans-serif;background:#0b1510;color:#dfe8d6;margin:0;padding:24px}}h1{{font:300 30px Georgia,serif}}
h2{{margin-top:34px;color:#e0c07a}}table{{border-collapse:collapse;width:100%}}td,th{{border-bottom:1px solid #2a3a30;padding:6px 8px;text-align:left;vertical-align:middle}}
th{{color:#9fb391;font-weight:500;font-size:12px}}tr.pick{{background:#1d3324}}audio{{height:30px;max-width:240px}}.profile{{color:#b7c4ab}}.lines{{color:#8fa287;font-size:13px}}small{{display:block;color:#8fa287}}</style>
<h1>SECOND ME · Voice audition (OmniVoice)</h1>
<p>Score = clarity×3 + clone consistency×2 + role targets (pitch movement, lowness, pace) − penalty if the voice ignores the requested gender.
WER: Whisper error rate (lower is clearer). Consistency: speaker similarity between the designed take and the cloned line (higher keeps the character stable).
Movement: pitch spread in semitones (higher is more expressive). Chosen voices are kept below {DISTINCT_MAX} speaker similarity to each other.</p>
{''.join(rows)}</html>"""
    (OUT / "index.html").write_text(page, encoding="utf-8")


if __name__ == "__main__":
    main()
