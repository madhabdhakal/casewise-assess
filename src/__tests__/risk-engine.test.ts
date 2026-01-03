import { RiskEngine } from '../services/risk-engine';
import { cloneProfile } from '../test-utils/fixtures';

describe('RiskEngine', () => {
  beforeAll(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date('2025-01-01T00:00:00.000Z'));
  });

  afterAll(() => {
    jest.useRealTimers();
  });

  it('flags applicants nearing the age threshold', () => {
    const profile = cloneProfile({
      data: {
        person: {
          date_of_birth: '1981-02-01'
        }
      }
    });

    const result = RiskEngine.assessRisk(profile);

    expect(result.risk_factors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'AGE_NEAR_THRESHOLD', level: 'Medium' })
      ])
    );
  });

  it('detects skills assessments expiring within six months', () => {
    const profile = cloneProfile({
      data: {
        occupation: {
          skills_assessment: {
            expiry_date: '2025-04-01'
          }
        }
      }
    });

    const result = RiskEngine.assessRisk(profile);

    expect(result.risk_factors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'SKILLS_ASSESSMENT_EXPIRING_SOON', level: 'Medium' })
      ])
    );
  });

  it('elevates overall risk when high-severity triggers exist', () => {
    const profile = cloneProfile({
      data: {
        visa_history: {
          previous_cancellations: true
        }
      }
    });

    const result = RiskEngine.assessRisk(profile);

    expect(result.risk_level).toBe('High');
    expect(result.risk_factors).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ code: 'PRIOR_CANCELLATION_FLAG', level: 'High' })
      ])
    );
  });

  it('captures evidence gaps mapped from key risk factors', () => {
    const profile = cloneProfile({
      data: {
        documents: {
          passport: false,
          english_test: false,
          skills_assessment: false
        },
        employment: [
          {
            employer: 'ACME',
            country: 'AUS',
            start_date: '2020-01-01',
            end_date: '2021-01-01',
            hours_per_week: 38,
            employment_type: 'full_time',
            role_title: 'Developer',
            duties_alignment: 'high',
            evidence_strength: 'weak'
          }
        ]
      }
    });

    const result = RiskEngine.assessRisk(profile);

    expect(result.evidence_gaps).toEqual(
      expect.arrayContaining([
        expect.objectContaining({ item: 'Core application documents', priority: 'High' }),
        expect.objectContaining({ item: 'Employment verification documents', priority: 'High' })
      ])
    );
  });
});
