# `argocd/` — Argo CD applications

YAML that registers each environment as an Argo app (`app-dev.yaml`, `app-stg.yaml`, `app-prod.yaml`) plus `project.yaml`.

Argo syncs Git (this repo's gitops path) to the cluster. That is the supported deploy path.
