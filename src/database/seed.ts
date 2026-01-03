import { v4 as uuidv4 } from 'uuid';
import * as bcrypt from 'bcrypt';
import { query } from './config';
import { PolicyManager } from '../domain/policy/manager';

export async function seed() {
  console.log('Seeding database...');
  
  try {
    // Create sample tenant
    const tenantId = uuidv4();
    await query(
      'INSERT INTO tenants (id, name) VALUES ($1, $2) ON CONFLICT DO NOTHING',
      [tenantId, 'Sample Migration Agency']
    );
    console.log('Created sample tenant');
    
    // Create API key
    const apiKeyValue = 'test-api-key-12345';
    const hashedKey = await bcrypt.hash(apiKeyValue, 10);
    
    await query(
      'INSERT INTO api_keys (id, tenant_id, key_hash, name) VALUES ($1, $2, $3, $4) ON CONFLICT DO NOTHING',
      [uuidv4(), tenantId, hashedKey, 'Development API Key']
    );
    console.log(`Created API key: ${apiKeyValue}`);
    
    // Create policy snapshot
    const policySnapshotId = 'au-2026-01-01';
    const policySnapshot = PolicyManager.createSnapshot(policySnapshotId, new Date('2026-01-01'));
    
    await query(
      'INSERT INTO policy_snapshots (id, effective_date, references) VALUES ($1, $2, $3) ON CONFLICT (id) DO NOTHING',
      [policySnapshotId, policySnapshot.effective_date, JSON.stringify(policySnapshot.references)]
    );
    console.log('Created policy snapshot: au-2026-01-01');
    
    // Create rulesets
    const ruleset189 = PolicyManager.create189Ruleset('au-2026-01-01');
    const ruleset190 = PolicyManager.create190Ruleset('au-2026-01-01');
    
    await query(
      'INSERT INTO rulesets (id, policy_snapshot_id, visa_subclass, rules_json) VALUES ($1, $2, $3, $4) ON CONFLICT (policy_snapshot_id, visa_subclass) DO NOTHING',
      [uuidv4(), policySnapshotId, '189', JSON.stringify(ruleset189)]
    );
    
    await query(
      'INSERT INTO rulesets (id, policy_snapshot_id, visa_subclass, rules_json) VALUES ($1, $2, $3, $4) ON CONFLICT (policy_snapshot_id, visa_subclass) DO NOTHING',\n      [uuidv4(), policySnapshotId, '190', JSON.stringify(ruleset190)]\n    );\n    \n    console.log('Created rulesets for visas 189 and 190');\n    \n    console.log('\\nSeed completed successfully!');\n    console.log('================================');\n    console.log(`Tenant ID: ${tenantId}`);\n    console.log(`API Key: ${apiKeyValue}`);\n    console.log(`Policy Snapshot: ${policySnapshotId}`);\n    console.log('================================');\n    \n  } catch (error) {\n    console.error('Seeding failed:', error);\n    throw error;\n  }\n}\n\nif (require.main === module) {\n  seed().catch(console.error);\n}