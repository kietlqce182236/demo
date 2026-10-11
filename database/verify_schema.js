#!/usr/bin/env node

/**
 * KidMeal — Automated Schema & Seed Verification Runner (BIGSERIAL Version)
 * Standalone offline validator with ZERO external dependencies.
 *
 * Usage:
 *   node database/verify_schema.js
 *   node database/verify_schema.js --json
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal formatting
const isTTY = process.stdout.isTTY;
const c = {
  reset: isTTY ? '\x1b[0m' : '',
  green: isTTY ? '\x1b[32m' : '',
  red: isTTY ? '\x1b[31m' : '',
  yellow: isTTY ? '\x1b[33m' : '',
  cyan: isTTY ? '\x1b[36m' : '',
  bold: isTTY ? '\x1b[1m' : '',
};

const isJsonMode = process.argv.includes('--json');

// Resolve files
function resolveFile(filename) {
  const candidates = [
    path.resolve(__dirname, filename),
    path.resolve(__dirname, '..', 'database', filename),
    path.resolve(process.cwd(), 'database', filename),
  ];
  for (const p of candidates) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const schemaFile = resolveFile('schema.sql');
const seedFile = resolveFile('seed.sql');

if (!schemaFile || !seedFile) {
  console.error(`${c.red}${c.bold}[FATAL]${c.reset} Required SQL files not found!`);
  if (!schemaFile) console.error(`  Missing: schema.sql`);
  if (!seedFile) console.error(`  Missing: seed.sql`);
  process.exit(1);
}

// ─────────────────────────────────────────────────────────────
// SQL Parser (Comment Removal + Statement Splitting)
// ─────────────────────────────────────────────────────────────

function cleanComments(sql) {
  let result = '';
  let i = 0;
  const len = sql.length;
  let inSingleQuote = false;
  let inDollarQuote = false;

  while (i < len) {
    if (!inSingleQuote && !inDollarQuote) {
      if (sql[i] === '-' && sql[i + 1] === '-') {
        while (i < len && sql[i] !== '\n') i++;
        result += '\n';
        continue;
      }
      if (sql[i] === '/' && sql[i + 1] === '*') {
        i += 2;
        while (i < len && !(sql[i] === '*' && sql[i + 1] === '/')) i++;
        i += 2;
        continue;
      }
      if (sql[i] === '$' && sql[i + 1] === '$') {
        inDollarQuote = true;
        result += '$$';
        i += 2;
        continue;
      }
      if (sql[i] === "'") {
        inSingleQuote = true;
        result += "'";
        i++;
        continue;
      }
    } else if (inSingleQuote) {
      if (sql[i] === "'") {
        if (sql[i + 1] === "'") {
          result += "''";
          i += 2;
          continue;
        } else {
          inSingleQuote = false;
        }
      }
      result += sql[i];
      i++;
      continue;
    } else if (inDollarQuote) {
      if (sql[i] === '$' && sql[i + 1] === '$') {
        inDollarQuote = false;
        result += '$$';
        i += 2;
        continue;
      }
      result += sql[i];
      i++;
      continue;
    }
    result += sql[i];
    i++;
  }
  return result;
}

function splitStatements(cleanedSql) {
  const stmts = [];
  let cur = '';
  let i = 0;
  const len = cleanedSql.length;
  let inSingleQuote = false;
  let inDollarQuote = false;

  while (i < len) {
    const ch = cleanedSql[i];
    if (!inSingleQuote && !inDollarQuote) {
      if (ch === '$' && cleanedSql[i + 1] === '$') {
        inDollarQuote = true;
        cur += '$$';
        i += 2;
        continue;
      }
      if (ch === "'") {
        inSingleQuote = true;
        cur += "'";
        i++;
        continue;
      }
      if (ch === ';') {
        if (cur.trim()) stmts.push(cur.trim());
        cur = '';
        i++;
        continue;
      }
    } else if (inSingleQuote) {
      if (ch === "'") {
        if (cleanedSql[i + 1] === "'") {
          cur += "''";
          i += 2;
          continue;
        } else {
          inSingleQuote = false;
        }
      }
      cur += ch;
      i++;
      continue;
    } else if (inDollarQuote) {
      if (ch === '$' && cleanedSql[i + 1] === '$') {
        inDollarQuote = false;
        cur += '$$';
        i += 2;
        continue;
      }
      cur += ch;
      i++;
      continue;
    }
    cur += ch;
    i++;
  }
  if (cur.trim()) stmts.push(cur.trim());
  return stmts;
}

// ─────────────────────────────────────────────────────────────
// Catalog Extraction
// ─────────────────────────────────────────────────────────────

const rawSchemaSql = fs.readFileSync(schemaFile, 'utf8');
const rawSeedSql = fs.readFileSync(seedFile, 'utf8');

const schemaStatements = splitStatements(cleanComments(rawSchemaSql));
const seedStatements = splitStatements(cleanComments(rawSeedSql));

const catalog = {
  tables: {},
  indexes: [],
  triggers: [],
  seedInserts: {},
};

// Parse Schema
for (const stmt of schemaStatements) {
  // CREATE TABLE
  const tableMatch = stmt.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)\s*\(([\s\S]+)\)/i);
  if (tableMatch) {
    const tableName = tableMatch[1].toLowerCase();
    const body = tableMatch[2];
    const columns = [];
    const foreignKeys = [];

    const lines = body.split('\n');
    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('--')) continue;

      const colMatch = line.match(/^([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_()]+)/i);
      if (colMatch && !['CONSTRAINT', 'PRIMARY', 'UNIQUE', 'CHECK', 'FOREIGN'].includes(colMatch[1].toUpperCase())) {
        columns.push(colMatch[1].toLowerCase());
      }

      const fkMatch = line.match(/REFERENCES\s+([a-zA-Z0-9_]+)\s*\(([a-zA-Z0-9_]+)\)/i);
      if (fkMatch) {
        foreignKeys.push({
          sourceColumn: colMatch ? colMatch[1].toLowerCase() : null,
          targetTable: fkMatch[1].toLowerCase(),
          targetColumn: fkMatch[2].toLowerCase(),
        });
      }
    }

    catalog.tables[tableName] = { columns, foreignKeys };
  }

  // CREATE INDEX
  const idxMatch = stmt.match(/CREATE\s+(UNIQUE\s+)?INDEX\s+([a-zA-Z0-9_]+)\s+ON\s+([a-zA-Z0-9_]+)/i);
  if (idxMatch) {
    catalog.indexes.push({
      isUnique: !!idxMatch[1],
      indexName: idxMatch[2],
      tableName: idxMatch[3].toLowerCase(),
    });
  }

  // CREATE TRIGGER
  const trigMatch = stmt.match(/CREATE\s+TRIGGER\s+([a-zA-Z0-9_]+)\s+.*ON\s+([a-zA-Z0-9_]+)/i);
  if (trigMatch) {
    catalog.triggers.push({
      triggerName: trigMatch[1],
      tableName: trigMatch[2].toLowerCase(),
    });
  }
}

// Parse Seed & Initial Inserts
for (const stmt of [...schemaStatements, ...seedStatements]) {
  const insertMatch = stmt.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)/i);
  if (insertMatch) {
    const tbl = insertMatch[1].toLowerCase();
    catalog.seedInserts[tbl] = (catalog.seedInserts[tbl] || 0) + 1;
  }
}

// ─────────────────────────────────────────────────────────────
// Verification Suites
// ─────────────────────────────────────────────────────────────

const errors = [];
const warnings = [];
const passedSuites = [];

function assert(condition, message) {
  if (!condition) { errors.push(message); return false; }
  return true;
}

function warn(condition, message) {
  if (!condition) warnings.push(message);
}

// ── Suite 1: File Hygiene ──
function verifySuite1() {
  assert(rawSchemaSql.includes('BEGIN;') && rawSchemaSql.includes('COMMIT;'),
    'schema.sql must be wrapped in a transaction (BEGIN ... COMMIT)');
  assert(rawSeedSql.includes('BEGIN;') && rawSeedSql.includes('COMMIT;'),
    'seed.sql must be wrapped in a transaction (BEGIN ... COMMIT)');
  passedSuites.push('Suite 1: File Hygiene & Transaction Boundaries');
}

// ── Suite 2: Required Tables (10 Groups) ──
const REQUIRED_TABLES = {
  '1. Người dùng & Phân quyền': ['users', 'roles', 'user_roles', 'staff_profiles', 'parent_profiles'],
  '2. Trường – Lớp – Học sinh': ['schools', 'classes', 'students', 'student_parents'],
  '3. Dị ứng': ['allergens', 'student_allergies'],
  '4. Thực phẩm & Dinh dưỡng': ['food_categories', 'food_ingredients', 'dish_categories', 'dishes', 'dish_recipes', 'dish_nutrition', 'nutrition_conversion_factors', 'nutritional_standards', 'nutrition_rule_codes'],
  '5. Thực đơn': ['menu_cycles', 'menus', 'menu_versions', 'menu_days', 'menu_meals', 'menu_dishes', 'menu_rule_violations'],
  '6. Dịch vụ Ăn xế': ['snack_service_periods', 'snack_registrations', 'payments', 'snack_daily_rosters'],
  '7. Vận hành hàng ngày': ['daily_meal_portions', 'meal_attendances', 'meal_notes'],
  '8. An toàn thực phẩm': ['food_inspections', 'inspection_images', 'food_samples'],
  '9. Tăng trưởng & Phản hồi': ['physical_measurements', 'growth_zscores', 'parent_evaluations', 'evaluation_replies'],
  '10. Hỗ trợ hệ thống': ['notifications', 'system_configs'],
};

function verifySuite2() {
  let totalRequired = 0;
  let foundCount = 0;

  for (const [groupName, tables] of Object.entries(REQUIRED_TABLES)) {
    for (const table of tables) {
      totalRequired++;
      if (assert(catalog.tables[table], `[${groupName}] Missing required table: "${table}"`)) {
        foundCount++;
      }
    }
  }

  // Also check who_growth_standards (shared system table)
  assert(catalog.tables['who_growth_standards'], 'Missing shared system table: "who_growth_standards"');

  const totalTables = Object.keys(catalog.tables).length;
  warn(totalTables >= totalRequired, `Expected at least ${totalRequired} tables, found ${totalTables}`);

  passedSuites.push(`Suite 2: Table Inventory (${foundCount}/${totalRequired} required tables found, ${totalTables} total)`);
}

// ── Suite 3: Foreign Key Integrity ──
function verifySuite3() {
  let fkCount = 0;
  for (const [tableName, tableData] of Object.entries(catalog.tables)) {
    for (const fk of tableData.foreignKeys) {
      fkCount++;
      assert(catalog.tables[fk.targetTable],
        `Table "${tableName}" references non-existent table "${fk.targetTable}"`);
      if (catalog.tables[fk.targetTable]) {
        assert(
          catalog.tables[fk.targetTable].columns.includes(fk.targetColumn),
          `Table "${tableName}" FK references non-existent column "${fk.targetTable}.${fk.targetColumn}"`
        );
      }
    }
  }
  passedSuites.push(`Suite 3: Foreign Key Integrity (${fkCount} FKs validated)`);
}

// ── Suite 4: Index Coverage ──
function verifySuite4() {
  const indexedTables = new Set(catalog.indexes.map(i => i.tableName));

  // Important tables that should have indexes
  const shouldHaveIndexes = [
    'users', 'classes', 'students', 'student_allergies',
    'food_ingredients', 'dishes', 'dish_recipes', 'menus',
    'menu_dishes', 'snack_registrations', 'payments',
    'meal_attendances', 'physical_measurements', 'notifications',
  ];

  for (const table of shouldHaveIndexes) {
    warn(indexedTables.has(table), `Table "${table}" should have at least one index`);
  }

  passedSuites.push(`Suite 4: Index Coverage (${catalog.indexes.length} indexes across ${indexedTables.size} tables)`);
}

// ── Suite 5: Seed Data Completeness ──
function verifySuite5() {
  const requiredSeeds = [
    'roles', 'allergens', 'dish_categories', 'nutrition_conversion_factors',
    'nutrition_rule_codes', 'users', 'schools', 'classes', 'students',
    'food_categories', 'food_ingredients', 'dishes', 'dish_recipes',
    'who_growth_standards',
  ];

  let seeded = 0;
  for (const table of requiredSeeds) {
    if (assert(catalog.seedInserts[table], `Seed data missing for table: "${table}"`)) {
      seeded++;
    }
  }

  passedSuites.push(`Suite 5: Seed Data Completeness (${seeded}/${requiredSeeds.length} tables seeded)`);
}

// ── Suite 6: Trigger Verification ──
function verifySuite6() {
  const hasDishNutritionTrigger = catalog.triggers.some(t =>
    t.tableName === 'dish_recipes' && t.triggerName.includes('recalculate')
  );
  assert(hasDishNutritionTrigger, 'Missing trigger: auto-recalculate dish_nutrition on dish_recipes changes');

  passedSuites.push(`Suite 6: Trigger Verification (${catalog.triggers.length} triggers found)`);
}

// ── Suite 7: Column Validation (Critical columns) ──
function verifySuite7() {
  const checks = [
    ['users', ['id', 'email', 'password_hash', 'full_name', 'status', 'created_at']],
    ['students', ['id', 'class_id', 'student_code', 'full_name', 'date_of_birth', 'gender']],
    ['food_ingredients', ['id', 'category_id', 'name', 'energy_kcal_100g', 'protein_g', 'fat_g', 'carb_g']],
    ['dishes', ['id', 'category_id', 'name', 'standard_serving_size_g']],
    ['menus', ['id', 'cycle_id', 'week_start_date', 'age_group', 'status']],
    ['physical_measurements', ['id', 'student_id', 'measured_date', 'height_cm', 'weight_kg']],
    ['growth_zscores', ['id', 'measurement_id', 'waz', 'haz', 'baz', 'classification']],
    ['food_inspections', ['id', 'date', 'inspection_step', 'inspector_id', 'result']],
    ['food_samples', ['id', 'date', 'dish_name', 'sample_code', 'status']],
    ['payments', ['id', 'registration_id', 'amount', 'status']],
  ];

  let passed = 0;
  for (const [table, requiredCols] of checks) {
    if (!catalog.tables[table]) continue;
    const actualCols = catalog.tables[table].columns;
    for (const col of requiredCols) {
      if (assert(actualCols.includes(col), `Table "${table}" missing required column: "${col}"`)) {
        passed++;
      }
    }
  }

  passedSuites.push(`Suite 7: Column Validation (${passed} critical columns verified)`);
}

// ─────────────────────────────────────────────────────────────
// Run All Suites
// ─────────────────────────────────────────────────────────────

verifySuite1();
verifySuite2();
verifySuite3();
verifySuite4();
verifySuite5();
verifySuite6();
verifySuite7();

// ─────────────────────────────────────────────────────────────
// Output
// ─────────────────────────────────────────────────────────────

if (isJsonMode) {
  const result = {
    status: errors.length === 0 ? 'PASSED' : 'FAILED',
    tablesFound: Object.keys(catalog.tables).length,
    indexesFound: catalog.indexes.length,
    triggersFound: catalog.triggers.length,
    seededTables: Object.keys(catalog.seedInserts).length,
    suitesPassed: passedSuites.length,
    errors: errors,
    warnings: warnings,
  };
  console.log(JSON.stringify(result, null, 2));
} else {
  console.log(`\n${c.cyan}${c.bold}╔═══════════════════════════════════════════════════════════╗${c.reset}`);
  console.log(`${c.cyan}${c.bold}║  KidMeal — Schema & Seed Verification Report             ║${c.reset}`);
  console.log(`${c.cyan}${c.bold}╚═══════════════════════════════════════════════════════════╝${c.reset}\n`);

  console.log(`${c.bold}📋 Schema:${c.reset} ${schemaFile}`);
  console.log(`${c.bold}📋 Seed:${c.reset}   ${seedFile}`);
  console.log(`${c.bold}📊 Tables:${c.reset} ${Object.keys(catalog.tables).length}`);
  console.log(`${c.bold}📊 Indexes:${c.reset} ${catalog.indexes.length}`);
  console.log(`${c.bold}📊 Triggers:${c.reset} ${catalog.triggers.length}`);
  console.log(`${c.bold}📊 Seeded Tables:${c.reset} ${Object.keys(catalog.seedInserts).length}\n`);

  // All tables
  console.log(`${c.bold}📦 All Tables Found:${c.reset}`);
  Object.keys(catalog.tables).sort().forEach((t, i) => {
    const cols = catalog.tables[t].columns.length;
    const fks = catalog.tables[t].foreignKeys.length;
    console.log(`   ${String(i + 1).padStart(2)}. ${t} (${cols} cols, ${fks} FKs)`);
  });
  console.log('');

  // Suites
  for (const suite of passedSuites) {
    console.log(`  ${c.green}✅ ${suite}${c.reset}`);
  }
  console.log('');

  // Warnings
  if (warnings.length > 0) {
    console.log(`${c.yellow}${c.bold}⚠ Warnings (${warnings.length}):${c.reset}`);
    warnings.forEach(w => console.log(`  ${c.yellow}⚠ ${w}${c.reset}`));
    console.log('');
  }

  // Errors
  if (errors.length > 0) {
    console.log(`${c.red}${c.bold}❌ Errors (${errors.length}):${c.reset}`);
    errors.forEach(e => console.log(`  ${c.red}✗ ${e}${c.reset}`));
    console.log('');
    console.log(`${c.red}${c.bold}VERIFICATION FAILED${c.reset}`);
    process.exit(1);
  } else {
    console.log(`${c.green}${c.bold}🎉 ALL VERIFICATIONS PASSED!${c.reset}\n`);
  }
}

if (errors.length > 0) process.exit(1);
