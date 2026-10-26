export const LIMITS={characters:2000000,rows:10001,columns:200,cells:500000};
export function parseTable(input,delimiter=','){
 if(typeof input!=='string'||!input.trim())throw Error('표를 입력하세요.');
 if(input.length>LIMITS.characters)throw Error('입력은 2,000,000자 이하만 지원합니다.');
 if(![',','\t',';','|'].includes(delimiter))throw Error('지원하지 않는 구분자입니다.');
 let text=input.replace(/^\uFEFF/,''),rows=[],row=[],cell='',quoted=false,closed=false,cells=0;
 const field=()=>{row.push(cell);cell='';closed=false;if(row.length>LIMITS.columns)throw Error('열은 200개 이하만 지원합니다.');if(++cells>LIMITS.cells)throw Error('셀은 500,000개 이하만 지원합니다.');};
 const record=()=>{field();rows.push(row);row=[];if(rows.length>LIMITS.rows)throw Error('헤더 포함 10,001행 이하만 지원합니다.');};
 for(let i=0;i<text.length;i++){
  const c=text[i];
  if(quoted){if(c==='"'){if(text[i+1]==='"'){cell+='"';i++;}else{quoted=false;closed=true;}}else cell+=c;continue;}
  if(c===delimiter){field();continue;}
  if(c==='\r'||c==='\n'){record();if(c==='\r'&&text[i+1]==='\n')i++;continue;}
  if(closed)throw Error(`레코드 ${rows.length+1}: 닫는 인용부호 뒤에 문자가 있습니다.`);
  if(c==='"'){if(cell!=='')throw Error(`레코드 ${rows.length+1}: 셀 중간의 인용부호는 두 번 쓰고 셀을 감싸세요.`);quoted=true;}
  else cell+=c;
 }
 if(quoted)throw Error(`레코드 ${rows.length+1}: 닫히지 않은 인용부호입니다.`);
 if(row.length||cell!==''||closed||!/[\r\n]$/.test(text))record();
 return rows;
}
export function detectDelimiter(text){
 let quoted=false,counts=new Map([['\t',0],[',',0],[';',0],['|',0]]);
 for(let i=0;i<text.length;i++){let c=text[i];if(c==='"'){if(quoted&&text[i+1]==='"')i++;else quoted=!quoted;}else if(!quoted){if(c==='\r'||c==='\n')break;if(counts.has(c))counts.set(c,counts.get(c)+1);}}
 return [...counts].sort((a,b)=>b[1]-a[1])[0][0];
}
export function readTable(text,delimiter='auto'){
 const actual=delimiter==='auto'?detectDelimiter(text):delimiter,rows=parseTable(text,actual),headers=rows[0];
 if(headers.some(x=>!x.trim()))throw Error('헤더 이름을 모두 채우세요.');
 if(new Set(headers).size!==headers.length)throw Error('중복된 헤더 이름이 있습니다.');
 rows.slice(1).forEach((r,i)=>{if(r.length!==headers.length)throw Error(`레코드 ${i+2}: ${r.length}열입니다. 헤더의 ${headers.length}열과 같아야 합니다.`);});
 return {headers,rows:rows.slice(1),delimiter:actual};
}
export function compareTables(a,b,key,trimKey=false){
 if(!a.headers.includes(key)||!b.headers.includes(key))throw Error('양쪽 표에 있는 키 열을 선택하세요.');
 if(a.headers.length!==b.headers.length||a.headers.some(h=>!b.headers.includes(h)))throw Error('양쪽 헤더 이름 집합이 같아야 합니다. 열 순서는 달라도 됩니다.');
 const exceptions=[],maps=[],blocked=new Set();
 [a,b].forEach((table,side)=>{
  const idx=table.headers.indexOf(key),groups=new Map();
  table.rows.forEach((row,i)=>{let k=trimKey?row[idx].trim():row[idx];if(!k.trim()){exceptions.push({side:side?'B':'A',record:i+2,key:k,reason:'빈 키',row});return;}if(!groups.has(k))groups.set(k,[]);groups.get(k).push({row,record:i+2});});
  for(const [k,g] of groups)if(g.length>1){blocked.add(k);for(const item of g)exceptions.push({side:side?'B':'A',record:item.record,key:k,reason:'중복 키',row:item.row});}
  maps.push(groups);
 });
 const diffs=[],counts={added:0,removed:0,changed:0,same:0,excludedKeys:blocked.size};
 for(const k of new Set([...maps[0].keys(),...maps[1].keys()])){
  if(blocked.has(k))continue;
  const x=maps[0].get(k)?.[0],y=maps[1].get(k)?.[0];
  if(!x||!y){const status=x?'누락':'추가';counts[x?'removed':'added']++;for(const h of a.headers)diffs.push({status,key:k,column:h,before:x?x.row[a.headers.indexOf(h)]:'',after:y?y.row[b.headers.indexOf(h)]:'',aRecord:x?.record??'',bRecord:y?.record??''});}
  else{let changed=false;for(const h of a.headers){if(h===key&&trimKey)continue;const before=x.row[a.headers.indexOf(h)],after=y.row[b.headers.indexOf(h)];if(before!==after){changed=true;diffs.push({status:'변경',key:k,column:h,before,after,aRecord:x.record,bRecord:y.record});}}counts[changed?'changed':'same']++;}
 }
 return {counts,diffs,exceptions,blocked:[...blocked]};
}
export function safeCell(value){const s=String(value);return /^[\s]*[=+\-@＝＋－＠]/u.test(s)||/^[\t\r\n]/.test(s)?"'"+s:s;}
export function serialize(rows,delimiter=',',safe=true){return rows.map(row=>row.map(value=>'"'+(safe?safeCell(value):String(value)).replaceAll('"','""')+'"').join(delimiter)).join('\r\n');}
export function diffRows(result){return [['상태','키','열','A 값','B 값','A 레코드','B 레코드'],...result.diffs.map(d=>[d.status,d.key,d.column,d.before,d.after,d.aRecord,d.bRecord])];}
export function exceptionRows(result){return [['표','레코드','키','사유','원본 행(JSON)'],...result.exceptions.map(e=>[e.side,e.record,e.key,e.reason,JSON.stringify(e.row)])];}
