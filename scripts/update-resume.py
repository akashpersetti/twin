# /// script
# requires-python = ">=3.12"
# dependencies = ["pypdf>=6.7.0", "openai-agents>=0.0.19"]
# ///

"""
Update resume pipeline.

Usage:
    uv run scripts/update-resume.py <pdf> [--dry-run] [--model MODEL]

After running, commit and push:
    git add frontend/data/resume.ts frontend/public/resume.pdf backend/data/resume.pdf backend/data/facts.json backend/data/summary.txt
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

from agents import Agent, OpenAIChatCompletionsModel, Runner
from openai import AsyncOpenAI
from pypdf import PdfReader

SCRIPT_DIR = Path(__file__).resolve().parent
ROOT = SCRIPT_DIR.parent
FRONTEND_PDF = ROOT / "frontend/public/resume.pdf"
BACKEND_PDF = ROOT / "backend/data/resume.pdf"
RESUME_TS = ROOT / "frontend/data/resume.ts"
FACTS_JSON = ROOT / "backend/data/facts.json"
SUMMARY_TXT = ROOT / "backend/data/summary.txt"

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

DEFAULT_MODEL = "openai/gpt-oss-120b:free"
OPENROUTER_BASE_URL = "https://openrouter.ai/api/v1"


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


def update_resume_ts(pdf_text: str, current_ts: str, model: str, dry_run: bool, client: AsyncOpenAI) -> bool:
    truncated = pdf_text[:12000] if len(pdf_text) > 12000 else pdf_text

    instructions = (
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

    agent = Agent(
        name="ResumeUpdater",
        instructions=instructions,
        model=OpenAIChatCompletionsModel(model=model, openai_client=client),
    )

    print("Calling model to generate resume.ts...")
    result = Runner.run_sync(agent, user_message)
    raw = result.final_output

    ok, result_ts = validate_ts(raw)
    if not ok:
        print(f"\nValidation failed: {result_ts}", file=sys.stderr)
        fail_path = Path("/tmp/resume_ts_failed.ts")
        fail_path.write_text(raw, encoding="utf-8")
        print(f"Raw output saved to {fail_path}", file=sys.stderr)
        return False

    if dry_run:
        print("\n--- Generated resume.ts (dry run) ---")
        print(result_ts)
        print("--- End ---\n")
        return True

    # Atomic write
    with tempfile.NamedTemporaryFile(
        mode="w", encoding="utf-8", suffix=".ts", delete=False
    ) as tmp:
        tmp.write(result_ts + "\n")
        tmp_path = tmp.name

    os.replace(tmp_path, RESUME_TS)
    print(f"  Written: {RESUME_TS}")
    return True


def update_facts_json(pdf_text: str, current_facts: str, model: str, dry_run: bool, client: AsyncOpenAI) -> bool:
    truncated = pdf_text[:12000] if len(pdf_text) > 12000 else pdf_text

    instructions = (
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

    agent = Agent(
        name="FactsUpdater",
        instructions=instructions,
        model=OpenAIChatCompletionsModel(model=model, openai_client=client),
    )

    print("Calling model to generate facts.json...")
    result = Runner.run_sync(agent, user_message)
    raw = result.final_output.strip()

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


def update_summary_txt(pdf_text: str, current_summary: str, model: str, dry_run: bool, client: AsyncOpenAI) -> bool:
    truncated = pdf_text[:12000] if len(pdf_text) > 12000 else pdf_text

    instructions = (
        "You are a professional bio writer. "
        "Output ONLY the updated summary text — no markdown, no headings, no explanation. "
        "The summary is used as context for an AI digital twin chatbot on a personal website. "
        "Keep the same tone, style, and structure as the existing summary. "
        "Update it to reflect the new resume content. Keep it concise (3-5 sentences)."
    )

    user_message = (
        f"Here is the current summary.txt:\n\n{current_summary}\n\n"
        f"Here is the extracted text from the new resume PDF:\n\n{truncated}\n\n"
        "Generate an updated summary.txt reflecting the new resume content."
    )

    agent = Agent(
        name="SummaryUpdater",
        instructions=instructions,
        model=OpenAIChatCompletionsModel(model=model, openai_client=client),
    )

    print("Calling model to generate summary.txt...")
    result = Runner.run_sync(agent, user_message)
    raw = result.final_output.strip()

    if not raw:
        print("\nsummary.txt validation failed: empty output", file=sys.stderr)
        return False

    if dry_run:
        print("\n--- Generated summary.txt (dry run) ---")
        print(raw)
        print("--- End ---\n")
        return True

    with tempfile.NamedTemporaryFile(
        mode="w", encoding="utf-8", suffix=".txt", delete=False
    ) as tmp:
        tmp.write(raw + "\n")
        tmp_path = tmp.name

    os.replace(tmp_path, SUMMARY_TXT)
    print(f"  Written: {SUMMARY_TXT}")
    return True


def main() -> None:
    parser = argparse.ArgumentParser(description="Update resume pipeline from a PDF.")
    parser.add_argument("pdf", type=Path, help="Path to the new resume PDF")
    parser.add_argument("--dry-run", action="store_true", help="Generate but don't write files")
    parser.add_argument("--model", default=DEFAULT_MODEL, help=f"OpenRouter model (default: {DEFAULT_MODEL})")
    args = parser.parse_args()

    # 1. Validate API key
    api_key = os.environ.get("OPENROUTER_API_KEY")
    if not api_key:
        print("Error: OPENROUTER_API_KEY environment variable is not set.", file=sys.stderr)
        sys.exit(1)

    # 2. Configure OpenRouter client
    openrouter_client = AsyncOpenAI(api_key=api_key, base_url=OPENROUTER_BASE_URL)

    # 3. Validate PDF path
    pdf_path: Path = args.pdf.resolve()
    if not pdf_path.exists():
        print(f"Error: PDF not found: {pdf_path}", file=sys.stderr)
        sys.exit(1)
    if pdf_path.suffix.lower() != ".pdf":
        print(f"Error: File does not appear to be a PDF: {pdf_path}", file=sys.stderr)
        sys.exit(1)

    print(f"Source PDF: {pdf_path}")
    print(f"Model: {args.model}")

    # 4. Copy PDF to destinations
    if not args.dry_run:
        FRONTEND_PDF.parent.mkdir(parents=True, exist_ok=True)
        BACKEND_PDF.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(pdf_path, FRONTEND_PDF)
        print(f"  Copied to: {FRONTEND_PDF}")
        shutil.copy2(pdf_path, BACKEND_PDF)
        print(f"  Copied to: {BACKEND_PDF}")
    else:
        print("  [dry-run] Skipping PDF copy")

    # 5. Extract PDF text
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

    # 6. Update resume.ts
    current_ts = RESUME_TS.read_text(encoding="utf-8")
    ts_ok = update_resume_ts(pdf_text, current_ts, args.model, args.dry_run, openrouter_client)
    if not ts_ok:
        sys.exit(1)

    # 7. Update facts.json
    current_facts = FACTS_JSON.read_text(encoding="utf-8")
    facts_ok = update_facts_json(pdf_text, current_facts, args.model, args.dry_run, openrouter_client)
    if not facts_ok:
        sys.exit(1)

    # 8. Update summary.txt
    current_summary = SUMMARY_TXT.read_text(encoding="utf-8")
    summary_ok = update_summary_txt(pdf_text, current_summary, args.model, args.dry_run, openrouter_client)
    if not summary_ok:
        sys.exit(1)

    # 9. Done
    print("\nDone!")
    if not args.dry_run:
        print("\nNext steps:")
        print("  git add frontend/data/resume.ts frontend/public/resume.pdf backend/data/resume.pdf backend/data/facts.json backend/data/summary.txt")
        print('  git commit -m "update resume"')
        print("  git push   # GitHub Actions auto-deploys everything")


if __name__ == "__main__":
    main()
