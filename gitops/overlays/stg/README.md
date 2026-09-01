# `stg/`

Kustomize overlay for staging (`daddy-stg`). Use this after `dev` looks stable, before a production tag.

Argo tracks the **`stg` branch**, not `main`. Image SHAs come from `gitops/base` on that branch after CI.

Replace `CHANGE_ME_STG_*` secret values in the namespace after the first sync. Add Google redirect URI `https://daddy-app-daddy-stg.apps.cluster-x8bxx.x8bxx.sandbox2963.opentlc.com/api/auth/callback/google`.

This overlay includes `network-policy.yaml` (default-deny plus the ingress/egress the app needs, including OpenShift DNS on UDP/TCP 5353). Keep that file in sync with `../prod/network-policy.yaml`.
