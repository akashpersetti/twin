from pypdf import PdfReader
import json

# Read resume PDF
resume = ""
try:
    reader = PdfReader("./data/resume.pdf")
    for page in reader.pages:
        text = page.extract_text()
        if text:
            resume += text
except FileNotFoundError:
    pass
if not resume:
    resume = "Resume not available"

# Read other data files
with open("./data/summary.txt", "r", encoding="utf-8") as f:
    summary = f.read()

with open("./data/style.txt", "r", encoding="utf-8") as f:
    style = f.read()

with open("./data/facts.json", "r", encoding="utf-8") as f:
    facts = json.load(f)