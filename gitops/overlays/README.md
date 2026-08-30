# `overlays/` — per-environment patches

Kustomize overlays on top of `base/`.

| Overlay | Typical use |
| --- | --- |
| `dev/` | daddy-dev cluster, fast iteration |
| `stg/` | Staging, closer to production |
| `prod/` | Production after a release tag |
