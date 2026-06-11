---
name: Watermark removal for studio photos
description: Pipeline for stripping the tiled semi-transparent "FOTOESTUDIOA" watermark from the couple's engagement photos to a natural, studio-quality result.
---

# Removing the studio watermark from couple photos

The couple's photographer ships images stamped with a faint, tiled, semi-transparent
"FOTOESTUDIOA"/"FOTOS" watermark repeated diagonally over the whole frame. Requires a
transient Python 3.11 + opencv-python-headless/numpy/pillow install (uninstall when done;
the install also adds a `.replit [nix] packages` line and `main.py`/`pyproject.toml`/
`uv.lock` that should be removed — note these may end up git-tracked from a prior
auto-commit, so they show as deletions).

**No AI fallback:** `generateImage` is text-to-image only — there is NO img2img/edit/inpaint
function, so the real faces cannot be AI-retouched. Classical OpenCV is the only option.

**What works (natural, professional) — pipeline:**
1. **Background removal first** (`remove_image_background_tool`) drops the entire watermarked
   backdrop at once and gives a clean contour. (Note: it returns the cutout downscaled, e.g.
   900x600.) Composite onto a soft, near-neutral studio gradient with a SUBTLE vignette.
2. **Even, edge-preserving smoothing** with `cv2.edgePreservingFilter` blended UNIFORMLY —
   this is the key to no blotches. Blend stronger on skin (~0.7) than elsewhere (~0.4).
   Add back only tiny-radius (~1px) micro-detail so it isn't plastic; the watermark strokes
   are wider so they don't come back.
3. **Flat white fabric** (bright + low-sat + not-skin mask): apply STRONG multi-pass
   edge-preserving smoothing (~0.9 blend). Folds/plackets are high-contrast edges so they
   survive; the thin watermark text on flat panels is erased.
4. **Textured fabric (her ruched dress): leave it natural** — the watermark is already hidden
   by the weave; processing it just creates blotches.
5. **Neutral white balance** (gain from near-white highlights) + **REDUCE saturation (~0.8x)**
   + mild S-curve. NO CLAHE, NO heavy warmth.

**Hard-won lessons (what the user rejected):**
- **`INPAINT` + heavy `bilateralFilter` "surface blur" on fabric → ugly watercolor BLOTCHES
  ("manchas").** User called it unprofessional. Inpaint is the wrong tool here.
- **A general inpaint/smooth pass over faces → blocky cheek smear.** Never inpaint skin.
- **Adding warmth + +saturation + CLAHE → oversaturated/orange, unprofessional.** Go natural.
- **FFT notch filtering fails** — the watermark text is broadband, not a pure periodic carrier.
- Faint residual visible only at extreme zoom is invisible at the invitation display width
  (~560px); do NOT over-process chasing it — over-processing is what the user disliked.
