# Texlore

Agent-driven pipeline that reads constraint files and documentation, then produces a structured LaTeX report with auto-generated diagrams. Each pipeline step is an OpenCode skill that delegates to an Oracle sub-agent.

## Language

**Constraint file**:
A file in `constraints/` (PDF, DOCX, TXT, MD, any format) that defines the report's structural and formatting rules: sections, word limits, citation style, page limits.
_Avoid_: Brief, assignment, spec, guidelines

**Documentation**:
A file in `docs/` containing the subject matter content to be written up as a report — research notes, architecture docs, experimental results.
_Avoid_: Data, source material, notes

**Constraint parsing**:
Step 1 of the pipeline. Extracts structural rules from constraint files into a structured JSON schema (`outputs/constraints.json`). Handled by the ConstraintParser agent.
_Avoid_: Brief analysis, spec extraction

**Doc ingestion**:
Step 2 of the pipeline. Maps documentation content to report sections defined by constraints. Preserves content verbatim. Handled by the DocIngester agent.
_Avoid_: Content mapping, doc analysis

**Diagram planning**:
Optional Step 3 of the pipeline. Identifies sections that benefit from visualization and generates Mermaid syntax. Rendered to PNG via Mermaid CLI (`npx mmdc`).
_Avoid_: Figure generation, chart creation

**Verification cycle**:
A 3-iteration loop after report generation that extracts every sentence, checks it against source documentation chunks, and regenerates if any sentence introduces unsupported claims, wrong numbers, or hallucinated details.
_Avoid_: Quality check, validation pass

**Content hallucination**:
A sentence in the generated report that contains a factual claim not traceable to any source chunk, or that contradicts a source chunk. The verification cycle detects three types: FAIL_ACCURACY (wrong number/metric), FAIL_UNSUPPORTED (claim has no basis in source), FAIL_HALLUCINATION (direct contradiction).
_Avoid_: Fabrication, making stuff up

**Pipeline**:
The ordered 5-step process: `/parse-constraints` → `/ingest-docs` → `/generate-diagrams` (optional) → `/write-latex-report` → `/compile-latex`. Each step depends on the prior. Steps are OpenCode skills that invoke Oracle-level sub-agents.
_Avoid_: Workflow, chain, flow

**Skill**:
An OpenCode skill file (`.opencode/skills/*.md`) that orchestrates a pipeline step. Each skill contains trigger, prerequisites, and execution steps that the orchestrating agent follows.
_Avoid_: Command, plugin, module

## Relationships

- A **constraint file** defines the sections and rules that **doc ingestion** maps **documentation** content to
- The **verification cycle** checks each sentence of the generated report against the original **documentation** chunks
- **Diagram planning** is optional — only runs if documentation content contains architecture or methodology descriptions
- The **pipeline** runs strictly in order; each step reads the output of the prior step
- All sub-agents use **Oracle-level reasoning** — this is intentional for accuracy on structured extraction and content writing

## Example dialogue

> **Dev:** "If I put a research paper PDF in `docs/` and a conference template in `constraints/`, will it format the citations automatically?"
>
> **Domain expert:** "Yes — the constraint parser will extract the citation style from the template file, and the doc ingester will map your paper's content to the required sections. The LaTeX writer handles formatting. If the citation style is ambiguous, the parser flags it in `clarifications_needed` and you'll need to specify."

> **Dev:** "What happens if the generated report says '95% accuracy' but my documentation says '94.2% accuracy'?"
>
> **Domain expert:** "The verification cycle catches that as a FAIL_ACCURACY hallucination. It logs the exact mismatch, passes it back to the writer with the correct number from the source chunk, and the writer regenerates that sentence. Up to 3 cycles."

## Flagged ambiguities

- **"docsway" vs "Texlore"** — resolved: project name is Texlore. "docsway" was the original name in package.json; all references have been updated.
- **"PaperBananaAgent"** — resolved: this was a stale entry in an older `agents.md`. The diagram step uses Mermaid CLI directly, not PaperBanana.
- **"FigurePlanner" vs "DiagramPlanner"** — resolved: the agent is called DiagramPlanner and uses `prompts/diagram-planner.md`. The prompt file name `figure-planner.md` does not exist.
