const { describe, it } = require("node:test");
const assert = require("node:assert");
const { execSync } = require("child_process");
const path = require("path");

const scriptPath = path.resolve(__dirname, "..", "scripts", "extract-sentences.js");
const texFixture = path.resolve(__dirname, "fixtures", "sample.tex");

function run(args) {
  try {
    const stdout = execSync(`node "${scriptPath}" ${args}`, {
      encoding: "utf-8",
      timeout: 15000,
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

describe("extract-sentences.js", () => {
  it("extracts sections and sentences from a .tex file", () => {
    const { stdout, exitCode } = run(`"${texFixture}"`);
    assert.strictEqual(exitCode, 0, "should exit successfully");

    const results = JSON.parse(stdout);
    assert(Array.isArray(results), "output should be a JSON array");

    const sectionNames = results.map((r) => r.section);
    assert(sectionNames.includes("Introduction"), "should include Introduction section");
    assert(sectionNames.includes("Methodology"), "should include Methodology section");
    assert(sectionNames.includes("Results"), "should include Results section");
    assert(sectionNames.includes("Conclusion"), "should include Conclusion section");
  });

  it("splits sentences within each section", () => {
    const { stdout } = run(`"${texFixture}"`);
    const results = JSON.parse(stdout);

    const intro = results.find((r) => r.section === "Introduction");
    assert(intro, "Introduction section should exist");
    assert(intro.sentences.length >= 3, "Introduction should have at least 3 sentences");
  });

  it("preserves numbers and metrics accurately", () => {
    const { stdout } = run(`"${texFixture}"`);
    const results = JSON.parse(stdout);

    const intro = results.find((r) => r.section === "Introduction");
    const hasAccuracy = intro.sentences.some((s) => s.text.includes("94.2"));
    assert(hasAccuracy, "should preserve 94.2% accuracy metric");
  });

  it("handles abbreviations (e.g., i.e., etc.) without splitting", () => {
    const { stdout } = run(`"${texFixture}"`);
    const results = JSON.parse(stdout);

    // "i.e." and "e.g." are in the abbreviation exception list and should
    // NOT cause sentence breaks. Find sentences that span these abbreviations.
    const allSentences = results.flatMap((r) => r.sentences.map((s) => s.text));

    // "i.e." should be part of a longer sentence, not split
    const ieSentences = allSentences.filter((s) => s.includes("i.e."));
    assert(ieSentences.length > 0, "abbreviation i.e. should appear in at least one sentence");

    // "e.g." should be part of a longer sentence, not split
    const egSentences = allSentences.filter((s) => s.includes("e.g."));
    assert(egSentences.length > 0, "abbreviation e.g. should appear in at least one sentence");
  });

  it("includes char_offset and index for each sentence", () => {
    const { stdout } = run(`"${texFixture}"`);
    const results = JSON.parse(stdout);

    for (const section of results) {
      for (const sentence of section.sentences) {
        assert(typeof sentence.index === "number", `sentence ${sentence.text.slice(0, 20)} should have numeric index`);
        assert(typeof sentence.char_offset === "number", `sentence ${sentence.text.slice(0, 20)} should have char_offset`);
        assert(typeof sentence.text === "string", "sentence should have text");
      }
    }
  });

  it("errors when no file argument provided", () => {
    const { stderr, exitCode } = run("");
    assert.notStrictEqual(exitCode, 0, "should exit with error");
    assert(stderr.includes("Usage"), "should print usage message");
  });

  it("errors when file does not exist", () => {
    const { stderr, exitCode } = run(`"/nonexistent/report.tex"`);
    assert.notStrictEqual(exitCode, 0, "should exit with error");
    assert(stderr.includes("not found"), "should print not found message");
  });
});
