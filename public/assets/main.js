/* Pautia landing page. Two behaviors, no dependencies and no libraries: the
   copyright year, and remembering the language the visitor chose by hand. The
   automatic language redirect is six lines inline in the head of the document,
   because a redirect that waits for this file shows the wrong language for a
   moment first. */

(() => {
  "use strict";

  const year = String(new Date().getFullYear());
  for (const node of document.querySelectorAll("[data-year]")) {
    node.textContent = year;
  }

  for (const link of document.querySelectorAll("[data-lang]")) {
    link.addEventListener("click", () => {
      try {
        sessionStorage.setItem("pautia:lang", link.dataset.lang);
      } catch {}
    });
  }
})();
