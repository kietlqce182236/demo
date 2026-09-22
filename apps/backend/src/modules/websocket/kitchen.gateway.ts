import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
  namespace: 'kitchen',
})
export class KitchenGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  handleConnection(client: Socket) {
    const tenantId = client.handshake.query.tenantId as string;
    if (tenantId) {
      client.join(`tenant_${tenantId}`);
      console.log(`[WebSocket] Client ${client.id} joined kitchen room tenant_${tenantId}`);
    }
  }

  handleDisconnect(client: Socket) {
    console.log(`[WebSocket] Client ${client.id} disconnected from kitchen gateway`);
  }

  /**
   * Phát thông báo realtime tới nhà bếp khi giáo viên chốt điểm danh suất ăn buổi sáng
   */
  notifyMealCountUpdated(tenantId: string, payload: { classId: string; mealCount: number; allergyNotes: string[] }) {
    this.server.to(`tenant_${tenantId}`).emit('MEAL_COUNT_UPDATED', payload);
  }

  /**
   * Phát cảnh báo khẩn cấp khi có trẻ bị dị ứng cần đổi suất ăn đặc biệt
   */
  notifyAllergyAlert(tenantId: string, payload: { childName: string; className: string; allergen: string }) {
    this.server.to(`tenant_${tenantId}`).emit('ALLERGY_ALERT', payload);
  }

  @SubscribeMessage('KITCHEN_CONFIRM_PREPARED')
  handleKitchenConfirm(client: Socket, payload: { dishId: string; batchNumber: number }) {
    return { status: 'RECEIVED', timestamp: new Date().toISOString() };
  }
}
