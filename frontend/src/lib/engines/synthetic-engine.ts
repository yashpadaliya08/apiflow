import { faker } from '@faker-js/faker';
import type { Endpoint, KeyValue } from '@/types';

// ═══════════════════════════════════════════════════
// Field-name heuristic map — regex patterns → generators
// ═══════════════════════════════════════════════════
const heuristicMap: Array<{ pattern: RegExp; generate: () => unknown }> = [
  { pattern: /^(email|email_address|user_email)$/i,         generate: () => faker.internet.email() },
  { pattern: /^(password|passwd|pass|secret)$/i,            generate: () => faker.internet.password({ length: 16 }) },
  { pattern: /^(token|access_token|refresh_token|jwt)$/i,   generate: () => `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${faker.string.alphanumeric(36)}.${faker.string.alphanumeric(27)}` },
  { pattern: /^(uuid|guid)$/i,                              generate: () => faker.string.uuid() },
  { pattern: /^(id|_id|userId|user_id|customerId|orderId|productId)$/i, generate: () => `id_${faker.string.alphanumeric(8)}` },
  { pattern: /^(name|full_name|fullName)$/i,                generate: () => faker.person.fullName() },
  { pattern: /^(first_name|firstName)$/i,                   generate: () => faker.person.firstName() },
  { pattern: /^(last_name|lastName)$/i,                     generate: () => faker.person.lastName() },
  { pattern: /^(username|user_name|handle)$/i,              generate: () => faker.internet.username() },
  { pattern: /^(phone|phone_number|mobile)$/i,              generate: () => faker.phone.number() },
  { pattern: /^(address|street|street_address)$/i,          generate: () => faker.location.streetAddress() },
  { pattern: /^(city)$/i,                                   generate: () => faker.location.city() },
  { pattern: /^(country)$/i,                                generate: () => faker.location.country() },
  { pattern: /^(zip|zipcode|postal_code|postcode)$/i,       generate: () => faker.location.zipCode() },
  { pattern: /^(amount|total|subtotal|price|cost)$/i,       generate: () => parseFloat(faker.commerce.price({ min: 10, max: 999 })) },
  { pattern: /^(currency)$/i,                               generate: () => faker.finance.currencyCode() },
  { pattern: /^(date|date_of_birth|dob|birthday)$/i,        generate: () => faker.date.past({ years: 30 }).toISOString().split('T')[0] },
  { pattern: /^(created_at|createdAt|created)$/i,           generate: () => faker.date.past({ years: 1 }).toISOString() },
  { pattern: /^(updated_at|updatedAt|updated)$/i,           generate: () => faker.date.recent({ days: 30 }).toISOString() },
  { pattern: /^(timestamp|time)$/i,                         generate: () => new Date().toISOString() },
  { pattern: /^(sku|product_code|item_code)$/i,             generate: () => `PRD-${faker.number.int({ min: 100, max: 999 })}` },
  { pattern: /^(quantity|qty|count|stock)$/i,               generate: () => faker.number.int({ min: 1, max: 100 }) },
  { pattern: /^(status)$/i,                                 generate: () => faker.helpers.arrayElement(['active', 'pending', 'inactive', 'suspended']) },
  { pattern: /^(role)$/i,                                   generate: () => faker.helpers.arrayElement(['admin', 'user', 'moderator', 'viewer']) },
  { pattern: /^(tier|plan|subscription)$/i,                 generate: () => faker.helpers.arrayElement(['Free', 'Pro', 'Business', 'Enterprise']) },
  { pattern: /^(url|website|link|href)$/i,                  generate: () => faker.internet.url() },
  { pattern: /^(avatar|photo|image|picture)$/i,             generate: () => faker.image.avatar() },
  { pattern: /^(description|bio|about|notes|comment)$/i,   generate: () => faker.lorem.sentence() },
  { pattern: /^(title|subject|heading)$/i,                  generate: () => faker.lorem.words(3) },
  { pattern: /^(customer_id|client_id)$/i,                  generate: () => `usr_${faker.string.alphanumeric(8)}` },
  { pattern: /^(order_id)$/i,                               generate: () => `ord_${faker.string.alphanumeric(8)}` },
  { pattern: /^(items|products)$/i,                         generate: () => [] },
];

// ═══════════════════════════════════════════════════
// Generate a value for a single field name
// ═══════════════════════════════════════════════════
export function generateFieldValue(fieldName: string): unknown {
  for (const { pattern, generate } of heuristicMap) {
    if (pattern.test(fieldName)) return generate();
  }
  // Fallback: generic string
  return faker.lorem.word();
}

// ═══════════════════════════════════════════════════
// Generate synthetic request body from existing JSON
// ═══════════════════════════════════════════════════
export function generateSyntheticBody(existingJson: string): string {
  try {
    const parsed = JSON.parse(existingJson);
    const generated = regenerateObject(parsed);
    return JSON.stringify(generated, null, 2);
  } catch {
    return existingJson;
  }
}

function regenerateObject(obj: unknown): unknown {
  if (Array.isArray(obj)) return obj.map(item => regenerateObject(item));
  if (obj !== null && typeof obj === 'object') {
    const result: Record<string, unknown> = {};
    for (const [key, val] of Object.entries(obj as Record<string, unknown>)) {
      result[key] = generateFieldValue(key) ?? regenerateObject(val);
    }
    return result;
  }
  return obj;
}

// ═══════════════════════════════════════════════════
// Generate paginated list response body
// ═══════════════════════════════════════════════════
export function generateListResponse(resource: string, count = 8): unknown {
  const items = Array.from({ length: count }, (_, i) => ({
    id: `id_${faker.string.alphanumeric(8)}`,
    name: faker.person.fullName(),
    email: faker.internet.email(),
    status: faker.helpers.arrayElement(['active', 'pending', 'inactive']),
    role: faker.helpers.arrayElement(['admin', 'user', 'moderator']),
    createdAt: faker.date.past({ years: 1 }).toISOString(),
    updatedAt: faker.date.recent({ days: 30 }).toISOString(),
  }));
  return {
    data: items,
    pagination: { page: 1, limit: count, total: count * 6, totalPages: 6 },
    meta: { resource, generatedAt: new Date().toISOString() },
  };
}

// ═══════════════════════════════════════════════════
// Generate single-item response
// ═══════════════════════════════════════════════════
export function generateDetailResponse(pathId?: string): unknown {
  return {
    id: pathId ?? `id_${faker.string.alphanumeric(8)}`,
    name: faker.person.fullName(),
    email: faker.internet.email(),
    phone: faker.phone.number(),
    status: faker.helpers.arrayElement(['active', 'pending', 'inactive']),
    role: faker.helpers.arrayElement(['admin', 'user', 'moderator']),
    tier: faker.helpers.arrayElement(['Free', 'Pro', 'Enterprise']),
    avatar: faker.image.avatar(),
    address: {
      street: faker.location.streetAddress(),
      city: faker.location.city(),
      country: faker.location.country(),
      zip: faker.location.zipCode(),
    },
    createdAt: faker.date.past({ years: 1 }).toISOString(),
    updatedAt: faker.date.recent({ days: 30 }).toISOString(),
  };
}

// ═══════════════════════════════════════════════════
// Generate JWT auth response
// ═══════════════════════════════════════════════════
export function generateAuthResponse(endpoint?: Endpoint): unknown {
  let userEmail = faker.internet.email();
  let userName = faker.person.fullName();

  if (endpoint?.requestBody) {
    try {
      const parsed = JSON.parse(endpoint.requestBody);
      if (parsed.email && typeof parsed.email === 'string') {
        userEmail = parsed.email;
        // Derive clean name from email if name not supplied: e.g. "alex.chen@enterprise.dev" -> "Alex Chen"
        const emailPrefix = parsed.email.split('@')[0];
        const derivedName = emailPrefix
          .replace(/[._+-]+/g, ' ')
          .replace(/\b\w/g, (c: string) => c.toUpperCase());
        userName = parsed.name || (derivedName.length > 2 ? derivedName : userName);
      } else if (parsed.username && typeof parsed.username === 'string') {
        userName = parsed.username;
        userEmail = `${parsed.username.toLowerCase()}@enterprise.dev`;
      }
    } catch {
      // Fallback to faker generated
    }
  }

  return {
    access_token: `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.${faker.string.alphanumeric(36)}.${faker.string.alphanumeric(27)}`,
    refresh_token: `rt_${faker.string.alphanumeric(48)}`,
    token_type: 'Bearer',
    expires_in: 3600,
    scope: 'read write',
    user: {
      id: `usr_${faker.string.alphanumeric(8)}`,
      email: userEmail,
      name: userName,
      role: 'admin',
      tier: 'Enterprise',
      avatar: faker.image.avatar(),
    },
  };
}

// ═══════════════════════════════════════════════════
// Generate create/POST success response
// ═══════════════════════════════════════════════════
export function generateCreateResponse(endpoint: Endpoint): unknown {
  const newId = `id_${faker.string.alphanumeric(8)}`;
  try {
    const body = JSON.parse(endpoint.requestBody || '{}');
    return { id: newId, ...body, createdAt: new Date().toISOString() };
  } catch {
    return { id: newId, createdAt: new Date().toISOString() };
  }
}

// ═══════════════════════════════════════════════════
// Interpolate environment variables into a string
// ═══════════════════════════════════════════════════
export function interpolateVariables(
  str: string,
  variables: KeyValue[]
): string {
  return str.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    const found = variables.find(v => v.key === key && v.enabled);
    return found ? found.value : match;
  });
}
