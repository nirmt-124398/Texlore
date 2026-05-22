const { describe, it } = require("node:test");
const assert = require("node:assert");
const { execSync } = require("child_process");
const path = require("path");

const scriptPath = path.resolve(__dirname, "..", "scripts", "extract-text.js");
const fixturesDir = path.resolve(__dirname, "fixtures");

function run(args) {
  try {
    const stdout = execSync(`node "${scriptPath}" ${args}`, {
      encoding: "utf-8",
      timeout: 30000,
    });
    return { stdout, stderr: "", exitCode: 0 };
  } catch (e) {
    return {
      stdout: e.stdout || "",
      stderr: e.stderr || "",
      exitCode: e.status,
    };
  }
}

describe("extract-text.js", () => {
  it("extracts text from .txt files", () => {
    const { stdout, exitCode } = run(`"${fixturesDir}"`);
    assert.strictEqual(exitCode, 0, "should exit successfully");

    const results = JSON.parse(stdout);
    assert(Array.isArray(results), "output should be a JSON array");

    const txtFile = results.find((r) => r.file === "sample.txt");
    assert(txtFile, "should include sample.txt");
    assert(txtFile.text.includes("plain text file"), "should extract text content");
    assert.strictEqual(txtFile.method, "read", "should use read method");
    assert.strictEqual(txtFile.ext, ".txt", "should have correct extension");
    assert(txtFile.size > 0, "should report file size");
  });

  it("extracts text from .md files", () => {
    const { stdout } = run(`"${fixturesDir}"`);
    const results = JSON.parse(stdout);

    const mdFile = results.find((r) => r.file === "sample.md");
    assert(mdFile, "should include sample.md");
    assert(mdFile.text.includes("Sample Markdown"), "should extract markdown title");
    assert(mdFile.text.includes("List item"), "should extract list content");
    assert.strictEqual(mdFile.method, "read");
    assert.strictEqual(mdFile.ext, ".md");
  });

  it("extracts text from .tex files", () => {
    const { stdout } = run(`"${fixturesDir}"`);
    const results = JSON.parse(stdout);

    const texFile = results.find((r) => r.file === "sample.tex");
    assert(texFile, "should include sample.tex");
    assert(texFile.text.includes("documentclass"), "should extract LaTeX content");
    assert.strictEqual(texFile.method, "read");
    assert.strictEqual(texFile.ext, ".tex");
  });

  it("reports each extracted file with all metadata fields", () => {
    const { stdout } = run(`"${fixturesDir}"`);
    const results = JSON.parse(stdout);

    for (const entry of results) {
      assert(typeof entry.file === "string", `entry ${entry.file} should have file`);
      assert(typeof entry.ext === "string", `entry ${entry.file} should have ext`);
      assert(typeof entry.size === "number", `entry ${entry.file} should have size`);
      assert(typeof entry.text === "string", `entry ${entry.file} should have text`);
      assert(typeof entry.method === "string", `entry ${entry.file} should have method`);
      assert(typeof entry.format === "string", `entry ${entry.file} should have format`);
    }
  });

  it("errors when no directory argument provided", () => {
    const { stderr, exitCode } = run("");
    assert.notStrictEqual(exitCode, 0, "should exit with error");
    assert(stderr.includes("Usage"), "should print usage message");
  });

  it("errors when directory does not exist", () => {
    const { stderr, exitCode } = run(`"/nonexistent/directory"`);
    assert.notStrictEqual(exitCode, 0, "should exit with error");
    assert(stderr.includes("not found"), "should print not found message");
  });
});
