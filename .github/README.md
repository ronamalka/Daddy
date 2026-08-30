# `.github/` — GitHub automation

- `workflows/ci.yml` — lint, typecheck, tests, image build, GitOps tag update
- `workflows/deploy-production.yml` — production-related workflow (images still go through GitOps)
- `dependabot.yml` — dependency update PRs

After a push to `dev`, wait until CI is green, including **Build & Push Images** and **Update GitOps Manifests**. Then wait for Argo to sync.
