---
name: kidmeal-monorepo-ops
description: >
  KidMeal Monorepo Operations skill — Docker Compose setup, pnpm workspace management,
  PostgreSQL 16 schema migration & verification, dev server orchestration, environment
  configuration, database seeding, and CI/CD pipeline patterns.
---

# 🏗️ KidMeal Monorepo Operations

## 1. Workspace Structure

```
KidMeal/
├── apps/
│   ├── backend/           # NestJS 10 API server
│   │   ├── src/
│   │   │   ├── modules/   # Feature modules (auth, foods, menus, etc.)
│   │   │   ├── common/    # Guards, decorators, middleware, interceptors
│   │   │   ├── config/    # Configuration files
│   │   │   ├── database/  # TypeORM config & migrations
│   │   │   ├── app.module.ts
│   │   │   └── main.ts
│   │   ├── package.json
│   │   └── tsconfig.json
│   └── frontend/          # React 18 + Vite SPA
│       ├── src/
│       │   ├── core/      # API clients, stores, shared components
│       │   ├── features/  # Feature modules (auth, menus, growth, etc.)
│       │   ├── layouts/   # Layout shells (Admin, Nutritionist, Tablet, KDS)
│       │   ├── App.tsx    # Root router component
│       │   ├── main.tsx   # Entry point
│       │   └── index.css  # Tailwind + custom CSS
│       ├── tailwind.config.js
│       ├── vite.config.ts
│       └── package.json
├── database/
│   ├── schema.sql         # Full PostgreSQL 16 DDL
│   ├── seed.sql           # Sample data for development
│   ├── seed_snack_services.sql  # Snack service test data
│   └── verify_schema.js   # Schema validation script
├── docker-compose.yml     # PostgreSQL 16 + Redis
├── pnpm-workspace.yaml    # Workspace definition
├── package.json           # Root scripts
├── .env                   # Environment variables
└── AGENTS.md              # Agent instructions
```

---

## 2. Docker Compose Services

```yaml
# docker-compose.yml
services:
  postgres:
    image: postgres:16-alpine
    ports: ["5432:5432"]
    environment:
      POSTGRES_DB: kidmeal
      POSTGRES_USER: kidmeal_admin
      POSTGRES_PASSWORD: kidmeal_secret_2024
    volumes:
      - pgdata:/var/lib/postgresql/data
      - ./database/schema.sql:/docker-entrypoint-initdb.d/01-schema.sql
      - ./database/seed.sql:/docker-entrypoint-initdb.d/02-seed.sql

  redis:
    image: redis:7-alpine
    ports: ["6379:6379"]

volumes:
  pgdata:
```

### Commands
```bash
# Start services
pnpm db:up        # → docker compose up -d postgres redis

# Stop services
pnpm db:down      # → docker compose down

# Reset database (wipe + reseed)
docker compose down -v && pnpm db:up
```

---

## 3. Environment Configuration

### 3.1 Root `.env`
```env
# Database
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=kidmeal_admin
DB_PASSWORD=kidmeal_secret_2024
DB_NAME=kidmeal

# Redis
REDIS_HOST=localhost
REDIS_PORT=6379

# JWT
JWT_ACCESS_SECRET=your-access-secret-key
JWT_REFRESH_SECRET=your-refresh-secret-key
JWT_ACCESS_EXPIRES_IN=15m
JWT_REFRESH_EXPIRES_IN=7d

# VNPAY
VNPAY_TMN_CODE=...
VNPAY_HASH_SECRET=...

# Default Tenant (for development)
DEFAULT_TENANT_ID=a0000000-0000-0000-0000-000000000001
```

### 3.2 Frontend `.env` (Vite)
```env
VITE_API_BASE_URL=http://localhost:3000/api/v1
VITE_SOCKET_URL=http://localhost:3000
VITE_DEFAULT_TENANT_ID=a0000000-0000-0000-0000-000000000001
```

---

## 4. Dev Server Commands

```bash
# Install all dependencies
pnpm install

# Start backend dev server (NestJS with hot reload)
pnpm dev:backend   # → pnpm --filter @kidsnutri/backend dev
# Runs on http://localhost:3000

# Start frontend dev server (Vite with HMR)
pnpm dev:frontend  # → pnpm --filter @kidsnutri/frontend dev
# Runs on http://localhost:5173

# Run both concurrently (optional — use 2 terminals)
pnpm dev:backend & pnpm dev:frontend
```

---

## 5. Database Schema Verification

### 5.1 Run Verification
```bash
pnpm db:verify    # → node database/verify_schema.js
```

The `verify_schema.js` script:
1. Connects to PostgreSQL using `.env` credentials.
2. Checks for existence of all required tables.
3. Validates column types and constraints.
4. Verifies RLS policies are enabled.
5. Reports missing tables/columns/constraints.

### 5.2 Schema Key Tables
```
Core:         tenants, users, user_roles, roles
Nutrition:    foods, tenant_foods, food_allergens, dishes, dish_ingredients
Menus:        weekly_menus, menu_days, menu_meals, menu_meal_dishes
Children:     children, child_allergens, classes, class_enrollments
Growth:       growth_measurements, who_growth_reference
Safety:       food_inspections, food_samples
Payments:     snack_service_registrations, payment_transactions
Attendance:   daily_attendances, meal_records
```

---

## 6. PostgreSQL Multi-Tenancy (RLS)

### 6.1 RLS Setup Pattern
```sql
-- Enable RLS on table
ALTER TABLE foods ENABLE ROW LEVEL SECURITY;

-- Create tenant isolation policy
CREATE POLICY tenant_isolation_foods ON foods
  USING (tenant_id = current_setting('app.current_tenant_id')::UUID);

-- Set tenant context (called by middleware)
SET app.current_tenant_id = 'a0000000-0000-0000-0000-000000000001';
```

### 6.2 TypeORM Tenant Filter (Backend)
```typescript
// Every query must include tenant_id filter
const foods = await this.foodRepo.find({
  where: { tenantId: req.tenantId },
});
```

---

## 7. pnpm Workspace Configuration

```yaml
# pnpm-workspace.yaml
packages:
  - 'apps/*'
  - 'database'
```

### Common Commands
```bash
# Add dependency to a specific workspace
pnpm --filter @kidsnutri/backend add <package>
pnpm --filter @kidsnutri/frontend add <package>

# Run script in specific workspace
pnpm --filter @kidsnutri/backend <script>

# Install all workspaces
pnpm install

# Build all
pnpm build

# Lint all
pnpm lint

# Run tests
pnpm test          # Backend unit tests
pnpm test:api      # Backend e2e tests
pnpm test:all      # All tests
```

---

## 8. Testing Strategy

### Backend (NestJS)
```bash
# Unit tests
npm --prefix apps/backend run test

# E2E/API tests
npm --prefix apps/backend run test:e2e

# With coverage
npm --prefix apps/backend run test:cov
```

### Test file naming convention:
```
*.spec.ts       → Unit tests
*.e2e-spec.ts   → E2E/Integration tests
```

---

## 9. Key Conventions
- **pnpm only** — no npm or yarn.
- Backend on port **3000**, frontend on port **5173**.
- API routes: `/api/v1/{resource}` (RESTful).
- Environment variables loaded via NestJS `ConfigModule` (backend) and `import.meta.env` (Vite frontend).
- Docker volumes persist PostgreSQL data across restarts.
- Always run `pnpm db:verify` after schema changes to validate integrity.
- Use `docker compose down -v` for a clean database reset (drops volume).
