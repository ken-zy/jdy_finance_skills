---
description: Audit and debug a financial model — find formula errors, check BS balance, cash tie-out, and logic sanity
argument-hint: "<path_to_xlsx> [scope: selection|sheet|model]"
allowed-tools: Bash(python3:*), Bash(pip:*), Bash(ls:*)
---

# Debug Model

Audit a financial model (Excel .xlsx) for formula errors, structural issues, and logic problems.

## Context

- User request: $ARGUMENTS
- Today's date: !`date "+%Y-%m-%d"`

## Workflow

### Step 1: Determine Scope

If the user already gave a scope, use it. Otherwise ask:

> What scope do you want me to audit?
> - **selection** — just a specific range
> - **sheet** — the current active sheet only
> - **model** — the whole workbook, including financial-model integrity checks (BS balance, cash tie-out, roll-forwards, logic sanity)

The **model** scope is the deepest — use it for DCF, LBO, 3-statement, merger, comps, or any integrated financial model.

### Step 2: Formula-Level Checks (ALL scopes)

Use Python/openpyxl to scan for:

| Check | What to Look For |
|---|---|
| Formula errors | `#REF!`, `#VALUE!`, `#N/A`, `#DIV/0!`, `#NAME?` |
| Hardcodes inside formulas | `=A1*1.05` — the `1.05` should be a cell reference |
| Inconsistent formulas | A formula that breaks the pattern of its neighbors |
| Off-by-one ranges | `SUM`/`AVERAGE` that misses the first or last row |
| Pasted-over formulas | Cell that looks like a formula but is actually hardcoded |
| Circular references | Intentional or accidental |
| Broken cross-sheet links | References to cells that moved or were deleted |
| Unit/scale mismatches | Thousands mixed with millions, % stored as whole numbers |
| Hidden rows/tabs | Could contain overrides or stale calculations |

### Step 3: Model-Integrity Checks (MODEL scope only)

Identify the model type (DCF / LBO / 3-statement / merger / comps) and run:

**Structural Review:**
- Input/formula separation (blue=input, black=formula convention)
- Tab flow: logical order (Assumptions → IS → BS → CF → Valuation)
- Date headers consistent across all tabs
- Units consistent throughout

**Balance Sheet:**
- Total Assets = Total Liabilities + Equity (every period)
- RE rollforward: Prior RE + Net Income - Dividends = Current RE
- If BS does not balance, quantify the gap per period and trace where it breaks

**Cash Flow Statement:**
- CF Ending Cash = BS Cash (every period)
- CFO + CFI + CFF = delta Cash
- D&A on CF = D&A on IS
- CapEx on CF matches PP&E rollforward on BS

**Income Statement:**
- Revenue ties to segment/product detail
- Tax = Pre-tax income x tax rate (allow for deferred)
- Share count ties to dilution schedule

**Circular References:**
- Interest → debt → cash → interest is common in LBO/3-stmt
- If intentional: verify iteration toggle exists
- If unintentional: trace the loop and flag how to break it

**Logic & Reasonableness:**

| Check | Flag If |
|---|---|
| Growth rates | >100% revenue growth without explanation |
| Margins | Outside industry norms |
| Terminal value dominance | TV > ~75% of DCF EV |
| Hockey-stick | Projections ramp unrealistically in out-years |
| Edge cases | Model breaks at 0% or negative growth |

**Model-Type-Specific Bugs:**

- **DCF**: Discount rate applied to wrong period, TV not discounted back, WACC uses book values, FCF includes interest, tax shield double-counted
- **LBO**: Debt paydown does not match cash sweep, PIK not accruing, exit multiple on wrong EBITDA
- **Merger**: Accretion/dilution uses wrong share count, synergies not phased in, PPA does not balance
- **3-Statement**: WC changes have wrong sign, D&A does not match PP&E schedule, debt maturity mismatch

### Step 4: Report

Output a findings table:

| # | Sheet | Cell/Range | Severity | Category | Issue | Suggested Fix |
|---|---|---|---|---|---|---|

**Severity levels:**
- **Critical** — wrong output (BS does not balance, formula broken, cash does not tie)
- **Warning** — risky (hardcodes, inconsistent formulas, edge-case failures)
- **Info** — style/best-practice (color coding, layout, naming)

For **model** scope, prepend a summary:
> Model type: [DCF/LBO/3-stmt/...] — Overall: [Clean / Minor Issues / Major Issues] — [N] critical, [N] warnings, [N] info

**Do NOT change anything without asking** — report first, fix on request.

## Output

- **Primary**: Audit findings table (in conversation or as `YYYYMMDD-audit-{Model}.md`)
- Prioritized by severity: Critical first, then Warning, then Info
- Each issue includes suggested fix

## Quality Checklist

- [ ] BS balance checked for EVERY period (not just the latest)
- [ ] Cash tie-out verified for every period
- [ ] Hardcoded overrides searched aggressively (the #1 source of silent bugs)
- [ ] Sign convention errors checked (positive vs negative for cash outflows)
- [ ] Hidden rows/tabs inspected
- [ ] Circular references identified as intentional or accidental
- [ ] No changes made without user permission

## Skill Reference

This command invokes the **audit-xls** skill. See `skills/audit-xls/SKILL.md` for the complete audit methodology, model-type-specific checks, and reporting format.
