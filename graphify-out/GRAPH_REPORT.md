# Graph Report - Texlore  (2026-05-24)

## Corpus Check
- 18 files · ~39,690 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 117 nodes · 102 edges · 18 communities (17 shown, 1 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `8651c225`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- [[_COMMUNITY_Community 0|Community 0]]
- [[_COMMUNITY_Community 1|Community 1]]
- [[_COMMUNITY_Community 2|Community 2]]
- [[_COMMUNITY_Community 3|Community 3]]
- [[_COMMUNITY_Community 4|Community 4]]
- [[_COMMUNITY_Community 5|Community 5]]
- [[_COMMUNITY_Community 6|Community 6]]
- [[_COMMUNITY_Community 7|Community 7]]
- [[_COMMUNITY_Community 8|Community 8]]
- [[_COMMUNITY_Community 9|Community 9]]
- [[_COMMUNITY_Community 10|Community 10]]
- [[_COMMUNITY_Community 11|Community 11]]
- [[_COMMUNITY_Community 13|Community 13]]
- [[_COMMUNITY_Community 16|Community 16]]

## God Nodes (most connected - your core abstractions)
1. `Agent Orchestration — Texlore LaTeX Report Writer` - 10 edges
2. `Texlore — Agent-Driven LaTeX Report Writer` - 8 edges
3. `Texlore — Agent-Driven LaTeX Report Writer` - 8 edges
4. `ContentVerifier Agent Prompt` - 7 edges
5. `LaTeXWriter Agent Prompt` - 6 edges
6. `Texlore` - 5 edges
7. `extractPDF()` - 4 edges
8. `ClassiRoute2 — System Architecture \& Design (Part 2)` - 4 edges
9. `ConstraintParser Agent Prompt` - 4 edges
10. `DocIngester Agent Prompt` - 4 edges

## Surprising Connections (you probably didn't know these)
- None detected - all connections are within the same source files.

## Communities (18 total, 1 thin omitted)

### Community 0 - "Community 0"
Cohesion: 0.11
Nodes (17): Agent 1: ConstraintParser, Agent 2: DocIngester, Agent 3: DiagramPlanner, Agent 4: LaTeXWriter, Agent 5: LaTeXFixer, Agent Orchestration — Texlore LaTeX Report Writer, Agent Overview, code:block1 (constraints/    ← Place constraint files here (PDF, DOCX, TX) (+9 more)

### Community 1 - "Community 1"
Cohesion: 0.18
Nodes (10): code:bash (# 1. Install dependencies), code:block2 (texlore/), Directory Structure, Infrastructure, Key Rules, Pipeline, Quick Start, Reference Files for Agents (+2 more)

### Community 2 - "Community 2"
Cohesion: 0.18
Nodes (10): code:bash (# 1. Install dependencies), code:block2 (texlore/), Directory Structure, Infrastructure, Key Rules, Pipeline, Quick Start, Reference Files for Agents (+2 more)

### Community 3 - "Community 3"
Cohesion: 0.2
Nodes (9): code:json ({), code:json ([), ContentVerifier Agent Prompt, Guidelines, Input Format, Output Format, Role, Rules (+1 more)

### Community 4 - "Community 4"
Cohesion: 0.22
Nodes (8): code:latex (\begin{figure}[htbp]), code:latex (% [FIGURE PLACEHOLDER: <caption>]), Content Integrity (CRITICAL), Figure Insertion Template, Figure Placeholder (when figure generation failed), LaTeXWriter Agent Prompt, Role, System Prompt

### Community 5 - "Community 5"
Cohesion: 0.36
Nodes (4): extractPDF(), extractPDF_pdfjs(), extractPDF_pdfparse(), extractPDF_pdftotext()

### Community 6 - "Community 6"
Cohesion: 0.29
Nodes (6): code:json ({), DocIngester Agent Prompt, ID Convention, Output Schema, Role, System Prompt

### Community 7 - "Community 7"
Cohesion: 0.33
Nodes (5): Example dialogue, Flagged ambiguities, Language, Relationships, Texlore

### Community 8 - "Community 8"
Cohesion: 0.33
Nodes (5): ClassiRoute2 — System Architecture \& Design (Part 2), code:bash (cd reports), Compiling, Required Figures, Structure

### Community 9 - "Community 9"
Cohesion: 0.33
Nodes (5): code:json ({), ConstraintParser Agent Prompt, Output Schema, Role, System Prompt

### Community 10 - "Community 10"
Cohesion: 0.4
Nodes (4): code:json ([), DiagramPlanner Agent Prompt, Role, System Prompt

### Community 11 - "Community 11"
Cohesion: 0.4
Nodes (4): Common Error → Fix Reference, LaTeXFixer Agent Prompt, Role, System Prompt

### Community 13 - "Community 13"
Cohesion: 0.5
Nodes (3): Sample Markdown, Section 1, Section 2

## Knowledge Gaps
- **56 isolated node(s):** `Language`, `Relationships`, `Example dialogue`, `Flagged ambiguities`, `What This Project Does` (+51 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **1 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **What connects `Language`, `Relationships`, `Example dialogue` to the rest of the system?**
  _56 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Community 0` be split into smaller, more focused modules?**
  _Cohesion score 0.11 - nodes in this community are weakly interconnected._