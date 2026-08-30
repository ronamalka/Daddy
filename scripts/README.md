# `scripts/` — operator helpers

| File | Purpose |
| --- | --- |
| `db-backup.sh` | Dump PostgreSQL |
| `deploy.sh` | Older "build image and apply YAML" path — prefer GitOps + Argo |
| `setup-openshift.sh` | First-time cluster bits |

These scripts are for operators. Application code does not import them.
