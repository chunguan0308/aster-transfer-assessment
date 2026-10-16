export class TransferError extends Error {
  constructor(
    public readonly kind: 'network' | 'funds' | 'invalid' | 'conflict' | 'uncertain',
    message: string,
  ) {
    super(message);
    this.name = 'TransferError';
  }
}
