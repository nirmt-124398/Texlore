# Skill: /generate-diagrams

## Trigger
```
/generate-diagrams
```

No arguments — reads from `outputs/doc_map.json` automatically.

## What This Skill Does

Analyses `outputs/doc_map.json` for sections flagged with diagrams needs
(`has_methodology`, `has_architecture`, `suggested_figures`), sends to the
DiagramPlanner agent to generate Mermaid syntax, renders each to PNG via
Mermaid CLI, and saves manifest to `outputs/figures_manifest.json`.

**Must run AFTER `/ingest-docs`. Optional — skip if report doesn't need figures.**

## Prerequisites

- `outputs/doc_map.json` exists
- Mermaid CLI available: installed via `npm install` (in `node_modules/.bin/mmdc`)

## Execution Steps (follow in order)

### Step 1: Verify prerequisites

```
cat outputs/doc_map.json
```

If missing → "Run /ingest-docs first", stop.
Check `npx mmdc --version` works → if not, run `npm install` first

### Step 2: Check if diagrams are needed

Read `doc_map.json`. For each section, check:
- `has_architecture: true` → needs architecture diagram
- `has_methodology: true` → may need flow/process diagram
- `suggested_figures` array → use these suggestions

If NO section needs diagrams → print "No diagrams needed from doc content", ask user if they want to proceed anyway.

### Step 3: Send to DiagramPlanner agent

```
task(
  subagent_type="oracle",
  load_skills=[],
  description="Plan diagrams for report sections",
  run_in_background=false,
  prompt="[SYSTEM PROMPT]\n$(cat prompts/diagram-planner.md)\n\n[doc_map.json]\n$(cat outputs/doc_map.json)\n\nDecide which sections need diagrams and write Mermaid syntax for each. Output ONLY a JSON array."
)
```

The agent returns a JSON array like:
```json
[
  {
    "section": "System Architecture",
    "caption": "High-level system architecture",
    "latex_label": "fig:architecture",
    "mermaid_syntax": "graph TD\n  A[User] --> B[Frontend]\n  B --> C[Backend API]\n  C --> D[(Database)]"
  }
]
```

### Step 4: Render each diagram with Mermaid CLI

For each figure in the plan:

```bash
# Write Mermaid source to temp file
echo '<mermaid_syntax>' > outputs/figures/<name>.mmd

# Render to PNG
npx mmdc -i outputs/figures/<name>.mmd -o outputs/figures/<name>.png -t default -w 800 -b transparent
```

If `mmdc` fails (e.g., Puppeteer/Chrome not found), fall back:
- Print the Mermaid syntax for manual rendering
- Tell user they can render at https://mermaid.live/edit
- Continue — the LaTeX report will have figure placeholders

### Step 5: Build and save figures manifest

Build `outputs/figures_manifest.json`:

```json
{
  "figures": [
    {
      "section": "System Architecture",
      "path": "outputs/figures/architecture.png",
      "caption": "High-level system architecture",
      "latex_label": "fig:architecture",
      "mermaid_source": "outputs/figures/architecture.mmd"
    }
  ]
}
```

For any figure that failed rendering, set `"path": null` and the LaTeX writer will insert a placeholder.

### Step 6: Verify

```
ls -la outputs/figures/
cat outputs/figures_manifest.json
```

Print summary: X figures generated, Y failed.

## Output

- `outputs/figures/*.png` — rendered diagrams
- `outputs/figures/*.mmd` — Mermaid source files
- `outputs/figures_manifest.json` — manifest for LaTeX writer

## Error Handling

| Situation | Action |
|---|---|
| `doc_map.json` missing | Print "Run /ingest-docs first", stop |
| `mmdc` not installed | Install via `npm install -g @mermaid-js/mermaid-cli` |
| Chrome/Puppeteer runtime error | Print Mermaid syntax for manual rendering, continue |
| DiagramPlanner returns empty array | Print "No diagrams suggested", skip gracefully |

## Next Step

Run `/write-latex-report`.
