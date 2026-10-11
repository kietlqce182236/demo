import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule, ConfigService } from '@nestjs/config';
import * as pg from 'pg';

// Automatically parse PostgreSQL int8 (bigint/BIGSERIAL, OID 20) as JavaScript numbers
pg.types.setTypeParser(20, (val: string) => (val === null ? null : parseInt(val, 10)));

@Module({
  imports: [
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      inject: [ConfigService],
      useFactory: (configService: ConfigService) => ({
        type: 'postgres',
        host: configService.get<string>('database.host'),
        port: configService.get<number>('database.port'),
        username: configService.get<string>('database.username'),
        password: configService.get<string>('database.password'),
        database: configService.get<string>('database.database'),
        autoLoadEntities: true,
        synchronize: false,
        logging: configService.get<string>('nodeEnv') === 'development' ? ['error', 'warn'] : false,
        ssl: false,
      }),
    }),
  ],
  exports: [TypeOrmModule],
})
export class DatabaseModule {}
