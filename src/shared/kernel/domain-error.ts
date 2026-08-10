export abstract class DomainError extends Error {
  abstract readonly code: string;
  abstract readonly httpStatus: number;

  constructor(msg: string) {
    super(msg);
    this.name = new.target.name;
  }
}
