export interface PolicySnapshot {
  id: string;
  effective_date: Date;
  references: Array<{
    type: 'regulation' | 'policy';
    label: string;
    ref: string;
  }>;
}

export interface RulesetJson {
  visa: string;
  version: string;
  criteria: Array<{
    code: string;
    description: string;
    severity: 'hard' | 'soft';
    evaluate: string;
    params: Record<string, any>;
  }>;
  policy_references: Array<{
    type: 'regulation' | 'policy';
    label: string;
    ref: string;
  }>;
}

export class PolicyManager {
  
  static createSnapshot(id: string, effectiveDate: Date): PolicySnapshot {
    return {
      id,
      effective_date: effectiveDate,
      references: [
        { type: 'regulation', label: 'Migration Regulations 1994', ref: 'Schedule 2' },
        { type: 'regulation', label: 'Points Test', ref: 'Schedule 6D' }
      ]
    };
  }
  
  static create189Ruleset(version: string): RulesetJson {
    return {
      visa: '189',
      version,
      criteria: [
        {
          code: 'AGE_RANGE',
          description: 'Applicant must be under 45 years of age',
          severity: 'hard',
          evaluate: 'age_between',
          params: { min: 18, max: 45 }
        },
        {
          code: 'SKILLS_ASSESSMENT_VALID',
          description: 'Must hold valid positive skills assessment',
          severity: 'hard',
          evaluate: 'skills_assessment_valid',
          params: {}
        },
        {
          code: 'ENGLISH_MINIMUM',
          description: 'Must demonstrate Competent English',
          severity: 'hard',
          evaluate: 'english_minimum',
          params: { level: 'competent' }
        },
        {
          code: 'POINTS_MINIMUM',
          description: 'Must score at least 65 points',
          severity: 'hard',
          evaluate: 'points_minimum',
          params: { minimum: 65 }
        }
      ],
      policy_references: [
        { type: 'regulation', label: 'Subclass 189', ref: 'Schedule 2, Part 189' }
      ]
    };
  }
  
  static create190Ruleset(version: string): RulesetJson {
    return {
      visa: '190',
      version,
      criteria: [
        {
          code: 'AGE_RANGE',
          description: 'Applicant must be under 45 years of age',
          severity: 'hard',
          evaluate: 'age_between',
          params: { min: 18, max: 45 }
        },
        {
          code: 'SKILLS_ASSESSMENT_VALID',
          description: 'Must hold valid positive skills assessment',
          severity: 'hard',
          evaluate: 'skills_assessment_valid',
          params: {}
        },
        {
          code: 'ENGLISH_MINIMUM',
          description: 'Must demonstrate Competent English',
          severity: 'hard',
          evaluate: 'english_minimum',
          params: { level: 'competent' }
        },
        {
          code: 'POINTS_MINIMUM',
          description: 'Must score at least 60 points (including nomination)',
          severity: 'hard',
          evaluate: 'points_minimum',
          params: { minimum: 60 }
        }
      ],
      policy_references: [
        { type: 'regulation', label: 'Subclass 190', ref: 'Schedule 2, Part 190' }
      ]
    };
  }
}