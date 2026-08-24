# Matrice de tests tenant

| Cas                                            | Résultat attendu                 |
| ---------------------------------------------- | -------------------------------- |
| Requête sans contexte organisation             | zéro ligne / refus RLS           |
| Utilisateur A, organisation A                  | accès selon son rôle             |
| Utilisateur A, organisation B sans membership  | refus RLS                        |
| AgentVersion A + PluginInstallation B          | échec de clé étrangère composite |
| WorkflowNode A + AgentVersion B                | échec de clé étrangère composite |
| Worker avec org A lisant une exécution B       | refus RLS                        |
| Upload Storage dans le dossier d’une autre org | refus de politique Storage       |
| Jeton OAuth dans les logs                      | valeur expurgée                  |

Ces scénarios doivent être exécutés contre une base PostgreSQL réelle en CI d’intégration.
