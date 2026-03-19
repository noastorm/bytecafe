import argparse
import json
import site
import sys
from pathlib import Path

user_site = site.getusersitepackages()
if user_site not in sys.path:
    sys.path.append(user_site)

try:
    import fitz
except ImportError:
    import pymupdf as fitz


def extract_lecture(lecture, extracted_root, dpi):
    pdf_path = Path(lecture["sourcePdfPath"])
    lecture_dir = extracted_root / lecture["lectureId"]
    slides_dir = lecture_dir / "slides"
    slides_dir.mkdir(parents=True, exist_ok=True)

    if not pdf_path.exists():
      return {
        "lectureId": lecture["lectureId"],
        "title": lecture["title"],
        "sourcePdfPath": str(pdf_path),
        "status": "missing_source",
        "slides": []
      }

    doc = fitz.open(pdf_path)
    slide_records = []
    scale = dpi / 72.0
    matrix = fitz.Matrix(scale, scale)

    for idx, page in enumerate(doc, start=1):
        slide_id = f"{lecture['lectureId']}_s{idx:03d}"
        text = page.get_text("text").strip()
        image_path = slides_dir / f"{slide_id}.png"
        pix = page.get_pixmap(matrix=matrix, alpha=False)
        pix.save(image_path)
        slide_records.append({
            "slideId": slide_id,
            "slideNumber": idx,
            "extractedText": text,
            "imagePath": str(image_path).replace("\\", "/"),
            "sourceLectureId": lecture["lectureId"]
        })

    payload = {
        "courseId": lecture["courseId"],
        "lectureId": lecture["lectureId"],
        "title": lecture["title"],
        "instructor": lecture.get("instructor", ""),
        "date": lecture.get("date", ""),
        "sourcePdfPath": str(pdf_path).replace("\\", "/"),
        "status": "extracted",
        "slideCount": len(slide_records),
        "slides": slide_records
    }
    (lecture_dir / "lecture.json").write_text(json.dumps(payload, indent=2), encoding="utf-8")
    return payload


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--manifest", required=True)
    parser.add_argument("--output-root", default="study-pipeline/extracted")
    parser.add_argument("--dpi", type=int, default=120)
    args = parser.parse_args()

    manifest_path = Path(args.manifest)
    manifest = json.loads(manifest_path.read_text(encoding="utf-8"))
    course_id = manifest["courseId"]
    extracted_root = Path(args.output_root) / course_id
    extracted_root.mkdir(parents=True, exist_ok=True)

    results = []
    for lecture in manifest["lectures"]:
        lecture = {**lecture, "courseId": course_id}
        results.append(extract_lecture(lecture, extracted_root, args.dpi))

    summary = {
        "courseId": course_id,
        "title": manifest.get("title", course_id),
        "lectureCount": len(results),
        "lectures": results
    }
    (extracted_root / "manifest.extracted.json").write_text(json.dumps(summary, indent=2), encoding="utf-8")
    print(f"Extracted {len(results)} lecture source(s) to {extracted_root}")


if __name__ == "__main__":
    main()
