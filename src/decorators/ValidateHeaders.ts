import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyHandler = (req: any, res: Response, next: NextFunction) => Promise<void>;

/**
 * Class-field decorator (Stage 3 / TS5 native) that validates `req.headers`
 * against the given Zod schema before the handler runs.
 *
 * On success  → attaches the parsed result to `req.headersDto` and calls the handler.
 * On failure  → forwards the ZodError to Express's error handler via `next(err)`.
 *
 * Usage:
 *   @ValidateHeaders(MyHeadersSchema)
 *   myHandler = async (req: AuthRequest & { headersDto: MyHeaders }, res: Response, next: NextFunction) => { ... };
 */
export function ValidateHeaders(schema: ZodSchema) {
  return function <T extends AnyHandler>(
    _value: undefined,
    _context: ClassFieldDecoratorContext,
  ): (initialValue: T) => T {
    return (originalFn: T): T => {
      const wrapped = async function (
        this: unknown,
        req: Request & { headersDto?: unknown },
        res: Response,
        next: NextFunction,
      ): Promise<void> {
        const result = schema.safeParse(req.headers);
        if (!result.success) {
          next(result.error);
          return;
        }
        req.headersDto = result.data;
        return originalFn.call(this, req, res, next);
      };
      return wrapped as unknown as T;
    };
  };
}
