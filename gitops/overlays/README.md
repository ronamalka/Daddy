# `overlays/` — per-environment patches

Kustomize overlays on top of `base/`. Image tags come from `base/` on the branch Argo tracks. Overlays change namespace, public URLs, storage, and secret placeholders. `stg` and `prod` also include network policy.

| Overlay | Namespace | Git branch | Typical use |
| --- | --- | --- | --- |
| `dev/` | daddy-dev | `dev` | Daily work, auto-sync |
| `stg/` | daddy-stg | `stg` | Staging, closer to production |
| `prod/` | daddy-prod | `main` | Production after a release tag, manual sync |
