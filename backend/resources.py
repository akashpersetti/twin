from pypdf import PdfReader
import json

# Read resume PDF (prefer resume.pdf, fall back to linkedin.pdf)
_candidates = ["./data/resume.pdf", "./data/linkedin.pdf"]
linkedin = ""
for _path in _candidates:
    try:
        reader = PdfReader(_path)
        for page in reader.pages:
            text = page.extract_text()
            if text:
                linkedin += text
        if linkedin:
            break
    except FileNotFoundError:
        continue
if not linkedin:
    linkedin = "LinkedIn profile not available"

# Read other data files
with open("./data/summary.txt", "r", encoding="utf-8") as f:
    summary = f.read()

with open("./data/style.txt", "r", encoding="utf-8") as f:
    style = f.read()

with open("./data/facts.json", "r", encoding="utf-8") as f:
    facts = json.load(f)