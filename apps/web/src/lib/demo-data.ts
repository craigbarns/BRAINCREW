export const demoOverview = {
  agents: 8,
  workflows: 4,
  executions: 248,
  inputTokens: 1_842_300,
  outputTokens: 483_900,
  cost: 47.82,
};

export const demoAgents = [
  {
    id: "a1",
    name: "Éclaireur marché",
    description: "Surveille 14 concurrents et synthétise les signaux faibles.",
    status: "ACTIVE",
    model: "DeepSeek Chat",
    plugins: ["Web", "Notion"],
    runs: 92,
    lastRun: "il y a 8 min",
    hue: "#7C5CFC",
  },
  {
    id: "a2",
    name: "Inbox Captain",
    description: "Trie les emails, détecte l’urgence et prépare les réponses.",
    status: "ACTIVE",
    model: "DeepSeek Chat",
    plugins: ["Gmail", "CRM"],
    runs: 68,
    lastRun: "il y a 21 min",
    hue: "#B8FF65",
  },
  {
    id: "a3",
    name: "CRM Gardener",
    description: "Enrichit et nettoie les contacts à chaque interaction.",
    status: "DRAFT",
    model: "DeepSeek Reasoner",
    plugins: ["CRM"],
    runs: 0,
    lastRun: "jamais",
    hue: "#FFB45C",
  },
];

export const demoExecutions = [
  {
    id: "RUN-248",
    name: "Radar concurrentiel",
    status: "SUCCEEDED",
    duration: "1m 42s",
    tokens: "15,7k",
    time: "10:42",
  },
  {
    id: "RUN-247",
    name: "Triage boîte commerciale",
    status: "RUNNING",
    duration: "24s",
    tokens: "3,1k",
    time: "10:18",
  },
  {
    id: "RUN-246",
    name: "Enrichissement CRM",
    status: "SUCCEEDED",
    duration: "48s",
    tokens: "8,4k",
    time: "09:54",
  },
  {
    id: "RUN-245",
    name: "Brief du matin",
    status: "FAILED",
    duration: "12s",
    tokens: "1,2k",
    time: "08:00",
  },
];
