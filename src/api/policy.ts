import { FastifyInstance, FastifyRequest, FastifyReply } from 'fastify';
import { v4 as uuidv4 } from 'uuid';
import { query } from '../database/config';
import { authenticateApiKey, AuthenticatedRequest } from '../utils/auth';
import { createPolicySnapshotSchema } from '../utils/validation';

export async function policyRoutes(fastify: FastifyInstance) {
  
  // Get all policy snapshots
  fastify.get('/v1/policy-snapshots', {
    preHandler: authenticateApiKey
  }, async (request: FastifyRequest, reply: FastifyReply) => {
    try {
      const result = await query(
        `SELECT ps.*, 
         COUNT(r.id) as ruleset_count,
         ARRAY_AGG(r.visa_subclass) as supported_visas
         FROM policy_snapshots ps
         LEFT JOIN rulesets r ON ps.id = r.policy_snapshot_id
         WHERE ps.active = true
         GROUP BY ps.id
         ORDER BY ps.effective_date DESC`
      );
      
      const snapshots = result.rows.map(row => ({
        id: row.id,
        version: row.version,
        effective_date: row.effective_date,
        description: row.description,
        active: row.active,
        created_at: row.created_at,
        ruleset_count: parseInt(row.ruleset_count),
        supported_visas: row.supported_visas.filter(v => v !== null)
      }));
      
      return reply.send({ snapshots });
      
    } catch (error) {
      console.error('Get policy snapshots error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
  
  // Create new policy snapshot (admin only)
  fastify.post('/v1/policy-snapshots', {
    preHandler: authenticateApiKey,
    schema: {
      body: createPolicySnapshotSchema
    }
  }, async (request: FastifyRequest<{
    Body: {
      version: string;
      effective_date: string;
      description: string;
      rulesets: Array<{
        visa_subclass: string;
        rules: Record<string, any>;
      }>;
    }
  }>, reply: FastifyReply) => {
    try {
      const { version, effective_date, description, rulesets } = request.body;
      const { tenant } = request as AuthenticatedRequest;
      
      // Check if version already exists
      const existingResult = await query(
        'SELECT id FROM policy_snapshots WHERE version = $1',
        [version]
      );
      
      if (existingResult.rows.length > 0) {
        return reply.code(400).send({ error: 'Policy snapshot version already exists' });
      }
      
      // Validate visa subclasses
      const supportedVisas = ['189', '190'];
      for (const ruleset of rulesets) {
        if (!supportedVisas.includes(ruleset.visa_subclass)) {
          return reply.code(400).send({ 
            error: `Unsupported visa subclass: ${ruleset.visa_subclass}. Only 189 and 190 are supported in V1.` 
          });
        }
      }
      
      // Create policy snapshot
      const snapshotId = uuidv4();
      await query(
        'INSERT INTO policy_snapshots (id, version, effective_date, description) VALUES ($1, $2, $3, $4)',
        [snapshotId, version, effective_date, description]
      );
      
      // Create rulesets
      for (const ruleset of rulesets) {
        const rulesetId = uuidv4();
        await query(
          'INSERT INTO rulesets (id, policy_snapshot_id, visa_subclass, rules) VALUES ($1, $2, $3, $4)',
          [rulesetId, snapshotId, ruleset.visa_subclass, JSON.stringify(ruleset.rules)]
        );
      }
      
      // Log audit event
      await query(
        `INSERT INTO audit_events (id, tenant_id, event_type, entity_type, entity_id, details)
         VALUES ($1, $2, 'policy_snapshot_created', 'policy_snapshot', $3, $4)`,
        [
          uuidv4(),
          tenant.id,
          snapshotId,
          JSON.stringify({
            version,
            effective_date,
            ruleset_count: rulesets.length,
            visa_subclasses: rulesets.map(r => r.visa_subclass)
          })
        ]
      );
      
      return reply.code(201).send({
        id: snapshotId,
        version,
        effective_date,
        description,
        ruleset_count: rulesets.length
      });
      
    } catch (error) {
      console.error('Create policy snapshot error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
  
  // Get specific policy snapshot with rulesets
  fastify.get('/v1/policy-snapshots/:id', {
    preHandler: authenticateApiKey
  }, async (request: FastifyRequest<{
    Params: { id: string }
  }>, reply: FastifyReply) => {
    try {
      const { id } = request.params;
      
      // Get policy snapshot
      const snapshotResult = await query(
        'SELECT * FROM policy_snapshots WHERE id = $1',
        [id]
      );
      
      if (snapshotResult.rows.length === 0) {
        return reply.code(404).send({ error: 'Policy snapshot not found' });
      }
      
      const snapshot = snapshotResult.rows[0];
      
      // Get rulesets
      const rulesetsResult = await query(
        'SELECT * FROM rulesets WHERE policy_snapshot_id = $1',
        [id]
      );
      
      const rulesets = rulesetsResult.rows.map(row => ({
        id: row.id,
        visa_subclass: row.visa_subclass,
        rules: row.rules,
        created_at: row.created_at
      }));
      
      return reply.send({
        ...snapshot,
        rulesets
      });
      
    } catch (error) {
      console.error('Get policy snapshot error:', error);
      return reply.code(500).send({ error: 'Internal server error' });
    }
  });
}