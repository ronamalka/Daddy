# `workflows/` — GitHub Actions

- `ci.yml` — main pipeline for `dev` and feature branches
- `deploy-production.yml` — production image/GitOps path

Do not enable a job that runs `oc set image` as a shortcut around Argo.
