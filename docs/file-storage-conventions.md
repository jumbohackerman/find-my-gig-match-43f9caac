# File and Storage Conventions

**Status**: Active  
**Last updated**: 2026-03-09  

This document defines the conventions for file storage, bucket structuring, and access control using Supabase Storage across the application.

---

## 1. Bucket Naming & Path Structure

All files must be stored in specific buckets based on their access patterns and content type. Paths MUST use UUIDs to establish clear ownership and enable Row Level Security (RLS).

### Buckets
- **`cvs`**: Private bucket. Stores candidate resumes and attachments.
- **`logos`** (planned): Public bucket. Stores company logos and branding assets.

### Path Structure
Paths are always prefixed with the owner's UUID (either `user_id` or `company_id`) to simplify RLS policies and garbage collection.

- **CVs**: `cvs/{user_id}/{filename}`
- **Company Logos**: `logos/{company_id}/{filename}`

---

## 2. File Naming Conventions

### CV File Naming
- **Format**: `cv_{timestamp}.pdf` or `resume_{timestamp}.pdf`
- **Example**: `cv_1709981234567.pdf`
- **Why**: Appending a timestamp (e.g., `Date.now()`) prevents caching issues when replacing files and avoids complex versioning logic. The original filename is not preserved in storage to prevent accidental PII leakage via URLs.

### Company Logo Naming
- **Format**: `logo_{timestamp}.{ext}`
- **Example**: `logo_1709981234567.png`
- **Why**: Timestamps prevent CDN caching issues when a company updates their logo.

---

## 3. Replace, Remove, and Versioning Behavior

- **Versioning**: We do NOT maintain historical versions of files in storage. A user has one active CV; a company has one active logo.
- **Replace**: 
  1. Upload the new file with a new timestamped name.
  2. Update the database record (`candidates.cv_url` or `companies.logo_url`) to point to the new path.
  3. Delete the old file from storage.
  *Note: Do not overwrite the exact same filename, as browsers and CDNs may cache the old version.*
- **Remove**: 
  1. Delete the file from the storage bucket.
  2. Nullify the reference in the corresponding database record.

---

## 4. Access Control (RLS Policies)

Access is enforced strictly at the database level via Supabase Storage RLS policies.

### `cvs` Bucket (Private)
- **Insert/Update/Delete**: Restricted to the candidate who owns the folder (`(storage.foldername(name))[1] = auth.uid()::text`).
- **Select (Read)**: 
  - The candidate who owns the file.
  - Employers who have an active application from the candidate (verified via `applications` table).
  - Platform Admins.

### `logos` Bucket (Public)
- **Insert/Update/Delete**: Restricted to company members with `admin` or `owner` roles (verified via `company_members` table matching the folder name).
- **Select (Read)**: Publicly accessible to everyone.

---

## 5. Account Deletion and Data Cleanup

When an entity (User or Company) is deleted from the platform, their associated files must be purged to comply with privacy regulations (e.g., GDPR).

- **Current Implementation**: Manual or handled via client-side deletion sequence.
- **Target Implementation**: 
  - A Supabase Edge Function (`cleanup-storage`) or a Postgres trigger on `auth.users` / `companies` deletion that iterates through the respective bucket folders (`cvs/{user_id}/` or `logos/{company_id}/`) and deletes all objects within them.
  - Periodic orphan-check script to find files in storage that have no corresponding database record.

---

## 6. Supported Formats and Limits

- **CVs**: 
  - Formats: `.pdf` only.
  - Max Size: 5MB.
- **Company Logos**: 
  - Formats: `.png`, `.jpg`, `.jpeg`, `.webp`, `.svg`.
  - Max Size: 2MB.
  - Recommended Aspect Ratio: 1:1 (Square).