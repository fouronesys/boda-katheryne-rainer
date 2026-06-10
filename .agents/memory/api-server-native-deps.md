---
name: api-server bundle native deps
description: Native modules used by the API server must be its own direct deps, not transitive.
---

The API server is bundled with esbuild and externalizes native modules (see
the `external` list in `artifacts/api-server/build.mjs`: `better-sqlite3`,
`sharp`, `bcrypt`, etc.). Externalized packages are NOT bundled — node must
resolve them at runtime from `artifacts/api-server/node_modules`.

**Rule:** any externalized native module the server imports (even indirectly,
e.g. the SQLite driver pulled in through `@workspace/db`) MUST be declared as a
**direct dependency of `@workspace/api-server`**. A transitive dep in another
workspace package is not enough — pnpm's isolated node_modules won't expose it,
and the built `dist/index.mjs` fails at startup with
`ERR_MODULE_NOT_FOUND: Cannot find package '<name>'`.

**Why:** symptom looked like "DB not initialized" but the real cause was the
server crashing on boot because `better-sqlite3` wasn't resolvable.

**How to apply:** when adding a DB driver or other native dep via a lib, also
`pnpm --filter @workspace/api-server add <pkg>`. Note `better-sqlite3` is in
`onlyBuiltDependencies` but NOT the catalog, so use an explicit version
(`^12.10.0`), not `catalog:`.
