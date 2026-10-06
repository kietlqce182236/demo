# KidMeal (NutriBud) — Project Agent Instructions & Coding Standards

## 1. Project Overview
- **Project Name**: KidMeal – Preschool Nutrition and Meal Management System (NutriBud / KidsNutriJournal).
- **Core Purpose**: Digitalize and connect preschool nutrition planning, allergen checking via Rule Engine, afternoon snack billing via VNPAY, real-time kitchen portion tallying, 3-step food safety inspection & 24h sample retention, and WHO Z-score growth monitoring.
- **Monorepo Architecture**: Managed via `pnpm` workspaces:
  - `apps/backend`: NestJS 10, TypeORM, PostgreSQL (Multi-tenant + RLS), Redis, Socket.IO.
  - `apps/frontend`: React 18, Vite, Tailwind CSS, TanStack React Query, Zustand.
  - `database`: PostgreSQL 16 schema (`schema.sql`), seeds (`seed.sql`), and validation scripts (`verify_schema.js`).

---

## 2. Core Architectural & Domain Rules

### 2.1 Multi-Tenancy & Security
- Every tenant represents a distinct preschool.
- All database queries must enforce tenant isolation either through TypeORM tenant filters or PostgreSQL Row-Level Security (`app.current_tenant_id`).
- Access control adheres strictly to the 5 RBAC roles:
  1. `SCHOOL_MANAGEMENT`: School config, menu approvals, snack fees, high-level reports.
  2. `NUTRITIONIST`: Food/recipe/menu management, rule engine config, growth metric assessment.
  3. `TEACHER`: Class child list, daily meal attendance, child eating evaluation.
  4. `KITCHEN_STAFF`: Meal portion reception, 3-step food inspection, 24h food sample retention.
  5. `PARENT`: Child allergy declarations, snack service registration & VNPAY payment, meal/growth tracking.

### 2.2 Domain Standards Compliance
- **Circular 28/2016/TT-BGDĐT**: Mandatory preschool nutrition standards (50-60% daily energy at school; P:L:G balance, micronutrients, salt & sugar limits).
- **Decision 1246/QĐ-BYT**: 3-step food inspection (Trước chế biến, Trong chế biến, Trước khi ăn) and 24h food sample retention (Lưu mẫu thức ăn 0-5°C).
- **WHO Child Growth Standards**: Anthropometric Z-scores (WFA, HFA, WFH/BMI-for-age) to classify stunting, wasting, overweight, and obesity.

### 2.3 Payments & Billing
- Afternoon snack service (Dịch vụ ăn xế 17h) online payment integrates with VNPAY Sandbox.
- Parameters must be sorted alphabetically before computing HMAC-SHA512 checksum.
- IPN webhook handling must be strictly **idempotent** and verify signatures server-to-server.

### 2.4 Realtime Communications
- Socket.IO gateway broadcasts portion changes (`kitchen:portions-updated`) and safety alerts.
- Room segregation: `tenant:{tenant_id}:kitchen`, `tenant:{tenant_id}:class:{class_id}`.

---

## 3. Workspace Skills Available
The following specialized skills are installed in `.agents/skills/`:
- **`nutrition-rule-engine`**: Rules, P:L:G formulas, and allergy conflict detection algorithms.
- **`who-growth-standards`**: WHO LMS formulas and child nutritional status classification.
- **`vnpay-snack-billing`**: VNPAY URL signing, IPN handling, and snack service lifecycle.
- **`kitchen-realtime-safety`**: WebSocket portion management, 3-step food inspection, and food sample retention.
- **`kidmeal-monorepo-ops`**: Docker Compose, database migration, verification scripts, and dev server commands.
- **`ai-menu-advisor`**: Prompts, constraints, and schemas for LLM-driven menu planning and allergen substitution.
- **`kidmeal-uiux-promax`**: Definitive design system — color tokens, typography, component patterns (modals, cards, tables, forms, badges), micro-animations, responsive rules, and Vietnamese localization standards.

---

## 4. Development & Testing Commands
```bash
# Start DB & Cache
pnpm db:up

# Verify Schema
pnpm db:verify

# Start Dev Servers
pnpm dev:backend
pnpm dev:frontend

# Run Tests & Linters
pnpm test
pnpm lint
```
