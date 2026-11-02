const $=id=>document.getElementById(id);
document.querySelectorAll('[data-mascot]').forEach(container=>{
  container.setAttribute('aria-hidden','true');
  const animation=lottie.loadAnimation({
    container,
    renderer:'svg',
    loop:true,
    autoplay:true,
    path:'maskot_semut.json'
  });
  animation.addEventListener('data_failed',()=>{
    console.error('Gagal memuat animasi maskot dari maskot_semut.json.');
  });
});

const S={team:'',stars:{},done:{}};
function go(id){document.querySelectorAll('.screen').forEach(s=>s.classList.toggle('on',s.id===id));window.scrollTo(0,0);
  if(id==='l1'||id==='l2')S.lvl=id; if(id==='l1')renderMissions(); if(id==='l2')renderMissions2(); if(id==='levels')renderLevels();}
function startGame(){
  const n=$('teamName').value.trim();
  if(!n){$('teamErr').textContent='Isi nama timmu dulu ya!';$('teamName').classList.remove('shake');void $('teamName').offsetWidth;$('teamName').classList.add('shake');return}
  S.team=n;$('teamErr').textContent='';go('levels');
}
$('teamName').addEventListener('keydown',e=>{if(e.key==='Enter')startGame()});
function total(){return Object.values(S.stars).reduce((a,b)=>a+b,0)}
function renderLevels(){$('welcome').textContent=`Selamat datang, ${S.team}! Ayo pilih petualanganmu hari ini.`;$('totalStars').textContent=total()}
const MISSIONS=[['m1','🎒','Misi 1: Tas Siaga Bencana',initM1],['m2','🧯','Misi 2: APAR',initM2],['q3','📍','Misi 3: Titik Kumpul',initM3],['q4','🚪','Misi 4: Jalur Evakuasi',initM4]];
function renderMissions(){
  $('msList').innerHTML='';
  MISSIONS.forEach(([k,ic,name,fn])=>{
    const b=document.createElement('button');b.className='msc'+(S.stars[k]?' done':'');
    b.innerHTML=`<span class="ic">${ic}</span><span>${name}<br><small>${S.stars[k]?'⭐'.repeat(S.stars[k]):'Belum dimainkan'}</small></span>`;
    b.onclick=fn;$('msList').appendChild(b);
  });
}
function finish(k,stars,title){
  S.stars[k]=Math.max(S.stars[k]||0,stars);
  const all=MISSIONS.some(m=>m[0]===k)&&MISSIONS.every(m=>S.stars[m[0]]);
  $('resTitle').textContent=all?`Hebat, ${S.team}! Level 1 selesai!`:title;
  $('resStars').textContent='⭐'.repeat(stars)+'☆'.repeat(3-stars);
  $('resTxt').textContent=all?`Total ${total()} bintang. Kamu siap sebelum bencana!`:'Lanjut ke misi berikutnya ya!';
  go('result');
}
const shuffle=a=>a.map(v=>[Math.random(),v]).sort((x,y)=>x[0]-y[0]).map(x=>x[1]);

/* MISI 1 */
const ITEMS=[['💧','Air Minum',1],['🍪','Makanan Tahan Lama',1],['🩹','Obat P3K',1],['🔦','Senter',1],['📣','Peluit',1],['📄','Dokumen Penting',1],['🎮','Konsol Game',0],['🧸','Boneka Besar',0],['💨','Pengering Rambut',0],['🛹','Skateboard',0],['📺','TV Mini',0],['🍦','Es Krim',0]];
const WHY={0:'Barang ini tidak dibutuhkan saat darurat dan memakan tempat.'};
let bag=new Set();
function initM1(){bag=new Set();$('m1fb').textContent='';$('m1btn').disabled=false;renderBag();go('m1')}
function renderBag(checked){
  $('items').innerHTML='';
  shuffleOnce().forEach(i=>{
    const [ic,n,ok]=ITEMS[i];const b=document.createElement('button');
    b.className='item'+(bag.has(i)?' sel':'');
    if(checked&&bag.has(i))b.className='item '+(ok?'ok':'no');
    b.innerHTML=`<b>${ic}</b>${n}`;
    b.onclick=()=>{if(checked)return;if(bag.has(i))bag.delete(i);else if(bag.size<6)bag.add(i);else{$('m1fb').textContent='Tas sudah penuh! Keluarkan satu barang dulu.';return}$('m1fb').textContent='';renderBag()};
    $('items').appendChild(b);
  });
  $('capTxt').textContent=`${bag.size} / 6 barang`;$('cap').style.width=bag.size/6*100+'%';
  $('slots').innerHTML=[...Array(6)].map((_,k)=>`<span>${[...bag][k]!==undefined?ITEMS[[...bag][k]][0]:''}</span>`).join('');
}
let order=null;function shuffleOnce(){if(!order)order=shuffle(ITEMS.map((_,i)=>i));return order}
function checkBag(){
  if(bag.size<6){$('m1fb').textContent='Isi tasmu sampai 6 barang dulu ya!';return}
  const good=[...bag].filter(i=>ITEMS[i][2]).length;
  renderBag(true);
  if(good===6){$('m1btn').disabled=true;$('m1fb').textContent='Tasmu lengkap dan siap dibawa!';setTimeout(()=>finish('m1',3,'Tas siaga selesai!'),1400)}
  else{$('m1fb').textContent=`${good} dari 6 barang sudah tepat. Barang merah tidak wajib dibawa. Coba lagi!`;
    setTimeout(()=>{[...bag].forEach(i=>{if(!ITEMS[i][2])bag.delete(i)});$('m1fb').textContent='Barang yang salah sudah dikeluarkan. Ganti dengan yang lebih penting!';renderBag()},2200)}
}

/* MISI 2: simulasi APAR interaktif (klik pin → arahkan selang → tekan tuas → sapukan air) */
const APAR_STEPS=['Tarik pin','Arahkan selang','Tekan tuas','Sapukan air'];
const FIRE_X=[470,570,665], FIRE_Y=312;        // posisi 3 api di lantai
const NOZ_AWAY={x:238,y:300,a:125};            // selang awal: salah arah, menjauhi api
const NOZ_AIM={x:350,y:262};                   // posisi selang setelah diarahkan ke api
const HOSE_START={x:156,y:150};                // titik selang keluar dari APAR
let A={}, aMiss=0, aTimer=null;                // state misi APAR

function initM2(){
  clearInterval(aTimer);aMiss=0;
  A={step:0,noz:{...NOZ_AWAY},tgt:null,cur:-1,arrived:false,spray:false,busy:false,h:[1,1,1]};
  $('aparStage').innerHTML=aparSVG();
  drawNozzle();
  updateAparUI('Langkah 1: klik pin pengaman (cincin kuning) untuk menariknya!');
  aTimer=setInterval(aparTick,100);
  go('m2');
}

/* Gambar seluruh adegan APAR dengan SVG */
function aparSVG(){
  const flame=`<g class="fscale"><g class="flick"><path d="M0 0C-30-4-36-38-12-64C-10-50-2-46 2-56C4-66 0-74 6-86C26-64 38-46 32-22C28-6 14 0 0 0Z" fill="#ff6a00"/><path d="M0 0C-16-2-18-20-6-34C-4-26 2-24 4-32C14-22 18-12 14-6C10 0 6 0 0 0Z" fill="#ffd23f"/></g></g>`;
  const fires=FIRE_X.map((x,i)=>`<g class="fire" id="fire${i}" data-part="fire" data-i="${i}" tabindex="0" role="button" aria-label="Api ${i+1}" transform="translate(${x} ${FIRE_Y})">
    ${flame}<g class="smoke"><circle cx="-10" cy="-20" r="12"/><circle cx="8" cy="-32" r="14"/><circle cx="0" cy="-48" r="10"/></g>
    <ellipse class="ring" cy="6" rx="36" ry="11"/><circle class="hit" cy="-36" r="46"/><text class="lbl" y="38"></text></g>`).join('');
  return `<svg viewBox="0 0 720 400" role="img" aria-label="Simulasi alat pemadam api ringan">
  <rect width="720" height="400" fill="#e6f5ff"/><rect y="326" width="720" height="74" fill="#bfe3a0"/><rect y="326" width="720" height="8" fill="#a5d18a"/>
  <path id="hose" fill="none" stroke="#2d2d2d" stroke-width="9" stroke-linecap="round"/>
  <rect x="90" y="175" width="80" height="160" rx="30" fill="#e53935"/><rect x="100" y="225" width="60" height="62" rx="8" fill="#fff"/>
  <text x="130" y="252" text-anchor="middle" font-family="Baloo 2,sans-serif" font-weight="800" font-size="17" fill="#e53935">APAR</text>
  <text x="130" y="276" text-anchor="middle" font-size="20">🔥</text>
  <rect x="92" y="322" width="76" height="14" rx="6" fill="#8e1b1b"/>
  <rect x="116" y="150" width="28" height="30" rx="5" fill="#444"/><rect x="104" y="138" width="52" height="16" rx="6" fill="#333"/>
  <path d="M104 142L156 134L164 140L108 150Z" fill="#222"/>
  <g id="lever" data-part="lever" tabindex="0" role="button" aria-label="Tuas pegangan"><path d="M108 126L158 118L166 124L112 134Z" fill="#666"/>
    <ellipse class="ring" cx="135" cy="128" rx="48" ry="22"/><rect class="hit" x="100" y="106" width="72" height="42"/><text class="lbl" x="140" y="96">Tekan tuas!</text></g>
  <g id="pin" data-part="pin" tabindex="0" role="button" aria-label="Pin pengaman"><line x1="108" y1="128" x2="130" y2="131" stroke="#ffc107" stroke-width="4" stroke-linecap="round"/>
    <circle cx="100" cy="128" r="10" fill="none" stroke="#ffc107" stroke-width="4"/>
    <circle class="ring" cx="104" cy="128" r="22"/><circle class="hit" cx="104" cy="128" r="26"/><text class="lbl" x="96" y="92">Tarik pin!</text></g>
  ${fires}
  <g id="sprayG" style="display:none" pointer-events="none"><path id="spray2"/><path id="spray"/></g>
  <g id="noz" data-part="nozzle" tabindex="0" role="button" aria-label="Selang APAR"><g id="nozBody"><rect x="-2" y="-8" width="30" height="16" rx="5" fill="#444"/><rect x="26" y="-5" width="10" height="10" rx="3" fill="#aaa"/></g>
    <g id="nozHot"><circle class="ring" r="30"/><circle class="hit" r="30"/><text class="lbl" y="-38">Arahkan selang</text></g></g>
  </svg>`;
}

/* Gambar ulang selang, moncong, dan semprotan air sesuai state */
function drawNozzle(){
  const {x,y,a}=A.noz, r=a*Math.PI/180;
  $('hose').setAttribute('d',`M${HOSE_START.x} ${HOSE_START.y}C${HOSE_START.x+70} ${HOSE_START.y+10} ${x-55*Math.cos(r)} ${y-55*Math.sin(r)} ${x} ${y}`);
  $('nozBody').setAttribute('transform',`translate(${x} ${y}) rotate(${a})`);
  $('nozHot').setAttribute('transform',`translate(${x+14*Math.cos(r)} ${y+14*Math.sin(r)})`);
  $('sprayG').style.display=A.spray&&A.tgt?'':'none';
  if(A.spray&&A.tgt){
    const tx=x+36*Math.cos(r),ty=y+36*Math.sin(r);
    const d=`M${tx} ${ty}Q${(tx+A.tgt.x)/2} ${Math.min(ty,A.tgt.y)-28} ${A.tgt.x} ${A.tgt.y}`;
    $('spray').setAttribute('d',d);$('spray2').setAttribute('d',d);
  }
}
function tween(ms,fn,done){const t0=performance.now();(function f(t){const k=Math.min(1,(t-t0)/ms),e=k<.5?2*k*k:1-Math.pow(-2*k+2,2)/2;fn(e);k<1?requestAnimationFrame(f):done&&done()})(t0)}

/* Arahkan moncong selang ke pangkal api ke-i */
function aimAt(i,after){
  const T={x:FIRE_X[i]-24,y:FIRE_Y-8},from={...A.noz},fromT=A.tgt?{...A.tgt}:T;
  const toA=Math.atan2(T.y-NOZ_AIM.y,T.x-NOZ_AIM.x)*180/Math.PI;
  A.cur=i;A.arrived=false;A.busy=true;
  tween(650,k=>{
    A.noz={x:from.x+(NOZ_AIM.x-from.x)*k,y:from.y+(NOZ_AIM.y-from.y)*k,a:from.a+(toA-from.a)*k};
    A.tgt={x:fromT.x+(T.x-fromT.x)*k,y:fromT.y+(T.y-fromT.y)*k};
    drawNozzle();
  },()=>{A.arrived=true;A.busy=false;after&&after()});
}

/* Penanganan klik pada bagian APAR */
function aparClick(part,i){
  if(A.busy||A.step>=4)return;
  const s=A.step;
  if(part==='pin'){
    if(s===0){$('pin').classList.add('pulled');A.step=1;updateAparUI('Pin terlepas! Langkah 2: arahkan selang ke pangkal api.')}
  }else if(part==='lever'){
    if(s===2){$('lever').classList.add('pressed');A.step=3;A.spray=true;drawNozzle();updateAparUI('Air keluar! Langkah 4: sapukan air ke semua api sampai padam.')}
    else if(s===0)aparMiss('Tarik pin pengaman dulu, tuasnya masih terkunci!');
    else if(s===1)aparMiss('Arahkan selang ke api dulu, baru tekan tuas.');
  }else{ // selang atau api
    if(s===1)aimAt(part==='fire'?i:0,()=>{A.step=2;updateAparUI('Selang sudah mengarah ke api. Langkah 3: tekan tuas pegangan!')});
    else if(s===3&&part==='fire'&&A.h[i]>0)aimAt(i);
    else if(s===0)aparMiss('Tarik pin pengaman dulu sebelum yang lain ya!');
    else if(s===2)aparMiss('Tekan tuas pegangan supaya air keluar.');
  }
}
function aparMiss(msg){aMiss++;$('aparFb').textContent=msg;const s=$('aparStage');s.classList.remove('shake');void s.offsetWidth;s.classList.add('shake')}

/* Perbarui daftar langkah, petunjuk bercahaya, dan teks umpan balik */
function updateAparUI(msg){
  if(msg)$('aparFb').textContent=msg;
  const s=A.step;
  $('aparDone').innerHTML=APAR_STEPS.map((t,i)=>`<span class="step ${i<s?'':i===s?'now':'wait'}">${i<s?'✅':(i+1)+'.'} ${t}</span>`).join('');
  const hint=(id,v)=>$(id).classList.toggle('hint',v);
  hint('pin',s===0);hint('noz',s===1);hint('lever',s===2);
  A.h.forEach((h,i)=>{hint('fire'+i,h>0&&((s===1&&i===0)||s===3));$('fire'+i).querySelector('.lbl').textContent=s===1?'Arahkan ke sini':'Sapukan!'});
}

/* Setiap 0,1 detik: air memadamkan api yang sedang disemprot */
function aparTick(){
  if(!$('m2').classList.contains('on')){clearInterval(aTimer);return}
  if(A.step!==3||!A.spray||!A.arrived||A.cur<0||A.h[A.cur]<=0)return;
  const i=A.cur;A.h[i]=Math.max(0,A.h[i]-0.045);
  const f=$('fire'+i);f.querySelector('.fscale').style.transform=`scale(${Math.max(A.h[i],.03)})`;
  if(A.h[i]>0)return;
  f.classList.add('out');
  if(A.h.every(v=>v<=0)){
    A.step=4;A.spray=false;drawNozzle();clearInterval(aTimer);
    updateAparUI('Semua api padam! Hebat, kamu hafal urutannya!');
    setTimeout(()=>finish('m2',aMiss===0?3:aMiss<3?2:1,'APAR selesai!'),1800);
  }else updateAparUI('Satu api padam! Sapukan air ke api yang masih menyala.');
}

/* Delegasi klik dan keyboard (Enter/Spasi) untuk adegan APAR */
document.addEventListener('click',e=>{const p=e.target.closest('#aparStage [data-part]');if(p)aparClick(p.dataset.part,+p.dataset.i)});
document.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const p=e.target.closest&&e.target.closest('#aparStage [data-part]');if(p){e.preventDefault();aparClick(p.dataset.part,+p.dataset.i)}});

/* MISI 3: Titik Kumpul – seret papan "Titik Kumpul" ke peta.
   Setiap ZONE adalah area pemicu (trigger) di atas peta; koordinat dalam persen terhadap gambar peta.
   Kalau nanti pakai gambar peta sendiri, cukup sesuaikan x/y/w/h tiap zona.
   Ubah MAP_DEBUG jadi true untuk melihat kotak zona saat menyesuaikan. */
const MAP_DEBUG=false;
const ZONES=[
  {name:'Gedung Sekolah',x:4,y:6,w:30,h:36,msg:'Jangan kembali ke dalam gedung! Bangunan bisa rusak saat bencana.'},
  {name:'Parkiran',x:4,y:58,w:30,h:34,msg:'Parkiran dekat bangunan dan penuh kendaraan, bisa menghalangi jalur evakuasi.'},
  {name:'Pohon & Tiang Listrik',x:62,y:6,w:32,h:30,msg:'Pohon besar dan tiang listrik bisa tumbang. Jauhi ya!'},
  {name:'Jalan Raya',x:36,y:6,w:11,h:86,msg:'Jalan raya dipakai kendaraan dan petugas darurat, bukan tempat berkumpul.'},
  {name:'Lapangan Terbuka',x:50,y:42,w:44,h:50,ok:true,msg:'Tepat! Lapangan terbuka jauh dari gedung, pohon, dan tiang listrik, jadi aman untuk berkumpul dan dihitung petugas.'}
];
let M3={miss:0,busy:false,done:false,sel:false,pos:{x:0,y:0}};
let m3Drag=null;
const sign=$('sign');

function initM3(){
  M3={miss:0,busy:false,done:false,sel:false,pos:{x:0,y:0}};
  $('mapZones').innerHTML=ZONES.map((z,i)=>`<button class="zone" data-z="${i}" style="left:${z.x}%;top:${z.y}%;width:${z.w}%;height:${z.h}%" aria-label="${z.name}"><span class="zl">${z.name}</span></button>`).join('');
  $('mapBox').classList.toggle('debug',MAP_DEBUG);
  sign.className='sign';sign.style.transform='';
  $('m3fb').textContent='Seret papan hijau "Titik Kumpul" ke tempat yang paling aman di peta.';
  go('m3');
}
const zoneEls=()=>document.querySelectorAll('#mapZones .zone');
function setSignPos(){sign.style.transform=`translate(${M3.pos.x}px,${M3.pos.y}px)${sign.classList.contains('drag')?' scale(1.08)':''}`}
/* Cari zona di bawah titik (x,y) layar; -1 jika di luar semua zona */
function zoneAt(x,y){let f=-1;zoneEls().forEach((el,i)=>{const r=el.getBoundingClientRect();if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom)f=i});return f}
/* Papan kembali ke tempat semula */
function returnSign(){M3.busy=true;sign.classList.remove('drag');sign.classList.add('anim');M3.pos={x:0,y:0};setSignPos();setTimeout(()=>{M3.busy=false},450)}
/* Papan dilepas di zona i (-1 = di luar zona) */
function dropSign(i,fromTap){
  if(M3.busy||M3.done)return;
  M3.sel=false;sign.classList.remove('sel');
  if(i<0){$('m3fb').textContent='Letakkan papan di salah satu lokasi pada peta ya!';return returnSign()}
  const z=ZONES[i],el=zoneEls()[i];
  const toCenter=()=>{const r=el.getBoundingClientRect(),s=sign.getBoundingClientRect();
    M3.pos={x:M3.pos.x+(r.left+r.width/2-(s.left+s.width/2)),y:M3.pos.y+(r.top+r.height/2-(s.top+s.height/2))};
    sign.classList.remove('drag');sign.classList.add('anim');setSignPos()};
  if(z.ok){ // benar: papan menempel di peta, misi berhasil
    M3.busy=M3.done=true;toCenter();sign.classList.add('placed');el.classList.add('good');$('m3fb').textContent=z.msg;
    setTimeout(()=>finish('q3',M3.miss===0?3:M3.miss<3?2:1,'Titik kumpul selesai!'),2400);return;
  }
  M3.miss++;M3.busy=true; // salah: zona menyala merah, papan balik ke tempat semula
  if(fromTap)toCenter();
  setTimeout(()=>{el.classList.add('bad');$('m3fb').textContent=z.msg+' Papan kembali, coba lagi!';setTimeout(()=>el.classList.remove('bad'),700);returnSign()},fromTap?450:0);
}
/* Drag dengan pointer (mouse & sentuh) */
sign.addEventListener('pointerdown',e=>{
  if(M3.busy||M3.done)return;
  sign.setPointerCapture(e.pointerId);sign.classList.remove('anim');
  m3Drag={sx:e.clientX,sy:e.clientY,bx:M3.pos.x,by:M3.pos.y,moved:false};
});
sign.addEventListener('pointermove',e=>{
  if(!m3Drag)return;
  const dx=e.clientX-m3Drag.sx,dy=e.clientY-m3Drag.sy;
  if(Math.abs(dx)+Math.abs(dy)>6)m3Drag.moved=true;
  if(!m3Drag.moved)return;
  sign.classList.add('drag');M3.pos={x:m3Drag.bx+dx,y:m3Drag.by+dy};setSignPos();
  const z=zoneAt(e.clientX,e.clientY);zoneEls().forEach((el,i)=>el.classList.toggle('over',i===z));
});
sign.addEventListener('pointerup',e=>{
  if(!m3Drag)return;const st=m3Drag;m3Drag=null;zoneEls().forEach(el=>el.classList.remove('over'));
  if(!st.moved){sign.classList.remove('drag');toggleSel();return} // hanya tap: pilih/batal pilih papan
  dropSign(zoneAt(e.clientX,e.clientY),false);
});
sign.addEventListener('pointercancel',()=>{if(m3Drag){m3Drag=null;returnSign()}});
/* Alternatif tanpa drag: tap/Enter pada papan lalu tap/Enter pada lokasi */
function toggleSel(){if(M3.busy||M3.done)return;M3.sel=!M3.sel;sign.classList.toggle('sel',M3.sel);$('m3fb').textContent=M3.sel?'Papan dipilih. Sekarang tap lokasi di peta.':'Seret papan hijau "Titik Kumpul" ke tempat yang paling aman di peta.'}
sign.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();toggleSel()}});
document.addEventListener('click',e=>{
  const z=e.target.closest('#mapZones .zone');if(!z||M3.busy||M3.done)return;
  if(M3.sel)dropSign(+z.dataset.z,true);else $('m3fb').textContent='Ambil papan Titik Kumpul dulu, lalu seret ke peta.';
});

/* MISI 4: Jalur Evakuasi – bantu orang keluar dari gedung lewat 5 pilihan.
   Jawaban salah: orang diam di tempat. Jawaban benar: orang berjalan ke titik berikutnya (go). */
const ESC_START={x:200,y:240};
const ESC=[
 {q:'Alarm berbunyi keras! Kamu masih di dalam ruangan. Apa yang kamu lakukan?',
  go:[{x:400,y:240}],o:[
  ['🎒','Ambil tas dan barang-barangku dulu',0,'Jangan buang waktu! Barang bisa dicari nanti, selamatkan dirimu dulu.'],
  ['🚪','Segera keluar lewat pintu',1,'Betul! Saat alarm berbunyi, langsung keluar ruangan.'],
  ['🪑','Sembunyi di bawah meja',0,'Sembunyi membuatmu terjebak. Alarm kebakaran artinya harus keluar gedung.']]},
 {q:'Kamu sudah di koridor. Ke mana arah yang benar?',
  go:[{x:490,y:240}],o:[
  ['🟩','Ikuti tanda EXIT hijau',1,'Tanda EXIT hijau menunjukkan jalur evakuasi menuju tempat aman.'],
  ['🌑','Masuk lorong gelap tanpa tanda',0,'Lorong tanpa tanda bisa buntu. Ikuti tanda evakuasi saja.'],
  ['🔙','Kembali ke ruangan',0,'Kembali ke ruangan membuatmu makin jauh dari pintu keluar.']]},
 {q:'Ada asap tebal di depan! Bagaimana caranya lewat?',
  go:[{x:680,y:240}],o:[
  ['🏃','Berlari tegak secepat mungkin',0,'Asap naik ke atas. Kalau berdiri tegak, kamu menghirup lebih banyak asap.'],
  ['🧎','Merunduk dan tutup hidung dengan kain',1,'Pintar! Udara dekat lantai lebih bersih, jadi merunduklah.'],
  ['✋','Berhenti dan menunggu di tempat',0,'Menunggu di tengah asap berbahaya. Terus bergerak ke arah EXIT.']]},
 {q:'Kamu sampai di depan lift dan tangga darurat. Pilih yang mana?',
  go:[{x:800,y:240},{x:944,y:456},{x:700,y:456}],o:[
  ['🛗','Naik lift supaya cepat',0,'Lift bisa mati listrik dan membuatmu terjebak. Jangan pakai lift saat darurat.'],
  ['🪜','Turun lewat tangga darurat',1,'Tepat! Tangga darurat dibuat khusus untuk evakuasi. Turun dengan tertib, jangan berlari.'],
  ['🪟','Keluar lewat jendela',0,'Melompat dari jendela sangat berbahaya.']]},
 {q:'Kamu sudah di lantai bawah. Apa langkah berikutnya?',
  go:[{x:165,y:456},{x:95,y:456}],o:[
  ['📱','Naik lagi untuk mengambil HP yang ketinggalan',0,'Jangan kembali masuk gedung untuk mengambil barang!'],
  ['🧍','Berdiri diam di tengah lobi',0,'Berhenti di lobi bisa menghalangi orang lain yang juga keluar.'],
  ['🏁','Keluar gedung menuju titik kumpul',1,'Hebat! Kamu keluar dan menuju titik kumpul.']]}
];
let E={i:0,pos:{...ESC_START},dir:1,crouch:false,busy:false,miss:0};
const sleep=ms=>new Promise(r=>setTimeout(r,ms));

function initM4(){
  E={i:0,pos:{...ESC_START},dir:1,crouch:false,busy:false,miss:0};
  placePerson();$('person').classList.remove('walking');showEsc();go('m4');
}
/* Letakkan orang di posisi E.pos (kaki di titik pos), hadap kiri/kanan, jongkok bila merunduk */
function placePerson(){
  $('person').setAttribute('transform',`translate(${E.pos.x} ${E.pos.y})`);
  $('pFlip').setAttribute('transform',`scale(${E.dir} ${E.crouch?.68:1})`);
}
/* Orang berjalan melewati titik-titik pts satu per satu */
function walk(pts,crouch){
  return new Promise(res=>{
    let i=0;E.crouch=!!crouch;$('person').classList.add('walking');
    const next=()=>{
      if(i>=pts.length){E.crouch=false;placePerson();$('person').classList.remove('walking');return res()}
      const a={...E.pos},b=pts[i++],ms=Math.max(Math.hypot(b.x-a.x,b.y-a.y)/0.22,1);
      if(Math.abs(b.x-a.x)>2)E.dir=b.x>a.x?1:-1;
      const t0=performance.now();
      (function f(t){const k=Math.min(1,(t-t0)/ms);E.pos={x:a.x+(b.x-a.x)*k,y:a.y+(b.y-a.y)*k};placePerson();k<1?requestAnimationFrame(f):next()})(t0);
    };next();
  });
}
function showEsc(){
  const s=ESC[E.i];$('escQ').textContent=s.q;$('escFb').textContent='';$('pBub').textContent='❓';
  $('escSteps').innerHTML=ESC.map((_,k)=>`<span class="step ${k<E.i?'':k===E.i?'now':'wait'}">${k<E.i?'✅':(k+1)+'.'} Pilihan ${k+1}</span>`).join('');
  $('escOpts').innerHTML='';
  shuffle(s.o).forEach(([ic,t,ok,why])=>{
    const b=document.createElement('button');b.className='ch';b.innerHTML=`<b>${ic}</b>${t}`;
    b.onclick=()=>pickEsc(b,ok,why);$('escOpts').appendChild(b);
  });
}
async function pickEsc(b,ok,why){
  if(E.busy)return;
  $('escFb').textContent=why;
  if(!ok){ // salah: orang tidak jalan, hanya menggeleng
    E.miss++;b.classList.add('no');b.disabled=true;$('pBub').textContent='❌';
    const p=$('pShake');p.classList.remove('shake');void p.getBoundingClientRect();p.classList.add('shake');return;
  }
  E.busy=true;b.classList.add('ok');$('escOpts').querySelectorAll('.ch').forEach(x=>x.disabled=true);$('pBub').textContent='✅';
  await sleep(1100);$('pBub').textContent='';
  await walk(ESC[E.i].go,E.i===2); // pilihan ke-3 (asap): berjalan merunduk
  E.i++;
  if(E.i>=ESC.length){
    $('escFb').textContent='Selamat! Kamu keluar gedung dengan selamat dan sampai di titik kumpul!';$('pBub').textContent='🎉';
    $('escSteps').innerHTML=ESC.map((_,k)=>`<span class="step">✅ Pilihan ${k+1}</span>`).join('');
    await sleep(2200);finish('q4',E.miss===0?3:E.miss<4?2:1,'Jalur evakuasi selesai!');return;
  }
  E.busy=false;showEsc();
}

/* ===== LEVEL 2: daftar misi ===== */
const MISSIONS2=[['m5','🌊','Misi 5: Banjir',initM5],['m6','⛰️','Misi 6: Tanah Longsor',initM6],['m7','🏠','Misi 7: Gempa Bumi',initM7],['x8','🔒','Misi 8',null],['m9','🌪️','Misi 9: Angin Puting Beliung',initM9],['x10','☎️','Misi 10: Nomor Darurat 112',null]];
function renderMissions2(){
  $('msList2').innerHTML='';
  MISSIONS2.forEach(([k,ic,name,fn])=>{
    const b=document.createElement('button');b.className='msc'+(S.stars[k]?' done':'');b.disabled=!fn;
    b.innerHTML=`<span class="ic">${ic}</span><span>${name}<br><small>${!fn?'Segera hadir':S.stars[k]?'⭐'.repeat(S.stars[k]):'Belum dimainkan'}</small></span>`;
    if(fn)b.onclick=fn;$('msList2').appendChild(b);
  });
}

/* ===== MISI 5: BANJIR =====
   Kenali tiga jenis banjir lewat kuis acak, lalu pilih tindakan aman. */
const FLOOD_TYPES=[
 {id:'genangan',ic:'💧',name:'Banjir genangan',description:'Air hujan mengumpul di permukaan, misalnya karena saluran air tidak lancar.'},
 {id:'rob',ic:'🌊',name:'Banjir rob',description:'Air laut pasang meluap dan menggenangi wilayah pesisir.'},
 {id:'bandang',ic:'⛰️',name:'Banjir bandang',description:'Air datang tiba-tiba dengan arus deras, kadang membawa lumpur, batu, atau kayu.'}
];
const FLOOD_QUIZ=[
 {q:'Hujan membuat air mengumpul di jalan karena saluran air tidak lancar. Jenis banjir apa ini?',answer:'genangan'},
 {q:'Air laut pasang meluap hingga menggenangi kampung di dekat pantai. Jenis banjir apa ini?',answer:'rob'},
 {q:'Air datang tiba-tiba dengan arus sangat deras dan membawa lumpur serta kayu. Jenis banjir apa ini?',answer:'bandang'},
 {q:'Setelah hujan, air tertahan dan menutup permukaan jalan di daerah rendah. Ini banjir apa?',answer:'genangan'},
 {q:'Permukiman pesisir tergenang saat permukaan air laut sedang pasang. Ini banjir apa?',answer:'rob'},
 {q:'Dari hulu, air meluncur deras secara tiba-tiba menuju permukiman. Ini banjir apa?',answer:'bandang'}
];
const FCARDS=[
 {ic:'📻',t:'Dengarkan informasi resmi BNPB/BPBD dan ikuti arahan orang dewasa atau petugas.',ok:'yes',fx:'radio',why:'Informasi resmi membantu keluarga mengetahui keadaan dan arahan evakuasi.'},
 {ic:'🚶',t:'Jika diminta mengungsi, pergi bersama orang dewasa ke tempat tinggi atau posko lewat rute aman.',ok:'yes',fx:'up',why:'Mengungsi lebih awal ke tempat aman membantu menghindari air yang terus naik.'},
 {ic:'🔌',t:'Minta orang dewasa mematikan listrik jika masih aman dilakukan sebelum air masuk.',ok:'yes',fx:'power',why:'Listrik hanya boleh dimatikan orang dewasa dan hanya jika aman; jangan menyentuh alat yang basah.'},
 {ic:'🎒',t:'Bawa tas siaga jika sudah dekat dan bisa diambil tanpa menunda evakuasi.',ok:'yes',why:'Keselamatan lebih penting daripada barang. Jangan kembali mengambil barang.'},
 {ic:'🛟',t:'Tetap bersama orang dewasa di tempat aman dan tunggu arahan petugas.',ok:'yes',why:'Jangan pergi sendiri atau kembali ke daerah banjir sebelum dinyatakan aman.'},
 {ic:'🏊',t:'Berenang, bermain, atau minum air banjir.',ok:'no',why:'Air banjir dapat kotor, berarus, dan menyembunyikan lubang atau benda berbahaya.'},
 {ic:'🚗',t:'Berjalan atau berkendara menerobos air dan arus banjir.',ok:'no',why:'Arus banjir dapat menyeret orang dan kendaraan. Gunakan rute aman yang diarahkan petugas.'},
 {ic:'⚡',t:'Mendekati kabel jatuh atau menyentuh alat listrik yang basah.',ok:'no',why:'Jauhi area itu dan segera beri tahu orang dewasa atau petugas.'},
 {ic:'📦',t:'Menunda mengungsi atau kembali demi menyelamatkan barang.',ok:'no',why:'Jangan mempertaruhkan keselamatan untuk barang; ikuti arahan evakuasi.'}
];
let F={},floodRun=0;
/* Garis air bergelombang pada ketinggian y */
function wavePath(y){let d=`M-100 ${y}Q-50 ${y-9} 0 ${y}`;for(let i=1;i<=10;i++)d+=`T${i*100} ${y}`;return d+'V500H-100Z'}
function setWater(y){$('fw2').setAttribute('d',wavePath(y))}
function fSteps(){$('fSteps').innerHTML=['Kenali jenis banjir','Pilih tindakan aman'].map((t,i)=>{const cur=F.phase>=2?1:0;return `<span class="step ${i<cur?'':i===cur?'now':'wait'}">${i<cur?'✅':(i+1)+'.'} ${t}</span>`}).join('')}

function initM5(){
  F={run:++floodRun,phase:1,quiz:shuffle(FLOOD_QUIZ),qi:0,ci:0,miss:0,busy:false,pos:{x:0,y:0},drag:null,wy:236};
  ['fam','boat','lamp','notes'].forEach(id=>{const e=$(id);e.classList.remove('up');e.style.opacity=''});
  $('notes').style.display='none';$('boat').setAttribute('x',900);
  $('fPh1').style.display='';$('fPh2').style.display='none';
  $('fCount').textContent=`Pertanyaan 1 / ${F.quiz.length}`;$('fInfo').className='note';$('fInfo').textContent='Urutan pertanyaan diacak setiap kali bermain.';
  $('fQ').innerHTML='Kenali tiga jenis banjir, lalu jawab pertanyaan yang muncul!';
  fSteps();showFloodQuestion();go('m5');
}
function showFloodQuestion(){
  const q=F.quiz[F.qi],opts=shuffle(FLOOD_TYPES),box=$('fQuizOpts');
  $('fCount').textContent=`Pertanyaan ${F.qi+1} / ${F.quiz.length}`;
  $('fQuizQ').textContent=q.q;box.innerHTML='';
  opts.forEach(type=>{
    const b=document.createElement('button');b.className='floodTypeOption';b.type='button';
    b.textContent=`${type.ic} ${type.name}`;b.onclick=()=>answerFlood(type.id,b);box.appendChild(b);
  });
}
function answerFlood(answer,button){
  if(F.phase!==1||F.busy)return;
  const q=F.quiz[F.qi],type=FLOOD_TYPES.find(item=>item.id===q.answer);
  if(answer!==q.answer){
    F.miss++;$('fInfo').className='note bad';$('fInfo').textContent=`Belum tepat. ${type.description} Coba pilih lagi.`;
    button.classList.add('wrong');return;
  }
  F.busy=true;document.querySelectorAll('#fQuizOpts button').forEach(b=>b.disabled=true);
  button.classList.add('correct');$('fInfo').className='note good';$('fInfo').textContent=`Betul! ${type.description}`;
  const run=F.run;
  setTimeout(()=>{
    if(F.run!==run||F.phase!==1)return;
    F.qi++;F.busy=false;
    if(F.qi>=F.quiz.length)startFlood2();
    else showFloodQuestion();
  },1100);
}

/* TAHAP 2: pilih tindakan yang aman saat banjir */
function startFlood2(){
  F.phase=2;$('fPh1').style.display='none';$('fPh2').style.display='';fSteps();
  $('fQ').innerHTML='Saat banjir, pilih tindakan yang <em>aman</em> dan yang harus <em>dihindari</em>!';
  setWater(236);showCard();
}
function showCard(){
  const c=FCARDS[F.ci],s=$('sCard');
  s.className='scard in';s.style.transform='';s.style.opacity='';F.pos={x:0,y:0};F.busy=false;
  s.innerHTML=`<b>${c.ic}</b><span>${c.t}</span>`;
  $('fProg').textContent=`Kartu ${F.ci+1} / ${FCARDS.length}`;
  $('sFb').textContent='Seret kartu ke LAKUKAN atau JANGAN (atau ketuk salah satunya).';
}
function bucketAt(x,y){for(const [id,k] of [['bYes','yes'],['bNo','no']]){const r=$(id).getBoundingClientRect();if(x>=r.left&&x<=r.right&&y>=r.top&&y<=r.bottom)return k}return null}
function sortCard(choice){
  if(F.busy||F.phase!==2)return;
  const c=FCARDS[F.ci],s=$('sCard'),bk=$(choice==='yes'?'bYes':'bNo');F.busy=true;
  if(c.ok!==choice){ // salah: kartu kembali, ember bergetar
    F.miss++;$('sFb').textContent='Belum tepat. '+c.why;bk.classList.add('bad');
    s.classList.add('anim');F.pos={x:0,y:0};s.style.transform='';
    setTimeout(()=>{bk.classList.remove('bad');F.busy=false},450);return;
  }
  const r=s.getBoundingClientRect(),b=bk.getBoundingClientRect(); // benar: kartu masuk ke ember
  F.pos={x:F.pos.x+(b.left+b.width/2-(r.left+r.width/2)),y:F.pos.y+(b.top+b.height/2-(r.top+r.height/2))};
  s.classList.add('anim');s.style.transform=`translate(${F.pos.x}px,${F.pos.y}px) scale(.25)`;s.style.opacity='0';
  $('sFb').textContent=(c.ok==='yes'?'Betul! ':'Tepat, jangan lakukan itu. ')+c.why;
  if(c.fx==='power')$('lamp').style.opacity='.2';
  if(c.fx==='up')$('fam').classList.add('up');
  if(c.fx==='radio')$('notes').style.display='';
  const y0=F.wy,y1=236-(F.ci+1)*11;F.wy=y1;tween(800,e=>setWater(y0+(y1-y0)*e)); // air naik
  F.ci++;
  const run=F.run;
  setTimeout(()=>{if(F.run!==run||F.phase!==2)return;F.ci>=FCARDS.length?endFlood():showCard()},1700);
}
async function endFlood(){
  const run=F.run;
  $('sCard').style.visibility='hidden';
  $('sFb').textContent='Hebat! Kamu tahu cara mengenali banjir dan memilih langkah aman bersama orang dewasa 🎉';
  tween(2200,e=>$('boat').setAttribute('x',900-300*e));
  await sleep(2400);
  if(F.run===run)finish('m5',F.miss===0?3:F.miss<3?2:1,'Misi Banjir selesai!');
}
/* Seret kartu dengan pointer (mouse & sentuh) */
const sCard=$('sCard');
sCard.addEventListener('pointerdown',e=>{if(F.busy||F.phase!==2)return;sCard.setPointerCapture(e.pointerId);sCard.classList.remove('anim');F.drag={sx:e.clientX,sy:e.clientY,bx:F.pos.x,by:F.pos.y,m:false}});
sCard.addEventListener('pointermove',e=>{
  const d=F.drag;if(!d)return;const dx=e.clientX-d.sx,dy=e.clientY-d.sy;
  if(Math.abs(dx)+Math.abs(dy)>6)d.m=true;if(!d.m)return;
  F.pos={x:d.bx+dx,y:d.by+dy};sCard.style.transform=`translate(${F.pos.x}px,${F.pos.y}px) rotate(${dx/30}deg)`;
  const b=bucketAt(e.clientX,e.clientY);$('bYes').classList.toggle('over',b==='yes');$('bNo').classList.toggle('over',b==='no');
});
const dropCard=e=>{
  const d=F.drag;if(!d)return;F.drag=null;$('bYes').classList.remove('over');$('bNo').classList.remove('over');if(!d.m)return;
  const b=e.type==='pointerup'?bucketAt(e.clientX,e.clientY):null;
  if(b)sortCard(b);else{sCard.classList.add('anim');F.pos={x:0,y:0};sCard.style.transform=''}
};
sCard.addEventListener('pointerup',dropCard);sCard.addEventListener('pointercancel',dropCard);
$('bYes').onclick=()=>sortCard('yes');$('bNo').onclick=()=>sortCard('no');

/* ===== BONUS: JAGA BUMI (perubahan iklim dengan bola dunia) ===== */
const RAD=Math.PI/180;
/* Daratan disederhanakan: daftar [bujur, lintang] */
const LAND=[
[[-168,66],[-140,70],[-95,72],[-80,62],[-60,50],[-70,42],[-81,25],[-97,18],[-83,9],[-105,20],[-118,32],[-125,48],[-140,60]],
[[-80,8],[-60,10],[-35,-6],[-40,-22],[-58,-38],[-68,-54],[-75,-45],[-71,-20],[-81,-5]],
[[-10,36],[-9,43],[0,50],[10,56],[30,70],[70,73],[110,77],[140,72],[180,68],[165,60],[140,50],[122,30],[110,18],[105,8],[95,18],[80,8],[72,20],[58,25],[45,15],[35,30],[28,41],[10,44],[-5,36]],
[[-17,21],[-6,36],[10,37],[32,31],[43,12],[51,11],[40,-15],[33,-27],[20,-35],[12,-17],[9,4],[-8,5],[-17,14]],
[[114,-22],[130,-12],[142,-11],[153,-27],[146,-39],[130,-32],[115,-34]],
[[95,5],[98,3],[106,-6],[103,-5]],[[109,1],[117,7],[118,0],[114,-4],[110,-3]],[[105,-6],[114,-8],[106,-7]],[[131,-1],[141,-3],[150,-10],[138,-8]],
[[-55,60],[-20,70],[-20,82],[-60,80]],
[[-180,-72],[-120,-72],[-60,-72],[0,-72],[60,-72],[120,-72],[180,-72],[180,-90],[-180,-90]]];
const dens=p=>p.flatMap((a,i)=>{const b=p[(i+1)%p.length],n=Math.max(1,Math.ceil(Math.max(Math.abs(b[0]-a[0]),Math.abs(b[1]-a[1]))/6));return [...Array(n)].map((_,k)=>[a[0]+(b[0]-a[0])*k/n,a[1]+(b[1]-a[1])*k/n])});
const LANDD=LAND.map(dens);
/* 10 pertanyaan, masing-masing 2 pilihan: a = benar, b = salah (posisi tombol diacak saat tampil) */
const QS=[
{ic:'💡',lo:-40,la:72,q:'Es di Kutub mencair karena Bumi makin panas. Apa yang bisa kamu lakukan di rumah?',a:'Mematikan lampu saat tidak dipakai',b:'Menyalakan semua lampu seharian',w:'Hemat listrik mengurangi gas pemanas Bumi.'},
{ic:'🌊',lo:107,la:-6,q:'Air laut naik dan masuk ke pesisir Jakarta. Apa yang melindungi pantai?',a:'Menanam pohon mangrove',b:'Menebang mangrove untuk tambak',w:'Akar mangrove menahan ombak dan mencegah pantai terkikis.'},
{ic:'🔥',lo:-62,la:-5,q:'Hutan Amazon terbakar. Apa yang sebaiknya dilakukan pada hutan?',a:'Menjaga hutan dan menanam pohon',b:'Membakar hutan untuk membuka lahan',w:'Pohon menyerap karbon dioksida penyebab Bumi panas.'},
{ic:'🏜️',lo:10,la:14,q:'Di Afrika banyak sumur kering. Bagaimana caramu hemat air?',a:'Menutup keran saat menyikat gigi',b:'Membiarkan keran menyala terus',w:'Air bersih itu terbatas, jadi harus dihemat.'},
{ic:'🪸',lo:150,la:-18,q:'Terumbu karang memutih karena laut terlalu hangat dan tercemar. Pilih yang benar!',a:'Mengurangi plastik sekali pakai',b:'Membuang plastik ke laut',w:'Lebih sedikit plastik berarti laut lebih sehat.'},
{ic:'🌀',lo:135,la:15,q:'Badai makin kuat karena laut hangat. Apa yang mengurangi gas pemanas Bumi?',a:'Naik sepeda atau angkutan umum',b:'Naik mobil pribadi untuk jarak dekat',w:'Kendaraan umum dan sepeda lebih sedikit asapnya.'},
{ic:'🍎',lo:10,la:48,q:'Sisa makanan di tempat sampah menghasilkan gas pemanas. Mana yang benar?',a:'Menghabiskan makanan dan membuat kompos',b:'Membuang makanan yang masih layak',w:'Makanan yang dihabiskan tidak jadi sampah penghasil gas.'},
{ic:'☀️',lo:78,la:22,q:'Listrik dari mana yang lebih baik untuk Bumi?',a:'Tenaga surya dan angin',b:'Membakar lebih banyak batu bara',w:'Energi surya dan angin bersih dan tidak habis.'},
{ic:'🏕️',lo:135,la:-28,q:'Hutan di Australia sangat kering dan mudah terbakar. Saat berkemah, kamu harus...',a:'Memastikan api unggun benar-benar padam',b:'Meninggalkan api unggun yang masih menyala',w:'Api kecil bisa menjadi kebakaran hutan besar.'},
{ic:'🛍️',lo:114,la:0,q:'Plastik sekali pakai menumpuk di Kalimantan dan seluruh dunia. Apa yang kamu bawa saat belanja?',a:'Tas belanja sendiri yang bisa dipakai ulang',b:'Kantong plastik baru setiap belanja',w:'Tas pakai ulang mengurangi sampah plastik.'}];
const CR=[...Array(10)].map((_,k)=>{let lo=k*37-170,la=((k*53)%120)-60,a=k*1.7,p=[];for(let s=0;s<14;s++){p.push([lo,la]);a+=Math.sin(k*7+s*2.3)*.9;lo+=Math.cos(a)*7;la=Math.max(-80,Math.min(80,la+Math.sin(a)*7))}return p});
const CL=[[-100,40],[20,30],[100,45],[-40,-30],[150,-15],[60,-40]];
const IG={lo:100,la:10,tl:null,drag:null,h:5,d:.5,i:0,right:0,raf:0,t:0,t0:0,cx:0,cy:0,r:0,k:1,boost:0,shake:0,flash:0,hit:0,heal:0,rings:[]};
const igCv=$('ig'),igX=igCv.getContext('2d'),igSt=$('igStage'),RM=matchMedia('(prefers-reduced-motion:reduce)').matches;
const mix=(a,b,t)=>`rgb(${a.map((v,i)=>Math.round(v+(b[i]-v)*t))})`;
function igProj(lo,la){const l=(lo-IG.lo)*RAD,p=la*RAD,p0=IG.la*RAD,cp=Math.cos(p);
  return [cp*Math.sin(l),Math.cos(p0)*Math.sin(p)-Math.sin(p0)*cp*Math.cos(l),Math.sin(p0)*Math.sin(p)+Math.cos(p0)*cp*Math.cos(l)]}
/* Gambar garis (bujur tetap atau lintang tetap, atau retakan) hanya pada sisi bola yang terlihat */
function igPath(pts,r,cx,cy){const x=igX;let on=false;x.beginPath();
  pts.forEach(([lo,la])=>{const [px,py,pz]=igProj(lo,la);if(pz<0){on=false;return}x[on?'lineTo':'moveTo'](cx+px*r,cy-py*r);on=true});x.stroke()}

/* ===== EFEK API, ASAP, BARA, PUING (partikel) ===== */
const igR=(a,b)=>a+Math.random()*(b-a),igCnt=n=>Math.floor(n)+(Math.random()<n%1?1:0),igRep=(n,fn)=>{for(let i=0,m=igCnt(n);i<m;i++)fn()};
function igSpr(st){const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);st.forEach(([o,col])=>gr.addColorStop(o,col));g.fillStyle=gr;g.fillRect(0,0,64,64);return c}
const igSP={
  f1:igSpr([[0,'rgba(255,250,200,1)'],[.3,'rgba(255,200,60,.8)'],[1,'rgba(255,120,0,0)']]),   // api panas (putih-kuning)
  f2:igSpr([[0,'rgba(255,170,40,.95)'],[.45,'rgba(255,90,10,.6)'],[1,'rgba(200,30,0,0)']]),   // api oranye
  f3:igSpr([[0,'rgba(220,50,10,.7)'],[.5,'rgba(140,20,0,.35)'],[1,'rgba(60,0,0,0)']]),        // api merah gelap
  s1:igSpr([[0,'rgba(22,20,20,.95)'],[.6,'rgba(38,34,34,.55)'],[1,'rgba(50,45,45,0)']]),      // asap hitam
  s2:igSpr([[0,'rgba(90,82,82,.85)'],[.6,'rgba(70,64,64,.45)'],[1,'rgba(60,55,55,0)']]),      // asap abu
  gr:igSpr([[0,'rgba(210,255,210,1)'],[.4,'rgba(60,230,120,.7)'],[1,'rgba(0,200,80,0)']]),    // kilau hijau (pulih)
  gl:igSpr([[0,'rgba(255,140,40,.9)'],[.5,'rgba(255,80,10,.4)'],[1,'rgba(255,40,0,0)']])};    // cahaya lava di permukaan
const igStars=[...Array(70)].map(()=>[Math.random(),Math.random(),Math.random()*1.5+.4,Math.random()*6]);
const igEM=[0,5,10].flatMap(j=>CR.map(p=>p[j]));   // 30 titik sumber api di permukaan, tersebar di seluruh bola
const igPT=[],IGMAX=RM?500:1300;
const igAdd=p=>{if(igPT.length<IGMAX)igPT.push(p)};
const igFire=(x,y,vx,vy,s,ttl)=>igAdd({k:'f',x,y,vx,vy,ay:-90*IG.k,s,age:0,ttl});
const igSmoke=(x,y,vx,vy,s,ttl,a)=>igAdd({k:'s',x,y,vx,vy,ay:-8*IG.k,s,age:0,ttl,a,sp:Math.random()<.6?igSP.s1:igSP.s2});
const igEmber=(x,y,vx,vy,ttl)=>igAdd({k:'e',x,y,vx,vy,ay:260*IG.k,s:igR(3,7)*IG.k,age:0,ttl});
const igRock=(x,y,vx,vy)=>igAdd({k:'d',x,y,vx,vy,ay:420*IG.k,s:igR(3,8)*IG.k,age:0,ttl:igR(1.2,2.2),rot:igR(0,6),vr:igR(-9,9)});
const igSpark=(x,y,vx,vy)=>igAdd({k:'g',x,y,vx,vy,ay:-30*IG.k,s:igR(8,16)*IG.k,age:0,ttl:igR(.8,1.5)});
function igPt(lo,la){const [px,py,pz]=igProj(lo,la);return{x:IG.cx+px*IG.r,y:IG.cy-py*IG.r,ox:px,oy:-py,z:pz}}
/* Letusan di satu titik permukaan: api, asap tebal, bara, puing, gelombang kejut */
function igBoom(lo,la,pw){
  const p=igPt(lo,la),k=IG.k,n=pw*(RM?.5:1),base=Math.atan2(p.oy*.9-.8,p.ox*.9);
  const dir=sp=>{const a=base+igR(-1.15,1.15);return[Math.cos(a)*sp,Math.sin(a)*sp]};
  igRep(55*n,()=>{const[vx,vy]=dir(igR(80,430)*k);igFire(p.x,p.y,vx,vy,igR(14,34)*k,igR(.5,1.2))});
  igRep(26*n,()=>{const[vx,vy]=dir(igR(30,170)*k);igSmoke(p.x,p.y,vx,vy,igR(24,44)*k,igR(2,3.4),igR(.28,.5))});
  igRep(40*n,()=>{const[vx,vy]=dir(igR(150,520)*k);igEmber(p.x,p.y,vx,vy,igR(.8,1.8))});
  igRep(12*n,()=>{const[vx,vy]=dir(igR(120,420)*k);igRock(p.x,p.y,vx,vy)});
  IG.rings.push({x:p.x,y:p.y,t:0,mx:IG.r*igR(.9,1.3),g:0});
}
/* Api dan asap yang menyembur dari tepi bola */
function igRimFire(big){const a=igR(0,6.283),ox=Math.cos(a),oy=Math.sin(a),k=IG.k,r=IG.r;
  igFire(IG.cx+ox*r*.97,IG.cy+oy*r*.97,ox*igR(20,90)*k,oy*igR(20,90)*k-igR(30,90)*k,igR(14,30)*k*(big?1.4:1),igR(.5,1.1))}
function igRimSmoke(){const a=igR(0,6.283),ox=Math.cos(a),oy=Math.sin(a),k=IG.k,r=IG.r;
  igSmoke(IG.cx+ox*r,IG.cy+oy*r,ox*igR(10,40)*k+14*k,oy*igR(10,40)*k-igR(25,60)*k,igR(20,36)*k,igR(2.4,3.8),igR(.22,.4))}
/* Jawaban SALAH: guncangan, kilat merah, letusan bertubi-tubi, badai api di seluruh tepi bumi */
function igWrong(q){
  IG.hit=1;IG.shake=RM?0:1;IG.flash=1;IG.boost=1;
  igBoom(q.lo,q.la,1.5);
  for(let i=0;i<(RM?2:5);i++)setTimeout(()=>{if($('m11').classList.contains('on'))igBoom(IG.lo+igR(-70,70),Math.max(-70,Math.min(70,IG.la+igR(-45,45))),1)},80+i*100);
  igRep(RM?20:70,()=>igRimFire(true));igRep(RM?6:22,igRimSmoke);
}
/* Jawaban BENAR: cincin hijau dan kilau penyembuh */
function igHeal(q){
  IG.heal=1;const p=igPt(q.lo,q.la),k=IG.k;
  igRep(RM?8:26,()=>{const a=igR(0,6.283),s=igR(40,150)*k;igSpark(p.x,p.y,Math.cos(a)*s,Math.sin(a)*s)});
  IG.rings.push({x:p.x,y:p.y,t:0,mx:IG.r*.8,g:1});
}

function igFrame(now){
  if(!$('m11').classList.contains('on')){IG.raf=0;igSt.style.transform='';return}
  const W=igCv.clientWidth,H=igCv.clientHeight,d=window.devicePixelRatio||1;
  now=now||performance.now();const dt=Math.min(.05,(now-(IG.t0||now))/1000);IG.t0=now;IG.t+=dt;
  if(W&&H){
    if(igCv.width!==Math.round(W*d)||igCv.height!==Math.round(H*d)){igCv.width=Math.round(W*d);igCv.height=Math.round(H*d)}
    /* tata letak: bumi diletakkan di ruang kosong antara HUD (atas) dan kartu pertanyaan (bawah), jadi tidak pernah tertutup */
    const topH=$('igHud').offsetHeight+20,botH=$('igCard').offsetHeight+20,aH=Math.max(120,H-topH-botH);
    const tr=Math.max(60,Math.min(W/2-16,aH/2-6)*.96),tcy=topH+aH/2;
    if(!IG.r){IG.r=tr;IG.cy=tcy}else{IG.r+=(tr-IG.r)*.15;IG.cy+=(tcy-IG.cy)*.15}
    IG.cx=W/2;IG.k=IG.r/150;
    if(IG.tl){const dl=((IG.tl[0]-IG.lo+540)%360)-180;IG.lo+=dl*.1;IG.la+=(IG.tl[1]-IG.la)*.1;if(Math.abs(dl)<.3&&Math.abs(IG.tl[1]-IG.la)<.3)IG.tl=null}
    IG.lo=((IG.lo+540)%360)-180;IG.d+=((1-IG.h/10)-IG.d)*.05; // IG.d: tingkat kerusakan yang tampil (0 sehat, 1 hancur)
    IG.boost=Math.max(0,IG.boost-dt*.4);IG.hit=Math.max(0,IG.hit-dt*1.4);IG.flash=Math.max(0,IG.flash-dt*2.2);IG.heal=Math.max(0,IG.heal-dt*1.8);
    if(IG.shake>.01){const a=IG.shake*IG.shake*14;igSt.style.transform=`translate(${igR(-a,a).toFixed(1)}px,${igR(-a,a).toFixed(1)}px) rotate(${(igR(-a,a)*.08).toFixed(2)}deg)`;IG.shake=Math.max(0,IG.shake-dt*1.3)}
    else if(igSt.style.transform){igSt.style.transform='';IG.shake=0}

    const x=igX,cx=IG.cx,cy=IG.cy,r=IG.r*(1+.04*IG.hit*Math.sin(IG.t*40)),hz=IG.d;
    const hv=Math.min(1,hz+IG.hit*.25),f=Math.min(1,Math.max(0,(hz-.35)/.65)+IG.boost*.5),k=IG.k; // f: intensitas kebakaran
    x.setTransform(d,0,0,d,0,0);x.clearRect(0,0,W,H);

    /* bintang */
    igStars.forEach(([sx,sy,ss,ph])=>{x.fillStyle=`rgba(255,255,255,${(.35+.35*Math.sin(IG.t*1.5+ph)).toFixed(2)})`;x.fillRect(sx*W,sy*H,ss,ss)});
    /* cahaya panas di belakang bumi */
    if(f>.02||IG.hit>.02){const a=Math.min(.8,.5*f*(.85+.15*Math.sin(IG.t*6))+.4*IG.hit),gl=x.createRadialGradient(cx,cy,r*.85,cx,cy,r*(1.45+.25*f));
      gl.addColorStop(0,`rgba(255,110,20,${a.toFixed(3)})`);gl.addColorStop(1,'rgba(255,40,0,0)');
      x.globalCompositeOperation='lighter';x.fillStyle=gl;x.fillRect(0,0,W,H);x.globalCompositeOperation='source-over'}

    /* bumi */
    x.shadowColor=mix([120,220,255],[255,70,30],hv);x.shadowBlur=18;
    x.fillStyle=mix([40,130,230],[135,42,30],hv);x.beginPath();x.arc(cx,cy,r,0,7);x.fill();x.shadowBlur=0;
    x.save();x.beginPath();x.arc(cx,cy,r,0,7);x.clip();
    x.strokeStyle='rgba(255,255,255,.15)';x.lineWidth=1;
    for(let g=-180;g<180;g+=30)igPath([...Array(31)].map((_,j)=>[g,j*6-90]),r,cx,cy);
    for(let g=-60;g<=60;g+=30)igPath([...Array(61)].map((_,j)=>[j*6-180,g]),r,cx,cy);
    x.fillStyle=mix([79,191,90],[105,78,60],hv);x.strokeStyle='rgba(0,0,0,.25)';x.lineWidth=1.5;
    LANDD.forEach(poly=>{
      const pts=poly.map(([lo,la])=>igProj(lo,la));if(pts.every(p=>p[2]<0))return;
      x.beginPath();pts.forEach(([px,py,pz],j)=>{if(pz<0){const m=Math.hypot(px,py)||1;px/=m;py/=m}x[j?'lineTo':'moveTo'](cx+px*r,cy-py*r)});x.closePath();x.fill();x.stroke()});
    /* retakan lava: makin banyak dan makin terang saat Bumi makin hancur */
    x.strokeStyle=`rgba(255,${85+Math.round(35*Math.sin(IG.t*8))},15,${Math.min(1,hv*1.6*(.85+.15*Math.sin(IG.t*9))).toFixed(3)})`;x.lineWidth=2.5+2*hv;x.shadowColor='#ff7a1a';x.shadowBlur=10;
    CR.slice(0,Math.round(hv*10)).forEach(p=>igPath(p,r,cx,cy));x.shadowBlur=0;
    if(hv>.2){x.globalCompositeOperation='lighter';x.strokeStyle=`rgba(255,70,10,${(.55*hv*(.8+.2*Math.sin(IG.t*7))).toFixed(3)})`;x.lineWidth=7+4*hv;CR.slice(0,Math.round(hv*10)).forEach(p=>igPath(p,r,cx,cy));x.globalCompositeOperation='source-over'}
    /* awan: putih saat sehat, asap gelap saat hancur */
    x.fillStyle=mix([255,255,255],[50,40,40],hv).replace('rgb','rgba').replace(')',`,${.5+hv*.3})`);
    CL.forEach(([lo,la])=>{const [px,py,pz]=igProj(lo,la);if(pz<.1)return;const sx=cx+px*r,sy=cy-py*r,q=r*.09;
      [[-1,.3,1],[0,-.3,1.3],[1.1,.2,.9]].forEach(([ox,oy,kk])=>{x.beginPath();x.arc(sx+ox*q,sy+oy*q,q*kk,0,7);x.fill()})});
    /* gosong */
    x.fillStyle=`rgba(25,6,0,${(hv*.22).toFixed(3)})`;x.fillRect(cx-r,cy-r,r*2,r*2);
    const sh=x.createRadialGradient(cx-r*.35,cy-r*.35,r*.1,cx,cy,r);sh.addColorStop(0,'rgba(255,255,255,.18)');sh.addColorStop(.6,'rgba(0,0,0,0)');sh.addColorStop(1,'rgba(0,0,30,.45)');
    x.fillStyle=sh;x.fillRect(cx-r,cy-r,r*2,r*2);x.restore();
    /* tepi bumi menyala saat kebakaran */
    if(f>.05){x.save();x.globalCompositeOperation='lighter';x.strokeStyle=`rgba(255,120,30,${(Math.min(.9,f*.9)*(.8+.2*Math.sin(IG.t*6))).toFixed(3)})`;x.lineWidth=3+3*f;x.shadowColor='#ff5a10';x.shadowBlur=22;x.beginPath();x.arc(cx,cy,r,0,7);x.stroke();x.restore()}
    /* penanda lokasi pertanyaan yang sedang aktif */
    const q=QS[IG.i];if(q){const [px,py,pz]=igProj(q.lo,q.la);if(pz>.12){
      const sx=cx+px*r,sy=cy-py*r;x.beginPath();x.arc(sx,sy,15+3*Math.sin(Date.now()/200),0,7);x.fillStyle='rgba(255,60,60,.55)';x.fill();x.lineWidth=2;x.strokeStyle='#fff';x.stroke();
      x.font='18px sans-serif';x.textAlign='center';x.textBaseline='middle';x.fillStyle='#fff';x.fillText(q.ic,sx,sy+1)}}

    /* sumber api: semburan api & asap terus-menerus (cahaya lava digambar nanti, di atas asap) */
    const glows=[];
    if(f>.02){
      const nE=Math.round(f*igEM.length),rm=RM?.5:1;
      for(let i=0;i<nE;i++){const p=igPt(igEM[i][0],igEM[i][1]);if(p.z<.02)continue;
        glows.push([p.x,p.y,r*(.1+.07*f)*(.85+.15*Math.sin(IG.t*9+i)),Math.min(1,.2+.5*f+.3*p.z)]);
        igRep((5+14*f)*dt*rm,()=>igFire(p.x+igR(-4,4)*k,p.y+igR(-4,4)*k,p.ox*igR(10,60)*k+igR(-25,25)*k,p.oy*igR(10,60)*k-igR(35,95)*k,igR(10,22)*k*(.6+f*.6),igR(.5,1)));
        igRep((1.1+1.6*f)*dt*rm,()=>igSmoke(p.x+igR(-4,4)*k,p.y+igR(-4,4)*k,p.ox*igR(5,30)*k+14*k,p.oy*igR(5,30)*k-igR(30,65)*k,igR(13,22)*k,igR(2.2,3.4),.16+.18*f));
      }
      if(f>.3){igRep(45*f*dt*rm,()=>igRimFire(false));igRep(8*f*dt*rm,igRimSmoke)}
    }

    /* update partikel */
    for(let i=igPT.length-1;i>=0;i--){const p=igPT[i];p.age+=dt;if(p.age>=p.ttl){igPT[i]=igPT[igPT.length-1];igPT.pop();continue}
      const dr=1-dt*(p.k==='s'?.6:.9);p.vx*=dr;p.vy=p.vy*dr+p.ay*dt;p.x+=p.vx*dt;p.y+=p.vy*dt;if(p.vr)p.rot+=p.vr*dt}
    /* gambar partikel: asap (normal) -> api/bara/kilau (additive) -> puing */
    for(const p of igPT)if(p.k==='s'){const t=p.age/p.ttl,s=p.s*(1+t*2.4);x.globalAlpha=Math.max(0,p.a*(t<.12?t/.12:(1-t)/.88));x.drawImage(p.sp,p.x-s,p.y-s,s*2,s*2)}
    x.globalCompositeOperation='lighter';
    for(const g of glows){x.globalAlpha=g[3];x.drawImage(igSP.gl,g[0]-g[2],g[1]-g[2],g[2]*2,g[2]*2)}
    for(const p of igPT){const t=p.age/p.ttl;
      if(p.k==='f'){const s=p.s*(1.1-.8*t);x.globalAlpha=Math.min(1,(1-t)*1.4);x.drawImage(t<.22?igSP.f1:t<.6?igSP.f2:igSP.f3,p.x-s,p.y-s,s*2,s*2)}
      else if(p.k==='e'){const s=p.s*(1-.5*t);x.globalAlpha=1-t;x.drawImage(igSP.f1,p.x-s,p.y-s,s*2,s*2)}
      else if(p.k==='g'){const s=p.s*(1-.4*t);x.globalAlpha=1-t;x.drawImage(igSP.gr,p.x-s,p.y-s,s*2,s*2)}}
    x.globalCompositeOperation='source-over';
    for(const p of igPT)if(p.k==='d'){const t=p.age/p.ttl;x.save();x.translate(p.x,p.y);x.rotate(p.rot);x.globalAlpha=1-t*t;
      x.fillStyle='#3b2a25';x.strokeStyle='rgba(255,110,30,.9)';x.lineWidth=1.5;x.fillRect(-p.s,-p.s*.6,p.s*2,p.s*1.2);x.strokeRect(-p.s,-p.s*.6,p.s*2,p.s*1.2);x.restore()}
    x.globalAlpha=1;
    /* gelombang kejut */
    x.globalCompositeOperation='lighter';
    IG.rings=IG.rings.filter(o=>(o.t+=dt/.8)<1);
    IG.rings.forEach(o=>{const rr=IG.r*.1+(o.mx*1.5-IG.r*.1)*o.t;x.globalAlpha=Math.pow(1-o.t,1.5);x.lineWidth=(10*(1-o.t)+1)*k;
      x.strokeStyle=o.g?'rgba(90,255,150,.9)':'rgba(255,150,40,.95)';x.beginPath();x.arc(o.x,o.y,rr,0,7);x.stroke()});
    x.globalAlpha=1;x.globalCompositeOperation='source-over';
    /* vignette merah berdenyut + kilat */
    const va=.25*f*(.8+.2*Math.sin(IG.t*5))+.35*IG.flash;
    if(va>.005){const vg=x.createRadialGradient(W/2,H/2,Math.min(W,H)*.35,W/2,H/2,Math.max(W,H)*.75);vg.addColorStop(0,'rgba(150,10,0,0)');vg.addColorStop(1,`rgba(150,10,0,${va.toFixed(3)})`);x.fillStyle=vg;x.fillRect(0,0,W,H)}
    if(IG.flash>.01){x.fillStyle=`rgba(255,70,20,${(IG.flash*.4).toFixed(3)})`;x.fillRect(0,0,W,H)}
    if(IG.heal>.01){x.fillStyle=`rgba(60,230,120,${(IG.heal*.14).toFixed(3)})`;x.fillRect(0,0,W,H)}
  }
  IG.raf=requestAnimationFrame(igFrame);
}
/* Putar bola dunia dengan seret (mouse & sentuh) */
igCv.addEventListener('pointerdown',e=>{igCv.setPointerCapture(e.pointerId);IG.drag={x:e.clientX,y:e.clientY};IG.tl=null});
igCv.addEventListener('pointermove',e=>{const d=IG.drag;if(!d)return;IG.lo-=(e.clientX-d.x)*.45;IG.la=Math.max(-65,Math.min(65,IG.la+(e.clientY-d.y)*.45));d.x=e.clientX;d.y=e.clientY});
igCv.addEventListener('pointerup',()=>IG.drag=null);igCv.addEventListener('pointercancel',()=>IG.drag=null);
function initM11(){
  Object.assign(IG,{h:5,d:.5,i:0,right:0,tl:null,lo:100,la:10,r:0,t0:0,boost:0,shake:0,flash:0,hit:0,heal:0,rings:[]});
  igPT.length=0;igSt.style.transform='';
  igUpd();showQ();go('m11');if(!IG.raf)IG.raf=requestAnimationFrame(igFrame);
}
function igUpd(){
  const h=IG.h;$('igT').textContent=`${h} / 10 ${h>=8?'😀':h>=5?'🙂':h>=3?'😟':'😭'}`;
  $('igP').textContent=`Soal ${Math.min(IG.i+1,QS.length)} / ${QS.length}`;
  $('igM').style.width=h*10+'%';$('igM').style.background=h>=6?'var(--green)':h>=4?'var(--orange)':'#e53935';
}
function showQ(){
  const q=QS[IG.i];IG.tl=[q.lo,Math.max(-40,Math.min(50,q.la))];igUpd();
  $('igCard').innerHTML=`<h3>${q.ic} Pertanyaan ${IG.i+1}</h3><p>${q.q}</p><div id="igO"></div><div class="igFoot"><div class="fb" id="igFb">Pilih jawaban yang benar ya! 👆</div><div id="igNx"></div></div>`;
  shuffle([[q.a,1],[q.b,0]]).forEach(([t,ok])=>{const b=document.createElement('button');b.className='igo';b.textContent=t;b.dataset.ok=ok;b.onclick=()=>igPick(b,ok,q);$('igO').appendChild(b)});
}
function igPick(b,ok,q){
  const all=document.querySelectorAll('#igO .igo');if(all[0].disabled)return;
  all.forEach(x=>{x.disabled=true;if(x.dataset.ok==='1')x.classList.add('ok')});
  if(ok){IG.right++;IG.h=Math.min(10,IG.h+1);$('igFb').textContent='Betul! Bumi makin sehat. '+q.w;igHeal(q)}
  else{b.classList.add('no');IG.h=Math.max(0,IG.h-1);$('igFb').textContent='Salah! Bumi makin hancur. '+q.w;igWrong(q)}
  igUpd();const n=document.createElement('button');n.className='btn';n.textContent=IG.i>=QS.length-1?'Lihat hasil':'Lanjut ➜';
  n.onclick=()=>{IG.i++;IG.i>=QS.length?igEnd():showQ()};$('igNx').appendChild(n);
}
function igEnd(){
  const stars=IG.right>=9?3:IG.right>=6?2:1;S.stars.iklim=Math.max(S.stars.iklim||0,stars);
  $('resTitle').textContent=IG.h>=5?`Bumi selamat berkat ${S.team||'kamu'}!`:'Bumi masih sakit, ayo coba lagi!';
  $('resStars').textContent='⭐'.repeat(stars)+'☆'.repeat(3-stars);
  $('resTxt').textContent=`Kamu menjawab ${IG.right} dari ${QS.length} dengan benar. Kondisi Bumi: ${IG.h} / 10.`;
  go('result');S.lvl='levels';
}


/* Misi 5: ketuk foto jenis banjir untuk memperbesar */
function openPhoto(fig){const img=fig.querySelector('img');$('photoBig').src=img.src;$('photoBig').alt=img.alt;$('photoCap').textContent=fig.querySelector('figcaption').textContent;$('photoBox').hidden=false;$('photoClose').focus()}
document.addEventListener('click',e=>{const f=e.target.closest('.floodPhoto');if(f)openPhoto(f);else if(e.target.closest('#photoBox')&&e.target.id!=='photoBig')$('photoBox').hidden=true});
document.addEventListener('keydown',e=>{if(e.key==='Escape')$('photoBox').hidden=true;if((e.key==='Enter'||e.key===' ')&&e.target.classList&&e.target.classList.contains('floodPhoto')){e.preventDefault();openPhoto(e.target)}});


/* ===== MISI 6: TANAH LONGSOR =====
   Tahap 1: ketuk tanda bahaya di gambar lereng (ada pengecoh). Tahap 2: pilih tindakan yang tepat. */
const LS_SIGNS=[
 {id:'batu',ic:'🪨',t:'Batu-batu mulai berjatuhan dari lereng! Itu tanda tanah di atas mulai bergerak.'},
 {id:'retak',ic:'⚠️',t:'Jalan dan tanah mulai retak. Retakan bisa jadi pertanda tanah sedang bergeser.'},
 {id:'pohon',ic:'🌳',t:'Pohon yang mulai miring menandakan tanah di bawahnya tidak lagi kuat menahannya.'},
 {id:'hujan',ic:'🌧️',t:'Hujan deras yang berlangsung lama membuat tanah jenuh air, sehingga mudah longsor.'}
];
const LS_DECOY={
 sehat:'Pohon ini masih tegak dan kokoh. Amati lagi, cari pohon yang miring.',
 rumah:'Rumah ini jauh dari lereng, jadi bukan tanda bahaya. Amati lereng dan jalan di dekatnya.'
};
const LS_OPTS=[
 ['Mendekati lereng untuk melihat lebih jelas.',0,'Mendekat itu berbahaya! Tanah bisa longsor tiba-tiba. Jauhi lereng.'],
 ['Menjauh dari area lereng dan mencari tempat aman.',1,'Menjauh dan mencari tempat aman adalah tindakan yang tepat. Beri tahu juga orang dewasa atau petugas.'],
 ['Tetap beraktivitas seperti biasa.',0,'Tanda-tanda itu adalah peringatan. Jangan menunda, segera menjauh dan beri tahu orang dewasa.']
];
let L={};
function lsSteps(){const cur=L.phase>=2?1:0;$('lsSteps').innerHTML=['Cari tanda bahaya','Tentukan tindakan'].map((t,i)=>`<span class="step ${i<cur?'':i===cur?'now':'wait'}">${i<cur?'✅':(i+1)+'.'} ${t}</span>`).join('')}
function initM6(){
  L={phase:1,found:new Set(),miss:0,busy:false};
  document.querySelectorAll('#slopeSvg .lsh').forEach(g=>g.classList.remove('found','bad','pulse'));
  $('slopeSvg').classList.remove('done');$('lsSlide').classList.remove('go');$('lsPeople').classList.remove('away','arrived');
  $('lsQuiz').style.display='none';$('lsFb').className='note';$('lsFb').textContent='';
  $('lsCount').textContent='0 / 4';$('lsInfo').className='note';$('lsInfo').textContent='Ketuk bagian gambar yang menunjukkan tanda tanah longsor. Perhatikan batu, tanah, pohon, dan langit.';
  $('lsH').innerHTML='Waspada tanah longsor! Temukan <em>4 tanda bahaya</em> di lereng ini.';
  lsSteps();go('m6');
}
function lsTap(id){
  if(L.phase!==1)return;
  const g=document.querySelector(`#slopeSvg [data-s="${id}"]`),s=LS_SIGNS.find(x=>x.id===id),info=$('lsInfo');
  if(s){ // benar: objek menyala hijau + penjelasan
    L.found.add(id);g.classList.remove('pulse');g.classList.add('found');
    $('lsCount').textContent=`${L.found.size} / 4`;info.className='note good';info.innerHTML=`<b>${s.ic}</b> ${s.t}`;
    if(L.found.size===4){L.phase=1.5;setTimeout(startLsQuiz,2600)}
  }else{ // salah: petunjuk untuk mengamati lagi
    L.miss++;g.classList.add('bad');setTimeout(()=>g.classList.remove('bad'),900);info.className='note bad';info.textContent=LS_DECOY[id];
  }
}
function lsHint(){
  const left=LS_SIGNS.find(s=>!L.found.has(s.id));if(!left||L.phase!==1)return;
  const g=document.querySelector(`#slopeSvg [data-s="${left.id}"]`);g.classList.add('pulse');setTimeout(()=>g.classList.remove('pulse'),3500);
}
function startLsQuiz(){
  L.phase=2;lsSteps();$('lsH').innerHTML='Tanda-tandanya sudah ketemu! Sekarang tentukan <em>tindakanmu</em>.';
  $('lsInfo').className='note';$('lsInfo').textContent='Semua tanda bahaya sudah ditemukan. Jawab pertanyaan di bawah ini.';
  const box=$('lsOpts');box.innerHTML='';
  shuffle(LS_OPTS).forEach(([t,ok,why],i)=>{
    const b=document.createElement('button');b.type='button';b.className='lsOpt';b.innerHTML=`<b>${'ABC'[i]}.</b> ${t}`;
    b.onclick=()=>answerLs(b,ok,why);box.appendChild(b);
  });
  $('lsQuiz').style.display='';$('lsQuiz').scrollIntoView({behavior:'smooth',block:'nearest'});
}
function answerLs(btn,ok,why){
  if(L.busy)return;const fb=$('lsFb');
  if(!ok){L.miss++;btn.classList.add('wrong');btn.disabled=true;fb.className='note bad';fb.textContent=why;return}
  L.busy=true;btn.classList.add('correct');document.querySelectorAll('#lsOpts button').forEach(b=>b.disabled=true);
  fb.className='note good';fb.textContent='Betul! '+why;lsPayoff();
}
async function lsPayoff(){
  $('slopeSvg').classList.add('done');$('lsPeople').classList.add('away');
  await sleep(1300);$('lsSlide').classList.add('go');
  await sleep(2800);$('lsPeople').classList.add('arrived');
  $('lsFb').textContent='Tidak lama kemudian tanah longsor! Karena kamu sudah menjauh dan memberi tahu orang dewasa, semua selamat.';
  await sleep(3400);finish('m6',L.miss===0?3:L.miss<3?2:1,'Misi Tanah Longsor selesai!');
}
$('slopeSvg').addEventListener('click',e=>{
  const g=e.target.closest('.lsh');
  if(g)lsTap(g.dataset.s);
  else if(L.phase===1){$('lsInfo').className='note';$('lsInfo').textContent='Belum ada tanda bahaya di sini. Amati lagi: batu, tanah, pohon, dan langit.'}
});
document.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const g=e.target.closest&&e.target.closest('#slopeSvg .lsh');if(g){e.preventDefault();lsTap(g.dataset.s)}});


/* ===== MISI 7: GEMPA BUMI =====
   Tahap 1: pilih tempat berlindung (meja kokoh). Tahap 2: Drop, Cover, Hold On berurutan.
   Tahap 3: setelah gempa berhenti, pilih tindakan yang tepat. */
const EQ_DECOY={
 lemari:'Lemari bisa terguling dan menimpamu, dan barang di atasnya bisa jatuh. Jauhi lemari!',
 jendela:'Kaca jendela bisa pecah dan melukai. Jauhi jendela saat gempa!',
 lampu:'Lampu gantung bisa jatuh. Jangan berlindung di bawahnya!'
};
const EQ_ACTS=[
 {id:'drop',ic:'🧎',name:'Merunduk (Drop)',why:'Turunkan badanmu ke lantai supaya tidak terjatuh karena guncangan.'},
 {id:'cover',ic:'🛡️',name:'Berlindung (Cover)',why:'Lindungi kepala dan leher dengan tangan, dan tetap di bawah meja.'},
 {id:'hold',ic:'✊',name:'Berpegangan (Hold On)',why:'Pegang kaki meja agar meja tidak bergeser menjauh darimu.'}
];
const EQ_OPTS=[
 ['Menggunakan lift untuk keluar.',0,'Jangan pakai lift! Lift bisa berhenti dan membuatmu terjebak saat listrik padam.'],
 ['Keluar melalui tangga setelah kondisi aman.',1,'Tepat! Gunakan tangga dan waspadai kerusakan bangunan seperti retakan, kaca pecah, dan benda yang jatuh.'],
 ['Kembali mengambil barang-barang.',0,'Jangan kembali! Gempa susulan bisa terjadi. Selamatkan dirimu dulu.']
];
const EQ_KID_X={ready:224,drop:224,cover:330,hold:306};
let EQ={};
function eqSteps(){
  const cur=EQ.phase>=3?2:EQ.phase>=2?1:0;
  $('eqSteps').innerHTML=['Pilih tempat berlindung','Drop, Cover, Hold On','Setelah gempa'].map((t,i)=>`<span class="step ${i<cur?'':i===cur?'now':'wait'}">${i<cur?'✅':(i+1)+'.'} ${t}</span>`).join('');
}
function eqKid(x,pose){const k=$('eqKid');if(x!=null)k.style.transform=`translate(${x}px,336px) scale(1.2)`;if(pose)k.setAttribute('data-pose',pose)}
function initM7(){
  EQ={phase:1,miss:0,si:0,busy:false};
  document.querySelectorAll('#eqSvg .eqh').forEach(g=>g.classList.remove('found','bad'));
  $('eqSvg').classList.add('quake');$('eqSvg').classList.remove('eqdone');$('eqKid').classList.remove('walking');$('eqKid').style.opacity='';eqKid(170,'stand');
  $('eqActsBox').style.display='none';$('eqQuiz').style.display='none';$('eqFb').className='note';$('eqFb').textContent='';
  $('eqH').textContent='Gempa bumi terjadi! Apa yang harus kamu lakukan?';
  $('eqInfo').className='note';$('eqInfo').textContent='Ruangan bergoyang! Ketuk tempat berlindung yang paling aman di ruangan ini.';
  eqSteps();go('m7');
}
function eqTap(id){
  if(EQ.phase!==1||EQ.busy)return;
  const g=document.querySelector(`#eqSvg [data-e="${id}"]`),info=$('eqInfo');
  if(id==='meja'){
    EQ.busy=true;g.classList.add('found');info.className='note good';info.textContent='Betul! Meja yang kokoh melindungi kepala dan badanmu dari benda yang jatuh.';
    eqKid(EQ_KID_X.ready,'stand');
    setTimeout(()=>{EQ.phase=2;EQ.busy=false;eqSteps();startEqActs()},1300);
  }else{EQ.miss++;g.classList.add('bad');setTimeout(()=>g.classList.remove('bad'),900);info.className='note bad';info.textContent=EQ_DECOY[id]}
}
function startEqActs(){
  $('eqSvg').classList.add('eqdone');
  $('eqH').innerHTML='Bagus! Sekarang lakukan <em>Drop, Cover, Hold On</em> sesuai urutan.';
  $('eqInfo').className='note';$('eqInfo').textContent='Kamu sudah di dekat meja. Pilih langkah yang tepat satu per satu.';
  const box=$('eqActs');box.innerHTML='';
  shuffle(EQ_ACTS).forEach(a=>{
    const b=document.createElement('button');b.type='button';b.className='eqOpt';b.dataset.id=a.id;b.innerHTML=`<span class="em">${a.ic}</span>${a.name}`;
    b.onclick=()=>eqAct(b,a);box.appendChild(b);
  });
  $('eqActsBox').style.display='';
}
function eqAct(btn,a){
  if(EQ.busy)return;const need=EQ_ACTS[EQ.si],fb=$('eqFb');
  if(a.id!==need.id){EQ.miss++;btn.classList.add('wrong');setTimeout(()=>btn.classList.remove('wrong'),700);fb.className='note bad';fb.textContent=`Belum tepat. Urutannya Drop, Cover, Hold On. Lakukan "${need.name}" dulu.`;return}
  btn.classList.add('correct');btn.disabled=true;fb.className='note good';fb.textContent=`${a.name}: ${a.why}`;
  eqKid(EQ_KID_X[a.id],a.id);EQ.si++;
  if(EQ.si>=EQ_ACTS.length){EQ.busy=true;setTimeout(eqQuake,1800)}
}
async function eqQuake(){
  $('eqFb').className='note';$('eqFb').textContent='Tetap bertahan sampai guncangan berhenti...';
  await sleep(2200);$('eqSvg').classList.remove('quake');
  EQ.phase=3;EQ.busy=false;eqSteps();$('eqActsBox').style.display='none';
  $('eqH').textContent='Gempa sudah berhenti. Apa yang harus kamu lakukan?';
  $('eqInfo').className='note';$('eqInfo').textContent='Guncangan sudah berhenti, tapi gempa susulan masih mungkin terjadi.';
  const box=$('eqOpts');box.innerHTML='';
  shuffle(EQ_OPTS).forEach(([t,ok,why],i)=>{
    const b=document.createElement('button');b.type='button';b.className='eqOpt';b.innerHTML=`<b>${'ABC'[i]}.</b> ${t}`;
    b.onclick=()=>eqAnswer(b,ok,why);box.appendChild(b);
  });
  $('eqQuiz').style.display='';$('eqQuiz').scrollIntoView({behavior:'smooth',block:'nearest'});
}
function eqAnswer(btn,ok,why){
  if(EQ.busy)return;const fb=$('eqFb');
  if(!ok){EQ.miss++;btn.classList.add('wrong');btn.disabled=true;fb.className='note bad';fb.textContent=why;return}
  EQ.busy=true;btn.classList.add('correct');document.querySelectorAll('#eqOpts button').forEach(b=>b.disabled=true);
  fb.className='note good';fb.textContent=why;eqExit();
}
async function eqExit(){
  eqKid(null,'stand');await sleep(500);
  $('eqKid').classList.add('walking');eqKid(724,'stand');
  await sleep(1400);$('eqKid').style.opacity='0';
  await sleep(2600);finish('m7',EQ.miss===0?3:EQ.miss<3?2:1,'Misi Gempa Bumi selesai!');
}
document.addEventListener('click',e=>{const g=e.target.closest('#eqSvg .eqh');if(g)eqTap(g.dataset.e)});
document.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const g=e.target.closest&&e.target.closest('#eqSvg .eqh');if(g){e.preventDefault();eqTap(g.dataset.e)}});


/* ===== MISI 9: ANGIN PUTING BELIUNG =====
   Tahap 1: pilih tempat berlindung (rumah kokoh). Tahap 2: langkah keselamatan di dalam rumah (urut).
   Tahap 3: angin mereda, edukasi singkat, lalu skor. */
const TW_PLACES={
 rumah:'Betul! Bangunan yang kokoh dan jauh dari jendela adalah tempat berlindung yang aman.',
 pohon:'Berbahaya! Pohon bisa tumbang dan rantingnya bisa jatuh menimpamu.',
 halte:'Halte terbuka tidak melindungi dari angin dan benda yang beterbangan.'
};
const TW_ACTS=[
 {id:'jauh',ic:'🪟',name:'Jauhi jendela',why:'Kaca jendela bisa pecah terkena angin dan benda yang beterbangan.',x:350},
 {id:'dalam',ic:'🚪',name:'Berlindung di ruangan paling dalam',why:'Ruangan paling dalam yang tanpa jendela paling aman dari pecahan kaca dan benda terbang.',x:590},
 {id:'kepala',ic:'🛡️',name:'Lindungi kepala dan leher',why:'Gunakan tangan, bantal, atau helm untuk melindungi kepala dan leher dari benda yang jatuh.',x:590,pose:'cover'}
];
const TW_DECOY={id:'intip',ic:'👀',name:'Mengintip keluar lewat jendela',why:'Jangan mengintip! Kaca bisa pecah dan angin membawa benda yang melukai.'};
let TW={};
function twSteps(){
  const cur=TW.phase>=3?2:TW.phase>=2?1:0;
  $('twSteps').innerHTML=['Cari tempat berlindung','Langkah keselamatan','Angin mereda'].map((t,i)=>`<span class="step ${i<cur?'':i===cur?'now':'wait'}">${i<cur?'✅':(i+1)+'.'} ${t}</span>`).join('');
}
function twPlace(k,x,y,pose,flip){k.style.transform=`translate(${x}px,${y}px) scale(${k.id==='twKid'?1.2:1.9})`;if(pose)k.setAttribute('data-pose',pose)}
function initM9(){
  TW={phase:1,miss:0,si:0,busy:false};
  ['twSvg','twInSvg'].forEach(i=>{$(i).classList.add('wind');$(i).classList.remove('done')});
  document.querySelectorAll('#twSvg .twh').forEach(g=>g.classList.remove('found','bad'));
  $('twOut').style.display='';$('twIn').style.display='none';
  const k=$('twKid');k.style.opacity='';k.classList.remove('walking');twPlace(k,392,446,'stand');k.querySelector('.twbub').textContent='❓';
  twPlace($('twKid2'),130,398,'stand');
  $('twActsBox').style.display='none';$('twEdu').style.display='none';$('twFb').className='note';$('twFb').textContent='';
  $('twH').textContent='Angin puting beliung mulai mendekat! Bantu karakter menemukan tempat berlindung yang aman!';
  $('twInfo').className='note';$('twInfo').textContent='Ketuk tempat yang menurutmu paling aman untuk berlindung.';
  twSteps();go('m9');
}
function twTap(id){
  if(TW.phase!==1||TW.busy)return;
  const g=document.querySelector(`#twSvg [data-t="${id}"]`),info=$('twInfo'),k=$('twKid');
  if(id!=='rumah'){g.classList.add('bad');setTimeout(()=>g.classList.remove('bad'),900);twFailScene(id);return}
  TW.busy=true;g.classList.add('found');info.className='note good';info.textContent=TW_PLACES.rumah;k.querySelector('.twbub').textContent='✅';
  k.classList.add('walking');twPlace(k,156,404,'stand');
  setTimeout(()=>{k.style.opacity='0';k.classList.remove('walking')},1700);
  setTimeout(startTwActs,2400);
}
function startTwActs(){
  TW.phase=2;TW.busy=false;twSteps();
  $('twSvg').classList.add('done');$('twOut').style.display='none';$('twIn').style.display='';
  $('twH').innerHTML='Kamu sudah di dalam rumah. <em>Jauhi jendela</em> dan berlindunglah di ruangan paling dalam!';
  $('twInfo').className='note';$('twInfo').textContent='Lindungi kepala dan leher menggunakan tangan atau benda pelindung. Pilih langkahnya satu per satu dengan urutan yang benar.';
  buildTwActs();$('twActsBox').style.display='';
}
function buildTwActs(){
  const box=$('twActs');box.innerHTML='';
  shuffle([...TW_ACTS,TW_DECOY]).forEach(a=>{
    const b=document.createElement('button');b.type='button';b.className='twOpt';b.dataset.id=a.id;b.innerHTML=`<span class="em">${a.ic}</span>${a.name}`;
    b.onclick=()=>twAct(b,a);box.appendChild(b);
  });
}
function twAct(btn,a){
  if(TW.busy)return;const need=TW_ACTS[TW.si],fb=$('twFb');
  if(a.id==='intip'){btn.classList.add('wrong');twFailScene('intip');return}
  if(a.id!==need.id){
    TW.miss++;btn.classList.add('wrong');setTimeout(()=>btn.classList.remove('wrong'),800);fb.className='note bad';
    fb.textContent=`Belum tepat. Lakukan "${need.name}" dulu.`;return;
  }
  btn.classList.add('correct');btn.disabled=true;fb.className='note good';fb.textContent=`${a.name}: ${a.why}`;
  twPlace($('twKid2'),a.x,398,a.pose||'stand');TW.si++;
  if(TW.si>=TW_ACTS.length){TW.busy=true;setTimeout(twCalm,2200)}
}
async function twCalm(){
  $('twInSvg').classList.remove('wind');$('twSvg').classList.remove('wind');
  TW.phase=3;twSteps();$('twActsBox').style.display='none';
  $('twH').textContent='Angin mulai mereda. Kamu berhasil menyelamatkan diri!';
  $('twInfo').className='note good';$('twInfo').textContent='Tetap di tempat aman sampai angin benar-benar reda dan ada arahan dari petugas.';
  $('twFb').className='note';$('twFb').textContent='';
  $('twEdu').style.display='';$('twEdu').scrollIntoView({behavior:'smooth',block:'nearest'});
}
function twFinish(){finish('m9',TW.miss===0?3:TW.miss<3?2:1,'Misi Angin Puting Beliung selesai!')}
document.addEventListener('click',e=>{const g=e.target.closest('#twSvg .twh');if(g)twTap(g.dataset.t)});
document.addEventListener('keydown',e=>{if(e.key!=='Enter'&&e.key!==' ')return;const g=e.target.closest&&e.target.closest('#twSvg .twh');if(g){e.preventDefault();twTap(g.dataset.t)}});


/* ===== MISI 9: adegan kalah =====
   Pohon: tertimpa pohon. Halte: diterbangkan puting beliung. Mengintip: terkena pecahan kaca dan benda terbang. */
const TW_FAIL={
 pohon:{e:'🌳',t:'Waduh! Kamu tertimpa pohon!',p:'Pohon bisa tumbang dan rantingnya bisa jatuh menimpamu. Jangan berlindung di bawah pohon!'},
 halte:{e:'🌪️',t:'Waduh! Kamu terbawa angin!',p:'Halte terbuka tidak memberi perlindungan dari angin dan benda yang beterbangan. Puting beliung bisa menerbangkan orang.'},
 intip:{e:'🪟',t:'Awas, kaca pecah!',p:'Kaca bisa pecah dan angin membawa benda yang melukai. Jangan mengintip lewat jendela!'}
};
async function twFailScene(kind){
  TW.busy=true;TW.miss++;
  $('twInfo').className='note bad';$('twInfo').textContent=TW_FAIL[kind].p;
  if(kind==='intip'){
    const k=$('twKid2');twPlace(k,190,398,'stand');await sleep(1300);
    $('twInSvg').classList.add('shatter');await sleep(800);
    k.style.transform='translate(190px,398px) scale(1.9,1.15)';k.querySelector('.twbub').textContent='💫';await sleep(1000);
  }else{
    const k=$('twKid'),svg=$('twSvg'),x=kind==='pohon'?420:512;
    k.querySelector('.twbub').textContent='😰';k.classList.add('walking');twPlace(k,x,446,'stand');await sleep(1900);k.classList.remove('walking');
    if(kind==='pohon'){
      svg.classList.add('fail-pohon');await sleep(800);
      k.style.transition='transform .25s';k.style.transform=`translate(${x}px,446px) scale(1.2,.55)`;k.querySelector('.twbub').textContent='💫';await sleep(1000);
    }else{
      svg.classList.add('fail-halte');await sleep(1600);
      k.style.setProperty('--x',x+'px');k.style.setProperty('--y','446px');k.classList.add('blown');await sleep(1500);
    }
  }
  const f=TW_FAIL[kind];$('twFailE').textContent=f.e;$('twFailT').textContent=f.t;$('twFailP').textContent=f.p;
  $('twFailB').onclick=()=>twRetry(kind);$('twFail').hidden=false;$('twFailB').focus();
}
function twRetry(kind){
  $('twFail').hidden=true;
  if(kind==='intip'){
    $('twInSvg').classList.remove('shatter');const k=$('twKid2');k.querySelector('.twbub').textContent='';twPlace(k,130,398,'stand');
    TW.si=0;buildTwActs();$('twFb').className='note';$('twFb').textContent='';
    $('twInfo').className='note';$('twInfo').textContent='Coba lagi! Pilih langkahnya satu per satu dengan urutan yang benar.';
  }else{
    const svg=$('twSvg'),k=$('twKid');svg.classList.remove('fail-pohon','fail-halte');
    k.classList.remove('blown','walking');k.style.removeProperty('--x');k.style.removeProperty('--y');
    k.style.transition='none';twPlace(k,392,446,'stand');k.querySelector('.twbub').textContent='❓';void k.getBoundingClientRect();k.style.transition='';
    $('twInfo').className='note';$('twInfo').textContent='Coba lagi! Ketuk tempat yang menurutmu paling aman untuk berlindung.';
  }
  TW.busy=false;
}
