# Source of Truth & Sync Discipline

**Status**: Active  
**Last updated**: 2026-03-09  

This document defines the strict source-of-truth hierarchy and synchronization discipline for this project to prevent divergence between the Lovable workspace and the GitHub repository.

---

## 1. Source of Truth Hierarchy

The source of truth shifts depending on the phase of development.

### Active Development Phase
- **Primary Source of Truth**: **Lovable Workspace**
- **When it overrides GitHub**: During active prompting and code generation. The state held in the Lovable editor (code, environment, dependencies) temporarily supersedes GitHub until the auto-sync completes.

### Release & Deployment Phase
- **Primary Source of Truth**: **GitHub Repository (`main` branch)**
- **When to treat as release truth**: For all CI/CD pipelines, staging/production deployments, and historical auditing. If code exists in Lovable but hasn't synced to GitHub, it is not considered "shippable" truth.

### Internal Code vs. Documentation
When code and documentation diverge within the workspace, the hierarchy is:
1. `src/domain/models.ts` (Canonical domain models)
2. `supabase/migrations/` (Actual database schema)
3. `docs/*.md` (Architectural and status documentation)
4. UI Components

---

## 2. Sync Verification Workflow

Lovable features a bidirectional sync with GitHub, but it requires active verification to ensure consistency.

### How to verify a successful sync
1. **Trigger**: Finish a set of prompts or structural changes in Lovable.
2. **Observe**: Check the GitHub commit history. Lovable automatically pushes commits (usually formatted as `Update [file]`).
3. **Verify**: The timestamp of the latest GitHub commit should match your last Lovable interaction.
4. **CI Check**: Ensure the `.github/workflows/ci.yml` pipeline passes (linting, type checking, tests).

### What to inspect after push
- **Migration Files**: Did new `supabase/migrations/` files get committed?
- **Config Changes**: Were modifications to `package.json`, `vite.config.ts`, or `tailwind.config.ts` successfully captured?
- **Docs**: Did the updated `docs/` markdown files push alongside the code?

---

## 3. Handling Divergence

If you suspect the Lovable workspace and GitHub have diverged (e.g., due to external manual commits or sync delays):

### First files to check
1. `package.json` (Check for dependency drift)
2. `src/domain/models.ts` (Check for type/domain drift)
3. `supabase/migrations/` (Check for database state drift)

### Resolution Path
1. **If Lovable has the latest work**: Make a minor non-breaking change (e.g., a comment update) in Lovable to force a new sync and push to GitHub.
2. **If GitHub has the latest work** (e.g., a colleague pushed a branch/PR): Ensure Lovable has processed the incoming webhook. Refresh the Lovable workspace. If Lovable doesn't reflect the changes, avoid making new Lovable edits that conflict with the GitHub state until the sync completes.

---

## 4. Avoiding Future Code/Docs Drift

- **Atomic Updates**: Always request the AI to update documentation (`docs/`) in the exact same prompt as the code changes.
- **No Rogue Migrations**: Never manually alter the Supabase database via the external Supabase dashboard without simultaneously pulling the resulting SQL down or generating it via Lovable migrations.
- **Reference Docs First**: Start complex prompts by telling the AI to "read `docs/[relevant-doc].md`" to ensure it grounds its context in the agreed-upon architecture.
