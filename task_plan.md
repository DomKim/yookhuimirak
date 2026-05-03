# Task Plan: con13 Publishing Implementation

## Goal
Implement `con13` for the yookhuimirak landing page with the required PSD workflow. The section needs a left-height-based scroll experience: the right card column scrolls upward first, then once the right side reaches the end, the left and right areas continue scrolling together naturally. Keep rltv height chains, margin-top flow, strong grouping, and overflow-hidden crop for the food image.

## Current Phase
Phase 6

## Phases

### Phase 1: Rules & Session Setup
- [x] Read required workflow documents.
- [x] Output numbered rule list before STEP 0.
- [x] Confirm target section is `con13`.
- **Status:** complete

### Phase 2: STEP 0 Data Extraction
- [x] Inspect existing HTML/CSS/JS without overwriting user changes.
- [x] Run PSD stroke guard on parsed PSD.
- [x] Run section-finder and psd-to-spec for `con13`.
- [x] Run spec stroke guard.
- [x] Run image-analyzer for `con13` images.
- [x] Verify canvas is 1905.
- [x] Extract fontFamily mapping.
- [x] Review previous completed plan patterns.
- **Status:** complete

### Phase 3: STEP 1 Plan
- [x] Mark workflow harness-prep.
- [x] Generate plan with spec-to-plan.
- [x] Run structure-shadow if useful.
- [x] Adjust plan structure only, preserving PSD numbers.
- [x] Run plan-advisor.
- [x] Pass plan-checker.
- **Status:** complete

### Phase 4: STEP 2 User Approval
- [x] Fill plan ASCII field.
- [x] Present structure tree, numeric table, ASCII layout, and do-not list.
- [x] Wait for user approval before implementation.
- **Status:** complete

### Phase 5: STEP 3 Implementation
- [x] Generate CSS draft with plan-to-css.
- [x] Update con13 HTML/CSS/JS after approval.
- [x] Preserve grouped scroll stage, right-card stack, left height basis, and food crop overflow.
- **Status:** complete

### Phase 6: STEP 4 Verification
- [x] Run CSS rule harness.
- [x] Run final harness with selector.
- [x] Use Playwright to verify scroll interaction and screenshot.
- **Status:** complete

## Decisions Made
| Decision | Rationale |
|----------|-----------|
| Target section is `con13` on the main landing page. | User explicitly requested `con13`. |
| Second and third attached screenshots are references for remaining cards, not separate implementation targets. | User explicitly clarified this. |
| Do not edit implementation files until ASCII approval. | Workflow hard requirement. |
| Use `pb` as the right-card scroll travel distance instead of a spacer div. | Plan checker blocks empty spacer elements; sticky range can be represented by padding/travel. |
| Use transform-based pinning instead of CSS `position:sticky`. | Ancestor sections use overflow clipping; JS-driven transform keeps the left stage fixed smoothly and then releases it. |

## Errors Encountered
| Error | Attempt | Resolution |
|-------|---------|------------|
| Card photos rendered 1.42px narrower than their 541px source width. | Checked rendered width in final harness. | Recomputed photo width against the 762px content box created by 1px card borders. |
