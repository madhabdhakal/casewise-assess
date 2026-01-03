import { RiskEngine } from '../services/risk-engine';
import { ApplicantProfile } from '../domain/types';

describe('RiskEngine', () => {
  const baseProfile: ApplicantProfile = {
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

  describe('assessRisk', () => {
    it('should identify age risk for applicants close to limit', () => {
      const closeToAgeLimit = {
        ...baseProfile,
        data: {
          ...baseProfile.data,
          personal: {
            ...baseProfile.data.personal,
            age: 43
          }
        }
      };

      const result = RiskEngine.assessRisk(closeToAgeLimit);
      
      expect(result.triggers).toContainEqual(
        expect.objectContaining({
          code: 'AGE_CLOSE_TO_LIMIT',
          level: 'medium',
          title: 'Age Close to Eligibility Limit'
        })
      );
    });

    it('should identify English score risk for scores near minimum', () => {
      const lowEnglishProfile = {
        ...baseProfile,
        data: {
          ...baseProfile.data,
          english: {
            ...baseProfile.data.english,
            writing: 6.0,
            speaking: 6.0
          }
        }
      };

      const result = RiskEngine.assessRisk(lowEnglishProfile);
      
      expect(result.triggers).toContainEqual(
        expect.objectContaining({
          code: 'LOW_ENGLISH_SCORES',
          level: 'medium',
          title: 'English Scores Near Minimum'
        })
      );
    });

    it('should identify skills assessment expiry risk', () => {
      const expiringSkillsProfile = {
        ...baseProfile,
        data: {
          ...baseProfile.data,
          skills_assessment: {
            ...baseProfile.data.skills_assessment,
            valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days from now
          }
        }
      };

      const result = RiskEngine.assessRisk(expiringSkillsProfile);
      
      expect(result.triggers).toContainEqual(
        expect.objectContaining({
          code: 'SKILLS_ASSESSMENT_EXPIRY',
          level: 'high',
          title: 'Skills Assessment Near Expiry'
        })
      );
    });

    it('should identify insufficient points risk', () => {
      const lowPointsProfile = {
        ...baseProfile,
        data: {
          ...baseProfile.data,
          points_test: {
            ...baseProfile.data.points_test,
            total_points: 65
          }
        }
      };

      const result = RiskEngine.assessRisk(lowPointsProfile);
      
      expect(result.triggers).toContainEqual(
        expect.objectContaining({
          code: 'INSUFFICIENT_POINTS',
          level: 'critical',
          title: 'Points Score Below Competitive Range'
        })
      );
    });

    it('should identify health examination risk', () => {
      const noHealthExamProfile = {
        ...baseProfile,
        data: {
          ...baseProfile.data,
          health_character: {
            ...baseProfile.data.health_character,
            health_examination_completed: false
          }
        }
      };

      const result = RiskEngine.assessRisk(noHealthExamProfile);
      
      expect(result.triggers).toContainEqual(
        expect.objectContaining({
          code: 'HEALTH_CONDITIONS',
          level: 'high',
          title: 'Potential Health Concerns'
        })
      );
    });

    it('should identify character requirements risk', () => {
      const characterIssuesProfile = {
        ...baseProfile,
        data: {
          ...baseProfile.data,
          health_character: {
            ...baseProfile.data.health_character,
            character_requirements_met: false
          }
        }
      };

      const result = RiskEngine.assessRisk(characterIssuesProfile);
      
      expect(result.triggers).toContainEqual(
        expect.objectContaining({
          code: 'CHARACTER_ISSUES',
          level: 'high',
          title: 'Character Assessment Required'
        })
      );
    });

    it('should identify document translation risk for non-English speaking countries', () => {
      const nonEnglishCountryProfile = {
        ...baseProfile,
        data: {
          ...baseProfile.data,
          personal: {
            ...baseProfile.data.personal,
            country_of_birth: 'Germany'
          }
        }
      };

      const result = RiskEngine.assessRisk(nonEnglishCountryProfile);
      
      expect(result.triggers).toContainEqual(
        expect.objectContaining({
          code: 'DOCUMENT_TRANSLATIONS',
          level: 'medium',
          title: 'Document Translation Requirements'
        })
      );
    });

    it('should calculate overall risk level correctly', () => {
      const highRiskProfile = {
        ...baseProfile,
        data: {
          ...baseProfile.data,
          personal: {
            ...baseProfile.data.personal,
            age: 44
          },
          points_test: {
            ...baseProfile.data.points_test,
            total_points: 65
          },
          health_character: {
            ...baseProfile.data.health_character,
            health_examination_completed: false
          }
        }
      };

      const result = RiskEngine.assessRisk(highRiskProfile);
      
      expect(result.overall_risk).toBe('critical');
      expect(result.recommendations).toContain('Address identified risk factors before lodging application');
    });

    it('should return low risk for compliant profile', () => {
      const result = RiskEngine.assessRisk(baseProfile);
      
      // Should have minimal triggers for a compliant profile
      expect(result.overall_risk).toBe('low');
      expect(result.recommendations).toContain('Application appears to meet standard requirements');
    });

    it('should provide appropriate recommendations based on risk level', () => {
      const mediumRiskProfile = {
        ...baseProfile,
        data: {
          ...baseProfile.data,
          personal: {
            ...baseProfile.data.personal,
            age: 43
          }
        }
      };

      const result = RiskEngine.assessRisk(mediumRiskProfile);
      
      expect(result.recommendations).toContain('Address identified risk factors before lodging application');
      expect(result.recommendations).toContain('Ensure all supporting documentation is comprehensive and current');
    });
  });
});