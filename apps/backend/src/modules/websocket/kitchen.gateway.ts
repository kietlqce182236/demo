import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets';
import { Logger } from '@nestjs/common';
import { Server, Socket } from 'socket.io';

@WebSocketGateway({
  cors: {
    origin: '*',
  },
})
export class KitchenGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private readonly logger = new Logger(KitchenGateway.name);

  handleConnection(client: Socket) {
    this.logger.log(`Client connected to Kitchen WebSocket: ${client.id}`);
  }

  handleDisconnect(client: Socket) {
    this.logger.log(`Client disconnected from Kitchen WebSocket: ${client.id}`);
  }

  @SubscribeMessage('join:kitchen')
  handleJoinKitchen(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tenantId?: string },
  ) {
    const room = `tenant:${data?.tenantId || 1}:kitchen`;
    client.join(room);
    this.logger.log(`Socket ${client.id} joined room ${room}`);
    return { event: 'joined', room };
  }

  @SubscribeMessage('join:class')
  handleJoinClass(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { tenantId?: string; classId: string },
  ) {
    const room = `tenant:${data?.tenantId || 1}:class:${data.classId}`;
    client.join(room);
    this.logger.log(`Socket ${client.id} joined room ${room}`);
    return { event: 'joined', room };
  }

  /**
   * Broadcast portion count change to kitchen displays in real-time
   */
  broadcastPortionsUpdate(tenantId: number = 1, payload: any) {
    const room = `tenant:${tenantId}:kitchen`;
    this.server?.to(room).emit('kitchen:portions-updated', payload);
    this.logger.log(`Emitted kitchen:portions-updated to room ${room}`);
  }

  /**
   * Broadcast emergency food safety or allergy alert
   */
  broadcastSafetyAlert(tenantId: number = 1, payload: any) {
    const room = `tenant:${tenantId}:kitchen`;
    this.server?.to(room).emit('safety:alert', payload);
  }
}
