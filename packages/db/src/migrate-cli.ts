#!/usr/bin/env node
import { createPool, closePool } from './pool.js';
import { migrate } from './migrate.js';

async function main() {
  const pool = createPool();
  try {
    const applied = await migrate(pool);
    console.log(JSON.stringify({ ok: true, applied }));
  } finally {
    await pool.end();
    await closePool();
  }
}

main().catch((error) => {
  console.error(error);
  process.exit(1);
});
