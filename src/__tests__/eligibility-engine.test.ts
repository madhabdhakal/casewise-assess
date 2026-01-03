import { EligibilityEngine } from '../services/eligibility-engine';
import { ApplicantProfile, Ruleset } from '../domain/types';

describe('EligibilityEngine', () => {
  const mockProfile: ApplicantProfile = {
    id: 'test-profile',
    tenant_id: 'test-tenant',
    version: 1,
    data: {
      personal: {
        age: 32,
        country_of_birth: 'India',
        citizenship: 'Indian',
        marital_status: 'married',
        dependents: 1
      },
      education: [
        {
          level: 'Bachelor Degree',
          country: 'India',
          australian_equivalent: true,
          years: 4
        }
      ],
      employment: [
        {
          occupation_code: '261313',
          years_experience: 8,
          country: 'Australia',
          skilled_employment: true
        }
      ],
      english: {
        test_type: 'IELTS',
        listening: 7.0,
        reading: 7.0,
        writing: 6.5,
        speaking: 7.0,
        overall: 7.0,
        test_date: new Date('2024-06-15')
      },
      skills_assessment: {
        assessing_authority: 'ACS',
        occupation_code: '261313',
        outcome: 'positive',
        valid_until: new Date('2026-06-15')
      },
      points_test: {
        age_points: 25,
        english_points: 10,
        education_points: 15,
        employment_points: 15,
        australian_study_points: 0,
        community_language_points: 0,
        partner_points: 5,
        regional_study_points: 0,
        total_points: 70
      },
      health_character: {
        health_examination_completed: true,
        character_requirements_met: true,
        police_certificates_obtained: true
      }
    },
    created_at: new Date()
  };

  const mockRuleset189: Ruleset = {
    id: 'test-ruleset-189',
    policy_snapshot_id: 'test-policy',
    visa_subclass: '189',
    rules: {
      minimum_points: 65,
      age_limit: 45,
      english_requirement: 'competent'
    },
    created_at: new Date()
  };

  const mockRuleset190: Ruleset = {
    id: 'test-ruleset-190',
    policy_snapshot_id: 'test-policy',
    visa_subclass: '190',
    rules: {
      minimum_points: 60,
      age_limit: 45,
      english_requirement: 'competent'
    },
    created_at: new Date()
  };

  describe('evaluate189', () => {
    it('should return eligible for valid profile', () => {
      const result = EligibilityEngine.evaluate189(mockProfile, mockRuleset189);
      
      expect(result.eligible).toBe(true);
      expect(result.points_score).toBe(70);
      expect(result.minimum_points_required).toBe(65);
      expect(result.requirements_met.age).toBe(true);
      expect(result.requirements_met.english).toBe(true);
      expect(result.requirements_met.skills_assessment).toBe(true);
      expect(result.requirements_met.points_test).toBe(true);
    });

    it('should return not eligible for age over limit', () => {
      const overAgeProfile = {
        ...mockProfile,
        data: {
          ...mockProfile.data,
          personal: {
            ...mockProfile.data.personal,
            age: 46
          }
        }
      };

      const result = EligibilityEngine.evaluate189(overAgeProfile, mockRuleset189);
      
      expect(result.eligible).toBe(false);
      expect(result.requirements_met.age).toBe(false);
      expect(result.reasons).toContain('Applicant must be under 45 years of age');
    });

    it('should return not eligible for insufficient points', () => {
      const lowPointsProfile = {
        ...mockProfile,
        data: {
          ...mockProfile.data,
          points_test: {
            ...mockProfile.data.points_test,
            total_points: 60
          }
        }
      };

      const result = EligibilityEngine.evaluate189(lowPointsProfile, mockRuleset189);
      
      expect(result.eligible).toBe(false);
      expect(result.requirements_met.points_test).toBe(false);
      expect(result.reasons).toContain('Must score at least 65 points (current: 60)');
    });

    it('should return not eligible for negative skills assessment', () => {
      const negativeSkillsProfile = {
        ...mockProfile,
        data: {
          ...mockProfile.data,
          skills_assessment: {
            ...mockProfile.data.skills_assessment,
            outcome: 'negative' as const
          }
        }
      };

      const result = EligibilityEngine.evaluate189(negativeSkillsProfile, mockRuleset189);
      
      expect(result.eligible).toBe(false);
      expect(result.requirements_met.skills_assessment).toBe(false);
      expect(result.reasons).toContain('Must have positive skills assessment from relevant authority');
    });
  });

  describe('evaluate190', () => {
    it('should return eligible for valid profile with lower points threshold', () => {
      const lowerPointsProfile = {
        ...mockProfile,
        data: {
          ...mockProfile.data,
          points_test: {
            ...mockProfile.data.points_test,
            total_points: 62
          }
        }
      };

      const result = EligibilityEngine.evaluate190(lowerPointsProfile, mockRuleset190);
      
      expect(result.eligible).toBe(true);
      expect(result.points_score).toBe(62);
      expect(result.minimum_points_required).toBe(60);
      expect(result.requirements_met.state_nomination).toBe(true);
    });

    it('should return not eligible for points below 190 threshold', () => {
      const veryLowPointsProfile = {
        ...mockProfile,
        data: {
          ...mockProfile.data,
          points_test: {
            ...mockProfile.data.points_test,
            total_points: 55
          }
        }
      };

      const result = EligibilityEngine.evaluate190(veryLowPointsProfile, mockRuleset190);
      
      expect(result.eligible).toBe(false);
      expect(result.requirements_met.points_test).toBe(false);
      expect(result.reasons).toContain('Must score at least 60 points (current: 55)');
    });
  });

  describe('evaluate', () => {
    it('should route to correct evaluator based on visa subclass', () => {
      const result189 = EligibilityEngine.evaluate(mockProfile, mockRuleset189);
      const result190 = EligibilityEngine.evaluate(mockProfile, mockRuleset190);
      
      expect(result189.minimum_points_required).toBe(65);
      expect(result190.minimum_points_required).toBe(60);
    });

    it('should throw error for unsupported visa subclass', () => {
      const unsupportedRuleset = {
        ...mockRuleset189,
        visa_subclass: '491'
      };

      expect(() => {
        EligibilityEngine.evaluate(mockProfile, unsupportedRuleset);
      }).toThrow('Unsupported visa subclass: 491');
    });
  });
});