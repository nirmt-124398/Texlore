# Texlore — Agent-Driven LaTeX Report Writer

## What This Project Does

A general-purpose, agent-driven LaTeX report writing system.
Given:
- **Constraint files** in `constraints/` — define report structure, sections, formatting rules, citation style, word limits (PDF, DOCX, TXT, MD, any format)
- **User documentation** in `docs/` — any project docs (ML reports, backend/frontend docs, anything)

Produces:
- A **complete, structured LaTeX report** (`outputs/report.tex`) following constraints strictly
- **Compiled PDF** (`outputs/report.pdf`) with auto-fix retry up to 3x
- **Auto-generated diagrams** via Mermaid (free, no API key needed)

## Quick Start

```bash
# 1. Install dependencies
npm run setup

# 2. Place your files
#    constraints/ ← assignment brief, spec, guidelines (any format)
#    docs/        ← your documentation, reports, notes

# 3. Run the pipeline
/parse-constraints     # reads constraints/ → outputs/constraints.json
/ingest-docs           # reads docs/ + constraints → outputs/doc_map.json
/generate-diagrams     # optional — generates figures from doc content
/write-latex-report    # writes outputs/report.tex
/compile-latex         # compiles to PDF, auto-fixes errors up to 3x
```

## Pipeline

| Step | Skill | Input | Output |
|---|---|---|---|
| 1 | `/parse-constraints` | `constraints/` | `outputs/constraints.json` |
| 2 | `/ingest-docs` | `docs/` + `constraints.json` | `outputs/doc_map.json` |
| 3 | `/generate-diagrams` | `doc_map.json` | `outputs/figures/*.png`, `figures_manifest.json` |
| 4 | `/write-latex-report` | All JSONs | `outputs/report.tex` |
| 5 | `/compile-latex` | `report.tex` | `outputs/report.pdf` (3x auto-fix) |

## Infrastructure

- `scripts/extract-text.js` — universal text extractor for PDF/DOCX/TXT/MD
- `scripts/setup.sh` — installs Node deps, Mermaid CLI, checks for LaTeX compiler
- `prompts/` — system prompts for each sub-agent (ConstraintParser, DocIngester, DiagramPlanner, LaTeXWriter, LaTeXFixer)

## Key Rules

- Always run steps in order (each depends on the prior)
- Never invent content — derive everything from user docs
- Sub-agents use Oracle-level reasoning for constraint parsing and content mapping
- All output goes to `outputs/`
- LaTeX compile auto-fixes errors up to 3 attempts

## Directory Structure

```
texlore/
├── OPENCODE.md
├── agents.md
├── package.json
├── configs/config.yaml
├── constraints/          ← Place constraint files here
├── docs/                 ← Place documentation here
├── scripts/
│   ├── extract-text.js   ← Text extraction utility
│   └── setup.sh          ← Dependency installer
├── prompts/
│   ├── constraint-parser.md
│   ├── doc-ingester.md
│   ├── diagram-planner.md
│   ├── latex-writer.md
│   └── latex-fixer.md
├── tests/                 ← Test suite (node --test)
│   ├── fixtures/          ← Fixture files for tests
│   ├── extract-text.test.js
│   └── extract-sentences.test.js
├── adr/                   ← Architecture Decision Records
│   └── 0001-use-oracle-for-all-pipeline-agents.md
├── CONTEXT.md             ← Domain glossary for agents
├── agents.md              ← Agent definitions and prompt references
├── .opencode/skills/      ← Slash command implementations
│   ├── parse-constraints.md
│   ├── ingest-docs.md
│   ├── generate-diagrams.md
│   ├── write-latex-report.md
│   └── compile-latex.md
└── outputs/
    ├── figures/          ← Generated diagrams
    ├── constraints.json
    ├── doc_map.json
    ├── figures_manifest.json
    ├── report.tex
    └── report.pdf
```

## Reference Files for Agents

| File | Audience | What it contains |
|---|---|---|
| [`agents.md`](agents.md) | Pipeline orchestrator | Sub-agent roles, prompt files, input/output flow — *how to run the pipeline* |
| [`CONTEXT.md`](CONTEXT.md) | Any agent | Domain glossary, term relationships, flagged ambiguities — *what things are called* |
| [`adr/`](adr/) | Future engineers | Architecture decisions with rationale — *why things are this way* |
