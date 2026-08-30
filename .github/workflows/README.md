# `.github/workflows/` — GitHub Actions

This folder is CI and deploy workflows. GitHub shows the **root** `README.md` as the repository readme — do not add a `README.md` directly under `.github/`, because GitHub would display that file on the repo home page instead.

| File | Purpose |
| --- | --- |
| `ci.yml` | Lint, typecheck, tests, image build, GitOps tag update |
| `deploy-production.yml` | Production image/GitOps path |
| `../dependabot.yml` | Dependency update PRs |

After a push to `dev`, wait until CI is green, including **Build & Push Images** and **Update GitOps Manifests**. Then wait for Argo to sync. Do not enable a job that runs `oc set image` as a shortcut around Argo.
