import { Injectable, Logger } from '@nestjs/common';
import { OtpSenderPort } from '../../application/ports/otp-sender.port';
import { TLoginType } from '../../domain/value-objects/identifier.vo';

@Injectable()
export class ConsoleOtpSender implements OtpSenderPort {
  private readonly logger = new Logger(ConsoleOtpSender.name);

  async send(
    loginType: TLoginType,
    identifier: string,
    code: string,
  ): Promise<void> {
    this.logger.warn(`[OTP:${loginType}] ${identifier} -> ${code}`);
  }
}
