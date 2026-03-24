## Bug Report Format

For each bug or deviation found, produce one entry following this exact structure:

---
**Bug ID:** BUG-[sequential number]
**Title:** [Short descriptive title, e.g., "Login button missing on mobile viewport"]
**Severity:** Critical | High | Medium | Low
**Priority:** P1 | P2 | P3 | P4
**Environment:** Browser: [browser+version], OS: [OS], App URL: [url], Viewport: [widthxheight]
**Mockup Reference:** [Page name / section / mockup file and timestamp/frame] *(if applicable)*
**Screenshot (Actual):** [Path to screenshot, or description]

**Steps to Reproduce:**
1. Open [URL]
2. Navigate to [page/section]
3. [Any additional steps]

**Expected Behavior:**
[Describe what was expected — per spec, mockup, or requirement]

**Actual Behavior:**
[Describe what was observed — the deviation or defect]

**Suggested Fix:**
[Brief guidance for the developer]

---

After all individual bug entries, append a Bug Summary Table:

| Bug ID | Title | Severity | Priority | Status |
|--------|-------|----------|----------|--------|
| BUG-001 | ... | High | P2 | Open |
