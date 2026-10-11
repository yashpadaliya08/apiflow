require('./register.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const { importCollection, exportToOpenAPI } = require('../frontend/src/lib/generators/import-export.ts');

test('OpenAPI local references and response schemas survive import and export', () => {
  const document = { openapi:'3.1.0', info:{title:'Store'}, servers:[{url:'https://store.example.com'}], components:{schemas:{Order:{type:'object',properties:{total:{type:'number',minimum:0}},required:['total']}}}, paths:{'/orders':{get:{responses:{'200':{description:'OK',content:{'application/json':{schema:{$ref:'#/components/schemas/Order'}}}}}}}} };
  const imported = importCollection(JSON.stringify(document));
  assert.equal(imported.endpoints[0].responseSchema.properties.total.type, 'number');
  const exported = JSON.parse(exportToOpenAPI(imported.collection, imported.endpoints));
  assert.equal(exported.paths['/orders'].get.responses['200'].content['application/json'].schema.properties.total.minimum, 0);
});

test('Postman import preserves collection variables, inherited bearer auth, disabled queries and multiple origins', () => {
  const document = { info:{name:'Fixture',schema:'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'}, variable:[{key:'token',value:'test-token'}], auth:{type:'bearer',bearer:[{key:'token',value:'{{token}}'}]}, item:[{name:'A',request:{method:'GET',url:'https://first.example.com/a'}},{name:'B',request:{method:'GET',url:{raw:'https://second.example.com/b?q=1',query:[{key:'q',value:'1',disabled:true}]}}}] };
  const result = importCollection(JSON.stringify(document));
  assert.equal(result.collection.variables[0].value, 'test-token');
  assert.equal(result.endpoints[0].headers.find(h => h.key === 'Authorization').value, 'Bearer {{token}}');
  assert.equal(result.endpoints[1].path, 'https://second.example.com/b');
  assert.equal(result.endpoints[1].queryParams[0].enabled, false);
});

test('unsupported or malformed imports produce actionable failures', () => {
  assert.throws(() => importCollection('openapi: 3.1.0'), /JSON/i);
  assert.throws(() => importCollection('{"openapi":"3.1.0","paths":[]}'), /paths/i);
});
