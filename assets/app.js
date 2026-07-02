/* Tadabbur site — shared logic: chrome, data, search, tableau */
const BUILD='20260621l';  // bump when data/code changes to bust browser cache
const T = {
  data:{}, // cache
  async load(name){
    if(this.data[name]) return this.data[name];
    const r = await fetch(`./data/${name}.json?v=${BUILD}`);
    if(!r.ok) throw new Error('load '+name);
    return (this.data[name] = await r.json());
  },
  async page(n){ const r=await fetch(`./data/pages/${n}.json?v=${BUILD}`); return r.ok? r.json():null; },
};
const $=(s,el=document)=>el.querySelector(s);
const $$=(s,el=document)=>[...el.querySelectorAll(s)];
const esc=s=>(s==null?'':String(s)).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));

/* ---- chrome (header + footer) ---- */
function chrome(active){
  const nav=[['index','الرئيسية','Home'],['quran','المصحف','Quran map'],['themes','الموضوعات','Themes'],
             ['speakers','المتدبرون','Speakers'],['stats','إحصاءات','Stats'],['about','عن المشروع','About']];
  document.body.insertAdjacentHTML('afterbegin',`
   <header class="hdr"><div class="wrap">
     <a class="brand" href="./index.html"><span class="ar">تدبّر</span><span class="en">Tadabbur</span></a>
     <button class="menu-btn" aria-label="القائمة" id="mbtn">☰</button>
     <nav class="nav" id="nav">${nav.map(([id,ar])=>`<a href="./${id}.html" class="${id===active?'on':''}">${ar}</a>`).join('')}</nav>
     <label class="srch" aria-label="بحث"><span aria-hidden="true">⌕</span>
       <input id="q" type="search" placeholder="ابحث عن صفحة، سورة، متدبّر…" autocomplete="off"></label>
   </div></header>
   <div class="results" id="results" role="listbox" aria-label="نتائج البحث"><div class="results-inner" id="resInner"></div></div>`);
  document.body.insertAdjacentHTML('beforeend',`
   <footer class="ftr"><div class="wrap">
     <div><div class="ar">برنامج تدبّر القرآن الكريم</div>
       <div>ختمة تدبّرية كاملة على مدى ست سنوات — صفحةً صفحة</div>
       <div style="margin-top:5px;opacity:.85">برعاية <a href="./about.html">مركز إتقان لتعليم القرآن · برادفورد</a></div></div>
     <div>المصدر: أرشيف الجلسات + بصمات الأصوات · <a href="./about.html">عن البيانات</a></div>
   </div></footer>`);
  $('#mbtn').onclick=()=>$('#nav').classList.toggle('open');
  initSearch();
}

/* ---- global search ---- */
async function initSearch(){
  const input=$('#q'), box=$('#results'), inner=$('#resInner');
  let idx=null;
  const build=async()=>{
    if(idx) return idx;
    const [pages,speakers,meta]=await Promise.all([T.load('pages'),T.load('speakers'),T.load('meta')]);
    idx={pages,speakers,surahs:meta.surahs,juz:meta.juz};
    return idx;
  };
  const close=()=>{box.classList.remove('open'); inner.innerHTML='';};
  const run=async v=>{
    v=v.trim(); if(!v){close();return;}
    const I=await build(); const q=v.toLowerCase(); const out=[];
    // page number
    if(/^\d{1,3}$/.test(v)){const n=+v; if(n>=1&&n<=604){const p=I.pages[n-1];
      out.push(`<a class="res" href="./page.html?p=${n}"><span class="tag">صفحة ${arNum(n)}</span><span><b>${esc(p.surah.ar)}</b> · <span class="sub">${esc(p.surah.en)} — جزء ${arNum(p.juz)}</span></span></a>`);}}
    // surahs
    I.surahs.filter(s=>s.ar.includes(v)||s.en.toLowerCase().includes(q)).slice(0,6).forEach(s=>
      out.push(`<a class="res" href="./quran.html?surah=${s.num}"><span class="tag s">سورة</span><span><b>${esc(s.ar)}</b> <span class="sub">${esc(s.en)} · صفحات ${arNum(s.page_start)}–${arNum(s.page_end)}</span></span></a>`));
    // speakers
    I.speakers.filter(s=>(s.name&&s.name.includes(v))||(s.full_name&&s.full_name.includes(v))).slice(0,6).forEach(s=>
      out.push(`<a class="res" href="./speaker.html?v=${encodeURIComponent(s.voice_code||s.name)}"><span class="tag" style="background:var(--green-deep)">متدبّر</span><span><b>${esc(s.full_name||s.name)}</b> <span class="sub">${arNum(s.presentations)} تدبّر · ${arNum(s.pages_count)} صفحة</span></span></a>`));
    inner.innerHTML = out.length? out.join('') : `<div class="empty">لا نتائج لـ «${esc(v)}»</div>`;
    box.classList.add('open');
  };
  let t; input.addEventListener('input',e=>{clearTimeout(t); t=setTimeout(()=>run(e.target.value),120);});
  input.addEventListener('keydown',e=>{if(e.key==='Escape'){input.value='';close();}});
  document.addEventListener('click',e=>{if(!box.contains(e.target)&&e.target!==input)close();});
}

/* ---- 604-page tableau ---- */
function renderTableau(host, pages, surahs, {anim=false,light=false}={}){
  const sstart=new Set(surahs.map(s=>s.page_start));
  host.className='tableau'+(anim?' anim':'')+(light?' light':'');
  host.innerHTML=pages.map(p=>{
    // colour = which ختمة covers this page (both / first / second); a single "issue" key
    // marks pages that are missing, untranscribed, or doubted.
    const cls=p.issue?'issue':(p.cov||'issue');
    const ss=sstart.has(p.page)?' sstart':'';
    const st=p.issue?'ناقصة · بحاجة لمراجعة'
      :p.cov==='both'?'في الختمتين'
      :p.cov==='t1'?'الختمة الأولى'
      :p.cov==='t2'?'الختمة الثانية':'—';
    return `<a class="tile ${cls}${ss}" href="./page.html?p=${p.page}" style="${anim?`animation-delay:${(p.page*0.45)}ms`:''}"
      title="صفحة ${arNum(p.page)} — ${p.surah.ar} · ${st}"></a>`;
  }).join('');
}

const qp=k=>new URLSearchParams(location.search).get(k);
function fmtDate(d){if(!d)return'';const[y,m,da]=d.split('-');const M=['','يناير','فبراير','مارس','أبريل','مايو','يونيو','يوليو','أغسطس','سبتمبر','أكتوبر','نوفمبر','ديسمبر'];return`${+da} ${M[+m]} ${y}`;}

/* ---- gold helpers (shared by page.html + themes.html) ---- */
const arNum=s=>String(s==null?'':s).replace(/[0-9]/g,d=>'٠١٢٣٤٥٦٧٨٩'[d]);
const mmssToSec=t=>{if(!t)return 0;const p=String(t).split(':').map(Number);return p.length===3?p[0]*3600+p[1]*60+p[2]:p.length===2?p[0]*60+p[1]:0;};
const ytAt=(id,sec)=>`https://www.youtube.com/watch?v=${id}&t=${Math.max(0,Math.round(sec))}s`;
/* style inline ayah refs [27:34] as links and [تصحيح لاحق …] as annotations */
function linkify(text){
  let s=esc(text||'');
  s=s.replace(/\[تصحيح لاحق([^\]]*)\]/g,(m,b)=>`<span class="correction">${b.replace(/^\s*من\s*/,'').trim()||'تصحيح'}</span>`);
  s=s.replace(/\[(\d{1,3}):(\d{1,3})(?:-\d{1,3}:\d{1,3})?\]/g,(m,su,ay)=>
    `<a class="qref" href="https://quran.com/${su}/${ay}" target="_blank" rel="noopener">${arNum(su)}:${arNum(ay)}</a>`);
  return s;
}
function confDot(c){
  const s=String(c||'').toLowerCase();
  if(s==='high')return['hi','عالية'];
  if(s==='substitute')return['hi','عالية (نائب)'];
  if(s==='medium')return['mid','متوسطة'];
  if(s==='manual-handoff'||s==='uncertain'||s==='low'||s==='unnamed-voice')return['lo','مبدئية'];
  const v=+c||0; if(v>=.9)return['hi','عالية']; if(v>=.7)return['mid','متوسطة']; return['lo','مبدئية'];
}
