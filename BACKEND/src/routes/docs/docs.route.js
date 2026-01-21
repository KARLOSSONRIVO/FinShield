import { Router } from "express";
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "../../config/swagger.js";

const docsRouter = Router();

// Serve Swagger UI at /api-docs
docsRouter.use("/", swaggerUi.serve);
docsRouter.get("/", swaggerUi.setup(swaggerSpec, {
  customCss: '.swagger-ui .topbar { display: none }',
  customSiteTitle: "FinShield API Documentation",
  swaggerOptions: {
    persistAuthorization: true,
    displayRequestDuration: true,
    docExpansion: 'list',
    filter: true,
    showExtensions: true,
  },
}));

// Endpoint to get the raw OpenAPI JSON spec
docsRouter.get("/json", (req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(swaggerSpec);
});

export default docsRouter;
