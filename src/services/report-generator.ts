import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';
import { chromium } from 'playwright';
import { Assessment, AssessmentResult, ApplicantProfile, Report, Signoff } from '../domain/types';
import { Guardrails } from '../utils/guardrails';
import { AuditLogger } from '../utils/audit-logger';

export class ReportGenerator {
  private static templateCache: Map<string, HandlebarsTemplateDelegate> = new Map();
  
  static async generateHtmlReport(
    assessment: Assessment,
    results: AssessmentResult[],
    profile: ApplicantProfile,
    signoff?: Signoff
  ): Promise<string> {
    const template = await this.getTemplate('report.hbs');
    
    // Prepare template data
    const templateData = {
      reportId: `RPT-${assessment.id.substring(0, 8)}`,
      assessmentId: assessment.id,
      generatedDate: new Date().toLocaleString('en-AU'),
      assessmentDate: assessment.created_at.toLocaleString('en-AU'),
      policyVersion: 'au-2026-01-01',
      policySnapshotDate: '2026-01-01',
      profile: profile.data,
      eligibilityResults: results.map(result => ({
        visa_subclass: result.visa_subclass,
        eligibility_status: result.requirements_met.eligibility_status,
        points_score: result.requirements_met.points_score,
        eligibility_reasons: result.requirements_met.eligibility_reasons || []
      })),
      riskAssessment: this.consolidateRiskAssessment(results),
      recommendations: this.generateSafeRecommendations(results),
      signoff
    };
    
    // Generate initial HTML
    let htmlContent = template(templateData);
    
    // Validate content with guardrails
    const validation = Guardrails.validateReportContent(htmlContent);
    if (!validation.valid) {
      // Try LLM transformation if available
      const bulletPoints = this.extractBulletPoints(templateData);
      const llmContent = await Guardrails.transformWithLLM(bulletPoints, 'assessment report');
      
      if (llmContent) {
        const llmValidation = Guardrails.validateReportContent(llmContent);
        if (llmValidation.valid) {
          htmlContent = this.insertLLMContent(htmlContent, llmContent);
        } else {
          // Fall back to deterministic safe content
          htmlContent = this.generateSafeContent(templateData);
        }
      } else {
        // Fall back to deterministic safe content
        htmlContent = this.generateSafeContent(templateData);
      }
    }
    
    // Final validation
    const finalValidation = Guardrails.validateReportContent(htmlContent);
    if (!finalValidation.valid) {
      throw new Error(`Report validation failed: ${finalValidation.violations.join(', ')}`);
    }
    
    return htmlContent;
  }
  
  static async generatePdfReport(htmlContent: string, outputPath: string): Promise<void> {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle' });
    
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: {
        top: '20mm',
        right: '15mm',
        bottom: '20mm',
        left: '15mm'
      }
    });
    
    await browser.close();
  }
  
  private static async getTemplate(templateName: string): Promise<HandlebarsTemplateDelegate> {
    if (this.templateCache.has(templateName)) {
      return this.templateCache.get(templateName)!;
    }
    
    const templatePath = path.join(__dirname, '..', 'templates', templateName);
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    const template = Handlebars.compile(templateSource);
    
    this.templateCache.set(templateName, template);
    return template;
  }
  
  private static generateSafeContent(templateData: any): string {
    // Generate completely safe, deterministic content
    const safeTemplate = `
    <div class="safe-report">
      <h2>Assessment Summary</h2>
      <p>This assessment has been conducted for decision-support purposes only.</p>
      <p>Assessment ID: ${templateData.assessmentId}</p>
      <p>Generated: ${templateData.generatedDate}</p>
      
      <h3>Eligibility Analysis</h3>
      <p>The following analysis is based on current policy requirements:</p>
      <ul>
        ${templateData.eligibilityResults.map(r => 
          `<li>Subclass ${r.visa_subclass}: ${r.eligibility_status}</li>`
        ).join('')}
      </ul>
      
      <h3>Professional Review Required</h3>
      <p>This report requires review by a Registered Migration Agent.</p>
    </div>`;
    
    return safeTemplate;
  }
  
  private static extractBulletPoints(templateData: any): string[] {
    const points: string[] = [];
    
    templateData.eligibilityResults.forEach(result => {
      points.push(`Subclass ${result.visa_subclass} status: ${result.eligibility_status}`);
      if (result.points_score) {
        points.push(`Points score: ${result.points_score}`);
      }
    });
    
    return points;
  }
  
  private static insertLLMContent(htmlContent: string, llmContent: string): string {
    // Replace dynamic sections with LLM content while preserving structure
    return htmlContent.replace(
      /<div class="dynamic-content">.*?<\/div>/gs,
      `<div class="dynamic-content">${llmContent}</div>`
    );
  }
  
  private static consolidateRiskAssessment(results: AssessmentResult[]): any {
    const allRiskFactors = results.flatMap(r => r.risk_triggers.risk_factors || []);
    const allEvidenceGaps = results.flatMap(r => r.evidence_gaps || []);
    
    return {
      risk_level: this.calculateOverallRisk(allRiskFactors),
      risk_factors: allRiskFactors,
      evidence_gaps: allEvidenceGaps,
      mitigating_factors: results.flatMap(r => r.risk_triggers.mitigating_factors || [])
    };
  }
  
  private static calculateOverallRisk(riskFactors: any[]): string {
    const highCount = riskFactors.filter(r => r.level === 'High').length;
    const mediumCount = riskFactors.filter(r => r.level === 'Medium').length;
    
    if (highCount > 0) return 'High';
    if (mediumCount >= 2) return 'Medium';
    return 'Low';
  }
  
  private static generateSafeRecommendations(results: AssessmentResult[]): string[] {
    const recommendations: string[] = [];
    
    recommendations.push('This assessment provides decision-support analysis only');
    recommendations.push('Professional migration advice should be sought before making decisions');
    recommendations.push('All findings are based on information provided and current policy understanding');
    
    return recommendations;
  }
}