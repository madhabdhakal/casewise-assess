import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/config';
import { Guardrails } from './guardrails';

export interface AssessmentAuditLog {
  id: string;
  assessment_id: string;
  tenant_id: string;
  profile_checksum: string;
  policy_snapshot_id: string;
  ruleset_versions: Record<string, string>;
  eligibility_outputs: Record<string, any>;
  risk_outputs: Record<string, any>;
  evidence_gaps: any[];
  report_html_path?: string;
  report_pdf_path?: string;
  reviewer_signoff?: {
    reviewer_name: string;
    mara_number: string;
    signed_at: Date;
    comments?: string;
  };
  created_at: Date;
}

export class AuditLogger {
  
  static async logAssessmentComplete(
    assessmentId: string,
    tenantId: string,
    profileData: any,
    policySnapshotId: string,
    rulesetVersions: Record<string, string>,
    eligibilityOutputs: Record<string, any>,
    riskOutputs: Record<string, any>,
    evidenceGaps: any[]
  ): Promise<string> {
    
    const auditId = uuidv4();
    const profileChecksum = Guardrails.generateProfileChecksum(profileData);
    
    const auditLog: AssessmentAuditLog = {
      id: auditId,
      assessment_id: assessmentId,
      tenant_id: tenantId,
      profile_checksum: profileChecksum,
      policy_snapshot_id: policySnapshotId,
      ruleset_versions: rulesetVersions,
      eligibility_outputs: eligibilityOutputs,
      risk_outputs: riskOutputs,
      evidence_gaps: evidenceGaps,
      created_at: new Date()
    };
    
    await query(
      `INSERT INTO assessment_audit_logs 
       (id, assessment_id, tenant_id, profile_checksum, policy_snapshot_id, 
        ruleset_versions, eligibility_outputs, risk_outputs, evidence_gaps, created_at)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10)`,
      [
        auditId,
        assessmentId,
        tenantId,
        profileChecksum,
        policySnapshotId,
        JSON.stringify(rulesetVersions),
        JSON.stringify(eligibilityOutputs),
        JSON.stringify(riskOutputs),
        JSON.stringify(evidenceGaps),
        new Date()
      ]
    );
    
    return auditId;
  }
  
  static async logReportGenerated(
    assessmentId: string,
    htmlPath?: string,
    pdfPath?: string
  ): Promise<void> {
    
    await query(
      `UPDATE assessment_audit_logs 
       SET report_html_path = $1, report_pdf_path = $2, updated_at = CURRENT_TIMESTAMP
       WHERE assessment_id = $3`,
      [htmlPath, pdfPath, assessmentId]
    );
  }
  
  static async logSignoff(
    assessmentId: string,
    reviewerName: string,
    maraNumber: string,
    comments?: string
  ): Promise<void> {
    
    const signoffData = {
      reviewer_name: reviewerName,
      mara_number: maraNumber,
      signed_at: new Date(),
      comments: comments
    };
    
    await query(
      `UPDATE assessment_audit_logs 
       SET reviewer_signoff = $1, updated_at = CURRENT_TIMESTAMP
       WHERE assessment_id = $2`,
      [JSON.stringify(signoffData), assessmentId]
    );
  }
  
  static async getAuditLog(assessmentId: string): Promise<AssessmentAuditLog | null> {
    const result = await query(
      'SELECT * FROM assessment_audit_logs WHERE assessment_id = $1',
      [assessmentId]
    );
    
    if (result.rows.length === 0) return null;
    
    const row = result.rows[0];
    return {
      ...row,
      ruleset_versions: JSON.parse(row.ruleset_versions),
      eligibility_outputs: JSON.parse(row.eligibility_outputs),
      risk_outputs: JSON.parse(row.risk_outputs),
      evidence_gaps: JSON.parse(row.evidence_gaps),
      reviewer_signoff: row.reviewer_signoff ? JSON.parse(row.reviewer_signoff) : undefined
    };
  }
}