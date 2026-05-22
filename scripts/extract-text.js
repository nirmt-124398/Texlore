#!/usr/bin/env node
/**
 * extract-text.js — Universal text extractor for Texlore pipeline.
 *
 * Extracts text from PDF, DOCX, TXT, MD, and other file formats.
 * Uses the best available extractor for each format to minimize data loss:
 *   - PDF: pdftotext -layout (tables/columns) → pdfjs-dist → pdf-parse
 *   - DOCX: mammoth convertToHtml (structure preserved)
 *   - TXT/MD: jschardet encoding detection
 *   - Others: encoding detection + read
 *
 * Usage: node extract-text.js <directory>
 * Output: JSON array of { file, ext, size, text, method, format, encoding }
 */
const fs = require("fs");
const path = require("path");
const { spawnSync } = require("child_process");

const dir = process.argv[2];
if (!dir) {
  console.error("Usage: node extract-text.js <directory>");
  process.exit(1);
}

const absDir = path.resolve(dir);
if (!fs.existsSync(absDir)) {
  console.error(`Directory not found: ${absDir}`);
  process.exit(1);
}

// ── PDF extractors (tiered: best → fallback) ──

function extractPDF_pdftotext(filePath) {
  const result = spawnSync("pdftotext", ["-layout", filePath, "-"], {
    encoding: "buffer",
    maxBuffer: 100 * 1024 * 1024,
    timeout: 30000,
    shell: false,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) {
    throw new Error(`pdftotext exited with code ${result.status}`);
  }
  const text = Buffer.from(result.stdout).toString("utf-8").trim();
  if (!text) throw new Error("pdftotext returned empty");
  return { text, method: "pdftotext-layout", format: "layout" };
}

async function extractPDF_pdfjs(filePath) {
  const pdfjsLib = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(fs.readFileSync(filePath));
  const doc = await pdfjsLib.getDocument({ data, useSystemFonts: true }).promise;
  const lines = [];
  for (let i = 1; i <= doc.numPages; i++) {
    const page = await doc.getPage(i);
    const content = await page.getTextContent();
    let lastY = null;
    let lineItems = [];
    for (const item of content.items) {
      const y = Math.round(item.transform[5]);
      if (lastY !== null && Math.abs(y - lastY) > 3) {
        lines.push(lineItems.map(i => i.str).join(""));
        lineItems = [];
      }
      lineItems.push(item);
      lastY = y;
    }
    if (lineItems.length) lines.push(lineItems.map(i => i.str).join(""));
    lines.push("");
  }
  return { text: lines.join("\n").trim(), method: "pdfjs", format: "plain" };
}

async function extractPDF_pdfparse(filePath) {
  const pdfParse = require("pdf-parse");
  const buf = fs.readFileSync(filePath);
  const data = await pdfParse(buf);
  return { text: data.text, method: "pdf-parse", format: "plain" };
}

async function extractPDF(filePath) {
  try {
    return await extractPDF_pdftotext(filePath);
  } catch (e1) {
    try {
      return await extractPDF_pdfjs(filePath);
    } catch (e2) {
      try {
        return await extractPDF_pdfparse(filePath);
      } catch (e3) {
        throw new Error(
          `All PDF extractors failed: ${e1.message}; ${e2.message}; ${e3.message}`
        );
      }
    }
  }
}

// ── DOCX extractors ──

async function extractDOCX(filePath) {
  const mammoth = require("mammoth");
  const buf = fs.readFileSync(filePath);
  try {
    const result = await mammoth.convertToHtml({ buffer: buf });
    return { text: result.value, method: "mammoth-html", format: "html" };
  } catch (e) {
    const result = await mammoth.extractRawText({ buffer: buf });
    return { text: result.value, method: "mammoth-raw", format: "plain" };
  }
}

// ── Text file extractor (with encoding detection) ──

function extractText(filePath) {
  const buf = fs.readFileSync(filePath);
  const jschardet = require("jschardet");

  let encoding = "utf-8";
  let confidence = 0;
  try {
    const detected = jschardet.detect(buf);
    if (detected && detected.confidence > 0.7) {
      encoding = detected.encoding;
      confidence = detected.confidence;
    }
  } catch {
    // fall through to utf-8
  }

  if (encoding === "ASCII") encoding = "utf-8";
  if (encoding === "ISO-8859-1") encoding = "latin1";

  let text;
  try {
    const decoder = new TextDecoder(encoding, { fatal: false });
    text = decoder.decode(buf);
  } catch {
    text = buf.toString("utf-8");
    encoding = "utf-8";
    confidence = 0;
  }

  return { text, encoding, encoding_confidence: confidence };
}

// ── Supported format map ──

const extMap = {
  ".pdf":  (fp) => extractPDF(fp),
  ".docx": (fp) => extractDOCX(fp),
  ".doc":  (fp) => extractDOCX(fp),
  ".txt":  (fp) => ({ ...extractText(fp), method: "read", format: "plain" }),
  ".md":   (fp) => ({ ...extractText(fp), method: "read", format: "plain" }),
  ".json": (fp) => ({ ...extractText(fp), method: "read", format: "plain" }),
  ".csv":  (fp) => ({ ...extractText(fp), method: "read", format: "plain" }),
  ".yaml": (fp) => ({ ...extractText(fp), method: "read", format: "plain" }),
  ".yml":  (fp) => ({ ...extractText(fp), method: "read", format: "plain" }),
  ".tex":  (fp) => ({ ...extractText(fp), method: "read", format: "plain" }),
  ".html": (fp) => ({ ...extractText(fp), method: "read", format: "html" }),
  ".htm":  (fp) => ({ ...extractText(fp), method: "read", format: "html" }),
  ".rst":  (fp) => ({ ...extractText(fp), method: "read", format: "plain" }),
  ".rtf":  (fp) => ({ ...extractText(fp), method: "read", format: "plain" }),
  ".log":  (fp) => ({ ...extractText(fp), method: "read", format: "plain" }),
};

async function main() {
  const entries = fs.readdirSync(absDir, { withFileTypes: true });

  const files = entries
    .filter(dirent => {
      if (!dirent.isFile()) return false;
      const ext = path.extname(dirent.name).toLowerCase();
      return extMap[ext];
    })
    .map(dirent => dirent.name)
    .sort();

  if (files.length === 0) {
    console.error(`No supported files found in ${absDir}`);
    console.error(`Supported formats: ${Object.keys(extMap).join(", ")}`);
    process.exit(1);
  }

  const results = [];
  for (const file of files) {
    const filePath = path.join(absDir, file);
    const ext = path.extname(file).toLowerCase();
    const stat = fs.statSync(filePath);

    try {
      const extractor = extMap[ext];
      const result = await extractor(filePath);
      const entry = {
        file,
        ext,
        size: stat.size,
        text: result.text,
        method: result.method || "unknown",
        format: result.format || "plain",
      };
      if (result.encoding) entry.encoding = result.encoding;
      if (result.encoding_confidence) entry.encoding_confidence = result.encoding_confidence;
      results.push(entry);
    } catch (err) {
      console.error(`[WARN] Failed to extract ${file}: ${err.message}`);
      results.push({
        file,
        ext,
        size: stat.size,
        text: "",
        method: "error",
        format: "plain",
        error: err.message,
      });
    }
  }

  if (results.length === 0) {
    console.error("No files could be processed.");
    process.exit(1);
  }

  process.stdout.write(JSON.stringify(results, null, 2));
}

main().catch((err) => {
  console.error(`Fatal: ${err.message}`);
  process.exit(1);
});
