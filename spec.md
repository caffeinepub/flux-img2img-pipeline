# Flux Img2Img Pipeline

## Current State
New project. No existing code.

## Requested Changes (Diff)

### Add
- Pipeline editor UI: list of (imageUrl, prompt) pairs that can be added, edited, removed
- Default 10 pairs pre-loaded from user-provided data
- Run Pipeline button: processes each pair sequentially using Puter.js `ai.txt2img` / `img2img` with Flux 1.0 model
- Per-item status: idle, processing, done, error
- Output display: show original image alongside generated result
- Backend stores saved pipeline configs (list of url+prompt pairs)

### Modify
N/A

### Remove
N/A

## Implementation Plan
1. Backend: store pipeline configs (array of {url, prompt} objects), CRUD operations
2. Frontend: pipeline editor table with editable URL + prompt fields, add/remove rows
3. Frontend: run pipeline using Puter.js `puter.ai.img2img` with model `flux-1` sequentially
4. Frontend: display results grid with before/after images and status badges
5. Frontend: progress bar and per-item indicators
