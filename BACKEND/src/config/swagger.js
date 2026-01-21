import swaggerJsdoc from 'swagger-jsdoc';
import { PORT, HOST, NODE_ENV } from './env.js';

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'FinShield API',
      version: '1.0.0',
      description: 'FinShield Backend API Documentation - A financial shield platform with blockchain-anchored invoice verification',
      contact: {
        name: 'FinShield Team',
      },
    },
    servers: [
      {
        url: NODE_ENV === 'production' 
          ? `https://${HOST}` 
          : `http://${HOST}:${PORT}`,
        description: NODE_ENV === 'production' ? 'Production server' : 'Development server',
      },
    ],
  },
  // Load documentation from separate YAML files (cleaner and easier to manage)
  apis: ['./src/docs/*.yaml'],
};

const swaggerSpec = swaggerJsdoc(options);

export default swaggerSpec;
