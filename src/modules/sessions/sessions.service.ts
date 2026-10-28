import { Injectable } from "@nestjs/common";
import { PrismaService } from "src/infrastructure/prisma/prisma.service";

interface CreateSessionData {
    id: string;
    userId: string;
    refreshTokenHash: string;
    userAgent?: string | null;
    ipAddress?: string | null;
    expiresAt: Date;
}

@Injectable()
export class SessionsService {
    constructor(private readonly prisma: PrismaService) {}

    createSession(data: CreateSessionData) {
        return this.prisma.session.create({
            data: {
                id: data.id,
                userId: data.userId,
                refreshTokenHash: data.refreshTokenHash,
                userAgent: data.userAgent,
                ipAddress: data.ipAddress,
                expiresAt: data.expiresAt,
            }
        })
    }

    findById(id: string) {
        return this.prisma.session.findUnique({
            where: {
                id,
            }
        });
    }

    updateRefreshTokenHash(id: string, refreshTokenHash: string) {
        return this.prisma.session.update({
            where: {
                id,
            },
            data: {
                refreshTokenHash
            }
        })
    }

    revokedSession(id: string) {
        return this.prisma.session.update({
            where: {
                id,
            },
            data: {
                revokedAt: new Date(),
            },
        });
    }

    isSessionActive(session: {expiresAt: Date; revokedAt: Date | null;}): boolean {
        return !session.revokedAt && session.expiresAt > new Date();
    }
}