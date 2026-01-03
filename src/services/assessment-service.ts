import { v4 as uuidv4 } from 'uuid';
import { query, transaction } from '../database/config';
import { ApplicantProfile } from '../domain/types';
import { EligibilityEvaluator } from '../domain/eligibility/evaluator';
import { RiskAnalyzer } from '../domain/risk/analyzer';
import { EvidenceGapAnalyzer } from '../domain/evidence/analyzer';
import { ReportGenerator } from '../domain/report/generator';
import { AuditTracker } from '../domain/audit/tracker';
import { queuePdfGeneration } from './queue';

export class AssessmentService {
  
  static async createAssessment(
    tenantId: string,
    profileData: any,
    policySnapshotId: string
  ): Promise<{ assessmentId: string; profileId: string }> {
    
    return await transaction(async (client) => {
      // Create profile
      const profileId = uuidv4();
      await client.query(
        'INSERT INTO applicant_profiles (id, tenant_id, profile_version, collected_at, data) VALUES ($1, $2, $3, $4, $5)',
        [profileId, tenantId, 1, new Date().toISOString(), JSON.stringify(profileData)]
      );
      
      // Create assessment
      const assessmentId = uuidv4();
      await client.query(
        'INSERT INTO assessments (id, tenant_id, profile_id, policy_snapshot_id, status) VALUES ($1, $2, $3, $4, $5)',
        [assessmentId, tenantId, profileId, policySnapshotId, 'pending']
      );
      
      return { assessmentId, profileId };
    });
  }
  
  static async runAssessment(assessmentId: string): Promise<void> {
    await transaction(async (client) => {
      // Get assessment and profile
      const result = await client.query(`
        SELECT a.*, p.data as profile_data, p.tenant_id, p.profile_version, p.collected_at
        FROM assessments a
        JOIN applicant_profiles p ON a.profile_id = p.id
        WHERE a.id = $1
      `, [assessmentId]);
      
      if (result.rows.length === 0) {
        throw new Error('Assessment not found');
      }
      
      const assessment = result.rows[0];\n      const profile: ApplicantProfile = {\n        id: assessment.profile_id,\n        tenant_id: assessment.tenant_id,\n        profile_version: assessment.profile_version,\n        collected_at: assessment.collected_at,\n        data: assessment.profile_data,\n        created_at: new Date()\n      };\n      \n      // Get rulesets\n      const rulesetsResult = await client.query(\n        'SELECT * FROM rulesets WHERE policy_snapshot_id = $1',\n        [assessment.policy_snapshot_id]\n      );\n      \n      const rulesetVersions = {};\n      const eligibilityOutputs = {};\n      const riskOutputs = {};\n      let allEvidenceGaps = [];\n      \n      // Process each ruleset\n      for (const rulesetRow of rulesetsResult.rows) {\n        const ruleset = rulesetRow.rules_json;\n        \n        // Run eligibility assessment\n        const eligibilityResult = EligibilityEvaluator.evaluate(profile, ruleset);\n        \n        // Run risk assessment\n        const riskAssessment = RiskAnalyzer.assess(profile);\n        \n        // Generate evidence gaps\n        const evidenceGaps = EvidenceGapAnalyzer.analyze(profile, eligibilityResult, riskAssessment);\n        \n        // Store results\n        const resultId = uuidv4();\n        await client.query(`\n          INSERT INTO assessment_results \n          (id, assessment_id, visa_subclass, eligible, points_score, requirements_met, risk_triggers, evidence_gaps)\n          VALUES ($1, $2, $3, $4, $5, $6, $7, $8)\n        `, [\n          resultId,\n          assessmentId,\n          ruleset.visa,\n          eligibilityResult.eligibility_status === 'Eligible',\n          eligibilityResult.points_score,\n          JSON.stringify(eligibilityResult),\n          JSON.stringify(riskAssessment),\n          JSON.stringify(evidenceGaps)\n        ]);\n        \n        rulesetVersions[ruleset.visa] = ruleset.version;\n        eligibilityOutputs[ruleset.visa] = eligibilityResult;\n        riskOutputs[ruleset.visa] = riskAssessment;\n        allEvidenceGaps.push(...evidenceGaps);\n      }\n      \n      // Update assessment status\n      await client.query(\n        'UPDATE assessments SET status = $1, completed_at = CURRENT_TIMESTAMP WHERE id = $2',\n        ['completed', assessmentId]\n      );\n      \n      // Log audit trail\n      await AuditTracker.logAssessment(\n        assessmentId,\n        assessment.tenant_id,\n        profile.data,\n        assessment.policy_snapshot_id,\n        rulesetVersions,\n        eligibilityOutputs,\n        riskOutputs,\n        allEvidenceGaps\n      );\n    });\n  }\n  \n  static async generateReport(assessmentId: string): Promise<string> {\n    // Get assessment data\n    const assessmentResult = await query(`\n      SELECT a.*, p.data as profile_data\n      FROM assessments a\n      JOIN applicant_profiles p ON a.profile_id = p.id\n      WHERE a.id = $1\n    `, [assessmentId]);\n    \n    if (assessmentResult.rows.length === 0) {\n      throw new Error('Assessment not found');\n    }\n    \n    const assessment = assessmentResult.rows[0];\n    \n    // Get results\n    const resultsQuery = await query(\n      'SELECT * FROM assessment_results WHERE assessment_id = $1',\n      [assessmentId]\n    );\n    \n    const results = resultsQuery.rows.map(row => ({\n      ...row,\n      requirements_met: JSON.parse(row.requirements_met),\n      risk_triggers: JSON.parse(row.risk_triggers),\n      evidence_gaps: JSON.parse(row.evidence_gaps)\n    }));\n    \n    // Generate HTML report\n    const reportData = {\n      assessmentId,\n      generatedDate: new Date().toLocaleString('en-AU'),\n      profile: assessment.profile_data,\n      eligibilityResults: results.map(r => r.requirements_met),\n      riskAssessment: results[0]?.risk_triggers || {},\n      evidenceGaps: results.flatMap(r => r.evidence_gaps)\n    };\n    \n    const htmlContent = await ReportGenerator.generateHtml(reportData);\n    \n    // Save report\n    const reportId = uuidv4();\n    await query(\n      'INSERT INTO reports (id, assessment_id, html_content) VALUES ($1, $2, $3)',\n      [reportId, assessmentId, htmlContent]\n    );\n    \n    // Queue PDF generation\n    await queuePdfGeneration(assessmentId, htmlContent, reportId);\n    \n    // Log report generation\n    await AuditTracker.logReportGeneration(assessmentId, 'html');\n    \n    return htmlContent;\n  }\n  \n  static async addSignoff(\n    assessmentId: string,\n    reviewerName: string,\n    maraNumber: string,\n    comments?: string\n  ): Promise<void> {\n    \n    const signoffId = uuidv4();\n    await query(\n      'INSERT INTO signoffs (id, assessment_id, reviewer_name, mara_number, comments) VALUES ($1, $2, $3, $4, $5)',\n      [signoffId, assessmentId, reviewerName, maraNumber, comments]\n    );\n    \n    await AuditTracker.logSignoff(assessmentId, reviewerName, maraNumber, comments);\n  }\n  \n  static async getAssessment(assessmentId: string, tenantId: string): Promise<any> {\n    const result = await query(\n      'SELECT * FROM assessments WHERE id = $1 AND tenant_id = $2',\n      [assessmentId, tenantId]\n    );\n    \n    return result.rows[0] || null;\n  }\n  \n  static async getReport(assessmentId: string, tenantId: string): Promise<any> {\n    const result = await query(`\n      SELECT r.* FROM reports r\n      JOIN assessments a ON r.assessment_id = a.id\n      WHERE r.assessment_id = $1 AND a.tenant_id = $2\n    `, [assessmentId, tenantId]);\n    \n    return result.rows[0] || null;\n  }\n}