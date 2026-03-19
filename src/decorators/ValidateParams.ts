import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type AnyHandler = (req: any, res: Response, next: NextFunction) => Promise<void>;

/**
 * Class-field decorator (Stage 3 / TS5 native) that validates `req.params`
 * against the given Zod schema before the handler runs.
 *
 * On success  → attaches the parsed result to `req.paramsDto` and calls the handler.
 * On failure  → forwards the ZodError to Express's error handler via `next(err)`.
 *
 * Usage:
 *   @ValidateParams(MyParamsSchema)
 *   myHandler = async (req: AuthRequest & { paramsDto: MyParams }, res: Response, next: NextFunction) => { ... };
 */
export function ValidateParams(schema: ZodSchema) {
  return function <T extends AnyHandler>(
    _value: undefined,
    _context: ClassFieldDecoratorContext,
  ): (initialValue: T) => T {
    return (originalFn: T): T => {
      const wrapped = async function (
        this: unknown,
        req: Request & { paramsDto?: unknown },
        res: Response,
        next: NextFunction,
      ): Promise<void> {
        const result = schema.safeParse(req.params);
        if (!result.success) {
          next(result.error);
          return;
        }
        req.paramsDto = result.data;
        return originalFn.call(this, req, res, next);
      };
      return wrapped as unknown as T;
    };
  };
}
