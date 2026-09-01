# `base/` — shared Kubernetes manifests

Deployments and Services for the Next.js app, the five microservices, Postgres, and Redis. CI writes the image tag (short Git SHA) into these files.

Also: `app-route.yaml` (OpenShift Route), PVC, and secret placeholders (`AUTH_SECRET`, `AUTH_URL`, `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`).
