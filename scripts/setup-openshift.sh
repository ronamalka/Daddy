#!/bin/bash
set -euo pipefail

# Setup Daddy on OpenShift with GitOps
# Prerequisites:
#   - oc logged in as cluster-admin
#   - Image pushed to quay.io/rh_ee_rmalka/daddy
#
# Usage: ./scripts/setup-openshift.sh

QUAY_USER="rh_ee_rmalka"
IMAGE="quay.io/${QUAY_USER}/daddy"

echo "=== Setting up Daddy on OpenShift ==="
echo ""

# Step 1: Create namespaces
echo "[1/6] Creating namespaces..."
for ENV in dev stg prod; do
  oc new-project "daddy-${ENV}" --description="Daddy ${ENV}" 2>/dev/null || oc project "daddy-${ENV}" 2>/dev/null
  echo "  Created daddy-${ENV}"
done

# Step 2: Create secrets in each namespace
echo "[2/6] Creating secrets..."
for ENV in dev stg prod; do
  # PostgreSQL secret
  oc create secret generic postgres-secret \
    --from-literal=POSTGRES_USER=daddy \
    --from-literal=POSTGRES_PASSWORD="daddy-${ENV}-$(openssl rand -hex 8)" \
    --from-literal=POSTGRES_DB=daddy \
    -n "daddy-${ENV}" --dry-run=client -o yaml | oc apply -f -

  # Update DATABASE_URL in the secret
  PG_PASS=$(oc get secret postgres-secret -n "daddy-${ENV}" -o jsonpath='{.data.POSTGRES_PASSWORD}' | base64 -d)
  oc create secret generic postgres-secret \
    --from-literal=POSTGRES_USER=daddy \
    --from-literal=POSTGRES_PASSWORD="${PG_PASS}" \
    --from-literal=POSTGRES_DB=daddy \
    --from-literal=DATABASE_URL="postgresql://daddy:${PG_PASS}@postgres:5432/daddy?sslmode=disable" \
    -n "daddy-${ENV}" --dry-run=client -o yaml | oc apply -f -

  # App secret
  AUTH_SECRET=$(openssl rand -base64 32)
  oc create secret generic daddy-app-secret \
    --from-literal=AUTH_SECRET="${AUTH_SECRET}" \
    --from-literal=AUTH_URL="https://daddy-app-daddy-${ENV}.apps.$(oc get ingresses.config.openshift.io cluster -o jsonpath='{.spec.domain}' 2>/dev/null || echo 'YOUR_CLUSTER')" \
    -n "daddy-${ENV}" --dry-run=client -o yaml | oc apply -f -

  echo "  Secrets created in daddy-${ENV}"
done

# Step 3: Install OpenShift GitOps operator (if not installed)
echo "[3/6] Checking GitOps operator..."
if ! oc get csv -n openshift-gitops 2>/dev/null | grep -q Succeeded; then
  echo "  Installing OpenShift GitOps operator..."
  oc apply -f openshift/gitops-operator-subscription.yaml
  echo "  Waiting for operator (this may take 2-3 minutes)..."
  for i in $(seq 1 30); do
    if oc get csv -n openshift-gitops 2>/dev/null | grep -q Succeeded; then
      echo "  GitOps operator ready!"
      break
    fi
    sleep 10
  done
else
  echo "  GitOps operator already installed."
fi

# Step 4: Grant ArgoCD access to namespaces
echo "[4/6] Granting ArgoCD access..."
for ENV in dev stg prod; do
  oc adm policy add-role-to-user admin system:serviceaccount:openshift-gitops:openshift-gitops-argocd-application-controller -n "daddy-${ENV}" 2>/dev/null || true
  echo "  Granted access to daddy-${ENV}"
done

# Step 5: Create Quay.io pull secret in each namespace
echo "[5/6] Creating image pull secrets..."
QUAY_AUTH=$(cat ~/.config/containers/auth.json 2>/dev/null || cat ~/.docker/config.json 2>/dev/null)
if [ -n "${QUAY_AUTH}" ]; then
  for ENV in dev stg prod; do
    oc create secret docker-registry quay-pull-secret \
      --docker-server=quay.io \
      --docker-username="${QUAY_USER}" \
      --docker-password="$(echo "${QUAY_AUTH}" | python3 -c "import sys,json; print(json.load(sys.stdin).get('auths',{}).get('quay.io',{}).get('auth',''))" | base64 -d | cut -d: -f2)" \
      -n "daddy-${ENV}" --dry-run=client -o yaml 2>/dev/null | oc apply -f - || echo "  Skipped (manual setup needed)"
    oc secrets link default quay-pull-secret --for=pull -n "daddy-${ENV}" 2>/dev/null || true
  done
else
  echo "  WARNING: No container auth found. Set up pull secrets manually:"
  echo "    oc create secret docker-registry quay-pull-secret --docker-server=quay.io --docker-username=${QUAY_USER} --docker-password=YOUR_TOKEN -n daddy-dev"
fi

# Step 6: Apply ArgoCD applications
echo "[6/6] Creating ArgoCD applications..."
oc apply -f gitops/argocd/project.yaml
oc apply -f gitops/argocd/app-dev.yaml
oc apply -f gitops/argocd/app-stg.yaml
oc apply -f gitops/argocd/app-prod.yaml
echo "  ArgoCD applications created!"

echo ""
echo "=== Setup complete! ==="
echo ""
echo "ArgoCD UI: $(oc get route openshift-gitops-server -n openshift-gitops -o jsonpath='{.spec.host}' 2>/dev/null || echo 'check: oc get route -n openshift-gitops')"
echo ""
echo "Next steps:"
echo "  1. Push code to 'develop' branch -> triggers dev deployment"
echo "  2. Push code to 'main' branch -> triggers stg deployment"
echo "  3. Promote to prod: update gitops/overlays/prod/kustomization.yaml with the stg image tag"
echo ""
echo "GitHub secrets needed:"
echo "  QUAY_USER=${QUAY_USER}"
echo "  QUAY_TOKEN=<your quay.io token>"
