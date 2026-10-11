import { Module, Global } from '@nestjs/common';
import { KitchenGateway } from './kitchen.gateway';

@Global()
@Module({
  providers: [KitchenGateway],
  exports: [KitchenGateway],
})
export class WebsocketModule {}
