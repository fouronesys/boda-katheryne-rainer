---
name: Watermark removal for studio photos
description: Pipeline for stripping the tiled semi-transparent "FOTOESTUDIOA" watermark from the couple's engagement photos to a natural, studio-quality result.
---

# Removing the studio watermark from couple photos

The couple's photographer ships images stamped with a faint, tiled, semi-transparent
"FOTOESTUDIOA"/"FOTOS" watermark repeated diagonally over the whole frame. Done with a
transient Python 3.11 + opencv-python-headless/numpy/pillow install; clean up scaffold
files (`main.py`/`pyproject.toml`/`uv.lock`) when finished.

**No AI fallback:** `generateImage` is text-to-image only — there is NO img2img/edit/inpaint
function, so the real faces cannot be AI-retouched. Classical OpenCV is the only option.

**What works — pipeline (current, texture-preserving):**
1. **Background removal first** (`remove_image_background_tool`) drops the entire watermarked
   backdrop at once and gives a clean contour. (Note: it returns the cutout downscaled, e.g.
   900x600.) Composite onto a soft studio gradient with a SUBTLE vignette.
2. **Gentle skin smoothing only** (`cv2.edgePreservingFilter` ~0.55 blend on a YCrCb skin mask,
   ~0.14 elsewhere). Add back fine micro-detail, MORE off-skin than on-skin, to keep weave.
3. **Texture-AWARE watermark removal on flat fabric** — this is the key trick. Compute a local
   high-frequency energy map (`|img - gauss|` then blur). Protect only HIGH-AMPLITUDE texture
   (real ruching/weave); the faint watermark text is LOW-amplitude, so it stays in the
   "flat/targeted" set. Mask = bright(low-sat) AND flat(low-energy) AND not-skin; on that mask
   apply STRONG multi-pass edge-preserving smoothing. Folds/plackets are high-contrast edges so
   they survive; faint text on flat panels is erased — and visible weave is untouched.
4. Optional finish: neutral white balance + lower saturation (~0.8x) for a natural look, OR a
   **sepia tone** (classic sepia matrix, ~0.88 blend) for a warm vintage look.

**Hard-won lessons (what the user rejected, in order):**
- **`INPAINT` + heavy `bilateralFilter` "surface blur" → watercolor BLOTCHES ("manchas").**
  Inpaint is the wrong tool. Never inpaint skin (blocky cheek smear) or fabric.
- **Warmth + +saturation + CLAHE → oversaturated/orange.** Avoid.
- **Strong UNIFORM smoothing over ALL white fabric → "la ropa quedó sin textura"** (clothing
  looks plastic/textureless). Must be texture-aware (step 3), not blanket.
- **Pitfall in step 3:** the watermark text itself registers as high-freq energy, so a naive
  flat-detector AVOIDS exactly the watermark. Fix: divide energy by a LARGER constant so only
  bold real texture counts as "protected"; faint text falls into the targeted flat set.
- **Sepia makes the watermark MORE visible** (removes the color variation that hid it), so when
  going sepia you MUST do the texture-aware removal first or the text reappears.
- **FFT notch filtering fails** — watermark text is broadband, not a pure periodic carrier.
- Faint residual in low-contrast transition zones (near hair) is invisible at the invitation
  display width (~560px); do NOT over-process chasing it — over-processing is what got rejected.
