import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

export interface PortionSyncPayload {
  classId: string;
  className: string;
  date: string;
  totalEating: number;
  ateLunch: number;
  ateSnack: number;
  absentCount: number;
  specialDietsCount: number;
  isLocked: boolean;
  lockedAt?: string;
  teacherName: string;
  timestamp: string;
  notes?: string[];
}

export interface AllergyAlertPayload {
  childId?: string;
  childName: string;
  className: string;
  allergen: string;
  severity: string;
  replacementMeal: string;
  noteText?: string;
  priority: string;
  timestamp: string;
}

export interface KitchenStatusPayload {
  classId: string;
  className: string;
  status: 'WAITING' | 'PREPARING' | 'PORTIONING' | 'READY_DELIVERY' | 'DELIVERED';
  statusLabel: string;
  updatedBy: string;
  timestamp: string;
  batchNumber?: number;
  message?: string;
}

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: 'kitchen',
})
export class KitchenGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const tenantId = (client.handshake.query.tenantId as string) || 'a0000000-0000-0000-0000-000000000001';
    const classId = client.handshake.query.classId as string;

    client.join(`tenant_${tenantId}`);
    client.join('kitchen_global');

    if (classId) {
      client.join(`class_${classId}`);
      console.log(`[WebSocket] Client ${client.id} joined class_${classId}`);
    }

    console.log(`[WebSocket] Client ${client.id} connected to Kitchen Gateway (tenant_${tenantId})`);

    // Gửi tín hiệu chào mừng & xác nhận kết nối
    client.emit('CONNECTION_ESTABLISHED', {
      status: 'ONLINE',
      clientId: client.id,
      tenantId,
      serverTime: new Date().toISOString(),
      message: 'Kết nối thời gian thực đến Màn hình Bếp Bán Trú (KDS) thành công',
    });
  }

  handleDisconnect(client: Socket) {
    console.log(`[WebSocket] Client ${client.id} disconnected from kitchen gateway`);
  }

  /**
   * Phát thông báo realtime tới nhà bếp khi giáo viên chốt hoặc thay đổi suất ăn của lớp
   */
  notifyPortionsSynced(tenantId: string, payload: PortionSyncPayload) {
    if (!this.server) return;
    console.log(`[WebSocket] Emitting MEAL_PORTIONS_SYNCED for class ${payload.className}: ${payload.ateLunch} lunch portions`);
    this.server.to(`tenant_${tenantId}`).to('kitchen_global').emit('MEAL_PORTIONS_SYNCED', payload);
  }

  /**
   * Phát cảnh báo khẩn cấp khi có trẻ bị dị ứng cần đổi suất ăn đặc biệt
   */
  notifyAllergyAlert(tenantId: string, payload: AllergyAlertPayload) {
    if (!this.server) return;
    console.log(`[WebSocket] Emitting ALLERGY_ALERT for child ${payload.childName}`);
    this.server.to(`tenant_${tenantId}`).to('kitchen_global').emit('ALLERGY_ALERT', payload);
  }

  /**
   * Phát thông báo trạng thái chuẩn bị từ Nhà Bếp về lại cho Giáo Viên trên lớp
   */
  notifyKitchenStatus(tenantId: string, payload: KitchenStatusPayload) {
    if (!this.server) return;
    console.log(`[WebSocket] Emitting KITCHEN_PORTIONS_ACKNOWLEDGED: ${payload.className} -> ${payload.status}`);
    this.server.to(`tenant_${tenantId}`).to('kitchen_global').emit('KITCHEN_PORTIONS_ACKNOWLEDGED', payload);
  }

  @SubscribeMessage('TEACHER_UPDATE_PORTIONS')
  handleTeacherUpdate(client: Socket, payload: PortionSyncPayload) {
    const tenantId = (client.handshake.query.tenantId as string) || 'a0000000-0000-0000-0000-000000000001';
    this.notifyPortionsSynced(tenantId, payload);
    return { status: 'RECEIVED', timestamp: new Date().toISOString() };
  }

  @SubscribeMessage('KITCHEN_CONFIRM_PREPARED')
  handleKitchenConfirm(client: Socket, payload: KitchenStatusPayload) {
    const tenantId = (client.handshake.query.tenantId as string) || 'a0000000-0000-0000-0000-000000000001';
    this.notifyKitchenStatus(tenantId, payload);
    return { status: 'ACKNOWLEDGED', timestamp: new Date().toISOString() };
  }
}
