import { ApplicantProfile, RiskAssessment } from '../domain/types';

export class RiskEngine {
  
  static assessRisk(profile: ApplicantProfile): RiskAssessment {
    const riskFactors: Array<{code: string, level: string, detail: string}> = [];
    const mitigatingFactors: string[] = [];
    const evidenceGaps: Array<{priority: 'High' | 'Medium' | 'Low', item: string, rationale: string}> = [];
    
    const points = profile.data.points_claim.total_points_claimed;
    const age = this.calculateAge(profile.data.person.date_of_birth);
    
    // POINTS_MARGIN_LOW (Medium)
    if (points < 70) {
      riskFactors.push({
        code: 'POINTS_MARGIN_LOW',
        level: 'Medium',
        detail: `Points score of ${points} provides minimal margin above minimum thresholds`
      });
    }
    
    // POINTS_BELOW_RECENT_TRENDS (High) - policy flag
    if (points < 75) {
      riskFactors.push({
        code: 'POINTS_BELOW_RECENT_TRENDS',
        level: 'High',
        detail: 'Points score below recent invitation trends for competitive selection'
      });
    }
    
    // AGE_NEAR_THRESHOLD (Medium)
    if (age >= 43) {
      riskFactors.push({
        code: 'AGE_NEAR_THRESHOLD',
        level: 'Medium',
        detail: `Age ${age} approaching 45-year eligibility limit`
      });
    }
    
    // ANZSCO_MISMATCH_RISK (High)
    const hasLowAlignment = profile.data.employment.some(emp => 
      emp.duties_alignment === 'low' || emp.duties_alignment === 'unknown'
    );
    if (hasLowAlignment) {
      riskFactors.push({
        code: 'ANZSCO_MISMATCH_RISK',
        level: 'High',
        detail: 'Employment duties may not align with nominated ANZSCO code'
      });
    }
    
    // SKILLS_ASSESSMENT_EXPIRING_SOON (Medium)
    const saExpiry = new Date(profile.data.occupation.skills_assessment.expiry_date);
    const monthsToSAExpiry = this.getMonthsToDate(saExpiry);
    if (monthsToSAExpiry <= 6) {
      riskFactors.push({
        code: 'SKILLS_ASSESSMENT_EXPIRING_SOON',
        level: 'Medium',
        detail: `Skills assessment expires in ${monthsToSAExpiry} months`
      });
    }
    
    // SKILLS_ASSESSMENT_PENDING (High)
    if (profile.data.occupation.skills_assessment.status === 'pending') {
      riskFactors.push({
        code: 'SKILLS_ASSESSMENT_PENDING',
        level: 'High',
        detail: 'Skills assessment outcome still pending'
      });
    }
    
    // EMPLOYMENT_EVIDENCE_WEAK (High)
    const weakEvidence = profile.data.employment.filter(emp => 
      emp.evidence_strength === 'weak' || emp.evidence_strength === 'unknown'
    );
    if (weakEvidence.length > 0) {
      riskFactors.push({
        code: 'EMPLOYMENT_EVIDENCE_WEAK',
        level: 'High',
        detail: `${weakEvidence.length} employment periods have weak supporting evidence`
      });
    }
    
    // INCONSISTENT_EMPLOYMENT_HISTORY (Medium)
    const hasGaps = this.hasEmploymentGaps(profile.data.employment);
    if (hasGaps) {
      riskFactors.push({
        code: 'INCONSISTENT_EMPLOYMENT_HISTORY',
        level: 'Medium',
        detail: 'Employment history contains unexplained gaps or inconsistencies'
      });
    }
    
    // DUTY_STATEMENTS_MISSING (Medium)
    if (!profile.data.documents.employment_reference_letters) {
      riskFactors.push({
        code: 'DUTY_STATEMENTS_MISSING',
        level: 'Medium',
        detail: 'Employment reference letters with duty statements not confirmed'
      });
    }
    
    // ENGLISH_TEST_OLD (Medium)
    const testDate = new Date(profile.data.english.test_date);
    const testAgeMonths = this.getMonthsToDate(testDate, true);
    if (testAgeMonths >= 30) {
      riskFactors.push({
        code: 'ENGLISH_TEST_OLD',
        level: 'Medium',
        detail: `English test is ${Math.floor(testAgeMonths/12)} years old, approaching expiry`
      });
    }
    
    // ENGLISH_SCORE_BORDERLINE (Medium)
    if (this.isEnglishBorderline(profile.data.english)) {
      riskFactors.push({
        code: 'ENGLISH_SCORE_BORDERLINE',
        level: 'Medium',
        detail: 'English test scores are close to minimum requirements'
      });
    }
    
    // PRIOR_REFUSAL_FLAG (High)
    if (profile.data.visa_history.previous_refusals) {
      riskFactors.push({
        code: 'PRIOR_REFUSAL_FLAG',
        level: 'High',
        detail: 'Previous visa refusals on record require careful consideration'
      });
    }
    
    // PRIOR_CANCELLATION_FLAG (High)
    if (profile.data.visa_history.previous_cancellations) {
      riskFactors.push({
        code: 'PRIOR_CANCELLATION_FLAG',
        level: 'High',
        detail: 'Previous visa cancellations on record'
      });
    }
    
    // COMPLIANCE_ISSUES_FLAG (High)
    if (profile.data.visa_history.compliance_issues) {
      riskFactors.push({
        code: 'COMPLIANCE_ISSUES_FLAG',
        level: 'High',
        detail: 'Previous compliance issues noted in visa history'
      });
    }
    
    // OCCUPATION_VOLATILE (Medium) - policy flag
    const volatileOccupations = ['261313', '261312', '233211']; // Example codes
    if (volatileOccupations.includes(profile.data.occupation.anzsco_code)) {
      riskFactors.push({
        code: 'OCCUPATION_VOLATILE',
        level: 'Medium',
        detail: 'Nominated occupation subject to frequent policy changes'
      });
    }
    
    // STATE_POLICY_VOLATILE (Medium) - policy flag
    if (profile.data.state_nomination.seeking_nomination) {
      riskFactors.push({
        code: 'STATE_POLICY_VOLATILE',
        level: 'Medium',
        detail: 'State nomination policies subject to frequent changes'
      });
    }
    
    // OCCUPATION_CEILING_RISK (Medium) - policy flag
    riskFactors.push({
      code: 'OCCUPATION_CEILING_RISK',
      level: 'Medium',
      detail: 'Occupation may be subject to invitation ceiling limitations'
    });
    
    // STATE_NOMINATION_UNKNOWN (Medium)
    if (profile.data.state_nomination.seeking_nomination && 
        profile.data.state_nomination.occupation_list_status === 'unknown') {
      riskFactors.push({
        code: 'STATE_NOMINATION_UNKNOWN',
        level: 'Medium',
        detail: 'State nomination eligibility not confirmed'
      });
    }
    
    // STATE_NOMINATION_LOW_CERTAINTY (High) - policy flag
    if (profile.data.state_nomination.seeking_nomination && 
        profile.data.state_nomination.occupation_list_status === 'off_list') {
      riskFactors.push({
        code: 'STATE_NOMINATION_LOW_CERTAINTY',
        level: 'High',
        detail: 'Low certainty of obtaining state nomination'
      });
    }
    
    // REGIONAL_REQUIREMENTS_UNCLEAR (Medium)
    if (profile.data.points_claim.regional_study_points > 0) {
      riskFactors.push({
        code: 'REGIONAL_REQUIREMENTS_UNCLEAR',
        level: 'Medium',
        detail: 'Regional study requirements may need additional verification'
      });
    }
    
    // VISA_EXPIRY_SOON (High)
    const visaExpiry = new Date(profile.data.visa_history.visa_expiry_date);
    const monthsToVisaExpiry = this.getMonthsToDate(visaExpiry);
    if (monthsToVisaExpiry <= 3) {
      riskFactors.push({
        code: 'VISA_EXPIRY_SOON',
        level: 'High',
        detail: `Current visa expires in ${monthsToVisaExpiry} months`
      });
    }
    
    // STATUS_CHANGE_RISK (Medium)
    if (profile.data.visa_history.current_visa_subclass === '485' || 
        profile.data.visa_history.current_visa_subclass === '482') {
      riskFactors.push({
        code: 'STATUS_CHANGE_RISK',
        level: 'Medium',
        detail: 'Temporary visa holder requires status change consideration'
      });
    }
    
    // CORE_DOCS_MISSING (High)
    const coreDocsMissing = !profile.data.documents.passport || 
                           !profile.data.documents.skills_assessment || 
                           !profile.data.documents.english_test;
    if (coreDocsMissing) {
      riskFactors.push({
        code: 'CORE_DOCS_MISSING',
        level: 'High',
        detail: 'Core application documents not confirmed available'
      });
    }
    
    // FINANCIAL_EVIDENCE_GAP (Low/Medium)
    if (!profile.data.documents.bank_statements) {
      riskFactors.push({
        code: 'FINANCIAL_EVIDENCE_GAP',
        level: 'Medium',
        detail: 'Financial capacity evidence not confirmed'
      });
    }
    
    // LOW_AUDIT_DEFENSIBILITY (High)
    const auditRisks = weakEvidence.length + (hasGaps ? 1 : 0) + (coreDocsMissing ? 1 : 0);
    if (auditRisks >= 2) {
      riskFactors.push({
        code: 'LOW_AUDIT_DEFENSIBILITY',
        level: 'High',
        detail: 'Application may not withstand detailed departmental scrutiny'
      });
    }
    
    // Generate evidence gaps and mitigating factors
    this.generateEvidenceGaps(riskFactors, profile, evidenceGaps);
    this.generateMitigatingFactors(profile, mitigatingFactors);
    
    // Determine overall risk level using aggregation rules
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
    const lowCount = riskFactors.filter(r => r.level === 'Low').length;
    
    // High if any High-level triggers exist
    if (highCount > 0) return 'High';
    
    // Medium if >=2 Medium triggers OR 1 Medium + multiple Low triggers
    if (mediumCount >= 2 || (mediumCount >= 1 && lowCount >= 2)) return 'Medium';
    
    // Low otherwise
    return 'Low';
  }
  
  private static generateEvidenceGaps(
    riskFactors: Array<{code: string}>, 
    profile: ApplicantProfile, 
    evidenceGaps: Array<{priority: 'High' | 'Medium' | 'Low', item: string, rationale: string}>
  ) {
    // Map risk factors to evidence gaps
    const riskCodes = riskFactors.map(r => r.code);
    
    if (riskCodes.includes('EMPLOYMENT_EVIDENCE_WEAK')) {
      evidenceGaps.push({
        priority: 'High',
        item: 'Employment verification documents',
        rationale: 'Strengthen employment evidence with detailed references and contracts'
      });
    }
    
    if (riskCodes.includes('CORE_DOCS_MISSING')) {
      evidenceGaps.push({
        priority: 'High',
        item: 'Core application documents',
        rationale: 'Passport, skills assessment, and English test results required'
      });
    }
    
    if (riskCodes.includes('SKILLS_ASSESSMENT_EXPIRING_SOON')) {
      evidenceGaps.push({
        priority: 'High',
        item: 'Skills assessment renewal',
        rationale: 'Current assessment expires soon, renewal may be required'
      });
    }
  }
  
  private static generateMitigatingFactors(profile: ApplicantProfile, factors: string[]) {
    if (profile.data.occupation.skills_assessment.status === 'positive') {
      factors.push('Positive skills assessment held');
    }
    
    if (profile.data.english.overall >= 7.0) {
      factors.push('Strong English test results');
    }
    
    if (profile.data.points_claim.total_points_claimed >= 80) {
      factors.push('High points score provides competitive advantage');
    }
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
  
  private static getMonthsToDate(targetDate: Date, fromPast: boolean = false): number {
    const now = new Date();
    const diffTime = fromPast ? now.getTime() - targetDate.getTime() : targetDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24 * 30));
  }
  
  private static hasEmploymentGaps(employment: any[]): boolean {
    if (employment.length < 2) return false;
    
    const sortedEmployment = employment
      .filter(emp => emp.end_date)
      .sort((a, b) => new Date(a.start_date).getTime() - new Date(b.start_date).getTime());
    
    for (let i = 1; i < sortedEmployment.length; i++) {
      const prevEnd = new Date(sortedEmployment[i-1].end_date);
      const currentStart = new Date(sortedEmployment[i].start_date);
      const gapMonths = (currentStart.getTime() - prevEnd.getTime()) / (1000 * 60 * 60 * 24 * 30);
      
      if (gapMonths > 3) return true; // Gap > 3 months
    }
    
    return false;
  }
  
  private static isEnglishBorderline(english: any): boolean {
    const competentLevel = english.test_type === 'IELTS' ? 6.0 : 
                          english.test_type === 'PTE' ? 50 : 60;
    const threshold = 0.5;
    
    return english.listening <= competentLevel + threshold ||
           english.reading <= competentLevel + threshold ||
           english.writing <= competentLevel + threshold ||
           english.speaking <= competentLevel + threshold;
  }
}