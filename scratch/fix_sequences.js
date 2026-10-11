const path = require('path');
const { Client } = require(path.resolve(__dirname, '../apps/backend/node_modules/pg'));

const client = new Client({
  host: 'localhost',
  port: 5432,
  user: 'KidMeal',
  password: 'A5a(sSghC=~oqs£43Up',
  database: 'KidMeal',
});

async function main() {
  await client.connect();
  console.log('Connected to PostgreSQL successfully.');

  const tablesRes = await client.query(`
    SELECT table_name, column_name, column_default
    FROM information_schema.columns
    WHERE table_schema = 'public' AND column_default LIKE 'nextval%'
  `);

  for (const row of tablesRes.rows) {
    const { table_name, column_name, column_default } = row;
    const seqMatch = column_default.match(/'([^']+)'/);
    if (seqMatch) {
      const seqName = seqMatch[1];
      const maxRes = await client.query(`SELECT COALESCE(MAX(${column_name}), 0) AS max_id FROM "${table_name}"`);
      const maxId = Number(maxRes.rows[0].max_id);
      const nextId = Math.max(maxId, 1);
      await client.query(`SELECT setval('${seqName}', ${nextId})`);
      console.log(`Updated sequence ${seqName} for ${table_name}.${column_name} -> ${nextId}`);
    }
  }

  console.log('All sequences updated successfully!');
  await client.end();
}

main().catch(err => {
  console.error('Error fixing sequences:', err);
  process.exit(1);
});
