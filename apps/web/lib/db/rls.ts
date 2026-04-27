import { sql } from "drizzle-orm";
import type { PgDatabase, PgQueryResultHKT } from "drizzle-orm/pg-core";

type DrizzleDatabase = PgDatabase<PgQueryResultHKT, Record<string, never>>;

type SupabaseToken = {
  sub?: string;
  role?: string;
  [key: string]: unknown;
};

export function createDrizzle(
  token: SupabaseToken,
  {
    admin,
    client,
  }: {
    admin: DrizzleDatabase;
    client: DrizzleDatabase;
  }
) {
  return {
    admin,
    rls: (async (transaction, ...rest) => {
      return await client.transaction(async (tx) => {
        try {
          await tx.execute(sql`
            SELECT set_config('request.jwt.claims', '${sql.raw(JSON.stringify(token))}', TRUE);
            SELECT set_config('request.jwt.claim.sub', '${sql.raw(token.sub ?? "")}', TRUE);
            SET LOCAL ROLE authenticated;
          `);
          return await transaction(tx);
        } finally {
          await tx.execute(sql`
            SELECT set_config('request.jwt.claims', NULL, TRUE);
            SELECT set_config('request.jwt.claim.sub', NULL, TRUE);
            RESET ROLE;
          `);
        }
      }, ...rest);
    }) as typeof client.transaction,
  };
}
