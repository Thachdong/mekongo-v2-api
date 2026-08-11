import { OtpRequest, TOtpPurpose } from '../../domain/otp-request.entity';

export interface OtpRequestRepositoryPort {
  create(data: {
    purpose: TOtpPurpose;
    accountId: string | null;
    identifier: string | null;
    codeHash: string;
    resendAttempts: number;
    expiresAt: Date;
    blockedUntil: Date | null;
  }): Promise<OtpRequest>;

  findById(id: string): Promise<OtpRequest | null>;

  /** Bản ghi OtpRequest gần nhất cùng purpose+account/identifier,
   * BẤT KỂ trạng thái (kể cả đã consumed/expired)
   * — dùng để carry-forward resendAttempts + biết đang blocked hay không trước khi tạo bản ghi mới. */
  findLatestActive(params: {
    purpose: TOtpPurpose;
    accountId?: string;
    identifier?: string;
  }): Promise<OtpRequest | null>;

  findByResetTokenHash(resetTokenHash: string): Promise<OtpRequest | null>;

  save(otpRequest: OtpRequest): Promise<void>;
}

export const OTP_REQUEST_REPOSITORY = Symbol('OTP_REQUEST_REPOSITORY');
