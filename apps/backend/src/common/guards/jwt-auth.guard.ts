import { Injectable } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

/**
 * JWT Auth Guard — Sử dụng strategy 'jwt' đã đăng ký.
 * Gắn vào controller/route để yêu cầu Bearer token hợp lệ.
 *
 * Usage:
 *   @UseGuards(JwtAuthGuard)
 *   @Get('me')
 *   async getProfile(@Req() req) { ... }
 */
@Injectable()
export class JwtAuthGuard extends AuthGuard('jwt') {}
