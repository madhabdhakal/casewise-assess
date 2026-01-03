import { ApplicantProfile } from '../types';

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

export class RiskAnalyzer {
  
  static assess(profile: ApplicantProfile): RiskAssessment {
    const riskFactors: Array<{code: string, level: string, detail: string}> = [];
    const mitigatingFactors: string[] = [];
    const evidenceGaps: Array<{priority: 'High' | 'Medium' | 'Low', item: string, rationale: string}> = [];
    
    const points = profile.data.points_claim.total_points_claimed;
    const age = this.calculateAge(profile.data.person.date_of_birth);
    
    // Core risk triggers
    if (points < 70) {
      riskFactors.push({
        code: 'POINTS_MARGIN_LOW',
        level: 'Medium',
        detail: `Points score of ${points} provides minimal margin`
      });
    }
    
    if (age >= 43) {
      riskFactors.push({
        code: 'AGE_NEAR_THRESHOLD',
        level: 'Medium',
        detail: `Age ${age} approaching 45-year limit`
      });
    }
    
    if (profile.data.occupation.skills_assessment.status !== 'positive') {
      riskFactors.push({
        code: 'SKILLS_ASSESSMENT_PENDING',
        level: 'High',
        detail: 'Skills assessment not positive'
      });
    }
    
    if (profile.data.visa_history.previous_refusals) {
      riskFactors.push({
        code: 'PRIOR_REFUSAL_FLAG',
        level: 'High',
        detail: 'Previous visa refusals on record'
      });
    }
    
    if (!profile.data.documents.passport || !profile.data.documents.skills_assessment) {
      riskFactors.push({
        code: 'CORE_DOCS_MISSING',
        level: 'High',
        detail: 'Essential documents not confirmed'
      });
    }
    
    // Generate evidence gaps
    if (riskFactors.some(r => r.code === 'CORE_DOCS_MISSING')) {
      evidenceGaps.push({
        priority: 'High',
        item: 'Core application documents',
        rationale: 'Passport and skills assessment required'
      });
    }
    
    // Mitigating factors
    if (profile.data.occupation.skills_assessment.status === 'positive') {
      mitigatingFactors.push('Positive skills assessment held');
    }
    
    if (profile.data.english.overall >= 7.0) {
      mitigatingFactors.push('Strong English test results');
    }
    
    const riskLevel = this.aggregateRiskLevel(riskFactors);
    
    return {
      risk_level: riskLevel,
      risk_factors: riskFactors,
      mitigating_factors: mitigatingFactors,
      evidence_gaps: evidenceGaps
    };
  }
  
  private static aggregateRiskLevel(riskFactors: Array<{level: string}>): 'Low' | 'Medium' | 'High' {
    const highCount = riskFactors.filter(r => r.level === 'High').length;
    const mediumCount = riskFactors.filter(r => r.level === 'Medium').length;
    
    if (highCount > 0) return 'High';
    if (mediumCount >= 2) return 'Medium';
    return 'Low';
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