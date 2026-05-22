# Skill: /parse-constraints

## Trigger
```
/parse-constraints
```

No arguments — reads all files from `constraints/` directory automatically.

## What This Skill Does

Reads every file in the `constraints/` directory (PDF, DOCX, TXT, MD, etc.),
extracts text, sends the combined content to the ConstraintParser agent,
and writes structured `outputs/constraints.json`.

## Prerequisites

- Files placed in `constraints/` directory
- `npm run setup` run once (or `npm install` done)
- Python packages for non-Node formats: `pip install pdfplumber python-docx` (fallback)

## Execution Steps (follow in order)

### Step 1: Discover constraint files

```
ls constraints/
```

Check at least one supported file exists. Supported: `.pdf`, `.docx`, `.doc`, `.txt`, `.md`, `.json`, `.csv`, `.yaml`, `.yml`. If empty, tell user to place files and stop.

### Step 2: Extract text from all files

```bash
node scripts/extract-text.js constraints
```

This outputs a JSON array to stdout. Capture it. Each entry has:
```json
{ "file": "brief.pdf", "ext": ".pdf", "size": 12345, "text": "extracted content...", "method": "pdftotext-layout", "format": "layout" }
```

Notes on format:
  - PDF → `method: "pdftotext-layout"` (tables/columns preserved via whitespace), fallback: `"pdfjs"` or `"pdf-parse"`
  - DOCX → `method: "mammoth-html"`, `format: "html"` (structure preserved as HTML tags)
  - TXT/MD → `method: "read"`, may include `encoding` field
  - `text` field always contains the extractible content regardless of method

If extraction fails for a file, warn the user but continue with others.

### Step 3: Combine and send to ConstraintParser agent

Combine all extracted text into a single document. Then fire the agent:

```
task(
  subagent_type="oracle",
  load_skills=[],
  description="Parse constraints from brief",
  run_in_background=false,
  prompt="[SYSTEM PROMPT]\n$(cat prompts/constraint-parser.md)\n\n[INPUT TEXT]\n<combined extracted text from all constraint files>\n\nExtract ALL structural and formatting rules into the JSON schema specified in the system prompt. Output ONLY valid JSON."
)
```

### Step 4: Validate and save

1. Validate the JSON output matches the expected schema (has `sections` array, etc.)
2. If JSON is invalid or empty → print error, ask user to clarify, stop
3. Save to `outputs/constraints.json`
4. Print summary: number of sections found, citation style, page limits, word limits per section

### Step 5: Verify output

```
cat outputs/constraints.json
```

Confirm it parses as valid JSON with meaningful content. If empty/malformed, retry step 3 with a clearer prompt or ask user for clarification.

## Output (`outputs/constraints.json`)

```json
{
  "report_title": "string or null",
  "sections": [
    { "name": "Introduction", "word_limit": 500, "required": true, "notes": null }
  ],
  "citation_style": "ieee",
  "font_size": "11pt",
  "paper_size": "a4paper",
  "max_pages": null,
  "max_figures": null,
  "latex_template": null,
  "special_rules": ["string"],
  "clarifications_needed": ["string"]
}
```

## Error Handling

| Situation | Action |
|---|---|
| `constraints/` empty | Print error "Place files in constraints/ first", stop |
| File extraction fails for one file | Warn user, skip that file, continue with others |
| All files fail extraction | Print error, stop |
| Agent returns invalid JSON | Retry once with stricter prompt, then ask user |
| Output is ambiguous (has `clarifications_needed`) | Print clarifications, ask user before proceeding |

## Next Step

Run `/ingest-docs` after this completes successfully.
