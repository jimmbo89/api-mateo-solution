const swaggerAutogen = require('swagger-autogen')();

const outputFile = './swagger.json';
const endPointsFiles = ['./app/routes.js'];


const doc = {
  info: {
    title: 'Api de Tiendas virtuales',
    description: 'Esta API permite gestionar las diferentes tiendas virtuales y sus productos' // ← corregí "descriptio" → "description"
  },
  host: '127.0.0.1:8080',      // ← sin http://
  basePath: '/api',            // ← importante: coincide con tu app.use('/api', ...)
  schemes: ['http', 'https'],
  securityDefinitions: {
    bearerAuth: {
      type: 'apiKey',
      name: 'Authorization',
      in: 'header',
      description: 'JWT token en formato: Bearer <token>'
    }
  }
};


swaggerAutogen(outputFile, endPointsFiles, doc);