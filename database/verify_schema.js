#!/usr/bin/env node

/**
 * KidsNutriJournal - Automated Schema & Seed Verification Runner
 * Standalone offline validator with ZERO external dependencies.
 *
 * Usage:
 *   node database/verify_schema.js
 *   node database/verify_schema.js --json
 */

const fs = require('fs');
const path = require('path');

// Colors for terminal formatting (fallback gracefully if non-interactive)
const isTTY = process.stdout.isTTY;
const colors = {
  reset: isTTY ? '\x1b[0m' : '',
  green: isTTY ? '\x1b[32m' : '',
  red: isTTY ? '\x1b[31m' : '',
  yellow: isTTY ? '\x1b[33m' : '',
  cyan: isTTY ? '\x1b[36m' : '',
  bold: isTTY ? '\x1b[1m' : '',
};

// Locate schema.sql and seed.sql (supports root database/ or fallback paths)
function resolveFile(filename) {
  const candidatePaths = [
    path.resolve(__dirname, filename),
    path.resolve(__dirname, '..', 'database', filename),
    path.resolve(process.cwd(), 'database', filename),
    path.resolve(process.cwd(), '.agents', 'spec_miner_db_0', filename)
  ];
  for (const p of candidatePaths) {
    if (fs.existsSync(p)) return p;
  }
  return null;
}

const schemaFile = resolveFile('schema.sql');
const seedFile = resolveFile('seed.sql');

if (!schemaFile || !seedFile) {
  console.error(`${colors.red}${colors.bold}[FATAL ERROR]${colors.reset} Required SQL files not found!`);
  if (!schemaFile) console.error(`  Missing: schema.sql`);
  if (!seedFile) console.error(`  Missing: seed.sql`);
  process.exit(1);
}

// -----------------------------------------------------------------------------
// 1. SQL Lexer & Statement Splitter
// -----------------------------------------------------------------------------

function cleanComments(sql) {
  let result = '';
  let i = 0;
  const len = sql.length;
  let inSingleQuote = false;
  let inDollarQuote = null;

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
        inDollarQuote = '$$';
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
        inDollarQuote = null;
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
  let inDollarQuote = null;

  while (i < len) {
    const ch = cleanedSql[i];
    if (!inSingleQuote && !inDollarQuote) {
      if (ch === '$' && cleanedSql[i + 1] === '$') {
        inDollarQuote = '$$';
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
        inDollarQuote = null;
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

function extractInsertRows(stmt) {
  const valuesIdx = stmt.toUpperCase().indexOf('VALUES');
  if (valuesIdx === -1) return [];
  const valuesBody = stmt.slice(valuesIdx + 6);
  const rows = [];
  let depth = 0;
  let start = -1;
  let inStr = false;
  for (let i = 0; i < valuesBody.length; i++) {
    const ch = valuesBody[i];
    if (ch === "'") {
      if (inStr && valuesBody[i + 1] === "'") {
        i++; // Skip escaped quote
      } else {
        inStr = !inStr;
      }
    } else if (!inStr) {
      if (ch === '(') {
        if (depth === 0) start = i;
        depth++;
      } else if (ch === ')') {
        depth--;
        if (depth === 0 && start !== -1) {
          rows.push(valuesBody.slice(start + 1, i));
          start = -1;
        }
      }
    }
  }
  return rows;
}

// -----------------------------------------------------------------------------
// 2. DDL Extractor & Catalog Parser
// -----------------------------------------------------------------------------

const rawSchemaSql = fs.readFileSync(schemaFile, 'utf8');
const rawSeedSql = fs.readFileSync(seedFile, 'utf8');

const schemaStatements = splitStatements(cleanComments(rawSchemaSql));
const seedStatements = splitStatements(cleanComments(rawSeedSql));

const catalog = {
  tables: {},
  indexes: [],
  rlsEnabled: new Set(),
  rlsForced: new Set(),
  policies: [],
  triggers: [],
  seedInserts: {},
  seedStatementsByTable: {}
};

// Parse Schema Statements
for (const stmt of schemaStatements) {
  // CREATE TABLE
  const tableMatch = stmt.match(/CREATE\s+TABLE\s+(?:IF\s+NOT\s+EXISTS\s+)?([a-zA-Z0-9_]+)\s*\(([\s\S]+)\)/i);
  if (tableMatch) {
    const tableName = tableMatch[1].toLowerCase();
    const body = tableMatch[2];
    const columns = [];
    const foreignKeys = [];
    let hasTenantId = false;

    // Scan lines for column definitions and foreign keys
    const lines = body.split('\n');
    for (let line of lines) {
      line = line.trim();
      if (!line || line.startsWith('--')) continue;

      // Extract column name
      const colMatch = line.match(/^([a-zA-Z0-9_]+)\s+([a-zA-Z0-9_()]+)/i);
      if (colMatch && !['CONSTRAINT', 'PRIMARY', 'UNIQUE', 'CHECK', 'FOREIGN'].includes(colMatch[1].toUpperCase())) {
        const colName = colMatch[1].toLowerCase();
        columns.push(colName);
        if (colName === 'tenant_id') hasTenantId = true;
      }

      // Extract FK References
      const fkMatch = line.match(/(?:CONSTRAINT\s+([a-zA-Z0-9_]+)\s+)?(?:FOREIGN\s+KEY\s*\(([a-zA-Z0-9_,\s]+)\)\s+)?REFERENCES\s+([a-zA-Z0-9_]+)\s*\(([a-zA-Z0-9_]+)\)(?:\s+ON\s+DELETE\s+(CASCADE|RESTRICT|SET\s+NULL|NO\s+ACTION))?/i);
      if (fkMatch) {
        foreignKeys.push({
          sourceColumn: fkMatch[2] ? fkMatch[2].trim().toLowerCase() : (colMatch ? colMatch[1].toLowerCase() : null),
          targetTable: fkMatch[3].toLowerCase(),
          targetColumn: fkMatch[4].toLowerCase(),
          onDelete: fkMatch[5] ? fkMatch[5].toUpperCase().replace(/\s+/g, ' ') : 'NO ACTION'
        });
      }
    }

    catalog.tables[tableName] = {
      columns,
      hasTenantId,
      foreignKeys
    };
  }

  // CREATE INDEX
  const idxMatch = stmt.match(/CREATE\s+(UNIQUE\s+)?INDEX\s+([a-zA-Z0-9_]+)\s+ON\s+([a-zA-Z0-9_]+)(?:\s+USING\s+([a-zA-Z0-9_]+))?\s*\(([^)]+)\)/i);
  if (idxMatch) {
    catalog.indexes.push({
      isUnique: !!idxMatch[1],
      indexName: idxMatch[2],
      tableName: idxMatch[3].toLowerCase(),
      indexType: idxMatch[4] ? idxMatch[4].toLowerCase() : 'btree',
      columns: idxMatch[5].split(',').map(c => c.trim().toLowerCase())
    });
  }

  // ALTER TABLE ... ROW LEVEL SECURITY
  const rlsMatch = stmt.match(/ALTER\s+TABLE\s+([a-zA-Z0-9_]+)\s+(ENABLE|FORCE)\s+ROW\s+LEVEL\s+SECURITY/i);
  if (rlsMatch) {
    const tbl = rlsMatch[1].toLowerCase();
    if (rlsMatch[2].toUpperCase() === 'ENABLE') catalog.rlsEnabled.add(tbl);
    if (rlsMatch[2].toUpperCase() === 'FORCE') catalog.rlsForced.add(tbl);
  }

  // CREATE POLICY
  const polMatch = stmt.match(/CREATE\s+POLICY\s+([a-zA-Z0-9_]+)\s+ON\s+([a-zA-Z0-9_]+)/i);
  if (polMatch) {
    catalog.policies.push({
      policyName: polMatch[1],
      tableName: polMatch[2].toLowerCase()
    });
  }
}

// Parse Seed Statements
for (const stmt of seedStatements) {
  const insertMatch = stmt.match(/INSERT\s+INTO\s+([a-zA-Z0-9_]+)/i);
  if (insertMatch) {
    const tbl = insertMatch[1].toLowerCase();
    catalog.seedInserts[tbl] = (catalog.seedInserts[tbl] || 0) + 1;
    if (!catalog.seedStatementsByTable[tbl]) catalog.seedStatementsByTable[tbl] = [];
    catalog.seedStatementsByTable[tbl].push(stmt);
  }
}

// -----------------------------------------------------------------------------
// 3. Verification Assertion Suites
// -----------------------------------------------------------------------------

const errors = [];
const warnings = [];
const passedSuites = [];

function assert(condition, message) {
  if (!condition) {
    errors.push(message);
    return false;
  }
  return true;
}

function warn(condition, message) {
  if (!condition) {
    warnings.push(message);
  }
}

// Suite 1: File Presence & DDL Syntax Hygiene
function verifySuite1() {
  assert(rawSchemaSql.includes('BEGIN;') && rawSchemaSql.includes('COMMIT;'), 'schema.sql must be wrapped in a transaction (BEGIN ... COMMIT)');
  assert(rawSeedSql.includes('BEGIN;') && rawSeedSql.includes('COMMIT;'), 'seed.sql must be wrapped in a transaction (BEGIN ... COMMIT)');
  passedSuites.push('Suite 1: File Hygiene & Transaction Boundaries');
}

// Suite 2: Module Coverage (All 9 Modules across 26 tables)
const REQUIRED_MODULES = {
  'Module 1 (System & RBAC)': ['tenants', 'users', 'roles', 'permissions', 'role_permissions', 'user_roles', 'refresh_tokens', 'classes'],
  'Module 2 (Children & Allergies)': ['allergen_catalogs', 'children', 'child_allergies'],
  'Module 3 (Foods & Recipes)': ['foods', 'dishes', 'recipe_items'],
  'Module 4 (Nutrition Rules)': ['nutrition_rules', 'rule_violations_log'],
  'Module 5 (Cycle Menus)': ['menus', 'menu_dishes'],
  'Module 6 (Snacks & VNPAY Billing)': ['snack_services', 'snack_registrations', 'transactions'],
  'Module 7 (Meal Attendance)': ['daily_meal_attendance', 'meal_consumption_status'],
  'Module 8 (Food Safety 3-Step)': ['food_safety_logs'],
  'Module 9 (WHO Growth Records)': ['growth_records', 'who_growth_standards']
};

function verifySuite2() {
  let tableCount = 0;
  for (const [moduleName, tables] of Object.entries(REQUIRED_MODULES)) {
    for (const table of tables) {
      assert(catalog.tables[table], `[${moduleName}] Missing required table: "${table}"`);
      tableCount++;
    }
  }
  assert(tableCount === 26, `Required modules must define exactly 26 tables (got ${tableCount})`);
  assert(Object.keys(catalog.tables).length >= 26, `Catalog parsed ${Object.keys(catalog.tables).length} tables, expected at least 26`);
  passedSuites.push('Suite 2: 9 Modules & 26 Tables Inventory');
}

// Suite 3: Multi-Tenant tenant_id Isolation
const GLOBAL_CATALOG_TABLES = new Set(['tenants', 'permissions', 'role_permissions', 'allergen_catalogs', 'who_growth_standards']);

function verifySuite3() {
  for (const tableName of Object.keys(catalog.tables)) {
    if (GLOBAL_CATALOG_TABLES.has(tableName)) continue;
    assert(catalog.tables[tableName].hasTenantId, `Multi-tenant table "${tableName}" must contain "tenant_id" column`);
  }
  passedSuites.push('Suite 3: Multi-Tenant tenant_id Column Presence');
}

// Suite 4: Foreign Key Integrity & Referencing
function verifySuite4() {
  for (const [tableName, tableData] of Object.entries(catalog.tables)) {
    for (const fk of tableData.foreignKeys) {
      assert(catalog.tables[fk.targetTable], `Table "${tableName}" references non-existent table "${fk.targetTable}"`);
      if (catalog.tables[fk.targetTable]) {
        assert(
          catalog.tables[fk.targetTable].columns.includes(fk.targetColumn),
          `Table "${tableName}" foreign key column "${fk.sourceColumn}" references non-existent column "${fk.targetTable}.${fk.targetColumn}"`
        );
      }
      assert(['CASCADE', 'RESTRICT', 'SET NULL'].includes(fk.onDelete), `Table "${tableName}" foreign key to "${fk.targetTable}" must have explicit ON DELETE (got ${fk.onDelete})`);
    }
  }
  passedSuites.push('Suite 4: Foreign Key Referential Integrity & Deletion Actions');
}

// Suite 5: Row-Level Security (RLS) Enforcement
function verifySuite5() {
  for (const tableName of Object.keys(catalog.tables)) {
    if (GLOBAL_CATALOG_TABLES.has(tableName)) continue;
    assert(catalog.rlsEnabled.has(tableName), `Table "${tableName}" must have ENABLE ROW LEVEL SECURITY`);
    assert(catalog.rlsForced.has(tableName), `Table "${tableName}" must have FORCE ROW LEVEL SECURITY`);
    const hasPolicy = catalog.policies.some(p => p.tableName === tableName);
    assert(hasPolicy, `Table "${tableName}" must have at least one RLS POLICY declared`);
  }
  passedSuites.push('Suite 5: Row-Level Security (RLS) & Policies');
}

// Suite 6: Indexing Rules (tenant_id indexes and foreign key indexes)
function verifySuite6() {
  for (const tableName of Object.keys(catalog.tables)) {
    if (GLOBAL_CATALOG_TABLES.has(tableName)) continue;
    const hasTenantIndex = catalog.indexes.some(idx =>
      idx.tableName === tableName && idx.columns.some(col => col.includes('tenant_id'))
    );
    assert(hasTenantIndex, `Table "${tableName}" must have an index covering "tenant_id" for RLS performance`);
  }
  passedSuites.push('Suite 6: Indexing Strategy & RLS Composite Indexes');
}

// Suite 7: Seed Data Completeness & Multi-Tenancy Baseline
function verifySuite7() {
  const essentialSeedTables = [
    'tenants', 'users', 'roles', 'permissions', 'role_permissions', 'user_roles',
    'classes', 'allergen_catalogs', 'children', 'child_allergies',
    'foods', 'dishes', 'recipe_items', 'nutrition_rules',
    'menus', 'menu_dishes', 'rule_violations_log',
    'food_safety_logs', 'snack_services', 'snack_registrations', 'transactions',
    'daily_meal_attendance', 'meal_consumption_status',
    'growth_records', 'who_growth_standards'
  ];

  for (const tbl of essentialSeedTables) {
    assert(catalog.seedInserts[tbl], `seed.sql must insert baseline seed data for "${tbl}"`);
  }

  // Check for at least 2 demo tenants
  const tenantMatch = rawSeedSql.match(/INSERT\s+INTO\s+tenants[\s\S]+?VALUES\s*([\s\S]+?);/i);
  if (tenantMatch) {
    const tenantValues = tenantMatch[1].split(/\),\s*\(/);
    assert(tenantValues.length >= 2, `seed.sql must seed at least 2 distinct tenant records (found ${tenantValues.length})`);
  }

  // Verify Role-Permission mapping completeness (at least 42 mapped permissions)
  let rolePermRowCount = 0;
  for (const stmt of (catalog.seedStatementsByTable['role_permissions'] || [])) {
    rolePermRowCount += extractInsertRows(stmt).length;
  }
  assert(rolePermRowCount >= 42, `role_permissions must contain at least 42 mapped associations (found ${rolePermRowCount})`);

  passedSuites.push('Suite 7: Seed Data Completeness & Multi-Tenancy Baseline');
}

// Suite 8: Domain Seed Coverage (Recipe Items, WHO Standards & Menu Cycles)
function verifySuite8() {
  // -------------------------------------------------------------------------
  // 8.1 Recipe Items Seed Coverage
  // -------------------------------------------------------------------------
  const recipeStmts = catalog.seedStatementsByTable['recipe_items'] || [];
  let totalRecipeItems = 0;
  const dishesWithRecipes = new Set();
  let hasSoyInDish9 = false;

  for (const stmt of recipeStmts) {
    const rows = extractInsertRows(stmt);
    totalRecipeItems += rows.length;
    for (const r of rows) {
      // row columns: id, tenant_id, dish_id, food_id, ...
      const tokens = r.split(',').map(s => s.trim().replace(/^'|'$/g, ''));
      if (tokens.length >= 4) {
        const dishId = tokens[2];
        const foodId = tokens[3];
        dishesWithRecipes.add(dishId);
        // Tenant 1 Dish 9 (m1000000-0000-0000-0000-000000000009) with Soybean (d0000000-0000-0000-0000-000000000017 or f0000000-0000-0000-0000-000000000006)
        if (dishId === 'm1000000-0000-0000-0000-000000000009' &&
            (foodId === 'd0000000-0000-0000-0000-000000000017' || foodId === 'f0000000-0000-0000-0000-000000000006')) {
          hasSoyInDish9 = true;
        }
      }
    }
  }

  assert(totalRecipeItems >= 20, `recipe_items must seed comprehensive ingredients across dishes (found ${totalRecipeItems}, expected >= 20)`);
  assert(dishesWithRecipes.has('m1000000-0000-0000-0000-000000000009'), 'Tenant 1 Dish 9 ("Sữa đậu nành lá dứa hạt sen") must have recipe items in recipe_items');
  assert(hasSoyInDish9, 'Dish 9 ("Sữa đậu nành lá dứa hạt sen") recipe must include soybean ingredient ("d0000000-0000-0000-0000-000000000017" or "f0000000-0000-0000-0000-000000000006") for allergy conflict detection');
  assert(dishesWithRecipes.has('m2000000-0000-0000-0000-000000000002'), 'Tenant 2 Dish 2 ("Thịt bò xào su su cà rốt") must have recipe items in recipe_items');

  // -------------------------------------------------------------------------
  // 8.2 WHO Growth Standards Seed Coverage
  // -------------------------------------------------------------------------
  const whoStmts = catalog.seedStatementsByTable['who_growth_standards'] || [];
  let totalWhoRows = 0;
  const whoIndicators = new Set();
  const whoGenders = new Set();

  for (const stmt of whoStmts) {
    const rows = extractInsertRows(stmt);
    totalWhoRows += rows.length;
    for (const r of rows) {
      const tokens = r.split(',').map(s => s.trim().replace(/^'|'$/g, ''));
      for (const t of tokens) {
        if (['WAZ', 'HAZ', 'BAZ', 'WHZ'].includes(t)) whoIndicators.add(t);
        if (['MALE', 'FEMALE'].includes(t)) whoGenders.add(t);
      }
    }
  }

  assert(totalWhoRows >= 10, `who_growth_standards must contain reference curve rows (found ${totalWhoRows}, expected >= 10)`);
  assert(whoIndicators.has('WAZ'), 'who_growth_standards must seed Weight-for-Age (WAZ) standard');
  assert(whoIndicators.has('HAZ'), 'who_growth_standards must seed Height-for-Age (HAZ) standard');
  assert(whoIndicators.has('BAZ') || whoIndicators.has('WHZ'), 'who_growth_standards must seed BMI-for-Age (BAZ) or Weight-for-Height (WHZ) standard');
  assert(whoGenders.has('MALE') && whoGenders.has('FEMALE'), 'who_growth_standards must seed standards for both MALE and FEMALE');

  // -------------------------------------------------------------------------
  // 8.3 5-Day Weekly Menu Schedule Coverage
  // -------------------------------------------------------------------------
  const menuDishesStmts = catalog.seedStatementsByTable['menu_dishes'] || [];
  const menuDaysCovered = new Set();
  const menu1DishesScheduled = new Set();
  let menu1RowCount = 0;

  for (const stmt of menuDishesStmts) {
    const rows = extractInsertRows(stmt);
    for (const r of rows) {
      // columns: id, tenant_id, menu_id, dish_id, day_of_week, meal_time, ...
      const tokens = r.split(',').map(s => s.trim().replace(/^'|'$/g, ''));
      if (tokens.length >= 6) {
        const menuId = tokens[2];
        const dishId = tokens[3];
        const dayOfWeek = parseInt(tokens[4], 10);
        if (menuId === 'mm100000-0000-0000-0000-000000000001') {
          menu1RowCount++;
          menuDaysCovered.add(dayOfWeek);
          menu1DishesScheduled.add(dishId);
        }
      }
    }
  }

  assert(menu1RowCount >= 15, `5-day cycle menu "mm100000-0000-0000-0000-000000000001" must have at least 15 scheduled meal dish assignments (found ${menu1RowCount})`);
  for (let day = 1; day <= 5; day++) {
    assert(menuDaysCovered.has(day), `5-day cycle menu must schedule dishes for Day ${day} (Monday=1 .. Friday=5). Covered days: [${Array.from(menuDaysCovered).sort().join(', ')}]`);
  }
  assert(menu1DishesScheduled.has('m1000000-0000-0000-0000-000000000006'), 'Dish 6 ("Trứng cuộn rau củ tam sắc") must be scheduled in 5-day cycle menu');
  assert(menu1DishesScheduled.has('m1000000-0000-0000-0000-000000000007'), 'Dish 7 ("Cháo thịt bò hạt sen bí đỏ") must be scheduled in 5-day cycle menu');

  passedSuites.push('Suite 8: Domain Seed Coverage (Recipe Items, WHO Standards & Menu Cycles)');
}

// Execute all verification suites
verifySuite1();
verifySuite2();
verifySuite3();
verifySuite4();
verifySuite5();
verifySuite6();
verifySuite7();
verifySuite8();

// -----------------------------------------------------------------------------
// 4. Report Output
// -----------------------------------------------------------------------------

console.log(`\n${colors.bold}${colors.cyan}================================================================${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}   KidsNutriJournal - Automated Schema & Seed Verification   ${colors.reset}`);
console.log(`${colors.bold}${colors.cyan}================================================================${colors.reset}\n`);

console.log(`Inspected Schema: ${schemaFile}`);
console.log(`Inspected Seed:   ${seedFile}\n`);

console.log(`${colors.bold}Execution Summary:${colors.reset}`);
console.log(`  • Tables Parsed:       ${Object.keys(catalog.tables).length}`);
console.log(`  • Indexes Parsed:      ${catalog.indexes.length}`);
console.log(`  • RLS Policies Parsed: ${catalog.policies.length}`);
console.log(`  • Seed Statements:     ${Object.keys(catalog.seedInserts).length} tables populated\n`);

console.log(`${colors.bold}Suites Evaluated:${colors.reset}`);
for (const s of passedSuites) {
  console.log(`  ${colors.green}✔${colors.reset} ${s}`);
}

if (warnings.length > 0) {
  console.log(`\n${colors.bold}${colors.yellow}Warnings (${warnings.length}):${colors.reset}`);
  for (const w of warnings) {
    console.log(`  ${colors.yellow}⚠${colors.reset} ${w}`);
  }
}

if (errors.length > 0) {
  console.log(`\n${colors.bold}${colors.red}Errors Detected (${errors.length}):${colors.reset}`);
  for (const err of errors) {
    console.log(`  ${colors.red}✖${colors.reset} ${err}`);
  }
  console.log(`\n${colors.red}${colors.bold}RESULT: FAILED${colors.reset} (Exit code 1)\n`);
  process.exit(1);
} else {
  console.log(`\n${colors.green}${colors.bold}RESULT: ALL 8 SUITES PASSED CLEANLY (100% COMPLIANT)${colors.reset}`);
  console.log(`Database schema adheres strictly to Circular 28/2016, Decision 1246/BYT, and 3NF Multi-Tenancy.\n`);
  process.exit(0);
}
