import express from 'express';
import client from 'prom-client';

const app = express();

const register = new client.Registry();

client.collectDefaultMetrics({ register });

// Custom metric: total HTTP requests
const httpRequestsTotal = new client.Counter({
  name: 'http_requests_total',
  help: 'Total number of HTTP requests',
  labelNames: ['method', 'route', 'status_code'],
  registers: [register],
});

// Custom metric: request duration
const httpRequestDuration = new client.Histogram({
  name: 'http_request_duration_seconds',
  help: 'Duration of HTTP requests in seconds',
  labelNames: ['method', 'route', 'status_code'],
  buckets: [0.1, 0.3, 0.5, 1, 2, 5],
  registers: [register],
});

// Middleware to measure all requests
app.use((req, res, next) => {
  const end = httpRequestDuration.startTimer();

  res.on('finish', () => {
    const route = req.route?.path || req.path || 'unknown';

    httpRequestsTotal.inc({
      method: req.method,
      route,
      status_code: res.statusCode,
    });

    end({
      method: req.method,
      route,
      status_code: res.statusCode,
    });
  });

  next();
});

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

app.get('/', (req, res) => {
  res.status(200).json({
    success: true,
    message: 'Here you gooooo! CI/CD pipeline deployement🚨',
  });
});

app.listen(3000, () => console.log('Server running on port:3000'));
