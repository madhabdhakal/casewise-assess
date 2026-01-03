import * as crypto from 'crypto';

export class Guardrails {
  
  private static BANNED_ADVICE_PHRASES = [
    'guarantee',
    'will be approved',
    'high chance',
    'should apply',
    'i recommend you',
    'apply for',
    'you must apply',
    'definitely'
  ];
  
  private static BANNED_VISA_MENTIONS = [
    '491', '482', '485', '186', '187', '494', '858', '124', '132', '188', '888'
  ];
  
  static validateReportContent(content: string): { valid: boolean; violations: string[] } {
    const violations: string[] = [];
    const lowerContent = content.toLowerCase();
    
    // Check for advice language
    for (const phrase of this.BANNED_ADVICE_PHRASES) {
      if (lowerContent.includes(phrase.toLowerCase())) {
        violations.push(`Advice language detected: "${phrase}"`);
      }
    }
    
    // Check for unauthorized visa mentions
    for (const visa of this.BANNED_VISA_MENTIONS) {
      const patterns = [
        `visa ${visa}`,
        `subclass ${visa}`,
        `${visa} visa`,
        `subclass-${visa}`,
        `visa-${visa}`
      ];
      
      for (const pattern of patterns) {
        if (lowerContent.includes(pattern)) {
          violations.push(`Unauthorized visa mention: "${visa}"`);
        }
      }
    }
    
    return {
      valid: violations.length === 0,
      violations
    };
  }
  
  static generateProfileChecksum(profileData: any): string {
    const dataString = JSON.stringify(profileData, Object.keys(profileData).sort());
    return crypto.createHash('sha256').update(dataString).digest('hex');
  }
  
  static async transformWithLLM(bulletPoints: string[], context: string): Promise<string | null> {
    // Optional LLM implementation - returns null to fall back to templates
    // If implemented, would call LLM with strict instructions:
    /*
    const prompt = `Transform these bullet points into calm narrative prose. 
    STRICT RULES:
    - Do not add new facts or information
    - Do not add references or citations  
    - Do not give advice or recommendations
    - Do not predict outcomes or guarantees
    - Only rephrase the provided content
    - Use decision-support language only
    
    Bullet points:
    ${bulletPoints.join('\n')}
    
    Context: ${context}`;
    
    try {
      const response = await callLLM(prompt);
      const validation = this.validateReportContent(response);
      return validation.valid ? response : null;
    } catch (error) {
      return null; // Fall back to templates
    }
    */
    
    return null; // No LLM implementation - use templates
  }
  
  static generateDeterministicNarrative(bulletPoints: string[], context: string): string {
    const intro = context.includes('risk') ? 
      'The following factors have been identified through systematic analysis:' :
      'Based on the assessment criteria, the following observations apply:';
    
    const narrative = bulletPoints
      .map(point => `• ${point}`)
      .join('\n');
    
    const conclusion = context.includes('risk') ?
      'These factors should be considered in the context of professional migration advice.' :
      'These findings are based on current policy requirements and provided information.';
    
    return `${intro}\n\n${narrative}\n\n${conclusion}`;
  }
}