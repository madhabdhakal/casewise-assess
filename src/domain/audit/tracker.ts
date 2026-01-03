import * as crypto from 'crypto';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../../database/config';

export interface AuditLog {
  id: string;
  assessment_id: string;
  tenant_id: string;
  profile_checksum: string;
  policy_snapshot_id: string;
  ruleset_versions: Record<string, string>;
  eligibility_outputs: Record<string, any>;
  risk_outputs: Record<string, any>;
  evidence_gaps: any[];
  report_paths: {
    html?: string;
    pdf?: string;
  };
  reviewer_signoff?: {
    reviewer_name: string;
    mara_number: string;
    signed_at: Date;
    comments?: string;
  };
  created_at: Date;
}

export class AuditTracker {
  
  static generateChecksum(data: any): string {
    const dataString = JSON.stringify(data, Object.keys(data).sort());
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }
  
  static async logAssessment(
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
    const profileChecksum = this.generateChecksum(profileData);
    
    await query(
      `INSERT INTO assessment_audit_logs 
       (id, assessment_id, tenant_id, profile_checksum, policy_snapshot_id, 
        ruleset_versions, eligibility_outputs, risk_outputs, evidence_gaps)
       VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
      [
        auditId,
        assessmentId,
        tenantId,
        profileChecksum,
        policySnapshotId,
        JSON.stringify(rulesetVersions),
        JSON.stringify(eligibilityOutputs),
        JSON.stringify(riskOutputs),
        JSON.stringify(evidenceGaps)
      ]
    );
    
    return auditId;
  }
  
  static async logReportGeneration(assessmentId: string, htmlPath?: string, pdfPath?: string): Promise<void> {
    const reportPaths = { html: htmlPath, pdf: pdfPath };
    
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
      comments
    };
    
    await query(
      `UPDATE assessment_audit_logs 
       SET reviewer_signoff = $1, updated_at = CURRENT_TIMESTAMP
       WHERE assessment_id = $2`,
      [JSON.stringify(signoffData), assessmentId]
    );
  }
}