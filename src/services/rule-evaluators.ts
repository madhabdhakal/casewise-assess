import { ApplicantProfile } from '../domain/types';

export class RuleEvaluators {
  
  static age_between(profile: ApplicantProfile, params: { min: number; max: number }): boolean {
    const age = RuleEvaluators.calculateAge(profile.data.person.date_of_birth);
    return age >= params.min && age < params.max;
  }
  
  static skills_assessment_positive_and_not_expired(profile: ApplicantProfile, params: {}): boolean {
    const sa = profile.data.occupation.skills_assessment;
    if (sa.status !== 'positive') return false;
    
    const expiryDate = new Date(sa.expiry_date);
    const now = new Date();
    return expiryDate > now;
  }
  
  static english_minimum(profile: ApplicantProfile, params: { level: string }): boolean {
    const english = profile.data.english;
    if (english.test_type === 'NA') return false;
    
    const thresholds = {
      'competent': { IELTS: 6.0, PTE: 50, TOEFL: 60 },
      'proficient': { IELTS: 7.0, PTE: 65, TOEFL: 79 },
      'superior': { IELTS: 8.0, PTE: 79, TOEFL: 94 }
    };
    
    const threshold = thresholds[params.level as keyof typeof thresholds]?.[english.test_type as keyof typeof thresholds['competent']];
    if (!threshold) return false;
    
    return english.listening >= threshold && 
           english.reading >= threshold && 
           english.writing >= threshold && 
           english.speaking >= threshold;
  }
  
  static points_at_least(profile: ApplicantProfile, params: { minimum: number }): boolean {
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