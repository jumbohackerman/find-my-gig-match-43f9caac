# Unread / Last-Activity UX Status

## ✅ Implemented

| Area | What was added | File(s) |
|---|---|---|
| **Notifications panel** | Unread dot indicator per notification + relative timestamp ("2 min temu") | `Navbar.tsx` |
| **My Applications (candidate)** | Relative time since application ("wczoraj", "3 dni temu") next to status badge; removed "Status:" prefix for cleaner look | `ApplicationStatusList.tsx` |
| **Employer job metrics** | "Ostatnia: X temu" showing when the newest application arrived | `Employer.tsx` |
| **Employer candidate cards** | Message count badge (💬 N) when chat has messages | `Employer.tsx` |
| **Chat messages** | Relative timestamp on each message bubble | `ChatPanel.tsx` |
| **Shared utility** | `timeAgo()` — Polish relative time formatter used across all views | `src/lib/timeAgo.ts` |

## ✅ Already Present (no changes needed)

| Area | Notes |
|---|---|
| **Notification bell badge** | Unread count already shown as numeric badge on bell icon |
| **Candidate activity labels** | `getActivityLabel()` already renders "Aktywny dziś" / "X dni temu" on candidate cards |
| **Notification unread highlight** | `bg-accent/5` background already applied to unread notifications |

## ⏳ Depends on live backend for full accuracy

| Area | Notes |
|---|---|
| **True unread message count** | Currently counts all messages per application; a `read_at` or `last_read_message_id` column would be needed for true unread tracking |
| **Candidate-side message badges** | Candidate doesn't have a chat view yet; when added, will need unread indicators |
| **Push / real-time notification count** | Notification badge updates on page load; real-time subscription would keep it live |
| **Application status change timestamps** | `applications` table only has `applied_at`; an `updated_at` column would enable "status changed X ago" |
