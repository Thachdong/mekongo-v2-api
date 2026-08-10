import { OtpRequestModel } from '@generated/prisma/models';
import { OtpRequest } from '../../domain/otp-request.entity';

export class OtpRequestMapper {
  static toDomain(row: OtpRequestModel): OtpRequest {
    return new OtpRequest(
      row.id,
      row.purpose,
      row.accountId,
      row.identifier,
      row.createdAt,
      row.codeHash,
      row.wrongAttempts,
      row.resendAttempts,
      row.consumeAt, // field Prisma tên "consumeAt" (thiếu "d"), map vào slot _consumedAt của domain
      row.blockedUntil,
      row.expiresAt,
      row.resetTokenHash,
      row.resetTokenExpiresAt,
    );
  }
}
