---
name: express-backend
description: Build Express.js REST APIs with TypeScript, Joi validation, PostgreSQL, and layered architecture. Use when developing Express backends, REST endpoints, API controllers, validation schemas, or database models.
---

# Express Backend Development

## Architecture

Use a layered structure:

```
routes → controllers → [services] → models → database
```

- **Routes**: Define HTTP methods and paths; attach validation middleware.
- **Controllers**: Handle request/response; call models or services; return consistent JSON.
- **Services** (optional): Business logic, orchestration across models, cross-entity validation.
- **Models**: Data access; raw SQL via `pg`; transform rows to typed responses.

## App Setup

```typescript
import express from 'express';
import cors from 'cors';
import 'dotenv/config';

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use('/api/v1', routes);

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'UP', timestamp: new Date().toISOString(), service: 'service-name' });
});

app.use((_req, res) => {
  res.status(404).json({ code: 'NOT_FOUND', message: 'Route not found', timestamp: new Date().toISOString() });
});

app.use((err: Error, _req: express.Request, res: express.Response) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    code: 'INTERNAL_ERROR',
    message: err.message || 'An unexpected error occurred',
    timestamp: new Date().toISOString(),
  });
});
```

## Validation (Joi)

Use Joi schemas and a `validate` middleware that populates `req.validatedBody`:

```typescript
// middleware/validator.ts
export const validate = (schema: Schema): RequestHandler => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });
    if (error) {
      const details = error.details.map((d) => d.message);
      return res.status(400).json({
        code: 'VALIDATION_ERROR',
        message: 'Invalid request parameters',
        timestamp: new Date().toISOString(),
        details,
      });
    }
    req.validatedBody = value as Record<string, unknown>;
    return next();
  };
};
```

Extend Express Request:

```typescript
// types/express.d.ts
declare global {
  namespace Express {
    interface Request {
      validatedBody?: Record<string, unknown>;
    }
  }
}
```

Schema patterns:

```typescript
// Create: required fields, optional defaults
export const createSchema = Joi.object({
  name: Joi.string().min(1).max(200).required(),
  description: Joi.string().max(1000).allow(null, ''),
  isActive: Joi.boolean().default(true),
});

// Update: all optional, at least one required
export const updateSchema = Joi.object({
  name: Joi.string().min(1).max(200),
  description: Joi.string().max(1000).allow(null, ''),
  isActive: Joi.boolean(),
}).min(1);
```

## Routes

```typescript
router.post('/resources', validate(schemas.createSchema), ResourceController.create);
router.put('/resources/:id', validate(schemas.updateSchema), ResourceController.update);
router.delete('/resources/:id', ResourceController.delete);
```

Use `getParam(req, 'id')` for route params (handles `string | string[]`):

```typescript
export function getParam(req: Request, name: string): string {
  const v = req.params[name];
  return Array.isArray(v) ? (v[0] ?? '') : (v ?? '');
}
```

## Controllers

Use static class methods. Return consistent error shapes:

```typescript
static async create(req: Request, res: Response): Promise<void> {
  try {
    const data = req.validatedBody as CreatePayload;
    const result = await Model.create(data);
    res.status(201).json(result);
  } catch (error) {
    const err = error as Error;
    res.status(500).json({
      code: 'INTERNAL_ERROR',
      message: err.message,
      timestamp: new Date().toISOString(),
    });
  }
}

static async update(req: Request, res: Response): Promise<void> {
  try {
    const id = getParam(req, 'id');
    const exists = await Model.exists(id);
    if (!exists) {
      res.status(404).json({
        code: 'NOT_FOUND',
        message: 'Resource not found',
        timestamp: new Date().toISOString(),
      });
      return;
    }
    const result = await Model.update(id, req.validatedBody as UpdatePayload);
    res.status(200).json(result);
  } catch (error) { /* ... */ }
}

static async delete(req: Request, res: Response): Promise<void> {
  const deleted = await Model.delete(getParam(req, 'id'));
  if (!deleted) {
    res.status(404).json({ code: 'NOT_FOUND', message: 'Resource not found', timestamp: new Date().toISOString() });
    return;
  }
  res.status(204).send();
}
```

## Models

Use `pg` Pool. Map snake_case DB columns to camelCase in responses:

```typescript
static transformRow(row: Record<string, unknown> | null): ResourceResponse | null {
  if (!row) return null;
  return {
    id: row.id as number,
    name: row.name as string,
    createdAt: row.created_at as Date,
    updatedAt: row.updated_at as Date,
  };
}

static async create(data: CreatePayload): Promise<ResourceResponse | null> {
  const query = `INSERT INTO resources (name) VALUES ($1) RETURNING *`;
  const result = await db.query(query, [data.name]);
  return this.transformRow(result.rows[0] as Record<string, unknown>);
}

static async update(id: string | number, data: UpdatePayload): Promise<ResourceResponse | null> {
  const updates: string[] = [];
  const values: unknown[] = [];
  let paramCount = 1;
  if (data.name !== undefined) {
    updates.push(`name = $${paramCount++}`);
    values.push(data.name);
  }
  if (updates.length === 0) throw new Error('No fields to update');
  values.push(id);
  const query = `UPDATE resources SET ${updates.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = $${paramCount} RETURNING *`;
  const result = await db.query(query, values);
  return this.transformRow(result.rows[0] as Record<string, unknown>);
}

static async exists(id: string | number): Promise<boolean> {
  const result = await db.query('SELECT EXISTS(SELECT 1 FROM resources WHERE id = $1)', [id]);
  return (result?.rows?.[0] as { exists?: boolean })?.exists || false;
}
```

## Database Config

```typescript
import { Pool, types } from 'pg';
types.setTypeParser(types.builtins.INT8, (val: string) => parseInt(val, 10));

const pool = new Pool({
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '5432', 10),
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
});
```

## Error Response Format

Use consistent codes and shape:

| Code             | HTTP | Use case                    |
|------------------|------|-----------------------------|
| VALIDATION_ERROR | 400  | Joi validation failed       |
| NOT_FOUND        | 404  | Resource does not exist     |
| INTERNAL_ERROR   | 500  | Unhandled/server errors     |

Shape: `{ code, message, timestamp, details? }`
