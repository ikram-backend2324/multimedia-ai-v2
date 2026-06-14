(function(){
"use strict";
const $=s=>document.querySelector(s),$$=s=>[...document.querySelectorAll(s)];
const reduce=window.matchMedia("(prefers-reduced-motion:reduce)").matches;

/* ---- ROBUST SCRIPT LOADER (CDN fallback) ---- */
// Tries each URL in order until one loads. Returns a promise.
function loadScriptWithFallback(urls){
  return new Promise((resolve,reject)=>{
    let i=0;
    function tryNext(){
      if(i>=urls.length){reject(new Error("ALL_CDN_FAILED"));return;}
      const url=urls[i++];
      const s=document.createElement("script");
      s.src=url;s.async=true;
      s.onload=()=>resolve(url);
      s.onerror=()=>{s.remove();tryNext();};
      document.head.appendChild(s);
    }
    tryNext();
  });
}
window.loadScriptWithFallback=loadScriptWithFallback;

/* ---- NAV ---- */
const nav=$("#nav"),burger=$("#burger"),links=$(".nav-links");
addEventListener("scroll",()=>nav.classList.toggle("scrolled",scrollY>30),{passive:true});
burger?.addEventListener("click",()=>{burger.classList.toggle("x");links.classList.toggle("open")});
$$(".nav-links a").forEach(a=>a.addEventListener("click",()=>{burger.classList.remove("x");links.classList.remove("open")}));

/* ---- REVEAL ---- */
const io=new IntersectionObserver((es)=>es.forEach(e=>{
  if(e.isIntersecting){e.target.classList.add("in");io.unobserve(e.target);
    if(e.target.id==="accChart")runBars();
  }
}),{threshold:.18});
$$(".reveal").forEach((el,i)=>{el.style.transitionDelay=(i%4*60)+"ms";io.observe(el)});
const accEl=$("#accChart");if(accEl)io.observe(accEl);

/* ---- COUNTERS ---- */
$$("[data-count]").forEach(el=>{
  const co=new IntersectionObserver(es=>es.forEach(e=>{
    if(!e.isIntersecting)return;co.unobserve(el);
    const end=+el.dataset.count,isYr=end>1000,dur=1400,t0=performance.now();
    (function tick(t){const p=Math.min((t-t0)/dur,1),ease=1-Math.pow(1-p,3);
      el.textContent=isYr?Math.round(end*ease):Math.floor(end*ease);
      if(p<1)requestAnimationFrame(tick);else el.textContent=end;})(t0);
  }),{threshold:.5});co.observe(el);
});

/* ---- BAR CHART ---- */
function runBars(){$$(".bar-fill").forEach((b,i)=>setTimeout(()=>{
  b.style.width=b.dataset.val+"%";b.classList.add("go");},i*140));}

/* ---- HERO PARTICLES ---- */
const hc=$("#heroCanvas");
if(hc&&!reduce){
  const ctx=hc.getContext("2d");let W,H,parts=[];
  const cols=["#22d3ee","#f472b6","#fbbf24"];
  function size(){W=hc.width=hc.offsetWidth;H=hc.height=hc.offsetHeight;
    const n=Math.min(70,Math.floor(W/22));parts=Array.from({length:n},()=>({
      x:Math.random()*W,y:Math.random()*H,vx:(Math.random()-.5)*.4,vy:(Math.random()-.5)*.4,
      r:Math.random()*2+1,c:cols[Math.floor(Math.random()*3)]}));}
  size();addEventListener("resize",size);
  (function loop(){ctx.clearRect(0,0,W,H);
    for(let i=0;i<parts.length;i++){const p=parts[i];p.x+=p.vx;p.y+=p.vy;
      if(p.x<0||p.x>W)p.vx*=-1;if(p.y<0||p.y>H)p.vy*=-1;
      ctx.beginPath();ctx.arc(p.x,p.y,p.r,0,7);ctx.fillStyle=p.c;ctx.globalAlpha=.7;ctx.fill();
      for(let j=i+1;j<parts.length;j++){const q=parts[j],dx=p.x-q.x,dy=p.y-q.y,d=Math.hypot(dx,dy);
        if(d<120){ctx.globalAlpha=(1-d/120)*.18;ctx.strokeStyle=p.c;ctx.lineWidth=1;
          ctx.beginPath();ctx.moveTo(p.x,p.y);ctx.lineTo(q.x,q.y);ctx.stroke();}}}
    ctx.globalAlpha=1;requestAnimationFrame(loop);})();
}

/* ---- RADAR CHART ---- */
const rc=$("#radarCanvas");
if(rc){
  const ctx=rc.getContext("2d");
  const axes=["Sifat","Tezlik","Barqarorlik","Xilma-xillik","Sodda o'qitish"];
  const data=[
    {c:"#22d3ee",v:[.7,.95,.55,.6,.5]},   // GAN
    {c:"#f472b6",v:[.95,.5,.9,.92,.7]},   // Diffusion
    {c:"#fbbf24",v:[.85,.4,.8,.75,.85]}   // Autoregressive
  ];
  const N=axes.length;let prog=0,started=false,cx,cy,R,S;
  function size(){
    const dpr=window.devicePixelRatio||1;
    S=rc.clientWidth||rc.offsetWidth||440;
    rc.width=S*dpr;rc.height=S*dpr;ctx.setTransform(dpr,0,0,dpr,0,0);
    cx=S/2;cy=S/2;R=S*0.34;
    if(started)render();
  }
  function grid(){ctx.clearRect(0,0,S,S);
    for(let ring=1;ring<=4;ring++){ctx.beginPath();
      for(let i=0;i<=N;i++){const a=Math.PI*2*i/N-Math.PI/2,r=R*ring/4;
        const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
      ctx.strokeStyle="rgba(255,255,255,.07)";ctx.lineWidth=1;ctx.stroke();}
    ctx.fillStyle="#8a93b2";ctx.font=`${Math.max(9,S*0.026)}px 'JetBrains Mono',monospace`;ctx.textAlign="center";
    for(let i=0;i<N;i++){const a=Math.PI*2*i/N-Math.PI/2,x=cx+Math.cos(a)*(R+S*0.06),y=cy+Math.sin(a)*(R+S*0.06);
      ctx.fillText(axes[i],x,y+4);}
  }
  function shape(d,p){ctx.beginPath();
    for(let i=0;i<=N;i++){const idx=i%N,a=Math.PI*2*idx/N-Math.PI/2,r=R*d.v[idx]*p;
      const x=cx+Math.cos(a)*r,y=cy+Math.sin(a)*r;i?ctx.lineTo(x,y):ctx.moveTo(x,y);}
    ctx.closePath();ctx.fillStyle=d.c+"22";ctx.fill();ctx.strokeStyle=d.c;ctx.lineWidth=2;ctx.stroke();
    for(let i=0;i<N;i++){const a=Math.PI*2*i/N-Math.PI/2,r=R*d.v[i]*p;
      ctx.beginPath();ctx.arc(cx+Math.cos(a)*r,cy+Math.sin(a)*r,3,0,7);ctx.fillStyle=d.c;ctx.fill();}
  }
  function render(){grid();data.forEach(d=>shape(d,prog));}
  function draw(){render();if(prog<1){prog=Math.min(prog+.03,1);requestAnimationFrame(draw);}}
  size();addEventListener("resize",size);
  const ro=new IntersectionObserver(es=>es.forEach(e=>{
    if(e.isIntersecting&&!started){started=true;reduce?(prog=1,render()):draw();}}),{threshold:.3});
  ro.observe(rc);
}

/* ---- LIVE SCHEMA ---- */
const sc=$("#schemaCanvas");
if(sc&&!reduce){
  const ctx=sc.getContext("2d");let W,H;
  const lanes=[{y:.18,c:"#22d3ee"},{y:.5,c:"#f472b6"},{y:.82,c:"#fbbf24"}];
  let pkts=[];
  function size(){W=sc.width=sc.offsetWidth;H=sc.height=sc.offsetHeight;}
  size();addEventListener("resize",size);
  function spawn(){const l=lanes[Math.floor(Math.random()*3)];
    pkts.push({x:W*.12,y:H*l.y,c:l.c,sy:H*l.y,phase:0,sp:.004+Math.random()*.004});}
  let last=0;
  function loop(t){ctx.clearRect(0,0,W,H);
    const coreX=W*.5,coreY=H*.5,outX=W*.88;
    // connections to core
    ctx.lineWidth=1.4;
    lanes.forEach(l=>{ctx.beginPath();ctx.moveTo(W*.12,H*l.y);
      ctx.quadraticCurveTo(W*.32,H*l.y,coreX,coreY);
      ctx.strokeStyle=l.c+"33";ctx.stroke();});
    ctx.beginPath();ctx.moveTo(coreX,coreY);ctx.lineTo(outX,coreY);
    ctx.strokeStyle="rgba(255,255,255,.18)";ctx.stroke();
    // core
    const pr=26+Math.sin(t/400)*3;
    const g=ctx.createRadialGradient(coreX,coreY,2,coreX,coreY,pr+18);
    g.addColorStop(0,"rgba(244,114,182,.9)");g.addColorStop(.5,"rgba(34,211,238,.5)");g.addColorStop(1,"transparent");
    ctx.fillStyle=g;ctx.beginPath();ctx.arc(coreX,coreY,pr+18,0,7);ctx.fill();
    ctx.fillStyle="#0a0d1a";ctx.beginPath();ctx.arc(coreX,coreY,pr-6,0,7);ctx.fill();
    ctx.strokeStyle="rgba(255,255,255,.5)";ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(coreX,coreY,pr-6,0,7);ctx.stroke();
    // output node
    ctx.fillStyle="rgba(251,191,36,.9)";ctx.beginPath();ctx.arc(outX,coreY,7,0,7);ctx.fill();
    // packets
    if(t-last>360){spawn();last=t;}
    pkts.forEach(p=>{p.phase+=p.sp;
      let x,y;
      if(p.phase<.5){const tt=p.phase*2;x=W*.12+(coreX-W*.12)*tt;
        y=p.sy+(coreY-p.sy)*tt*tt;}
      else{const tt=(p.phase-.5)*2;x=coreX+(outX-coreX)*tt;y=coreY;}
      p.x=x;p.y=y;
      ctx.beginPath();ctx.arc(x,y,3.5,0,7);ctx.fillStyle=p.phase<.5?p.c:"#fbbf24";
      ctx.shadowBlur=10;ctx.shadowColor=ctx.fillStyle;ctx.fill();ctx.shadowBlur=0;});
    pkts=pkts.filter(p=>p.phase<1);
    requestAnimationFrame(loop);}
  const so=new IntersectionObserver(es=>es.forEach(e=>{
    if(e.isIntersecting){requestAnimationFrame(loop);so.disconnect();}}),{threshold:.2});
  so.observe(sc);
}

/* ---- CHAT ---- */
const form=$("#chatForm"),input=$("#chatText"),body=$("#chatBody"),send=$("#chatSend");
let history=[],busy=false;
function add(role,text){const m=document.createElement("div");m.className="msg "+(role==="user"?"user":"bot");
  const b=document.createElement("div");b.className="bubble";b.textContent=text;m.appendChild(b);
  body.appendChild(m);body.scrollTop=body.scrollHeight;return b;}
function typing(){const m=document.createElement("div");m.className="msg bot";m.id="typing";
  m.innerHTML='<div class="bubble typing"><i></i><i></i><i></i></div>';body.appendChild(m);
  body.scrollTop=body.scrollHeight;}
function rmTyping(){$("#typing")?.remove();}
async function ask(text){
  if(busy||!text.trim())return;busy=true;send.disabled=true;
  add("user",text);history.push({role:"user",content:text});
  input.value="";typing();
  try{
    const r=await fetch(window.CHAT_URL,{method:"POST",
      headers:{"Content-Type":"application/json","X-CSRFToken":window.CSRF},
      body:JSON.stringify({message:text,history})});
    const d=await r.json();rmTyping();
    if(d.reply){add("bot",d.reply);history.push({role:"assistant",content:d.reply});}
    else add("bot",d.error||window.I18N.error);
  }catch(e){rmTyping();add("bot",window.I18N.error);}
  busy=false;send.disabled=false;input.focus();
}
form?.addEventListener("submit",e=>{e.preventDefault();ask(input.value);});
$$("#chatSuggest button").forEach(b=>b.addEventListener("click",()=>ask(b.textContent)));

/* ---- DEMO 1: DIFFUSION (noise -> image) ---- */
const dc=$("#diffCanvas"),dSlider=$("#diffSlider"),dStep=$("#diffStep");
if(dc){
  const ctx=dc.getContext("2d"),N=300;
  // A simple target "image": a soft gradient circle (the thing we denoise toward)
  function target(x,y){
    const dx=x-150,dy=y-150,dist=Math.hypot(dx,dy)/150;
    const r=Math.max(0,1-dist);
    return [r*60+20, r*180+30, r*220+30]; // teal-ish glow
  }
  function render(noiseLevel){
    const img=ctx.createImageData(N,N),d=img.data;
    for(let y=0;y<N;y+=2)for(let x=0;x<N;x+=2){
      const [tr,tg,tb]=target(x,y);
      const n=()=>(Math.random()-.5)*255*noiseLevel;
      const r=Math.min(255,Math.max(0,tr+n())),g=Math.min(255,Math.max(0,tg+n())),b=Math.min(255,Math.max(0,tb+n()));
      for(let dy=0;dy<2;dy++)for(let dx=0;dx<2;dx++){
        const i=((y+dy)*N+(x+dx))*4;d[i]=r;d[i+1]=g;d[i+2]=b;d[i+3]=255;}
    }
    ctx.putImageData(img,0,0);
  }
  function update(){
    const noise=+dSlider.value/100;       // 1 = full noise, 0 = clean
    render(noise);
    const step=Math.round((1-noise)*20);
    if(dStep)dStep.textContent=(dStep.dataset.label||"Step")+`: ${step} / 20`;
  }
  // capture label prefix from current text
  if(dStep)dStep.dataset.label=dStep.textContent.split(":")[0];
  dSlider.addEventListener("input",update);
  const dio=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){update();dio.disconnect();}}),{threshold:.3});
  dio.observe(dc);
}

/* ---- DEMO 2: CNN CONVOLUTION (sliding filter) ---- */
const cc=$("#cnnCanvas"),cnnPlay=$("#cnnPlay"),cnnInfo=$("#cnnInfo");
if(cc){
  const ctx=cc.getContext("2d"),GRID=10,CELL=30;
  // build a simple pattern (a diagonal shape) as the "input image"
  const grid=[];
  for(let y=0;y<GRID;y++){grid[y]=[];for(let x=0;x<GRID;x++){
    grid[y][x]=(Math.abs(x-y)<2||x+y>14)?1:0.08;}}
  let fx=0,fy=0,playing=false,raf;
  function drawGrid(){
    ctx.clearRect(0,0,300,300);
    for(let y=0;y<GRID;y++)for(let x=0;x<GRID;x++){
      const v=grid[y][x];
      ctx.fillStyle=`rgba(34,211,238,${v})`;
      ctx.fillRect(x*CELL+1,y*CELL+1,CELL-2,CELL-2);
    }
    // filter 3x3 highlight
    ctx.strokeStyle="#f472b6";ctx.lineWidth=3;
    ctx.strokeRect(fx*CELL,fy*CELL,CELL*3,CELL*3);
    ctx.fillStyle="rgba(244,114,182,.12)";
    ctx.fillRect(fx*CELL,fy*CELL,CELL*3,CELL*3);
  }
  function step(){
    fx++;if(fx>GRID-3){fx=0;fy++;if(fy>GRID-3){fy=0;}}
    drawGrid();
    if(playing)raf=setTimeout(()=>requestAnimationFrame(step),180);
  }
  drawGrid();
  cnnPlay?.addEventListener("click",()=>{
    playing=!playing;
    cnnPlay.textContent=playing?(cnnPlay.dataset.stop||"Stop"):(cnnPlay.dataset.start||cnnPlay.textContent);
    if(!cnnPlay.dataset.start){cnnPlay.dataset.start=cnnPlay.textContent;cnnPlay.dataset.stop="⏸";}
    if(playing)step();else clearTimeout(raf);
  });
  const cio=new IntersectionObserver(es=>es.forEach(e=>{if(e.isIntersecting){drawGrid();cio.disconnect();}}),{threshold:.3});
  cio.observe(cc);
}

/* ---- IMAGE DETECTION (TensorFlow.js + MobileNet + Three.js + AI describe) ---- */
(function(){
  const wrap=$("#detect");if(!wrap)return;
  const T=window.I18N||{},LABELS=window.LABELS||{};
  let model=null,modelLoading=false,stream=null,netAnim=null;
  // Selected model config: {key, alpha, hi(=use 224 input), vision(=use server-side multimodal)}
  let modelCfg={key:"balanced",alpha:1.0,hi:false,vision:false};
  let loadedKey=null; // which model variant is currently loaded

  // Elements
  const result=$("#detResult"),
        statusEl=$("#detStatus"),statusText=$("#detStatusText"),
        mainBox=$("#detMain"),mainName=$("#detMainName"),mainEn=$("#detMainEn"),
        modelUsed=$("#detModelUsed"),
        ringBox=$("#detRing"),ringFg=$("#detRingFg"),ringPct=$("#detRingPct"),
        aiBadge=$("#detAiBadge"),
        othersBox=$("#detOthers"),predBox=$("#detPredictions"),
        vizBox=$("#detViz"),netCanvas=$("#detNet"),cnnBox=$("#detCnn"),
        descBox=$("#detDesc"),descBody=$("#detDescBody"),descModelEl=$(".det-desc-model"),
        scanEl=$("#detScan"),previewImg=$("#previewImg");

  // Model selector buttons
  $$(".det-model").forEach(btn=>btn.addEventListener("click",()=>{
    $$(".det-model").forEach(x=>x.classList.remove("active"));
    btn.classList.add("active");
    const isVision=btn.dataset.vision==="1";
    modelCfg={
      key:btn.dataset.model,
      alpha:parseFloat(btn.dataset.alpha||"1.0"),
      hi:btn.dataset.hi==="1",
      vision:isVision
    };
    // If a different MobileNet variant than loaded, drop cached model so next run reloads.
    // Vision mode doesn't use the in-browser model at all.
    if(!isVision&&loadedKey&&loadedKey!==modelCfg.key){model=null;loadedKey=null;}
  }));

  // Tabs
  $$(".det-tab").forEach(t=>t.addEventListener("click",()=>{
    $$(".det-tab").forEach(x=>x.classList.remove("active"));
    $$(".det-panel").forEach(x=>x.classList.remove("active"));
    t.classList.add("active");
    $("#panel-"+t.dataset.tab).classList.add("active");
    if(t.dataset.tab!=="camera")stopCam();
  }));

  function setStatus(text,spinning){
    statusEl.classList.remove("hidden");
    statusText.textContent=text;
    statusEl.querySelector(".det-spinner").style.display=spinning?"block":"none";
  }
  function hideStatus(){statusEl.classList.add("hidden");}

  async function loadLibs(){
    // Load TensorFlow.js (try jsdelivr -> unpkg -> cdnjs)
    if(typeof tf==="undefined"){
      setStatus(T.modelLoading||"Loading model...",true);
      await loadScriptWithFallback([
        "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.20.0/dist/tf.min.js",
        "https://unpkg.com/@tensorflow/tfjs@4.20.0/dist/tf.min.js",
        "https://cdnjs.cloudflare.com/ajax/libs/tensorflow/4.20.0/tf.min.js"
      ]);
    }
    // Load MobileNet model wrapper (try jsdelivr -> unpkg)
    if(typeof mobilenet==="undefined"){
      await loadScriptWithFallback([
        "https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js",
        "https://unpkg.com/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js"
      ]);
    }
  }

  // Local model bor-yo'qligini tekshirish (static/models/<key>/model.json)
  const localModelCache={}; // key -> true/false
  async function hasLocalModel(key){
    if(key in localModelCache)return localModelCache[key];
    if(!window.MODELS_BASE){localModelCache[key]=false;return false;}
    try{
      const url=window.MODELS_BASE+key+"/model.json";
      const r=await fetch(url,{method:"HEAD"});
      localModelCache[key]=r.ok;
      return r.ok;
    }catch(e){localModelCache[key]=false;return false;}
  }

  async function ensureModel(){
    if(model&&loadedKey===modelCfg.key)return model;
    if(modelLoading){await new Promise(r=>{const i=setInterval(()=>{if(model){clearInterval(i);r();}},100);});return model;}
    modelLoading=true;
    try{
      await loadLibs();
    }catch(e){
      modelLoading=false;
      throw new Error("CDN_NOT_LOADED");
    }
    if(typeof mobilenet==="undefined"||typeof tf==="undefined"){
      modelLoading=false;throw new Error("CDN_NOT_LOADED");
    }
    try{
      // 1-USTUVOR: o'z saytimizdagi model (Google'ga bog'liq emas, QUIC xatosi yo'q)
      const useLocal=await hasLocalModel(modelCfg.key);
      if(useLocal){
        const localUrl=window.MODELS_BASE+modelCfg.key+"/model.json";
        // mobilenet.load modelUrl bilan: o'z hostimizdan yuklaydi
        model=await mobilenet.load({
          version:2,
          alpha:modelCfg.alpha,
          modelUrl:localUrl
        });
      }else{
        // 2-ZAXIRA: Google CDN (agar local model yuklanmagan bo'lsa)
        model=await mobilenet.load({version:2,alpha:modelCfg.alpha});
      }
    }catch(e){
      // Local muvaffaqiyatsiz bo'lsa, oxirgi marta Google'dan urinish
      try{
        model=await mobilenet.load({version:2,alpha:modelCfg.alpha});
      }catch(e2){
        modelLoading=false;
        throw new Error("MODEL_LOAD_FAILED");
      }
    }
    loadedKey=modelCfg.key;
    modelLoading=false;
    return model;
  }

  function translate(name){
    const parts=name.split(",").map(s=>s.trim());
    for(const p of parts){if(LABELS[p])return{uz:LABELS[p],en:parts[0]};}
    for(const p of parts){const lc=p.toLowerCase();
      for(const k in LABELS){if(k.toLowerCase()===lc)return{uz:LABELS[k],en:parts[0]};}}
    return{uz:null,en:parts[0]};
  }

  function resetPanels(){
    mainBox.hidden=true;othersBox.hidden=true;vizBox.hidden=true;descBox.hidden=true;
    predBox.innerHTML="";
    // Restore default headline layout: ring shown, AI badge hidden
    if(ringBox)ringBox.style.display="";
    if(aiBadge)aiBadge.hidden=true;
    if(netAnim){cancelAnimationFrame(netAnim);netAnim=null;}
  }

  async function classify(imgEl){
    result.hidden=false;
    resetPanels();
    result.scrollIntoView({behavior:"smooth",block:"start"});
    scanEl.classList.add("run");
    // Vision (server-side multimodal) path
    if(modelCfg.vision){
      try{
        await classifyVision(imgEl);
      }catch(e){
        console.error(e);
        scanEl.classList.remove("run");
        showError(e&&e.message?e.message:(T.visionError||"Vision AI error."),imgEl);
      }
      return;
    }
    // MobileNet (in-browser) path
    try{
      const m=await ensureModel();
      setStatus(T.analyzing||"Analyzing...",true);
      // "accurate" mode requests more candidates for a finer top-3
      const topk=modelCfg.hi?5:3;
      const preds=await m.classify(imgEl,topk);
      scanEl.classList.remove("run");
      hideStatus();
      render(preds.slice(0,3));
    }catch(e){
      console.error(e);
      scanEl.classList.remove("run");
      const msg=(e.message==="CDN_NOT_LOADED"||e.message==="MODEL_LOAD_FAILED")
        ? (T.cdnError||"AI model load failed.")
        : (T.detectError||"Error analyzing image.");
      showError(msg,imgEl);
    }
  }

  // Shared error renderer with a retry button
  function showError(msg,imgEl){
    statusEl.classList.remove("hidden");
    statusEl.querySelector(".det-spinner").style.display="none";
    statusText.innerHTML=`${msg} `;
    const retry=document.createElement("button");
    retry.className="det-retry-btn";
    retry.textContent=T.retry||"Qayta urinish";
    retry.onclick=()=>{
      if(!modelCfg.vision){model=null;loadedKey=null;modelLoading=false;}
      classify(imgEl);
    };
    statusText.appendChild(retry);
  }

  const MODEL_NAMES={fast:"MobileNetV2 (Tez)",balanced:"MobileNetV2 (Balans)",accurate:"MobileNetV2 (Aniq)",vision:"AI Vision"};

  // ---- VISION (server-side multimodal) ----
  // Downscale the loaded <img> into a JPEG data URL. Cap at maxDim px so we
  // ship far fewer bytes than the raw camera/upload (saves OpenRouter tokens
  // and stays well under the 2MB backend cap).
  function imageToBase64(imgEl,maxDim=1024,quality=0.85){
    const cv=document.createElement("canvas");
    let w=imgEl.naturalWidth||imgEl.width,h=imgEl.naturalHeight||imgEl.height;
    if(!w||!h)throw new Error("IMAGE_NOT_READY");
    if(w>maxDim||h>maxDim){
      if(w>=h){h=Math.round(h*maxDim/w);w=maxDim;}
      else{w=Math.round(w*maxDim/h);h=maxDim;}
    }
    cv.width=w;cv.height=h;
    cv.getContext("2d").drawImage(imgEl,0,0,w,h);
    return cv.toDataURL("image/jpeg",quality);
  }

  async function classifyVision(imgEl){
    setStatus(T.visionAnalyzing||"AI rasmni ko'rib chiqmoqda...",true);
    const dataUrl=imageToBase64(imgEl,1024,0.85);
    const r=await fetch(window.VISION_URL,{
      method:"POST",
      headers:{"Content-Type":"application/json","X-CSRFToken":window.CSRF},
      body:JSON.stringify({image:dataUrl})
    });
    let d={};
    try{d=await r.json();}catch(e){/* non-JSON body */}
    scanEl.classList.remove("run");
    if(!r.ok){
      // Map server status codes to localized messages.
      // 413 = too large; 502/503/504 = upstream / config / timeout.
      let msg;
      if(r.status===413)msg=T.visionTooLarge||d.error||"Image too large.";
      else msg=d.error||T.visionError||"Vision AI error.";
      throw new Error(msg);
    }
    if(!d.description||!d.object){
      throw new Error(T.visionError||"Empty response from vision model.");
    }
    hideStatus();
    renderVision(d);
  }

  function renderVision(d){
    // Headline: object name (no English subtitle, no confidence ring, no warning)
    mainName.textContent=d.object;
    mainEn.textContent="";
    mainBox.hidden=false;
    if(modelUsed){
      modelUsed.hidden=false;
      modelUsed.textContent=(T.modelUsed||"Model")+": "+(MODEL_NAMES.vision||"AI Vision");
    }
    // Hide confidence ring + warning, show AI-analysis badge instead
    if(ringBox)ringBox.style.display="none";
    const warnEl=$("#detWarn");if(warnEl)warnEl.hidden=true;
    if(aiBadge)aiBadge.hidden=false;

    // No "other predictions" in vision mode — a multimodal model returns one answer
    othersBox.hidden=true;

    // Decorative visualizations still look nice in this mode
    vizBox.hidden=false;
    buildCnn();
    start3DNet();

    // Description: reuse the same renderer as describe_api responses
    descBox.hidden=false;
    if(descModelEl&&d.model){
      // Show short model id (last path segment) so the badge stays compact
      const short=String(d.model).split("/").pop();
      descModelEl.textContent=short;
    }
    renderDescription(d.description);
  }
  // ---- /VISION ----

  function render(preds){
    const top=preds[0];
    const {uz,en}=translate(top.className);
    const pct=top.probability*100;

    // Primary result
    mainName.textContent=uz||en;
    mainEn.textContent=uz?en:"";
    mainBox.hidden=false;
    // Model used badge
    if(modelUsed){
      modelUsed.hidden=false;
      modelUsed.textContent=(T.modelUsed||"Model")+": "+(MODEL_NAMES[modelCfg.key]||modelCfg.key);
    }
    // Low-confidence warning
    const warnEl=$("#detWarn");
    if(warnEl){
      if(pct<40){warnEl.hidden=false;warnEl.textContent=T.lowConf||"Ishonch past — natija noto'g'ri bo'lishi mumkin.";}
      else{warnEl.hidden=true;}
    }
    // Ring animation
    ringFg.style.strokeDashoffset="327";
    setTimeout(()=>{
      const circ=327;
      ringFg.style.strokeDashoffset=String(circ-(circ*pct/100));
      animateNumber(ringPct,pct);
    },200);

    // Other predictions
    predBox.innerHTML="";
    preds.forEach((p,i)=>{
      const tr=translate(p.className),pc=(p.probability*100).toFixed(1);
      const div=document.createElement("div");
      div.className="det-pred";div.style.animationDelay=(i*0.1)+"s";
      div.innerHTML=`<div class="det-pred-top">
          <span class="det-pred-name">${tr.uz||tr.en}${tr.uz?`<span class="det-pred-en">${tr.en}</span>`:""}</span>
          <span class="det-pred-pct">${pc}%</span></div>
        <div class="det-pred-bar"><div class="det-pred-fill"></div></div>`;
      predBox.appendChild(div);
      setTimeout(()=>{div.querySelector(".det-pred-fill").style.width=pc+"%";},i*120+300);
    });
    othersBox.hidden=false;

    // Visualizations
    vizBox.hidden=false;
    buildCnn();
    start3DNet();

    // AI description (in chosen language)
    fetchDescription(en,uz);
  }

  function animateNumber(el,end){
    const dur=1300,t0=performance.now();
    (function tick(t){const p=Math.min((t-t0)/dur,1),e=1-Math.pow(1-p,3);
      el.textContent=(end*e).toFixed(1)+"%";
      if(p<1)requestAnimationFrame(tick);})(t0);
  }

  // ---- CNN schema (animated) ----
  function buildCnn(){
    cnnBox.innerHTML="";
    const layers=[{n:6,c:"var(--img)",l:"Input"},{n:5,c:"var(--img)",l:"Conv 1"},
      {n:4,c:"var(--aud)",l:"Conv 2"},{n:3,c:"var(--aud)",l:"Pool"},
      {n:2,c:"var(--vid)",l:"Dense"},{n:1,c:"var(--vid)",l:"Output"}];
    layers.forEach((L,i)=>{
      const div=document.createElement("div");
      div.className="det-cnn-layer";div.style.animationDelay=(i*0.12)+"s";
      const grid=document.createElement("div");
      grid.className="det-cnn-grid";grid.style.gridTemplateColumns=`repeat(${L.n},1fr)`;
      for(let k=0;k<L.n*L.n;k++){
        const cell=document.createElement("div");
        cell.className="det-cnn-cell";
        cell.style.background=L.c;cell.style.opacity=(0.25+Math.random()*0.75).toFixed(2);
        grid.appendChild(cell);
      }
      const lab=document.createElement("span");lab.className="det-cnn-label";lab.textContent=L.l;
      div.appendChild(grid);div.appendChild(lab);
      cnnBox.appendChild(div);
      if(i<layers.length-1){
        const ar=document.createElement("span");ar.className="det-cnn-arrow";ar.textContent="\u203A";
        cnnBox.appendChild(ar);
      }
    });
  }

  // ---- 3D neural network (Three.js) ----
  async function start3DNet(){
    // Lazy-load Three.js with CDN fallback; if it fails, hide the 3D card gracefully
    if(typeof THREE==="undefined"){
      try{
        await loadScriptWithFallback([
          "https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.min.js",
          "https://unpkg.com/three@0.160.0/build/three.min.js",
          "https://cdnjs.cloudflare.com/ajax/libs/three.js/0.160.0/three.min.js"
        ]);
      }catch(e){/* ignore — 3D is optional */}
    }
    if(typeof THREE==="undefined"){netCanvas.parentElement.parentElement.style.display="none";return;}
    netCanvas.parentElement.parentElement.style.display="";
    const W=netCanvas.clientWidth||400,H=netCanvas.clientHeight||250;
    const scene=new THREE.Scene();
    const cam=new THREE.PerspectiveCamera(50,W/H,0.1,100);cam.position.set(0,0,9);
    const renderer=new THREE.WebGLRenderer({canvas:netCanvas,antialias:true,alpha:true});
    renderer.setSize(W,H,false);renderer.setPixelRatio(Math.min(devicePixelRatio,2));

    const cols=[0x22d3ee,0xf472b6,0xfbbf24];
    const layers=[5,7,7,4],group=new THREE.Group(),nodes=[];
    const xGap=3.4,xStart=-(layers.length-1)*xGap/2;
    layers.forEach((cnt,li)=>{
      const yGap=1.0,yStart=-(cnt-1)*yGap/2;
      nodes[li]=[];
      for(let i=0;i<cnt;i++){
        const geo=new THREE.SphereGeometry(0.16,16,16);
        const mat=new THREE.MeshBasicMaterial({color:cols[li%3]});
        const m=new THREE.Mesh(geo,mat);
        m.position.set(xStart+li*xGap,yStart+i*yGap,0);
        m.userData={base:m.position.y,phase:Math.random()*6};
        group.add(m);nodes[li].push(m);
      }
    });
    // connections
    for(let li=0;li<layers.length-1;li++){
      nodes[li].forEach(a=>nodes[li+1].forEach(b=>{
        const g=new THREE.BufferGeometry().setFromPoints([a.position,b.position]);
        const mt=new THREE.LineBasicMaterial({color:0x334155,transparent:true,opacity:0.35});
        group.add(new THREE.Line(g,mt));
      }));
    }
    scene.add(group);
    let t=0;
    function loop(){
      t+=0.015;
      group.rotation.y=Math.sin(t*0.3)*0.5;
      group.rotation.x=Math.cos(t*0.2)*0.15;
      // pulse nodes
      nodes.forEach((layer,li)=>layer.forEach(n=>{
        const s=1+Math.sin(t*3+n.userData.phase)*0.25;
        n.scale.setScalar(s);
      }));
      renderer.render(scene,cam);
      netAnim=requestAnimationFrame(loop);
    }
    loop();
    // resize
    const ro=()=>{const w=netCanvas.clientWidth,h=netCanvas.clientHeight;
      if(w&&h){cam.aspect=w/h;cam.updateProjectionMatrix();renderer.setSize(w,h,false);}};
    window.addEventListener("resize",ro);
  }

  // ---- AI description (OpenRouter, chosen language) ----
  // Cache the original badge text on first run so we can restore it after a Vision turn.
  const _origDescModel=descModelEl?descModelEl.textContent:"";
  async function fetchDescription(en,uz){
    descBox.hidden=false;
    if(descModelEl&&_origDescModel)descModelEl.textContent=_origDescModel;
    descBody.innerHTML=`<div class="det-desc-loading"><span class="det-spinner"></span><span>${T.descLoading||"Tayyorlanmoqda..."}</span></div>`;
    try{
      const r=await fetch(window.DESCRIBE_URL,{method:"POST",
        headers:{"Content-Type":"application/json","X-CSRFToken":window.CSRF},
        body:JSON.stringify({label:en,label_local:uz||""})});
      const d=await r.json();
      if(d.description){renderDescription(d.description);}
      else{descBody.innerHTML=`<p style="color:var(--muted)">${d.error||T.descError||"Error."}</p>`;}
    }catch(e){
      descBody.innerHTML=`<p style="color:var(--muted)">${T.descError||"Error."}</p>`;
    }
  }
  function renderDescription(text){
    descBody.innerHTML="";
    // Split into sections by blank lines; first line of each may be a "Label:" title
    const blocks=text.split(/\n\s*\n/).filter(b=>b.trim());
    blocks.forEach((block,i)=>{
      const sec=document.createElement("div");
      sec.className="det-desc-sec";sec.style.animationDelay=(i*0.1)+"s";
      const lines=block.split("\n").filter(l=>l.trim());
      // detect "Title:" pattern on first line
      const first=lines[0].trim();
      const colonIdx=first.indexOf(":");
      if(colonIdx>0&&colonIdx<40&&lines.length>=1){
        const title=first.slice(0,colonIdx).trim();
        const rest=first.slice(colonIdx+1).trim();
        const titleEl=document.createElement("div");
        titleEl.className="det-desc-sec-title";titleEl.textContent=title;
        sec.appendChild(titleEl);
        const body=[rest,...lines.slice(1)].filter(Boolean).join(" ");
        const p=document.createElement("p");p.textContent=body;sec.appendChild(p);
      }else{
        const p=document.createElement("p");p.textContent=lines.join(" ");sec.appendChild(p);
      }
      descBody.appendChild(sec);
    });
  }

  // ---- Upload ----
  const fileInput=$("#fileInput"),dropZone=$("#dropZone");
  function handleFile(file){
    if(!file)return;
    if(!/image\/(png|jpe?g)/.test(file.type)){alert(T.badFile||"Upload JPG/PNG/JPEG.");return;}
    const url=URL.createObjectURL(file);
    previewImg.onload=()=>{classify(previewImg);URL.revokeObjectURL(url);};
    previewImg.src=url;
  }
  fileInput?.addEventListener("change",e=>handleFile(e.target.files[0]));
  if(dropZone){
    ["dragenter","dragover"].forEach(ev=>dropZone.addEventListener(ev,e=>{e.preventDefault();dropZone.classList.add("drag");}));
    ["dragleave","drop"].forEach(ev=>dropZone.addEventListener(ev,e=>{e.preventDefault();dropZone.classList.remove("drag");}));
    dropZone.addEventListener("drop",e=>handleFile(e.dataTransfer.files[0]));
  }

  // ---- Camera ----
  const video=$("#camVideo"),camStart=$("#camStart"),camShot=$("#camShot"),
        camStop=$("#camStop"),camOverlay=$("#camOverlay"),shotCanvas=$("#shotCanvas");
  async function startCam(){
    try{
      stream=await navigator.mediaDevices.getUserMedia({video:{facingMode:"environment"}});
      video.srcObject=stream;camOverlay.classList.add("hidden");
      camShot.disabled=false;camStop.disabled=false;
    }catch(e){alert(T.noCam||"Camera not available.");}
  }
  function stopCam(){
    if(stream){stream.getTracks().forEach(t=>t.stop());stream=null;}
    if(video)video.srcObject=null;
    camOverlay?.classList.remove("hidden");
    if(camShot)camShot.disabled=true;if(camStop)camStop.disabled=true;
  }
  camStart?.addEventListener("click",startCam);
  camStop?.addEventListener("click",stopCam);
  camShot?.addEventListener("click",()=>{
    if(!stream)return;
    const w=video.videoWidth,h=video.videoHeight;
    shotCanvas.width=w;shotCanvas.height=h;
    shotCanvas.getContext("2d").drawImage(video,0,0,w,h);
    previewImg.onload=()=>classify(previewImg);
    previewImg.src=shotCanvas.toDataURL("image/jpeg",0.92);
  });

  // Reset
  $("#detAgain")?.addEventListener("click",()=>{
    result.hidden=true;resetPanels();hideStatus();
    if(fileInput)fileInput.value="";
    const upTab=$(".det-tab[data-tab='upload']");
    if(upTab&&!upTab.classList.contains("active"))upTab.click();
    wrap.scrollIntoView({behavior:"smooth",block:"start"});
  });
})();
})();
