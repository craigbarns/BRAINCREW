# ADR 0003 — DeepSeek Harness derrière un adaptateur

Statut : accepté.

DeepSeek Harness est une developer preview. Braincrew n’importe donc pas ses détails dans l’API ou le domaine. `@braincrew/orchestrator-dsh` expose une interface `AgentRuntime` stable et deux implémentations : démonstration déterministe et processus DSH headless isolé.

Les versions DSH/Cordis sont verrouillées. Chaque mise à jour doit passer les tests de contrat, le scénario agent simple et le scénario workflow avant déploiement.
