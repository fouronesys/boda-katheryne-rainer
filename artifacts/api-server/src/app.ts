import path from "node:path";
import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", router);

// In single-container deployments (e.g. CapRover) the API also serves the
// built frontend. Enabled only when SERVE_CLIENT_DIR points at the built SPA;
// in Replit the frontend is a separate service behind the shared proxy, so
// this stays disabled there.
const clientDir = process.env.SERVE_CLIENT_DIR;
if (clientDir) {
  const resolvedClientDir = path.resolve(clientDir);
  app.use(express.static(resolvedClientDir));
  app.use((req, res, next) => {
    if (req.method !== "GET" || req.path.startsWith("/api")) {
      next();
      return;
    }
    res.sendFile(path.join(resolvedClientDir, "index.html"));
  });
  logger.info({ clientDir: resolvedClientDir }, "Serving static client");
}

export default app;
