'use strict';
const ZONE = 'JHR04'; // Muar / Pagoh, Johor
const API_URL = `https://api.waktusolat.app/v2/solat/${ZONE}`;
const TIMEZONE = 'Asia/Kuala_Lumpur';
const prayers = [ ['fajr','fajr'], ['dhuhr','dhuhr'], ['asr','asr'], ['maghrib','maghrib'], ['isha','isha'] ];
const $ = (selector) => document.querySelector(selector);
const todayMY = () => new Intl.DateTimeFormat('en-CA',{timeZone:TIMEZONE,year:'numeric',month:'2-digit',day:'2-digit'}).format(new Date());
const formatDate = () => new Intl.DateTimeFormat('en-MY',{timeZone:TIMEZONE,weekday:'long',day:'numeric',month:'long',year:'numeric'}).format(new Date());
const formatTime = (value) => {
  if (typeof value === 'number') return new Intl.DateTimeFormat('en-GB',{timeZone:TIMEZONE,hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date(value * (value > 1e12 ? 1 : 1000)));
  if (typeof value === 'string') { const match = value.match(/\b(\d{1,2}):(\d{2})\b/); if(match) return `${match[1].padStart(2,'0')}:${match[2]}`; }
  return '--:--';
};
function extractToday(payload, isoDate){
  const rows = payload.prayers || payload.prayerTime || payload.prayerTimes || payload.data?.prayers || payload.data?.prayerTime || payload.data?.prayerTimes;
  if(!Array.isArray(rows)) throw new Error('Unexpected API response');
  const day = Number(isoDate.slice(-2));
  const match = rows.find(row => {
    if (typeof row.date === 'number') return row.date === day;
    if (typeof row.day === 'number') return row.day === day;
    if (typeof row.date === 'string') {
      const d = row.date;
      return d === isoDate || d.startsWith(`${isoDate.slice(0,4)}-${isoDate.slice(5,7)}-${isoDate.slice(8)}`) || d.startsWith(`${String(day).padStart(2,'0')}-`) || d.startsWith(`${String(day).padStart(2,'0')}/`);
    }
    return false;
  });
  if (!match) throw new Error('No timetable entry for today');
  return match;
}
function highlightNext(times){
  document.querySelectorAll('.prayer-card').forEach(card=>card.classList.remove('next'));
  const now = new Intl.DateTimeFormat('en-GB',{timeZone:TIMEZONE,hour:'2-digit',minute:'2-digit',hour12:false}).format(new Date());
  const nextIndex = times.findIndex(time => time !== '--:--' && time > now);
  if(nextIndex >= 0) document.querySelectorAll('.prayer-card')[nextIndex]?.classList.add('next');
}
async function loadPrayers(force=false){
  const status = $('#prayer-status'); const date = todayMY(); $('#date-label').textContent = formatDate();
  const cacheKey = `hmy-prayers-${ZONE}-${date}`;
  status.textContent = 'Fetching prayer times…';
  try {
    let row;
    if (!force) { try { row = JSON.parse(localStorage.getItem(cacheKey) || 'null'); } catch {} }
    if (!row) {
      const response = await fetch(`${API_URL}?year=${date.slice(0,4)}&month=${Number(date.slice(5,7))}`,{headers:{Accept:'application/json'},cache:'no-cache'});
      if(!response.ok) throw new Error(`API returned ${response.status}`);
      row = extractToday(await response.json(),date);
      try { localStorage.setItem(cacheKey,JSON.stringify(row)); } catch {}
    }
    const times = prayers.map(([id,key]) => {
      const aliases = {fajr:['fajr','subuh'],dhuhr:['dhuhr','zohor','zuhr'],asr:['asr','asar'],maghrib:['maghrib'],isha:['isha','isyak','isya']};
      const value = aliases[key].map(k=>row[k]).find(v=>v!=null);
      const formatted = formatTime(value);
      $(`#time-${id}`).textContent = formatted;
      return formatted;
    });
    if(times.some(time=>time==='--:--')) throw new Error('Incomplete prayer times');
    highlightNext(times);
    status.textContent = 'Source: JAKIM prayer timetable via Waktu Solat API · Malaysia Time (MYT)';
  } catch(error){
    prayers.forEach(([id]) => { $(`#time-${id}`).textContent = '--:--'; });
    status.textContent = 'Prayer times unavailable. Please try Refresh times later.';
    console.warn('Prayer times:',error);
  }
}
$('#refresh-prayers').addEventListener('click',()=>loadPrayers(true));
$('#year').textContent = new Date().getFullYear();
$('#menu-toggle').addEventListener('click',()=>{const nav=$('#primary-nav');const open=nav.classList.toggle('open');$('#menu-toggle').setAttribute('aria-expanded',String(open));});
const model=$('#mosque-model');
model.addEventListener('error',()=>{ $('#model-error').hidden=false; });
model.addEventListener('load',()=>{ $('#model-error').hidden=true; });
$('#reset-camera').addEventListener('click',()=>{ model.cameraOrbit='45deg 65deg auto';model.fieldOfView='auto';model.jumpCameraToGoal(); });
loadPrayers();
// Refresh when Malaysia's calendar day changes, even if the page stays open.
setInterval(()=>{if(todayMY() !== (window.__lastPrayerDay || (window.__lastPrayerDay=todayMY()))){window.__lastPrayerDay=todayMY();loadPrayers();}},60000);
