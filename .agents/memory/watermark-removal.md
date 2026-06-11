---
name: Watermark removal for studio photos
description: Most effective pipeline for stripping the tiled semi-transparent "FOTOESTUDIOA" watermark from the couple's engagement photos to a studio-quality result.
---

# Removing the studio watermark from couple photos

The couple's photographer ships images stamped with a faint, tiled, semi-transparent
"FOTOESTUDIOA" watermark over the whole frame. Requires a transient
Python 3.11 + opencv-python-headless/numpy/pillow install (uninstall afterward — it is
NOT a runtime dep of the app; the install also adds a `.replit [nix] packages` line and
`main.py`/`pyproject.toml`/`uv.lock` that should be removed when done).

**Best approach (much better than inpaint-only):**
1. **Background removal first** (`remove_image_background_tool` on the original) — the
   watermark over the smooth studio backdrop is the largest area, and cutting the
   couple out drops ALL of it at once and gives a clean contour. The tool returns a real
   alpha channel even though a flattened preview can look like nothing happened — verify
   the alpha, or composite over magenta to inspect.
2. **Composite onto a fresh backdrop** — a soft radial warm-white→taupe gradient with a
   gentle vignette and a faint grounding shadow reads as a professional studio portrait
   and matches the invitation's warm palette.
3. **Remove residual watermark on clothing only** — brightness/saturation-gated
   black-hat + top-hat mask (light fabric: V>140, S<72), protect strong folds/seams with
   Canny, inpaint with `INPAINT_NS`. Multi-pass.
4. **Textured fabric (the dress)** — inpaint alone leaves faint text and smears the
   ruching. Add an edge-preserving **bilateral "surface blur"** blended ~0.7 over the
   fabric mask: it erases the low-contrast watermark while keeping the high-contrast
   folds. This is the key to a clean dress without a plastic look.
5. Finish: warmth, mild CLAHE clarity, +saturation, gentle sigmoidal contrast, 1.5×
   upscale, unsharp. Export JPEG q94.

**Why / hard-won lessons:**
- **Never run a watermark-inpaint pass over skin/faces.** A "general" pass over skin
  produced a blocky smeared patch on a cheek — worse than the faint traces it removed.
  Restrict inpainting to bright low-saturation fabric; protect facial features.
- Faint residual that only shows under heavy zoom is invisible at the invitation's
  display size (~560px wide) — don't over-process chasing it and risk damaging detail.
- Aggressive Haar face-protect / 2-pass inpaint variants over-smeared faces — rejected.
