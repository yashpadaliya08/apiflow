import { Faker, en } from '@faker-js/faker';

// A bounded JSON Schema subset. Unsupported constraints fail explicitly instead of
// silently presenting a made-up response as a valid contract sample.
export function generateSchemaValue(schema: Record<string, unknown>, seed?: number): unknown {
  const random = new Faker({ locale: [en] });
  if (seed !== undefined) {
    random.seed(seed);
    random.setDefaultRefDate('2024-01-01T00:00:00.000Z');
  }
  let nodes = 0;
  function generate(raw: unknown, depth = 0): unknown {
    if (++nodes > 1000 || depth > 12) throw new Error('Mock schema exceeds the supported nesting or size limit.');
    if (!raw || typeof raw !== 'object' || Array.isArray(raw)) throw new Error('Expected a JSON Schema object.');
    const s = raw as Record<string, any>;
    if ('$ref' in s) throw new Error('Resolve schema references before generating a mock.');
    if ('const' in s) return structuredClone(s.const);
    if (Array.isArray(s.enum) && s.enum.length) return structuredClone(random.helpers.arrayElement(s.enum));
    if ('example' in s) return structuredClone(s.example);
    if (Array.isArray(s.examples) && s.examples.length) return structuredClone(s.examples[0]);
    if ('default' in s) return structuredClone(s.default);
    if (s.pattern || s.allOf || s.not || s.if || s.dependentSchemas) throw new Error('This schema uses constraints not yet supported for generation. Supply a response example instead.');
    if (s.oneOf || s.anyOf) throw new Error('Schema composition (oneOf/anyOf) is not supported for generation. Supply a response example instead.');
    const type = Array.isArray(s.type) ? s.type.find((t: string) => t !== 'null') || 'null' : s.type || (s.properties ? 'object' : s.items ? 'array' : 'string');
    if (type === 'null') return null;
    if (type === 'boolean') return random.datatype.boolean();
    if (type === 'object') {
      const props = s.properties || {};
      if (!props || typeof props !== 'object' || Array.isArray(props)) throw new Error('Schema properties must be an object.');
      if (s.required !== undefined && (!Array.isArray(s.required) || s.required.some((key: unknown) => typeof key !== 'string' || !Object.prototype.hasOwnProperty.call(props, key)))) throw new Error('Each required field must have a property schema. Supply a response example instead.');
      const count = Object.keys(props).length;
      if ((s.minProperties !== undefined && count < s.minProperties) || (s.maxProperties !== undefined && count > s.maxProperties)) throw new Error('Property count constraints require a response example.');
      if (s.patternProperties || s.propertyNames || s.dependentRequired) throw new Error('Unsupported object constraints. Supply a response example instead.');
      return Object.fromEntries(Object.entries(props).map(([key, child]) => [key, generate(child, depth + 1)]));
    }
    if (type === 'array') {
      const min = Number.isInteger(s.minItems) ? s.minItems : 1;
      const max = Number.isInteger(s.maxItems) ? s.maxItems : Math.max(3, min);
      if (min < 0 || max < min || min > 100) throw new Error('Unsupported array size constraints (maximum 100 generated items).');
      const count = Math.min(Math.max(min, 2), max, 100);
      if (s.uniqueItems) throw new Error('Provide an example for arrays requiring uniqueItems.');
      return Array.from({ length: count }, () => generate(s.items || { type: 'string' }, depth + 1));
    }
    if (type === 'integer' || type === 'number') {
      if (s.multipleOf !== undefined && (typeof s.multipleOf !== 'number' || s.multipleOf <= 0 || (type === 'integer' && !Number.isInteger(s.multipleOf)))) throw new Error('Unsupported multipleOf constraint. Integer mocks require an integer multipleOf.');
      let min = typeof s.minimum === 'number' ? s.minimum : -Infinity;
      let max = typeof s.maximum === 'number' ? s.maximum : Infinity;
      let strictMin = s.exclusiveMinimum === true && Number.isFinite(min);
      let strictMax = s.exclusiveMaximum === true && Number.isFinite(max);
      if (typeof s.exclusiveMinimum === 'number' && s.exclusiveMinimum >= min) { min = s.exclusiveMinimum; strictMin = true; }
      if (typeof s.exclusiveMaximum === 'number' && s.exclusiveMaximum <= max) { max = s.exclusiveMaximum; strictMax = true; }
      if (min === -Infinity) min = Number.isFinite(max) ? Math.min(0, max - 100) : 0;
      if (max === Infinity) max = Math.max(100, min + 100);
      const valid = (value: number) => Number.isFinite(value) && (strictMin ? value > min : value >= min) && (strictMax ? value < max : value <= max);
      if (!Number.isFinite(min) || !Number.isFinite(max) || min > max) throw new Error('Incompatible numeric schema constraints.');
      const step = s.multipleOf ?? (type === 'integer' ? 1 : null);
      let value: number;
      if (step !== null) {
        const low = strictMin ? Math.floor(min / step) + 1 : Math.ceil(min / step);
        const high = strictMax ? Math.ceil(max / step) - 1 : Math.floor(max / step);
        if (!Number.isSafeInteger(low) || !Number.isSafeInteger(high) || low > high) throw new Error('Incompatible numeric schema constraints.');
        value = random.number.int({ min: low, max: high }) * step;
      } else {
        // Choose an interior point without imposing an arbitrary decimal precision.
        const fraction = random.number.int({ min: 1, max: 999999 }) / 1000000;
        value = min * (1 - fraction) + max * fraction;
      }
      if (!valid(value)) throw new Error('Numeric constraints cannot be represented safely. Supply an example.');
      return value;
    }
    if (type !== 'string') throw new Error(`Unsupported schema type: ${type}`);
    const formats: Record<string, () => string> = {
      email: () => random.internet.email(), uuid: () => random.string.uuid(),
      uri: () => random.internet.url(), url: () => random.internet.url(),
      'date-time': () => random.date.past().toISOString(), date: () => random.date.past().toISOString().slice(0,10),
      hostname: () => random.internet.domainName(), ipv4: () => random.internet.ipv4(), ipv6: () => random.internet.ipv6(),
    };
    const min = s.minLength ?? 1, max = s.maxLength ?? 10000;
    if (!Number.isInteger(min) || !Number.isInteger(max) || min < 0 || max < min || min > 10000) throw new Error('Invalid string length constraints.');
    if (s.format && !formats[s.format]) throw new Error(`Unsupported string format: ${s.format}. Supply an example.`);
    const value = s.format ? formats[s.format]() : random.string.alpha({ length: Math.min(max, Math.max(min, 8)) });
    if (value.length < min || value.length > max) throw new Error('Generated format conflicts with string length constraints. Supply an example.');
    return value;
  }
  return generate(schema);
}
