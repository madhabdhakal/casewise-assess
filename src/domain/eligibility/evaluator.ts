import { ApplicantProfile, RulesetJson } from '../types';

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

export class EligibilityEvaluator {
  
  static evaluate(profile: ApplicantProfile, ruleset: RulesetJson): EligibilityResult {
    const reasons: Array<{code: string, message: string, severity: 'hard' | 'soft'}> = [];
    const missing: string[] = [];
    
    for (const criterion of ruleset.criteria) {
      const passed = this.evaluateCriterion(profile, criterion);
      
      if (!passed) {
        reasons.push({
          code: criterion.code,
          message: criterion.description,
          severity: criterion.severity
        });
        
        if (criterion.severity === 'hard') {
          missing.push(criterion.code);
        }
      }
    }
    
    const hardFailures = reasons.filter(r => r.severity === 'hard').length;
    const softFailures = reasons.filter(r => r.severity === 'soft').length;
    
    let status: 'Eligible' | 'Borderline' | 'NotEligible';
    if (hardFailures > 0) {
      status = 'NotEligible';
    } else if (softFailures > 0) {
      status = 'Borderline';
    } else {
      status = 'Eligible';
    }
    
    return {
      eligibility_status: status,
      eligibility_reasons: reasons,
      missing_criteria: missing,
      points_score: profile.data.points_claim.total_points_claimed
    };
  }
  
  private static evaluateCriterion(profile: ApplicantProfile, criterion: any): boolean {
    switch (criterion.evaluate) {
      case 'age_between':
        return this.ageInRange(profile, criterion.params);
      case 'skills_assessment_valid':
        return this.skillsAssessmentValid(profile);
      case 'english_minimum':
        return this.englishMinimum(profile, criterion.params);
      case 'points_minimum':
        return this.pointsMinimum(profile, criterion.params);
      default:
        return false;
    }
  }
  
  private static ageInRange(profile: ApplicantProfile, params: {min: number, max: number}): boolean {
    const age = this.calculateAge(profile.data.person.date_of_birth);
    return age >= params.min && age < params.max;
  }
  
  private static skillsAssessmentValid(profile: ApplicantProfile): boolean {
    const sa = profile.data.occupation.skills_assessment;
    return sa.status === 'positive' && new Date(sa.expiry_date) > new Date();
  }
  
  private static englishMinimum(profile: ApplicantProfile, params: {level: string}): boolean {
    const english = profile.data.english;
    if (english.test_type === 'NA') return false;
    
    const thresholds = {
      'competent': { IELTS: 6.0, PTE: 50 }
    };
    
    const threshold = thresholds[params.level]?.[english.test_type];
    if (!threshold) return false;
    
    return english.listening >= threshold && 
           english.reading >= threshold && 
           english.writing >= threshold && 
           english.speaking >= threshold;
  }
  
  private static pointsMinimum(profile: ApplicantProfile, params: {minimum: number}): boolean {
    return profile.data.points_claim.total_points_claimed >= params.minimum;
  }
  
  private static calculateAge(dateOfBirth: string): number {
    const today = new Date();
    const birthDate = new Date(dateOfBirth);
    let age = today.getFullYear() - birthDate.getFullYear();
    const monthDiff = today.getMonth() - birthDate.getMonth();
    
    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
      age--;
    }
    
    return age;
  }
}