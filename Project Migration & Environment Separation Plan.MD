# Project Migration & Environment Separation Plan
**Brand:** Metamorfit
**Objective:** Isolate "Next Version" development from the "Live Version" by establishing two parallel environments, resolving Cloudflare deployment errors, and backing up uncommitted changes securely within the Antigravity cloud workspace.

---

## Current Architecture vs. Target Architecture

### Current Status (Conflicted)
* Single pipe: `metamorfit-beta` (GitHub) → `metamorfit-worker-beta` (Cloudflare)
* Issue: V2 features (`Buffer` implementation/modifications) accidentally written directly over the live branch, resulting in 8 uncommitted files and a broken Cloudflare build.

### Target Setup (Parallel Pipes)
1. **Production Pipeline (Stable Live):** * `metamorfit-beta` repo → `metamorfit-worker-beta` Cloudflare worker.
2. **Development Pipeline (V2 Sandbox):** * `metamorfit-v2` repo → `metamorfit-worker-v2` Cloudflare worker.

---

## Phase 1: Resource Isolation & Backup (Credit-Efficient)
To prevent data loss, the modified workspace assets must be cached locally within the cloud environment before resetting the Git tree.

### Critical Files to Salvage:
* `metamorfit-worker/index.ts` (Core V2 Logic)
* `metamorfit-worker/renderhtml.ts` (HTML Render Pipeline)
* `metamorfit-worker/wrangler.toml` (Environment bindings)

---

## Phase 2: Live Branch Recovery (Clean Slate)
1. Discard uncommitted changes across all 8 modified files in GitHub Desktop.
2. Push a lightweight, non-breaking update (e.g., newline change in documentation) to `metamorfit-beta` to trigger a successful Cloudflare production build and clear the error state.

---

## Phase 3: V2 Environment Initialization
1. Establish a brand-new directory structure for `metamorfit-v2`.
2. Re-introduce the salvaged backup files into the new repository environment.
3. Configure a secondary Cloudflare Worker (`metamorfit-worker-v2`) tracking the new repo to resolve the `Buffer` handling issues independently.