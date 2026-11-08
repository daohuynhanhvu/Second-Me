"""Remove music/background from a voice recording with Demucs (local, GPU, free).

    D:\\AI\\OmniVoice\\.venv\\Scripts\\python.exe tools/voice/isolate.py <recording> [--lang vi|en] [--fine]

Writes tools/voice/isolated/<name>.vocals.wav (24 kHz mono, trimmed, levelled) and prints a
quality report: how loud the music was, how much is left, and what Whisper hears.
--fine uses htdemucs_ft (4 models, ~4x slower, usually cleaner vocals).
--selftest mixes a known clean line with synthetic music to measure separation quality.
"""
from __future__ import annotations

import argparse
import os
import subprocess
import sys
import tempfile
from pathlib import Path

import numpy as np

import voicekit as vk

os.environ.setdefault("TORCH_HOME", r"D:\AI\torch-cache")
OUT = vk.TOOLS / "isolated"


def separate(path: Path, fine: bool) -> tuple[np.ndarray, np.ndarray, int]:
    """Run Demucs two-stem separation; returns (vocals, accompaniment, sample_rate)."""
    model = "htdemucs_ft" if fine else "htdemucs"
    with tempfile.TemporaryDirectory() as tmp:
        cmd = [sys.executable, "-m", "demucs", "--two-stems=vocals", "-n", model, "-o", tmp, str(path)]
        subprocess.run(cmd, check=True, env={**os.environ}, capture_output=True)
        d = Path(tmp) / model / path.stem
        v, sr = vk.sf.read(d / "vocals.wav", dtype="float32")
        a, _ = vk.sf.read(d / "no_vocals.wav", dtype="float32")
    mono = lambda x: x.mean(axis=1) if x.ndim == 2 else x
    return mono(v), mono(a), sr


def rms_db(x: np.ndarray) -> float:
    return float(20 * np.log10(np.sqrt(np.mean(x ** 2)) + 1e-9))


def si_sdr(ref: np.ndarray, est: np.ndarray) -> float:
    n = min(ref.size, est.size)
    ref, est = ref[:n] - ref[:n].mean(), est[:n] - est[:n].mean()
    s = np.dot(est, ref) / (np.dot(ref, ref) + 1e-9) * ref
    return float(10 * np.log10(np.sum(s ** 2) / (np.sum((est - s) ** 2) + 1e-9)))


def isolate(path: Path, lang: str, fine: bool) -> Path:
    import librosa
    vocals, accomp, sr = separate(path, fine)
    v24 = librosa.resample(vocals, orig_sr=sr, target_sr=vk.SR)
    clean = vk.loudness(vk.trim(v24))
    OUT.mkdir(parents=True, exist_ok=True)
    out = OUT / f"{path.stem}.vocals.wav"
    vk.sf.write(out, clean, vk.SR, subtype="PCM_16")
    print(f"music level vs voice in the original: {rms_db(accomp) - rms_db(vocals):+.1f} dB")
    print(f"isolated voice: {out.relative_to(vk.ROOT)}  ({clean.size / vk.SR:.1f}s)")
    print(f"Whisper hears: {vk.asr(clean, vk.SR, lang)}")
    return out


def selftest(fine: bool) -> None:
    """Clean narrator line + loud synthetic music (chords, bass, drums) -> separate -> SI-SDR."""
    clean_path = next((vk.PUBLIC_VOICE / "narrator" / "en").glob("n2.*"))
    clean, sr = vk.sf.read(clean_path, dtype="float32")
    t = np.arange(clean.size + sr) / sr
    music = sum(0.12 * np.sin(2 * np.pi * f * t) for f in (220, 261.6, 329.6))          # chord
    music += 0.18 * np.sin(2 * np.pi * 55 * t) * (0.5 + 0.5 * np.sign(np.sin(2 * np.pi * 2 * t)))  # bass
    kick = np.exp(-np.arange(int(0.15 * sr)) / (0.03 * sr)) * np.sin(2 * np.pi * 60 * np.arange(int(0.15 * sr)) / sr)
    for start in range(0, t.size - kick.size, sr // 2):
        music[start:start + kick.size] += 0.6 * kick                                          # drums
    voice = np.concatenate([np.zeros(sr // 2), clean, np.zeros(sr // 2)])[: t.size]
    mix = voice + music * (np.sqrt(np.mean(voice ** 2)) / np.sqrt(np.mean(music ** 2)))      # music as loud as voice
    with tempfile.TemporaryDirectory() as tmp:
        p = Path(tmp) / "selftest_mix.wav"
        vk.sf.write(p, mix / np.max(np.abs(mix)) * 0.9, sr)
        vocals, _, vsr = separate(p, fine)
    import librosa
    vocals = librosa.resample(vocals, orig_sr=vsr, target_sr=sr) if vsr != sr else vocals
    print(f"SI-SDR before separation (mix vs clean): {si_sdr(voice, mix):.1f} dB")
    print(f"SI-SDR after Demucs (vocals vs clean):   {si_sdr(voice, vocals):.1f} dB")
    print(f"Whisper on isolated: {vk.asr(vocals.astype(np.float32), sr, 'en')}")


if __name__ == "__main__":
    ap = argparse.ArgumentParser()
    ap.add_argument("path", nargs="?")
    ap.add_argument("--lang", default="vi", choices=["vi", "en"])
    ap.add_argument("--fine", action="store_true")
    ap.add_argument("--selftest", action="store_true")
    a = ap.parse_args()
    if a.selftest or not a.path:
        selftest(a.fine)
    else:
        isolate(Path(a.path).resolve(), a.lang, a.fine)
