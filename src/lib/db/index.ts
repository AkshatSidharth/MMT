import { isSupabaseConfigured } from "@/lib/supabase/config";
import { LocalRepo } from "./local-repo";
import { SupabaseRepo } from "./supabase-repo";
import type { Repo } from "./repo";

const globalForRepo = globalThis as unknown as { __mmtRepo?: Repo };

function build(): Repo {
  return isSupabaseConfigured ? new SupabaseRepo() : new LocalRepo();
}

/** The single data-access entry point for the whole app. */
export const db: Repo = globalForRepo.__mmtRepo ?? build();

if (process.env.NODE_ENV !== "production") globalForRepo.__mmtRepo = db;

export type { Repo } from "./repo";
