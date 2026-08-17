import { z } from 'zod';

export const catalogItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  description: z.string().min(1),
  route: z.string().startsWith('/'),
  keywords: z.array(z.string().min(1))
});
export type CatalogItem = z.infer<typeof catalogItemSchema>;

export const notificationItemSchema = z.object({
  id: z.string().min(1),
  title: z.string().min(1),
  summary: z.string().min(1),
  read: z.boolean()
});
export type NotificationItem = z.infer<typeof notificationItemSchema>;

const catalogResponseSchema = z.object({ items: z.array(catalogItemSchema) });
const notificationsResponseSchema = z.object({ items: z.array(notificationItemSchema) });

/** Represents a sanitized transport or contract failure from the Portal BFF. */
export class PortalBffError extends Error {
  constructor(readonly kind: 'http' | 'invalid-response' | 'network') {
    super('Portal BFF request failed.');
  }
}

/** Defines the HTTP operations owned by the Portal's transversal experience. */
export interface PortalBffClient {
  getCatalog(signal?: AbortSignal): Promise<{ items: CatalogItem[] }>;
  searchCatalog(query: string, signal?: AbortSignal): Promise<{ items: CatalogItem[] }>;
  getNotifications(signal?: AbortSignal): Promise<{ items: NotificationItem[] }>;
}

/**
 * Fetches a Portal BFF resource and validates its response at the boundary.
 *
 * It intentionally maps network, HTTP and schema failures to safe error kinds
 * so callers never depend on raw response details.
 */
async function request<T>(path: string, schema: z.ZodType<T>, signal?: AbortSignal): Promise<T> {
  let response: Response;
  try {
    response = await fetch(path, { headers: { Accept: 'application/json' }, signal });
  } catch {
    throw new PortalBffError('network');
  }
  if (!response.ok) throw new PortalBffError('http');
  const parsed = schema.safeParse(await response.json().catch(() => undefined));
  if (!parsed.success) throw new PortalBffError('invalid-response');
  return parsed.data;
}

/** Default client for the deterministic local Portal BFF. */
export const portalBffClient: PortalBffClient = {
  getCatalog: (signal) => request('/api/portal/catalog', catalogResponseSchema, signal),
  searchCatalog: (query, signal) => request(`/api/portal/search?q=${encodeURIComponent(query)}`, catalogResponseSchema, signal),
  getNotifications: (signal) => request('/api/portal/notifications', notificationsResponseSchema, signal)
};
