# Skill: /ingest-docs

## Trigger
```
/ingest-docs
```

No arguments — reads all files from `docs/` directory automatically.

## What This Skill Does

Reads every file in the `docs/` directory, extracts text, combines it with
the section structure from `outputs/constraints.json`, sends to the DocIngester
agent, and writes `outputs/doc_map.json`.

**Must run AFTER `/parse-constraints`.**

## Prerequisites

- `outputs/constraints.json` exists (run `/parse-constraints` first)
- Files placed in `docs/` directory

## Execution Steps (follow in order)

### Step 1: Verify prerequisites

```
cat outputs/constraints.json
```

If file doesn't exist or is empty → print "Run /parse-constraints first", stop.

### Step 2: Check docs directory

```
ls docs/
```

If empty → print "Place documentation files in docs/ first", stop.
Supported formats: `.pdf`, `.docx`, `.doc`, `.txt`, `.md`, `.json`, `.csv`, `.yaml`, `.yml`.

### Step 3: Extract text from all docs

```bash
node scripts/extract-text.js docs
```

Capture the JSON output. Each entry: `{ "file", "ext", "size", "text", "method", "format" }`.
If a file fails extraction, warn user and skip.

### Step 4: Read constraints for section context

Read `outputs/constraints.json` — extract the `sections` array. These are the
target sections the DocIngester agent must map content to.

### Step 5: Send to DocIngester agent

Build a prompt that includes:
1. The system prompt from `prompts/doc-ingester.md`
2. The list of required sections from `constraints.json`
3. The extracted text content from all docs files

```
task(
  subagent_type="oracle",
  load_skills=[],
  description="Ingest docs into report sections",
  run_in_background=false,
  prompt="[SYSTEM PROMPT]\n$(cat prompts/doc-ingester.md)\n\n[REQUIRED SECTIONS]\n$(cat outputs/constraints.json | sections array)\n\n[DOCUMENT CONTENT]\n<combined extracted text from all docs, prefixed by source filename>\n\nMap content from these docs to the correct report sections. Output ONLY valid JSON matching the doc_map schema."
)
```

### Step 6: Validate and save

1. Validate the JSON output has the expected shape (`sections` map, each with `content_chunks`)
2. If JSON is invalid → retry once with stricter prompt
3. Save to `outputs/doc_map.json`
4. Print summary: how many sections were populated, how many source files processed, unmapped content count

### Step 7: Verify output

```
cat outputs/doc_map.json
```

Confirm structure is valid and content is populated meaningfully.

## Output (`outputs/doc_map.json`)

```json
{
  "sections": {
    "Introduction": {
      "content_chunks": ["chunk1...", "chunk2..."],
      "source_files": ["ml_report.pdf"],
      "has_data_tables": false,
      "has_methodology": false,
      "has_architecture": false,
      "suggested_figures": []
    }
  },
  "unmapped_content": ["text that didn't fit any section..."],
  "source_files_processed": ["ml_report.pdf"]
}
```

## Error Handling

| Situation | Action |
|---|---|
| `outputs/constraints.json` missing | Print "Run /parse-constraints first", stop |
| `docs/` empty | Print "Place files in docs/ first", stop |
| Agent returns invalid JSON | Retry once with stricter schema instructions |
| Content is too large for single prompt | Split into chunks per file, send sequentially, merge results |
| Sections have no content assigned | Flag them in terminal output as warnings |

## Next Step

Run `/generate-diagrams` (optional) then `/write-latex-report`.
