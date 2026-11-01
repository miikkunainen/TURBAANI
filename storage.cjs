'use strict';
const fs=require('node:fs'),path=require('node:path');
function createStore({database,supabaseUrl=process.env.SUPABASE_URL,secretKey=process.env.SUPABASE_SECRET_KEY,requireRemote=process.env.REQUIRE_REMOTE_STORAGE==='1',fetchImpl=fetch}={}){
 if(supabaseUrl||secretKey||requireRemote){
  if(!supabaseUrl||!secretKey)throw Error('SUPABASE_URL ja SUPABASE_SECRET_KEY tarvitaan. Ilmaisjulkaisu ei käytä tilapäistä paikallislevyä.');
  const url=new URL(supabaseUrl);if(url.protocol!=='https:'&&url.hostname!=='127.0.0.1')throw Error('Supabase-osoitteen pitää olla HTTPS.');
  const base=url.origin+'/rest/v1/purjehdus_rooms',cache=new Map();
  const headers={apikey:secretKey,'Content-Type':'application/json',...(secretKey.startsWith('eyJ')?{Authorization:'Bearer '+secretKey}:{})};
  async function request(suffix,options={}){const response=await fetchImpl(base+suffix,{...options,headers:{...headers,...options.headers},signal:AbortSignal.timeout(10000)});if(!response.ok)throw Object.assign(Error('Tietokantayhteys ei toimi. Tarkista Supabasen tila, taulu ja palvelinavain.'),{status:503});return response;}
  return {kind:'supabase',db:null,async get(code){if(cache.has(code))return structuredClone(cache.get(code));const response=await request('?code=eq.'+encodeURIComponent(code)+'&select=payload');const rows=await response.json();if(!rows.length)return null;cache.set(code,rows[0].payload);return structuredClone(rows[0].payload);},async put(room){await request('?on_conflict=code',{method:'POST',headers:{Prefer:'resolution=merge-duplicates,return=minimal'},body:JSON.stringify({code:room.code,payload:room,updated_at:new Date().toISOString(),expires_at:new Date(room.expiresAt||Date.now()+7*86400000).toISOString()})});cache.set(room.code,structuredClone(room));},async remove(code){await request('?code=eq.'+encodeURIComponent(code),{method:'DELETE'});cache.delete(code);},async purgeExpired(){await request('?expires_at=lte.'+encodeURIComponent(new Date().toISOString()),{method:'DELETE'});for(const [code,r]of cache)if(r.expiresAt&&r.expiresAt<=Date.now())cache.delete(code);},close(){cache.clear();}};
 }
 const {DatabaseSync}=require('node:sqlite');const file=database||path.join(__dirname,'data','purjehdus.sqlite');if(file!==':memory:')fs.mkdirSync(path.dirname(file),{recursive:true});const db=new DatabaseSync(file);db.exec('PRAGMA journal_mode=WAL; CREATE TABLE IF NOT EXISTS rooms (code TEXT PRIMARY KEY, payload TEXT NOT NULL);');
 return {kind:'sqlite',db,async get(code){const row=db.prepare('SELECT payload FROM rooms WHERE code=?').get(code);return row?JSON.parse(row.payload):null;},async put(room){db.prepare('INSERT OR REPLACE INTO rooms(code,payload) VALUES (?,?)').run(room.code,JSON.stringify(room));},async remove(code){db.prepare('DELETE FROM rooms WHERE code=?').run(code);},async purgeExpired(){db.prepare("DELETE FROM rooms WHERE json_extract(payload,'$.expiresAt') <= ?").run(Date.now());},close(){db.close();}};
}
module.exports={createStore};
