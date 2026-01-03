import { ApplicantProfile, EligibilityResult, RiskAssessment } from '../domain/types';

export class EvidenceGapEngine {
  
  static generateEvidenceGaps(
    profile: ApplicantProfile, 
    eligibilityResult: EligibilityResult, 
    riskAssessment: RiskAssessment
  ): Array<{priority: 'High' | 'Medium' | 'Low', item: string, rationale: string}> {
    const gaps: Array<{priority: 'High' | 'Medium' | 'Low', item: string, rationale: string}> = [];
    
    // Map missing eligibility criteria to evidence gaps
    for (const missing of eligibilityResult.missing_criteria) {
      switch (missing) {
        case 'AGE_REQUIREMENT':
          gaps.push({
            priority: 'High',
            item: 'Birth certificate verification',
            rationale: 'Age eligibility must be verified with official documentation'
          });
          break;
        case 'SKILLS_ASSESSMENT':
          gaps.push({
            priority: 'High',
            item: 'Positive skills assessment',
            rationale: 'Skills assessment from relevant authority required for eligibility'
          });
          break;
        case 'ENGLISH_COMPETENT':
          gaps.push({
            priority: 'High',
            item: 'English test results meeting competent level',
            rationale: 'Minimum English requirement not met'
          });
          break;
        case 'POINTS_THRESHOLD':
          gaps.push({
            priority: 'High',
            item: 'Points optimization strategy',
            rationale: 'Current points below minimum threshold'
          });
          break;
        case 'STATE_NOMINATION':
          gaps.push({
            priority: 'High',
            item: 'State nomination application',
            rationale: 'State nomination required for subclass 190'
          });
          break;
      }
    }
    
    // Map risk factors to evidence gaps
    const riskCodes = riskAssessment.risk_factors.map(r => r.code);
    
    if (riskCodes.includes('EMPLOYMENT_EVIDENCE_WEAK')) {
      gaps.push({
        priority: 'High',
        item: 'Employment verification package',
        rationale: 'Strengthen employment claims with contracts, payslips, and detailed references'
      });
    }
    
    if (riskCodes.includes('CORE_DOCS_MISSING')) {
      gaps.push({
        priority: 'High',
        item: 'Core application documents',
        rationale: 'Essential documents (passport, skills assessment, English test) must be available'
      });
    }
    
    if (riskCodes.includes('DUTY_STATEMENTS_MISSING')) {
      gaps.push({
        priority: 'Medium',
        item: 'Employment reference letters with duty statements',
        rationale: 'Detailed duty statements required to demonstrate ANZSCO alignment'
      });
    }
    
    if (riskCodes.includes('SKILLS_ASSESSMENT_EXPIRING_SOON')) {
      gaps.push({
        priority: 'High',
        item: 'Skills assessment renewal',
        rationale: 'Current assessment expires soon, renewal required before application'
      });
    }
    
    if (riskCodes.includes('ENGLISH_TEST_OLD')) {
      gaps.push({
        priority: 'Medium',
        item: 'Updated English test results',
        rationale: 'Current test results approaching 3-year validity limit'
      });
    }
    
    if (riskCodes.includes('VISA_EXPIRY_SOON')) {
      gaps.push({
        priority: 'High',
        item: 'Urgent application lodgement',
        rationale: 'Current visa expires soon, immediate action required'
      });
    }
    
    if (riskCodes.includes('PRIOR_REFUSAL_FLAG')) {
      gaps.push({
        priority: 'High',
        item: 'Previous refusal response documentation',
        rationale: 'Must address reasons for previous refusal with comprehensive evidence'
      });
    }
    
    if (riskCodes.includes('STATE_NOMINATION_UNKNOWN')) {
      gaps.push({
        priority: 'High',
        item: 'State nomination eligibility confirmation',
        rationale: 'Verify occupation on state list and meet state-specific requirements'
      });
    }
    
    if (riskCodes.includes('FINANCIAL_EVIDENCE_GAP')) {
      gaps.push({
        priority: 'Medium',
        item: 'Financial capacity documentation',
        rationale: 'Bank statements and asset evidence may be required'
      });
    }
    
    // Map document gaps from profile
    const docGaps = this.getDocumentGaps(profile);
    gaps.push(...docGaps);
    
    // Remove duplicates and sort by priority
    const uniqueGaps = gaps.filter((gap, index, array) => 
      array.findIndex(g => g.item === gap.item) === index
    );
    
    return uniqueGaps.sort((a, b) => {
      const priorityOrder = { 'High': 3, 'Medium': 2, 'Low': 1 };
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    });
  }
  
  private static getDocumentGaps(profile: ApplicantProfile): Array<{priority: 'High' | 'Medium' | 'Low', item: string, rationale: string}> {
    const gaps: Array<{priority: 'High' | 'Medium' | 'Low', item: string, rationale: string}> = [];
    const docs = profile.data.documents;
    
    if (!docs.passport) {
      gaps.push({
        priority: 'High',
        item: 'Current passport',
        rationale: 'Valid passport required for identity verification'
      });
    }
    
    if (!docs.skills_assessment) {
      gaps.push({
        priority: 'High',
        item: 'Skills assessment documentation',
        rationale: 'Skills assessment letter and supporting documents required'
      });
    }
    
    if (!docs.english_test) {
      gaps.push({
        priority: 'High',
        item: 'English test results',
        rationale: 'Official English test results required for points claim'
      });
    }
    
    if (!docs.employment_reference_letters) {
      gaps.push({
        priority: 'High',
        item: 'Employment reference letters',
        rationale: 'Reference letters required to verify employment claims'
      });
    }
    
    if (!docs.employment_contracts) {
      gaps.push({
        priority: 'Medium',
        item: 'Employment contracts',
        rationale: 'Contracts strengthen employment verification'
      });
    }
    
    if (!docs.payslips) {
      gaps.push({
        priority: 'Medium',
        item: 'Payslips',
        rationale: 'Recent payslips support employment and salary claims'
      });
    }
    
    if (!docs.cv) {
      gaps.push({
        priority: 'Low',
        item: 'Current CV/Resume',
        rationale: 'Updated CV provides employment history overview'
      });
    }
    
    if (!docs.bank_statements) {
      gaps.push({
        priority: 'Low',
        item: 'Bank statements',
        rationale: 'Financial evidence may be requested by Department'
      });
    }
    
    return gaps;
  }
}