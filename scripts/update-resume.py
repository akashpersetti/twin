# /// script
# requires-python = ">=3.12"
# dependencies = ["pypdf>=6.7.0", "anthropic>=0.40.0"]
# ///

"""
Update resume pipeline.

Usage:
    uv run scripts/update-resume.py <pdf> [--dry-run] [--no-facts] [--model MODEL]

After running, commit and push:
    git add frontend/data/resume.ts frontend/public/resume.pdf backend/data/resume.pdf
    git commit -m "update resume"
    git push
"""

import argparse
import json
import os
import shutil
import sys
import tempfile
from pathlib import Path

from anthropic import Anthropic
from pypdf import PdfReader

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent
FRONTEND_PDF = ROOT / "frontend/public/resume.pdf"
BACKEND_PDF = ROOT / "backend/data/resume.pdf"
RESUME_TS = ROOT / "frontend/data/resume.ts"
FACTS_JSON = ROOT / "backend/data/facts.json"

TOP_LEVEL_KEYS = [
    "basics",
    "impact",
    "experience",
    "projects",
    "skills",
    "education",
    "certifications",
    "cocurricular",
    "extracurricular",
    "communityService",
]

DEFAULT_MODEL = "claude-sonnet-4-5"


def extract_pdf_text(pdf_path: Path) -> str:
    reader = PdfReader(str(pdf_path))
    text = ""
    for page in reader.pages:
        t = page.extract_text()
        if t:
            text += t
    return text


def validate_ts(ts: str) -> tuple[bool, str]:
    # Strip accidental markdown fences
    if ts.startswith("```"):
        lines = ts.splitlines()
        ts = "\n".join(lines[1:] if lines[0].startswith("```") else lines)
        if ts.rstrip().endswith("```"):
            ts = ts.rstrip()[:-3].rstrip()

    if not ts.strip().startswith("export const resume = {"):
        return False, "Does not start with 'export const resume = {'"
    if not ts.strip().endswith("} as const;"):
        return False, "Does not end with '} as const;'"

    for key in TOP_LEVEL_KEYS:
        if key + ":" not in ts:
            return False, f"Missing top-level key: {key}"

    # Balanced braces
    opens = ts.count("{")
    closes = ts.count("}")
    if opens != closes:
        return False, f"Unbalanced braces: {opens} {{ vs {closes} }}"

    # Balanced brackets
    opens_b = ts.count("[")
    closes_b = ts.count("]")
    if opens_b != closes_b:
        return False, f"Unbalanced brackets: {opens_b} [ vs {closes_b} ]"

    return True, ts.strip()


def update_resume_ts(client: Anthropic, pdf_text: str, current_ts: str, model: str, dry_run: bool) -> bool:
    truncated = pdf_text[:12000] if len(pdf_text) > 12000 else pdf_text

    system = (
        "You are a TypeScript code generator. "
        "Output ONLY valid TypeScript starting with `export const resume = {` and ending with `} as const;`. "
        "No markdown, no commentary, no explanation. "
        "Preserve ALL field names exactly as they appear in the template. "
        "If a field's value cannot be determined from the PDF, keep the template value unchanged. "
        "Dates should be formatted like 'Jun 2025 – Aug 2025'."
    )

    user_message = (
        f"Here is the current resume.ts template (preserve all field names):\n\n{current_ts}\n\n"
        f"Here is the extracted text from the new resume PDF:\n\n{truncated}\n\n"
        "Generate an updated resume.ts using the PDF data, keeping the exact same TypeScript structure."
    )

    print("Calling Claude to generate resume.ts...")
    message = client.messages.create(
        model=model,
        max_tokens=8192,
        messages=[{"role": "user", "content": user_message}],
        system=system,
    )
    raw = message.content[0].text

    ok, result = validate_ts(raw)
    if not ok:
        print(f"\nValidation failed: {result}", file=sys.stderr)
        fail_path = Path("/tmp/resume_ts_failed.ts")
        fail_path.write_text(raw, encoding="utf-8")
        print(f"Raw output saved to {fail_path}", file=sys.stderr)
        return False

    if dry_run:
        print("\n--- Generated resume.ts (dry run) ---")
        print(result)
        print("--- End ---\n")
        return True

    # Atomic write
    with tempfile.NamedTemporaryFile(
        mode="w", encoding="utf-8", suffix=".ts", delete=False
    ) as tmp:
        tmp.write(result + "\n")
        tmp_path = tmp.name

    os.replace(tmp_path, RESUME_TS)
    print(f"  Written: {RESUME_TS}")
    return True


def update_facts_json(client: Anthropic, pdf_text: str, current_facts: str, model: str, dry_run: bool) -> bool:
    truncated = pdf_text[:12000] if len(pdf_text) > 12000 else pdf_text

    system = (
        "You are a JSON generator. "
        "Output ONLY valid JSON — no markdown, no commentary, no explanation. "
        "Preserve all existing keys. Add or update values based on the resume PDF. "
        "If a value cannot be determined, keep the existing value."
    )

    user_message = (
        f"Here is the current facts.json:\n\n{current_facts}\n\n"
        f"Here is the extracted text from the resume PDF:\n\n{truncated}\n\n"
        "Generate updated facts.json using the PDF data, keeping all existing keys."
    )

    print("Calling Claude to generate facts.json...")
    message = client.messages.create(
        model=model,
        max_tokens=2048,
        messages=[{"role": "user", "content": user_message}],
        system=system,
    )
    raw = message.content[0].text.strip()

    # Strip markdown fences if present
    if raw.startswith("```"):
        lines = raw.splitlines()
        raw = "\n".join(lines[1:])
        if raw.rstrip().endswith("```"):
            raw = raw.rstrip()[:-3].rstrip()

    try:
        parsed = json.loads(raw)
    except json.JSONDecodeError as e:
        print(f"\nfacts.json validation failed: {e}", file=sys.stderr)
        Path("/tmp/facts_json_failed.json").write_text(raw, encoding="utf-8")
        print("Raw output saved to /tmp/facts_json_failed.json", file=sys.stderr)
        return False

    if dry_run:
        print("\n--- Generated facts.json (dry run) ---")
        print(json.dumps(parsed, indent=2))
        print("--- End ---\n")
        return True

    with tempfile.NamedTemporaryFile(
        mode="w", encoding="utf-8", suffix=".json", delete=False
    ) as tmp:
        json.dump(parsed, tmp, indent=2)
        tmp.write("\n")
        tmp_path = tmp.name

    os.replace(tmp_path, FACTS_JSON)
    print(f"  Written: {FACTS_JSON}")
    return True


def main() -> None:
    parser = argparse.ArgumentParser(description="Update resume pipeline from a PDF.")
    parser.add_argument("pdf", type=Path, help="Path to the new resume PDF")
    parser.add_argument("--dry-run", action="store_true", help="Generate but don't write files")
    parser.add_argument("--no-facts", action="store_true", help="Skip updating facts.json")
    parser.add_argument("--model", default=DEFAULT_MODEL, help=f"Anthropic model (default: {DEFAULT_MODEL})")
    args = parser.parse_args()

    # 1. Validate API key
    api_key = os.environ.get("ANTHROPIC_API_KEY")
    if not api_key:
        print("Error: ANTHROPIC_API_KEY environment variable is not set.", file=sys.stderr)
        sys.exit(1)

    # 2. Validate PDF path
    pdf_path: Path = args.pdf.resolve()
    if not pdf_path.exists():
        print(f"Error: PDF not found: {pdf_path}", file=sys.stderr)
        sys.exit(1)
    if pdf_path.suffix.lower() != ".pdf":
        print(f"Error: File does not appear to be a PDF: {pdf_path}", file=sys.stderr)
        sys.exit(1)

    print(f"Source PDF: {pdf_path}")

    # 3. Copy PDF to destinations
    if not args.dry_run:
        FRONTEND_PDF.parent.mkdir(parents=True, exist_ok=True)
        BACKEND_PDF.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(pdf_path, FRONTEND_PDF)
        print(f"  Copied to: {FRONTEND_PDF}")
        shutil.copy2(pdf_path, BACKEND_PDF)
        print(f"  Copied to: {BACKEND_PDF}")
    else:
        print("  [dry-run] Skipping PDF copy")

    # 4. Extract PDF text
    print("Extracting text from PDF...")
    pdf_text = extract_pdf_text(pdf_path)
    if len(pdf_text) < 200:
        print(
            f"\nWARNING: Only {len(pdf_text)} characters extracted from PDF. "
            "This may be a scanned/image PDF. Results may be inaccurate.\n",
            file=sys.stderr,
        )
    else:
        print(f"  Extracted {len(pdf_text)} characters")

    client = Anthropic(api_key=api_key)

    # 5. Update resume.ts
    current_ts = RESUME_TS.read_text(encoding="utf-8")
    ts_ok = update_resume_ts(client, pdf_text, current_ts, args.model, args.dry_run)
    if not ts_ok:
        sys.exit(1)

    # 6. Update facts.json
    if not args.no_facts:
        current_facts = FACTS_JSON.read_text(encoding="utf-8")
        facts_ok = update_facts_json(client, pdf_text, current_facts, args.model, args.dry_run)
        if not facts_ok:
            sys.exit(1)

    # 7. Summary
    print("\nDone!")
    if not args.dry_run:
        print("\nNext steps:")
        print("  git add frontend/data/resume.ts frontend/public/resume.pdf backend/data/resume.pdf backend/data/facts.json")
        print('  git commit -m "update resume"')
        print("  git push   # GitHub Actions auto-deploys everything")


if __name__ == "__main__":
    main()
