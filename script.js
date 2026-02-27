let _s0 = null;
let _s1 = {};
let _s2 = null;
let _s3  = "";
/* === PLEXUS NETWORK BACKGROUND ANIMATION === */
/* Dark mode: merah/pink kiri, biru kanan — smooth, mobile+desktop safe */
(function(){
  const cv = document.getElementById('bg-canvas');
  if(!cv) return;
  const cx = cv.getContext('2d');
  let W, H, raf = null;
  let pts = [];

  /* ── Responsive resize ── */
  function resize(){
    W = cv.width  = window.innerWidth;
    H = cv.height = window.innerHeight;
  }

  /* ── Point count by screen area ── */
  function ptCount(){ return Math.min(120, Math.max(40, Math.floor(W * H / 14000))); }

  /* ── Init points ── */
  function init(){
    pts = [];
    const n = ptCount();
    for(let i = 0; i < n; i++){
      const side = Math.random(); // 0=left(red), 1=right(blue), mid=mix
      pts.push({
        x  : Math.random() * W,
        y  : Math.random() * H,
        vx : (Math.random() - .5) * .55,
        vy : (Math.random() - .5) * .55,
        r  : Math.random() * 1.8 + .8,
        pulse: Math.random() * Math.PI * 2,
        pSpeed: .018 + Math.random() * .012
      });
    }
  }

  /* ── Color by X position: left=pink/red, right=blue ── */
  function nodeColor(x, alpha){
    const ratio = x / W; // 0..1
    if(ratio < .35){
      // hot pink / magenta
      const r = Math.round(200 + 55 * (1 - ratio/.35));
      const g = Math.round(10  + 20  * ratio/.35);
      const b = Math.round(80  + 40  * ratio/.35);
      return `rgba(${r},${g},${b},${alpha})`;
    } else if(ratio > .65){
      // cyan / electric blue
      const t = (ratio - .65) / .35;
      const r = Math.round(10  + 20  * t);
      const g = Math.round(80  + 120 * t);
      const b = Math.round(200 + 55  * t);
      return `rgba(${r},${g},${b},${alpha})`;
    } else {
      // mid: dark purple blend
      const t = (ratio - .35) / .30;
      const r = Math.round(180 - 170 * t);
      const g = Math.round(20  + 60  * t);
      const b = Math.round(120 + 80  * t);
      return `rgba(${r},${g},${b},${alpha})`;
    }
  }

  /* ── Line color gradient between two points ── */
  function lineColor(x1, x2, alpha){
    const xm = (x1 + x2) * .5;
    return nodeColor(xm, alpha);
  }

  /* ── Draw one frame ── */
  function draw(){
    /* background */
    cx.clearRect(0, 0, W, H);
    const bg = cx.createLinearGradient(0, 0, W, H);
    bg.addColorStop(0,   '#0a0008');
    bg.addColorStop(.35, '#100015');
    bg.addColorStop(.65, '#000e1a');
    bg.addColorStop(1,   '#000d18');
    cx.fillStyle = bg;
    cx.fillRect(0, 0, W, H);

    /* subtle color glow corners */
    const glowL = cx.createRadialGradient(0, H, 0, 0, H, W * .55);
    glowL.addColorStop(0,   'rgba(200,0,80,.13)');
    glowL.addColorStop(.5,  'rgba(160,0,60,.05)');
    glowL.addColorStop(1,   'transparent');
    cx.fillStyle = glowL;
    cx.fillRect(0, 0, W, H);

    const glowR = cx.createRadialGradient(W, 0, 0, W, 0, W * .55);
    glowR.addColorStop(0,   'rgba(0,120,220,.14)');
    glowR.addColorStop(.5,  'rgba(0,80,180,.05)');
    glowR.addColorStop(1,   'transparent');
    cx.fillStyle = glowR;
    cx.fillRect(0, 0, W, H);

    /* ── Move ── */
    for(const p of pts){
      p.x += p.vx;
      p.y += p.vy;
      p.pulse += p.pSpeed;
      /* bounce */
      if(p.x < 0){ p.x = 0; p.vx = Math.abs(p.vx); }
      if(p.x > W){ p.x = W; p.vx = -Math.abs(p.vx); }
      if(p.y < 0){ p.y = 0; p.vy = Math.abs(p.vy); }
      if(p.y > H){ p.y = H; p.vy = -Math.abs(p.vy); }
    }

    /* ── Connect lines ── */
    const DIST = Math.min(W, H) * .28;
    for(let i = 0; i < pts.length; i++){
      for(let j = i + 1; j < pts.length; j++){
        const dx = pts[i].x - pts[j].x;
        const dy = pts[i].y - pts[j].y;
        const d  = Math.sqrt(dx*dx + dy*dy);
        if(d < DIST){
          const alpha = (1 - d / DIST) * .55;
          /* dashed line for some pairs (like reference image) */
          const dashed = (i + j) % 5 === 0;
          cx.save();
          if(dashed) cx.setLineDash([4, 6]);
          else        cx.setLineDash([]);
          cx.beginPath();
          cx.moveTo(pts[i].x, pts[i].y);
          cx.lineTo(pts[j].x, pts[j].y);
          cx.strokeStyle = lineColor(pts[i].x, pts[j].x, alpha);
          cx.lineWidth   = dashed ? .6 : (1 - d/DIST) * 1.2 + .3;
          cx.stroke();
          cx.restore();
        }
      }
    }

    /* ── Draw nodes ── */
    for(const p of pts){
      const pulse = .5 + .5 * Math.sin(p.pulse);
      const r     = p.r * (1 + pulse * .5);
      const bright = Math.random() > .997; // occasional sparkle

      /* outer glow */
      const glow = cx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r * 6);
      glow.addColorStop(0, nodeColor(p.x, .45 * pulse));
      glow.addColorStop(1, 'transparent');
      cx.fillStyle = glow;
      cx.beginPath(); cx.arc(p.x, p.y, r * 6, 0, Math.PI*2); cx.fill();

      /* core dot */
      cx.beginPath(); cx.arc(p.x, p.y, r, 0, Math.PI*2);
      cx.fillStyle = bright ? 'white' : nodeColor(p.x, .9 + pulse * .1);
      cx.fill();

      /* white center for brighter nodes */
      if(p.r > 2 || bright){
        cx.beginPath(); cx.arc(p.x, p.y, r * .4, 0, Math.PI*2);
        cx.fillStyle = 'rgba(255,255,255,.85)';
        cx.fill();
      }
    }

    raf = requestAnimationFrame(draw);
  }

  /* ── Handle visibility (tab switch) — no ghost frames ── */
  document.addEventListener('visibilitychange', () => {
    if(document.hidden){
      if(raf) cancelAnimationFrame(raf);
    } else {
      raf = requestAnimationFrame(draw);
    }
  });

  /* ── Resize: debounced ── */
  let rzTimer = null;
  window.addEventListener('resize', () => {
    clearTimeout(rzTimer);
    rzTimer = setTimeout(() => { resize(); init(); }, 120);
  });

  /* ── Start ── */
  resize(); init(); draw();
})();
const _FBURL = CONFIG.FIREBASE_URL;
async function _gdb(){
try{const r=await fetch(_FBURL+"/.json");if(!r.ok)throw 0;const d=await r.json();return d||{};}
catch(e){console.error("_gdb",e);return null;}
}
async function _sdb(data){
try{const r=await fetch(_FBURL+"/.json",{method:"PUT",headers:{"Content-Type":"application/json"},body:JSON.stringify(data)});return r.ok;}
catch(e){console.error("_sdb",e);return false;}
}
function _toArr(v){if(!v)return[];if(Array.isArray(v))return v;return Object.values(v);}
async function _gu(){const db=await _gdb();return db?_toArr(db.users):null;}
async function _su(users){const db=await _gdb();return _sdb(db?{...db,users}:{users});}

/* ═══════════════════════════════════════════════════════
   HEARTBEAT — Online / Offline Tracking
   ═══════════════════════════════════════════════════════ */
let _hbTimer = null;
const _HB_INTERVAL = 30000; // ping tiap 30 detik
const _OFFLINE_THRESHOLD = 120000; // offline jika > 2 menit tidak ping

async function _pingHeartbeat() {
  if (!_s0) return;
  const db = await _gdb();
  if (!db) return;
  const users = db.users || [];
  const idx = users.findIndex(u => u.username === _s0.username);
  if (idx === -1) return;
  users[idx].lastSeen = new Date().toISOString();
  await _sdb({ ...db, users });
}

function _startHeartbeat() {
  _stopHeartbeat();
  _pingHeartbeat(); // langsung ping saat login
  _hbTimer = setInterval(_pingHeartbeat, _HB_INTERVAL);
}

function _stopHeartbeat() {
  clearInterval(_hbTimer);
  _hbTimer = null;
}

function _isOnline(lastSeen) {
  if (!lastSeen) return false;
  return (Date.now() - new Date(lastSeen).getTime()) < _OFFLINE_THRESHOLD;
}

function _timeSince(lastSeen) {
  if (!lastSeen) return 'Belum pernah online';
  const diff = Math.floor((Date.now() - new Date(lastSeen).getTime()) / 1000);
  if (diff < 60) return diff + ' detik lalu';
  if (diff < 3600) return Math.floor(diff / 60) + ' menit lalu';
  if (diff < 86400) return Math.floor(diff / 3600) + ' jam lalu';
  return Math.floor(diff / 86400) + ' hari lalu';
}

function _cpw(a,b){return a.trim()===b.trim();}
function switchTab(tab){
["masuk","daftar"].forEach(t=>{
document.getElementById("form-"+t).classList.toggle("show",t===tab);
document.getElementById("tab-"+t).classList.toggle("active",t===tab);
});
document.getElementById("ts-pill").classList.toggle("moved",tab==="daftar");
}
let _s4 = {};
function _brg(){
const grids={
"rg-invite":"invite-region","rg-join":"join-region","rg-leave":"leave-region",
"rg-emote":"emote-region","rg-ban":"ban-region","rg-info":"info-region",
"rg-visit":"visit-region","rg-outfit":"outfit-region","rg-stats":"stats-region"
};
Object.entries(grids).forEach(([gridId,hiddenId])=>{
const el=document.getElementById(gridId);
if(!el)return;
el.innerHTML="";
REGIONS.forEach((r,i)=>{
const isMaint=_s4[r.code]==="maintenance";
const btn=document.createElement("button");
btn.className="rg-btn"+(i===0?" active":"")+(isMaint?" rg-maint":"");
btn.innerHTML=`<span class="fi fi-${r.flag} rg-flag"></span>${r.label}${isMaint?` <i class="fa-solid fa-wrench rg-maint-ico"></i>`:""}`;
btn.dataset.code=r.code;
btn.title=r.name+(isMaint?" — Maintenance":"");
btn.onclick=()=>{
if(isMaint){toast("Region maintenance","warn",`Server ${r.name} sedang dalam perbaikan.`);return;}
el.querySelectorAll(".rg-btn").forEach(b=>b.classList.remove("active"));
btn.classList.add("active");
document.getElementById(hiddenId).value=r.code;
};
el.appendChild(btn);
});
document.getElementById(hiddenId).value=REGIONS[0].code;
});
}
function _rrm(){
const el=document.getElementById("region-manager");
if(!el)return;
el.innerHTML="";
const sorted=[...REGIONS].sort((a,b)=>a.code==="id"?-1:b.code==="id"?1:0);
sorted.forEach(r=>{
const isMaint=_s4[r.code]==="maintenance";
const row=document.createElement("div");
row.className="srv-row";
row.innerHTML=`
<div class="srv-info">
<span class="fi fi-${r.flag} srv-flag"></span>
<div>
<span class="srv-label">${r.name}</span>
<span class="srv-region-code">${r.label}${r.code==="id"?' <span class="srv-id-badge">Default</span>':""}</span>
</div>
</div>
<div class="srv-toggle-wrap">
<span class="srv-status ${isMaint?"maint":"active"}">${isMaint?"Maintenance":"Aktif"}</span>
<label class="ios-toggle">
<input type="checkbox" ${isMaint?"":"checked"} onchange="toggleRegion('${r.code}',this)">
<span class="ios-track"></span>
</label>
</div>`;
el.appendChild(row);
});
}
function toggleRegion(code,cb){
_s4[code]=cb.checked?"active":"maintenance";
const row=cb.closest(".srv-row");
const span=row.querySelector(".srv-status");
span.textContent=cb.checked?"Aktif":"Maintenance";
span.className="srv-status "+(cb.checked?"active":"maint");
_as();
}
function saveRegionStatus(){_as();}
let _s5=null;
function _ssi(state){
let el=document.getElementById("rt-save-ind");
if(!el){el=document.createElement("div");el.id="rt-save-ind";document.body.appendChild(el);}
el.className="rt-save-ind "+state;
el.innerHTML=state==="saving"
?'<i class="fa-solid fa-circle-notch fa-spin"></i> Menyimpan...'
:state==="ok"
?'<i class="fa-solid fa-circle-check"></i> Tersimpan'
:'<i class="fa-solid fa-circle-xmark"></i> Gagal';
if(state!="saving")setTimeout(()=>el.classList.add("hide"),2200);
}
function _as(){
clearTimeout(_s5);
_ssi("saving");
_s5=setTimeout(async()=>{
const db=await _gdb();
const merged=db?{...db,serverStatus:_s1,regionStatus:_s4}:{serverStatus:_s1,regionStatus:_s4};
const ok=await _sdb(merged);
_ssi(ok?"ok":"err");
if(ok){
_s3=JSON.stringify({s:_s1,r:_s4});
_rsb();
_brg();
_rgs();
}
},600);
}
function pickMode(btn,val,hiddenId){
btn.closest(".size-row")?.querySelectorAll(".sz-pill").forEach(b=>b.classList.remove("active"));
btn.classList.add("active");
const h=document.getElementById(hiddenId);if(h)h.value=val;
}
let _lssRunning=false;
async function _lss(silent=false){
if(_lssRunning)return; _lssRunning=true;
try{
const db=await _gdb(); if(!db)return;
// Auto-logout jika user dibanned
if(_s0&&db.users){
const me=db.users.find(u=>u.username===_s0.username);
if(me&&me.banned===true){
toast("Akun Anda telah dibanned","err","Anda akan otomatis keluar...");
setTimeout(()=>doLogout(),1800);
return;
}
}
const hash=JSON.stringify({s:db.serverStatus||{},r:db.regionStatus||{}});
const changed=(hash!==_s3); _s3=hash;
_s1=db.serverStatus||{};
_s4=db.regionStatus||{};
FEATURES.forEach(f=>{if(!_s1[f.id])_s1[f.id]="active";});
REGIONS.forEach(r=>{if(!_s4[r.code])_s4[r.code]="active";});
if(typeof _s1.global==="undefined")_s1.global="active";
if(MAINTENANCE.global)_s1.global="maintenance";
FEATURES.forEach(f=>{if(MAINTENANCE[f.id])_s1[f.id]="maintenance";});
if(changed||!silent){
_rgs();
_rsb();
_brg();
_rsm();
_rrm();
}
}finally{_lssRunning=false;}
}
function _sp(){
if(_s2)return;
_s2=setInterval(()=>_lss(true),5000);
}
function _xp(){clearInterval(_s2);_s2=null;}
function _rgs(){
const isMaint=_s1.global==="maintenance";
const toggle=document.getElementById("srv-global-toggle");
const statusEl=document.getElementById("srv-global-status");
const subEl=document.getElementById("srv-global-sub");
if(toggle){toggle.checked=!isMaint;}
if(statusEl){statusEl.textContent=isMaint?"Maintenance":"Aktif";statusEl.className="srv-status "+(isMaint?"maint":"active");}
if(subEl){subEl.textContent=isMaint?"Semua fitur diblokir saat ini":"Semua fitur dapat digunakan";}
const banner=document.getElementById("global-maint-banner");
if(banner){banner.classList.toggle("d-none",!isMaint);}
}
function toggleGlobalServer(cb){
_s1.global=cb.checked?"active":"maintenance";
const statusEl=document.getElementById("srv-global-status");
const subEl=document.getElementById("srv-global-sub");
const isMaint=!cb.checked;
if(statusEl){statusEl.textContent=isMaint?"Maintenance":"Aktif";statusEl.className="srv-status "+(isMaint?"maint":"active");}
if(subEl){subEl.textContent=isMaint?"Semua fitur diblokir saat ini":"Semua fitur dapat digunakan";}
_as();
}
function _rsb(){
FEATURES.forEach(f=>{
const badge=document.getElementById("badge-"+f.id);
if(badge){
const isMaint=_s1[f.id]==="maintenance"||_s1.global==="maintenance";
badge.textContent=isMaint?"!":"";
badge.className="mgc-badge"+(isMaint?" maint":"");
badge.style.display=isMaint?"flex":"none";
}
// Greying out the card
const card=document.querySelector(`.mgc[onclick="openFeature('${f.id}')"]`);
if(card){
const isMaint=_s1[f.id]==="maintenance"||_s1.global==="maintenance";
card.classList.toggle("mgc-maint-state",isMaint);
}
});
}
function _rsm(){
const el=document.getElementById("server-manager");
if(!el)return;
el.innerHTML="";
FEATURES.forEach(f=>{
const isMaint=_s1[f.id]==="maintenance";
const row=document.createElement("div");
row.className="srv-row";
row.innerHTML=`
<div class="srv-info">
<i class="fa-solid ${f.icon} srv-icon"></i>
<span class="srv-label">${f.label}</span>
</div>
<div class="srv-toggle-wrap">
<span class="srv-status ${isMaint?"maint":"active"}">${isMaint?"Maintenance":"Aktif"}</span>
<label class="ios-toggle">
<input type="checkbox" ${isMaint?"":"checked"} onchange="toggleFeature('${f.id}',this)">
<span class="ios-track"></span>
</label>
</div>`;
el.appendChild(row);
});
}
function toggleFeature(id,cb){
_s1[id]=cb.checked?"active":"maintenance";
const row=cb.closest(".srv-row");
const span=row.querySelector(".srv-status");
span.textContent=cb.checked?"Aktif":"Maintenance";
span.className="srv-status "+(cb.checked?"active":"maint");
_as();
}
function saveServerStatus(){_as();}
let _lastToastKey="";let _lastToastTs=0;
function _toastOnce(msg,type,sub){
const key=msg+type;const now=Date.now();
if(key===_lastToastKey&&now-_lastToastTs<2000)return;
_lastToastKey=key;_lastToastTs=now;
toast(msg,type,sub);
}
function openFeature(id){
if(COMING_SOON[id]){_toastOnce("Segera Hadir","info","Fitur ini belum tersedia. Nantikan pembaruan berikutnya!");return;}
if(MAINTENANCE.global||MAINTENANCE[id]){_toastOnce("Fitur sedang maintenance","warn","Fitur ini sedang dalam perbaikan. Coba lagi nanti.");return;}
if(_s1.global==="maintenance"){_toastOnce("Server sedang maintenance","warn","Server utama sedang dalam perbaikan. Semua fitur dinonaktifkan sementara.");return;}
if(_s1[id]==="maintenance"){_toastOnce("Fitur sedang maintenance","warn","Fitur ini sedang dalam perbaikan. Coba lagi nanti.");return;}
showSec(id);
}
function initLiveValidation(){
// Komentar char counter
const rules=[
{el:"reg-username",msg:"msg-username",fn:v=>{if(!v)return null;if(v.length<5)return{err:`${v.length}/5 karakter`};if(!/^[a-zA-Z0-9_]+$/.test(v))return{err:"Hanya huruf, angka, _"};return{ok:"Tersedia"};}},
{el:"reg-email",msg:"msg-email",fn:v=>{if(!v)return null;if(!v.toLowerCase().endsWith("@gmail.com"))return{err:"Harus @gmail.com"};return{ok:"Valid"};}},
{el:"reg-password",msg:"msg-password",fn:v=>{if(!v)return null;if(v.length<8)return{err:`${v.length}/8`};return{ok:"Kuat"};}},
{el:"reg-confirm",msg:"msg-confirm",fn:v=>{if(!v)return null;if(v!==document.getElementById("reg-password").value)return{err:"Tidak cocok"};return{ok:"Cocok"};}}
];
rules.forEach(({el,msg,fn})=>{
const inp=document.getElementById(el),out=document.getElementById(msg);
if(!inp||!out)return;
inp.addEventListener("input",()=>{const r=fn(inp.value.trim());if(!r){out.textContent="";out.className="fg-msg";return;}out.textContent=r.ok||r.err;out.className="fg-msg "+(r.ok?"ok":"err");});
});
}
function checkSession(){
const s=localStorage.getItem("ff_session");
if(!s)return;
_s0=JSON.parse(s);
enterApp(_s0.username,_s0.role,_s0.email);
}
function enterApp(username,role,email=""){
_s0={username,role,email};
document.getElementById("auth-screen").style.display="none";
document.getElementById("main-app").classList.remove("d-none");
document.getElementById("sb-uname").textContent=username;
const badge=document.getElementById("sb-role-badge");
badge.textContent=role==="admin"?"Admin":"User";
badge.className="sb-role-badge "+(role==="admin"?"admin":"user");
if(role==="admin")document.getElementById("admin-banner").classList.remove("d-none");
document.getElementById("pf-avatar").textContent=username.slice(0,2).toUpperCase();
document.getElementById("pf-name").textContent=username;
document.getElementById("pf-email").textContent=email||"-";
document.getElementById("pf-role-chip").innerHTML=role==="admin"?'<i class="fa-solid fa-crown ani-pulse ico-gold"></i> Admin':'<i class="fa-solid fa-user ani-float ico-blue"></i> User';
document.getElementById("pf-role-chip").className="pf-role-chip "+(role==="admin"?"admin":"user");
document.getElementById("pf-sub").textContent="@"+username;
loadEmotes();loadState();_brg();_lss();_sp();loadBroadcast();_initMsgBadge();_initWelcome(username,role);initVisitorCounter();loadMarquee();renderFavGrid();_startHeartbeat();loadComments();setTimeout(_checkRefParam,1000);
setTimeout(()=>document.querySelectorAll(".mc").forEach((c,i)=>{c.style.cssText="opacity:0;transform:translateY(18px)";setTimeout(()=>{c.style.transition="all .4s cubic-bezier(.25,.46,.45,.94)";c.style.opacity="1";c.style.transform="translateY(0)";},i*70);}),60);
}
function doRefresh(){
  const btn=document.getElementById("sb-refresh-btn");
  if(btn){btn.classList.add("sb-refresh-spin");setTimeout(()=>btn.classList.remove("sb-refresh-spin"),700);}
  loadEmotes();loadState();_brg();_lss(false);loadBroadcast();renderFavGrid();
  toast("Refresh selesai","ok","Data berhasil diperbarui");
}
function _initAdminAcc(){
  // Set initial state: first accordion open, rest closed
  document.querySelectorAll('#admin-panel .acc-item').forEach((item,i)=>{
    const header=item.querySelector('.acc-header');
    const body=item.querySelector('.acc-body');
    if(!header||!body)return;
    if(i===0){
      // first one open
      header.classList.add('open');
      body.style.display='block';
      body.classList.add('acc-open');
      body.style.maxHeight='none';
    } else {
      header.classList.remove('open');
      body.style.display='none';
      body.classList.remove('acc-open');
      body.style.maxHeight='0';
    }
  });
}
function toggleAcc(id){
  const item=document.getElementById(id);
  if(!item)return;
  const header=item.querySelector('.acc-header');
  const body=item.querySelector('.acc-body');
  const isOpen=header.classList.contains('open');
  if(isOpen){
    body.style.maxHeight=body.scrollHeight+'px';
    requestAnimationFrame(()=>{
      body.style.maxHeight='0';
      body.classList.remove('acc-open');
    });
    header.classList.remove('open');
    setTimeout(()=>{body.style.display='none';},350);
  } else {
    body.style.display='block';
    body.classList.add('acc-open');
    body.style.maxHeight='0';
    requestAnimationFrame(()=>{
      requestAnimationFrame(()=>{body.style.maxHeight=body.scrollHeight+'px';});
    });
    header.classList.add('open');
    setTimeout(()=>{body.style.maxHeight='none';},360);
  }
}
function doLogout(){
localStorage.removeItem("ff_session");_s0=null;
clearInterval(_vcTimer);_stopHeartbeat();
_xp();
document.getElementById("main-app").classList.add("d-none");
document.getElementById("auth-screen").style.display="flex";
document.getElementById("admin-banner").classList.add("d-none");
document.getElementById("login-username").value="";
document.getElementById("login-password").value="";
_xp();
}
async function doRegister(){
const username=document.getElementById("reg-username").value.trim().toLowerCase();
const email=document.getElementById("reg-email").value.trim().toLowerCase();
const password=document.getElementById("reg-password").value;
const confirm=document.getElementById("reg-confirm").value;
if(username.length<5){toast("Username minimal 5 karakter","err");return;}
if(!/^[a-zA-Z0-9_]+$/.test(username)){toast("Username hanya huruf, angka, _","err");return;}
if(!email.endsWith("@gmail.com")){toast("Email harus @gmail.com","err");return;}
if(password.length<8){toast("Password minimal 8 karakter","err");return;}
if(password!==confirm){toast("Password tidak cocok","err");return;}
const btn=document.getElementById("btn-register");setBtnState(btn,true,"Mendaftar...");
const users=await _gu();
if(!users){toast("Gagal terhubung ke server","err");setBtnState(btn,false,"Buat Akun");return;}
if(users.find(u=>u.username===username)){toast("Username sudah digunakan","err");shakeCard();setBtnState(btn,false,"Buat Akun");return;}
if(users.find(u=>u.email===email)){toast("Email sudah terdaftar","err");shakeCard();setBtnState(btn,false,"Buat Akun");return;}
users.push({username,email,password,role:"user",createdAt:new Date().toISOString()});
const ok=await _su(users);
setBtnState(btn,false,"Buat Akun");
if(ok){
toast("Akun berhasil dibuat! Silakan masuk.","ok");
setTimeout(()=>{
  switchTab("masuk");
  document.getElementById("login-username").value=username;
  document.getElementById("login-password").value=password;
},600);
}
else toast("Gagal menyimpan","err");
}
async function doLogin(){
const username=document.getElementById("login-username").value.trim().toLowerCase();
const password=document.getElementById("login-password").value;
if(!username){toast("Username wajib diisi","err");return;}
if(!password){toast("Password wajib diisi","err");return;}
const btn=document.getElementById("btn-login");setBtnState(btn,true,"Masuk...");
const db=await _gdb();
if(!db){toast("Gagal terhubung ke server","err");setBtnState(btn,false,"Masuk");return;}
const users=db.users||[];
const user=users.find(u=>u.username===username);
if(!user){toast("Username tidak ditemukan","err");shakeCard();setBtnState(btn,false,"Masuk");return;}
if(!_cpw(password,user.password)){toast("Password salah","err");shakeCard();setBtnState(btn,false,"Masuk");return;}
if(user.banned===true){toast("Akun Diblokir","err","Akun Anda telah dibanned. Hubungi admin.");shakeCard();setBtnState(btn,false,"Masuk");return;}
localStorage.setItem("ff_session",JSON.stringify({username:user.username,role:user.role||"user",email:user.email||""}));
toast(user.role==="admin"?"Selamat datang, Admin!":` Selamat datang, ${user.username}!`,"ok");
setBtnState(btn,false,"Masuk");
setTimeout(()=>enterApp(user.username,user.role||"user",user.email||""),800);
}
async function doChangePassword(){
if(!_s0){toast("Sesi tidak valid","err");return;}
const oldPw=document.getElementById("pw-old").value;
const newPw=document.getElementById("pw-new").value;
const confirmPw=document.getElementById("pw-confirm").value;
if(!oldPw){toast("Masukkan password lama","err");return;}
if(newPw.length<6){toast("Password baru minimal 6 karakter","err");return;}
if(newPw!==confirmPw){toast("Konfirmasi password tidak cocok","err");return;}
const users=await _gu();
if(!users){toast("Gagal terhubung ke server","err");return;}
const idx=users.findIndex(u=>u.username===_s0.username);
if(idx===-1){toast("Akun tidak ditemukan","err");return;}
if(!_cpw(oldPw,users[idx].password)){toast("Password lama salah","err");return;}
users[idx].password=newPw;
const ok=await _su(users);
if(ok){
toast("Password berhasil diubah!","ok");
document.getElementById("pw-old").value="";
document.getElementById("pw-new").value="";
document.getElementById("pw-confirm").value="";
localStorage.setItem("ff_session",JSON.stringify({..._s0}));
} else toast("Gagal menyimpan","err");
}
async function _lad(){
const list=document.getElementById("admin-list");
list.innerHTML=`<div class="admin-load"><i class="fa-solid fa-spinner fa-spin"></i> Memuat...</div>`;
const users=await _gu();
if(!users){list.innerHTML=`<div class="admin-load">Gagal memuat</div>`;return;}
document.getElementById("ast-total").textContent=users.length;
document.getElementById("ast-admin").textContent=users.filter(u=>u.role==="admin").length;
document.getElementById("ast-user").textContent=users.filter(u=>u.role!=="admin").length;
const onlineCount=users.filter(u=>_isOnline(u.lastSeen)).length;
const astOnline=document.getElementById("ast-online");
if(astOnline)astOnline.textContent=onlineCount;
list.innerHTML="";
users.forEach(u=>{
const isA=u.role==="admin";
const isBanned=u.banned===true;
const online=_isOnline(u.lastSeen);
const lastSeenTxt=_timeSince(u.lastSeen);
const card=document.createElement("div");card.className="acard"+(isBanned?" acard-banned":"");
card.innerHTML=`<div class="acard-av ${isA?"av-admin":"av-user"}">${u.username.slice(0,2).toUpperCase()}
<span class="acard-online-dot ${online?'dot-online':'dot-offline'}"></span>
</div>
<div class="acard-info">
<div class="acard-name">${u.username}${isBanned?' <span class="ban-chip"><i class="fa-solid fa-ban"></i> Banned</span>':""}</div>
<div class="acard-email">${u.email||"-"}</div>
<div class="acard-lastseen"><span class="online-status-badge ${online?'badge-online':'badge-offline'}">${online?'<i class="fa-solid fa-circle"></i> Online':'<i class="fa-regular fa-circle"></i> Offline'}</span><span class="lastseen-txt">${lastSeenTxt}</span></div>
</div>
<div class="acard-actions">
<div class="acard-role ${isA?"admin":"user"}">${isA?"Admin":"User"}</div>
<button class="ban-btn ${isBanned?"unban-btn":"do-ban-btn"}" onclick="_tbu('${u.username}',${isBanned},this)">
<i class="fa-solid ${isBanned?"fa-unlock":"fa-ban"}"></i>
${isBanned?"Unban":"Ban"}
</button>
</div>`;
list.appendChild(card);
});
}
function _cm(htmlMsg, icon="ban"){
return new Promise(resolve=>{
let m=document.getElementById("confirm-modal");
if(!m){
m=document.createElement("div");m.id="confirm-modal";
m.innerHTML=`<div class="cm-overlay"><div class="cm-box">
<div class="cm-icon-wrap"><i id="cm-icon" class="fa-solid"></i></div>
<div id="cm-msg" class="cm-msg"></div>
<div class="cm-btns">
<button class="cm-cancel" id="cm-cancel">Batal</button>
<button class="cm-ok" id="cm-ok">Ya, Lanjutkan</button>
</div>
</div></div>`;
document.body.appendChild(m);
}
document.getElementById("cm-icon").className=`fa-solid fa-${icon}`;
document.getElementById("cm-msg").innerHTML=htmlMsg;
m.classList.add("show");
const cleanup=(res)=>{m.classList.remove("show");resolve(res);};
document.getElementById("cm-ok").onclick=()=>cleanup(true);
document.getElementById("cm-cancel").onclick=()=>cleanup(false);
});
}
async function _tbu(username, currentlyBanned, btn){
if(!_s0||_s0.role!=="admin"){toast("Akses ditolak","err");return;}
if(username===_s0.username){toast("Tidak bisa ban akun sendiri","err");return;}
const action=currentlyBanned?"Unban":"Ban";
if(!await _cm(`${action} akun <b>${username}</b>?`, action==="Ban"?"ban":"unlock"))return;
btn.disabled=true;btn.style.opacity=".5";
const users=await _gu();
if(!users){toast("Gagal terhubung","err");btn.disabled=false;btn.style.opacity="";return;}
const idx=users.findIndex(u=>u.username===username);
if(idx===-1){toast("User tidak ditemukan","err");btn.disabled=false;btn.style.opacity="";return;}
users[idx].banned=!currentlyBanned;
const ok=await _su(users);
if(ok){
_sbt(action, username);
_lad();
} else {
toast("Gagal menyimpan","err");
btn.disabled=false;btn.style.opacity="";
}
}
function _sbt(action, username){
const isBan=action==="Ban";
toast(
isBan?`${username} telah dibanned`:`${username} telah diunban`,
isBan?"err":"ok",
isBan?"Akun ini tidak bisa login lagi":"Akun ini bisa login kembali"
);
}
let _pc={tc:"",region:"id",uids:[]};
function showSec(id){
localStorage.setItem("ff_sec",id);
document.getElementById("main-menu").style.display="none";
document.querySelectorAll(".sec").forEach(s=>s.classList.add("d-none"));
const sec=document.getElementById(id);
if(sec){sec.classList.remove("d-none");sec.style.animation="none";sec.offsetHeight;sec.style.animation="";}
if(id==="admin-panel"){_lad();_rsm();_rrm();_initAdminAcc();}
if(id==="referral-sec"){loadReferralPage();}
if(id==="online-users"){loadOnlineUsers();}
if(id==="profile-menu"&&_s0){
_gu().then(users=>{
if(!users)return;
const u=users.find(x=>x.username===_s0.username);
if(u){document.getElementById("pf-email").textContent=u.email||"-";}
});
}

}
function showHome(){
localStorage.removeItem("ff_sec");
document.querySelectorAll(".sec").forEach(s=>s.classList.add("d-none"));
document.getElementById("main-menu").style.display="flex";
}
function loadEmotes(){
if(typeof EMOTE_DATA==="undefined")return;
const sel=document.getElementById("emote-category");if(!sel)return;
sel.innerHTML='<option value="all">Semua</option>';
for(const c in EMOTE_DATA){const o=document.createElement("option");o.value=c;o.textContent=c;sel.appendChild(o);}
renderEmotes(EMOTE_DATA);
}
function renderEmotes(data,txt="",cat="all"){
const grid=document.getElementById("emulator-grid");if(!grid)return;
grid.innerHTML="";
let list=cat==="all"?Object.values(data).flat():data[cat]||[];
if(txt){const q=txt.toLowerCase();list=list.filter(e=>e.name.toLowerCase().includes(q)||String(e.id).includes(q));}
list.forEach((emote,i)=>{
const item=document.createElement("div");item.className="emote-item";item.style.cssText="opacity:0;transform:scale(.82)";item.onclick=()=>doEmote(emote.id,emote.name);
const img=document.createElement("img");img.src=`${CONFIG.CDN_BASE}${emote.id}.png`;img.alt=emote.name;img.loading="lazy";
img.onerror=function(){this.src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='54' height='54'%3E%3Crect fill='%23111' width='54' height='54' rx='8'/%3E%3Ctext y='33' x='27' text-anchor='middle' fill='%23333' font-size='18'%3E%3F%3C/text%3E%3C/svg%3E";};
const span=document.createElement("span");span.textContent=emote.name;
item.append(img,span);grid.appendChild(item);
setTimeout(()=>{item.style.transition="all .2s";item.style.cssText="opacity:1;transform:scale(1)";},Math.min(i*14,450));
});
}
function filterEmotes(){
if(typeof EMOTE_DATA==="undefined")return;
renderEmotes(EMOTE_DATA,document.getElementById("emote-search")?.value||"",document.getElementById("emote-category")?.value||"all");
}
function addUid(val=""){
const box=document.getElementById("uid-container");if(!box)return;
if(box.querySelectorAll(".uid-row").length>=5){toast("Maksimal 5 UID","err");return;}
const n=box.querySelectorAll(".uid-row").length+1;
const row=document.createElement("div");row.className="uid-row";
row.innerHTML=`<input type="number" class="emote-uid f-inp" placeholder="UID ${n}" value="${val}"><button class="uid-rem-btn" onclick="this.parentElement.remove()"><i class="fa-solid fa-minus"></i></button>`;
box.appendChild(row);
}
function saveConfig(){
const tc=document.getElementById("emote-tc")?.value;
const region=document.getElementById("emote-region")?.value||"id";
const uids=[...document.querySelectorAll(".emote-uid")].map(i=>i.value).filter(Boolean);
if(!tc){toast("Kode Tim wajib diisi","err");return;}
if(!uids.length){toast("Minimal 1 UID","err");return;}
_pc={tc,region,uids};
localStorage.setItem("ff_cfg",JSON.stringify(_pc));
toast("Konfigurasi tersimpan","ok");
}
function loadState(){
const saved=localStorage.getItem("ff_cfg");
if(saved){
_pc=JSON.parse(saved);
const tcEl=document.getElementById("emote-tc");if(tcEl)tcEl.value=_pc.tc;
const box=document.getElementById("uid-container");
if(box&&_pc.uids.length){
box.innerHTML=`<div class="uid-row"><input type="number" class="emote-uid f-inp" placeholder="UID 1" value="${_pc.uids[0]||""}"><button class="uid-add-btn" onclick="addUid()"><i class="fa-solid fa-plus"></i></button></div>`;
for(let i=1;i<_pc.uids.length;i++)addUid(_pc.uids[i]);
}
}
const fp=document.querySelector(".sz-pill");if(fp)pickSize(fp,2,"invite-size");
const ss=localStorage.getItem("ff_sec");if(ss)showSec(ss);
}
function pickSize(btn,val,hiddenId){
btn.closest(".size-row")?.querySelectorAll(".sz-pill").forEach(b=>b.classList.remove("active"));
btn.classList.add("active");
const h=document.getElementById(hiddenId||"invite-size");if(h)h.value=val;
}
function pickModePill(btn,val,hiddenId,rowId){
document.getElementById(rowId)?.querySelectorAll(".mode-pill").forEach(b=>b.classList.remove("active"));
btn.classList.add("active");
const h=document.getElementById(hiddenId);if(h)h.value=val;
}
function cooldown(ms=3000){
const btns=document.querySelectorAll(".act-btn,.emote-item,.manual-go");
btns.forEach(b=>{b.disabled=true;b.style.opacity=".5";b.style.pointerEvents="none";});
setTimeout(()=>btns.forEach(b=>{b.disabled=false;b.style.opacity="";b.style.pointerEvents="";}),ms);
}
function shakeCard(){
const c=document.getElementById("auth-card");if(!c)return;
c.classList.remove("shake");void c.offsetWidth;c.classList.add("shake");setTimeout(()=>c.classList.remove("shake"),600);
}
function setBtnState(btn,loading,label){
btn.disabled=loading;btn.querySelector("span").textContent=label;
loading?btn.classList.add("loading"):btn.classList.remove("loading");
}
function toggleEye(id,btn){
const inp=document.getElementById(id),icon=btn.querySelector("i"),show=inp.type==="password";
inp.type=show?"text":"password";icon.className=show?"fa-solid fa-eye":"fa-solid fa-eye-slash";
}
function _sl(el,msg="Mengambil data..."){
el.classList.remove("d-none");
el.innerHTML=`<div class="rc-loading"><span class="rc-loading-dot"></span><span class="rc-loading-dot"></span><span class="rc-loading-dot"></span><span style="margin-left:10px;color:var(--t3);font-size:.85rem">${msg}</span></div>`;
}
async function doEmote(id,name){
if(!_pc.tc){toast("Isi Kode Tim dulu","err");document.querySelector(".cfg-box")?.scrollIntoView({behavior:"smooth"});return;}
cooldown();toast("Memulai: "+name,"ok");
const r=_pc.region||"id";
let url=`${CONFIG.EMOTE_API}/join/${r}?tc=${_pc.tc}&key=${CONFIG.EMOTE_KEY}&emote_id=${id}`;
_pc.uids.forEach((uid,i)=>url+=`&uid${i+1}=${uid}`);
try{await fetch(url,{mode:"no-cors"});toast("Berhasil: "+name,"ok");}
catch{toast("Gagal terhubung ke API","err");}
}
function manualEmote(){const id=document.getElementById("manual-emote-id")?.value;if(!id){toast("Masukkan ID Emote","err");return;}doEmote(id,"ID: "+id);}
async function apiBotInvite(){
const size=document.getElementById("invite-size")?.value;
const uid=document.getElementById("invite-uid")?.value;
const leave=document.getElementById("invite-leave")?.checked?"1":"0";
const region=document.getElementById("invite-region")?.value||"id";
if(!uid){toast("UID wajib diisi","err");return;}
if(!size){toast("Pilih ukuran tim","err");return;}
cooldown();
try{await fetch(`${CONFIG.EMOTE_API}/create_team/${region}?size=${size}&invite_uid=${uid}&leave=${leave}&key=${CONFIG.EMOTE_KEY}`,{mode:"no-cors"});toast("Undangan terkirim!","ok");}
catch{toast("Gagal mengirim undangan","err");}
}
async function apiJoinTeam(){
const tc=document.getElementById("join-tc")?.value;
const region=document.getElementById("join-region")?.value||"id";
if(!tc){toast("Kode Tim wajib diisi","err");return;}
cooldown();
try{await fetch(`${CONFIG.EMOTE_API}/join/${region}?tc=${tc}&key=${CONFIG.EMOTE_KEY}`,{mode:"no-cors"});toast("Berhasil bergabung!","ok");}
catch{toast("Gagal bergabung","err");}
}
async function apiForceLeave(){
const v=document.getElementById("leave-key")?.value;
const region=document.getElementById("leave-region")?.value||"id";
if(v!=="codespecters.com"){toast("Kode verifikasi salah","err");return;}
cooldown();
try{await fetch(`${CONFIG.EMOTE_API}/leave/${region}?key=${CONFIG.EMOTE_KEY}`,{mode:"no-cors"});toast("Force Leave terkirim!","ok");}
catch{toast("Gagal mengirim perintah","err");}
}
async function apiBanCheck(){
const uid=document.getElementById("ban-uid")?.value;
if(!uid){toast("UID wajib diisi","err");return;}
const result=document.getElementById("ban-result");
_sl(result,"Mengecek status ban...");
cooldown(2000);
try{
const r=await fetch(`${CONFIG.MULTI_API}/bancheck/check?uid=${uid}&key=${CONFIG.MULTI_KEY}`);
if(!r.ok)throw new Error("HTTP "+r.status);
const d=await r.json();
const banned=d?.is_banned||false;
const fmtTime=ts=>ts&&ts!=="0"?new Date(parseInt(ts)*1000).toLocaleString("id-ID",{day:"2-digit",month:"short",year:"numeric",hour:"2-digit",minute:"2-digit"}):"-";
result.innerHTML=`
<div class="rc-header ${banned?"rc-banned":"rc-safe"}">
<i class="fa-solid ${banned?"fa-ban":"fa-shield-check"}"></i>
<span>${banned?"AKUN KENA BAN":"AKUN AMAN"}</span>
</div>
<div class="rc-body">
<div class="rc-row"><span>Nickname</span><strong>${d.name||uid}</strong></div>
<div class="rc-row"><span>UID</span><strong>${d.uid||uid}</strong></div>
<div class="rc-row"><span>Level</span><strong>${d.level||"-"}</strong></div>
<div class="rc-row"><span>Status</span><strong class="${banned?"text-red":"text-green"}">${d.status||(banned?"BANNED":"CLEAN")}</strong></div>
<div class="rc-row"><span>Last Login</span><strong>${fmtTime(d.last_login)}</strong></div>
${banned?`<div class="rc-row"><span>Durasi Ban</span><strong class="text-red">${d.ban_period?d.ban_period+" hari":"-"}</strong></div>`:""}
</div>`;
}catch{
result.innerHTML=`<div class="rc-header rc-err"><i class="fa-solid fa-triangle-exclamation"></i><span>Gagal mengambil data</span></div>`;
toast("Gagal cek ban","err");
}
}
function _bioFmt(sig){
if(!sig)return"–";
return`<span style="font-size:.78rem;font-style:italic">"${sig.split("\n").join(" ")}"</span>`;
}
async function apiPlayerInfo(){
const uid=document.getElementById("info-uid")?.value;
const region=(document.getElementById("info-region")?.value||"id").toUpperCase();
if(!uid){toast("UID wajib diisi","err");return;}
const result=document.getElementById("info-result");
_sl(result,"Mengambil info player...");
cooldown(3000);
try{
const r=await fetch(`${CONFIG.MULTI_API}/infov2/player?uid=${uid}&server=${region}&need_gallery_info=true&key=${CONFIG.MULTI_KEY}`);
if(!r.ok)throw new Error("HTTP "+r.status);
const data=await r.json();

const b   = data.basicinfo||{};
const clan= data.clanbasicinfo||{};
const cap = data.captainbasicinfo||{};
const pet = data.petinfo||{};
const soc = data.socialinfo||{};
const ep  = data.historyepinfo||[];

const ts2date=ts=>{
  if(!ts||ts==="0"||ts===0)return"-";
  const d=new Date(parseInt(ts)*1000);
  return d.toLocaleDateString("id-ID",{day:"2-digit",month:"short",year:"numeric"});
};
const num=n=>n!=null?(+n).toLocaleString("id-ID"):"-";
const rankName=(rank,pts)=>{
  // Berdasarkan nilai rank numerik FF
  if(!rank)return"–";
  if(rank>=324)return'<i class="fa-solid fa-crown ani-pulse ico-gold"></i> Heroic';
  if(rank>=320)return'<i class="fa-solid fa-gem ani-glow ico-teal"></i> Diamond III→I';
  if(rank>=316)return'<i class="fa-solid fa-shield-halved ani-glow ico-blue"></i> Platinum III→I';
  if(rank>=312)return'<i class="fa-solid fa-medal ani-bounce ico-gold"></i> Gold III→I';
  if(rank>=308)return'<i class="fa-solid fa-medal ani-float ico-silver"></i> Silver III→I';
  if(rank>=304)return'<i class="fa-solid fa-medal ico-orange"></i> Bronze III→I';
  return'<i class="fa-solid fa-gamepad ico-silver"></i> Unranked';
};
const rankLabel=(rank,pts)=>{
  const name=rankName(rank,pts);
  return `${name} <span class='pi-sub'>(${num(pts)} poin)</span>`;
};
const secHead=(icon,label,color="#4facfe")=>
  `<div class="pi-sec-head" style="--pi-col:${color}"><i class="fa-solid ${icon}"></i><span>${label}</span></div>`;
const row=(label,value,accent=false)=>
  `<div class="pi-row${accent?" pi-row-accent":""}"><span class="pi-lbl">${label}</span><strong class="pi-val">${value}</strong></div>`;

// Gender & mode prefer
const genderMap={"GENDERFEMALE":"♀ Perempuan","GENDERMALE":"♂ Laki-laki"};
const modeMap={"MODEPREFERBR":"Battle Royale","MODEPREFERCR":"Clash Royale","MODEPREFERVS":"VS"};
const gender=genderMap[soc.gender]||"-";
const mode=modeMap[soc.modeprefer]||soc.modeprefer||"-";

// Elite pass
const hasElite=b.haselitepass?'<i class="fa-solid fa-circle-check ani-pulse ico-green"></i> Punya':'<i class="fa-solid fa-circle-xmark ico-red"></i> Tidak';

// Riwayat EP (max 5 terbaru)
const epRows=ep.slice(0,5).map(e=>
  `<div class="pi-row"><span class="pi-lbl">Season ${e.epeventid}</span><strong class="pi-val">${e.badgecnt||0} badge${e.ownedpass?` <span style="color:#ffd60a;font-size:.7rem"><i class="fa-solid fa-check ico-gold"></i> Pass</span>`:""}</strong></div>`
).join("");

result.innerHTML=`
<div class="pi-card">
${secHead("fa-id-card","ACCOUNT INFO","#4facfe")}
${row("Nickname",  b.nickname||"-")}
${row("UID",       b.accountid||uid, true)}
${row("Region",    b.region||region)}
${row("Level",     `Lv. ${b.level||"-"} <span class='pi-sub'>(${num(b.exp)} EXP)</span>`, true)}
${row("Likes", '<i class="fa-solid fa-heart ani-beat ico-red"></i> '+num(b.liked))}
${row("Badges",    num(b.badgecnt)+" badge", true)}
${row("Season",    "S"+(b.seasonid||"-"))}
${row("Elite Pass",hasElite, true)}
${row("Versi Game",b.releaseversion||"-")}
${row("Dibuat",    ts2date(b.createat), true)}
${row("Last Login",ts2date(b.lastloginat))}

${secHead("fa-trophy","RANK INFO","#ffd60a")}
${row("BR Rank",    rankLabel(b.rank, b.rankingpoints), true)}
${row("CS Rank",    rankLabel(b.csrank, b.csrankingpoints))}
${row("BR Max",     rankName(b.maxrank), true)}
${row("CS Max",     rankName(b.csmaxrank))}
${row("Hippo Rank", `#${b.hipporank||"-"} <span class='pi-sub'>(${num(b.hipporankingpoints)} poin)</span>`, true)}

${secHead("fa-comments","SOSIAL","#30d158")}
${row("Gender",     gender, true)}
${row("Mode Favorit",mode)}
${row("Bio",        _bioFmt(soc.signature), true)}

${clan.clanid?`
${secHead("fa-shield-halved","GUILD / CLAN","#bf5af2")}
${row("Nama Clan",  clan.clanname||"-", true)}
${row("Clan ID",    clan.clanid||"-")}
${row("Level Clan", "Lv. "+(clan.clanlevel||"-"), true)}
${row("Member",     (clan.membernum||"-")+"/"+(clan.capacity||"-"))}
${row("Kapten",     cap.nickname||"-", true)}
`:""}

${pet.id?`
${secHead("fa-paw","PET","#ff9f0a")}
${row("Nama Pet",   pet.name||"-", true)}
${row("Level Pet",  "Lv. "+(pet.level||"-")+" <span class='pi-sub'>("+num(pet.exp)+" EXP)</span>")}
`:""}

${ep.length?`
${secHead("fa-star","ELITE PASS HISTORY","#ffd60a")}
${epRows}
<div class="pi-row" style="opacity:.5"><span class="pi-lbl" style="font-size:.7rem">Total ${ep.length} season tercatat</span></div>
`:""}
</div>`;

}catch(e){
console.error("Player info error:",e);
result.innerHTML=`<div class="rc-header rc-err"><i class="fa-solid fa-triangle-exclamation"></i><span>Gagal mengambil data: ${e.message}</span></div>`;
toast("Gagal ambil info player","err");
}
}
async function apiVisitSpam(){
const uid=document.getElementById("visit-uid")?.value;
const region=(document.getElementById("visit-region")?.value||"id").toUpperCase();
if(!uid){toast("UID wajib diisi","err");return;}
const result=document.getElementById("visit-result");
_sl(result,"Mengirim kunjungan...");
cooldown();
try{
await fetch(`${CONFIG.MULTI_API}/visit/send?uid=${uid}&region=${region}&key=${CONFIG.MULTI_KEY}`,{mode:"no-cors"});
toast("Visit spam terkirim!","ok");
result.innerHTML=`<div class="rc-header rc-safe"><i class="fa-solid fa-eye"></i><span>Visit spam dikirim ke UID ${uid}</span></div>`;
}catch{
result.innerHTML=`<div class="rc-header rc-err"><i class="fa-solid fa-triangle-exclamation"></i><span>Gagal kirim visit</span></div>`;
toast("Gagal kirim visit","err");
}
}
async function apiOutfit(){
const uid=document.getElementById("outfit-uid")?.value;
const region=(document.getElementById("outfit-region")?.value||"id").toUpperCase();
if(!uid){toast("UID wajib diisi","err");return;}
const result=document.getElementById("outfit-result");
_sl(result,"Memuat kartu outfit...");
cooldown(2000);
const url=`${CONFIG.MULTI_API}/outfit/image?uid=${uid}&region=${region}&key=${CONFIG.MULTI_KEY}`;
result.innerHTML=`
<div class="rc-header rc-info"><i class="fa-solid fa-shirt"></i><span>OUTFIT PLAYER · ${uid}</span></div>
<div class="outfit-img-wrap">
<div class="outfit-loading" id="outfit-spinner"><span class="rc-loading-dot"></span><span class="rc-loading-dot"></span><span class="rc-loading-dot"></span></div>
<img src="${url}" alt="Outfit ${uid}" class="outfit-img" style="display:none"
onload="this.style.display='block';document.getElementById('outfit-spinner').style.display='none'"
onerror="this.parentElement.innerHTML='<div class=\\'outfit-err\\'>⚠️ Gagal memuat outfit untuk UID ini</div>'">
<div class="outfit-uid-label">UID: ${uid} · Region: ${region}</div>
<button class="outfit-dl-btn" onclick="downloadOutfit('${url}','outfit_${uid}')"><i class="fa-solid fa-download"></i> Download Card</button>
</div>`;
}
function downloadOutfit(url,filename){
const a=document.createElement("a");a.href=url;a.download=filename+".png";a.target="_blank";a.click();
}
async function apiPlayerStats(){
const uid=document.getElementById("stats-uid")?.value;
const region=(document.getElementById("stats-region")?.value||"id").toLowerCase();
const gamemode=document.getElementById("stats-gamemode")?.value||"br";
const matchmode=document.getElementById("stats-matchmode")?.value||"CAREER";
if(!uid){toast("UID wajib diisi","err");return;}
const result=document.getElementById("stats-result");
_sl(result,"Mengambil statistik...");
cooldown(3000);
try{
const r=await fetch(`${CONFIG.MULTI_API}/infov2/stats?uid=${uid}&server=${region}&gamemode=${gamemode}&matchmode=${matchmode}&key=${CONFIG.MULTI_KEY}`);
if(!r.ok)throw new Error("HTTP "+r.status);
const data=await r.json();

/* Debug — tampilkan raw jika gagal */
if(!data.success){
  result.innerHTML=`<div class="rc-header rc-err"><i class="fa-solid fa-triangle-exclamation"></i><span>API mengembalikan gagal</span></div>
  <details style="margin-top:10px;font-size:.75rem;color:var(--t3);word-break:break-all"><summary style="cursor:pointer;color:var(--t3)">Detail respons</summary><pre style="overflow:auto;max-height:200px;padding:10px;background:rgba(0,0,0,.3);border-radius:8px;margin-top:6px">${JSON.stringify(data,null,2)}</pre></details>`;
  return;
}

const d=data.data||{};
const gmLabel=gamemode==="br"?"Battle Royale":"Clash Squad";

if(gamemode==="cs"){
  /* CS punya struktur berbeda: cari key yang relevan */
  const csKeys=Object.keys(d).filter(k=>k.toLowerCase().includes("clash")||k.toLowerCase().includes("cs")||k.toLowerCase().includes("squad")||k==="stats"||k==="data");
  /* Coba berbagai key umum CS */
  const csData = d.classsquadstats||d.cs_stats||d.csstats||d.stats||d.classsquad||
                 d.solostats||d.quadstats||d;
  result.innerHTML=`
<div class="pi-card">
<div class="stats-top-header">
<i class="fa-solid fa-crosshairs"></i>
<div>
<div class="stats-title">Clash Squad</div>
<div class="stats-sub">${matchmode} MODE</div>
</div>
</div>
${_bsrCS(csData, d)}
</div>`;
} else {
  const solo =d.solostats||{};
  const duo  =d.duostats||{};
  const squad=d.quadstats||{};
  result.innerHTML=`
<div class="pi-card">
<div class="stats-top-header">
<i class="fa-solid fa-parachute-box"></i>
<div>
<div class="stats-title">Battle Royale</div>
<div class="stats-sub">${matchmode} MODE</div>
</div>
</div>
<div class="stats-tabs">
<button class="stab active" onclick="_sst(this,'solo')"><i class="fa-solid fa-user"></i> Solo</button>
<button class="stab" onclick="_sst(this,'duo')"><i class="fa-solid fa-user-group"></i> Duo</button>
<button class="stab" onclick="_sst(this,'squad')"><i class="fa-solid fa-users"></i> Squad</button>
</div>
<div id="stat-solo"  class="stat-panel">${_bsr(solo, "Solo")}</div>
<div id="stat-duo"   class="stat-panel d-none">${_bsr(duo,  "Duo")}</div>
<div id="stat-squad" class="stat-panel d-none">${_bsr(squad,"Squad")}</div>
</div>`;
}
}catch(e){
console.error("Stats error:",e);
result.innerHTML=`<div class="rc-header rc-err"><i class="fa-solid fa-triangle-exclamation"></i><span>Gagal mengambil statistik</span></div><p style="font-size:.75rem;color:var(--t3);padding:10px 0">${e.message}</p>`;
toast("Gagal ambil statistik","err");
}
}

/* Render CS stats — coba semua kemungkinan key */
function _bsrCS(cs, rawData){
  const fmt=n=>(n||0).toLocaleString("id-ID");
  /* Kalau ada gamesplayed langsung */
  if(cs&&(cs.gamesplayed||cs.games)){
    const games=cs.gamesplayed||cs.games||0;
    const wins=cs.wins||cs.win||0;
    const kills=cs.kills||cs.kill||0;
    const deaths=cs.deaths||cs.death||0;
    const wr=games>0?((wins/games)*100).toFixed(1)+"%":"0%";
    const kd=deaths>0?(kills/deaths).toFixed(2):"∞";
    const ds=cs.detailedstats||cs.details||cs||{};
    const hs=ds.headshotkills||ds.headshot||cs.headshot||0;
    const hsr=kills>0?((hs/kills)*100).toFixed(1)+"%":"0%";
    const srow=(ico,lbl,val,acc)=>`<div class="pi-row${acc?" pi-row-accent":""}"><span class="pi-lbl">${ico} ${lbl}</span><strong class="pi-val">${val}</strong></div>`;
    return`<div class="stat-summary">
<div class="stat-kpi"><div class="stat-kpi-v">${fmt(games)}</div><div class="stat-kpi-l">Games</div></div>
<div class="stat-kpi"><div class="stat-kpi-v text-green">${fmt(wins)}</div><div class="stat-kpi-l">Menang</div></div>
<div class="stat-kpi"><div class="stat-kpi-v">${wr}</div><div class="stat-kpi-l">Win Rate</div></div>
<div class="stat-kpi"><div class="stat-kpi-v">${kd}</div><div class="stat-kpi-l">K/D</div></div>
</div>
${srow('<i class="fa-solid fa-skull ani-shake ico-red"></i>',  "Kill",fmt(kills),true)}
${srow('<i class="fa-solid fa-crosshairs ani-spin ico-blue"></i>', "Headshot",fmt(hs)+` <span class='pi-sub'>(${hsr})</span>`,false)}
${srow('<i class="fa-solid fa-bolt ani-flicker ico-orange"></i>', "Damage",fmt(ds.damage||cs.damage||0),true)}
${srow('<i class="fa-solid fa-fire ani-pulse ico-red"></i>', "Highest Kill",ds.highestkills||cs.highestkills||"-",false)}`;
  }
  /* Kalau data tidak dikenali — tampilkan semua key yang ada */
  const keys=Object.keys(rawData||{});
  if(!keys.length) return`<div class="stat-empty"><i class="fa-solid fa-circle-xmark"></i> Data CS tidak tersedia untuk UID ini</div>`;
  const srow=(ico,lbl,val,acc)=>`<div class="pi-row${acc?" pi-row-accent":""}"><span class="pi-lbl">${ico} ${lbl}</span><strong class="pi-val">${val}</strong></div>`;
  return`<div class="pi-row"><span class="pi-lbl" style="color:var(--t3);font-size:.75rem">Data tersedia (key: ${keys.join(", ")})</span></div>`
    +keys.map((k,i)=>{
      const v=rawData[k];
      if(typeof v==="object"&&v!==null){
        const subkeys=Object.keys(v);
        return subkeys.map((sk,si)=>srow('<i class="fa-solid fa-chart-simple ico-blue"></i>',`${k}.${sk}`,String(v[sk]??"-"),si%2===0)).join("");
      }
      return srow('<i class="fa-solid fa-chart-simple ico-blue"></i>',k,String(v??"-"),i%2===0);
    }).join("");
}
function _bsr(s,mode){
if(!s||!s.gamesplayed)return`<div class="stat-empty"><i class="fa-solid fa-circle-xmark"></i> Data tidak tersedia</div>`;
const ds =s.detailedstats||{};
const wr =s.gamesplayed>0?((s.wins/s.gamesplayed)*100).toFixed(1)+"%":"0%";
const kd =ds.deaths>0?(s.kills/ds.deaths).toFixed(2):"∞";
const hsr=s.kills>0?((ds.headshotkills/s.kills)*100).toFixed(1)+"%":"0%";
const fmt=n=>(n||0).toLocaleString("id-ID");
const srow=(ico,lbl,val,accent)=>
`<div class="pi-row${accent?" pi-row-accent":""}">
<span class="pi-lbl">${ico} ${lbl}</span>
<strong class="pi-val">${val}</strong>
</div>`;
return`
<div class="stat-summary">
<div class="stat-kpi"><div class="stat-kpi-v">${fmt(s.gamesplayed)}</div><div class="stat-kpi-l">Games</div></div>
<div class="stat-kpi"><div class="stat-kpi-v text-green">${fmt(s.wins)}</div><div class="stat-kpi-l">Menang</div></div>
<div class="stat-kpi"><div class="stat-kpi-v">${wr}</div><div class="stat-kpi-l">Win Rate</div></div>
<div class="stat-kpi"><div class="stat-kpi-v">${kd}</div><div class="stat-kpi-l">K/D</div></div>
</div>
${srow('<i class="fa-solid fa-skull ani-shake ico-red"></i>', "Kill",fmt(s.kills),true)}
${srow('<i class="fa-solid fa-crosshairs ani-spin ico-blue"></i>', "Headshot",fmt(ds.headshotkills||0)+" <span class='pi-sub'>("+hsr+")</span>")}
${srow('<i class="fa-solid fa-bolt ani-flicker ico-orange"></i>', "Damage",fmt(ds.damage||0),true)}
${srow('<i class="fa-solid fa-fire ani-pulse ico-red"></i>', "Highest Kill",ds.highestkills||0)}
${srow('<i class="fa-regular fa-clock ani-pulse ico-blue"></i>', "Survival Time",Math.floor((ds.survivaltime||0)/60)+" menit",true)}
${srow('<i class="fa-solid fa-person-running ani-bounce ico-green"></i>', "Jarak Tempuh",fmt(ds.distancetravelled||0)+" m")}
${mode!=="Solo"?srow('<i class="fa-solid fa-syringe ani-bounce ico-green"></i>', "Revive",fmt(ds.revives||0),true):""}
${mode!=="Solo"?srow('<i class="fa-solid fa-hand-fist ani-shake ico-orange"></i>', "Knockdown",fmt(ds.knockdown||0)):""}
${srow('<i class="fa-solid fa-bag-shopping ani-float ico-purple"></i>', "Pickup Item",fmt(ds.pickups||0),true)}
`;
}
function _sst(btn,panel){
btn.closest(".stats-tabs").querySelectorAll(".stab").forEach(b=>b.classList.remove("active"));
btn.classList.add("active");
["solo","duo","squad"].forEach(p=>document.getElementById("stat-"+p)?.classList.toggle("d-none",p!==panel));
}
let _n0=null;
const NM={
ok:{t:"Berhasil",i:"fa-circle-check",c:"type-ok",g:"glow-ok"},
err:{t:"Gagal",i:"fa-circle-xmark",c:"type-err",g:"glow-err"},
info:{t:"Informasi",i:"fa-circle-info",c:"type-info",g:"glow-info"},
warn:{t:"Perhatian",i:"fa-triangle-exclamation",c:"type-info",g:"glow-info"},
};
const NC={
"Password salah":"Password Salah",
"Username tidak ditemukan":"Akun Tidak Ditemukan",
"Username sudah digunakan":"Username Sudah Dipakai",
"Email sudah terdaftar":"Email Terdaftar",
"Akun berhasil dibuat! Silakan masuk.":"Pendaftaran Berhasil!",
"Verifikasi Cloudflare belum selesai!":"Verifikasi Diperlukan",
"Fitur sedang maintenance":"<i class=\"fa-solid fa-wrench ani-spin ico-orange\"></i> Maintenance",
};
function toast(msg,type="ok",subtitle=null){
const c=document.getElementById("toast-container");
if(!c)return;
const tm={ok:{i:"fa-circle-check",l:"Berhasil"},err:{i:"fa-circle-xmark",l:"Error"},
info:{i:"fa-circle-info",l:"Info"},warn:{i:"fa-triangle-exclamation",l:"Perhatian"},
update:{i:"fa-rotate",l:"Update"},maint:{i:"fa-wrench",l:"Maintenance"},
gift:{i:"fa-gift",l:"Hadiah"},urgent:{i:"fa-bolt",l:"Urgent"}};
const t=tm[type]||tm.ok;
const dur=type==="warn"?5000:3500;
const el=document.createElement("div");
el.className=`toast-item`;
const titleTxt=NC[msg]||t.l;
const subTxt=subtitle||msg;
el.innerHTML=`<div class="toast-dot ${type}"></div><div class="toast-ico ${type}"><i class="fa-solid ${t.i}"></i></div><div class="toast-text"><div class="toast-title">${titleTxt}</div><div class="toast-msg">${subTxt}</div></div><button class="toast-x" onclick="this.closest('.toast-item').remove()"><i class="fa-solid fa-xmark"></i></button><div class="toast-bar ${type}" style="--dur:${dur}ms"></div>`;
el.onclick=function(e){if(!e.target.closest(".toast-x"))el.remove();};
c.appendChild(el);
requestAnimationFrame(()=>{requestAnimationFrame(()=>{el.classList.add("show");});});
setTimeout(()=>{el.classList.add("hide");setTimeout(()=>el.remove(),300);},dur);
}
function closeNotif(){}

/* session dihandle dari index.html setelah script load */
/* =====================================================
   BROADCAST SYSTEM
   ===================================================== */
let _bcType = 'info';

const _bcMeta = {
    info:   { icon:'fa-circle-info',       color:'#4facfe', label:'Info' },
    ok:     { icon:'fa-circle-check',      color:'#30d158', label:'Sukses' },
    warn:   { icon:'fa-triangle-exclamation', color:'#ffd60a', label:'Peringatan' },
    err:    { icon:'fa-circle-xmark',      color:'#ff453a', label:'Error' },
    update: { icon:'fa-rotate',            color:'#bf5af2', label:'Update' },
    maint:  { icon:'fa-wrench',            color:'#ff9f0a', label:'Maintenance' },
    gift:   { icon:'fa-gift',              color:'#ffd60a', label:'Hadiah' },
    urgent: { icon:'fa-bolt',              color:'#ff453a', label:'Urgent' },
};

function setBcType(btn, type) {
    document.querySelectorAll('.bc-type-card').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');
    _bcType = type;
    _updateBcPreview();
}

function bcCount() {
    const msg = document.getElementById('bc-msg')?.value||'';
    const title = document.getElementById('bc-title')?.value||'';
    const mc = document.getElementById('bc-msg-count');
    const tc = document.getElementById('bc-title-count');
    if(mc) mc.textContent = msg.length+'/300';
    if(tc) tc.textContent = title.length+'/50';
    _updateBcPreview();
}

function _updateBcPreview() {
    const title = document.getElementById('bc-title')?.value || 'Judul broadcast...';
    const msg   = document.getElementById('bc-msg')?.value   || 'Isi pesan akan muncul di sini...';
    const meta  = _bcMeta[_bcType] || _bcMeta.info;
    const blpTitle = document.getElementById('blp-title');
    const blpMsg   = document.getElementById('blp-msg');
    const blpIcon  = document.getElementById('blp-icon');
    const blpWrap  = document.getElementById('blp-icon-wrap');
    const blpBox   = document.getElementById('blp-box');
    if(blpTitle) blpTitle.textContent = title;
    if(blpMsg)   blpMsg.textContent   = msg;
    if(blpIcon)  { blpIcon.className = 'fa-solid '+meta.icon; blpIcon.style.color = meta.color; }
    if(blpWrap)  blpWrap.style.background = meta.color+'22';
    if(blpBox)   blpBox.style.borderColor = meta.color+'33';
}

function _initWelcome(username, role) {
    const av = document.getElementById('wc-avatar');
    const nm = document.getElementById('wc-name');
    const gr = document.getElementById('wc-greet');
    const rt = document.getElementById('wc-role-tag');
    if(av) av.textContent = username.slice(0,2).toUpperCase();
    if(nm) nm.textContent = username;
    // Deteksi timezone Indonesia otomatis (WIB=+7, WITA=+8, WIT=+9)
    const userTZ = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const witaZones = ['Asia/Makassar','Asia/Bali','Asia/Ujung_Pandang'];
    const witZones  = ['Asia/Jayapura'];
    let tzName, tzOffset;
    if (witZones.some(z => userTZ.startsWith(z) || userTZ === z)) {
        tzName = 'WIT'; tzOffset = 9;
    } else if (witaZones.some(z => userTZ.startsWith(z) || userTZ === z)) {
        tzName = 'WITA'; tzOffset = 8;
    } else {
        // Default WIB (+7) untuk Jakarta, Surabaya, dll atau zona luar Indonesia
        tzName = 'WIB'; tzOffset = 7;
    }
    const nowID = new Date(new Date().toLocaleString('en-US', { timeZone: userTZ }));
    const hr = nowID.getHours();
    const greet = hr < 12 ? '<i class="fa-solid fa-sun ani-spin ico-gold"></i> Selamat pagi' : hr < 17 ? '<i class="fa-solid fa-hand-wave ani-bounce ico-blue"></i> Selamat siang' : hr < 20 ? '<i class="fa-solid fa-cloud-sun ani-float ico-orange"></i> Selamat sore' : '<i class="fa-solid fa-moon ani-pulse ico-purple"></i> Selamat malam';
    if(gr) gr.innerHTML = greet;
    if(rt) {
        rt.innerHTML = role === 'admin' ? '<i class="fa-solid fa-crown ani-pulse ico-gold"></i> Administrator' : '<i class="fa-solid fa-user ani-float ico-blue"></i> Member';
        rt.className   = 'wc-role ' + (role === 'admin' ? 'wc-role-admin' : 'wc-role-user');
    }
    // attach live counter to inputs
    const ti = document.getElementById('bc-title');
    if(ti) ti.addEventListener('input', bcCount);
}

async function sendBroadcast() {
    if (!_s0 || _s0.role !== 'admin') { toast('Akses ditolak', 'err'); return; }
    const title = document.getElementById('bc-title').value.trim();
    const msg   = document.getElementById('bc-msg').value.trim();
    if (!title) { toast('Judul wajib diisi', 'err'); return; }
    if (!msg)   { toast('Pesan wajib diisi', 'err'); return; }

    const bc = { title, msg, type: _bcType, ts: Date.now() };
    const db = await _gdb();
    if (!db) { toast('Gagal terhubung', 'err'); return; }
    const ok = await _sdb({ ...db, broadcast: bc });
    if (ok) {
        toast('Broadcast terkirim!', 'ok', 'Semua pengguna akan melihat pesan ini');
        document.getElementById('bc-title').value = '';
        document.getElementById('bc-msg').value = '';
        renderBcActive(bc);
        showBcBanner(bc);
    } else {
        toast('Gagal kirim broadcast', 'err');
    }
}

async function clearBroadcast() {
    if (!_s0 || _s0.role !== 'admin') return;
    const db = await _gdb();
    if (!db) return;
    const { broadcast, ...rest } = db;
    const ok = await _sdb(rest);
    if (ok) {
        toast('Broadcast dihapus', 'ok');
        document.getElementById('bc-active-wrap')?.classList.add('d-none');
        document.getElementById('bc-banner')?.classList.add('d-none');
    }
}

function renderBcActive(bc) {
    const wrap = document.getElementById('bc-active-wrap');
    const box  = document.getElementById('bc-active-box');
    if (!wrap || !box || !bc) return;
    const meta = _bcMeta[bc.type] || _bcMeta.info;
    box.innerHTML = `
        <div class="bc-preview" style="border-color:${meta.color}33;background:${meta.color}0d">
            <div class="bc-preview-head" style="color:${meta.color}">
                <i class="fa-solid ${meta.icon}"></i> ${bc.title}
            </div>
            <div class="bc-preview-msg">${bc.msg}</div>
        </div>`;
    const sentEl = document.getElementById('bc-sent-time');
    if(sentEl) sentEl.textContent = new Date(bc.ts).toLocaleString('id-ID');
    wrap.classList.remove('d-none');
}

function editBroadcast() {
    _gdb().then(db => {
        if (!db?.broadcast) return;
        const bc = db.broadcast;
        const ti = document.getElementById('bc-title');
        const mi = document.getElementById('bc-msg');
        if(ti) ti.value = bc.title;
        if(mi) mi.value = bc.msg;
        _bcType = bc.type || 'info';
        document.querySelectorAll('.bc-type-card').forEach(b => b.classList.remove('active'));
        document.querySelectorAll('.bc-type-card').forEach(b => {
            const onclick = b.getAttribute('onclick') || '';
            if(onclick.includes("'"+_bcType+"'")) b.classList.add('active');
        });
        bcCount();
        document.getElementById('bc-title')?.scrollIntoView({behavior:'smooth'});
        toast('Data broadcast dimuat ke form', 'info');
    });
}

function showBcBanner(bc) {
    if (!bc) return;
    const banner = document.getElementById('bc-banner');
    if (!banner) return;
    const meta = _bcMeta[bc.type] || _bcMeta.info;
    const col  = meta.color;
    const icon = meta.icon;
    const wrap = document.getElementById('bc-banner-icon-wrap');
    const ico  = document.getElementById('bc-banner-icon');
    const ttl  = document.getElementById('bc-banner-title');
    const msg  = document.getElementById('bc-banner-msg');
    if (wrap) wrap.style.background = col + '22';
    if (ico)  { ico.className = `fa-solid ${icon}`; ico.style.color = col; }
    if (ttl)  ttl.textContent = bc.title;
    if (msg)  msg.textContent = bc.msg;
    banner.className = `bc-banner bc-${bc.type}`;
    banner.classList.remove('d-none');
    /* Simpan di sessionStorage agar tidak muncul lagi kalau sudah ditutup */
    const closed = sessionStorage.getItem('bc_closed');
    if (closed && closed === String(bc.ts)) banner.classList.add('d-none');
}

function closeBcBanner() {
    const banner = document.getElementById('bc-banner');
    if (!banner) return;
    banner.classList.add('d-none');
    /* Tandai sudah ditutup */
    const title = document.getElementById('bc-banner-title')?.textContent;
    /* ambil ts dari DB terakhir */
    _gdb().then(db => { if (db?.broadcast) sessionStorage.setItem('bc_closed', String(db.broadcast.ts)); });
}

/* Load broadcast saat masuk app */
async function loadBroadcast() {
    const db = await _gdb();
    if (!db?.broadcast) return;
    const bc = db.broadcast;
    showBcBanner(bc);
    /* Kalau admin, tampilkan juga preview di admin panel */
    if (_s0?.role === 'admin') renderBcActive(bc);
}

/* ============================
   SISTEM PESAN / INBOX
   ============================ */

function _getMsgKey() {
    return _s0 ? `msg_read_${_s0.username}` : 'msg_read_guest';
}

function _getReadTs() {
    const v = localStorage.getItem(_getMsgKey());
    return v ? parseInt(v) : 0;
}

function _setReadTs(ts) {
    localStorage.setItem(_getMsgKey(), String(ts));
}

async function _initMsgBadge() {
    const db = await _gdb();
    if (!db?.broadcast) { _updateMsgBadge(false); return; }
    const bc = db.broadcast;
    _updateMsgBadge(bc.ts > _getReadTs());
}

function _updateMsgBadge(hasUnread) {
    const badge = document.getElementById('msg-badge');
    if (!badge) return;
    if (hasUnread) {
        badge.classList.remove('d-none');
    } else {
        badge.classList.add('d-none');
    }
}

async function openMessages() {
    showSec('messages-sec');
    const container = document.getElementById('msg-list');
    if (!container) return;
    container.innerHTML = `<div class="msg-loading"><i class="fa-solid fa-spinner fa-spin"></i> Memuat pesan...</div>`;
    
    const db = await _gdb();
    if (!db?.broadcast) {
        container.innerHTML = `<div class="msg-empty"><i class="fa-solid fa-inbox"></i><div>Tidak ada pesan</div><p>Belum ada broadcast dari admin.</p></div>`;
        return;
    }
    
    const bc = db.broadcast;
    const readTs = _getReadTs();
    const isRead = bc.ts <= readTs;
    
    const icons  = { ok:'fa-circle-check', err:'fa-circle-xmark', warn:'fa-triangle-exclamation', info:'fa-bullhorn' };
    const colors = { ok:'#30d158', err:'#ff453a', warn:'#ffd60a', info:'#4facfe' };
    const labels = { ok:'Sukses', err:'Error', warn:'Peringatan', info:'Info' };
    const col  = colors[bc.type] || colors.info;
    const icon = icons[bc.type]  || icons.info;
    const label = labels[bc.type] || 'Info';
    
    container.innerHTML = `
        <div class="msg-item ${isRead ? 'msg-read' : 'msg-unread'}" id="msg-item-${bc.ts}">
            <div class="msg-item-header">
                <div class="msg-item-icon-wrap" style="background:${col}22">
                    <i class="fa-solid ${icon}" style="color:${col}"></i>
                </div>
                <div class="msg-item-meta">
                    <div class="msg-item-title">${bc.title}</div>
                    <div class="msg-item-time"><i class="fa-regular fa-clock"></i> ${new Date(bc.ts).toLocaleString('id-ID')}</div>
                </div>
                <div class="msg-item-badge-wrap">
                    <span class="msg-type-badge" style="background:${col}22;color:${col}">${label}</span>
                    ${!isRead ? `<span class="msg-dot-unread"></span>` : ''}
                </div>
            </div>
            <div class="msg-item-body">${bc.msg}</div>
            <div class="msg-item-footer">
                ${isRead 
                    ? `<span class="msg-status-read"><i class="fa-solid fa-check-double"></i> Sudah dibaca</span>`
                    : `<button class="act-btn btn-blue msg-read-btn" onclick="markAsRead(${bc.ts})">
                            <i class="fa-solid fa-check"></i> Tandai Sudah Dibaca
                            <div class="btn-shine"></div>
                        </button>`
                }
            </div>
        </div>
    `;
    
    // Update badge
    _updateMsgBadge(!isRead);
}

function markAsRead(ts) {
    _setReadTs(ts);
    _updateMsgBadge(false);
    
    const item = document.getElementById(`msg-item-${ts}`);
    if (item) {
        item.classList.remove('msg-unread');
        item.classList.add('msg-read');
        const footer = item.querySelector('.msg-item-footer');
        if (footer) {
            footer.innerHTML = `<span class="msg-status-read"><i class="fa-solid fa-check-double"></i> Sudah dibaca</span>`;
        }
        // Hapus dot unread
        const dot = item.querySelector('.msg-dot-unread');
        if (dot) dot.remove();
    }
    toast('Pesan ditandai sudah dibaca', 'ok');
}



/* ── Load harga fitur saat masuk app ──────────────────── */


function loadAdminData(){ _lad(); }

/* ═══════════════════════════════════════════════════════
   VISITOR COUNTER — real-time berbasis JSONBin
   Setiap refresh → counter bertambah + simpan timestamp
   ═══════════════════════════════════════════════════════ */
let _vcTimer = null;

async function _incrementVisitor() {
  try {
    const db = await _gdb();
    if (!db) return null;
    const visitors = db.visitors || { total: 0, sessions: [] };
    // Tambah total
    visitors.total = (visitors.total || 0) + 1;
    // Simpan sesi: simpan timestamp 30 menit terakhir untuk hitung "online"
    const now = Date.now();
    const sessionId = now + '_' + Math.random().toString(36).slice(2, 7);
    visitors.sessions = [
      ...(visitors.sessions || []).filter(s => now - s.ts < 30 * 60 * 1000),
      { id: sessionId, ts: now }
    ];
    await _sdb({ ...db, visitors });
    return visitors;
  } catch (e) {
    console.error('_incrementVisitor', e);
    return null;
  }
}

async function _fetchVisitorCount() {
  try {
    const db = await _gdb();
    if (!db) return null;
    return db.visitors || { total: 0, sessions: [] };
  } catch (e) {
    return null;
  }
}

function _formatCount(n) {
  return (n || 0).toLocaleString('id-ID');
}

function _renderVisitorUI(visitors) {
  const vcEl  = document.getElementById('vc-count');
  const voEl  = document.getElementById('vc-online');
  if (!vcEl || !voEl) return;
  const total   = visitors.total || 0;
  const now     = Date.now();
  const onlines = (visitors.sessions || []).filter(s => now - s.ts < 30 * 60 * 1000).length;
  // Animasi angka
  const cur = parseInt(vcEl.dataset.val || '0') || 0;
  if (cur !== total) {
    const step = Math.ceil(Math.abs(total - cur) / 20);
    let v = cur;
    const iv = setInterval(() => {
      v = v < total ? Math.min(v + step, total) : Math.max(v - step, total);
      vcEl.textContent = _formatCount(v);
      vcEl.dataset.val = v;
      if (v === total) clearInterval(iv);
    }, 30);
  } else {
    vcEl.textContent = _formatCount(total);
  }
  voEl.textContent = onlines;
}

async function initVisitorCounter() {
  const vcEl = document.getElementById('vc-count');
  if (!vcEl) return;
  // Tambah pengunjung saat pertama kali masuk
  const visitors = await _incrementVisitor();
  if (visitors) _renderVisitorUI(visitors);
  // Auto-refresh tiap 60 detik untuk update "online"
  clearInterval(_vcTimer);
  _vcTimer = setInterval(async () => {
    const v = await _fetchVisitorCount();
    if (v) _renderVisitorUI(v);
  }, 60000);
}

/* ═══════════════════════════════════════════════════════
   PLAYER INFO VERSION SWITCHER
   ═══════════════════════════════════════════════════════ */
let _piVer = 'v2'; // default version

function switchInfoVer(ver) {
  _piVer = ver;
  document.getElementById('pi-tab-v1').classList.toggle('active', ver === 'v1');
  document.getElementById('pi-tab-v2').classList.toggle('active', ver === 'v2');
  // Reset result
  const result = document.getElementById('info-result');
  if (result) { result.innerHTML = ''; result.classList.add('d-none'); }
}

function apiPlayerInfoDispatch() {
  if (_piVer === 'v1') apiPlayerInfoV1();
  else apiPlayerInfo();
}

/* ═══════════════════════════════════════════════════════
   PLAYER INFO V1 — ff-multipurpose-api /info/get
   ═══════════════════════════════════════════════════════ */
async function apiPlayerInfoV1() {
  const uid    = document.getElementById('info-uid')?.value?.trim();
  const region = (document.getElementById('info-region')?.value || 'id').toUpperCase();
  if (!uid) { toast('UID wajib diisi', 'err'); return; }

  const result = document.getElementById('info-result');
  _sl(result, 'Mengambil info player V1...');
  cooldown(3000);

  try {
    const r = await fetch(`${CONFIG.MULTI_API}/info/get?uid=${uid}&region=${region}&key=${CONFIG.MULTI_KEY}`);
    if (!r.ok) throw new Error('HTTP ' + r.status);
    const d = await r.json();

    const acc  = d.AccountInfo          || {};
    const prof = d.AccountProfileInfo   || {};
    const eq   = d.EquippedItemsInfo    || {};
    const pet  = d.PetInfo              || {};
    const guild= d.GuildInfo            || {};

    const ts2date = ts => {
      if (!ts || ts === '0' || ts === 0) return '–';
      const d = new Date(parseInt(ts) * 1000);
      const tgl = d.toLocaleDateString('id-ID', { day:'2-digit', month:'short', year:'numeric' });
      const jam = d.toLocaleTimeString('id-ID', { hour:'2-digit', minute:'2-digit', second:'2-digit' });
      return `${tgl}, ${jam}`;
    };
    const num = n => (n != null && n !== '' && n !== null) ? (+n).toLocaleString('id-ID') : '–';
    const v   = val => (val != null && val !== '' && val !== null) ? val : '–';

    const rankLabel = code => {
      if (!code) return '–';
      if (code >= 324) return '<i class="fa-solid fa-crown ani-pulse ico-gold"></i> Heroic';
      if (code >= 320) return '<i class="fa-solid fa-gem ani-glow ico-teal"></i> Diamond';
      if (code >= 316) return '<i class="fa-solid fa-shield-halved ani-glow ico-blue"></i> Platinum';
      if (code >= 312) return '<i class="fa-solid fa-medal ani-bounce ico-gold"></i> Gold';
      if (code >= 308) return '<i class="fa-solid fa-medal ani-float ico-silver"></i> Silver';
      if (code >= 304) return '<i class="fa-solid fa-medal ico-orange"></i> Bronze';
      return '<i class="fa-solid fa-gamepad ico-silver"></i> Unranked';
    };

    const sec = (icon, label, color = '#4facfe') =>
      `<div class="pi1-sec-head" style="color:${color}"><i class="fa-solid ${icon}" style="color:${color}"></i><span>${label}</span></div>`;

    const row = (lbl, val, cls = '') =>
      `<div class="pi1-row"><span class="pi1-lbl">${lbl}</span><strong class="pi1-val ${cls}">${val}</strong></div>`;

    const soc   = d.SocialInfo        || {};
    const cred  = d.CreditScoreInfo   || {};

    // Language cleanup
    const langClean = s => s ? s.replace('Language_','').replace(/_/g,' ') : '–';

    result.innerHTML = `
<div class="pi-card pi1-card">

  <div class="pi1-sec">
    ${sec('fa-id-card', 'ACCOUNT INFO', '#4facfe')}
    ${row('Name',       v(acc.AccountName))}
    ${row('Level',      v(acc.AccountLevel))}
    ${row('EXP',        num(acc.AccountEXP))}
    ${row('Region',     v(acc.AccountRegion))}
    ${row('Likes',      num(acc.AccountLikes))}
    ${row('Season',     v(acc.AccountSeasonId))}
    ${row('Last Login', ts2date(acc.AccountLastLogin))}
    ${row('Created',    ts2date(acc.AccountCreateTime))}
    ${soc.signature ? row('Signature', v(soc.signature)) : ''}
  </div>

  <div class="pi1-sec">
    ${sec('fa-trophy', 'RANK & REWARDS', '#ffd60a')}
    ${prof.Title ? row('Title', v(prof.Title)) : ''}
    ${row('BR Max Rank',    v(prof.BrMaxRank))}
    ${row('BR Rank Points', num(prof.BrRankPoint))}
    ${row('CS Max Rank',    v(prof.CsMaxRank))}
    ${row('CS Rank Points', num(prof.CsRankPoint))}
  </div>

  <div class="pi1-sec">
    ${sec('fa-shield-halved', 'GUILD INFO', '#30d158')}
    ${row('Guild Name', v(guild.GuildName))}
    ${row('Guild ID',   v(guild.GuildID))}
    ${row('Level',      v(guild.GuildLevel))}
    ${row('Members',    `${v(guild.GuildMember)} / ${v(guild.GuildCapacity)}`)}
  </div>

  <div class="pi1-sec">
    ${sec('fa-palette', 'VISUALS & PASS', '#bf5af2')}
    ${row('Avatar ID',   v(eq.EquippedAvatarId))}
    ${row('Banner ID',   v(eq.EquippedBannerId))}
    ${row('BP Badge ID', v(eq.EquippedBPID))}
    ${eq.EquippedBPBadges != null ? row('BP Badges', v(eq.EquippedBPBadges)) : ''}
  </div>

  ${Object.keys(soc).filter(k => k !== 'signature').length ? `
  <div class="pi1-sec">
    ${sec('fa-comments', 'SOCIAL DETAILS', '#4facfe')}
    ${soc.language ? row('Language', langClean(soc.language)) : ''}
    ${soc.gender   ? row('Gender',   v(soc.gender).replace('GENDER','')) : ''}
    ${soc.modeprefer ? row('Mode Prefer', v(soc.modeprefer).replace('MODEPREFER','')) : ''}
  </div>` : ''}

  <div class="pi1-sec">
    ${sec('fa-microchip', 'SYSTEM INFO', '#ff9f0a')}
    ${cred.credit != null ? row('Credit Score', v(cred.credit)) : (d.CreditScoreInfo && Object.keys(d.CreditScoreInfo).length === 0 ? row('Credit Score', '100') : '')}
    ${row('Game Version', v(d.ReleaseVersion))}
  </div>

  ${pet.id ? `
  <div class="pi1-sec">
    ${sec('fa-paw', 'PET INFO', '#ff9f0a')}
    ${row('Nama Pet', v(pet.name))}
    ${row('Level',    `${v(pet.level)} (${num(pet.exp)} EXP)`)}
    ${pet.isSelected ? row('Status', '<i class="fa-solid fa-circle-check ani-pulse ico-green"></i> Equipped') : ''}
  </div>` : ''}

  ${guild.GuildID && guild.GuildID !== 'None' ? `
  <div class="pi1-sec">
    ${sec('fa-shield-halved', 'GUILD INFO', '#30d158')}
    ${row('Nama Guild',  v(guild.GuildName), 'green')}
    ${row('Guild ID',    v(guild.GuildID))}
    ${row('Level',       `Lv. ${v(guild.GuildLevel)}`)}
    ${row('Member',      `${v(guild.GuildMember)}/${v(guild.GuildCapacity)}`)}
    ${row('Owner ID',    v(guild.GuildOwner))}
  </div>` : `
  <div class="pi1-sec">
    ${sec('fa-shield-halved', 'GUILD INFO', '#30d158')}
    <div class="pi1-row" style="justify-content:center;color:var(--t3);font-size:.78rem;padding:10px 0">
      <i class="fa-solid fa-circle-info" style="margin-right:6px"></i> Tidak tergabung dalam guild
    </div>
  </div>`}

</div>`;

  result.classList.remove('d-none');

  } catch(e) {
    console.error('PlayerInfoV1 error:', e);
    result.innerHTML = `<div class="rc-header rc-err"><i class="fa-solid fa-triangle-exclamation"></i><span>Gagal mengambil data V1: ${e.message}</span></div>`;
    result.classList.remove('d-none');
    toast('Gagal ambil info player V1', 'err');
  }
}

/* ═══════════════════════════════════════════════════════
   FAVORIT EMOTE
   ═══════════════════════════════════════════════════════ */
function _getFavs(){ try{return JSON.parse(localStorage.getItem('ff_favs')||'[]');}catch{return [];} }
function _setFavs(a){ localStorage.setItem('ff_favs', JSON.stringify(a)); }
function isFav(id){ return _getFavs().some(f=>f.id===id); }
function toggleFav(id, name, imgSrc, e){
  e.stopPropagation();
  const favs=_getFavs();
  const idx=favs.findIndex(f=>f.id===id);
  if(idx===-1){ favs.push({id,name,imgSrc}); _setFavs(favs); toast('Ditambah ke favorit','ok',name); }
  else { favs.splice(idx,1); _setFavs(favs); toast('Dihapus dari favorit','info',name); }
  renderFavGrid();
  // update star button state
  const btn=document.querySelector(`.emote-star[data-id="${id}"]`);
  if(btn) btn.classList.toggle('active', idx===-1);
}
function removeFav(id){
  const favs=_getFavs().filter(f=>f.id!==id);
  _setFavs(favs);
  renderFavGrid();
  const btn=document.querySelector(`.emote-star[data-id="${id}"]`);
  if(btn) btn.classList.remove('active');
}
function renderFavGrid(){
  const grid=document.getElementById('fav-grid');
  const hint=document.getElementById('fav-bar-hint');
  if(!grid)return;
  const favs=_getFavs();
  if(hint) hint.style.display=favs.length?'none':'block';
  grid.innerHTML='';
  favs.forEach(f=>{
    const item=document.createElement('div'); item.className='fav-item';
    item.onclick=()=>doEmote(f.id, f.name);
    const img=document.createElement('img'); img.src=f.imgSrc||`${CONFIG.CDN_BASE}${f.id}.png`; img.alt=f.name;
    img.onerror=function(){this.src="data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='28' height='28'%3E%3Crect fill='%23111' width='28' height='28' rx='6'/%3E%3C/svg%3E";};
    const span=document.createElement('span'); span.textContent=f.name;
    const rem=document.createElement('button'); rem.className='fav-rem';
    rem.innerHTML='<i class="fa-solid fa-xmark"></i>';
    rem.onclick=ev=>{ev.stopPropagation();removeFav(f.id);};
    item.append(img,span,rem); grid.appendChild(item);
  });
}
// Override renderEmotes to inject star buttons
const _origRenderEmotes=renderEmotes;
renderEmotes=function(data,txt='',cat='all'){
  _origRenderEmotes(data,txt,cat);
  setTimeout(()=>{
    const grid=document.getElementById('emulator-grid');
    if(!grid)return;
    grid.querySelectorAll('.emote-item').forEach(item=>{
      const name=item.querySelector('span')?.textContent||'';
      const img=item.querySelector('img');
      const imgSrc=img?.src||'';
      // extract id from CDN url
      const match=imgSrc.match(/\/(\d+)\.png$/);
      const id=match?match[1]:null;
      if(!id)return;
      const star=document.createElement('button');
      star.className='emote-star'+(isFav(id)?' active':'');
      star.dataset.id=id;
      star.innerHTML='<i class="fa-solid fa-star"></i>';
      star.onclick=e=>toggleFav(id, name, imgSrc, e);
      item.appendChild(star);
    });
    renderFavGrid();
  }, 500);
};

/* ═══════════════════════════════════════════════════════
   ONLINE USERS
   ═══════════════════════════════════════════════════════ */
async function loadOnlineUsers(){
  const list=document.getElementById('online-list');
  if(!list)return;
  list.innerHTML=`<div class="ol-loading"><i class="fa-solid fa-spinner fa-spin"></i> Memuat data...</div>`;
  const db=await _gdb();
  if(!db){list.innerHTML=`<div class="ol-loading">Gagal memuat</div>`;return;}
  const users=db.users||[];
  const visitors=db.visitors||{sessions:[]};
  const now=Date.now();
  const onlineSessions=(visitors.sessions||[]).filter(s=>now-s.ts<30*60*1000);
  document.getElementById('ol-total').textContent=users.length;
  document.getElementById('ol-online').textContent=onlineSessions.length;
  list.innerHTML='';
  // Tampilkan semua user, tandai yang admin online
  if(!users.length){list.innerHTML=`<div class="ol-loading">Belum ada user terdaftar</div>`;return;}
  users.forEach((u,i)=>{
    const isAdmin=u.role==='admin';
    const card=document.createElement('div');
    card.className='ol-card'+(i<onlineSessions.length?' ol-online':'');
    card.innerHTML=`
      <div class="ol-avatar">${u.username.slice(0,2).toUpperCase()}</div>
      <div class="ol-info">
        <div class="ol-name">${u.username}${isAdmin?' <i class="fa-solid fa-crown ani-pulse ico-gold" style="font-size:.65rem"></i>':''}</div>
        <div class="ol-meta">${u.email||'–'}</div>
      </div>
      <div class="ol-status">
        <div class="ol-dot${i<onlineSessions.length?' live':''}"></div>
        <span style="font-size:.68rem;color:var(--t3)">${i<onlineSessions.length?'Online':'–'}</span>
      </div>`;
    list.appendChild(card);
  });
}

/* ═══════════════════════════════════════════════════════
   DONASI - QRIS ZOOM
   ═══════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════
   DOWNLOAD APP — Animation & Speed Estimate
   ═══════════════════════════════════════════════════════ */
function startDlAnim(el) {
  if (!el) return;
  el.classList.add('dl-loading');
  const icon = el.querySelector('i');
  const span = el.querySelector('span');
  const origText = span ? span.textContent : '';
  if (span) span.textContent = 'Memulai download...';
  setTimeout(() => {
    el.classList.remove('dl-loading');
    if (span) span.textContent = origText;
  }, 3000);
}

// Hitung estimasi download berdasarkan koneksi
(function estimateDlTime() {
  const sizeEl = document.getElementById('dl-file-size');
  const timeEl = document.getElementById('dl-est-time');
  if (!sizeEl || !timeEl) return;
  const conn = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
  if (conn) {
    const mbps = conn.downlink || 1;
    const fileMB = 8.5;
    const sec = Math.ceil((fileMB * 8) / mbps);
    let estText;
    if (sec < 60) estText = '~' + sec + ' detik';
    else estText = '~' + Math.ceil(sec / 60) + ' menit';
    if (timeEl) timeEl.textContent = estText;
  }
})();


/* ═══════════════════════════════════════════════════════
   PROFILE BANNER
   ═══════════════════════════════════════════════════════ */
async function loadProfileBanner() {
  const uid = document.getElementById('banner-uid')?.value?.trim();
  if (!uid) { toast('Masukkan UID dulu!', 'err'); return; }

  const result  = document.getElementById('banner-result');
  const loading = document.getElementById('banner-loading');
  const img     = document.getElementById('banner-img');
  const hint    = document.getElementById('banner-hint');

  result.classList.remove('d-none');
  loading.classList.remove('d-none');
  img.classList.add('d-none');
  hint.classList.add('d-none');

  const url = `https://ff-multipurpose-api.onrender.com/banner/profile?uid=${uid}&key=codespecter`;
  img.src = url;
  img.onload = () => {
    loading.classList.add('d-none');
    img.classList.remove('d-none');
    hint.classList.remove('d-none');
    document.getElementById('banner-zoom-img').src = url;
    toast('Banner berhasil dimuat!', 'ok');
  };
  img.onerror = () => {
    loading.classList.add('d-none');
    toast('Gagal memuat banner. Cek UID kamu!', 'err');
    result.classList.add('d-none');
  };
}
function openBannerZoom() {
  const m = document.getElementById('banner-modal');
  if (m) m.classList.add('show');
}
function closeBannerZoom() {
  const m = document.getElementById('banner-modal');
  if (m) m.classList.remove('show');
}

function openQrisZoom(){
  const m=document.getElementById('qris-modal');
  if(m)m.classList.add('show');
}
function closeQrisZoom(){
  const m=document.getElementById('qris-modal');
  if(m)m.classList.remove('show');
}

/* ═══════════════════════════════════════════════════════
   MARQUEE TICKER
   ═══════════════════════════════════════════════════════ */
function _showMarquee(text){
  const bar=document.getElementById('marquee-bar');
  const t1=document.getElementById('mq-text');
  const t2=document.getElementById('mq-text-clone');
  const track=document.getElementById('mq-track');
  if(!bar||!t1)return;
  if(!text){bar.classList.add('d-none');return;}
  t1.textContent=text+'\u2003\u2003\u2014\u2003\u2003';
  if(t2) t2.textContent=t1.textContent;
  bar.classList.remove('d-none');
  // Reset animation
  if(track){track.style.animation='none';void track.offsetWidth;track.style.animation='';}
}
async function loadMarquee(){
  const db=await _gdb();
  if(db?.marquee){ _showMarquee(db.marquee); }
}
async function saveMqText(){
  if(!_s0||_s0.role!=='admin'){toast('Akses ditolak','err');return;}
  const text=document.getElementById('mq-input')?.value?.trim();
  if(!text){toast('Teks wajib diisi','err');return;}
  const db=await _gdb(); if(!db){toast('Gagal terhubung','err');return;}
  const ok=await _sdb({...db,marquee:text});
  if(ok){toast('Marquee diaktifkan','ok','Semua user akan melihat pengumuman berjalan');_showMarquee(text);}
  else toast('Gagal menyimpan','err');
}
async function clearMqText(){
  if(!_s0||_s0.role!=='admin')return;
  const db=await _gdb(); if(!db)return;
  const {marquee,...rest}=db;
  const ok=await _sdb(rest);
  if(ok){toast('Marquee dimatikan','ok');_showMarquee(null);}
}

/* ═══════════════════════════════════════════════════════
   DISABLE COPY / CONTEXT MENU / TEXT SELECT
   (Input & Textarea tetap bebas)
   ═══════════════════════════════════════════════════════ */
const _isInput = e => ['INPUT','TEXTAREA'].includes(e.target.tagName);
document.addEventListener('contextmenu', e => { if (!_isInput(e)) e.preventDefault(); });
document.addEventListener('copy', e => { if (!_isInput(e)) e.preventDefault(); });
document.addEventListener('cut',  e => { if (!_isInput(e)) e.preventDefault(); });
document.addEventListener('selectstart', e => { if (!_isInput(e)) e.preventDefault(); });
// Disable zoom via keyboard (Ctrl+/Ctrl-)
document.addEventListener('keydown', e => {
  if (e.ctrlKey && ['+','-','=','0'].includes(e.key)) e.preventDefault();
});
// Disable pinch zoom on touch
document.addEventListener('touchstart', e => {
  if (e.touches.length > 1) e.preventDefault();
}, { passive: false });

/* ═══════════════════════════════════════════════════════
   PASTE TO INPUT
   ═══════════════════════════════════════════════════════ */
async function pasteToInput(inputId) {
  const inp = document.getElementById(inputId);
  if (!inp) return;
  try {
    const text = await navigator.clipboard.readText();
    inp.value = text.trim();
    inp.dispatchEvent(new Event('input'));
    // Visual feedback
    const btn = inp.parentElement?.querySelector('.paste-btn');
    if (btn) {
      const orig = btn.innerHTML;
      btn.classList.add('pasted');
      btn.innerHTML = '<i class="fa-solid fa-check"></i> Tersalin';
      setTimeout(() => { btn.classList.remove('pasted'); btn.innerHTML = orig; }, 1500);
    }
    toast('Teks berhasil ditempel', 'ok');
  } catch {
    // Fallback: focus input agar keyboard muncul dengan opsi paste
    inp.focus();
    inp.select();
    toast('Tekan & tahan input lalu pilih Tempel', 'info');
  }
}

/* ═══════════════════════════════════════════════════════
   KOMENTAR SYSTEM
   ═══════════════════════════════════════════════════════ */
const _MAX_COMMENTS = 200;
const _COMMENTS_PER_PAGE = 20;
let _commentPage = 0;
let _allComments = [];

function cbhCount(){
  const v = document.getElementById('cbh-input')?.value?.length || 0;
  const el = document.getElementById('cbh-char');
  if(el) el.textContent = v + '/200';
}

async function loadComments(reset=true){
  if(reset){ _commentPage = 0; _allComments = []; }
  const db = await _gdb();
  if(!db){ return; }
  _allComments = _toArr(db.comments || []).sort((a,b)=>{
    if(a.pinned && !b.pinned) return -1;
    if(!a.pinned && b.pinned) return 1;
    return b.ts - a.ts;
  });
  const countEl = document.getElementById('cbh-count');
  if(countEl) countEl.textContent = _allComments.length;
  renderComments(true);
}

function renderComments(reset=false){
  const list = document.getElementById('cbh-list');
  if(!list) return;
  if(reset){ list.innerHTML = ''; _commentPage = 0; }
  const start = _commentPage * _COMMENTS_PER_PAGE;
  const slice = _allComments.slice(start, start + _COMMENTS_PER_PAGE);
  if(reset && slice.length === 0){
    list.innerHTML = '<div class="cbh-empty"><i class="fa-regular fa-comment-dots"></i><p>Belum ada komentar. Jadilah yang pertama!</p></div>';
  }
  slice.forEach(c => {
    const isAdmin = c.role === 'admin';
    const isMe = _s0 && c.username === _s0.username;
    const canDelete = _s0 && (_s0.role === 'admin' || isMe);
    const div = document.createElement('div');
    div.className = 'cbh-item' + (c.pinned ? ' cbh-pinned' : '');
    div.id = 'cmt-' + c.id;
    div.innerHTML = `
      <div class="cbh-item-top">
        <div class="cbh-av ${isAdmin?'cbh-av-admin':''}">${(c.username||'?').slice(0,2).toUpperCase()}</div>
        <div class="cbh-item-info">
          <div class="cbh-item-name">${c.username||'User'}${isAdmin?'<span class="cbh-admin-chip"><i class="fa-solid fa-crown"></i> Admin</span>':''}</div>
          <div class="cbh-item-time">${_timeSince(new Date(c.ts).toISOString())}</div>
        </div>
        ${c.pinned?'<span class="cbh-pin-badge"><i class="fa-solid fa-thumbtack"></i></span>':''}
      </div>
      <div class="cbh-item-msg">${_escHtml(c.msg)}</div>
      ${c.replies && c.replies.length ? `<div class="cbh-replies" id="replies-${c.id}">${renderReplies(c.replies)}</div>` : `<div class="cbh-replies d-none" id="replies-${c.id}"></div>`}
      <div class="cbh-item-actions">
        <button class="cbh-like-btn ${c.likedBy && _s0 && c.likedBy.includes(_s0.username) ? 'liked':''}" onclick="likeComment('${c.id}')">
          <i class="fa-${c.likedBy && _s0 && c.likedBy.includes(_s0.username)?'solid':'regular'} fa-heart"></i> ${c.likes||0}
        </button>
        <button class="cbh-reply-btn" onclick="toggleReplyForm('${c.id}')"><i class="fa-solid fa-reply"></i> Balas</button>
        ${_s0&&_s0.role==='admin'?`<button class="cbh-pin-btn" onclick="pinComment('${c.id}',${!c.pinned})"><i class="fa-solid fa-thumbtack"></i> ${c.pinned?'Unpin':'Pin'}</button>`:''}
        ${canDelete?`<button class="cbh-del-btn" onclick="deleteComment('${c.id}')"><i class="fa-solid fa-trash"></i></button>`:''}
      </div>
      <div class="cbh-reply-form d-none" id="reply-form-${c.id}">
        <textarea class="cbh-reply-input" id="reply-input-${c.id}" placeholder="Balas komentar..." maxlength="150" rows="2"></textarea>
        <button class="cbh-send-btn" style="margin-top:6px" onclick="submitReply('${c.id}')"><i class="fa-solid fa-paper-plane"></i> Kirim</button>
      </div>`;
    list.appendChild(div);
  });
  _commentPage++;
  const loadMore = document.getElementById('cbh-load-more');
  if(loadMore){
    if(_commentPage * _COMMENTS_PER_PAGE < _allComments.length){
      loadMore.classList.remove('d-none');
    } else {
      loadMore.classList.add('d-none');
    }
  }
}

function renderReplies(replies){
  if(!replies||!replies.length) return '';
  return replies.map(r=>{
    const isAdmin = r.role==='admin';
    return `<div class="cbh-reply-item">
      <div class="cbh-av cbh-av-sm ${isAdmin?'cbh-av-admin':''}">${(r.username||'?').slice(0,2).toUpperCase()}</div>
      <div class="cbh-reply-body">
        <span class="cbh-item-name">${r.username||'User'}${isAdmin?'<span class="cbh-admin-chip"><i class="fa-solid fa-crown"></i></span>':''}</span>
        <span class="cbh-item-time"> · ${_timeSince(new Date(r.ts).toISOString())}</span>
        <div class="cbh-item-msg">${_escHtml(r.msg)}</div>
      </div>
    </div>`;
  }).join('');
}

function _escHtml(str){
  return String(str).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');
}

function loadMoreComments(){ renderComments(false); }

function toggleReplyForm(id){
  const f = document.getElementById('reply-form-'+id);
  if(f){ f.classList.toggle('d-none'); if(!f.classList.contains('d-none')) document.getElementById('reply-input-'+id)?.focus(); }
}

async function submitComment(){
  if(!_s0){ toast('Login dulu untuk komentar','err'); return; }
  const input = document.getElementById('cbh-input');
  const msg = input?.value?.trim();
  if(!msg){ toast('Komentar tidak boleh kosong','err'); return; }
  if(msg.length < 2){ toast('Komentar terlalu pendek','err'); return; }
  const db = await _gdb();
  if(!db){ toast('Gagal terhubung','err'); return; }
  const comments = _toArr(db.comments||[]);
  if(comments.length >= _MAX_COMMENTS){
    const oldest = comments.filter(c=>!c.pinned).sort((a,b)=>a.ts-b.ts);
    if(oldest.length) comments.splice(comments.indexOf(oldest[0]),1);
  }
  const newComment = {
    id: Date.now()+'_'+Math.random().toString(36).slice(2,6),
    username: _s0.username,
    role: _s0.role||'user',
    msg, ts: Date.now(), likes: 0, likedBy: [], pinned: false, replies: []
  };
  comments.push(newComment);
  const ok = await _sdb({...db, comments});
  if(ok){ input.value=''; cbhCount(); toast('Komentar terkirim!','ok'); loadComments(); }
  else { toast('Gagal kirim komentar','err'); }
}

async function submitReply(parentId){
  if(!_s0){ toast('Login dulu','err'); return; }
  const input = document.getElementById('reply-input-'+parentId);
  const msg = input?.value?.trim();
  if(!msg){ toast('Balasan kosong','err'); return; }
  const db = await _gdb();
  if(!db){ toast('Gagal terhubung','err'); return; }
  const comments = _toArr(db.comments||[]);
  const idx = comments.findIndex(c=>c.id===parentId);
  if(idx===-1){ toast('Komentar tidak ditemukan','err'); return; }
  if(!comments[idx].replies) comments[idx].replies = [];
  comments[idx].replies.push({
    id: Date.now()+'_'+Math.random().toString(36).slice(2,6),
    username: _s0.username, role: _s0.role||'user',
    msg, ts: Date.now()
  });
  const ok = await _sdb({...db, comments});
  if(ok){ input.value=''; toast('Balasan terkirim!','ok'); loadComments(); }
  else { toast('Gagal kirim balasan','err'); }
}

async function likeComment(id){
  if(!_s0){ toast('Login dulu untuk like','err'); return; }
  const db = await _gdb();
  if(!db) return;
  const comments = _toArr(db.comments||[]);
  const idx = comments.findIndex(c=>c.id===id);
  if(idx===-1) return;
  if(!comments[idx].likedBy) comments[idx].likedBy=[];
  const li = comments[idx].likedBy.indexOf(_s0.username);
  if(li===-1){ comments[idx].likedBy.push(_s0.username); comments[idx].likes=(comments[idx].likes||0)+1; }
  else { comments[idx].likedBy.splice(li,1); comments[idx].likes=Math.max(0,(comments[idx].likes||1)-1); }
  await _sdb({...db, comments});
  loadComments();
}

async function pinComment(id, pin){
  if(!_s0||_s0.role!=='admin'){ toast('Akses ditolak','err'); return; }
  const db = await _gdb();
  if(!db) return;
  const comments = _toArr(db.comments||[]);
  const idx = comments.findIndex(c=>c.id===id);
  if(idx===-1) return;
  comments[idx].pinned = pin;
  await _sdb({...db, comments});
  toast(pin?'Komentar di-pin!':'Komentar di-unpin','ok');
  loadComments();
}

async function deleteComment(id){
  if(!_s0){ toast('Login dulu','err'); return; }
  if(!await _cm('Hapus komentar ini?','trash')) return;
  const db = await _gdb();
  if(!db) return;
  let comments = _toArr(db.comments||[]);
  comments = comments.filter(c=>c.id!==id);
  await _sdb({...db, comments});
  toast('Komentar dihapus','ok');
  loadComments();
}

/* ═══════════════════════════════════════════════════════
   REFERRAL SYSTEM
   ═══════════════════════════════════════════════════════ */
const _REF_MILESTONES = [
  { count:1,  badge:'🥉', label:'Pemula',    color:'#cd7f32' },
  { count:3,  badge:'🥈', label:'Aktif',     color:'#c0c0c0' },
  { count:5,  badge:'🥇', label:'Pro',       color:'#ffd60a' },
  { count:10, badge:'💎', label:'Diamond',   color:'#4facfe' },
  { count:20, badge:'👑', label:'Legenda',   color:'#bf5af2' },
  { count:50, badge:'🔥', label:'Dewa',      color:'#ff453a' },
];

function getRefBadges(count){
  return _REF_MILESTONES.filter(m=>count>=m.count);
}

function getRefLink(){
  const base = window.location.origin + window.location.pathname;
  return base + '?ref=' + (_s0?.username||'');
}

function copyRefLink(){
  const link = getRefLink();
  navigator.clipboard?.writeText(link).then(()=>{
    toast('Link referral disalin!','ok');
  }).catch(()=>{ toast('Gagal salin, coba manual','err'); });
}

function shareRefWA(){
  const link = getRefLink();
  const text = `Cobain Website Emote FF gratis! Daftar lewat link aku ya 👇\n${link}`;
  window.open('https://wa.me/?text='+encodeURIComponent(text),'_blank');
}

function shareRefTikTok(){
  copyRefLink();
  toast('Link disalin! Paste di bio TikTok kamu 🎵','info');
}

async function loadReferralPage(){
  if(!_s0) return;
  const db = await _gdb();
  const users = _toArr(db?.users||[]);
  const me = users.find(u=>u.username===_s0.username);
  if(!me) return;
  const refCount = me.referralCount||0;
  const badges = getRefBadges(refCount);
  document.getElementById('ref-avatar').textContent = _s0.username.slice(0,2).toUpperCase();
  document.getElementById('ref-username').textContent = _s0.username;
  document.getElementById('ref-count').textContent = refCount;
  document.getElementById('ref-points').textContent = refCount * 10;
  document.getElementById('ref-badge-count').textContent = badges.length;
  // Render badges di profil
  const bw = document.getElementById('ref-badge-wrap');
  if(bw) bw.innerHTML = badges.length ? badges.map(b=>`<span class="ref-badge-chip" style="border-color:${b.color}">${b.badge} ${b.label}</span>`).join('') : '<span style="font-size:.75rem;color:var(--t3)">Belum ada badge</span>';
  // Milestone list
  const ml = document.getElementById('ref-milestone-list');
  if(ml) ml.innerHTML = _REF_MILESTONES.map(m=>{
    const done = refCount >= m.count;
    return `<div class="ref-milestone-item ${done?'ref-ms-done':''}">
      <div class="ref-ms-badge">${m.badge}</div>
      <div class="ref-ms-info"><div class="ref-ms-label">${m.label}</div><div class="ref-ms-req">${m.count} teman diajak</div></div>
      <div class="ref-ms-status">${done?'<i class="fa-solid fa-check-circle" style="color:#30d158"></i>':'<i class="fa-regular fa-circle" style="color:var(--t3)"></i>'}</div>
    </div>`;
  }).join('');
  // Link
  const li = document.getElementById('ref-link-input');
  if(li) li.value = getRefLink();
  // Leaderboard
  const sorted = users.filter(u=>u.referralCount>0).sort((a,b)=>(b.referralCount||0)-(a.referralCount||0)).slice(0,10);
  const lb = document.getElementById('ref-lb-list');
  if(lb) lb.innerHTML = sorted.length ? sorted.map((u,i)=>{
    const badges = getRefBadges(u.referralCount||0);
    const topBadge = badges.length ? badges[badges.length-1] : null;
    return `<div class="ref-lb-item">
      <div class="ref-lb-rank">${i===0?'🥇':i===1?'🥈':i===2?'🥉':'#'+(i+1)}</div>
      <div class="ref-lb-av">${u.username.slice(0,2).toUpperCase()}</div>
      <div class="ref-lb-info"><div class="ref-lb-name">${u.username}${topBadge?` <span>${topBadge.badge}</span>`:''}</div><div class="ref-lb-pts">${u.referralCount||0} referral · ${(u.referralCount||0)*10} poin</div></div>
    </div>`;
  }).join('') : '<div class="cbh-empty"><i class="fa-solid fa-trophy"></i><p>Belum ada referral</p></div>';
}

async function _checkRefParam(){
  const params = new URLSearchParams(window.location.search);
  const ref = params.get('ref');
  if(!ref || !_s0) return;
  if(ref === _s0.username) return; // tidak bisa ref diri sendiri
  const db = await _gdb();
  if(!db) return;
  const users = _toArr(db.users||[]);
  const me = users.find(u=>u.username===_s0.username);
  if(!me || me.refFrom) return; // sudah pernah pakai ref
  const refUser = users.find(u=>u.username===ref);
  if(!refUser) return;
  const meIdx = users.findIndex(u=>u.username===_s0.username);
  const refIdx = users.findIndex(u=>u.username===ref);
  users[meIdx].refFrom = ref;
  users[refIdx].referralCount = (users[refIdx].referralCount||0) + 1;
  // Cek badge baru
  const newCount = users[refIdx].referralCount;
  const newBadges = getRefBadges(newCount);
  users[refIdx].badges = newBadges.map(b=>b.label);
  await _sdb({...db, users});
  toast(`Kamu masuk lewat referral ${ref}! 🎉`,'ok');
  // Bersihkan URL
  window.history.replaceState({}, '', window.location.pathname);
}

