import assert from'node:assert/strict';
import{parseTable,readTable,compareTables,serialize,detectDelimiter,safeCell}from'./dist/core.js';
let n=0;function test(name,fn){fn();n++;console.log('PASS',name);}
test('quoted delimiters, escaped quotes, multiline and trailing empty cell',()=>assert.deepEqual(parseTable('id,note,end\r\n001,"a,b\r\n""yes""",\r\n'),[['id','note','end'],['001','a,b\r\n"yes"','']]));
test('TSV quoted multiline roundtrip',()=>{const r=[['a','b'],['01','x\ty\nz"q']];assert.deepEqual(parseTable(serialize(r,'\t',false),'\t'),r);});
test('reject malformed quotes and ragged tables',()=>{for(const s of ['a,b\n1,"bad','a,b\n1,a"b','a,b\n1,"ok"x'])assert.throws(()=>readTable(s));assert.throws(()=>readTable('a,b\n1'));assert.throws(()=>readTable('a,a\n1,2'));assert.throws(()=>readTable('a,\n1,2'));});
test('auto delimiter ignores quoted delimiter',()=>assert.equal(detectDelimiter('id;"x,y";z\n1;2;3'),';'));
test('added, removed, changed, same, reorder and leading zero',()=>{const a=readTable('id,name,team\n001,A,X\n2,B,Y\n3,C,Z\n4,D,Q');const b=readTable('team,id,name\nX,001,A\nT,2,B\nZ,5,E\nQ,4,D');const r=compareTables(a,b,'id');assert.deepEqual(r.counts,{added:1,removed:1,changed:1,same:2,excludedKeys:0});assert.equal(r.diffs.find(x=>x.status==='변경').column,'team');});
test('duplicate keys excluded on both sides; empty key exception',()=>{const a=readTable('id,v\n1,a\n1,b\n,c\n2,z');const b=readTable('id,v\n1,q\n2,z');const r=compareTables(a,b,'id');assert.equal(r.exceptions.length,3);assert.equal(r.counts.same,1);assert.equal(r.diffs.length,0);assert.deepEqual(r.blocked,['1']);});
test('key whitespace setting explicit and values exact',()=>{const a=readTable('id,v\n 01 ,x'),b=readTable('id,v\n01,x');assert.equal(compareTables(a,b,'id').counts.added,1);assert.equal(compareTables(a,b,'id',true).counts.same,1);});
test('CSV escaping and formula prefix includes fullwidth',()=>{assert.equal(safeCell('  =1'),"'  =1");assert.equal(safeCell('＝1'),"'＝1");assert.equal(safeCell('001'),'001');assert.equal(serialize([['a,b','"x"','=2']]),'"a,b","""x""","\'=2"');});
test('bounds and missing headers',()=>{assert.throws(()=>parseTable('a'.repeat(2000001)));assert.throws(()=>parseTable(Array(202).fill('a').join(',')));assert.throws(()=>compareTables(readTable('id,x\n1,a'),readTable('id,y\n1,a'),'id'));});
globalThis.location={pathname:'/en/'};
const {catalogs,t,translateError}=await import('./dist/i18n.js');
test('six complete language catalogs',()=>{assert.equal(Object.keys(catalogs).length,6);for(const [locale,dict]of Object.entries(catalogs)){for(const [key,value]of Object.entries(dict))assert.ok(typeof value==='string'&&value.length>0,`${locale}/${key}`);assert.equal(Object.keys(dict).length,Object.keys(catalogs.ko).length);}assert.equal(t('title'),'Table Diff');assert.equal(translateError({message:'레코드 3: 닫히지 않은 인용부호입니다.'}),'Record 3: unclosed quote.');});
console.log(`${n} fixture groups passed`);
