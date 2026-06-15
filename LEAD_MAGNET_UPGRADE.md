# Metamorfit Lead Magnet Upgrade Implementation Specification

> [!IMPORTANT]
> **MANDATORY AGENT INSTRUCTION:** This document defines the immediate development sprint to pivot the Metamorfit Alpha application from a multi-tenant SaaS architecture into a hyper-focused, high-converting, bilingual lead magnet funnel. Execute these changes across your workspace (VS Code / Antigravity) while respecting the free-tier performance constraints of Cloudflare and Vercel.

---

## 1. STRATEGIC PHILOSOPHY SHIFT (SAAS TO LEAD MAGNET)

To optimize user acquisition and minimize friction, all traditional SaaS overhead must be stripped from the codebase. The app will function as a single-track, high-velocity lead funnel.

### UI Deletions & Cleanups
- **Sandbox Banner Removal:** Locate and completely remove the sandbox/development banner from the main layout or root wrapper component (`apps/web/src/app/` or corresponding main layout file).
- **Navigation & Auth Stripping:** Remove global headers or footers containing links to "Login," "Sign Up," "Account Settings," "Pricing," or "Dashboard." The onboarding wizard must be the exclusive interactive element on the screen.
- **Frontend Dashboard Bypass:** Eliminate or bypass the complex client-side results dashboard. The application sequence will terminate on a clean, premium, minimalist success screen informing the user that their customized plan is on its way to their inbox. All dense calculated metrics and insights are shifted entirely to the generated PDF.

---

## 2. MOBILE-FIRST UX & VISUAL AESTHETIC OVERHAUL

The front-end design must reflect a cinematic, masculine, and transformation-focused brand identity (drawing inspiration from the "Bulk Brain" aesthetic) optimized heavily for mobile viewports.

### Layout Rules
- **Full-Bleed Vertical Stacking:** Eliminate horizontal grids that compress content on mobile. All forms, biometric sliders, and text card layouts must scale full-bleed across small screens.
- **Thumb-Friendly Touch Targets:** Replace standard HTML checkboxes, radio buttons, or compact dropdown selectors with large, high-contrast, clickable graphic tiles. This applies directly to **Step 4 (Somatotype)** and **Step 2 (Goal Select)**.

### Navigation Guardrails (Steps 2 & 5)
- **Manual Advance Enforcement:** As specified in `ONBOARDING_UX_FLOW.md`, automated progression or "auto-scroll" logic is **strictly forbidden** on Step 2 (Goal Selection) and Step 5 (Activity Level). These screens contain critical physiological breakdowns for the hardgainer archetype.
- **Mobile Button Anchoring:** To make this readable and intuitive on mobile devices, wrap the descriptive prose in a naturally flowing vertical layout. The manual "Next Step" or "Continue" button must be anchored cleanly at the bottom of the viewport, ensuring the user deliberately views the context before advancing.

---

## 3. INTUITIVE & PERSISTENT BILINGUAL INFRASTRUCTURE

Localization must be frictionless, front-loaded, and completely synchronized with the backend data ledger (`MM_LEDGER`).


[ Step 1: Persona Select ] ──> Prominent English / Español Selectors
│
▼
Sets state.locale in Ledger
│
▼
Persistent Header Toggle accessible mid-journey

```

### Onboarding Flow Adjustments
- **Front-Loaded Selection:** Update the very first step (`Step1PersonaSelect`) to display highly intuitive language selectors (English vs. Español) before any biographical data is collected. Selecting a language must immediately initialize the `locale` field.
- **Persistent Header Toggle:** Embed a minimalist, low-profile language toggle into the persistent top header layout. If a user toggles the language mid-journey, the frontend must immediately trigger `i18next.changeLanguage()` and fire a background patch (`PATCH /api/ledger/:userId`) to sync the `locale` field in Cloudflare KV. This ensures the journey remains uninterrupted.
- **Instant Translation of AI Results:** In the final success view or preview components, if the user switches languages, the UI must translate the content seamlessly. Because the underlying AI response keys are locked to English (`paragraph1`, `paragraph2`, `paragraph3`), the worker must supply translated prose directly or the front-end must maintain reactive mappings.

---

## 4. NATIVE AI ENGINE UPGRADE (`@cf/zai-org/glm-4.7-flash`)

We are replacing generic text generation bindings with Cloudflare’s native multilingual model to ensure zero external API dependencies and exceptional language cross-compatibility.

### Worker Optimization
- **Native Edge Binding:** In `packages/macro-engine/src/explanation.ts`, update the inference execution block to utilize the native Cloudflare Workers AI model routing string:
  ```typescript
  const response = await env.AI.run('@cf/zai-org/glm-4.7-flash', {
    messages: [ ... ],
    response_format: { type: "json_object" }
  });

```

* **Strict Schema Enforcement:** The prompt logic must command the model to output a perfectly structured JSON object matching our strict schema, regardless of the target language:
```json
{
  "paragraph1": "string (Focus on their specific body type, goal, and metabolic rate)",
  "paragraph2": "string (Focus on how the protein and energy balance supports them)",
  "paragraph3": "string (Focus on adherence and a supportive closing)"
}

```


* **Multilingual System Prompting:** When `locale === 'es'`, the prompt must append a non-negotiable instruction: *Write the JSON string values entirely in fluent, masculine, motivating Castilian Spanish, but keep the keys exactly as 'paragraph1', 'paragraph2', and 'paragraph3'.*

### Niche Nutrition Context

* To make the AI explanations highly actionable for the hardgainer/skinny-guy demographic, instruct the model to ground its nutritional examples in caloric-dense, high-performance clean staples. Ensure the prompt guides the AI to naturally reference optimized muscle-building ingredients such as **quinoa, spinach, and feta cheese** when describing meal composition and macronutrient adherence.

---

## 5. THE LEAD CAPTURE HANDSHAKE (STEP 6)

The termination of the onboarding flow acts as the primary lead conversion gate.

* **The Email Capture Element:** Modify **Step 6 (Calibrate)**. Instead of directing the user to a SaaS registration or password creation panel, display a single, high-converting input field requesting their email address.
* **The Value Exchange Mechanism:** Clear out any SaaS text and align the copywriting completely around the instant delivery of the premium asset. The interface must communicate that their personalized, AI-analyzed transformation manual is being compiled and will be routed to their inbox immediately.
* **Downstream Dispatch:** Upon submission of the email, `POST /api/ledger/:userId/finalize` is invoked. The finalizer worker will calculate the deterministic macro splits, run the `@cf/zai-org/glm-4.7-flash` model, record the synchronized `locale`, and forward the unified state document to the PDF Orchestrator to generate the A4 asset via Gotenberg and dispatch the download URL via Brevo.
"""

with open("LEAD_MAGNET_UPGRADE.md", "w", encoding="utf-8") as f:
f.write(content)

print("File LEAD_MAGNET_UPGRADE.md generated successfully.")

```
Your Markdown specification file for the AI coding agents is ready.
[file-tag: code-generated-file-0-1781501757691072437]

### Executive Summary of the Implementation Plan

The generated document, `LEAD_MAGNET_UPGRADE.md`, is structured specifically as a direct, authoritative instruction set for your AI coding agents working within your VS Code / Antigravity workspace. It ensures that the transition from a SaaS model to a high-converting lead magnet is executed flawlessly without breaking your existing technical boundaries. 

Key architectural and product elements handled in this technical specification file include:

1. **SaaS Deletion Protocols:** Explicit directives to strip out all authentication, password screens, global navigation, and the frontend dashboard. It shifts the value delivery entirely to your Gotenberg PDF asset and simplifies the final app view to a minimalist success page. It also explicitly orders the removal of the sandbox banner from the root layout wrapper.
2. **Mobile-First Touch Architecture:** Re-mapping the user interface to force full-bleed vertical structures and conversion of input elements (especially the Somatotype and Goal selectors) into large, thumb-friendly graphical tiles. It also details how to properly anchor the manual navigation buttons on the mobile viewport for Steps 2 and 5 to uphold your reading guardrails.
3. **Bilingual Continuity:** Re-engineering Step 1 to make language selection prominent right at the start, establishing a persistent but subtle header toggle, and ensuring that any mid-journey change instantly synchronizes with the `MM_LEDGER` via background patches.
4. **Native `@cf/zai-org/glm-4.7-flash` Edge Configuration:** Providing the exact setup for your main engine to execute native Cloudflare Workers AI calls using the GLM model. It dictates how to force the multilingual output into the English JSON keys (`paragraph1`, `paragraph2`, `paragraph3`) so your parser never crashes. Additionally, it seeds the AI system prompt to contextualize muscle-building logic for hardgainers using optimal, calorie-dense staple suggestions like quinoa, spinach, and feta cheese.
5. **The Ultimate Handshake:** Redesigning Step 6 purely around lead capture, substituting complex account creation for a high-converting email input that triggers the asynchronous Gotenberg $\rightarrow$ R2 $\rightarrow$ Brevo delivery sequence.
```