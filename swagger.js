const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0',
    info: {
      title: 'E-Commerce Weather API',
      version: '1.0.0',
      description: 'API with weather-based product recommendations',
      contact: {
        name: "Jayanth Krishna Kavalapudi",
        email: "your.email@example.com"
      }
    },
    servers: [
      {
        url: "http://localhost:5000",
        description: "Local server"
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        }
      },
      schemas: {
        User: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'John Doe' },
            email: { type: 'string', example: 'john@example.com' },
            password: { type: 'string', example: 'password123' }
          }
        },
        Product: {
          type: 'object',
          properties: {
            name: { type: 'string', example: 'Umbrella' },
            price: { type: 'number', example: 19.99 },
            weatherTags: { 
              type: 'array', 
              items: { type: 'string', example: 'rainy' } 
            }
          }
        },
        Order: {
          type: 'object',
          properties: {
            products: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  productId: { type: 'string', example: '65a1c2b3e4d5f6g7h8i9j0' },
                  quantity: { type: 'number', example: 2 }
                }
              }
            }
          }
        }
      }
    },
    security: [{ bearerAuth: [] }]
  },
  apis: ['./routes/*.js']
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = { swaggerSpec, swaggerUi: require('swagger-ui-express') };