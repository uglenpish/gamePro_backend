import {
  BadRequestException,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { hash, compare } from 'bcrypt';
import { UsersService } from '../users/users.service';
import { SessionsService } from '../sessions/sessions.service';
import { RegisterDto } from 'src/common/dto/register.dto';
import { LoginDto } from 'src/common/dto/login.dto';
import { randomUUID } from 'node:crypto';

interface RefreshTokenPayload {
  sub: string;
  email: string;
  sid: string;
}

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly sessionsService: SessionsService,
    private readonly jwtService: JwtService,
  ) {}

  async register(dto: RegisterDto) {
    const existingUser = await this.usersService.findByEmail(dto.email);

    if (existingUser) {
      throw new BadRequestException('User already exist');
    }

    const passwordHash = await hash(dto.password, 10);

    const user = await this.usersService.createUser(dto.email, passwordHash);

    const accessToken = await this.generateAccessToken(user.id, user.email);

    const sessionId = randomUUID();

    const refreshToken = await this.generateRefreshToken(user.id, user.email, sessionId )

    const refreshTokenHash = await hash(refreshToken, 10);

    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7);



    await this.sessionsService.createSession({
      id: sessionId,
      userId: user.id,
      refreshTokenHash: refreshTokenHash,
      expiresAt: refreshExpiresAt
    })

    return { accessToken, refreshToken };
  }

  async login(dto: LoginDto) {
    const user = await this.usersService.findByEmail(dto.email);

    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isPasswordValid = await compare(dto.password, user.passwordHash);

    if (!isPasswordValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const accessToken = await this.generateAccessToken(user.id, user.email);

    const sessionId = randomUUID();

    const refreshToken = await this.generateRefreshToken(user.id, user.email, sessionId )

    const refreshTokenHash = await hash(refreshToken, 10);

    const refreshExpiresAt = new Date();
    refreshExpiresAt.setDate(refreshExpiresAt.getDate() + 7);

    await this.sessionsService.createSession({
      id: sessionId,
      userId: user.id,
      refreshTokenHash: refreshTokenHash,
      expiresAt: refreshExpiresAt
    })

    return {
      accessToken, refreshToken
    };
  }

  async refresh(oldToken: string) {
    
    let payload: RefreshTokenPayload;

    try {
      payload = await this.jwtService.verifyAsync(oldToken, {
        secret: process.env.JWT_REFRESH_SECRET,
      });
    } catch {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const userId = payload.sub;
    const sessionId = payload.sid;
    const email = payload.email;

    const session = await this.sessionsService.findById(sessionId);

    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    if (!this.sessionsService.isSessionActive(session)) {
      throw new UnauthorizedException('Session is inactive');
    }

    if (session.userId !== userId) {
      throw new UnauthorizedException('Invalid session');
    }

    const isValid = await compare(oldToken, session.refreshTokenHash);

    if (!isValid) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const accessToken = await this.generateAccessToken(userId, email);
    const refreshToken = await this.generateRefreshToken(userId, email, sessionId )

    const refreshTokenHash = await hash(refreshToken, 10);

    await this.sessionsService.updateRefreshTokenHash(sessionId, refreshTokenHash)


    return {
      accessToken,
      refreshToken
    };
  }

  async logout(refreshToken: string) {
    const payload = await this.jwtService.verifyAsync<RefreshTokenPayload>(refreshToken,
      {
        secret: process.env.JWT_REFRESH_SECRET,
      }
    )

    const sessionId = payload.sid;

    const session = await this.sessionsService.findById(sessionId);

    if (!session) {
      throw new UnauthorizedException('Session not found');
    }

    if (!this.sessionsService.isSessionActive(session)) {
      throw new UnauthorizedException('Session is inactive');
    }

    await this.sessionsService.revokedSession(sessionId)
  }

  private generateAccessToken(userId: string, email: string): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: userId,
        email,
      },
      {
        secret: process.env.JWT_ACCESS_SECRET,
        expiresIn: '15m',
      },
    );
  }

  private generateRefreshToken(userId: string, email: string, sessionId: string): Promise<string> {
    return this.jwtService.signAsync(
      {
        sub: userId,
        email,
        sid: sessionId
      },
      {
        secret: process.env.JWT_REFRESH_SECRET,
        expiresIn: '7d'
      }
    )
  }
}
