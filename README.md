# CaseWise Assess

Production-grade backend microservice for Australian migration professionals (Registered Migration Agents). This service provides decision-support for visa eligibility assessment, risk analysis, and evidence gap identification for Australian visa subclasses 189 and 190.

## ⚠️ Important Disclaimers

- **Decision-support only**: This service does NOT provide migrant-facing advice, guarantee outcomes, or make legal decisions
- **Professional use only**: Intended for use by Registered Migration Agents (RMAs) only
- **No legal advice**: All outputs require professional review and sign-off by qualified RMAs
- **Scope limitation**: V1 supports only visa subclasses 189 and 190

## Features

### Core Functionality
- **Deterministic Eligibility Assessment**: Rules-based evaluation for visa subclasses 189 and 190
- **Risk Engine**: 25+ risk triggers with evidence mapping and mitigation strategies
- **Evidence Gap Analysis**: Prioritized checklist generation for missing documentation
- **Professional Reports**: HTML and PDF report generation with RMA sign-off capability
- **Multi-tenant Architecture**: Support for multiple migration agencies with API key authentication
- **Audit Trail**: Complete audit logging for compliance and accountability

### Technical Features
- **RESTful API**: Clean, documented endpoints with OpenAPI/Swagger specification
- **Async Processing**: Queue-based PDF generation using BullMQ and Redis
- **Data Validation**: Comprehensive input validation and content filtering
- **Security**: API key authentication, content sanitization, and banned phrase detection

## Tech Stack

- **Runtime**: Node.js 18+ with TypeScript
- **Web Framework**: Fastify
- **Database**: PostgreSQL with migrations
- **Queue**: BullMQ with Redis
- **PDF Generation**: Playwright (Chromium)
- **Testing**: Jest
- **Documentation**: OpenAPI/Swagger

## Quick Start

### Prerequisites

- Node.js 18+
- PostgreSQL 12+
- Redis 6+

### Installation

1. **Clone and install dependencies**:
```bash
git clone <repository-url>
cd casewise-assess
npm install
```

2. **Set up environment**:
```bash
cp .env.example .env
# Edit .env with your database and Redis configuration
```

3. **Set up database**:
```bash
# Create database
createdb casewise_assess

# Run migrations
npm run build
npm run migrate

# Seed with example data
npm run seed
```

4. **Start the service**:
```bash
# Development mode
npm run dev

# Production mode
npm run build
npm start
```

The service will be available at `http://localhost:3000` with API documentation at `http://localhost:3000/docs`.

## API Endpoints

### Assessments

- `POST /v1/assessments` - Create new assessment
- `GET /v1/assessments/:id` - Get assessment details
- `GET /v1/assessments/:id/report.html` - Get HTML report
- `GET /v1/assessments/:id/report.pdf` - Get PDF report
- `POST /v1/assessments/:id/signoff` - Add RMA sign-off

### Policy Management

- `GET /v1/policy-snapshots` - List policy snapshots
- `POST /v1/policy-snapshots` - Create policy snapshot (admin)
- `GET /v1/policy-snapshots/:id` - Get policy snapshot details

### Health Check

- `GET /health` - Service health status

## Authentication

All API endpoints require authentication via API key in the `X-API-Key` header:

```bash
curl -H "X-API-Key: your-api-key" http://localhost:3000/v1/assessments
```

## Example Usage

### 1. Create Assessment

```bash
curl -X POST http://localhost:3000/v1/assessments \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-api-key-12345" \
  -d '{
    "profile_data": {
      "personal": {
        "age": 32,
        "country_of_birth": "India",
        "citizenship": "Indian",
        "marital_status": "married",
        "dependents": 1
      },
      "education": [{
        "level": "Bachelor Degree",
        "country": "India",
        "australian_equivalent": true,
        "years": 4
      }],
      "employment": [{
        "occupation_code": "261313",
        "years_experience": 8,
        "country": "Australia",
        "skilled_employment": true
      }],
      "english": {
        "test_type": "IELTS",
        "listening": 7.0,
        "reading": 7.0,
        "writing": 6.5,
        "speaking": 7.0,
        "overall": 7.0,
        "test_date": "2024-06-15"
      },
      "skills_assessment": {
        "assessing_authority": "ACS",
        "occupation_code": "261313",
        "outcome": "positive",
        "valid_until": "2026-06-15"
      },
      "points_test": {
        "age_points": 25,
        "english_points": 10,
        "education_points": 15,
        "employment_points": 15,
        "australian_study_points": 0,
        "community_language_points": 0,
        "partner_points": 5,
        "regional_study_points": 0,
        "total_points": 70
      },
      "health_character": {
        "health_examination_completed": true,
        "character_requirements_met": true,
        "police_certificates_obtained": true
      }
    },
    "policy_snapshot_id": "policy-snapshot-uuid"
  }'
```

### 2. Get Assessment Results

```bash
curl -H "X-API-Key: test-api-key-12345" \
  http://localhost:3000/v1/assessments/{assessment-id}
```

### 3. Generate Report

```bash
# HTML Report
curl -H "X-API-Key: test-api-key-12345" \
  http://localhost:3000/v1/assessments/{assessment-id}/report.html

# PDF Report (after processing)
curl -H "X-API-Key: test-api-key-12345" \
  http://localhost:3000/v1/assessments/{assessment-id}/report.pdf
```

### 4. Add RMA Sign-off

```bash
curl -X POST http://localhost:3000/v1/assessments/{assessment-id}/signoff \
  -H "Content-Type: application/json" \
  -H "X-API-Key: test-api-key-12345" \
  -d '{
    "reviewer_name": "John Smith",
    "mara_number": "1234567",
    "comments": "Assessment reviewed and approved for client presentation."
  }'
```

## Database Schema

The service uses PostgreSQL with the following main tables:

- `tenants` - Multi-tenant organization data
- `api_keys` - API authentication keys
- `policy_snapshots` - Versioned policy configurations
- `rulesets` - Visa-specific eligibility rules
- `applicant_profiles` - Versioned applicant data
- `assessments` - Assessment records
- `assessment_results` - Eligibility and risk analysis results
- `reports` - Generated HTML/PDF reports
- `signoffs` - RMA professional sign-offs
- `audit_events` - Complete audit trail

## Testing

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch

# Run specific test file
npm test -- eligibility-engine.test.ts
```

## Development

### Project Structure

```
src/
├── api/           # API route handlers
├── database/      # Database configuration and migrations
├── domain/        # Domain types and interfaces
├── services/      # Business logic services
├── templates/     # HTML report templates
├── utils/         # Utility functions and validation
└── __tests__/     # Unit tests
```

### Key Services

- **EligibilityEngine**: Deterministic visa eligibility evaluation
- **RiskEngine**: Risk factor identification and assessment
- **EvidenceGapEngine**: Missing documentation analysis
- **ReportGenerator**: HTML and PDF report creation
- **AssessmentService**: Main orchestration service

## Security & Compliance

### Content Validation
The service includes comprehensive content validation to ensure compliance:

- **Banned Phrases**: Automatic detection of advice language ("you should apply", "will be approved", etc.)
- **Scope Enforcement**: Blocks references to unsupported visa subclasses (491, 482)
- **Input Sanitization**: Comprehensive data validation and sanitization

### Audit Trail
All operations are logged for compliance:
- Assessment creation and completion
- Report generation
- RMA sign-offs
- Policy changes

## Production Deployment

### Environment Variables

Required environment variables for production:

```bash
NODE_ENV=production
DB_HOST=your-db-host
DB_USER=your-db-user
DB_PASSWORD=your-db-password
REDIS_HOST=your-redis-host
PORT=3000
```

### Docker Deployment

```dockerfile
FROM node:18-alpine
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production
COPY dist ./dist
EXPOSE 3000
CMD ["node", "dist/server.js"]
```

### Health Monitoring

The service provides a health check endpoint at `/health` for load balancer and monitoring integration.

## License

This software is proprietary and confidential. Unauthorized distribution is prohibited.

## Support

For technical support or questions about this service, please contact the development team.