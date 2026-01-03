import { EligibilityEngine } from '../services/eligibility-engine';
import { Ruleset } from '../domain/types';
import { cloneProfile } from '../test-utils/fixtures';

const ruleset189: Ruleset = {
  id: 'ruleset-189',
  policy_snapshot_id: 'au-2026-01-01',
  visa_subclass: '189',
  created_at: new Date('2025-01-01T00:00:00.000Z'),
  rules_json: {
    visa: '189',
    version: '1.0',
    criteria: [
      {
        code: 'AGE_RANGE',
        description: 'Age between 18 and 44',
        severity: 'hard',
        evaluate: 'age_between',
        params: { min: 18, max: 45 }
      },
      {
        code: 'SKILLS_ASSESSMENT_VALID',
        description: 'Positive skills assessment in effect',
        severity: 'hard',
        evaluate: 'skills_assessment_positive_and_not_expired',
        params: {}
      },
      {
        code: 'ENGLISH_MINIMUM',
        description: 'At least competent English',
        severity: 'hard',
        evaluate: 'english_minimum',
        params: { level: 'competent' }
      },
      {
        code: 'POINTS_MINIMUM',
        description: 'Minimum 65 points claimed',
        severity: 'hard',
        evaluate: 'points_at_least',
        params: { minimum: 65 }
      }
    ],
    policy_references: []
  }
};

const ruleset190: Ruleset = {
  ...ruleset189,
  id: 'ruleset-190',
  visa_subclass: '190',
  rules_json: {
    ...ruleset189.rules_json,
    visa: '190',
    criteria: [
      ...ruleset189.rules_json.criteria,
      {
        code: 'STATE_INTEREST_CONFIRMED',
        description: 'State nomination interest confirmed',
        severity: 'soft',
        evaluate: 'english_minimum',
        params: { level: 'superior' }
      }
    ]
  }
};

describe('EligibilityEngine', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('marks applicants eligible when all hard criteria pass', () => {
    const profile = cloneProfile();

    const result = EligibilityEngine.evaluate(profile, ruleset189);

    expect(result.eligibility_status).toBe('Eligible');
    expect(result.missing_criteria).toHaveLength(0);
    expect(result.eligibility_reasons).toHaveLength(0);
    expect(result.points_score).toBe(profile.data.points_claim.total_points_claimed);
  });

  it('marks applicants not eligible when a hard criterion fails', () => {
    const overAgeProfile = cloneProfile({
      data: {
        person: {
          date_of_birth: '1970-01-01'
        }
      }
    });

    const result = EligibilityEngine.evaluate(overAgeProfile, ruleset189);

    expect(result.eligibility_status).toBe('NotEligible');
    expect(result.missing_criteria).toContain('AGE_RANGE');
    expect(result.eligibility_reasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'AGE_RANGE', severity: 'hard' })
      ])
    );
  });

  it('returns borderline when only soft criteria fail', () => {
    const profile = cloneProfile();

    const result = EligibilityEngine.evaluate(profile, ruleset190);

    expect(result.eligibility_status).toBe('Borderline');
    expect(result.missing_criteria).toHaveLength(0);
    expect(result.eligibility_reasons).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'STATE_INTEREST_CONFIRMED', severity: 'soft' })
      ])
    );
  });
});
