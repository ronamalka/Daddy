# PostgreSQL TLS Configuration

## Current Setup

- `sslmode=require` in production `DATABASE_URL`
- `sslmode=disable` in local `docker-compose.yml` (dev only)
- PostgreSQL container configured with `ssl=on` via args
- TLS cert/key mounted from `postgres-tls` secret at `/etc/postgresql/tls/`
- `fsGroup: 999` ensures postgres user can read the key file

## Provisioning TLS Certificates

### Option A: OpenShift Service Serving Certificates

```bash
oc annotate service postgres \
  service.beta.openshift.io/serving-cert-secret-name=postgres-tls

# OpenShift auto-creates the 'postgres-tls' secret with tls.crt and tls.key
# Certificates are auto-rotated before expiry
```

### Option B: Manual cert-manager

```bash
# Create a Certificate resource
cat <<EOF | oc apply -f -
apiVersion: cert-manager.io/v1
kind: Certificate
metadata:
  name: postgres-tls
  namespace: daddy
spec:
  secretName: postgres-tls
  duration: 8760h    # 1 year
  renewBefore: 720h  # Renew 30 days before expiry
  issuerRef:
    name: letsencrypt-prod  # or your internal CA
    kind: ClusterIssuer
  commonName: postgres.daddy.svc.cluster.local
  dnsNames:
    - postgres.daddy.svc.cluster.local
    - postgres.daddy.svc
    - postgres
EOF
```

### Option C: Self-signed (non-production)

```bash
openssl req -new -x509 -days 365 -nodes \
  -out tls.crt -keyout tls.key \
  -subj "/CN=postgres.daddy.svc.cluster.local"

oc create secret tls postgres-tls \
  --cert=tls.crt --key=tls.key \
  -n daddy

rm tls.crt tls.key
```

## Testing the Connection

### From inside the cluster

```bash
# Exec into the app pod
oc rsh deployment/daddy-app

# Test with psql
psql "$DATABASE_URL" -c "SHOW ssl;"
# Expected: ssl = on

# Verify SSL details
psql "$DATABASE_URL" -c "SELECT ssl, version, cipher FROM pg_stat_ssl WHERE pid = pg_backend_pid();"
# Expected: ssl=t, version=TLSv1.3, cipher=TLS_AES_256_GCM_SHA384
```

### From a debug pod

```bash
oc run ssl-test --rm -it --image=postgres:16-alpine -- \
  psql "postgresql://daddy:PASSWORD@postgres:5432/daddy_users?sslmode=require" \
  -c "SELECT ssl FROM pg_stat_ssl WHERE pid = pg_backend_pid();"
```

### Verify cert is mounted correctly

```bash
oc exec deployment/postgres -- ls -la /etc/postgresql/tls/
# Should show tls.crt and tls.key with mode 0600
```

## Certificate Rotation Process

### Automated (recommended)

If using OpenShift serving certs or cert-manager, rotation is automatic. The secret is updated in place and PostgreSQL picks up the new cert on next connection (existing connections continue with the old cert).

For a zero-downtime rotation:
1. New cert appears in the `postgres-tls` secret
2. Restart PostgreSQL to load the new cert: `oc rollout restart deployment/postgres`
3. Application reconnections automatically use the new cert

### Manual Rotation

```bash
# 1. Generate new certificates
openssl req -new -x509 -days 365 -nodes \
  -out tls.crt -keyout tls.key \
  -subj "/CN=postgres.daddy.svc.cluster.local"

# 2. Update the secret
oc create secret tls postgres-tls \
  --cert=tls.crt --key=tls.key \
  -n daddy --dry-run=client -o yaml | oc apply -f -

# 3. Restart PostgreSQL to load new cert
oc rollout restart deployment/postgres -n daddy

# 4. Verify
oc rollout status deployment/postgres -n daddy
oc exec deployment/postgres -- psql -U daddy -c "SHOW ssl;"

# 5. Clean up local files
rm tls.crt tls.key
```

### Rotation Schedule

- **Production**: Rotate annually, or use cert-manager with `renewBefore: 720h`
- **Monitoring**: Set up an alert for cert expiry < 30 days
- **Testing**: After rotation, verify connections from all services

## Troubleshooting

| Symptom | Cause | Fix |
|---------|-------|-----|
| `FATAL: could not load server certificate file` | Missing or wrong permissions on tls.crt | Check `oc get secret postgres-tls` exists; verify `defaultMode: 0600` |
| `SSL connection is required` but app can't connect | sslmode mismatch | Verify `DATABASE_URL` has `sslmode=require` in production |
| `certificate verify failed` | Self-signed cert with `sslmode=verify-full` | Use `sslmode=require` or add CA to app's trust store |
| Key file permission denied | fsGroup not set | Ensure `securityContext.fsGroup: 999` on pod spec |
