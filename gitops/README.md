# `gitops/` — cluster desired state

Argo CD watches this folder (on the `dev` / `stg` / `prod` branches) and applies it to OpenShift.

| Folder | Role |
| --- | --- |
| `base/` | Shared Deployments, Services, Postgres, Redis, secrets placeholders |
| `overlays/dev`, `stg`, `prod` | Environment differences (image tags, replica counts) |
| `argocd/` | Application CRDs that point Argo at each overlay |

CI updates image tags in `base/*-deployment.yaml` after a green build. Wait for Argo to sync. Do not patch images by hand.
