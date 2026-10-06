---
name: kitchen-realtime-safety
description: >
  Kitchen Realtime & Food Safety skill for KidMeal — Socket.IO WebSocket portion management,
  3-step food inspection process (Quyết định 1246/QĐ-BYT), 24h food sample retention,
  Kitchen Display System (KDS) real-time updates, and safety compliance workflows.
---

# 🍳 Kitchen Realtime & Food Safety — KidMeal

## 1. Overview
This skill covers two tightly coupled systems:
1. **Real-time Kitchen Display (KDS)**: Socket.IO broadcasts portion counts per meal/class to kitchen screens.
2. **3-Step Food Safety Inspection**: Compliance with Decision 1246/QĐ-BYT for food inspection and 24h sample retention.

---

## 2. Socket.IO Real-Time Architecture

### 2.1 WebSocket Gateway
Location: `apps/backend/src/modules/websocket/`

```typescript
// kitchen.gateway.ts
@WebSocketGateway({
  namespace: '/kitchen',
  cors: { origin: '*' },
})
export class KitchenGateway implements OnGatewayConnection, OnGatewayDisconnect {

  @WebSocketServer()
  server: Server;

  // Room naming convention
  // tenant:{tenantId}:kitchen       → all kitchen staff for a tenant
  // tenant:{tenantId}:class:{classId} → specific class channel

  handleConnection(client: Socket) {
    const tenantId = client.handshake.query.tenantId as string;
    if (tenantId) {
      client.join(`tenant:${tenantId}:kitchen`);
    }
  }

  /**
   * Broadcast portion updates to all kitchen displays.
   * Triggered when Teacher records attendance or adjusts meal count.
   */
  broadcastPortionUpdate(tenantId: string, data: PortionUpdatePayload) {
    this.server
      .to(`tenant:${tenantId}:kitchen`)
      .emit('kitchen:portions-updated', data);
  }

  /**
   * Broadcast food safety alerts (e.g., inspection step completed, sample recorded).
   */
  broadcastSafetyAlert(tenantId: string, alert: SafetyAlertPayload) {
    this.server
      .to(`tenant:${tenantId}:kitchen`)
      .emit('kitchen:safety-alert', alert);
  }
}
```

### 2.2 Event Payloads

```typescript
interface PortionUpdatePayload {
  menuDayId: string;
  mealType: 'BREAKFAST' | 'LUNCH' | 'AFTERNOON_SNACK';
  portions: ClassPortion[];
  totalPortions: number;
  updatedAt: string;  // ISO 8601
}

interface ClassPortion {
  classId: string;
  className: string;
  totalChildren: number;
  presentChildren: number;
  absentChildren: number;
  specialDietCount: number;
}

interface SafetyAlertPayload {
  type: 'INSPECTION_STEP_COMPLETED' | 'SAMPLE_RECORDED' | 'ALERT_CRITICAL';
  inspectionId?: string;
  stepNumber?: 1 | 2 | 3;
  message: string;
  severity: 'INFO' | 'WARNING' | 'CRITICAL';
  timestamp: string;
}
```

### 2.3 Frontend Socket Integration
Location: `apps/frontend/src/core/socket.ts`

```typescript
import { io, Socket } from 'socket.io-client';

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';

let socket: Socket | null = null;

export function connectKitchenSocket(tenantId: string): Socket {
  if (socket?.connected) return socket;

  socket = io(`${SOCKET_URL}/kitchen`, {
    query: { tenantId },
    transports: ['websocket'],
    reconnection: true,
    reconnectionAttempts: 10,
    reconnectionDelay: 2000,
  });

  return socket;
}

export function disconnectSocket() {
  socket?.disconnect();
  socket = null;
}
```

### 2.4 KDS Layout Component
Location: `apps/frontend/src/layouts/KitchenDisplayLayout.tsx`

The KDS layout listens for `kitchen:portions-updated` events and renders:
- Per-class portion cards with real-time headcounts
- Visual indicators for special diet requirements
- 3-step inspection status panel
- Food sample retention timer

---

## 3. 3-Step Food Safety Inspection (Quyết định 1246/QĐ-BYT)

### 3.1 Three Steps

| Step | Vietnamese Name    | English            | When                    | Who Inspects          |
|------|-------------------|---------------------|-------------------------|-----------------------|
| 1    | Trước chế biến    | Before preparation  | Raw materials received  | KITCHEN_STAFF         |
| 2    | Trong chế biến    | During preparation  | Cooking in progress     | KITCHEN_STAFF         |
| 3    | Trước khi ăn      | Before serving      | Food ready to serve     | KITCHEN_STAFF + Teacher |

### 3.2 Inspection Entity

```typescript
// entities/food-inspection.entity.ts
@Entity('food_inspections')
export class FoodInspection {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  menuDayId: string;

  @Column()
  mealType: string;  // BREAKFAST, LUNCH, AFTERNOON_SNACK

  @Column()
  inspectionDate: Date;

  // Step 1: Before preparation
  @Column({ nullable: true })
  step1Status: 'PENDING' | 'PASS' | 'FAIL';
  @Column({ nullable: true })
  step1InspectorId: string;
  @Column({ nullable: true })
  step1Notes: string;
  @Column({ nullable: true })
  step1CompletedAt: Date;

  // Step 2: During preparation
  @Column({ nullable: true })
  step2Status: 'PENDING' | 'PASS' | 'FAIL';
  @Column({ nullable: true })
  step2InspectorId: string;
  @Column({ nullable: true })
  step2Temperature: number;  // °C
  @Column({ nullable: true })
  step2Notes: string;
  @Column({ nullable: true })
  step2CompletedAt: Date;

  // Step 3: Before serving
  @Column({ nullable: true })
  step3Status: 'PENDING' | 'PASS' | 'FAIL';
  @Column({ nullable: true })
  step3InspectorId: string;
  @Column({ nullable: true })
  step3TasteCheck: boolean;
  @Column({ nullable: true })
  step3Notes: string;
  @Column({ nullable: true })
  step3CompletedAt: Date;

  // Overall
  @Column({ default: 'IN_PROGRESS' })
  overallStatus: 'IN_PROGRESS' | 'PASSED' | 'FAILED';

  @Column()
  tenantId: string;
}
```

### 3.3 Inspection Checklist Items

**Step 1 — Trước chế biến (Before Preparation):**
- [ ] Nguyên liệu có giấy chứng nhận nguồn gốc xuất xứ
- [ ] Nguyên liệu không ôi thiu, hết hạn sử dụng
- [ ] Rau quả đã rửa sạch, ngâm đủ 30 phút
- [ ] Thịt/cá tươi, màu sắc bình thường, không có mùi lạ

**Step 2 — Trong chế biến (During Preparation):**
- [ ] Thực phẩm nấu chín đạt nhiệt độ ≥ 70°C
- [ ] Dụng cụ chế biến sạch sẽ, tách riêng sống/chín
- [ ] Nhân viên bếp đeo găng tay, khẩu trang, mũ
- [ ] Không sử dụng phụ gia thực phẩm ngoài danh mục cho phép

**Step 3 — Trước khi ăn (Before Serving):**
- [ ] Thức ăn đạt cảm quan tốt (màu, mùi, vị)
- [ ] Nhiệt độ thức ăn nóng ≥ 60°C khi phục vụ
- [ ] Đã lấy mẫu lưu (250g/món, tủ mát 0–5°C, lưu 24h)
- [ ] Ban giám hiệu / giáo viên đã kiểm tra và ký xác nhận

---

## 4. 24h Food Sample Retention (Lưu Mẫu Thức Ăn)

### 4.1 Requirements
- **Each dish** must have a 250g sample retained.
- Stored at **0–5°C** in a sealed, labeled container.
- Retained for **24 hours minimum** after the last child eats.
- Labels must include: dish name, date/time, inspector name.

### 4.2 Sample Entity

```typescript
@Entity('food_samples')
export class FoodSample {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  inspectionId: string;

  @Column()
  dishName: string;

  @Column()
  sampleWeight: number;  // grams, should be ≥ 250

  @Column()
  storageTemp: number;   // °C, must be 0–5

  @Column()
  collectedAt: Date;

  @Column()
  expiresAt: Date;       // collectedAt + 24h

  @Column({ default: 'RETAINED' })
  status: 'RETAINED' | 'EXPIRED' | 'DISPOSED';

  @Column()
  collectorId: string;   // KITCHEN_STAFF user ID

  @Column()
  tenantId: string;
}
```

---

## 5. API Endpoints

```
POST /api/v1/inspections                    → Create inspection for a menu day
GET  /api/v1/inspections/:id                → Get inspection details
PATCH /api/v1/inspections/:id/step/:step    → Complete an inspection step
POST /api/v1/inspections/:id/samples        → Record food sample
GET  /api/v1/inspections/today              → Today's inspections for tenant
GET  /api/v1/meal-portions/today            → Current portion counts per class
```

---

## 6. Key Conventions
- Socket.IO rooms use format: `tenant:{tenantId}:kitchen`
- Inspection steps must be completed **in order** (step 1 → 2 → 3). Cannot skip.
- A FAIL on any step blocks the next step and generates a `CRITICAL` safety alert.
- Food sample `expiresAt` is auto-calculated: `collectedAt + 24 hours`.
- Temperature readings are in **Celsius (°C)**.
- All inspection actions are **audit-logged** (who, when, what).
