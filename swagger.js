const swaggerJsdoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "SCI Analysis API",
      version: "1.0.0",
      description:
        "Social Interconnectedness Index among African Countries - API Documentation",
      license: {
        name: "GNU GPLv3",
        url: "https://www.gnu.org/licenses/gpl-3.0.html",
      },
    },
    // servers: [
    //   {
    //     url: 'http://localhost:8282/api',
    //     description: 'Development server'
    //   },
    //   {
    //     url: 'https://api.sci-analysis.com/api',
    //     description: 'Production server'
    //   }
    // ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
      },
    },
  },
  apis: ["./app/routes/api/*.js"],
};

module.exports = swaggerJsdoc(options);
