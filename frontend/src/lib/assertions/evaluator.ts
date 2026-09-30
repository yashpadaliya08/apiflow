import type { Assertion, AssertionResult, ApiResponse } from '@/types';

/**
 * Safely extracts a value from a nested object using dot-notation or bracket notation.
 * e.g. "data.users.0.id" or "token" or "items.length"
 */
function getValueByPath(obj: any, path: string): any {
  if (!obj || !path) return undefined;
  
  // Clean path: split by dots or bracket notation
  const normalized = path.replace(/\[(\w+)\]/g, '.$1').replace(/^\./, '');
  const parts = normalized.split('.');

  let current = obj;
  for (const part of parts) {
    if (current === null || current === undefined) {
      return undefined;
    }
    current = current[part];
  }
  return current;
}

/**
 * Checks if a string is a valid UUID
 */
function isValidUUID(str: string): boolean {
  if (typeof str !== 'string') return false;
  const regex = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(str);
}

/**
 * Evaluates a single assertion against an API response.
 */
export function evaluateAssertion(assertion: Assertion, response: ApiResponse): AssertionResult {
  const { id, target, property = '', operator, expectedValue } = assertion;

  let actual: any = undefined;
  let targetDesc = '';

  switch (target) {
    case 'status':
      actual = response.status;
      targetDesc = 'Status Code';
      break;

    case 'responseTime':
      actual = response.latency;
      targetDesc = 'Response Latency';
      break;

    case 'header': {
      targetDesc = `Header "${property}"`;
      if (response.headers) {
        // Case-insensitive header lookup
        const headerKey = Object.keys(response.headers).find(
          (k) => k.toLowerCase() === property.toLowerCase()
        );
        actual = headerKey ? response.headers[headerKey] : undefined;
      }
      break;
    }

    case 'bodyPath': {
      targetDesc = `Body path "${property}"`;
      actual = getValueByPath(response.body, property);
      break;
    }
  }

  let passed = false;
  let message = '';

  const actualStr = actual === undefined ? 'undefined' : typeof actual === 'object' ? JSON.stringify(actual) : String(actual);

  switch (operator) {
    case 'equals': {
      const isNum = !isNaN(Number(expectedValue)) && !isNaN(Number(actual));
      passed = isNum ? Number(actual) === Number(expectedValue) : String(actual).toLowerCase() === expectedValue.toLowerCase();
      message = passed ? `${targetDesc} equals ${expectedValue}` : `Expected ${expectedValue}, got ${actualStr}`;
      break;
    }

    case 'not_equals': {
      const isNum = !isNaN(Number(expectedValue)) && !isNaN(Number(actual));
      passed = isNum ? Number(actual) !== Number(expectedValue) : String(actual).toLowerCase() !== expectedValue.toLowerCase();
      message = passed ? `${targetDesc} does not equal ${expectedValue}` : `Expected value to differ from ${expectedValue}`;
      break;
    }

    case 'contains': {
      passed = typeof actualStr === 'string' && actualStr.toLowerCase().includes(expectedValue.toLowerCase());
      message = passed ? `${targetDesc} contains "${expectedValue}"` : `"${actualStr}" does not contain "${expectedValue}"`;
      break;
    }

    case 'less_than': {
      const numActual = Number(actual);
      const numExpected = Number(expectedValue);
      passed = !isNaN(numActual) && !isNaN(numExpected) && numActual < numExpected;
      message = passed ? `${targetDesc} (${numActual}) is less than ${numExpected}` : `Expected < ${numExpected}, got ${numActual}`;
      break;
    }

    case 'greater_than': {
      const numActual = Number(actual);
      const numExpected = Number(expectedValue);
      passed = !isNaN(numActual) && !isNaN(numExpected) && numActual > numExpected;
      message = passed ? `${targetDesc} (${numActual}) is greater than ${numExpected}` : `Expected > ${numExpected}, got ${numActual}`;
      break;
    }

    case 'exists': {
      passed = actual !== undefined && actual !== null;
      message = passed ? `${targetDesc} exists` : `${targetDesc} does not exist in response`;
      break;
    }

    case 'is_type': {
      const type = expectedValue.toLowerCase().trim();
      if (type === 'uuid') {
        passed = isValidUUID(actual);
        message = passed ? `${targetDesc} is valid UUID` : `Expected UUID, got "${actualStr}"`;
      } else if (type === 'array') {
        passed = Array.isArray(actual);
        message = passed ? `${targetDesc} is Array` : `Expected Array, got ${typeof actual}`;
      } else if (type === 'number') {
        passed = typeof actual === 'number' && !isNaN(actual);
        message = passed ? `${targetDesc} is Number` : `Expected Number, got ${typeof actual}`;
      } else if (type === 'boolean') {
        passed = typeof actual === 'boolean';
        message = passed ? `${targetDesc} is Boolean` : `Expected Boolean, got ${typeof actual}`;
      } else if (type === 'string') {
        passed = typeof actual === 'string';
        message = passed ? `${targetDesc} is String` : `Expected String, got ${typeof actual}`;
      } else if (type === 'object') {
        passed = typeof actual === 'object' && actual !== null && !Array.isArray(actual);
        message = passed ? `${targetDesc} is Object` : `Expected Object, got ${typeof actual}`;
      } else {
        passed = typeof actual === type;
        message = passed ? `${targetDesc} is ${type}` : `Expected ${type}, got ${typeof actual}`;
      }
      break;
    }
  }

  return {
    assertionId: id,
    passed,
    target,
    property,
    operator,
    expectedValue,
    actualValue: actualStr,
    message,
  };
}

/**
 * Evaluates all enabled assertions for an endpoint against a response.
 */
export function evaluateAllAssertions(assertions: Assertion[] = [], response: ApiResponse | null): AssertionResult[] {
  if (!response || !assertions || assertions.length === 0) return [];
  const enabled = assertions.filter((a) => a.enabled);
  return enabled.map((assertion) => evaluateAssertion(assertion, response));
}

/**
 * Standard Presets for 1-Click Assertion Creation
 */
export const ASSERTION_PRESETS: { name: string; assertion: Omit<Assertion, 'id' | 'enabled'> }[] = [
  {
    name: 'Status is 200 OK',
    assertion: { target: 'status', operator: 'equals', expectedValue: '200' },
  },
  {
    name: 'Status is 201 Created',
    assertion: { target: 'status', operator: 'equals', expectedValue: '201' },
  },
  {
    name: 'Response Time < 250ms',
    assertion: { target: 'responseTime', operator: 'less_than', expectedValue: '250' },
  },
  {
    name: 'Content-Type is JSON',
    assertion: { target: 'header', property: 'Content-Type', operator: 'contains', expectedValue: 'application/json' },
  },
  {
    name: 'Body has "id"',
    assertion: { target: 'bodyPath', property: 'id', operator: 'exists', expectedValue: 'true' },
  },
  {
    name: '"id" is valid UUID',
    assertion: { target: 'bodyPath', property: 'id', operator: 'is_type', expectedValue: 'uuid' },
  },
  {
    name: '"items" is Array',
    assertion: { target: 'bodyPath', property: 'items', operator: 'is_type', expectedValue: 'array' },
  },
];
