require('./register.cjs');
const test = require('node:test');
const assert = require('node:assert/strict');
const { importCollection } = require('../frontend/src/lib/generators/collection-import.ts');
const { exportToOpenAPI } = require('../frontend/src/lib/generators/import-export.ts');
const { prepareRequest } = require('../frontend/src/lib/execution/request.ts');
const { generateSchemaValue } = require('../frontend/src/lib/engines/schema-generator.ts');
const ep = {id:'e',collectionId:'c',name:'Test',method:'POST',path:'/orders',resource:'Orders',headers:[],queryParams:[],pathParams:[],requestBody:'{}',mockScenario:200};

test('successful live POST survives a failed history write without retry', async t => {
  const {useCollectionStore} = require('../frontend/src/store/collection-store.ts');
  const {useExecutionStore} = require('../frontend/src/store/execution-store.ts');
  const {useUIStore} = require('../frontend/src/store/ui-store.ts');
  const {runActiveRequest} = require('../frontend/src/lib/execution/run-active-request.ts');
  let calls=0;
  t.mock.method(globalThis,'fetch',async url => {
    if(url==='/api/telemetry') return new Response('{}');
    calls++; return new Response(JSON.stringify({status:201,statusText:'Created',headers:{},body:'{"id":7}',size:8,latency:1}));
  });
  useCollectionStore.setState({activeEndpoint:ep,activeCollection:{id:'c',baseUrl:'https://example.com'},environments:[],addHistoryEntry:async()=>{throw new Error('QuotaExceededError');}});
  useUIStore.setState({executionMode:'live'});
  await runActiveRequest();
  const state=useExecutionStore.getState();
  assert.equal(state.error,null);
  assert.equal(state.response.status,201);
  assert.match(state.warning,/history/i);
  assert.equal(calls,1);
});

test('import preserves percent-encoded path segments exactly', () => {
  for(const path of ['/files/a%252Fb','/files/%7Bid%7D']) {
    const result=importCollection(JSON.stringify({info:{schema:'https://schema.getpostman.com/json/collection/v2.1.0/collection.json'},item:[{request:{method:'GET',url:'https://example.com'+path}}]}));
    assert.equal(prepareRequest(result.endpoints[0],result.collection.baseUrl).url,'https://example.com'+path);
  }
});

test('successful response survives broken optional analytics bookkeeping', async t => {
  const {useCollectionStore}=require('../frontend/src/store/collection-store.ts');
  const {useExecutionStore}=require('../frontend/src/store/execution-store.ts');
  const {runActiveRequest}=require('../frontend/src/lib/execution/run-active-request.ts');
  const analytics=require('../frontend/src/lib/analytics.ts');
  t.mock.method(analytics,'trackEvent',()=>{throw new Error('Corrupted local metrics');});
  t.mock.method(globalThis,'fetch',async()=>new Response(JSON.stringify({status:201,statusText:'Created',headers:{},body:'{}',size:2,latency:1})));
  let saved=false;
  useCollectionStore.setState({activeEndpoint:ep,addHistoryEntry:async()=>{saved=true;}});
  await runActiveRequest();
  assert.equal(useExecutionStore.getState().error,null);
  assert.equal(useExecutionStore.getState().response.status,201);
  assert.equal(saved,true);
});

test('OpenAPI export splits absolute endpoints into server and path', () => {
  const spec=JSON.parse(exportToOpenAPI({name:'Test',baseUrl:'https://first.example.com'},[{...ep,path:'https://second.example.com/orders/:id',pathParams:[{id:'p',key:'id',value:'7',enabled:true}]}]));
  assert.equal(spec.paths['/orders/{id}'].post.servers[0].url,'https://second.example.com');
});

test('OpenAPI export rejects duplicate operations instead of silently overwriting', () => {
  assert.throws(()=>exportToOpenAPI({name:'Test',baseUrl:'https://first.example.com'},[ep,{...ep,id:'e2',path:'https://second.example.com/orders'}]),/duplicate|collision/i);
});

test('schema generation explicitly rejects unsupported composition', () => {
  assert.throws(()=>generateSchemaValue({type:'integer',minimum:100,oneOf:[{type:'integer'}]},1),/composition|oneOf|supported/i);
});

test('OpenAPI export rejects equivalent path templates with different names', () => {
  assert.throws(()=>exportToOpenAPI({name:'Test',baseUrl:'https://example.com'},[{...ep,path:'/pets/{id}'},{...ep,path:'/pets/{name}',method:'GET'}]),/collision|template/i);
});

test('OpenAPI 3.0 exclusive bounds normalize recursively when exported as 3.1', () => {
  const schema={type:'object',properties:{value:{type:'integer',minimum:0,exclusiveMinimum:true,maximum:10,exclusiveMaximum:false}},example:{exclusiveMinimum:true}};
  const imported=importCollection(JSON.stringify({openapi:'3.0.3',info:{title:'Bounds'},paths:{'/pets':{get:{responses:{200:{content:{'application/json':{schema}}}}}}}}));
  const output=JSON.parse(exportToOpenAPI(imported.collection,imported.endpoints)).paths['/pets'].get.responses['200'].content['application/json'].schema;
  assert.equal(output.properties.value.exclusiveMinimum,0);
  assert.equal(output.properties.value.minimum,undefined);
  assert.equal(output.properties.value.exclusiveMaximum,undefined);
  assert.deepEqual(output.example,{exclusiveMinimum:true});
});

test('schema generation respects 3.0 boolean and 3.1 numeric exclusive bounds', () => {
  for(const schema of [
    {type:'integer',minimum:0,maximum:1,exclusiveMinimum:true},
    {type:'integer',minimum:0,maximum:1,exclusiveMinimum:0.1},
    {type:'integer',minimum:0,maximum:2,exclusiveMinimum:true,exclusiveMaximum:true},
  ]) assert.equal(generateSchemaValue(schema,1),1);
  assert.ok(generateSchemaValue({type:'integer',exclusiveMinimum:100},1)>100);
  const tiny=generateSchemaValue({type:'number',minimum:0.001,maximum:0.002},1);
  assert.ok(tiny>=0.001 && tiny<=0.002);
});
