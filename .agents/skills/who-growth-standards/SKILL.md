---
name: who-growth-standards
description: >
  WHO Child Growth Standards skill for KidMeal — LMS Z-score computation
  (Weight-for-Age, Height-for-Age, Weight-for-Height, BMI-for-Age),
  nutritional status classification (stunting, wasting, overweight, obesity),
  and growth chart visualization using Recharts.
---

# 📏 WHO Child Growth Standards — KidMeal

## 1. Overview
KidMeal monitors child nutritional status using **WHO Child Growth Standards** (0–5 years).
Anthropometric measurements are recorded periodically and converted to Z-scores for classification.

### Indicators Used
| Indicator     | Abbreviation | Purpose                        |
|---------------|-------------|--------------------------------|
| Weight-for-Age | WFA       | Detect underweight             |
| Height-for-Age | HFA       | Detect stunting                |
| Weight-for-Height | WFH   | Detect wasting / overweight    |
| BMI-for-Age   | BMIFA       | Detect overweight / obesity    |

---

## 2. LMS Z-Score Formula

The WHO LMS method computes Z-scores as:

```
Z = [(measurement / M)^L - 1] / (L × S)

Where:
  L = Box-Cox power (lambda)
  M = Median
  S = Coefficient of variation (sigma)
```

**Special case when L = 0:**
```
Z = ln(measurement / M) / S
```

### 2.1 Implementation

```typescript
// services/growth-zscore.service.ts

interface LMSValues {
  L: number;
  M: number;
  S: number;
}

/**
 * Compute Z-score using WHO LMS method.
 * @param measurement - child's actual measurement (weight in kg, height in cm, BMI in kg/m²)
 * @param lms - L, M, S values from WHO reference table for the child's sex and age
 */
function computeZScore(measurement: number, lms: LMSValues): number {
  const { L, M, S } = lms;

  if (Math.abs(L) < 0.001) {
    // L ≈ 0: use logarithmic formula
    return Math.log(measurement / M) / S;
  }

  return (Math.pow(measurement / M, L) - 1) / (L * S);
}

/**
 * Restrict extreme Z-scores (WHO recommends capping at ±5 or ±6).
 */
function clampZScore(z: number, min = -6, max = 6): number {
  return Math.max(min, Math.min(max, z));
}
```

### 2.2 LMS Reference Data Storage

```sql
-- WHO LMS reference tables (pre-populated, read-only)
CREATE TABLE who_growth_reference (
  id SERIAL PRIMARY KEY,
  indicator VARCHAR(10),     -- 'WFA', 'HFA', 'WFH', 'BMIFA'
  sex CHAR(1),               -- 'M', 'F'
  age_months NUMERIC(5,1),   -- Age in months (0.0 to 60.0)
  measurement NUMERIC(6,2),  -- For WFH: the height value
  l_value NUMERIC(10,6),
  m_value NUMERIC(10,6),
  s_value NUMERIC(10,6)
);

-- Index for fast lookups
CREATE INDEX idx_who_ref_lookup
ON who_growth_reference(indicator, sex, age_months);
```

---

## 3. Nutritional Status Classification

### 3.1 Classification Thresholds (WHO Standard)

| Category           | WFA Z       | HFA Z       | WFH Z / BMIFA Z |
|--------------------|-------------|-------------|------------------|
| Severely Underweight | < -3      |             |                  |
| Underweight        | < -2        |             |                  |
| Normal             | -2 to +2    | -2 to +2    | -2 to +1         |
| Severely Stunted   |             | < -3        |                  |
| Stunted            |             | < -2        |                  |
| Severely Wasted    |             |             | < -3             |
| Wasted             |             |             | < -2             |
| Overweight         |             |             | > +1 and ≤ +2    |
| Obese              |             |             | > +2             |
| Severely Obese     |             |             | > +3             |

### 3.2 Classification Service

```typescript
// services/growth-classification.service.ts

type NutritionalStatus =
  | 'SEVERELY_UNDERWEIGHT' | 'UNDERWEIGHT'
  | 'SEVERELY_STUNTED' | 'STUNTED'
  | 'SEVERELY_WASTED' | 'WASTED'
  | 'NORMAL'
  | 'OVERWEIGHT' | 'OBESE' | 'SEVERELY_OBESE';

interface GrowthAssessment {
  childId: string;
  date: Date;
  ageMonths: number;
  weightKg: number;
  heightCm: number;
  bmi: number;
  wfaZ: number;
  hfaZ: number;
  wfhZ: number;
  bmifaZ: number;
  weightStatus: NutritionalStatus;
  heightStatus: NutritionalStatus;
  wfhStatus: NutritionalStatus;
}

function classifyWeight(wfaZ: number): NutritionalStatus {
  if (wfaZ < -3) return 'SEVERELY_UNDERWEIGHT';
  if (wfaZ < -2) return 'UNDERWEIGHT';
  return 'NORMAL';
}

function classifyHeight(hfaZ: number): NutritionalStatus {
  if (hfaZ < -3) return 'SEVERELY_STUNTED';
  if (hfaZ < -2) return 'STUNTED';
  return 'NORMAL';
}

function classifyWFH(wfhZ: number): NutritionalStatus {
  if (wfhZ < -3) return 'SEVERELY_WASTED';
  if (wfhZ < -2) return 'WASTED';
  if (wfhZ > 3) return 'SEVERELY_OBESE';
  if (wfhZ > 2) return 'OBESE';
  if (wfhZ > 1) return 'OVERWEIGHT';
  return 'NORMAL';
}
```

---

## 4. Backend Module Structure

```
apps/backend/src/modules/growth/
├── controllers/
│   └── growth.controller.ts           # Record & query measurements
├── dto/
│   ├── record-measurement.dto.ts      # Input: weight, height, date
│   └── growth-assessment.dto.ts       # Output: Z-scores + classifications
├── entities/
│   ├── growth-measurement.entity.ts   # Per-child measurement records
│   └── who-growth-reference.entity.ts # LMS reference table (read-only)
├── services/
│   ├── growth.service.ts              # CRUD + orchestration
│   ├── growth-zscore.service.ts       # LMS Z-score computation
│   └── growth-classification.service.ts
└── growth.module.ts
```

### 4.1 API Endpoints
```
POST /api/v1/growth/measurements          → Record new measurement for a child
GET  /api/v1/growth/children/:childId     → Get growth history for a child
GET  /api/v1/growth/class/:classId/summary → Class-level nutrition status summary
GET  /api/v1/growth/charts/:childId       → Data for growth chart rendering
```

---

## 5. Frontend Growth Chart (Recharts)

### 5.1 Chart Component Pattern
Location: `apps/frontend/src/features/growth/`

```tsx
// Growth Z-score line chart with WHO reference bands
import { LineChart, Line, Area, XAxis, YAxis, CartesianGrid, Tooltip, ReferenceLine } from 'recharts';

// Z-score reference bands (shaded areas)
const WHO_BANDS = [
  { y1: -3, y2: -2, fill: '#fee2e2', label: 'Suy dinh dưỡng nặng' },
  { y1: -2, y2: -1, fill: '#fef3c7', label: 'Nguy cơ' },
  { y1: -1, y2: 1,  fill: '#dcfce7', label: 'Bình thường' },
  { y1: 1,  y2: 2,  fill: '#fef3c7', label: 'Nguy cơ thừa cân' },
  { y1: 2,  y2: 3,  fill: '#fee2e2', label: 'Béo phì' },
];
```

### 5.2 Color Coding for Status Badges
```typescript
const statusColors: Record<NutritionalStatus, { bg: string; text: string }> = {
  NORMAL:               { bg: 'bg-emerald-100', text: 'text-emerald-800' },
  UNDERWEIGHT:          { bg: 'bg-amber-100',   text: 'text-amber-800' },
  SEVERELY_UNDERWEIGHT: { bg: 'bg-red-100',     text: 'text-red-800' },
  STUNTED:              { bg: 'bg-orange-100',   text: 'text-orange-800' },
  SEVERELY_STUNTED:     { bg: 'bg-red-100',     text: 'text-red-800' },
  WASTED:               { bg: 'bg-amber-100',   text: 'text-amber-800' },
  SEVERELY_WASTED:      { bg: 'bg-red-100',     text: 'text-red-800' },
  OVERWEIGHT:           { bg: 'bg-yellow-100',   text: 'text-yellow-800' },
  OBESE:                { bg: 'bg-orange-100',   text: 'text-orange-800' },
  SEVERELY_OBESE:       { bg: 'bg-red-100',     text: 'text-red-800' },
};
```

---

## 6. Key Conventions
- BMI calculation: `BMI = weight(kg) / (height(m))²`
- Age in months must be computed precisely: `(measurementDate - birthDate) / 30.4375`
- Growth data is **tenant-scoped** and access-controlled per RBAC (NUTRITIONIST, PARENT can view).
- WHO reference data is **global** (not tenant-specific), seeded once at deployment.
- Always display Z-scores with **1 decimal precision** in the UI.
- Growth charts use **age in months** on X-axis, **Z-score** on Y-axis.
