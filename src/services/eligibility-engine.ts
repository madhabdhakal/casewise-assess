import { ApplicantProfile, EligibilityResult, Ruleset } from '../domain/types';
import { RuleEvaluators } from './rule-evaluators';

export class EligibilityEngine {
  
  static evaluate(profile: ApplicantProfile, ruleset: Ruleset): EligibilityResult {
    const reasons: Array<{code: string, message: string, severity: 'hard' | 'soft'}> = [];
    const missing: string[] = [];
    
    // Evaluate each criterion in the ruleset
    for (const criterion of ruleset.rules_json.criteria) {
      const evaluatorFn = RuleEvaluators[criterion.evaluate] as (profile: ApplicantProfile, params: any) => boolean;
      if (!evaluatorFn) {
        throw new Error(`Unknown evaluator: ${criterion.evaluate}`);
      }
      
      const passed = evaluatorFn(profile, criterion.params);
      
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
    
    // Determine eligibility status
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
}