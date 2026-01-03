import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';
import { chromium } from 'playwright';

export interface ReportData {
  assessmentId: string;
  generatedDate: string;
  profile: any;
  eligibilityResults: any[];
  riskAssessment: any;
  evidenceGaps: any[];
  signoff?: any;
}

export class ReportGenerator {
  
  static async generateHtml(data: ReportData): Promise<string> {
    const template = await this.loadTemplate();
    return template(data);
  }
  
  static async generatePdf(htmlContent: string, outputPath: string): Promise<void> {
    const browser = await chromium.launch();
    const page = await browser.newPage();
    
    await page.setContent(htmlContent, { waitUntil: 'networkidle' });
    
    await page.pdf({
      path: outputPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '20mm', right: '15mm', bottom: '20mm', left: '15mm' }
    });
    
    await browser.close();
  }
  
  private static async loadTemplate(): Promise<HandlebarsTemplateDelegate> {
    const templatePath = path.join(__dirname, '../../templates/report.hbs');
    const templateSource = fs.readFileSync(templatePath, 'utf8');
    return Handlebars.compile(templateSource);
  }
}