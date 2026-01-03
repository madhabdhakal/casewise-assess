# CaseWise Assess - Project Structure

## Folder Layout

```
casewise-assess/
├── src/
│   ├── domain/                    # Domain modules
│   │   ├── eligibility/
│   │   │   └── evaluator.ts      # Eligibility evaluation logic
│   │   ├── risk/
│   │   │   └── analyzer.ts       # Risk assessment logic
│   │   ├── evidence/
│   │   │   └── analyzer.ts       # Evidence gap analysis
│   │   ├── report/
│   │   │   └── generator.ts      # Report generation
│   │   ├── policy/
│   │   │   └── manager.ts        # Policy and ruleset management
│   │   ├── audit/
│   │   │   └── tracker.ts        # Audit logging
│   │   └── types.ts              # Domain type definitions
│   ├── api/
│   │   └── assessments.ts        # REST API endpoints
│   ├── services/
│   │   ├── assessment-service.ts # Main orchestration service
│   │   └── queue.ts              # BullMQ job processing
│   ├── database/
│   │   ├── config.ts             # PostgreSQL configuration
│   │   ├── migrate.ts            # Database migrations
│   │   └── seed.ts               # Sample data seeding
│   ├── utils/
│   │   ├── auth.ts               # API key authentication
│   │   └── guardrails.ts         # Content validation
│   ├── templates/
│   │   └── report.hbs            # Handlebars report template
│   ├── __tests__/
│   │   └── domain.test.ts        # Unit tests
│   └── server.ts                 # Fastify server setup
├── examples/
│   └── api-examples.md           # Sample requests/responses
├── openapi.yaml                  # OpenAPI specification
├── package.json                  # Dependencies and scripts
├── tsconfig.json                 # TypeScript configuration
├── jest.config.js                # Jest test configuration
└── README.md                     # Project documentation
```

## Key Components

### Domain Modules
- **Eligibility**: Deterministic rule evaluation for visas 189/190
- **Risk**: 25+ risk triggers with evidence mapping
- **Evidence**: Gap analysis and prioritized checklists
- **Report**: HTML/PDF generation with guardrails
- **Policy**: Ruleset management and versioning
- **Audit**: Comprehensive logging and tracking

### Database Schema
- Multi-tenant architecture with API key authentication
- Versioned policy snapshots and rulesets
- Complete audit trail for compliance
- Secure report artifact storage

### API Features
- RESTful endpoints with OpenAPI documentation
- Tenant-authorized access to reports
- Async PDF generation via BullMQ
- Content validation and guardrails
- Comprehensive error handling

### Security & Compliance
- Banned phrase detection
- Visa scope enforcement (189/190 only)
- Profile data checksums
- Complete audit logging
- Professional sign-off tracking

## Getting Started

1. **Install dependencies**: `npm install`
2. **Setup database**: `npm run migrate && npm run seed`
3. **Start services**: `npm run dev`
4. **View docs**: `http://localhost:3000/docs`
5. **Run tests**: `npm test`

## Sample Usage

Use API key: `test-api-key-12345`
Policy snapshot: `au-2026-01-01`

See `examples/api-examples.md` for complete request/response examples.