# `prod/`

Kustomize overlay for production (`daddy-prod`). Promote only after a release tag, not from a feature branch.

Argo tracks **`main`** and does **not** auto-sync. Image SHAs come from `gitops/base` on `main` after CI.

This overlay includes `network-policy.yaml` (default-deny plus the ingress/egress the app needs, including OpenShift DNS on UDP/TCP 5353). Keep that file in sync with `../stg/network-policy.yaml`.

The public production hostname is **`aballeh.com`** (also `www.aballeh.com`). The cluster default route stays as a fallback.

Point DNS at the OpenShift router (apex often needs ALIAS/ANAME, not CNAME):

```
aballeh.com      ALIAS/ANAME  af00024a83ee24d72b37ba10cf8f9024-1027604931.us-east-2.elb.amazonaws.com
www.aballeh.com  CNAME        router-default.apps.cluster-x8bxx.x8bxx.sandbox2963.opentlc.com
```

Until a certificate for `aballeh.com` is attached to the Route, browsers may warn on TLS (the router still presents the cluster wildcard cert). Add Google redirect URI `https://aballeh.com/api/auth/callback/google`.

## First production cut

1. Confirm `daddy-stg` is healthy on the build you want.
2. Merge `stg` → `main`. Wait for CI to write image SHAs into `gitops/base`.
3. Tag `v1.0.0` on that GitOps-updated commit and push the tag. Create a GitHub Environment named `production` if it does not exist (the release workflow uses it).
4. Create real secrets in `daddy-prod` (placeholders in Git are `CHANGE_ME_PROD_*`). Argo will not overwrite Secret data.

```bash
NS=daddy-prod
PG_PASS="$(openssl rand -base64 24)"
AUTH_SECRET="$(openssl rand -base64 32)"
ISS="$(openssl rand -hex 32)"

oc create namespace "$NS" --dry-run=client -o yaml | oc apply -f -

oc create secret generic postgres-secret -n "$NS" \
  --from-literal=POSTGRES_USER=daddy \
  --from-literal=POSTGRES_PASSWORD="$PG_PASS" \
  --from-literal=POSTGRES_DB=daddy \
  --from-literal=DATABASE_URL="postgresql://daddy:${PG_PASS}@postgres:5432/daddy" \
  --from-literal=USERS_DATABASE_URL="postgresql://daddy:${PG_PASS}@postgres:5432/daddy_users" \
  --from-literal=GIGS_DATABASE_URL="postgresql://daddy:${PG_PASS}@postgres:5432/daddy_gigs" \
  --from-literal=ORDERS_DATABASE_URL="postgresql://daddy:${PG_PASS}@postgres:5432/daddy_orders" \
  --from-literal=REQUESTS_DATABASE_URL="postgresql://daddy:${PG_PASS}@postgres:5432/daddy_requests" \
  --from-literal=CHAT_DATABASE_URL="postgresql://daddy:${PG_PASS}@postgres:5432/daddy_chat" \
  --dry-run=client -o yaml | oc apply -f -

oc create secret generic daddy-app-secret -n "$NS" \
  --from-literal=AUTH_SECRET="$AUTH_SECRET" \
  --from-literal=AUTH_URL=https://aballeh.com \
  --from-literal=NEXT_PUBLIC_BASE_URL=https://aballeh.com \
  --from-literal=INTER_SERVICE_SECRET="$ISS" \
  --from-literal=GOOGLE_CLIENT_ID="$GOOGLE_CLIENT_ID" \
  --from-literal=GOOGLE_CLIENT_SECRET="$GOOGLE_CLIENT_SECRET" \
  --dry-run=client -o yaml | oc apply -f -
```

5. Add the production Google redirect URI `https://aballeh.com/api/auth/callback/google`.
6. `oc apply -k gitops/argocd` if `daddy-prod` is not registered yet.
7. Sync `daddy-prod` from the Argo UI.

Postgres init (`CREATE DATABASE` per service) runs only on an empty PVC. Do not restore a volume and expect init scripts to run again.
