<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->

# Branching and GitOps

This is the development process for every agent. Do not invent a different merge path.

**Feature branch → PR into `dev` → promote `dev` → `stg` → tagged `main` / prod.**

- Open feature PRs against **`dev`**. Do not open a normal feature PR against `main`.
- After `dev` looks good, promote with a PR **`dev` → `stg`**. Create `stg` from `dev` the first time (`git checkout -b stg origin/dev && git push -u origin stg`), then `oc apply -k gitops/argocd`.
- Production is a **separate release**: merge `stg` → `main`, wait for CI to pin image SHAs in `gitops/base`, tag `vX.Y.Z`, then **manually sync** Argo app `daddy-prod`. A tag does not roll the cluster by itself.

## Cluster deploys

- GitOps is the only deploy path. CI writes image SHAs into `gitops/base` on the branch that was pushed. Argo CD applies the overlay for that branch.
- `daddy-dev` auto-syncs `dev`. `daddy-stg` auto-syncs `stg`. `daddy-prod` tracks `main` and is **manual**.
- Do **not** run `oc set image` or enable a CI job that does.
- After a push to `dev` or `stg`, wait for **Build & Push Images** and **Update GitOps Manifests**, then wait for Argo.
- Argo ignores Secret `data` / `stringData`. New keys must be patched in the cluster. After GitOps that adds `INTER_SERVICE_SECRET`, on `daddy-dev`:

```bash
oc patch secret daddy-app-secret -n daddy-dev --type merge \
  -p '{"stringData":{"INTER_SERVICE_SECRET":"dev-secret-change-in-production"}}'
```

Details: [`gitops/README.md`](gitops/README.md), [`gitops/overlays/prod/README.md`](gitops/overlays/prod/README.md), [`.cursor/rules/release-promotion.mdc`](.cursor/rules/release-promotion.mdc).
