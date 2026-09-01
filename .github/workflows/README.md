# `.github/workflows/` — GitHub Actions

This folder is CI and deploy workflows. GitHub shows the **root** `README.md` as the repository readme — do not add a `README.md` directly under `.github/`, because GitHub would display that file on the repo home page instead.

| File | Purpose |
| --- | --- |
| `ci.yml` | Lint, typecheck, tests, image build, GitOps SHA update on `dev` / `stg` / `main` |
| `deploy-production.yml` | On `v*` tags (or manual dispatch): retag those SHAs as `:prod` and `:vX.Y.Z` |
| `../dependabot.yml` | Dependency update PRs |

After a push to `dev` or `stg`, wait until CI is green, including **Build & Push Images** and **Update GitOps Manifests**. Then wait for Argo to sync. Do not run `oc set image` as a shortcut around Argo.

Production: merge to `main`, wait for that same CI pair, tag `vX.Y.Z`, then **manually sync** Argo `daddy-prod`. The production workflow does not talk to OpenShift.
