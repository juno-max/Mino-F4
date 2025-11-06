# Uptime Monitoring Setup Guide

This guide covers setting up external uptime monitoring for MINO production deployments.

## Health Check Endpoints

MINO provides three health check endpoints for monitoring:

### 1. Basic Health Check

```
GET /api/health
```

**Purpose**: Verify the application is running and can connect to the database.

**Response**:
```json
{
  "status": "healthy",
  "timestamp": "2025-11-05T10:30:00Z",
  "uptime": 3600,
  "environment": "production",
  "version": "1.0.0"
}
```

**Status Codes**:
- `200`: Application is healthy
- `503`: Application is unhealthy (database connection failed)

### 2. Readiness Probe

```
GET /api/health/ready
```

**Purpose**: Check if the application is ready to receive traffic. Used by load balancers and Kubernetes.

**Checks**:
- Database connection
- EVA Agent API connection
- Redis connection (if configured)

**Response**:
```json
{
  "status": "ready",
  "timestamp": "2025-11-05T10:30:00Z",
  "checks": {
    "database": true,
    "evaAgent": true,
    "redis": true
  }
}
```

**Status Codes**:
- `200`: Application is ready
- `503`: Application is not ready (one or more checks failed)

### 3. Liveness Probe

```
GET /api/health/live
```

**Purpose**: Check if the application process is alive. Used to detect if the application should be restarted.

**Checks**:
- Event loop responsiveness
- Memory usage
- Process health

**Response**:
```json
{
  "status": "alive",
  "timestamp": "2025-11-05T10:30:00Z",
  "uptime": 3600,
  "eventLoopDelay": 2,
  "memory": {
    "rss": 256,
    "heapTotal": 128,
    "heapUsed": 64,
    "external": 8
  },
  "heapUsagePercent": "50.00",
  "pid": 12345
}
```

**Status Codes**:
- `200`: Application is alive
- `503`: Application is unhealthy (critical memory usage or event loop blocked)

## Metrics Export

```
GET /api/metrics
```

**Purpose**: Export application and business metrics in Prometheus format.

**Metrics Included**:
- HTTP request duration and count
- Database query performance
- Job processing metrics
- Execution statistics
- Error rates
- System metrics (memory, uptime, event loop)

**Example Output**:
```
# HELP mino_jobs_total Total jobs by status (last 24h)
# TYPE mino_jobs_total gauge
mino_jobs_total{status="completed"} 1234
mino_jobs_total{status="running"} 56
mino_jobs_total{status="error"} 12

# HELP mino_avg_accuracy_percentage Average accuracy percentage (last 24h)
# TYPE mino_avg_accuracy_percentage gauge
mino_avg_accuracy_percentage 95.50
```

## Recommended Monitoring Services

### Option 1: UptimeRobot (Free & Simple)

**Website**: https://uptimerobot.com

**Features**:
- Free tier: 50 monitors, 5-minute checks
- SMS/Email/Slack notifications
- Status pages
- Multi-location checks

**Setup**:

1. **Create Account**: Sign up at uptimerobot.com

2. **Add Monitor**:
   - Monitor Type: HTTP(S)
   - Friendly Name: MINO Health Check
   - URL: `https://your-domain.com/api/health`
   - Monitoring Interval: 5 minutes
   - Monitor Timeout: 30 seconds

3. **Add Alert Contacts**:
   - Email: your-team@example.com
   - Slack: Configure webhook integration
   - SMS: Add phone numbers (paid tier)

4. **Configure Alerts**:
   - Alert when down for: 2+ checks (10 minutes)
   - Alert when back up: Yes
   - Notification channels: Email + Slack

5. **Optional: Add Additional Monitors**:
   - `/api/health/ready` - Readiness check
   - `/api/health/live` - Liveness check
   - `/api/metrics` - Metrics endpoint

### Option 2: Pingdom (Advanced Features)

**Website**: https://www.pingdom.com

**Features**:
- Real user monitoring
- Transaction monitoring
- Multi-location checks
- Advanced alerting

**Setup**:

1. **Create Account**: Sign up at pingdom.com

2. **Add Uptime Check**:
   - Check Type: HTTP
   - Name: MINO Production
   - URL: `https://your-domain.com/api/health`
   - Check Interval: 1 minute
   - Locations: Select multiple regions

3. **Configure Response Validation**:
   - Expected response: `200 OK`
   - Response contains: `"status":"healthy"`

4. **Set Up Alerts**:
   - When to alert: Down 2 consecutive times
   - Contact methods: Email, SMS, Slack, PagerDuty

5. **Create Transaction Check** (Optional):
   - Monitor critical user flows
   - Check login, job creation, execution

### Option 3: Datadog (Enterprise)

**Website**: https://www.datadoghq.com

**Features**:
- Full APM and infrastructure monitoring
- Log aggregation
- Custom dashboards
- Advanced analytics

**Setup**:

1. **Install Datadog Agent** (on server):
```bash
DD_API_KEY=<your-api-key> DD_SITE="datadoghq.com" bash -c "$(curl -L https://s.datadoghq.com/scripts/install_script.sh)"
```

2. **Configure Synthetic Monitoring**:
   - Navigate to Synthetic Tests
   - Create API Test
   - URL: `https://your-domain.com/api/health`
   - Locations: Select global regions
   - Frequency: Every 1 minute

3. **Set Up Monitors**:
   - Health check response time > 1s
   - Error rate > 1%
   - Memory usage > 80%

4. **Configure Prometheus Integration**:
   - Add Prometheus integration
   - Point to `/api/metrics` endpoint
   - Import MINO dashboard template

5. **Set Up Alerts**:
   - Notify: Slack, PagerDuty, Email
   - Escalation policies for critical alerts

### Option 4: Better Stack (formerly Uptime.com)

**Website**: https://betterstack.com/uptime

**Features**:
- Uptime monitoring
- SSL certificate monitoring
- Status pages
- Incident management

**Setup**:

1. **Create Account**: Sign up at betterstack.com

2. **Add Monitor**:
   - Monitor Type: HTTP
   - URL: `https://your-domain.com/api/health`
   - Check Frequency: 30 seconds
   - Check Locations: Global

3. **Configure Assertions**:
   - Status code equals 200
   - Response body contains "healthy"
   - Response time < 2000ms

4. **Set Up Alerts**:
   - Alert channels: Email, Slack, Discord, Teams
   - On-call schedules
   - Escalation policies

## Kubernetes/Docker Health Checks

If deploying to Kubernetes or Docker, configure health checks:

### Kubernetes

```yaml
apiVersion: v1
kind: Pod
metadata:
  name: mino
spec:
  containers:
  - name: mino
    image: mino:latest
    ports:
    - containerPort: 3000

    # Liveness probe - restart if unhealthy
    livenessProbe:
      httpGet:
        path: /api/health/live
        port: 3000
      initialDelaySeconds: 30
      periodSeconds: 10
      timeoutSeconds: 5
      failureThreshold: 3

    # Readiness probe - don't send traffic if not ready
    readinessProbe:
      httpGet:
        path: /api/health/ready
        port: 3000
      initialDelaySeconds: 10
      periodSeconds: 5
      timeoutSeconds: 3
      failureThreshold: 2
```

### Docker Compose

```yaml
version: '3.8'
services:
  mino:
    image: mino:latest
    ports:
      - "3000:3000"
    healthcheck:
      test: ["CMD", "curl", "-f", "http://localhost:3000/api/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
```

## Prometheus + Grafana Setup

For advanced metrics visualization:

### 1. Configure Prometheus

**prometheus.yml**:
```yaml
global:
  scrape_interval: 15s

scrape_configs:
  - job_name: 'mino'
    static_configs:
      - targets: ['your-domain.com:3000']
    metrics_path: '/api/metrics'
    scheme: https
```

### 2. Set Up Grafana Dashboard

1. **Add Prometheus data source**:
   - URL: `http://prometheus:9090`

2. **Import MINO dashboard**:
   - Create new dashboard
   - Add panels for:
     - Request rate
     - Error rate
     - Response time
     - Job processing rate
     - Accuracy trends
     - Database query performance

3. **Example Queries**:
```promql
# Request rate
rate(http_requests_total[5m])

# Error rate
rate(http_requests_total{status=~"5.."}[5m]) / rate(http_requests_total[5m])

# Average response time
rate(http_request_duration_ms_sum[5m]) / rate(http_request_duration_ms_count[5m])

# Jobs per minute
rate(mino_jobs_total[1m]) * 60
```

## Alert Rules

Configure alerts for critical conditions:

### High Error Rate
```yaml
alert: HighErrorRate
expr: mino_error_rate_percentage > 5
for: 5m
annotations:
  summary: "High error rate detected"
  description: "Error rate is {{ $value }}% (threshold: 5%)"
```

### Low Accuracy
```yaml
alert: LowAccuracy
expr: mino_avg_accuracy_percentage < 80
for: 10m
annotations:
  summary: "Low accuracy detected"
  description: "Average accuracy is {{ $value }}% (threshold: 80%)"
```

### High Memory Usage
```yaml
alert: HighMemoryUsage
expr: (nodejs_memory_usage_bytes{type="heapUsed"} / nodejs_memory_usage_bytes{type="heapTotal"}) > 0.9
for: 5m
annotations:
  summary: "High memory usage"
  description: "Heap usage is {{ $value | humanizePercentage }}"
```

## Best Practices

1. **Monitor Multiple Endpoints**:
   - Health check for basic availability
   - Readiness probe for traffic routing
   - Liveness probe for process health
   - Metrics for performance tracking

2. **Use Multiple Monitoring Services**:
   - Primary: UptimeRobot/Pingdom for simple HTTP checks
   - Secondary: Datadog/Prometheus for detailed metrics
   - Redundancy: Use 2+ services to avoid false positives

3. **Set Appropriate Timeouts**:
   - Health checks: 5-10 seconds
   - Readiness probes: 3-5 seconds
   - Monitoring intervals: 1-5 minutes

4. **Configure Alert Thresholds**:
   - Don't alert on single failures
   - Require 2+ consecutive failures
   - Balance between noise and responsiveness

5. **Create Status Page**:
   - Use UptimeRobot or Better Stack status pages
   - Share with customers during incidents
   - Show real-time status of services

6. **Test Alert Channels**:
   - Verify email delivery
   - Test Slack notifications
   - Confirm escalation policies work

7. **Review Metrics Regularly**:
   - Weekly review of trends
   - Monthly capacity planning
   - Quarterly performance optimization

## Troubleshooting

### Health Check Returns 503

**Causes**:
- Database connection failed
- EVA Agent API unreachable
- Redis connection failed

**Actions**:
1. Check database status
2. Verify network connectivity
3. Review application logs
4. Check service credentials

### High Memory Usage Alerts

**Causes**:
- Memory leak
- Too many concurrent jobs
- Large data processing

**Actions**:
1. Restart application
2. Review memory usage trends
3. Optimize memory-intensive operations
4. Scale horizontally

### Slow Response Times

**Causes**:
- Database query performance
- High load
- External API delays

**Actions**:
1. Check `/api/metrics` for slow queries
2. Review database indexes
3. Scale resources
4. Implement caching

## Support

For monitoring setup assistance:
- Email: support@mino.app
- Slack: #production-monitoring
- Docs: https://docs.mino.app/monitoring
