# Deployment Guide

## 🚀 Production Deployment

This guide covers deploying the XAUUSD AI Trade Dashboard to production environments.

## Table of Contents
1. [Pre-Deployment Checklist](#pre-deployment-checklist)
2. [Build Optimization](#build-optimization)
3. [Deployment Options](#deployment-options)
4. [Environment Configuration](#environment-configuration)
5. [Security Considerations](#security-considerations)
6. [Monitoring & Maintenance](#monitoring--maintenance)

---

## Pre-Deployment Checklist

Before deploying to production:

### Code Quality
- [ ] All tests passing: `npm run test`
- [ ] No console errors or warnings
- [ ] ESLint passing: `npm run lint`
- [ ] TypeScript types correct: `npm run build`
- [ ] No hardcoded secrets in code

### Environment Setup
- [ ] `.env` file NOT committed to git
- [ ] All API keys verified and active
- [ ] Rate limits understood and tested
- [ ] Backup API keys available
- [ ] Error monitoring configured

### Testing
- [ ] Paper traded for 30+ days
- [ ] Backtested on historical data
- [ ] Tested with real API keys
- [ ] Tested error scenarios
- [ ] Tested with slow internet

### Documentation
- [ ] README updated with prod instructions
- [ ] Deployment steps documented
- [ ] Rollback procedure defined
- [ ] Support contacts documented
- [ ] Version control tagged

---

## Build Optimization

### Production Build

```bash
# Build the project
npm run build

# This creates optimized dist/ folder with:
# - Minified JavaScript
# - Optimized CSS
# - Compressed assets
# - Source maps for debugging
```

### Build Output
```
dist/
├── index.html              (Single entry point)
├── assets/
│   ├── main.[hash].js      (Main application code)
│   ├── style.[hash].css    (Compiled styles)
│   └── vendor.[hash].js    (Dependencies)
└── vite.svg
```

### Performance Metrics
```bash
# Check bundle size
npm run build -- --report

# Expected sizes:
# - Main JS: < 200KB
# - CSS: < 50KB
# - Total: < 300KB (gzipped)
```

### Optimization Tips

1. **Lazy Load Components**
   ```typescript
   // Add React.lazy for code splitting
   const Dashboard = React.lazy(() => import('./Dashboard'));
   ```

2. **Minimize API Calls**
   - Cache results for 5 minutes
   - Batch requests where possible
   - Use debouncing for user actions

3. **Optimize Images**
   - Use WebP format
   - Implement lazy loading
   - Compress all images

4. **Remove Unused Code**
   - Tree-shake unused imports
   - Remove unused CSS
   - Minimize dependencies

---

## Deployment Options

### Option 1: Vercel (Recommended for Vite)

**Best for**: Quick deployment, automatic scaling, free tier available

**Steps**:
1. Push code to GitHub
2. Go to https://vercel.com
3. Import repository
4. Add environment variables
5. Deploy automatically

**Environment Variables on Vercel**:
- Go to Project Settings → Environment Variables
- Add all variables from `.env`
- Deployments automatically use them

**Deployment Command**:
```
npm run build
```

**Output Directory**:
```
dist
```

### Option 2: Netlify

**Best for**: Jamstack hosting, free tier, great UI

**Steps**:
1. Push to GitHub
2. Go to https://netlify.com
3. Select repository
4. Configure build settings:
   - Build command: `npm run build`
   - Publish directory: `dist`
5. Add environment variables
6. Deploy

**Netlify Configuration** (netlify.toml):
```toml
[build]
  command = "npm run build"
  publish = "dist"

[build.environment]
  VITE_OPENAI_API_KEY = "your-key"

[[redirects]]
  from = "/*"
  to = "/index.html"
  status = 200
```

### Option 3: Docker (For Self-Hosted)

**Best for**: Full control, on-premise deployment, custom infrastructure

**Dockerfile**:
```dockerfile
# Build stage
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
RUN npm run build

# Production stage
FROM node:18-alpine
WORKDIR /app
RUN npm install -g serve
COPY --from=builder /app/dist ./dist

# Environment variables
ENV VITE_OPENAI_API_KEY=""
ENV VITE_ALPHA_VANTAGE_API_KEY=""
ENV VITE_FINNHUB_API_KEY=""

EXPOSE 5173
CMD ["serve", "-s", "dist", "-l", "5173"]
```

**Build and Run**:
```bash
# Build image
docker build -t xauusd-dashboard .

# Run container
docker run -e VITE_OPENAI_API_KEY=your-key -p 5173:5173 xauusd-dashboard

# Or use docker-compose
docker-compose up
```

**docker-compose.yml**:
```yaml
version: '3'
services:
  dashboard:
    build: .
    ports:
      - "5173:5173"
    environment:
      VITE_OPENAI_API_KEY: ${VITE_OPENAI_API_KEY}
      VITE_ALPHA_VANTAGE_API_KEY: ${VITE_ALPHA_VANTAGE_API_KEY}
      VITE_FINNHUB_API_KEY: ${VITE_FINNHUB_API_KEY}
```

### Option 4: AWS S3 + CloudFront

**Best for**: Enterprise, global distribution, high traffic

**Steps**:
1. Build project: `npm run build`
2. Upload `dist/` to S3 bucket
3. Configure CloudFront distribution
4. Set up API Gateway for serverless backend
5. Configure API Gateway for ChatGPT calls

**S3 Policy**:
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "PublicRead",
      "Effect": "Allow",
      "Principal": "*",
      "Action": "s3:GetObject",
      "Resource": "arn:aws:s3:::bucket-name/*"
    }
  ]
}
```

### Option 5: Traditional VPS (nginx)

**Best for**: Full control, existing infrastructure, custom requirements

**nginx Configuration**:
```nginx
server {
    listen 80;
    server_name example.com;

    # Redirect to HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;

    # SSL certificates (use Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # Compression
    gzip on;
    gzip_types text/plain text/css application/json application/javascript;

    # Root directory
    root /var/www/xauusd-dashboard/dist;
    index index.html;

    # API proxy (optional, for backend calls)
    location /api/ {
        proxy_pass https://api.openai.com/;
        proxy_set_header Authorization $http_authorization;
    }

    # SPA routing
    location / {
        try_files $uri $uri/ /index.html;
    }

    # Cache static assets
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|woff|woff2)$ {
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

---

## Environment Configuration

### Production Environment Variables

**Create `.env.production`**:
```env
# OpenAI API (Required)
VITE_OPENAI_API_KEY=sk-prod-key-here

# Market Data APIs (Optional)
VITE_ALPHA_VANTAGE_API_KEY=prod-alpha-key
VITE_FINNHUB_API_KEY=prod-finnhub-key

# Analytics (Optional)
VITE_SENTRY_DSN=https://your-sentry-dsn
VITE_GA_ID=UA-your-google-analytics-id

# API Endpoints (Optional)
VITE_API_BASE_URL=https://api.yourdomain.com

# Feature Flags
VITE_ENABLE_ADVANCED_ANALYSIS=true
VITE_ENABLE_BACKTESTING=false
VITE_CACHE_RESULTS=true
VITE_CACHE_TTL=300000
```

### Environment-Specific Configuration

```typescript
// src/config/env.ts
export const config = {
  isDevelopment: import.meta.env.DEV,
  isProduction: import.meta.env.PROD,
  apiKey: import.meta.env.VITE_OPENAI_API_KEY,
  
  // Cache settings
  cacheEnabled: import.meta.env.VITE_CACHE_RESULTS === 'true',
  cacheTTL: parseInt(import.meta.env.VITE_CACHE_TTL || '300000'),
  
  // Feature flags
  advancedAnalysis: import.meta.env.VITE_ENABLE_ADVANCED_ANALYSIS === 'true',
  backtesting: import.meta.env.VITE_ENABLE_BACKTESTING === 'true',
};
```

---

## Security Considerations

### API Key Management

❌ **Never do this**:
```typescript
const apiKey = "sk-abc123..."; // Hardcoded!
```

✅ **Do this instead**:
```typescript
const apiKey = import.meta.env.VITE_OPENAI_API_KEY;
```

### Security Best Practices

1. **Use Environment Variables**
   - Never commit secrets to git
   - Use `.env.local` for local development
   - Use platform's secret management in production

2. **API Rate Limiting**
   - Implement on backend/gateway
   - Limit: 100 requests per hour per IP
   - Queue requests to prevent abuse

3. **CORS Configuration**
   ```nginx
   add_header 'Access-Control-Allow-Origin' 'https://yourdomain.com';
   add_header 'Access-Control-Allow-Methods' 'GET, POST, OPTIONS';
   add_header 'Access-Control-Max-Age' '3600';
   ```

4. **HTTPS Only**
   - Always use HTTPS in production
   - Use HTTP/2 for performance
   - Configure HSTS headers

5. **Content Security Policy**
   ```html
   <!-- In index.html -->
   <meta http-equiv="Content-Security-Policy" 
         content="default-src 'self'; 
                  script-src 'self' 'unsafe-inline' https://api.openai.com;
                  style-src 'self' 'unsafe-inline';
                  img-src 'self' data: https:">
   ```

6. **Input Validation**
   - Validate all user inputs
   - Sanitize API responses
   - Never execute user input

7. **Regular Updates**
   - Update dependencies: `npm update`
   - Check for vulnerabilities: `npm audit`
   - Monitor security advisories

---

## Monitoring & Maintenance

### Error Tracking (Sentry)

```typescript
// src/config/sentry.ts
import * as Sentry from "@sentry/react";

Sentry.init({
  dsn: import.meta.env.VITE_SENTRY_DSN,
  environment: import.meta.env.PROD ? 'production' : 'development',
  tracesSampleRate: 1.0,
});

// Wrap component
export const App = Sentry.withProfiler(AppComponent);
```

### Performance Monitoring

```typescript
// src/utils/performance.ts
export const trackAPICall = (serviceName: string, duration: number) => {
  if (window.gtag) {
    gtag('event', 'api_call', {
      'service': serviceName,
      'duration_ms': duration
    });
  }
};
```

### Logging Strategy

```typescript
// src/utils/logger.ts
export const logger = {
  info: (msg: string, data?: any) => {
    if (import.meta.env.PROD) {
      // Send to logging service
      fetch('/api/logs', { 
        method: 'POST',
        body: JSON.stringify({ level: 'info', msg, data })
      });
    } else {
      console.log(msg, data);
    }
  },
  error: (msg: string, error?: Error) => {
    Sentry.captureException(error);
    console.error(msg, error);
  }
};
```

### Health Checks

```typescript
// src/utils/healthCheck.ts
export const performHealthCheck = async () => {
  try {
    // Test API connectivity
    const response = await fetch('/health');
    if (response.ok) {
      console.log('✅ Service healthy');
      return true;
    }
  } catch (error) {
    console.error('❌ Health check failed:', error);
    return false;
  }
};
```

### Rollback Procedure

```bash
# If deployment fails:

# 1. Check current status
git log --oneline -5

# 2. Identify good commit
git log --all --grep="stable" --oneline

# 3. Revert to previous version
git revert HEAD
git push origin main

# 4. Deploy previous build
npm run build && deploy

# 5. Post-incident review
# Document what went wrong
# Update procedures
# Run tests to prevent recurrence
```

---

## CI/CD Pipeline (GitHub Actions)

**`.github/workflows/deploy.yml`**:
```yaml
name: Deploy to Production

on:
  push:
    branches: [main]

jobs:
  deploy:
    runs-on: ubuntu-latest
    
    steps:
      - uses: actions/checkout@v2
      
      - name: Setup Node
        uses: actions/setup-node@v2
        with:
          node-version: 18
          
      - name: Install dependencies
        run: npm install
        
      - name: Run linter
        run: npm run lint
        
      - name: Build
        run: npm run build
        
      - name: Deploy to Vercel
        uses: vercel/action@master
        with:
          vercel-token: ${{ secrets.VERCEL_TOKEN }}
          vercel-args: '--prod'
```

---

## Monitoring Checklist

After deployment:

- [ ] Dashboard loads without errors
- [ ] API calls working (check Network tab)
- [ ] Analysis results displaying correctly
- [ ] No console errors
- [ ] Performance acceptable (< 3s load time)
- [ ] Mobile responsive
- [ ] Error handling working (test with invalid key)
- [ ] Logging active
- [ ] Alerts configured
- [ ] Backups running
- [ ] Security headers present
- [ ] SSL/HTTPS working

---

## Support & Maintenance

### Regular Tasks

- **Daily**: Monitor error logs, check API quota
- **Weekly**: Review performance metrics, update dependencies
- **Monthly**: Security audit, backup verification
- **Quarterly**: Load testing, disaster recovery drill

### Scaling Plan

If traffic increases:
1. Enable caching layer (Redis)
2. Use CDN for static assets
3. Implement API gateway throttling
4. Scale backend infrastructure
5. Load testing to identify bottlenecks

---

**Happy deploying! 🚀**
