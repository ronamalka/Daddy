#!/bin/bash
set -euo pipefail

# Deploy Daddy to OpenShift / AKS
# Usage: ./scripts/deploy.sh <image-registry> [namespace]
#
# Examples:
#   ./scripts/deploy.sh image-registry.openshift-image-registry.svc:5000/daddy
#   ./scripts/deploy.sh myacr.azurecr.io/daddy
#   ./scripts/deploy.sh docker.io/myuser/daddy

if [ $# -lt 1 ]; then
  echo "Usage: $0 <image-registry> [namespace]"
  echo "  image-registry: Full registry path (e.g., myacr.azurecr.io/daddy)"
  echo "  namespace: Kubernetes namespace (default: daddy)"
  exit 1
fi

IMAGE_REGISTRY="$1"
NAMESPACE="${2:-daddy}"
IMAGE_TAG="${IMAGE_TAG:-latest}"
FULL_IMAGE="${IMAGE_REGISTRY}:${IMAGE_TAG}"

echo "=== Daddy Deployment ==="
echo "Image: ${FULL_IMAGE}"
echo "Namespace: ${NAMESPACE}"
echo ""

# Step 1: Build and push the Docker image
echo "[1/6] Building Docker image..."
docker build -t "${FULL_IMAGE}" .
echo "[1/6] Pushing Docker image..."
docker push "${FULL_IMAGE}"

# Step 2: Create namespace
echo "[2/6] Creating namespace..."
kubectl apply -f openshift/namespace.yaml 2>/dev/null || true

# Step 3: Apply secrets (update these before deploying!)
echo "[3/6] Applying secrets..."
echo "  WARNING: Update openshift/postgres-secret.yaml and openshift/app-secret.yaml with real values before deploying!"
kubectl apply -f openshift/postgres-secret.yaml -n "${NAMESPACE}"
kubectl apply -f openshift/app-secret.yaml -n "${NAMESPACE}"

# Step 4: Deploy PostgreSQL
echo "[4/6] Deploying PostgreSQL..."
kubectl apply -f openshift/postgres-pvc.yaml -n "${NAMESPACE}"
kubectl apply -f openshift/postgres-deployment.yaml -n "${NAMESPACE}"
kubectl apply -f openshift/postgres-service.yaml -n "${NAMESPACE}"
echo "  Waiting for PostgreSQL to be ready..."
kubectl rollout status deployment/postgres -n "${NAMESPACE}" --timeout=120s

# Step 5: Deploy the app (replace image placeholder)
echo "[5/6] Deploying Daddy app..."
sed "s|IMAGE_REGISTRY/daddy:latest|${FULL_IMAGE}|g" openshift/app-deployment.yaml | kubectl apply -f - -n "${NAMESPACE}"
kubectl apply -f openshift/app-service.yaml -n "${NAMESPACE}"

# Apply Route (OpenShift only — will fail silently on plain K8s/AKS)
kubectl apply -f openshift/app-route.yaml -n "${NAMESPACE}" 2>/dev/null && echo "  OpenShift Route created." || echo "  Skipping Route (not on OpenShift). Create an Ingress instead for AKS."

echo "  Waiting for app to be ready..."
kubectl rollout status deployment/daddy-app -n "${NAMESPACE}" --timeout=180s

# Step 6: Run database migration + seed
echo "[6/6] Running database migration and seed..."
sed "s|IMAGE_REGISTRY/daddy:latest|${FULL_IMAGE}|g" openshift/db-migrate-job.yaml | kubectl apply -f - -n "${NAMESPACE}"
echo "  Waiting for migration job to complete..."
kubectl wait --for=condition=complete job/daddy-db-migrate -n "${NAMESPACE}" --timeout=120s

echo ""
echo "=== Deployment complete! ==="
# Try to get the route URL (OpenShift)
ROUTE_URL=$(kubectl get route daddy-app -n "${NAMESPACE}" -o jsonpath='{.spec.host}' 2>/dev/null || echo "")
if [ -n "${ROUTE_URL}" ]; then
  echo "App URL: https://${ROUTE_URL}"
else
  echo "Get the external IP/URL with: kubectl get svc daddy-app -n ${NAMESPACE}"
fi
