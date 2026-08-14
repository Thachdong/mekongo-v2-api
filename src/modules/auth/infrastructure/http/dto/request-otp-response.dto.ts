export class RequestOtpResponseDto {
  otpRequestId: string;
  expiresAt: Date;
  resendAttemptsRemaining: number;
}
