import { RuleEvaluators } from '../services/rule-evaluators';
import { cloneProfile } from '../test-utils/fixtures';

describe('RuleEvaluators', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('validates age ranges correctly', () => {
    const withinRange = cloneProfile();
    const overAge = cloneProfile({
      data: {
        person: {
          date_of_birth: '1970-01-01'
        }
      }
    });

    expect(RuleEvaluators.age_between(withinRange, { min: 18, max: 45 })).toBe(true);
    expect(RuleEvaluators.age_between(overAge, { min: 18, max: 45 })).toBe(false);
  });

  it('checks skills assessment validity and expiry', () => {
    const validSkills = cloneProfile();
    const expiredSkills = cloneProfile({
      data: {
        occupation: {
          skills_assessment: {
            status: 'positive',
            expiry_date: '2024-01-01'
          }
        }
      }
    });

    expect(RuleEvaluators.skills_assessment_positive_and_not_expired(validSkills, {})).toBe(true);
    expect(RuleEvaluators.skills_assessment_positive_and_not_expired(expiredSkills, {})).toBe(false);
  });

  it('applies English thresholds by level', () => {
    const competentProfile = cloneProfile();
    const insufficientProfile = cloneProfile({
      data: {
        english: {
          listening: 5.5,
          reading: 5.5,
          writing: 5.5,
          speaking: 5.5,
          overall: 5.5
        }
      }
    });

    expect(RuleEvaluators.english_minimum(competentProfile, { level: 'competent' })).toBe(true);
    expect(RuleEvaluators.english_minimum(insufficientProfile, { level: 'competent' })).toBe(false);
  });

  it('checks claimed points thresholds', () => {
    const profile = cloneProfile();

    expect(RuleEvaluators.points_at_least(profile, { minimum: 65 })).toBe(true);
    expect(RuleEvaluators.points_at_least(profile, { minimum: 90 })).toBe(false);
  });
});
