export function validateResponse(res: any, expectedStatus: number, schema: Record<string, string>): void {
  const chai = require('chai');
  const expect = chai.expect;

  expect(res.getStatus()).to.equal(expectedStatus);

  const body = res.getBody();
  for (const [key, type] of Object.entries(schema)) {
    expect(body[key]).to.be.a(type);
  }
}

export function extractValue(res: any, path: string): any {
  const body = res.getBody();
  const keys = path.split('.');
  let value: any = body;

  for (const key of keys) {
    value = value?.[key];
  }

  return value;
}

export function storeValue(bru: any, varName: string, res: any, path: string): void {
  const value = extractValue(res, path);
  bru.setVar(varName, value);
}

export function storeMultipleValues(bru: any, res: any, mappings: Record<string, string>): void {
  for (const [varName, path] of Object.entries(mappings)) {
    storeValue(bru, varName, res, path);
  }
}

