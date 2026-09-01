# `gitops/` — cluster desired state

Argo CD watches this folder on the `dev` / `stg` / `main` branches and applies the matching overlay to OpenShift.

| Folder | Role |
| --- | --- |
| `base/` | Shared Deployments, Services, Postgres, Redis, secret placeholders |
| `overlays/dev`, `stg`, `prod` | Environment differences (URLs, replica counts, storage, secret placeholders). stg/prod also include network policy. |
| `argocd/` | Application CRs that point Argo at each overlay |

CI on `dev`, `stg`, and `main` builds images, pushes them to Quay with the short Git SHA (plus a moving `dev` or `stg` tag on those branches), then writes that SHA into `base/*-deployment.yaml` **on that same branch**. The `:prod` image tag is applied only by the release workflow when you push a `v*` tag. Overlays do not rewrite image names. Wait for Argo to sync. Do not patch images by hand with `oc set image`.

## Promotion path

1. Feature branch → PR into `dev`. Argo `daddy-dev` auto-syncs.
2. When `dev` is good → PR / merge `dev` → `stg`. Argo `daddy-stg` auto-syncs. Create the `stg` branch the first time (see below).
3. Production → merge `stg` → `main`, wait for CI to pin SHAs in GitOps, tag `vX.Y.Z`, then **manually sync** Argo `daddy-prod`.

`daddy-prod` has no auto-sync. A tag does not roll the cluster by itself.

## First time: staging branch

The `stg` branch is not created until you promote. From a clean clone:

```bash
git fetch origin
git checkout -b stg origin/dev
git push -u origin stg
oc apply -k gitops/argocd
```

Then replace the `CHANGE_ME_STG_*` secret values in `daddy-stg` (Argo ignores Secret data after that). Add the staging Google redirect URI `{AUTH_URL}/api/auth/callback/google`.

## First time: production

1. Staging has been verified.
2. Open a PR `stg` → `main` (or merge), wait until **Build & Push Images** and **Update GitOps Manifests** finish on `main`.
3. Tag that GitOps-updated commit: `git tag v1.0.0 && git push origin v1.0.0`. The **Release to production** workflow retags the SHA images as `:prod` and `:v1.0.0`.
4. Put real secrets in `daddy-prod` (see [`overlays/prod/README.md`](overlays/prod/README.md)).
5. Sync Argo app `daddy-prod` from the UI.

## Secrets

Placeholder values live in Git so Kustomize can render a complete app. Argo is set to **ignore Secret data diffs**, so you replace passwords and OAuth client secrets in the cluster without Git overwriting them.

### After this lands on `dev`

Argo will not add new Secret keys by itself. Patch `daddy-dev` once so pods can read `INTER_SERVICE_SECRET`:

```bash
oc patch secret daddy-app-secret -n daddy-dev --type merge \
  -p '{"stringData":{"INTER_SERVICE_SECRET":"dev-secret-change-in-production"}}'
```

That value matches the code default used today. Staging and production use different values from [`overlays/prod/README.md`](overlays/prod/README.md).

