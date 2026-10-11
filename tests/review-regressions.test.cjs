require('./register.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const { importCollection } = require('../frontend/src/lib/generators/collection-import.ts');
const { prepareRequest } = require('../frontend/src/lib/execution/request.ts');
const { getSharePreview } = require('../frontend/src/lib/utils/share-encoder.ts');
const { generateSchemaValue } = require('../frontend/src/lib/engines/schema-generator.ts');
const endpoint = { method:'GET', name:'Test', path:'/test', resource:'Test', headers:[], queryParams:[], pathParams:[], requestBody:'', mockScenario:200 };
const variable = (key, value) => ({ id:key, key, value, enabled:true });

test('imported Postman URL templates resolve against the selected environment at execution', () => {
  const imported = importCollection(JSON.stringify({ info:{schema:'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'}, variable:[{key:'host',value:'https://production.example.com'},{key:'version',value:'v1'}], item:[{name:'Orders',request:{method:'GET',url:'{{host}}/{{version}}/orders?q={{version}}'}}] }));
  const prepared = prepareRequest(imported.endpoints[0], imported.collection.baseUrl, [variable('host','https://staging.example.com'),variable('version','v2'),...imported.collection.variables]);
  assert.equal(prepared.url, 'https://staging.example.com/v2/orders?q=v2');
});

test('sharing omits credential assertions and preserves harmless checks', () => {
  const preview = getSharePreview({...endpoint, assertions:[
    {id:'a',target:'header',property:'Authorization',operator:'equals',expectedValue:'Bearer SECRET',enabled:true},
    {id:'b',target:'bodyPath',property:'user.password',operator:'equals',expectedValue:'SECRET',enabled:true},
    {id:'c',target:'status',operator:'equals',expectedValue:'200',enabled:true},
  ]});
  assert.equal(JSON.stringify(preview).includes('SECRET'), false);
  assert.equal(preview.assertions.length, 1);
});

test('sharing preserves sensitive schema property structure without its literal secrets', () => {
  const preview = getSharePreview({...endpoint,responseSchema:{type:'object',properties:{token:{type:'string',example:'SECRET',default:'SECRET',enum:['SECRET']},name:{type:'string',const:'Alice'}},required:['token','name']}});
  assert.equal(JSON.stringify(preview).includes('SECRET'), false);
  assert.equal(preview.responseSchema.properties.token.type, 'string');
  assert.equal(generateSchemaValue(preview.responseSchema, 1).name, 'Alice');
});

test('OpenAPI singular examples retain a literal value field', () => {
  const result = importCollection(JSON.stringify({openapi:'3.1.0',info:{title:'Example'},paths:{'/test':{get:{responses:{200:{content:{'application/json':{example:{value:42,currency:'USD'}}}}}}}}}));
  assert.deepEqual(result.endpoints[0].responseExample, {value:42,currency:'USD'});
});

test('schema generator rejects required fields without definitions', () => {
  assert.throws(() => generateSchemaValue({type:'object',required:['id']}, 1), /required/i);
});

test('integer schemas reject unsupported fractional multipleOf constraints', () => {
  assert.throws(() => generateSchemaValue({type:'integer',minimum:0,maximum:2,multipleOf:0.5}, 5), /multipleOf/i);
});

test('schema numeric bounds work when only a negative maximum is given', () => {
  const value = generateSchemaValue({type:'number',maximum:-1}, 1);
  assert.ok(value <= -1);
});

test('Postman export preserves absolute and templated destinations when reimported', () => {
  const { exportToPostman } = require('../frontend/src/lib/generators/import-export.ts');
  const collection = {id:'c',name:'Test',baseUrl:'https://first.example.com',variables:[variable('host','https://second.example.com')]};
  for (const path of ['https://second.example.com/orders', '{{host}}/orders']) {
    const result = importCollection(exportToPostman(collection, [{...endpoint,id:'e',path}]));
    assert.equal(prepareRequest(result.endpoints[0],result.collection.baseUrl,result.collection.variables).url,'https://second.example.com/orders');
  }
});
