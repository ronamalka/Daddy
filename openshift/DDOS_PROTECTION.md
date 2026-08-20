# DDoS Protection Guide

## Current Protections

### Ingress Layer (NGINX)
- **Rate limiting**: 50 rps per client IP, burst multiplier 3x
- **Connection limit**: 20 concurrent connections per IP
- **Timeouts**: read/send 30s, connect 10s (prevents slowloris)
- **Body size**: 5MB max request body
- **IP blocklist**: ConfigMap-based deny list

### Application Layer (BFF Middleware)
- Auth endpoints: 10 req/min per IP
- POST mutations: 30 req/min per IP
- GET reads: 120 req/min per IP
- All configurable via `RATE_LIMIT_AUTH`, `RATE_LIMIT_POST`, `RATE_LIMIT_GET` env vars

### Account Layer
- Per-email login attempt tracking (Redis)
- Progressive lockout: delay → soft lock → hard lock

## IP Blocklist Management

### Add an IP to the blocklist

```bash
# Edit the ConfigMap
oc edit configmap ip-blocklist -n daddy

# Add deny rules:
# deny 1.2.3.4;
# deny 10.0.0.0/8;

# Reload NGINX to apply
oc rollout restart deployment/ingress-nginx-controller -n ingress-nginx
```

### Block IPs from security logs

```bash
# Find top offending IPs from security logs
oc logs deployment/daddy-app -n daddy | \
  grep '\[SECURITY\]' | grep '"login_failure"' | \
  jq -r '.ip' | sort | uniq -c | sort -rn | head -20

# Block the top offender
oc patch configmap ip-blocklist -n daddy --type merge \
  -p '{"data":{"blocklist.conf":"deny 1.2.3.4;\n"}}'
```

## WAF Evaluation

### Recommended: Cloudflare (if domain DNS can be proxied)

| Feature | Free | Pro ($20/mo) |
|---------|------|-------------|
| DDoS mitigation | Yes (L3/L4) | Yes (L3/L4/L7) |
| WAF rules | 5 custom | Managed ruleset |
| Rate limiting | 1 rule | 10 rules |
| Bot management | Basic | Advanced |
| IP blocklist | Yes | Yes |

**Best for**: Most cost-effective, handles volumetric + application-layer attacks before they reach your cluster.

### Alternative: ModSecurity (NGINX module)

```yaml
# Enable in NGINX ingress ConfigMap
apiVersion: v1
kind: ConfigMap
metadata:
  name: ingress-nginx-controller
data:
  enable-modsecurity: "true"
  enable-owasp-modsecurity-crs: "true"
  modsecurity-snippet: |
    SecRuleEngine On
    SecRequestBodyLimit 5242880
```

**Pros**: Free, runs inside cluster, OWASP Core Rule Set blocks common attacks.
**Cons**: CPU overhead (5-15%), false positives need tuning, no volumetric protection.

### Alternative: AWS WAF (if behind ALB)

| Feature | Cost |
|---------|------|
| Web ACL | $5/mo |
| Rules | $1/mo per rule |
| Requests | $0.60/million |
| Managed rule groups | $1-20/mo per group |

**Best for**: AWS-hosted clusters with ALB ingress.

### Recommendation

**Start with Cloudflare Free** → upgrade to Pro if needed. Add ModSecurity as defense-in-depth for OWASP rules. Only use AWS WAF if already on AWS with ALB.

## Monitoring & Alerts

### Prometheus Alert Rules

```yaml
apiVersion: monitoring.coreos.com/v1
kind: PrometheusRule
metadata:
  name: daddy-ddos-alerts
  namespace: daddy
spec:
  groups:
    - name: ddos-protection
      rules:
        - alert: HighRequestRate
          expr: sum(rate(nginx_ingress_controller_requests[5m])) > 500
          for: 2m
          labels:
            severity: warning
          annotations:
            summary: "Traffic spike detected (>10x baseline of 50 rps)"
            description: "Current rate: {{ $value }} rps"

        - alert: High429Rate
          expr: sum(rate(nginx_ingress_controller_requests{status="429"}[5m])) > 50
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: "High rate of 429 responses — possible DDoS"
            description: "{{ $value }} rate-limited requests per second"

        - alert: HighLoginFailureRate
          expr: |
            count_over_time({job="daddy-app"} |= "[SECURITY]" |= "login_failure" [5m]) > 50
          for: 5m
          labels:
            severity: critical
          annotations:
            summary: ">50 failed logins in 5 minutes — possible credential stuffing"

        - alert: PodHighCPU
          expr: rate(container_cpu_usage_seconds_total{pod=~"daddy-app.*"}[5m]) > 0.8
          for: 3m
          labels:
            severity: warning
          annotations:
            summary: "App pod CPU >80% — possible application-layer attack"
```

### Grafana Dashboard Queries

```
# Request rate by status code
sum by (status) (rate(nginx_ingress_controller_requests{namespace="daddy"}[5m]))

# 429 rate over time
rate(nginx_ingress_controller_requests{namespace="daddy",status="429"}[5m])

# Top IPs by request count (from access logs)
topk(10, sum by (remote_addr) (rate(nginx_ingress_controller_request_size_count[5m])))

# Security events per minute
count_over_time({job="daddy-app"} |= "[SECURITY]" [1m])
```

### Incident Response

1. **Spike detected** → Check Grafana for source IPs
2. **Single IP** → Add to blocklist ConfigMap, reload NGINX
3. **Distributed** → Enable Cloudflare "Under Attack" mode
4. **Application-layer** → Increase rate limits via env vars, scale pods
5. **Post-incident** → Review security logs, update blocklist, document
