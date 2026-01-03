import { FastifyRequest, FastifyReply } from 'fastify';
import { query } from '../database/config';
import * as bcrypt from 'bcrypt';

export interface AuthenticatedRequest extends FastifyRequest {
  tenant: {
    id: string;
    name: string;
  };
}

export async function authenticateApiKey(request: FastifyRequest, reply: FastifyReply) {
  const apiKey = request.headers['x-api-key'] as string;
  
  if (!apiKey) {
    return reply.code(401).send({ error: 'API key required' });
  }
  
  try {
    // Get all active API keys (we'll hash the provided key and compare)
    const result = await query(
      `SELECT ak.*, t.name as tenant_name 
       FROM api_keys ak 
       JOIN tenants t ON ak.tenant_id = t.id 
       WHERE ak.active = true AND t.active = true`
    );
    
    let matchedKey = null;
    
    // Check each key hash (in production, you'd want to optimize this)
    for (const keyRecord of result.rows) {
      const isMatch = await bcrypt.compare(apiKey, keyRecord.key_hash);
      if (isMatch) {
        matchedKey = keyRecord;
        break;
      }
    }
    
    if (!matchedKey) {
      return reply.code(401).send({ error: 'Invalid API key' });
    }
    
    // Add tenant info to request
    (request as AuthenticatedRequest).tenant = {
      id: matchedKey.tenant_id,
      name: matchedKey.tenant_name
    };
    
  } catch (error) {
    console.error('Authentication error:', error);
    return reply.code(500).send({ error: 'Authentication failed' });
  }
}

export const BANNED_PHRASES = [
  'you should apply',
  'will be approved',
  'guarantee',
  'high chance of approval',
  'definitely eligible',
  'certain to succeed',
  'recommended visa',
  'best option',
  'apply for this visa',
  'visa 491',
  'visa 482',
  'subclass 491',
  'subclass 482'
];

export function validateContent(content: string): string[] {
  const violations: string[] = [];
  const lowerContent = content.toLowerCase();
  
  for (const phrase of BANNED_PHRASES) {
    if (lowerContent.includes(phrase.toLowerCase())) {
      violations.push(`Banned phrase detected: "${phrase}"`);
    }
  }
  
  return violations;
}

export function sanitizeProfileData(data: any): any {
  // Remove any potential banned content from profile data
  const sanitized = JSON.parse(JSON.stringify(data));
  
  // Add validation logic here for profile data structure
  if (!sanitized.personal || !sanitized.english || !sanitized.skills_assessment) {
    throw new Error('Invalid profile data structure');
  }
  
  return sanitized;
}