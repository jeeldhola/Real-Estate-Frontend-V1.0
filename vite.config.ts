// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";

// Deploy target is driven by the DEPLOY_TARGET env var so we can keep both
// Cloudflare (default, locally) and Vercel (production) builds in one config.
//   - DEPLOY_TARGET=vercel  → builds to .vercel/output (no Cloudflare plugin)
//   - unset / cloudflare    → existing Cloudflare Workers build
const target = process.env.DEPLOY_TARGET === "vercel" ? "vercel" : "cloudflare";

export default defineConfig({
  // Disable the Cloudflare plugin when targeting Vercel; it inspects wrangler.jsonc
  // and would otherwise try to produce a Workers bundle.
  cloudflare: target === "vercel" ? false : undefined,
  tanstackStart: {
    // Redirect TanStack Start's bundled server entry to src/server.ts (our SSR error wrapper).
    server: { entry: "server" },
    // Pass through to Nitro's preset selection.
    ...(target === "vercel" ? { target: "vercel" } : {}),
  },
  // For Vercel we ship dist/server inside a serverless function WITHOUT node_modules,
  // so every SSR dependency must be inlined into the bundle. ssr.noExternal: true
  // tells Vite to bundle all node_modules deps instead of externalizing them.
  vite:
    target === "vercel"
      ? {
          ssr: { noExternal: true },
        }
      : undefined,
});
