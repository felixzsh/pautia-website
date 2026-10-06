/* The site is built into public/, which is what Wrangler uploads as static
 * assets. The pages and their shared pieces live in site/: a page is a document
 * that includes the header, the footer and the plan cards, so those are written
 * once and every route carries the same ones.
 *
 * public/ is generated and committed, the same way the dictionary of the page's
 * own language is: `make build` rewrites the HTML from site/, and `make check`
 * fails if the two have drifted. Nothing under public/assets, public/legal or
 * public/*.json is touched: Eleventy only writes the pages it is given. */
import { Parser } from "htmlparser2";
import { linkTerms } from "./public/assets/terms.js";

export default function (eleventyConfig) {
  // Mark only text-bearing elements outside controls, metadata and the glossary.
  // The same marker lets language switching recreate their links safely.
  eleventyConfig.addTransform("term-hints", function (html) {
    if (!this.page.outputPath.endsWith(".html")) return html;
    const language = html.match(/<html lang="([a-z-]+)"/)[1];
    const blocked = new Set([
      "head", "a", "button", "label", "select", "option", "summary", "script", "style", "svg",
    ]);
    const stack = [];
    const edits = [];
    const parser = new Parser({
      onopentag(name, attrs) {
        const skip = stack.at(-1)?.skip || blocked.has(name) || "data-glossary" in attrs;
        const frame = { skip, key: attrs["data-i18n"], start: parser.endIndex + 1, text: "" };
        stack.push(frame);
        if (frame.key && !skip) {
          edits.push({ start: parser.endIndex, end: parser.endIndex, text: " data-terms" });
        }
      },
      ontext(text) {
        if (stack.at(-1)?.key) stack.at(-1).text += text;
      },
      onclosetag() {
        const frame = stack.pop();
        if (frame?.key && !frame.skip) {
          edits.push({ start: frame.start, end: parser.startIndex,
            text: linkTerms(frame.text, language) });
        }
      },
    });
    parser.end(html);
    for (const edit of edits.sort((a, b) => b.start - a.start)) {
      html = html.slice(0, edit.start) + edit.text + html.slice(edit.end);
    }
    return html;
  });
  return {
    dir: {
      input: "site",
      output: "public",
      includes: "_includes",
      data: "_data",
    },
  };
}
