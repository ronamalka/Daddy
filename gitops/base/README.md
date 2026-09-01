# `base/` — shared Kubernetes manifests

Deployments and Services for the Next.js app, the five microservices, Postgres, and Redis. CI writes the image tag (short Git SHA) into these files on the `dev`, `stg`, and `main` branches.

Also: `app-route.yaml` (OpenShift Route), PVC, `postgres-init-configmap.yaml` (creates the five service databases on first Postgres start), and secret placeholders (`AUTH_SECRET`, `AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`, `INTER_SERVICE_SECRET`).
