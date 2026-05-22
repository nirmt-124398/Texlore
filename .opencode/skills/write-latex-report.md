# Skill: /write-latex-report

## Trigger
```
/write-latex-report
```

No arguments — reads from all prior outputs automatically.

## What This Skill Does

Combines `outputs/constraints.json`, `outputs/doc_map.json`, and
`outputs/figures_manifest.json` (if it exists), sends everything to the
LaTeXWriter agent, then runs a **generate → verify → fix** cycle to
catch and eliminate content hallucination.

**Must run AFTER `/ingest-docs`. Figures included if `/generate-diagrams` was run.**

## Prerequisites

- `outputs/constraints.json` exists
- `outputs/doc_map.json` exists
- `outputs/figures_manifest.json` — optional

## How the Verification Cycle Works

```
  GENERATE ──→ EXTRACT SENTENCES ──→ VERIFY ──→ ALL PASS? ──→ ✅ Done
    ↑                                      │
    │                                      ▼ No
    └──── FIX & REGENERATE ────────── SOME FAIL
            (up to 3 cycles total)
```

After generation, every sentence in the report is extracted and checked
against the source `doc_map.json` chunks. Any sentence that introduces
unsupported claims, wrong numbers, or hallucinated details is flagged.
The LaTeXWriter then receives the specific failures and fixes them.
This repeats until all sentences pass or the cycle limit is reached.

## Execution Steps (follow in order)

### Step 1: Verify prerequisites

Check:
- `outputs/constraints.json` — REQUIRED, stop if missing
- `outputs/doc_map.json` — REQUIRED, stop if missing
- `outputs/figures_manifest.json` — OPTIONAL

### Step 2: Read all inputs

```
cat outputs/constraints.json
cat outputs/doc_map.json
cat outputs/figures_manifest.json 2>/dev/null || echo "{}"
```

### Step 3: Generate initial report

Build a prompt with all three inputs and call the LaTeXWriter:

```
task(
  subagent_type="oracle",
  load_skills=[],
  description="Generate LaTeX report from inputs",
  run_in_background=false,
  prompt="[SYSTEM PROMPT]\n$(cat prompts/latex-writer.md)\n\n[INPUT 1: constraints.json]\n$(cat outputs/constraints.json)\n\n[INPUT 2: doc_map.json]\n$(cat outputs/doc_map.json)\n\n[INPUT 3: figures_manifest.json]\n$(cat outputs/figures_manifest.json 2>/dev/null || echo '{}')\n\nWrite a complete, compilable LaTeX report using these inputs. Output ONLY the raw LaTeX source."
)
```

Strip any markdown fences from the output, then save:

```bash
cat > outputs/report.tex << 'LATEX_EOF'
<agent output with fences removed>
LATEX_EOF
```

### Step 4: Content verification loop (up to 3 cycles)

Set `cycle = 1` and `max_cycles = 3`.

#### Step 4a: Extract sentences from report

```bash
node scripts/extract-sentences.js outputs/report.tex > outputs/sentences.json
```

This produces `outputs/sentences.json`:
```json
[
  {
    "section": "Introduction",
    "sentences": [
      { "index": 0, "text": "Our system achieved 94.2% accuracy on the test set." },
      { "index": 1, "text": "Training was conducted on a cloud GPU cluster." }
    ]
  }
]
```

#### Step 4b: Verify each section against source chunks

For each section in `sentences.json`, find the corresponding source chunks
from `doc_map.json`. Send to the ContentVerifier agent.

**If report has ≤5 sections with content:** batch all into a single call:

```
task(
  subagent_type="oracle",
  load_skills=[],
  description="Verify report sentences against source",
  run_in_background=false,
  prompt="[SYSTEM PROMPT]\n$(cat prompts/content-verifier.md)\n\n[SOURCE CHUNKS FROM doc_map.json]\n$(cat outputs/doc_map.json | sections with chunks)\n\n[SENTENCES FROM REPORT]\n$(cat outputs/sentences.json)\n\nCompare each sentence against the source chunks. Output ONLY a JSON array of verdicts."
)
```

**If report has >5 sections:** verify in batches of 3-5 sections per call
to avoid context limits.

#### Step 4c: Collect and evaluate results

Parse the verifier's JSON output. Aggregate by verdict:

```json
{
  "total_sentences": 24,
  "passed": 22,
  "failed": 2,
  "failures": [
    {
      "section": "Results",
      "sentence_index": 1,
      "sentence_text": "Our model achieved 95% accuracy on the test set.",
      "verdict": "FAIL_ACCURACY",
      "reason": "Source says 94.2%, not 95%",
      "suggested_fix": "Change 95% to 94.2%"
    }
  ]
}
```

Save to `outputs/verification_report.json`.

If `failures.length === 0`:
```
  ✅ All sentences verified against source. No content hallucination detected.
```
  → Skip to Step 5.

If `failures.length > 0`:
```
  ⚠  Found X sentence(s) with unsupported content (cycle Y/3):
     - [FAIL_ACCURACY] Section "Results", sentence 1: ...
     - [FAIL_UNSUPPORTED] Section "Methodology", sentence 4: ...
```
  → If cycle < max_cycles, go to Step 4d.
  → If cycle >= max_cycles, go to Step 4e.

#### Step 4d: Fix failures and regenerate

Call the LaTeXWriter agent again with the same inputs PLUS the
verification failures as fix instructions. The fix prompt must also
reference the ContentVerifier's criteria so the writer knows what the
next verification pass will check.

```
task(
  subagent_type="oracle",
  load_skills=[],
  description="Fix verification failures in report",
  run_in_background=false,
  prompt="[SYSTEM PROMPT]\n$(cat prompts/latex-writer.md)\n\n[CONTENT VERIFIER RULES]\n$(cat prompts/content-verifier.md)\n\nThe ContentVerifier will re-check every sentence against source chunks after this fix. Study its PASS/FAIL criteria above — every sentence must PASS on the next check.\n\n[CURRENT REPORT]\n$(cat outputs/report.tex)\n\n[VERIFICATION FAILURES TO FIX]\n$(cat outputs/verification_report.json | failures array)\n\nApply each failure's 'suggested_fix' verbatim. If a failure has no suggested_fix, change the sentence to match the corresponding source chunk exactly.\n\n[ORIGINAL INPUTS]\nconstraints.json:\n$(cat outputs/constraints.json)\ndoc_map.json:\n$(cat outputs/doc_map.json)\n\nRULES:\n- Fix ONLY the specific sentences flagged as failures. Do NOT rewrite, restructure, or rephrase any other part of the report.\n- The fixed report MUST still compile with pdflatex.\n- Output ONLY the corrected LaTeX source. No explanation, no markdown fences."
)
```

Replace `outputs/report.tex`, then:
```
cycle = cycle + 1
```
Go back to Step 4a (re-extract and re-verify).

#### Step 4e: Max cycles reached

If failures remain after `max_cycles`:

```
  ⚠  Max verification cycles reached. X sentence(s) still failing:
     <list failures>
     
  The report has been saved but these claims should be manually reviewed.
  Consider updating your documentation in docs/ if the content is correct,
  or manually editing outputs/report.tex.
```

Continue to Step 5 anyway — the report may still be useful.

### Step 5: Validate LaTeX output

Check:
- Starts with `\documentclass`
- Has `\begin{document}` and `\end{document}`
- All `\includegraphics` paths exist or are commented
- No markdown fences

### Step 6: Print summary

```
  Report: outputs/report.tex
  Sentences: X total, Y passed, Z failed (after N cycles)
  Verification details: outputs/verification_report.json
  Next: /compile-latex
```

Print per-section word counts:
- Read each `\section{...}` block
- Count approximate words
- Compare against word limits from constraints
- Flag over-limit sections

## Output Files

| File | Description |
|---|---|
| `outputs/report.tex` | Final LaTeX report |
| `outputs/sentences.json` | Extracted sentences per section |
| `outputs/verification_report.json` | Verification results and fix history |

## Error Handling

| Situation | Action |
|---|---|
| `constraints.json` missing | Stop, tell user to run `/parse-constraints` |
| `doc_map.json` missing | Stop, tell user to run `/ingest-docs` |
| Agent output wraps in markdown fences | Strip fences, validate remaining content |
| `extract-sentences.js` returns empty | Check report.tex has content sections, warn user |
| Verifier returns malformed JSON | Retry call once, then continue with partial results |
| No sections have source chunks | Report generation is pointless — warn user |
| Single section exceeds context limit | Verify that section individually |
