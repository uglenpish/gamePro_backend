import { Controller, Body, Post, Res, Req, UnauthorizedException } from '@nestjs/common';
import type { Response, Request } from 'express';
import { LoginDto } from 'src/common/dto/login.dto';
import { RegisterDto } from 'src/common/dto/register.dto';
import { AuthService } from './auth.service';

@Controller('auth')
export class AuthController {
  constructor(
    private readonly authService: AuthService,
  ) {}

  @Post('register')
  async register(
    @Body() dto: RegisterDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.register(dto);
    
    this.setRefreshTokenCookie(res, refreshToken)

    return { accessToken };
  }

  @Post('login')
  async login(
    @Body() dto: LoginDto,
    @Res({ passthrough: true }) res: Response,
  ) {
    const { accessToken, refreshToken } = await this.authService.login(dto);

    this.setRefreshTokenCookie(res, refreshToken)

    return { accessToken };
  }

  @Post('refresh')
  async refresh(
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request
  ) {
    const refreshToken = req.cookies?.refreshToken;

    if (!refreshToken) {
      throw new UnauthorizedException('Refresh token отсутствует');
    }

    const tokens = await this.authService.refresh(refreshToken)

    this.setRefreshTokenCookie(res, tokens.refreshToken)

    return {
      accessToken: tokens.accessToken,
    };
  }

  @Post('logout')
  async logout(
    @Res({ passthrough: true }) res: Response,
    @Req() req: Request
  ) {
    const refreshToken = req.cookies?.refreshToken;

    if (refreshToken) {
      await this.authService.logout(refreshToken);
    }

    res.clearCookie('refreshToken', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/auth',
    });

    return null;
  }

  private setRefreshTokenCookie(res: Response, refreshToken: string): void {
    res.cookie('refreshToken', refreshToken, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/auth',
        maxAge: 7 * 24 * 60 * 60 * 1000,
    },);
  }
}
