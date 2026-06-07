# TASK: Recover Personalization Evidence Cards

## PHASE 1: Code Archeology
- [ ] Search `apps/web/src/components` for any file containing "PersonalizationCard" or "MetabolicCard".
- [ ] Locate the logic in the Results Page (`/results`) where the `AI Metabolic Insight` is rendered.
- [ ] Identify if the conditional variables `bodyFat` and `somatotype` are currently being passed to the frontend.

## PHASE 2: Component Restoration
- [ ] Restore the 2-4 card layout grid.
- [ ] Re-implement the "Formula Label" logic (e.g., Katch-McArdle for high BF% vs. Mifflin-St Jeor for standard).
- [ ] Ensure the "Somatotype Tweak" card displays the specific calorie adjustment applied.

## PHASE 3: Styling & Integration
- [ ] Apply the #c9a84c (Gold) and Dark theme styling to match the 2.0 aesthetic.
- [ ] Verify that the cards only appear if the specific data (BF% or Somatotype) was provided by the user.