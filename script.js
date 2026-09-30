// ======== এখানে সময় বদলাতে পারবেন ========
const WAKE="06:00", LEAVE="08:20", WORK_START="15:30", WORK_END="22:00", SLEEP="23:00";
const TRAVEL_HOME=40; // class শেষে বাসায় ফিরতে মিনিট (Friday-তে work এর সময় ঠিক করতে কাজে লাগে)
// 0=Sun 1=Mon ... 6=Sat
const CLASSES={
 1:[["09:00","10:50","Korean Speaking & Listening (1)","Bldg.27 #1410"],["14:00","14:50","Design College Life","Bldg.30 #709"]],
 2:[["09:00","10:50","Electricity and Electronics Basics","Bldg.27 #1407"],["11:00","11:50","Electricity and Electronics Basics","Bldg.27 #1407"]],
 3:[["09:00","10:50","Intro to Computer Science & Programming","Bldg.27 #1407"],["11:00","11:50","Intro to Computer Science & Programming","Bldg.27 #1407"]],
 5:[["09:00","10:50","Korean Vocabulary and Grammar","Bldg.06 #525-1"],["11:00","12:50","Korean Reading and Writing (1)","Bldg.06 #525-1"],["13:00","15:50","Engineering Mathematics","Bldg.27 #1407"]]
};
// দিন অনুযায়ী আলাদা সময়/নাম (যা বদলাতে চান শুধু সেটাই লিখুন)
const OVR={
 0:{wake:"07:00",free:"রবিবার: ঘর গোছানো, shopping, পড়া, বিশ্রাম"},
 4:{free:"বৃহস্পতিবার: self study / assignment"},
 6:{free:"শনিবার: self study, project, বিশ্রাম"}
};
const DEFAULT_TASKS=["Assignment / Homework","আজকের lecture review","Korean study","Exercise"];
// ==========================================
const DN=["রবিবার","সোমবার","মঙ্গলবার","বুধবার","বৃহস্পতিবার","শুক্রবার","শনিবার"];
const DS=["Sun","Mon","Tue","Wed","Thu","Fri","Sat"];
const COL={class:"var(--class)",work:"var(--work)",home:"var(--home)",move:"var(--move)",free:"var(--free)",sleep:"var(--sleep)"};
const m=t=>{const[a,b]=t.split(":");return +a*60+ +b};
const hm=n=>{const h=Math.floor(n/60)%24;return (h%12||12)+":"+String(n%60).padStart(2,"0")+" "+(h>=12?"PM":"AM")};
const $=id=>document.getElementById(id);

function build(d){
  const B=[],c=(CLASSES[d]||[]).map(x=>({s:m(x[0]),e:m(x[1]),t:x[2],p:x[3],k:"class"}));
  const o=OVR[d]||{},wk=m(o.wake||WAKE),lv=m(o.leave||LEAVE),we=m(o.workEnd||WORK_END);
  let ws=m(o.workStart||WORK_START);
  B.push({s:wk,e:lv,t:"উঠা, ready হওয়া ও নাস্তা",k:"home"});
  if(c.length){
    B.push({s:lv,e:c[0].s,t:"Universityতে যাওয়া",k:"move"});
    c.forEach((x,i)=>{
      if(i>0&&x.s>c[i-1].e)B.push({s:c[i-1].e,e:x.s,t:"Break (university)",k:"free"});
      B.push(x);
    });
    const last=c[c.length-1].e;
    if(last+TRAVEL_HOME>ws)ws=last+TRAVEL_HOME;
    B.push({s:last,e:ws,t:"বাসায় ফেরা, খাওয়া ও গোসল",k:"home"});
  }else{
    B.push({s:lv,e:ws,t:o.free||"Free day: self study, খাওয়া ও গোসল",k:"free"});
  }
  B.push({s:ws,e:we,t:"কাজ",k:"work"});
  B.push({s:we,e:m(SLEEP),t:"বাসায় ফেরা, খাওয়া-দাওয়া",k:"home"});
  B.push({s:m(SLEEP),e:1440,t:"ঘুম",k:"sleep"});
  return B;
}

let sel=new Date().getDay();
const key=()=>{const n=new Date();return n.getFullYear()+"-"+(n.getMonth()+1)+"-"+n.getDate()};
function load(k,f){try{const v=localStorage.getItem(k);return v?JSON.parse(v):f}catch(e){return f}}
function save(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}
let tasks=load("rt_tasks",DEFAULT_TASKS);
let done=load("rt_done_"+key(),{});

function renderTabs(){
  const td=new Date().getDay();
  $("tabs").innerHTML=[1,2,3,4,5,6,0].map(d=>`<button class="${d===sel?"on":""} ${d===td?"today":""}" data-d="${d}">${DS[d]}</button>`).join("");
  $("tabs").onclick=e=>{const b=e.target.closest("button");if(b){sel=+b.dataset.d;tick(true)}};
}
function renderTasks(){
  $("tasks").innerHTML=tasks.map((t,i)=>`<div class="task ${done[i]?"d":""}"><input type="checkbox" data-i="${i}" ${done[i]?"checked":""}><span>${t.replace(/</g,"&lt;")}</span><button data-x="${i}" aria-label="মুছুন">×</button></div>`).join("")||'<div class="pg">কোনো task নেই। নিচে যোগ করুন।</div>';
  const n=Object.values(done).filter(Boolean).length;
  $("pg").textContent=tasks.length?`— ${Math.round(n/tasks.length*100)}% done`:"";
}
$("tasks").onclick=e=>{
  if(e.target.dataset.i!==undefined){done[e.target.dataset.i]=e.target.checked;save("rt_done_"+key(),done);renderTasks()}
  if(e.target.dataset.x!==undefined){const i=+e.target.dataset.x;tasks.splice(i,1);done={};save("rt_tasks",tasks);save("rt_done_"+key(),done);renderTasks()}
};
$("ta").onclick=()=>{const v=$("ti").value.trim();if(v){tasks.push(v);$("ti").value="";save("rt_tasks",tasks);renderTasks()}};
$("ti").onkeydown=e=>{if(e.key==="Enter")$("ta").click()};

let alertOn=load("rt_alert",false),lastCur=null,firedPre={};
function beep(){try{const C=new(window.AudioContext||window.webkitAudioContext)(),o=C.createOscillator(),g=C.createGain();o.connect(g);g.connect(C.destination);o.frequency.value=880;g.gain.value=.2;o.start();o.stop(C.currentTime+.5)}catch(e){}}
function notify(msg){
  beep();
  try{navigator.vibrate&&navigator.vibrate([200,100,200])}catch(e){}
  try{if("Notification" in window&&Notification.permission==="granted")new Notification("Routine",{body:msg})}catch(e){}
  const t=$("toast");t.textContent="⏰ "+msg;t.style.display="block";setTimeout(()=>t.style.display="none",8000);
}
function setBell(){$("bell").textContent=alertOn?"🔔 Alert চালু":"🔕 Alert বন্ধ";$("bell").className="bell"+(alertOn?" on":"")}
$("bell").onclick=()=>{
  alertOn=!alertOn;save("rt_alert",alertOn);setBell();
  if(alertOn){beep();try{if("Notification" in window&&Notification.permission==="default")Notification.requestPermission()}catch(e){}}
};
function tick(force){
  const n=new Date(),nm=n.getHours()*60+n.getMinutes(),ns=nm*60+n.getSeconds();
  $("clock").textContent=n.toLocaleTimeString("en-US");
  $("date").textContent=n.toLocaleDateString("bn-BD",{weekday:"long",day:"numeric",month:"long",year:"numeric"});
  const isToday=sel===n.getDay(),B=build(sel);
  if(force===true)renderTabs();
  let cur=-1;
  if(isToday){cur=B.findIndex(b=>nm>=b.s&&nm<b.e);}
  const BT=build(n.getDay()),curT=BT.findIndex(b=>nm>=b.s&&nm<b.e);
  if(alertOn){
    if(lastCur!==null&&curT!==lastCur&&curT>=0)notify(BT[curT].t+" শুরু ("+hm(BT[curT].s)+")");
    const nb=BT[curT+1];
    if(nb&&curT>=0&&nb.k!=="sleep"){const left=nb.s*60-ns,id=key()+nb.s;if(left<=600&&left>0&&!firedPre[id]){firedPre[id]=1;notify("১০ মিনিট পরে: "+nb.t)}}
  }
  lastCur=curT;
  // ঘুম: রাত ১২টার পর থেকে সকাল ৬টা পর্যন্ত
  const pre=isToday&&nm<B[0].s;
  $("tl").innerHTML=B.map((b,i)=>`<li style="--c:${COL[b.k]}" class="${i===cur?"cur":""} ${isToday&&nm>=b.e?"past":""}"><span class="tm">${hm(b.s)}–${b.e>=1440?hm(m(WAKE)):hm(b.e)}</span><div><b>${b.t}</b>${b.p?`<small>📍 ${b.p}</small>`:""}</div></li>`).join("");
  if(!isToday){$("nowbox").innerHTML=`<div class="now"><div class="t">${DN[sel]}</div><div class="sub">${CLASSES[sel]?CLASSES[sel].length+"টি class":"কোনো class নেই — Free day"}</div></div>`;return}
  let b,rem,pct,nx;
  if(pre){b={t:"ঘুম / বিশ্রাম",k:"sleep"};rem=B[0].s*60-ns;pct=0;nx=B[0]}
  else{b=B[cur];rem=b.e*60-ns;pct=Math.min(100,(ns-b.s*60)/((b.e-b.s)*60)*100);nx=B[cur+1]}
  const h=Math.floor(rem/3600),mi=Math.floor(rem%3600/60),s=rem%60;
  $("nowbox").innerHTML=`<div class="now" style="--c:${COL[b.k]}"><div class="lab">এখন চলছে</div><div class="t">${b.t}</div>${b.p?`<div class="lab">📍 ${b.p}</div>`:""}<div class="cd">${String(h).padStart(2,"0")}:${String(mi).padStart(2,"0")}:${String(s).padStart(2,"0")}</div><div class="lab">শেষ হতে বাকি</div><div class="bar"><i style="width:${pct}%"></i></div>${nx?`<div class="next">এরপর: ${hm(nx.s)} — ${nx.t}</div>`:""}</div>`;
}
setBell();renderTabs();renderTasks();tick(true);setInterval(tick,1000);
