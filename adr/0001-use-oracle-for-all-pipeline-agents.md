# Use Oracle-level sub-agents for every pipeline step

**Date:** 2026-05-23
**Status:** accepted

Every pipeline step (constraint parsing, doc ingestion, diagram planning, LaTeX writing, content verification, LaTeX fixing) delegates to `task(subagent_type="oracle", ...)` — the most expensive available model. This is intentional: the pipeline's value is in producing a factually accurate, compilable LaTeX report from unstructured inputs. A hallucinated number, a misread constraint, or a wrong LaTeX command breaks the entire deliverable. Cheaper models produced errors that reliably triggered the verification cycle, making them net slower despite lower per-call cost. Rejected alternatives included using the orchestrating agent directly (too error-prone on structured extraction) and using lower-cost sub-agents with stricter prompting (still produced unacceptable hallucination rates on content writing and constraint parsing).
