# METAMORFIT: SYSTEM UNIFICATION & DIAGNOSIS STRATEGY
## Project Target: "BETA VERSION 2.0"

### 1. THE PROBLEM STATEMENT
We are currently experiencing "Version Drift." Code is fragmented across:
- **Repositories:** `metamorfit-v2` and `metamorfit-beta`.
- **Vercel Projects:** `metamorfit-mvp` (currently live) and `metamorfit-beta`.
- **Current State:** AI models are working in the UI, but the **Brevo Email Integration** is failing to deliver. Credits are being wasted due to redundant deployments.

### 2. ARCHITECTURAL AUDIT CHECKLIST
Antigravity Agent, please perform these checks sequentially to build the diagnosis:

#### A. Environment Variable Sync
- Compare `metamorfit-mvp` Vercel variables vs. `metamorfit-beta` Vercel variables.
- **Key Variables to Verify:** `BREVO_API_KEY`, `SENDER_EMAIL`, `NEXT_PUBLIC_API_URL`, and any `DATABASE_URL`.
- **Goal:** Identify if the "live" MVP project is missing the Brevo keys updated in the Beta branch.

#### B. API & Route Logic Comparison
- Locate the email trigger logic (typically in `/api/send` or `/api/email`).
- Compare the implementation in `metamorfit-v2` vs. `metamorfit-beta`.
- Check the `POST` request headers. Are they targeting the correct Brevo endpoint?

#### C. Cloudflare & DNS Routing
- Inspect Cloudflare Worker routing for `beta.metamorfit.pro`.
- Is the Worker fetching from the `metamorfit-mvp.vercel.app` or `metamorfit-beta.vercel.app`?
- **Hypothesis:** The UI is served from one project, but the API call is hitting a dead repository.

### 3. THE "BETA 2.0" UNIFICATION PATH
Once the diagnosis is complete, we will execute the following:
1. **Source of Truth:** Designate the repo with the functional AI UI as the base.
2. **The Merge:** Port the working Email Logic and Env Variables into a new branch: `release/beta-2.0`.
3. **Vercel Consolidation:** Point the `metamorfit-beta` Vercel project to this new branch and delete/archive the `metamorfit-mvp` project.
4. **Cloudflare Update:** Point all production routes to the unified Vercel deployment.

### 4. SUCCESS CRITERIA
- [ ] UI displays AI results correctly.
- [ ] Brevo logs show successful email delivery to user inbox.
- [ ] Single GitHub Repository active.
- [ ] Single Vercel Project active.