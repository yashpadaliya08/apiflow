import { z } from 'zod';
export const keyValueSchema = z.object({ id: z.string(), key: z.string(), value: z.string(), enabled: z.boolean() });
export const assertionSchema = z.object({
  id: z.string(), target: z.enum(['status', 'responseTime', 'header', 'bodyPath']),
  property: z.string().optional(), operator: z.enum(['equals', 'not_equals', 'contains', 'less_than', 'greater_than', 'is_type', 'exists']),
  expectedValue: z.string(), enabled: z.boolean(),
});
export const sharedEndpointSchema = z.object({
  name: z.string().default('Shared endpoint'), method: z.enum(['GET','HEAD','OPTIONS','POST','PUT','PATCH','DELETE']),
  path: z.string().min(1).max(8192), summary: z.string().optional(), resource: z.string().default('Shared'),
  headers: z.array(keyValueSchema).max(100).default([]), queryParams: z.array(keyValueSchema).max(100).default([]), pathParams: z.array(keyValueSchema).max(100).default([]),
  requestBody: z.string().max(1024 * 1024).default(''), mockScenario: z.union([z.literal(200),z.literal(201),z.literal(400),z.literal(401),z.literal(403),z.literal(404),z.literal(500)]).default(200),
  assertions: z.array(assertionSchema).max(100).optional(), responseSchema: z.record(z.string(), z.unknown()).optional(), responseExample: z.unknown().optional(),
  mockSeed: z.number().int().optional(), mockLatency: z.number().min(0).max(10000).optional(),
});
export const endpointSchema = sharedEndpointSchema.extend({ id: z.string().min(1), collectionId: z.string().min(1), authRequired: z.boolean(), createdAt: z.string(), updatedAt: z.string() });
export const collectionSchema = z.object({ id: z.string().min(1), name: z.string(), description: z.string().optional(), baseUrl: z.string(), variables: z.array(keyValueSchema).optional(), createdAt: z.string(), updatedAt: z.string() });
export const environmentSchema = z.object({ id: z.string().min(1), name: z.string(), variables: z.array(keyValueSchema), isActive: z.boolean() });
