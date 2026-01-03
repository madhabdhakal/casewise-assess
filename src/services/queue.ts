import { Queue, Worker, Job } from 'bullmq';
import Redis from 'ioredis';
import { ReportGenerator } from './report-generator';
import { query } from '../database/config';
import * as path from 'path';
import * as fs from 'fs';

const redis = new Redis({
  host: process.env.REDIS_HOST || 'localhost',
  port: parseInt(process.env.REDIS_PORT || '6379'),
  maxRetriesPerRequest: 3,
});

export const pdfQueue = new Queue('pdf-generation', { connection: redis });

export interface PdfJobData {
  assessmentId: string;
  htmlContent: string;
  reportId: string;
}

// Ensure reports directory exists
const reportsDir = path.join(process.cwd(), 'reports');
if (!fs.existsSync(reportsDir)) {
  fs.mkdirSync(reportsDir, { recursive: true });
}

export const pdfWorker = new Worker('pdf-generation', async (job: Job<PdfJobData>) => {
  const { assessmentId, htmlContent, reportId } = job.data;
  
  try {
    // Generate unique filename
    const filename = `report-${reportId}-${Date.now()}.pdf`;
    const outputPath = path.join(reportsDir, filename);
    
    // Generate PDF
    await ReportGenerator.generatePdfReport(htmlContent, outputPath);
    
    // Update database with PDF path
    await query(
      'UPDATE reports SET pdf_path = $1 WHERE assessment_id = $2',
      [outputPath, assessmentId]
    );
    
    console.log(`PDF generated successfully: ${filename}`);
    return { success: true, pdfPath: outputPath, filename };
    
  } catch (error) {
    console.error('PDF generation failed:', error);
    throw error;
  }
}, { connection: redis });

export async function queuePdfGeneration(assessmentId: string, htmlContent: string, reportId: string) {
  const job = await pdfQueue.add('generate-pdf', {
    assessmentId,
    htmlContent,
    reportId
  }, {
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
    removeOnComplete: 10,
    removeOnFail: 5,
  });
  
  return job.id;
}

// Graceful shutdown
process.on('SIGTERM', async () => {
  await pdfWorker.close();
  await pdfQueue.close();
  redis.disconnect();
});