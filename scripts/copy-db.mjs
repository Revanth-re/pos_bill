// Copies ALL data from the old database to the new one (same schema).
// Usage (PowerShell):
//   $env:OLD_DB="postgresql://...sydney..."; $env:NEW_DB="postgresql://...mumbai..."; node scripts/copy-db.mjs
import pg from "pg";

const OLD = process.env.OLD_DB, NEW = process.env.NEW_DB;
if (!OLD || !NEW) throw new Error("Set OLD_DB and NEW_DB first");
const ssl = process.env.NOSSL ? false : { rejectUnauthorized: false };
const src = new pg.Client({ connectionString: OLD, ssl });
const dst = new pg.Client({ connectionString: NEW, ssl });
await src.connect();
await dst.connect();

const { rows: tables } = await src.query(
  `select table_name from information_schema.tables
   where table_schema='public' and table_type='BASE TABLE' and table_name <> '_prisma_migrations'`
);

// Parent tables first (Business before Staff, etc.) so foreign keys are satisfied.
const { rows: fks } = await src.query(
  `select tc.table_name as child, ccu.table_name as parent
   from information_schema.table_constraints tc
   join information_schema.constraint_column_usage ccu on tc.constraint_name = ccu.constraint_name
   where tc.constraint_type = 'FOREIGN KEY' and tc.table_schema = 'public'`
);
const names = tables.map((t) => t.table_name), ordered = [], seen = new Set();
const visit = (t, stack = new Set()) => {
  if (seen.has(t) || stack.has(t)) return;
  stack.add(t);
  for (const f of fks) if (f.child === t && f.parent !== t) visit(f.parent, stack);
  seen.add(t);
  ordered.push(t);
};
names.forEach((t) => visit(t));
tables.splice(0, tables.length, ...ordered.filter((t) => names.includes(t)).map((table_name) => ({ table_name })));

await dst.query("begin");
await dst.query("set constraints all deferred");
try {
  await dst.query("savepoint r");
  await dst.query("set local session_replication_role = replica"); // skip FK checks if allowed
} catch {
  await dst.query("rollback to savepoint r");
}
try {
  // Clear children first, then copy parents first.
  for (const { table_name: t } of [...tables].reverse()) await dst.query(`delete from "${t}"`);
  for (const { table_name: t } of tables) {
    const q = `"${t}"`;
    let offset = 0, total = 0;
    for (;;) {
      const { rows } = await src.query(
        `select coalesce(json_agg(x), '[]'::json) as data from (select * from ${q} offset $1 limit 1000) x`,
        [offset]
      );
      const data = rows[0].data;
      if (!data.length) break;
      await dst.query(`insert into ${q} select * from json_populate_recordset(null::${q}, $1::json)`, [JSON.stringify(data)]);
      total += data.length;
      offset += 1000;
    }
    console.log(`${t}: ${total} rows`);
  }
  await dst.query("commit");
  console.log("✅ All data copied.");
} catch (e) {
  await dst.query("rollback");
  console.error("❌ Copy failed, nothing changed in the new DB:", e.message);
  process.exitCode = 1;
} finally {
  await src.end();
  await dst.end();
}
