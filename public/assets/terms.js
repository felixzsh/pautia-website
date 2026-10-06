// Product terms shared by the build, the browser and the edge. Each one is a
// word the product owns, with a short explanation shown on hover, so a reader
// who does not know it does not have to leave the page.
const terms = {
  es: {
    "smart-imports": ["Smart\\s+Imports?",
      "Propone un borrador del flujo a partir de tus chats, si lo autorizas."],
    "smart-routing": ["Smart\\s+Routing",
      "La IA elige un camino dentro del flujo que aprobaste."],
    "visual-editor": ["editor\\s+visual",
      "Donde creas o ajustas el flujo sin programar."],
    "ai-credits": ["créditos\\s+(?:de\\s+)?IA",
      "Saldo mensual para las funciones de IA."],
    flow: ["flujos?(?:\\s+de\\s+atención)?",
      "El recorrido que sigue el agente: qué pregunta, responde o hace."],
    action: ["acciones|acción", "Una tarea del agente además de responder."],
    agent: ["agentes?|bots?", "El que atiende en tu WhatsApp siguiendo tus reglas."],
    integration: ["integraciones|integración",
      "Conexión con un sistema de tu negocio, si es compatible."],
    handoff: ["escalamiento|escalación|escalar|escala",
      "Cuando el agente se detiene y pasa la conversación a una persona."],
  },
  en: {
    "smart-imports": ["Smart\\s+Imports?",
      "Suggests a flow draft from your chats, if you authorize it."],
    "smart-routing": ["Smart\\s+Routing",
      "AI picks a path within the flow you approved."],
    "visual-editor": ["visual\\s+editor",
      "Where you build or adjust the flow without coding."],
    "ai-credits": ["AI\\s+credits", "Monthly allowance for AI features."],
    flow: ["(?:support\\s+)?flows?",
      "The path the agent follows: what it asks, answers or does."],
    action: ["actions?", "A task of the agent beyond replying."],
    agent: ["agents?|bots?", "The one answering on your WhatsApp, following your rules."],
    integration: ["integrations?", "A connection to a system of yours, when compatible."],
    handoff: ["escalation|escalates?|handoff",
      "When the agent stops and hands the conversation to a person."],
  },
  pt: {
    "smart-imports": ["Smart\\s+Imports?",
      "Propõe um rascunho do fluxo a partir dos seus chats, se você autorizar."],
    "smart-routing": ["Smart\\s+Routing",
      "A IA escolhe um caminho dentro do fluxo que você aprovou."],
    "visual-editor": ["editor\\s+visual", "Onde você cria ou ajusta o fluxo sem programar."],
    "ai-credits": ["créditos\\s+(?:de\\s+)?IA", "Saldo mensal para os recursos de IA."],
    flow: ["fluxos?",
      "O percurso que o agente segue: o que pergunta, responde ou faz."],
    action: ["ações|ação", "Uma tarefa do agente além de responder."],
    agent: ["agentes?|bots?", "O que atende no seu WhatsApp seguindo as suas regras."],
    integration: ["integrações|integração", "Conexão com um sistema do seu negócio, se compatível."],
    handoff: ["escalonamento|escalar|escala",
      "Quando o agente para e passa a conversa a uma pessoa."],
  },
  fr: {
    "smart-imports": ["Smart\\s+Imports?",
      "Propose une ébauche du flux depuis vos conversations, si vous l'autorisez."],
    "smart-routing": ["Smart\\s+Routing",
      "L'IA choisit un chemin dans le flux que vous avez approuvé."],
    "visual-editor": ["éditeur\\s+visuel", "Où vous créez ou ajustez le flux sans programmer."],
    "ai-credits": ["crédits\\s+IA", "Solde mensuel pour les fonctions d'IA."],
    flow: ["flux", "Le parcours suivi par l'agent : ce qu'il demande, répond ou fait."],
    action: ["actions?", "Une tâche de l'agent au-delà de répondre."],
    agent: ["agents?|bots?", "Celui qui répond sur votre WhatsApp selon vos règles."],
    integration: ["intégrations?", "Connexion à un système de votre activité, si compatible."],
    handoff: ["escalade|escalader",
      "Quand l'agent s'arrête et passe la conversation à une personne."],
  },
  de: {
    "smart-imports": ["Smart\\s+Imports?",
      "Schlägt einen Ablaufentwurf aus Ihren Chats vor, wenn Sie es erlauben."],
    "smart-routing": ["Smart\\s+Routing", "Die KI wählt einen Weg im freigegebenen Ablauf."],
    "visual-editor": ["visuellen?\\s+Editor",
      "Hier bauen oder ändern Sie den Ablauf ohne Programmieren."],
    "ai-credits": ["KI-Credits", "Monatliches Guthaben für KI-Funktionen."],
    flow: ["Abläufe|Ablaufs|Ablauf",
      "Der Weg des Agenten: was er fragt, antwortet oder tut."],
    action: ["Aktion(?:en)?", "Eine Aufgabe des Agenten neben dem Antworten."],
    agent: ["Agent(?:en)?|Bots?", "Der auf Ihrem WhatsApp nach Ihren Regeln antwortet."],
    integration: ["Integrationen?", "Verbindung zu einem Ihrer Systeme, wenn kompatibel."],
    handoff: ["Eskalation|eskalieren|eskaliert",
      "Wenn der Agent stoppt und das Gespräch an eine Person übergibt."],
  },
  it: {
    "smart-imports": ["Smart\\s+Imports?",
      "Propone una bozza del flusso dalle tue chat, se lo autorizzi."],
    "smart-routing": ["Smart\\s+Routing",
      "L'IA sceglie un percorso nel flusso che hai approvato."],
    "visual-editor": ["editor\\s+visual", "Dove crei o modifichi il flusso senza programmare."],
    "ai-credits": ["crediti\\s+IA", "Saldo mensile per le funzioni IA."],
    flow: ["flussi|flusso", "Il percorso che l'agente segue: cosa chiede, risponde o fa."],
    action: ["azioni|azione", "Un compito dell'agente oltre a rispondere."],
    agent: ["agenti|agente|bots?", "Chi risponde sul tuo WhatsApp seguendo le tue regole."],
    integration: ["integrazioni|integrazione",
      "Collegamento a un tuo sistema, se compatibile."],
    handoff: ["escalation|scalare|scala",
      "Quando l'agente si ferma e passa la conversazione a una persona."],
  },
};

export function escapeText(text) {
  return text.replace(/[&<>"']/g, (char) => ({
    "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;",
  })[char]);
}

export function linkTerms(text, language) {
  const entries = Object.entries(terms[language] || terms.es);
  const patterns = entries.map(([, [pattern]]) => `(${pattern})`).join("|");
  const match = new RegExp(`(?<![\\p{L}\\p{N}_])(?:${patterns})(?![\\p{L}\\p{N}_])`, "giu");
  let html = "";
  let end = 0;
  for (const found of text.matchAll(match)) {
    const index = found.slice(1).findIndex((group) => group !== undefined);
    const [id, [, hint]] = entries[index];
    html += escapeText(text.slice(end, found.index));
    html += `<span class="term" data-term="${id}" title="${escapeText(hint)}" tabindex="0">`;
    html += escapeText(found[0]) + "</span>";
    end = found.index + found[0].length;
  }
  return html + escapeText(text.slice(end));
}

// A translated element owns its text, including the terms marked inside it.
export function translateTexts(html, table, language) {
  return html.replace(
    /<([a-z][\w-]*)([^>]*\sdata-i18n="([\w.-]+)"[^>]*)>([\s\S]*?)<\/\1>/g,
    (whole, tag, attrs, key) => {
      if (!table[key]) return whole;
      const text = attrs.includes(" data-terms")
        ? linkTerms(table[key], language) : escapeText(table[key]);
      return `<${tag}${attrs}>${text}</${tag}>`;
    },
  );
}
