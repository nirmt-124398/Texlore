# Skill: /compile-latex

## Trigger
```
/compile-latex
```

No arguments — reads `outputs/report.tex` automatically.

## What This Skill Does

Compiles `outputs/report.tex` to `outputs/report.pdf` using pdflatex.
On failure, sends the error log to the LaTeXFixer agent and retries
automatically up to 3 times.

**Must run AFTER `/write-latex-report`.**

## Prerequisites

- `outputs/report.tex` exists
- LaTeX compiler installed (`pdflatex`, `xelatex`, or `lualatex`)

## Execution Steps (follow in order)

### Step 1: Verify prerequisites

```
cat outputs/report.tex > /dev/null && echo "OK"
```

If file missing → "Run /write-latex-report first", stop.

Check for a LaTeX compiler:
```bash
command -v pdflatex || command -v xelatex || command -v lualatex
```

If none found → print install instructions (see setup script), stop.

### Step 2: Determine compile engine

From `configs/config.yaml`:
```yaml
latex:
  compile_command: pdflatex
```

Default: `pdflatex`. Respect the config value if changed.

### Step 3: First compile attempt

```bash
cd outputs && pdflatex -interaction=nonstopmode report.tex 2>&1
cd ..
```

Check exit code:
- **Exit 0** → PDF generated. Run `pdflatex` a second time for proper cross-references:
  ```bash
  cd outputs && pdflatex -interaction=nonstopmode report.tex 2>&1
  cd ..
  ```
  Then confirm `outputs/report.pdf` exists. Done.
- **Exit non-zero** → proceed to Step 4 (fix cycle).

### Step 4: Parse error log

Read the last ~80 lines of `outputs/report.log` for errors:
```bash
grep -E "^!" outputs/report.log | head -20
tail -80 outputs/report.log
```

Extract the actual error messages (lines starting with `!` and the 3-5 lines after each).

### Step 5: Send to LaTeXFixer agent

```
task(
  subagent_type="oracle",
  load_skills=[],
  description="Fix LaTeX compilation errors",
  run_in_background=false,
  prompt="[SYSTEM PROMPT]\n$(cat prompts/latex-fixer.md)\n\n[LATEX SOURCE]\n$(cat outputs/report.tex)\n\n[ERROR LOG]\n<error excerpt from report.log>\n\nFix ONLY the errors indicated in the log. Output ONLY the corrected LaTeX source."
)
```

### Step 6: Apply fix and retry

1. Write the corrected source back to `outputs/report.tex`
2. Recompile (Step 3)
3. Keep a counter: attempt 1, 2, 3
4. Log each attempt to `outputs/report_compile_attempts.json`

### Step 7: Max retries check

After 3 failed attempts:
- Print the full error log to terminal
- Print the fix attempts log: `cat outputs/report_compile_attempts.json`
- Tell the user the report needs manual fixing
- Show the last errors and suggest what to look at

## Compile Attempts Log (`outputs/report_compile_attempts.json`)

```json
{
  "attempts": [
    {
      "attempt": 1,
      "exit_code": 1,
      "errors": ["! Undefined control sequence."],
      "fix_applied": "Added \\usepackage{amsmath}",
      "success": false
    }
  ],
  "final_success": false,
  "report_pdf": "outputs/report.pdf"
}
```

## Common Errors and Auto-Fixes

| Error | Detection | Fix |
|---|---|---|
| `Undefined control sequence` | `! Undefined control sequence` | Add missing `\usepackage` |
| Missing figure file | `! File 'X' not found` | Replace `\includegraphics` with commented placeholder |
| `Missing $ inserted` | `! Missing $ inserted` | Wrap expression in math mode |
| `Overfull \hbox` | `Overfull \hbox` | Add `\sloppy` or adjust — non-fatal, ignore if minor |
| `Citation undefined` | `! LaTeX Warning: Citation` | Add stub `.bib` entry or remove citation |
| `Environment undefined` | `! LaTeX Error: Environment X undefined` | Add package that defines the environment |

## Output

| File | Description |
|---|---|
| `outputs/report.pdf` | Final compiled PDF (if successful) |
| `outputs/report.log` | Full compile log (always saved) |
| `outputs/report_compile_attempts.json` | Fix attempt history |

## Error Handling

| Situation | Action |
|---|---|
| `report.tex` missing | Print "Run /write-latex-report first", stop |
| No LaTeX compiler | Print install instructions, stop |
| Compiler not in config | Default to `pdflatex` |
| 3 failed fix attempts | Print errors, tell user manual fix needed |
| Second pass for refs | Always run pdflatex twice on success |
