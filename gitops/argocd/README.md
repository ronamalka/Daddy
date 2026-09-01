# `argocd/` — Argo CD applications

YAML that registers each environment as an Argo app (`app-dev.yaml`, `app-stg.yaml`, `app-prod.yaml`) plus `project.yaml`.

| App | Git revision | Overlay | Sync |
| --- | --- | --- | --- |
| `daddy-dev` | `dev` | `overlays/dev` | auto, prune, self-heal |
| `daddy-stg` | `stg` | `overlays/stg` | auto, prune, self-heal |
| `daddy-prod` | `main` | `overlays/prod` | **manual** after a release tag |

All three ignore Secret `data` / `stringData` so cluster-managed credentials survive a sync.

Apply or refresh the CRs with:

```bash
oc apply -k gitops/argocd
```

Argo syncs Git (this repo's gitops path) to the cluster. That is the supported deploy path.
