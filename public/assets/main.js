/* Pautia landing page. Four behaviors, no dependencies and no libraries:
   the copyright year, the login dialog, the form state, and remembering the
   language the visitor chose by hand. The automatic language redirect is six
   lines inline in the head of the document, because a redirect that waits for
   this file shows the wrong language for a moment first. */

(() => {
  "use strict";

  const year = String(new Date().getFullYear());
  for (const node of document.querySelectorAll("[data-year]")) {
    node.textContent = year;
  }

  const dialog = document.getElementById("login");

  if (dialog) {
    for (const opener of document.querySelectorAll("[data-open-login]")) {
      opener.addEventListener("click", () => dialog.showModal());
    }

    for (const closer of dialog.querySelectorAll("[data-close]")) {
      closer.addEventListener("click", () => dialog.close());
    }

    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) dialog.close();
    });

    const message = dialog.querySelector("[data-msg]");

    dialog.querySelector("form").addEventListener("submit", (event) => {
      event.preventDefault();
      dialog.dataset.pending = "true";

      // The account service does not exist yet. The day it does, this handler
      // stops existing and the plain form post below takes over, with the
      // session cookie and the redirect answered by the backend.
      message.dataset.state = "unavailable";
      message.textContent =
        "Estamos terminando la plataforma. Escríbenos y te avisamos en cuanto esté.";
      delete dialog.dataset.pending;
      message.focus();
    });
  }

  for (const link of document.querySelectorAll("[data-lang]")) {
    link.addEventListener("click", () => {
      try {
        sessionStorage.setItem("pautia:lang", link.dataset.lang);
      } catch {}
    });
  }
})();
