"""Shared helpers for the Second Me voice pipeline (OmniVoice, offline only)."""
from __future__ import annotations

import json
import os
import re
from pathlib import Path

import numpy as np
import soundfile as sf

ROOT = Path(__file__).resolve().parents[2]
TOOLS = ROOT / "tools" / "voice"
LINES_FILE = ROOT / "src" / "game" / "data" / "voiceLines.json"
CAST_FILE = ROOT / "src" / "game" / "data" / "voiceCast.json"
PUBLIC_VOICE = ROOT / "public" / "assets" / "voice"
SR = 24000
os.environ.setdefault("HF_HOME", r"D:\AI\hf-cache")


def load_json(path: Path) -> dict:
    return json.loads(path.read_text(encoding="utf-8"))


def save_json(path: Path, data: dict) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(data, ensure_ascii=False, indent=2) + "\n", encoding="utf-8")


# ---------- model loading ----------
_model = None


def omnivoice():
    global _model
    if _model is None:
        import torch
        from omnivoice import OmniVoice
        dev = "cuda:0" if torch.cuda.is_available() else "cpu"
        _model = OmniVoice.from_pretrained("k2-fsa/OmniVoice", device_map=dev,
                                           dtype=torch.float16 if dev != "cpu" else torch.float32)
    return _model


def seed_all(seed: int) -> None:
    import random
    import torch
    random.seed(seed); np.random.seed(seed); torch.manual_seed(seed)
    if torch.cuda.is_available():
        torch.cuda.manual_seed_all(seed)


_asr = None


def asr(audio: np.ndarray, sr: int, lang: str) -> str:
    """Whisper large-v3-turbo (the same ASR OmniVoice uses) for intelligibility checks."""
    global _asr
    if _asr is None:
        import torch
        from transformers import pipeline
        _asr = pipeline("automatic-speech-recognition", model="openai/whisper-large-v3-turbo",
                        dtype=torch.float16, device=0 if torch.cuda.is_available() else -1)
    out = _asr({"raw": audio.astype(np.float32), "sampling_rate": sr},
               generate_kwargs={"language": {"en": "english", "vi": "vietnamese"}[lang], "task": "transcribe"})
    return out["text"].strip()


_spk = None


def speaker_embedding(audio: np.ndarray, sr: int) -> np.ndarray:
    """WavLM x-vector, used to measure voice consistency and how distinct two voices are."""
    global _spk
    import librosa
    import torch
    from transformers import AutoFeatureExtractor, WavLMForXVector
    if _spk is None:
        name = "microsoft/wavlm-base-plus-sv"
        _spk = (AutoFeatureExtractor.from_pretrained(name), WavLMForXVector.from_pretrained(name).eval())
    fe, model = _spk
    y = librosa.resample(audio.astype(np.float32), orig_sr=sr, target_sr=16000)
    if y.size < 16000:  # near-empty takes: pad so the x-vector can still be computed
        y = np.pad(y, (0, 16000 - y.size))
    with torch.no_grad():
        emb = model(**fe(y, sampling_rate=16000, return_tensors="pt")).embeddings[0].numpy()
    return emb / (np.linalg.norm(emb) + 1e-9)


def cosine(a: np.ndarray, b: np.ndarray) -> float:
    return float(np.dot(a, b) / ((np.linalg.norm(a) * np.linalg.norm(b)) + 1e-9))


# ---------- measurements ----------
def pitch_stats(audio: np.ndarray, sr: int = SR) -> tuple[float, float]:
    """Median F0 (Hz) and F0 spread in semitones over voiced frames."""
    import librosa
    f0, voiced, _ = librosa.pyin(audio.astype(np.float32), fmin=55, fmax=450, sr=sr, frame_length=1024)
    f = f0[voiced & ~np.isnan(f0)]
    if f.size < 5:
        return 0.0, 0.0
    st = 12 * np.log2(f / np.median(f))
    return float(np.median(f)), float(np.std(st))


DIGITS = "zero one two three four five six seven eight nine".split()


def words(text: str) -> list[str]:
    # Spell digits out so "Rivet07" and "Rivet zero seven" compare equal.
    text = re.sub(r"\d", lambda m: f" {DIGITS[int(m.group())]} ", text.lower())
    return re.findall(r"[\w']+", text)


def error_rate(ref: list, hyp: list) -> float:
    """Levenshtein distance / len(ref): WER on word lists, CER on character lists."""
    d = list(range(len(hyp) + 1))
    for i, r in enumerate(ref, 1):
        prev, d[0] = d[0], i
        for j, h in enumerate(hyp, 1):
            prev, d[j] = d[j], min(d[j] + 1, d[j - 1] + 1, prev + (r != h))
    return d[len(hyp)] / max(1, len(ref))


def wer(ref: str, hyp: str) -> float:
    return error_rate(words(ref), words(hyp))


VI_DIGITS = "không một hai ba bốn năm sáu bảy tám chín".split()


def cer(ref: str, hyp: str) -> float:
    vi_words = lambda t: re.findall(r"[\w']+", re.sub(r"\d", lambda m: f" {VI_DIGITS[int(m.group())]} ", t.lower()))
    strip = lambda s: [c for c in "".join(vi_words(s))]
    return error_rate(strip(ref), strip(hyp))


# ---------- audio finishing ----------
def trim(audio: np.ndarray, threshold: float = 0.008, pad_s: float = 0.05) -> np.ndarray:
    idx = np.where(np.abs(audio) > threshold)[0]
    if idx.size == 0:
        return audio
    pad = int(pad_s * SR)
    return audio[max(0, idx[0] - pad): min(audio.size, idx[-1] + pad)]


def loudness(audio: np.ndarray, target_rms_db: float = -19.0, peak: float = 0.95) -> np.ndarray:
    """Level every line to the same speech loudness so no character jumps out."""
    a = audio.astype(np.float32)
    voiced = a[np.abs(a) > 0.01]
    rms = float(np.sqrt(np.mean(voiced ** 2))) if voiced.size else 1e-4
    a = a * (10 ** (target_rms_db / 20) / max(rms, 1e-5))
    m = float(np.max(np.abs(a)))
    if m > peak:  # soft limit
        a = np.tanh(a / peak * 1.2) / np.tanh(1.2) * peak
    return a.astype(np.float32)


def _reverb(a: np.ndarray, seconds: float, wet: float, seed: int = 3) -> np.ndarray:
    from scipy.signal import fftconvolve
    rng = np.random.default_rng(seed)
    n = int(seconds * SR)
    ir = rng.standard_normal(n).astype(np.float32) * np.exp(-np.linspace(0, 7, n)).astype(np.float32)
    ir /= np.sqrt(np.sum(ir ** 2))
    tail = fftconvolve(np.concatenate([a, np.zeros(n, np.float32)]), ir)[: a.size + n]
    dry = np.concatenate([a, np.zeros(n, np.float32)])
    return (dry * (1 - wet) + tail * wet).astype(np.float32)


def apply_fx(audio: np.ndarray, fx: str | None) -> np.ndarray:
    a = audio.astype(np.float32)
    if fx == "robot":
        t = np.arange(a.size) / SR
        a = a * (0.72 + 0.28 * np.sin(2 * np.pi * 55 * t))            # ring-mod buzz
        d = int(0.0045 * SR)                                         # short comb: metallic body
        out = a.copy()
        for k in range(1, 4):
            out[k * d:] += a[: -k * d] * (0.5 ** k)
        a = np.round(out / np.max(np.abs(out)) * 48) / 48            # light bit-crush
        a = _reverb(a, 0.25, 0.12)
    elif fx == "giant":
        import librosa
        a = librosa.effects.pitch_shift(a, sr=SR, n_steps=-3.0)        # larger body
        from scipy.signal import butter, lfilter
        b, c = butter(2, 5200 / (SR / 2), "low")
        a = lfilter(b, c, a).astype(np.float32)                       # duller, icy hollow
        a = _reverb(a, 1.6, 0.32)
    return a.astype(np.float32)


def write_audio(path: Path, audio: np.ndarray) -> Path:
    path.parent.mkdir(parents=True, exist_ok=True)
    try:
        target = path.with_suffix(".mp3")
        sf.write(target, audio, SR, format="MP3")
        return target
    except Exception:
        target = path.with_suffix(".wav")
        sf.write(target, audio, SR, subtype="PCM_16")
        return target
