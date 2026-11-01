'use strict';
const http=require('node:http'),fs=require('node:fs'),path=require('node:path');
const {randomBytes,createHash,webcrypto}=require('node:crypto');
const {createStore}=require('./storage.cjs');
const hash=s=>createHash('sha256').update(String(s)).digest('hex');
const secret=()=>randomBytes(24).toString('base64url');
function fail(code,message){const e=new Error(message);e.status=code;throw e;}
function text(x,max=200){if(typeof x!=='string'||!x.trim()||x.length>max)fail(400,'Virheellinen teksti');return x.trim();}
function gameValid(g){if(!g||typeof g!=='object'||typeof g.id!=='string'||typeof g.pub!=='string'||!Array.isArray(g.sched)||g.sched.length!==7||g.sched.some((v,i)=>v.v!==['lahto','discover','define','kapeikko','telakka','regatta','ranta'][i]||!Number.isFinite(v.m)||v.m<0.1||v.m>120)||!(g.start===null||Number.isFinite(g.start))||!Number.isInteger(g.seq)||g.seq<0||!Array.isArray(g.ev))fail(400,'Virheellinen pelitila');return structuredClone(g);}
function publicGame(r){const g=r.game,k=g.kriisi;return {t:'g',id:g.id,nimi:g.nimi,pub:g.pub,sched:g.sched,start:g.start,seq:g.seq,ev:g.ev||[],kr:k?{id:k.id,l:k.laji,k:k.kohde||'',ki:k.kohdeKi||'',kn:k.kohdeN||'',o:k.otsikko,u:k.kuvaus,a:k.alku,e:k.e,v:k.v}:null};}
function lasti(m,r){const p=m.snapshot?.p||{},f=k=>p[k]||'';return {t:'l',g:r.game.id,p:m.id,n:m.name,li:m.snapshot?.lippu||'#3F7FCF',ki:m.snapshot?.kirj||m.name.slice(0,2).toUpperCase(),ph:m.snapshot?.nakyma||'lahto',h:f('haaste'),ken:f('kenelle'),ol:(p.oletukset||[]).map(o=>[o.t,o.koe||'']),lo:(p.loydot||[]).map(l=>[l.t,l.tapa,l.src==='oma'?1:0]),ov:f('oivallus'),kr:(p.kriteerit||[]).map(k=>k.t),hmw:f('hmw'),mit:f('mittari'),raj:f('rajaus'),ve:(p.veneet||[]).map(b=>b.nimi),mu:p.muona??12,le:(p.leimat||[]).length,ka:!!m.approved,al:(p.liitto||[]).map(a=>a.id)};}
function createApp({database=path.join(__dirname,'data','purjehdus.sqlite'),store:providedStore}={}){
 const store=providedStore||createStore({database}),db=store.db,live=new Map(),locks=new Map();
 const get=async code=>{const room=await store.get(code);if(!room)fail(404,'Peliä ei löydy');return room;};
 const put=r=>store.put(r);
 async function lock(key){const previous=locks.get(key)||Promise.resolve();let release;const next=new Promise(resolve=>release=resolve);locks.set(key,next);await previous;return()=>{release();if(locks.get(key)===next)locks.delete(key);};}
 const limits=new Map();function limit(ip){const now=Date.now(),v=limits.get(ip)||{at:now,n:0};if(now-v.at>60000){v.at=now;v.n=0;}if(++v.n>40)fail(429,'Liian monta yritystä. Odota minuutti.');limits.set(ip,v);if(limits.size>10000)limits.clear();}
 function member(r,req){const token=(req.headers.authorization||'').replace(/^Bearer /,'');const m=r.members.find(m=>m.tokenHash===hash(token));if(!token||!m)fail(401,'Istunto ei kelpaa. Liity peliin uudelleen.');return m;}
 function view(r,m){return {code:r.code,role:m.role,id:m.id,name:m.name,game:publicGame(r),hostGame:m.role==='johtaja'?r.game:undefined,serverNow:Date.now(),gameRevision:r.gameRevision,privateKey:m.role==='pelaaja'?undefined:r.privateKey,teacherCode:m.role==='johtaja'?r.teacherCode:undefined,own:m.snapshot,inbox:m.inbox||[],roster:r.members.filter(x=>x.role==='pelaaja').map(x=>({id:x.id,name:x.name,online:Date.now()-(live.get(x.id)||x.seen||0)<12000,lasti:m.role==='pelaaja'?undefined:lasti(x,r)})),teachers:r.members.filter(x=>x.role==='satama'||x.role==='luotsi').map(x=>({name:x.name,role:x.role}))};}
 async function body(req){let bytes=0,chunks=[];for await(const c of req){bytes+=c.length;if(bytes>1000000)fail(413,'Liian suuri pyyntö');chunks.push(c);}try{return JSON.parse(Buffer.concat(chunks).toString()||'{}');}catch{fail(400,'Virheellinen JSON');}}
 const server=http.createServer(async(req,res)=>{let unlock;try{
  res.setHeader('X-Content-Type-Options','nosniff');res.setHeader('Referrer-Policy','no-referrer');res.setHeader('Cache-Control','no-store');
  const url=new URL(req.url,'http://localhost'),parts=url.pathname.split('/').filter(Boolean);
  if(req.headers.origin&&new URL(req.headers.origin).host!==req.headers.host)fail(403,'Väärä alkuperä');
  const json=(data,status=200)=>{res.writeHead(status,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify(data));};
  if(url.pathname==='/health')return json({ok:true});
  if(parts[0]!=='api'){
   if(req.method!=='GET'&&req.method!=='HEAD')fail(405,'Vain GET');
   const files={'/':'index.html','/index.html':'index.html','/game.html':'game.html','/net.js':'net.js','/lobby.js':'lobby.js'};
   const file=files[url.pathname];if(!file)fail(404,'Sivua ei löydy');
   res.setHeader('Content-Security-Policy',"default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: blob:; connect-src 'self'; media-src 'none'; frame-ancestors 'self'; base-uri 'self'");
   res.setHeader('Permissions-Policy','camera=(), microphone=()');
   res.setHeader('Content-Type',file.endsWith('.js')?'text/javascript; charset=utf-8':'text/html; charset=utf-8');return fs.createReadStream(path.join(__dirname,'public',file)).pipe(res);
  }
  if(parts[1]!=='rooms')fail(404,'Tuntematon reitti');
  const payload=['POST','PUT','PATCH'].includes(req.method)?await body(req):null;
  if(parts[2])unlock=await lock(parts[2].toUpperCase());
  if(parts.length===2&&req.method==='POST'){
   limit(req.socket.remoteAddress);const b=payload,game=gameValid(b.game);text(b.privateKey,1000);text(b.name,80);
   const code=randomBytes(5).toString('hex').toUpperCase(),token=secret(),id=secret();
   const r={code,game,gameRevision:0,privateKey:b.privateKey,teacherCode:secret().slice(0,12),created:Date.now(),members:[{id,name:b.name,role:'johtaja',tokenHash:hash(token),inbox:[],seen:Date.now()}],audit:[]};await put(r);return json({token,...view(r,r.members[0])},201);
  }
  const code=String(parts[2]||'').toUpperCase();
  if(parts[3]==='join'&&req.method==='POST'){
   limit(req.socket.remoteAddress);const b=payload,r=await get(code),role=b.role==='pelaaja'?'pelaaja':b.role==='satama'?'satama':b.role==='luotsi'?'luotsi':null;
   if(!role)fail(400,'Tuntematon rooli');if(role!=='pelaaja'&&hash(b.teacherCode||'')!==hash(r.teacherCode))fail(403,'Väärä opettajatunnus');
   if(r.members.filter(m=>m.role==='pelaaja').length>=(role==='pelaaja'?15:Infinity))fail(409,'Peli on täynnä (15 venettä)');
   if(role!=='pelaaja'&&r.members.filter(m=>['satama','luotsi'].includes(m.role)).length>=4)fail(409,'Neljä opettajapaikkaa on käytössä');
   const token=secret(),m={id:secret(),name:text(b.name,80),role,tokenHash:hash(token),inbox:[],seen:Date.now(),approved:false};r.members.push(m);await put(r);return json({token,...view(r,m)},201);
  }
  // Body is fully received BEFORE loading a room for mutation, avoiding interleaved stale writes.
  const b=payload;
  const r=await get(code),m=member(r,req);m.seen=Date.now();live.set(m.id,m.seen);
  if(parts[3]==='session'&&req.method==='GET')return json(view(r,m));
  if(parts[3]==='snapshot'&&req.method==='PUT'){
   if(m.role!=='pelaaja')fail(403,'Vain pelaaja');if(!b.p||typeof b.p!=='object'||Array.isArray(b.p))fail(400,'Pelaajatila puuttuu');
   const arrays=['oletukset','loydot','oivallusLahteet','kriteerit','veneet','leimat','sovelletut','nonces','liitto','kirja'];
   for(const key of arrays)if(b.p[key]!==undefined&&(!Array.isArray(b.p[key])||b.p[key].length>2000))fail(400,'Virheellinen pelaajalista');
   for(const key of ['oletukset','loydot','kriteerit'])if((b.p[key]||[]).some(x=>!x||typeof x.id!=='string'||typeof x.t!=='string'))fail(400,'Virheellinen kirjaus');
   if((b.p.veneet||[]).some(x=>!x||typeof x.id!=='string'||typeof x.nimi!=='string'))fail(400,'Virheellinen vene');
   b.p.kapeikkoAuki=!!m.approved;m.snapshot={p:b.p,nakyma:typeof b.nakyma==='string'?b.nakyma:'lahto',lippu:/^#[a-f0-9]{6}$/i.test(b.lippu)?b.lippu:'#3F7FCF',kirj:typeof b.kirj==='string'?b.kirj.replace(/[^a-z0-9äöå]/gi,'').slice(0,3):''};await put(r);return json({ok:true});
  }
  if(parts[3]==='game'&&req.method==='PUT'){
   if(m.role!=='johtaja')fail(403,'Vain pelinjohtaja');if(b.revision!==r.gameRevision)fail(409,'Pelitilaa muutettiin toisessa ikkunassa. Päivitä sivu.');
   const g=gameValid(b.game);if(g.id!==r.game.id||g.pub!==r.game.pub)fail(400,'Pelin tunniste ei saa muuttua');r.game=g;r.gameRevision++;r.audit.push({at:Date.now(),by:m.name,event:'Pelin päivitys',seq:g.seq});await put(r);return json({ok:true,revision:r.gameRevision});
  }
  if(parts[3]==='stamp'&&req.method==='POST'){
   if(m.role==='pelaaja')fail(403,'Vain ohjaaja');const stamp=b.stamp,target=r.members.find(x=>x.id===stamp?.p&&x.role==='pelaaja');
   if(!target||stamp.g!==r.game.id||!['luotsi','satama'].includes(stamp.k)||!Number.isInteger(stamp.v)||stamp.v<0||stamp.v>4||typeof stamp.nonce!=='string')fail(400,'Virheellinen leima');
   const key=await webcrypto.subtle.importKey('raw',Buffer.from(r.game.pub,'base64url'),{name:'ECDSA',namedCurve:'P-256'},false,['verify']);
   if(!await webcrypto.subtle.verify({name:'ECDSA',hash:'SHA-256'},key,Buffer.from(stamp.sig||'','base64url'),Buffer.from([stamp.g,stamp.p,stamp.k,stamp.v,stamp.txt,stamp.nonce,stamp.by].join('|'))))fail(400,'Leiman allekirjoitus ei kelpaa');
   // Re-read after asynchronous crypto verification, so concurrent stamps cannot overwrite each other.
   const current=await get(code),player=current.members.find(x=>x.id===target.id);if((player.stamps||[]).includes(stamp.nonce))return json({ok:true});
   player.stamps=(player.stamps||[]).concat(stamp.nonce);player.inbox.push({id:stamp.nonce,packet:stamp});if(stamp.k==='luotsi')player.approved=true;
   current.audit.push({at:Date.now(),by:m.name,event:stamp.k,target:player.name,mu:stamp.v});await put(current);return json({ok:true});
  }
  if(parts[3]==='share'&&req.method==='POST'){
   if(m.role!=='pelaaja')fail(403,'Vain pelaaja');const other=r.members.find(x=>x.id===b.target&&x.role==='pelaaja');if(!other||other===m)fail(400,'Valitse toinen vene');
   const packet=x=>({t:'k',p:x.id,n:x.name,li:x.snapshot?.lippu||'#3F7FCF',ki:x.snapshot?.kirj||x.name.slice(0,2),lo:(x.snapshot?.p?.loydot||[]).filter(l=>l.src!=='kumppani').slice(0,12).map(l=>[l.t,l.tapa]),ve:(x.snapshot?.p?.veneet||[]).filter(v=>v.src!=='liitto').slice(0,6).map(v=>v.nimi)});
   m.inbox.push({id:secret(),packet:packet(other)});other.inbox.push({id:secret(),packet:packet(m)});await put(r);return json({ok:true});
  }
  if(parts[3]==='ack'&&req.method==='POST'){const ids=new Set(Array.isArray(b.ids)?b.ids:[]);m.inbox=m.inbox.filter(x=>!ids.has(x.id));await put(r);return json({ok:true});}
  if(parts[3]==='answer'&&req.method==='POST'){
   const k=r.game.kriisi;if(!k||b.packet?.kid!==k.id)fail(409,'Kriisi ei ole voimassa');const target=k.laji==='fm'?r.members.find(x=>x.role==='johtaja'):r.members.find(x=>x.id===k.kohde);if(!target)fail(400,'Vastaanottaja puuttuu');const packet={...b.packet,t:'a',p:m.id,n:m.name};target.inbox.push({id:secret(),packet});await put(r);return json({ok:true});
  }
  if(parts[3]==='backup'&&req.method==='GET'){if(m.role!=='johtaja')fail(403,'Vain pelinjohtaja');return json({type:'purjehdus-online-backup',saved:new Date().toISOString(),room:{...r,members:r.members.map(({tokenHash,...x})=>x)}});}
  fail(404,'Reittiä ei löydy');
 }catch(e){if(!res.headersSent){res.writeHead(e.status||500,{'Content-Type':'application/json; charset=utf-8'});res.end(JSON.stringify({error:e.status?e.message:'Palvelinvirhe'}));}else res.end();}finally{unlock?.();}});
 return {server,db,close:()=>new Promise(resolve=>server.close(()=>{store.close();resolve();}))};
}
if(require.main===module){const app=createApp({database:process.env.DATA_FILE||undefined});app.server.listen(Number(process.env.PORT)||8080,process.env.HOST||'0.0.0.0',()=>console.log('Purjehdus-palvelin käynnissä portissa '+(process.env.PORT||8080)));}
module.exports={createApp};
