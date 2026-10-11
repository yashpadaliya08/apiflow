import type { Endpoint, KeyValue } from '@/types';
import { prepareRequest } from '@/lib/execution/request';

const quoteShell = (text: string) => "'" + text.replace(/'/g, "'\\''") + "'";
const pythonString = (text: string) => "'" + text.replace(/\\/g, '\\\\').replace(/'/g, "\\'").replace(/\r/g, '\\r').replace(/\n/g, '\\n') + "'";

export function buildCurl(endpoint: Endpoint, baseUrl: string, variables: KeyValue[] = []): string {
  const req = prepareRequest(endpoint, baseUrl, variables);
  return ['curl -X ' + req.method + ' ' + quoteShell(req.url),
    ...Object.entries(req.headers).map(([k,v]) => '-H ' + quoteShell(k + ': ' + v)),
    ...(req.body !== undefined ? ['--data-raw ' + quoteShell(req.body)] : []),
  ].join(' \\\n  ');
}
export function buildTypeScript(endpoint: Endpoint, baseUrl: string, variables: KeyValue[] = []): string {
  const req = prepareRequest(endpoint, baseUrl, variables);
  return `const response = await fetch(${JSON.stringify(req.url)}, ${JSON.stringify({ method:req.method, headers:req.headers, ...(req.body !== undefined ? {body:req.body} : {}) }, null, 2)});
console.log(response.status);
console.log(await response.text());`;
}
export function buildAxios(endpoint: Endpoint, baseUrl: string, variables: KeyValue[] = []): string {
  const req = prepareRequest(endpoint, baseUrl, variables);
  return `import axios from 'axios';
const response = await axios.request(${JSON.stringify({url:req.url,method:req.method,headers:req.headers,...(req.body !== undefined ? {data:req.body} : {})},null,2)});
console.log(response.data);`;
}
export function buildPython(endpoint: Endpoint, baseUrl: string, variables: KeyValue[] = []): string {
  const req = prepareRequest(endpoint, baseUrl, variables);
  // JSON is parsed at runtime so true/false/null and Unicode remain valid Python.
  return `import json
import requests

url = ${pythonString(req.url)}
headers = json.loads(${pythonString(JSON.stringify(req.headers))})
${req.body !== undefined ? 'payload = ' + pythonString(req.body) + '\n' : ''}
response = requests.request(${pythonString(req.method)}, url, headers=headers${req.body !== undefined ? ', data=payload.encode("utf-8")' : ''}, timeout=30)
print(response.status_code)
print(response.text)`;
}
export function buildAllSnippets(endpoint: Endpoint, baseUrl: string, variables: KeyValue[] = []) {
  return { curl:buildCurl(endpoint,baseUrl,variables), typescript:buildTypeScript(endpoint,baseUrl,variables), axios:buildAxios(endpoint,baseUrl,variables), python:buildPython(endpoint,baseUrl,variables) };
}
export const generateAllSnippets = buildAllSnippets;
