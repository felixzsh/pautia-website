/* The site is built into public/, which is what Wrangler uploads as static
 * assets. The pages and their shared pieces live in site/: a page is a document
 * that includes the header, the footer and the plan cards, so those are written
 * once and every route carries the same ones.
 *
 * public/ is generated and committed, the same way the dictionary of the page's
 * own language is: `make build` rewrites the HTML from site/, and `make check`
 * fails if the two have drifted. Nothing under public/assets, public/legal or
 * public/*.json is touched: Eleventy only writes the pages it is given. */
export default function (eleventyConfig) {
  return {
    dir: {
      input: "site",
      output: "public",
      includes: "_includes",
      data: "_data",
    },
  };
}
