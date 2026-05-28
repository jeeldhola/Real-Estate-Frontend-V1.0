#!/usr/bin/env node
// Builds the FE for Vercel using the Build Output API v3.
//
//   dist/client/   ──► .vercel/output/static/
//   dist/server/   ──► loaded inside .vercel/output/functions/_render.func/index.mjs
//   config.json    ──► routes static assets first, falls back to the function
//
// References:
//   https://vercel.com/docs/build-output-api/v3

import { execSync } from "node:child_process";
import { cpSync, mkdirSync, rmSync, writeFileSync, existsSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = resolve(here, "..");
const OUT = resolve(root, ".vercel/output");
const FN_DIR = resolve(OUT, "functions/_render.func");

function step(label) {
  process.stdout.write(`\n▸ ${label}\n`);
}

function run(cmd) {
  execSync(cmd, { cwd: root, stdio: "inherit" });
}

step("clean previous output");
rmSync(resolve(root, "dist"), { recursive: true, force: true });
rmSync(OUT, { recursive: true, force: true });

step("vite build (DEPLOY_TARGET=vercel)");
run(`DEPLOY_TARGET=vercel npx vite build`);

if (!existsSync(resolve(root, "dist/client")) || !existsSync(resolve(root, "dist/server"))) {
  throw new Error("Expected dist/client and dist/server after vite build");
}

step("copy client assets → .vercel/output/static");
mkdirSync(resolve(OUT, "static"), { recursive: true });
cpSync(resolve(root, "dist/client"), resolve(OUT, "static"), { recursive: true });

step("create SSR function bundle");
mkdirSync(FN_DIR, { recursive: true });
// Ship the entire compiled server tree so dynamic imports keep working.
cpSync(resolve(root, "dist/server"), resolve(FN_DIR, "server"), { recursive: true });

// Vercel function manifest — Node runtime, Web fetch handler.
writeFileSync(
  resolve(FN_DIR, ".vc-config.json"),
  JSON.stringify(
    {
      runtime: "nodejs20.x",
      handler: "index.mjs",
      launcherType: "Nodejs",
      shouldAddHelpers: false,
      supportsResponseStreaming: true,
    },
    null,
    2,
  ),
);

// Thin adapter: convert Node req/res ↔ Web Request/Response and forward
// the call to the SSR server's `fetch`.
writeFileSync(
  resolve(FN_DIR, "index.mjs"),
  `import { Readable } from "node:stream";
import serverEntry from "./server/server.js";

async function nodeToWebRequest(req) {
  const proto = req.headers["x-forwarded-proto"] ?? "https";
  const host = req.headers["x-forwarded-host"] ?? req.headers.host ?? "localhost";
  const url = new URL(req.url, \`\${proto}://\${host}\`).toString();
  const headers = new Headers();
  for (const [k, v] of Object.entries(req.headers)) {
    if (v === undefined) continue;
    if (Array.isArray(v)) for (const item of v) headers.append(k, item);
    else headers.append(k, String(v));
  }
  const method = req.method ?? "GET";
  const init = { method, headers };
  if (method !== "GET" && method !== "HEAD") {
    init.body = Readable.toWeb(req);
    init.duplex = "half";
  }
  return new Request(url, init);
}

async function writeWebResponse(webRes, nodeRes) {
  nodeRes.statusCode = webRes.status;
  webRes.headers.forEach((value, key) => {
    nodeRes.setHeader(key, value);
  });
  if (!webRes.body) {
    nodeRes.end();
    return;
  }
  const stream = Readable.fromWeb(webRes.body);
  stream.pipe(nodeRes);
}

export default async function handler(req, res) {
  try {
    const webReq = await nodeToWebRequest(req);
    const webRes = await serverEntry.fetch(webReq, {}, {});
    await writeWebResponse(webRes, res);
  } catch (err) {
    console.error("[vercel-handler]", err);
    res.statusCode = 500;
    res.setHeader("content-type", "text/plain; charset=utf-8");
    res.end("Internal Server Error");
  }
}
`,
);

step("write .vercel/output/config.json");
// Routes evaluated top-down. Static assets first; everything else falls
// through to the SSR function.
writeFileSync(
  resolve(OUT, "config.json"),
  JSON.stringify(
    {
      version: 3,
      routes: [
        { handle: "filesystem" },
        { src: "/.*", dest: "/_render" },
      ],
    },
    null,
    2,
  ),
);

step("done — output ready in .vercel/output");
