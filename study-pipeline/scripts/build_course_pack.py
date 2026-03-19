import argparse
import json
from pathlib import Path


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument("--reviewed-root", default="study-pipeline/reviewed")
    parser.add_argument("--output", default="js/generated-course-packs.js")
    args = parser.parse_args()

    reviewed_root = Path(args.reviewed_root)
    packs = {}
    for pack_file in reviewed_root.glob("*/course-pack.json"):
        payload = json.loads(pack_file.read_text(encoding="utf-8"))
        packs[payload["id"]] = payload

    output = "window.GENERATED_COURSE_PACKS = " + json.dumps(packs, indent=2) + ";\n"
    Path(args.output).write_text(output, encoding="utf-8")
    print(f"Wrote {len(packs)} reviewed pack(s) to {args.output}")


if __name__ == "__main__":
    main()
