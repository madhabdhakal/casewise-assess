import { ApplicantProfile } from '../types';
import { EligibilityResult } from '../eligibility/evaluator';
import { RiskAssessment } from '../risk/analyzer';

export class EvidenceGapAnalyzer {
  
  static analyze(
    profile: ApplicantProfile,
    eligibilityResult: EligibilityResult,
    riskAssessment: RiskAssessment
  ): Array<{priority: 'High' | 'Medium' | 'Low', item: string, rationale: string}> {
    const gaps: Array<{priority: 'High' | 'Medium' | 'Low', item: string, rationale: string}> = [];
    
    // Map missing eligibility criteria
    for (const missing of eligibilityResult.missing_criteria) {
      switch (missing) {
        case 'AGE_RANGE':
          gaps.push({
            priority: 'High',
            item: 'Birth certificate verification',
            rationale: 'Age eligibility must be verified'
          });
          break;
        case 'SKILLS_ASSESSMENT_VALID':
          gaps.push({
            priority: 'High',
            item: 'Valid skills assessment',
            rationale: 'Positive skills assessment required'
          });
          break;
        case 'ENGLISH_MINIMUM':
          gaps.push({
            priority: 'High',
            item: 'English test results',
            rationale: 'Minimum English requirement not met'
          });
          break;
        case 'POINTS_MINIMUM':
          gaps.push({
            priority: 'High',
            item: 'Points optimization',
            rationale: 'Points below minimum threshold'
          });
          break;
      }
    }
    
    // Map risk factors to evidence gaps
    const riskCodes = riskAssessment.risk_factors.map(r => r.code);
    
    if (riskCodes.includes('CORE_DOCS_MISSING')) {
      gaps.push({
        priority: 'High',
        item: 'Essential documents',
        rationale: 'Passport, skills assessment, English test required'
      });
    }
    
    if (riskCodes.includes('PRIOR_REFUSAL_FLAG')) {
      gaps.push({
        priority: 'High',
        item: 'Previous refusal documentation',
        rationale: 'Must address reasons for previous refusal'
      });
    }
    
    // Document gaps from profile
    const docGaps = this.analyzeDocumentGaps(profile);
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
  
  private static analyzeDocumentGaps(profile: ApplicantProfile): Array<{priority: 'High' | 'Medium' | 'Low', item: string, rationale: string}> {
    const gaps: Array<{priority: 'High' | 'Medium' | 'Low', item: string, rationale: string}> = [];
    const docs = profile.data.documents;
    
    if (!docs.passport) {
      gaps.push({
        priority: 'High',
        item: 'Current passport',
        rationale: 'Valid passport required for identity verification'
      });
    }
    
    if (!docs.employment_reference_letters) {
      gaps.push({
        priority: 'High',
        item: 'Employment references',
        rationale: 'Reference letters required to verify employment'
      });
    }
    
    if (!docs.payslips) {
      gaps.push({
        priority: 'Medium',
        item: 'Recent payslips',
        rationale: 'Payslips support employment claims'
      });
    }
    
    if (!docs.cv) {
      gaps.push({
        priority: 'Low',
        item: 'Current CV',
        rationale: 'Updated CV provides employment overview'
      });
    }
    
    return gaps;
  }
}