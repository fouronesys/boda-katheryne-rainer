---
name: Watermark removal for studio photos
description: Reusable OpenCV recipe for stripping tiled semi-transparent "FOTOESTUDIOA" watermarks from the couple's engagement photos, plus a color-grading pass.
---

# Removing the studio watermark from couple photos

The couple's photographer ships images stamped with a faint, tiled, semi-transparent
"FOTOESTUDIOA" watermark. When new photos arrive, this approach removed it cleanly
without smearing faces. Requires a transient Python 3.11 + opencv-python-headless,
numpy, pillow install (uninstall afterward — it is NOT a runtime dep of the app).

**Recipe (per image):**
- Build a watermark mask with morphology black-hat **and** top-hat (catches both dark
  and light watermark strokes), thresholded between a low/high band tuned per image.
  - Bright/well-lit photo: band ~lo=6, hi=45.
  - Dark/spotlight photo: first crush blacks (set black-point ~46) so the watermark
    lifts above shadow noise, then mask with band ~lo=5, hi=55.
- Protect real edges (faces, hair, clothing seams) from the mask using a Canny edge
  map so inpainting does not erase facial detail.
- Inpaint the masked regions with `cv2.INPAINT_TELEA`.
- Finish with a grading pass: slight warmth, contrast, saturation bump, and unsharp
  mask. Export JPEG q92.

**Why:** Aggressive face-protect variants (Haar-cascade masking, 2-pass inpaint)
**over-smeared faces** — rejected. A faint residual on clothing/halo remains but is
invisible at the invitation's display size (`max-w-xl`, ~576px). Tell the user a faint
residual may exist rather than smearing faces to chase it.

**How to apply:** Source photos live in `attached_assets/`; edited finals go to
`artifacts/wedding/src/assets/` and are imported via the `@/assets/` Vite alias (same
mechanism as the ocean posters). Place them in the "Nuestra Historia" section.
