# Study Pipeline

This folder turns lecture material into reviewed ByteCafe course-pack content.

Pipeline stages:

- `sources/`: raw PDFs and lecture manifests
- `extracted/`: per-slide text, thumbnails, and extracted metadata
- `curriculum/`: normalized lecture drafts and learning atoms
- `authoring/`: draft puzzles, notes, and visual specs
- `reviewed/`: approved course-pack JSON ready for export
- `scripts/`: extraction, normalization, and build tools
- `schemas/`: JSON shape references
- `templates/`: starter files for new courses

Core rule:

- Raw slides are authoring references only.
- Runtime content must come from `reviewed/`, not directly from `sources/`.

## Quick Start

1. Put lecture PDFs in a course manifest under `sources/<course-id>/lecture-manifest.json`.
2. Run extraction:

```bash
python study-pipeline/scripts/extract_course_sources.py --manifest study-pipeline/sources/molbio_w26/lecture-manifest.json
```

3. Generate normalized draft lectures:

```bash
python study-pipeline/scripts/normalize_lecture_draft.py --course molbio_w26
```

4. Review and edit the generated files in `curriculum/` and `authoring/`.
5. Promote approved content into `reviewed/<course-id>/course-pack.json`.
6. Export reviewed packs into the runtime bundle:

```bash
python study-pipeline/scripts/build_course_pack.py --reviewed-root study-pipeline/reviewed --output js/generated-course-packs.js
```

## Installed Tooling

This repo uses:

- `pypdf`
- `pdfplumber`
- `pymupdf`

Install from the repo root with:

```bash
python -m pip install -r study-pipeline/requirements.txt
```
