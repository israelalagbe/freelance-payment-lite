import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyHandler = (req: any, res: Response, next: NextFunction) => Promise<void>;

/**
 * Class-field decorator (Stage 3 / TS5 native) that validates `req.body`
 * against the given Zod schema before the handler runs.
 *
 * On success  → attaches the parsed result to `req.dto` and calls the handler.
 * On failure  → forwards the ZodError to Express's error handler via `next(err)`.
 *
 * Usage:
 *   @ValidateBody(MyDto)
 *   myHandler = async (req: AuthRequest & { dto: MyDto }, res: Response, next: NextFunction) => { ... };
 */
export function ValidateBody(schema: ZodSchema) {
  return function <T extends AnyHandler>(
    _value: undefined,
    _context: ClassFieldDecoratorContext,
  ): (initialValue: T) => T {
    return (originalFn: T): T => {
      const wrapped = async function (
        this: unknown,
        req: Request & { dto?: unknown },
        res: Response,
        next: NextFunction,
      ): Promise<void> {
        const result = schema.safeParse(req.body);
        if (!result.success) {
          next(result.error);
          return;
        }
        req.dto = result.data;
        return originalFn.call(this, req, res, next);
      };
      return wrapped as unknown as T;
    };
  };
}
