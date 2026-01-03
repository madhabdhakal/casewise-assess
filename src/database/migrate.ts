import { query } from './config';

const migrations = [
  `
  CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
  
  CREATE TABLE tenants (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    name VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE api_keys (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    key_hash VARCHAR(255) NOT NULL,
    name VARCHAR(255) NOT NULL,
    active BOOLEAN DEFAULT true,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE policy_snapshots (
    id VARCHAR(50) PRIMARY KEY,
    effective_date DATE NOT NULL,
    references JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE rulesets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    policy_snapshot_id VARCHAR(50) NOT NULL REFERENCES policy_snapshots(id),
    visa_subclass VARCHAR(10) NOT NULL,
    rules_json JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(policy_snapshot_id, visa_subclass)
  );
  `,
  `
  CREATE TABLE applicant_profiles (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    profile_version INTEGER DEFAULT 1,
    collected_at TIMESTAMP NOT NULL,
    data JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    profile_id UUID NOT NULL REFERENCES applicant_profiles(id),
    policy_snapshot_id UUID NOT NULL REFERENCES policy_snapshots(id),
    status VARCHAR(20) DEFAULT 'pending',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMP
  );
  `,
  `
  CREATE TABLE assessment_results (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id),
    visa_subclass VARCHAR(10) NOT NULL,
    eligible BOOLEAN NOT NULL,
    points_score INTEGER,
    requirements_met JSONB NOT NULL,
    risk_triggers JSONB NOT NULL,
    evidence_gaps JSONB NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE reports (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id),
    html_content TEXT NOT NULL,
    pdf_path VARCHAR(500),
    generated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE signoffs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id),
    reviewer_name VARCHAR(255) NOT NULL,
    mara_number VARCHAR(20) NOT NULL,
    comments TEXT,
    signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE TABLE assessment_audit_logs (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    assessment_id UUID NOT NULL REFERENCES assessments(id),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    profile_checksum VARCHAR(64) NOT NULL,
    policy_snapshot_id VARCHAR(50) NOT NULL,
    ruleset_versions JSONB NOT NULL,
    eligibility_outputs JSONB NOT NULL,
    risk_outputs JSONB NOT NULL,
    evidence_gaps JSONB NOT NULL,
    report_html_path VARCHAR(500),
    report_pdf_path VARCHAR(500),
    reviewer_signoff JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  );
  `,
  `
  CREATE INDEX idx_api_keys_tenant ON api_keys(tenant_id);
  CREATE INDEX idx_api_keys_hash ON api_keys(key_hash);
  CREATE INDEX idx_assessments_tenant ON assessments(tenant_id);
  CREATE INDEX idx_assessments_profile ON assessments(profile_id);
  CREATE INDEX idx_assessment_results_assessment ON assessment_results(assessment_id);
  CREATE INDEX idx_reports_assessment ON reports(assessment_id);
  CREATE INDEX idx_assessment_audit_logs_assessment ON assessment_audit_logs(assessment_id);
  CREATE INDEX idx_assessment_audit_logs_tenant ON assessment_audit_logs(tenant_id);
  CREATE INDEX idx_assessment_audit_logs_checksum ON assessment_audit_logs(profile_checksum);
  `
];

export async function migrate() {
  console.log('Running database migrations...');
  
  for (let i = 0; i < migrations.length; i++) {
    try {
      await query(migrations[i]);
      console.log(`Migration ${i + 1} completed`);
    } catch (error) {
      console.error(`Migration ${i + 1} failed:`, error);
      throw error;
    }
  }
  
  console.log('All migrations completed successfully');
}

if (require.main === module) {
  migrate().catch(console.error);
}