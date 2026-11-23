export class AppError extends Error {
  constructor(public status: number, message: string, public details?: unknown) {
    super(message);
  }
}
export const notFound = (what: string) => new AppError(404, `${what} not found`);
export const conflict = (message: string) => new AppError(409, message);
