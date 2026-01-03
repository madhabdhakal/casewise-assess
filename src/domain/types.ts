export interface Tenant {
  id: string;
  name: string;
  active: boolean;
  created_at: Date;
}

export interface ApiKey {
  id: string;
  tenant_id: string;
  key_hash: string;
  name: string;
  active: boolean;
  created_at: Date;
}

export interface PolicySnapshot {
  id: string;
  effective_date: Date;
  references: Array<{
    type: 'regulation' | 'policy';
    label: string;
    ref: string;
  }>;
  created_at: Date;
}

export interface Ruleset {
  id: string;
  policy_snapshot_id: string;
  visa_subclass: string;
  rules_json: RulesetJson;
  created_at: Date;
}

export interface RulesetJson {
  visa: string;
  version: string;
  criteria: Array<{
    code: string;
    description: string;
    severity: 'hard' | 'soft';
    evaluate: 'age_between' | 'skills_assessment_positive_and_not_expired' | 'english_minimum' | 'points_at_least';
    params: Record<string, any>;
  }>;
  policy_references: Array<{
    type: 'regulation' | 'policy';
    label: string;
    ref: string;
  }>;
}

export interface ApplicantProfile {
  id: string;
  tenant_id: string;
  profile_version: number;
  collected_at: string;
  data: ApplicantProfileData;
  created_at: Date;
}

export interface ApplicantProfileData {
  person: {
    date_of_birth: string;
    nationality: string;
    marital_status: 'single' | 'married' | 'de_facto' | 'divorced' | 'widowed';
  };
  location: {
    current_country: string;
    current_state: string;
    regional_postcode: string;
  };
  visa_history: {
    current_visa_subclass: string;
    visa_expiry_date: string;
    previous_refusals: boolean;
    previous_cancellations: boolean;
    compliance_issues: boolean;
    notes: string;
  };
  occupation: {
    anzsco_code: string;
    occupation_title: string;
    skills_assessment: {
      status: 'positive' | 'pending' | 'not_held' | 'expired';
      assessing_authority: string;
      issue_date: string;
      expiry_date: string;
      notes: string;
    };
  };
  english: {
    test_type: 'IELTS' | 'PTE' | 'TOEFL' | 'OET' | 'Cambridge' | 'NA';
    overall: number;
    listening: number;
    reading: number;
    writing: number;
    speaking: number;
    test_date: string;
  };
  education: Array<{
    level: 'bachelor' | 'master' | 'phd' | 'diploma' | 'other';
    field: string;
    country: string;
    completed_date: string;
  }>;
  employment: Array<{
    employer: string;
    country: string;
    start_date: string;
    end_date: string | null;
    hours_per_week: number;
    employment_type: 'full_time' | 'part_time' | 'contract';
    role_title: string;
    duties_alignment: 'high' | 'medium' | 'low' | 'unknown';
    evidence_strength: 'strong' | 'medium' | 'weak' | 'unknown';
  }>;
  points_claim: {
    total_points_claimed: number;
    age_points: number;
    english_points: number;
    education_points: number;
    australian_experience_points: number;
    overseas_experience_points: number;
    partner_points: number;
    naati_points: number;
    professional_year_points: number;
    regional_study_points: number;
    state_nomination_points: number;
  };
  state_nomination: {
    seeking_nomination: boolean;
    state: string;
    occupation_list_status: 'unknown' | 'on_list' | 'off_list';
    notes: string;
  };
  documents: {
    passport: boolean;
    skills_assessment: boolean;
    english_test: boolean;
    employment_reference_letters: boolean;
    employment_contracts: boolean;
    payslips: boolean;
    bank_statements: boolean;
    cv: boolean;
  };
}

export interface Assessment {
  id: string;
  tenant_id: string;
  profile_id: string;
  policy_snapshot_id: string;
  status: 'pending' | 'completed' | 'failed';
  created_at: Date;
  completed_at?: Date;
}

export interface AssessmentResult {
  id: string;
  assessment_id: string;
  visa_subclass: string;
  eligible: boolean;
  points_score?: number;
  requirements_met: Record<string, boolean>;
  risk_triggers: RiskTrigger[];
  evidence_gaps: EvidenceGap[];
  created_at: Date;
}

export interface RiskTrigger {
  code: string;
  level: 'Low' | 'Medium' | 'High';
  title: string;
  description: string;
  mitigation_prompt: string;
  evidence_required: string[];
}

export interface EvidenceGap {
  priority: 'High' | 'Medium' | 'Low';
  item: string;
  rationale: string;
  category?: string;
  required_documents?: string[];
}

export interface Report {
  id: string;
  assessment_id: string;
  html_content: string;
  pdf_path?: string;
  generated_at: Date;
}

export interface Signoff {
  id: string;
  assessment_id: string;
  reviewer_name: string;
  mara_number: string;
  comments?: string;
  signed_at: Date;
}

export interface AuditEvent {
  id: string;
  tenant_id: string;
  event_type: string;
  entity_type: string;
  entity_id: string;
  user_id?: string;
  details: Record<string, any>;
  created_at: Date;
}

// Visa-specific types
export type VisaSubclass = '189' | '190';

export interface EligibilityResult {
  eligibility_status: 'Eligible' | 'Borderline' | 'NotEligible';
  eligibility_reasons: Array<{
    code: string;
    message: string;
    severity: 'hard' | 'soft';
  }>;
  missing_criteria: string[];
  points_score?: number;
}

export interface RiskAssessment {
  risk_level: 'Low' | 'Medium' | 'High';
  risk_factors: Array<{
    code: string;
    level: string;
    detail: string;
  }>;
  mitigating_factors: string[];
  evidence_gaps: Array<{
    priority: 'High' | 'Medium' | 'Low';
    item: string;
    rationale: string;
  }>;
}