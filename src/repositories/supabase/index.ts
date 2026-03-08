/**
 * Barrel export for Supabase repository implementations.
 *
 * To switch from mock to Supabase, update src/providers/registry.ts:
 *   import { supabaseJobRepository } from "@/repositories/supabase";
 *   registerProvider("jobs", supabaseJobRepository);
 */

export { supabaseJobRepository } from "./jobs";
export { supabaseApplicationRepository } from "./applications";
