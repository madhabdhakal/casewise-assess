import Fastify from 'fastify';
import swagger from '@fastify/swagger';
import swaggerUi from '@fastify/swagger-ui';
import { assessmentRoutes } from './api/assessments';
import { pdfWorker } from './services/queue';
import * as fs from 'fs';
import * as path from 'path';

const fastify = Fastify({
  logger: {
    level: process.env.LOG_LEVEL || 'info'
  }
});

// Load OpenAPI spec
const openApiSpec = fs.readFileSync(path.join(__dirname, '../openapi.yaml'), 'utf8');

// Register Swagger
fastify.register(swagger, {
  mode: 'static',
  specification: {
    path: './openapi.yaml',
    postProcessor: function(swaggerObject) {
      return swaggerObject;
    },
    baseDir: path.join(__dirname, '..')
  }
});

fastify.register(swaggerUi, {
  routePrefix: '/docs',
  uiConfig: {
    docExpansion: 'list',
    deepLinking: false
  }
});

// Health check endpoint
fastify.get('/health', async (request, reply) => {
  return { 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  };
});

// Register routes
fastify.register(assessmentRoutes);

// Error handler
fastify.setErrorHandler((error, request, reply) => {
  fastify.log.error(error);
  
  if (error.validation) {
    return reply.code(400).send({
      error: 'Validation failed',
      details: error.validation
    });
  }
  
  return reply.code(500).send({
    error: 'Internal server error'
  });
});

// Not found handler
fastify.setNotFoundHandler((request, reply) => {
  return reply.code(404).send({
    error: 'Route not found'
  });
});

const start = async () => {
  try {
    const port = parseInt(process.env.PORT || '3000');
    const host = process.env.HOST || '0.0.0.0';
    
    await fastify.listen({ port, host });
    
    console.log(`Server listening on ${host}:${port}`);
    console.log(`API documentation available at http://${host}:${port}/docs`);
    
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

// Graceful shutdown
process.on('SIGTERM', async () => {
  console.log('Received SIGTERM, shutting down gracefully');
  await pdfWorker.close();
  await fastify.close();
  process.exit(0);
});

process.on('SIGINT', async () => {
  console.log('Received SIGINT, shutting down gracefully');
  await pdfWorker.close();
  await fastify.close();
  process.exit(0);
});

if (require.main === module) {
  start();
}

export default fastify;