#!/usr/bin/env node
/**
 * extract-sentences.js — Parses report.tex, extracts sentences grouped by section.
 *
 * Usage: node extract-sentences.js outputs/report.tex
 * Output: JSON array of { section, sentences: [{ index, text, char_offset }] }
 *
 * The verifier downstream uses this to check each sentence against source chunks.
 */
const fs = require("fs");
const path = require("path");

const texPath = process.argv[2];
if (!texPath) {
  console.error("Usage: node extract-sentences.js <report.tex>");
  process.exit(1);
}

const absPath = path.resolve(texPath);
if (!fs.existsSync(absPath)) {
  console.error(`File not found: ${absPath}`);
  process.exit(1);
}

const source = fs.readFileSync(absPath, "utf-8");

/**
 * Strip LaTeX commands and math, keeping only displayable text.
 * Handles: \command{...}, $...$, \[...\], \textit{...}, etc.
 */
function stripLatex(text) {
  return text
    // Remove comments (but not \% which is an escaped percent)
    .replace(/(^|[^\\])%.*/g, "$1")
    // Remove \command{...} blocks (non-nested approximation)
    .replace(/\\[a-zA-Z]+(\{[^}]*\})?/g, "")
    // Remove math mode $...$
    .replace(/\$[^$]*\$/g, "")
    // Remove display math \[...\]
    .replace(/\\\[[\s\S]*?\\\]/g, "")
    // Remove \label, \ref, \cite
    .replace(/\\label\{[^}]*\}/g, "")
    .replace(/\\ref\{[^}]*\}/g, "")
    .replace(/\\cite\{[^}]*\}/g, "")
    // Collapse whitespace
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Split text into sentences.
 * Handles: periods, exclamation marks, question marks
 * Avoids splitting on: "e.g.", "i.e.", "et al.", "Fig.", "vs.", "Dr.", "etc."
 */
function splitSentences(text) {
  // Common abbreviations that should NOT trigger a sentence break
  const noBreak = /\b(e\.g|i\.e|et al|Fig|Figs|Tab|Tabs|Eq|vs|Dr|Mr|Ms|Mrs|St|Inc|Ltd|Co|etc|al|cf|viz)\s*\.\s*$/i;

  const sentences = [];
  let buffer = "";
  let charOffset = 0;

  for (let i = 0; i < text.length; i++) {
    buffer += text[i];

    // Check for sentence-ending punctuation followed by whitespace+uppercase or end
    if (/[.!?]/.test(text[i])) {
      const rest = text.slice(i + 1);

      // Skip known abbreviations
      if (noBreak.test(buffer)) continue;

      // Sentence ends if: end of string, or whitespace followed by uppercase letter
      if (
        rest.length === 0 ||
        (/^\s+[A-Z"'(]/.test(rest) && !/^\s+[a-z]/.test(rest))
      ) {
        const trimmed = buffer.trim();
        if (trimmed) {
          sentences.push({
            index: sentences.length,
            text: trimmed,
            char_offset: charOffset,
          });
        }
        charOffset = i + 1;
        buffer = "";
      }
    }
  }

  // Remaining text as last sentence
  const trimmed = buffer.trim();
  if (trimmed) {
    sentences.push({
      index: sentences.length,
      text: trimmed,
      char_offset: charOffset,
    });
  }

  return sentences;
}

/**
 * Find all \section{...} and \section*{...} blocks.
 * Returns array of { name, start, end, content }
 */
function extractSections(source) {
  const sectionRegex = /\\section\*?\{([^}]*)\}/g;
  const sections = [];
  let sectionMatch;
  let lastSectionEnd = 0;
  let lastSectionName = "__preamble__";

  while (true) {
    sectionMatch = sectionRegex.exec(source);
    if (sectionMatch === null) break;
    if (lastSectionEnd >= 0) {
      sections.push({
        name: lastSectionName,
        content: source.slice(lastSectionEnd, sectionMatch.index).trim(),
        char_start: lastSectionEnd,
        char_end: sectionMatch.index,
      });
    }
    lastSectionName = sectionMatch[1];
    lastSectionEnd = sectionRegex.lastIndex;
  }

  // Last section (or only section)
  sections.push({
    name: lastSectionName,
    content: source.slice(lastSectionEnd).trim(),
    char_start: lastSectionEnd,
    char_end: source.length,
  });

  return sections;
}

// Main
const sections = extractSections(source);
const result = [];

for (const section of sections) {
  const stripped = stripLatex(section.content);
  if (!stripped) continue;

  // Filter out preamble noise (documentclass, usepackage, etc.)
  if (section.name === "__preamble__") {
    // Only include meaningful text from preamble
    const bodyStart = source.indexOf("\\begin{document}");
    if (bodyStart >= 0 && bodyStart < section.char_end) continue;
  }

  const sentences = splitSentences(stripped);

  // Skip sections with no meaningful sentences
  const meaningful = sentences.filter(
    (s) => s.text.length > 10 && !s.text.startsWith("\\")
  );
  if (meaningful.length === 0) continue;

  result.push({
    section: section.name,
    sentences: meaningful,
  });
}

process.stdout.write(JSON.stringify(result, null, 2));
