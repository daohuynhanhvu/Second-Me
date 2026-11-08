"""Small inpainting helpers shared by the painted-screen tools (numpy + Pillow only)."""
import numpy as np
from PIL import Image, ImageFilter


def fill_smooth(img: np.ndarray, hole: np.ndarray) -> np.ndarray:
    """Pyramid fill: each level averages known neighbours; holes take the coarser level."""
    if min(img.shape[:2]) < 4 or not hole.any():
        out = img.copy()
        if hole.any():
            known = ~hole
            out[hole] = img[known].mean(0) if known.any() else 0
        return out
    h, w = hole.shape
    known = (~hole).astype(np.float32)
    ph, pw = h + h % 2, w + w % 2
    pi = np.zeros((ph, pw, 3), np.float32); pi[:h, :w] = img * known[..., None]
    pk = np.zeros((ph, pw), np.float32); pk[:h, :w] = known
    si = pi.reshape(ph // 2, 2, pw // 2, 2, 3).sum((1, 3))
    sk = pk.reshape(ph // 2, 2, pw // 2, 2).sum((1, 3))
    small = np.where(sk[..., None] > 0, si / np.maximum(sk, 1e-6)[..., None], 0)
    small = fill_smooth(small, sk == 0)
    up = small.repeat(2, 0).repeat(2, 1)[:h, :w]
    up = np.asarray(Image.fromarray(np.clip(up, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.2))).astype(np.float32)
    out = img.copy()
    out[hole] = up[hole]
    return out


def grain_like(sample: np.ndarray, shape: tuple[int, int], strength: float = 0.35, seed: int = 7) -> np.ndarray:
    """Fresh noise with the fine-grain strength of `sample` (copying real texture repeats visibly)."""
    blur = np.asarray(Image.fromarray(sample.astype(np.uint8)).filter(ImageFilter.GaussianBlur(3))).astype(np.float32)
    sigma = (sample.astype(np.float32) - blur).reshape(-1, 3).std(0)
    rng = np.random.default_rng(seed)
    lum = rng.normal(0, 1, shape).astype(np.float32)
    lum = np.asarray(Image.fromarray(np.clip(lum * 40 + 128, 0, 255).astype(np.uint8)).filter(ImageFilter.GaussianBlur(1.0))).astype(np.float32)
    lum = (lum - lum.mean()) / max(lum.std(), 1e-6)
    return lum[..., None] * sigma[None, None, :] * strength


def erase(im: np.ndarray, hole: np.ndarray, grain_box: tuple[int, int, int, int], strength: float = 0.35) -> np.ndarray:
    """Refill `hole` from its surroundings plus matching grain sampled in grain_box (x0, y0, x1, y1)."""
    gx0, gy0, gx1, gy1 = grain_box
    smooth = fill_smooth(im.astype(np.float32), hole)
    grain = grain_like(im[gy0:gy1, gx0:gx1], hole.shape, strength)
    return np.where(hole[..., None], smooth + grain, im)
