# Single-container build for CapRover.
# Serves the Express API and the built React frontend from one Node process,
# with the SQLite database living on a persistent volume mounted at /app/data.
FROM node:24-bookworm

ENV PNPM_HOME=/pnpm
ENV PATH=$PNPM_HOME:$PATH
RUN corepack enable && corepack prepare pnpm@10.26.1 --activate

WORKDIR /app

# Install dependencies (better-sqlite3 builds its native binary here because it
# is listed under onlyBuiltDependencies in pnpm-workspace.yaml).
COPY . .
RUN pnpm install --frozen-lockfile

# Build the frontend (served at the domain root) and bundle the API.
ENV NODE_ENV=production
RUN PORT=3000 BASE_PATH=/ pnpm --filter @workspace/wedding run build \
 && pnpm --filter @workspace/api-server run build

# Runtime configuration.
ENV PORT=80
ENV SERVE_CLIENT_DIR=/app/artifacts/wedding/dist/public
ENV DATABASE_FILE=/app/data/wedding.db
# ADMIN_PASSWORD must be provided as an app env var in CapRover to unlock the
# Configuración page.

COPY docker-entrypoint.sh /docker-entrypoint.sh
RUN chmod +x /docker-entrypoint.sh

EXPOSE 80
CMD ["/docker-entrypoint.sh"]
