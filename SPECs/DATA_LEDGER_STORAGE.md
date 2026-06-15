# Data Ledger & Storage Technical Specification

This document serves as the technical specification for our state management and Cloudflare KV data pipelines, ensuring that future agents understand exactly how user data is persisted and synchronized across our edge architecture.

## 1. KV NAMESPACE CONFIGURATION

Our edge architecture relies on Cloudflare KV for globally distributed state resolution. The exact KV bindings configured in `wrangler.jsonc` and `wrangler.toml` are:

- **`MM_LEDGER`**: Primary data store for the multi-step onboarding flow and state consolidation.
- **`JOB_STATUS`**: Dedicated job tracking namespace used by the async generation pipeline to manage PDF creation, AI execution, and email delivery progress.
- **`MEAL_CACHE`**: Used to cache metabolic calculation outputs or external AI generations.

## 2. KEY NAMING CONVENTIONS

We maintain strict naming conventions for retrieving data from KV to ensure collision-free namespaces:

- **JOB_STATUS Keys:** `job:[jobId]` (e.g., `job:550e8400-e29b-41d4-a716-446655440000`)
- **MM_LEDGER Keys:** Standard `[userId]` represented as a UUIDv4 (e.g., `550e8400-e29b-41d4-a716-446655440000`). No prefix is used.

*Note: Strict Time-to-Live (TTL) parameters are universally applied to avoid storage bloat. `JOB_STATUS` entries expire after 24 hours (`86400` seconds), while `MM_LEDGER` entries expire after 72 hours (`259200` seconds).*

## 3. USER LEDGER ARCHITECTURE

The **User Ledger** acts as a state machine that orchestrates data synchronization for users navigating the UI onboarding sequence.

**Ledger Entry Schema:**
```json
{
  "userId": "uuid",
  "locale": "en | es",
  "status": "in_progress | complete",
  "currentStep": 1,
  "data": { /* Form answers are accumulated here */ },
  "personalizationCards": [ /* Generated metabolic insight cards */ ],
  "createdAt": "ISO-8601 string",
  "updatedAt": "ISO-8601 string",
  "results": {
    "metrics": { /* Final calculated BMR, TDEE, Macros */ },
    "aiInsight": "string"
  }
}
```

**State Mutations & Orchestration Flow:**
1. **Initialization (`POST /api/ledger/init`)**: A new UUID is assigned, and the initial schema is seeded with `status: "in_progress"` and `currentStep: 1`.
2. **Progression (`PATCH /api/ledger/:userId`)**: As the user answers questions on the frontend, patches are sent. The worker reads the current state, merges new form answers into the `data` object, updates `currentStep`, and writes the consolidated state back to KV.
3. **Finalization (`POST /api/ledger/:userId/finalize`)**: The engine calculates all metabolic metrics, generates UX personalization cards, queries the AI engine for the contextual explanation, and mutates the status to `complete`. A webhook handshake is then fired to the backend PDF Orchestrator.

## 4. EVENTUAL CONSISTENCY MITIGATION

Because Cloudflare KV is eventually consistent, we implement several defensive coding strategies to prevent race conditions during high-speed mutations across edge workers:

- **Strict Read-Modify-Write Verification:** Both the Ledger (`PATCH /api/ledger`) and the Pipeline tracker (`updateJobStatus`) explicitly read the entire existing state from KV first, execute deep merges (`existing.data` with `patchData`, or merging specific `delivery`/`results` objects), and then write the entire updated document back to KV.
- **Localized State Handshakes:** Instead of triggering the PDF workflow and asking the secondary worker to pull the latest results from KV (which might return stale data due to propagation delays), the ledger finalizer passes the *entire, fully-resolved state document* via the network payload: `body: JSON.stringify({ userId: id, results: entry })`. This network-context pass guarantees the receiving worker operates on exactly synchronized data without risking KV race conditions.
