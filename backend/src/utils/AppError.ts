export class AppError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    public message: string,
    public details?: any,
  ) {
    super(message);
    // Needed to properly set prototype when extending built-in Error in Typescript
    Object.setPrototypeOf(this, AppError.prototype);
  }
}
