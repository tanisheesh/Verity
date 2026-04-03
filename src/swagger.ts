import swaggerJsdoc from 'swagger-jsdoc';
import path from 'path';

const options: swaggerJsdoc.Options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'VERITY - Forensic Linguistic Analysis API',
      version: '1.0.0',
      description: 'Rule-based NLP system for detecting deception indicators in text using 9 analysis layers',
      contact: {
        name: 'Tanish Poddar',
        url: 'https://tanisheesh.is-a.dev/',
      },
      license: {
        name: 'ISC',
        url: 'https://opensource.org/licenses/ISC',
      },
    },
    servers: [
      {
        url: 'https://verity-wfk0.onrender.com',
        description: 'Production server',
      },
      {
        url: 'http://localhost:3001',
        description: 'Development server',
      },
    ],
    tags: [
      {
        name: 'Analysis',
        description: 'Text and conversation analysis endpoints',
      },
      {
        name: 'Health',
        description: 'System health check',
      },
    ],
  },
  apis: [path.join(__dirname, './routes/*.ts'), path.join(__dirname, './routes/*.js')],
};

export const swaggerSpec = swaggerJsdoc(options);
