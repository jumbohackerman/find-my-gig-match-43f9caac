# Time, Date, and Money Conventions

**Status**: Active  
**Last updated**: 2026-03-09  

This document defines the standard conventions for formatting time, dates, and money across the application to ensure consistency, specifically tailored for the Polish market.

---

## 1. Time and Date Conventions

### Backend vs. UI
- **Backend (Supabase)**: All timestamps MUST be stored and queried in **UTC** (`timestamptz`). No exceptions.
- **Frontend (UI)**: Timestamps MUST be converted to the user's local timezone (or `Europe/Warsaw` for Polish context) exactly at the point of display.

### Formatting Rules (Polish locale: `pl-PL`)
- **Relative Dates (Time Ago)**: 
  - Use relative dates for recent events (e.g., "5 min temu", "2 godz. temu", "wczoraj").
  - Use `src/lib/timeAgo.ts` for consistency.
  - Threshold: Switch to absolute dates for anything older than 30 days.
- **Absolute Dates**:
  - Format: `DD MMM` (e.g., "12 mar") for current year.
  - Format: `DD MMM YYYY` (e.g., "12 mar 2024") for previous years.
  - Exclude the time (HH:MM) unless specifically dealing with scheduled events (e.g., interviews).

---

## 2. Money and Salary Conventions

### Salary Range Structure
- Salary ranges MUST always follow the format: `[min] - [max] [CURRENCY]` (e.g., "18 000 - 25 000 PLN").
- If min equals max, display as a single number: `[amount] [CURRENCY]` (e.g., "20 000 PLN").

### Currency Rules
- **Default Currency**: `PLN` (Polish Złoty).
- **Display format**: Use the ISO currency code (`PLN`, `EUR`, `USD`) or standard symbol where appropriate (`zł`). `zł` is preferred for UI friendliness in Polish text, with a non-breaking space (e.g., "15 000 zł").
- Always use spaces as thousand separators (e.g., `15 000`, not `15,000` or `15000`).

### Salary Period Rules
- **Default Period**: Monthly (`miesięcznie` or `/msc`).
- Always explicitly state the period if it is not monthly (e.g., `/godz`, `/rok`), or handle it via UI context labels.

### Missing or Incomplete Salary Data
- **Missing Salary**: If no salary data is provided, display: `"Wynagrodzenie nie podane"` or `"Do negocjacji"` (depending on context/employer input).
- **Incomplete Range**: If only min or max is provided:
  - Min only: `"od [min] [CURRENCY]"` (e.g., "od 15 000 zł").
  - Max only: `"do [max] [CURRENCY]"` (e.g., "do 25 000 zł").

---

## 3. Implementation Guidelines

### Core Formatters
Use the central formatter utilities defined in `src/lib/utils.ts` and `src/lib/timeAgo.ts`. Do not use arbitrary `.toLocaleDateString()` or string concatenation for currency across components.

**Date Formatter:**
Rely on `Intl.DateTimeFormat` configured with `'pl-PL'`.

**Money Formatter:**
Rely on `Intl.NumberFormat('pl-PL', { style: 'currency', currency: 'PLN', maximumFractionDigits: 0 })`.

### Consistency Checklist
- [x] **Cards**: Swipe cards display salary with `zł` formatting and fallback to "Wynagrodzenie nie podane".
- [x] **Modals**: Job details display fully formatted salary ranges.
- [x] **Lists**: Application and messages lists use relative time (e.g., "2 godz. temu").
- [x] **Dashboards**: Employer metrics use absolute dates for historical data.
