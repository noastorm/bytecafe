import argparse
import json
from pathlib import Path


def draft_from_extracted(lecture_json_path, output_dir):
    lecture = json.loads(Path(lecture_json_path).read_text(encoding="utf-8"))
    combined_text = "\n".join(slide["extractedText"] for slide in lecture.get("slides", []) if slide.get("extractedText"))
    summary_seed = " ".join(combined_text.split())[:320]
    draft = {
        "lectureId": lecture["lectureId"],
        "reviewStatus": "draft",
        "lectureSummary": summary_seed,
        "keyConcepts": [],
        "vocabulary": [],
        "processes": [],
        "compareContrast": [],
        "testableFacts": [],
        "diagramCandidates": [],
        "misconceptions": [],
        "sourceLecturePath": str(lecture_json_path).replace("\\", "/")
    }
    out_path = output_dir / f"{lecture['lectureId']}.json"
    out_path.parent.mkdir(parents=True, exist_ok=True)
    out_path.write_text(json.dumps(draft, indent=2), encoding="utf-8")


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--course", required=True)
    parser.add_argument("--extracted-root", default="study-pipeline/extracted")
    parser.add_argument("--curriculum-root", default="study-pipeline/curriculum")
    args = parser.parse_args()

    extracted_dir = Path(args.extracted_root) / args.course
    output_dir = Path(args.curriculum_root) / args.course / "lectures"

    for lecture_json in extracted_dir.glob("*/lecture.json"):
        draft_from_extracted(lecture_json, output_dir)

    print(f"Normalized lecture drafts written to {output_dir}")


if __name__ == "__main__":
    main()
