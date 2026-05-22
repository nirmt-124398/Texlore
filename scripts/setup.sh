#!/usr/bin/env bash
set -euo pipefail

echo "=== Texlore Setup ==="
echo ""

# Install Node.js dependencies for text extraction
echo "[1/4] Installing Node.js dependencies..."
npm install --silent 2>/dev/null || npm install

# Check for pdftotext (PDF text extraction with layout preservation)
echo "[2/4] Checking pdftotext..."
if command -v pdftotext &>/dev/null; then
  echo "  pdftotext found: $(pdftotext -v 2>&1 | head -1)"
else
  echo "  WARNING: pdftotext not found. PDF extraction will fall back to pdfjs-dist."
  echo "  Install poppler-utils:"
  echo "    Ubuntu/Debian: sudo apt install poppler-utils"
  echo "    macOS: brew install poppler"
  echo "    Fedora: sudo dnf install poppler-utils"
fi

# Check Mermaid CLI (installed as project dependency via npm install)
echo "[3/4] Checking Mermaid CLI..."
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
PROJECT_DIR="$(dirname "$SCRIPT_DIR")"
if [ -f "$PROJECT_DIR/node_modules/.bin/mmdc" ]; then
  echo "  Mermaid CLI found: $("$PROJECT_DIR/node_modules/.bin/mmdc" --version 2>&1 | head -1)"
elif command -v mmdc &>/dev/null; then
  echo "  Mermaid CLI found (global): $(mmdc --version 2>&1 | head -1)"
else
  echo "  Mermaid CLI already declared in package.json — run 'npm install' to install."
fi

# Check for LaTeX compiler
echo "[4/4] Checking LaTeX compiler..."
if command -v pdflatex &>/dev/null; then
  echo "  pdflatex found: $(which pdflatex)"
elif command -v xelatex &>/dev/null; then
  echo "  xelatex found: $(which xelatex)"
else
  echo "  WARNING: No LaTeX compiler found."
  echo "  Install TeX Live:"
  echo "    Ubuntu/Debian: sudo apt install texlive texlive-latex-extra texlive-bibtex-extra"
  echo "    macOS: brew install --cask mactex"
  echo "    Fedora: sudo dnf install texlive-scheme-full"
fi

echo ""
echo "=== Setup complete ==="
