export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;

  constructor(msg: string) {
    super(msg);
    this.name = new.target.name;
  }

  /** Field phụ ngoài {code, message} (vd retryAfter, wrongAttemptsRemaining) — override ở subclass cần trả thêm data. */
  toPayload(): Record<string, unknown> {
    return {};
  }
}
