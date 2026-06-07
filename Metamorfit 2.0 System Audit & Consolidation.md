# Metamorfit 2.0 System Audit & Consolidation

## PHASE 1: Discovery
- [ ] List all active Workers in the Cloudflare Account.
- [ ] Identify the 'Last Modified' timestamp for:
    - metamorfit-worker-beta
    - metamorfit-worker
    - metamorfit-main-engine
    - metamorfit-pdf-workflow

## PHASE 2: Logic Comparison
- [ ] Compare `index.js/ts` of `metamorfit-worker-beta` vs `metamorfit-main-engine`.
- [ ] Verify if the 75-day transformation logic is present in `metamorfit-main-engine`.

## PHASE 3: Cleanup & Routing
- [ ] Update `wrangler.toml` to ensure the name is strictly `metamorfit-main-engine`.
- [ ] Check UI environment variables: Is the Frontend fetching from the NEW or OLD worker URL?
- [ ] Decommission redundant workers after confirmation.