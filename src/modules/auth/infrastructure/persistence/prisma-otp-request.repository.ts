import { Injectable } from '@nestjs/common';
import { PrismaService } from '@shared/infrastructure/prisma/prisma.service';
import { OtpRequestRepositoryPort } from '../../application/ports/otp-request.repository.port';
import { OtpRequest, TOtpPurpose } from '../../domain/otp-request.entity';
import { OtpRequestMapper } from './otp-request.mapper';

@Injectable()
export class PrismaOtpRequestRepository implements OtpRequestRepositoryPort {
  constructor(private readonly prisma: PrismaService) {}

  async create(data: {
    purpose: TOtpPurpose;
    accountId: string | null;
    identifier: string | null;
    codeHash: string;
    resendAttempts: number;
    expiresAt: Date;
    blockedUntil: Date | null;
  }): Promise<OtpRequest> {
    const row = await this.prisma.otpRequest.create({ data });
    return OtpRequestMapper.toDomain(row);
  }

  async findById(id: string): Promise<OtpRequest | null> {
    const row = await this.prisma.otpRequest.findUnique({ where: { id } });
    return row ? OtpRequestMapper.toDomain(row) : null;
  }

  async findLatestActive(params: {
    purpose: TOtpPurpose;
    accountId?: string;
    identifier?: string;
  }): Promise<OtpRequest | null> {
    const row = await this.prisma.otpRequest.findFirst({
      where: {
        purpose: params.purpose,
        ...(params.accountId ? { accountId: params.accountId } : {}),
        ...(params.identifier ? { identifier: params.identifier } : {}),
      },
      orderBy: { createdAt: 'desc' },
    });
    return row ? OtpRequestMapper.toDomain(row) : null;
  }

  async findByResetTokenHash(
    resetTokenHash: string,
  ): Promise<OtpRequest | null> {
    const row = await this.prisma.otpRequest.findFirst({
      where: { resetTokenHash },
    });
    return row ? OtpRequestMapper.toDomain(row) : null;
  }

  async save(otpRequest: OtpRequest): Promise<void> {
    await this.prisma.otpRequest.update({
      where: { id: otpRequest.id },
      data: {
        wrongAttempts: otpRequest.getWrongAttempts(),
        consumeAt: otpRequest.getConsumedAt(),
        blockedUntil: otpRequest.getBlockedUntil(),
        resetTokenHash: otpRequest.getResetTokenHash(),
        resetTokenExpiresAt: otpRequest.getResetTokenExpiresAt(),
      },
    });
  }
}
