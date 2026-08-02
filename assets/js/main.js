"use strict";
/* ─────────────────────────────────────────────────────────────
   5장으로 나뉜 사이트라 페이지마다 있는 요소가 다릅니다.
   없는 요소를 만지면 그 아래 코드가 전부 멈추므로,
   $() 가 항상 "무해한 껍데기"를 돌려주도록 합니다.
   ───────────────────────────────────────────────────────────── */
const VOID_EL = {
  innerHTML:"", textContent:"", value:"", checked:false, options:[],
  style:new Proxy({},{get:()=>"" ,set:()=>true}), dataset:{},
  classList:{add(){},remove(){},toggle(){},contains(){return false}},
  addEventListener(){}, removeEventListener(){}, setAttribute(){}, focus(){},
  scrollIntoView(){}, querySelectorAll(){return []}, appendChild(){}, removeChild(){},
  getContext(){return null}, parentElement:{offsetWidth:0, offsetHeight:0}
};
const $ = id => document.getElementById(id) || VOID_EL;

/* 지점 정보 주입 */
(function hydrate(){
  const s = CONFIG.site;
  const map = { brand:s.brand, area:s.area, branch:s.branch, tel:s.tel,
    telStack:s.tel.split("-").join("<br>"), address:s.address,
    hoursWeek:s.hoursWeek, hoursRest:s.hoursRest, hoursShort:s.hoursShort,
    kakaoNote:s.kakaoNote, bizInfo:s.bizInfo };
  document.querySelectorAll("[data-site]").forEach(el=>{
    const k = el.dataset.site;
    if(k === "telLink"){ el.setAttribute("href","tel:"+s.tel.replace(/[^0-9+]/g,"")); return; }
    if(k in map) el.innerHTML = map[k];
  });
})();

/* 다른 페이지에서 넘어온 프로그램 선택 (?prog=GLOW) */
function applyQueryProgram(){
  const v = new URLSearchParams(location.search).get("prog");
  if(!v) return;
  const sel = document.getElementById("bProg");
  if(!sel) return;
  Array.from(sel.options).forEach(o=>{ if(o.value === v) sel.value = v; });
}

/* ══════════════════════════════════════════════
   프로그램 — 레벨(가격·강도) × 이름(목적)
   ══════════════════════════════════════════════ */
const PROGRAMS = CONFIG.programs;
const won = n => n.toLocaleString("ko-KR");
/* 프로그램 목록 */
$("plist").innerHTML = PROGRAMS.map((p,i)=>`
  <button class="prow" onclick="openProgram(${i})" aria-label="${p.name} 상세 보기">
    <span class="pno"><span class="n serif">${p.lv}</span><span class="l">LEVEL</span></span>
    <span class="pb">
      <span class="pn serif" style="display:block">${p.kr}<em>${p.name}</em></span>
      <span class="pd" style="display:block">${p.desc}</span>
      <span class="pf">${p.forWhom} · ${p.min}분</span>
      <span class="more">상세 보기 →</span>
    </span>
    <span class="pp">
      <span class="a" style="display:block"><span>1회</span>${won(p.price)}</span>
      <span class="b" style="display:block"><span>10회</span>${won(p.ten)}</span>
    </span>
  </button>`).join("");

/* 프로그램 상세 모달 */
let lastFocus = null;
function openProgram(i){
  const p = PROGRAMS[i];
  lastFocus = document.activeElement;
  $("sheet").innerHTML = `
    <div class="mlv">LEVEL ${p.lv}</div>
    <h3>${p.kr}</h3>
    <div class="mkr">${p.name} · ${p.min}분</div>
    <p style="font-size:.95rem;color:var(--ink-2);margin:0;line-height:1.85">${p.detail}</p>
    <div class="mprice">
      <div><div class="k">1회</div><div class="v">${won(p.price)}원</div></div>
      <div><div class="k">10회권</div><div class="v">${won(p.ten)}원</div></div>
      <div><div class="k">연회원가</div><div class="v">${won(Math.round(p.price*0.75))}원</div></div>
    </div>
    <div class="mlabel">진행 순서</div>
    <ol class="steps">${p.steps.map(s=>`<li><b>${s[0]}</b><i>${s[1]}</i></li>`).join("")}</ol>
    <div class="mlabel">권장 주기</div>
    <div class="mnote">${p.cycle}</div>
    <div class="mlabel">관리 후 주의사항</div>
    <div class="mnote">${p.caution}</div>
    <div class="mclose">
      <button class="btn ghost" onclick="closeModal()">닫기</button>
      <a class="btn" style="text-decoration:none" href="reserve.html?prog=${encodeURIComponent(p.name)}" onclick="closeModal()">이 프로그램 예약 문의</a>
    </div>`;
  $("modal").classList.add("on");
  document.body.style.overflow = "hidden";
  $("sheet").focus();
}
function closeModal(){
  $("modal").classList.remove("on");
  document.body.style.overflow = "";
  if(lastFocus) lastFocus.focus();
}
document.addEventListener("keydown", e=>{ if(e.key === "Escape" && $("modal").classList.contains("on")) closeModal(); });

/* 예약 셀렉트 */
$("bProg").innerHTML = `<option value="">상담 후 결정하겠습니다</option>` +
  PROGRAMS.map(p=>`<option value="${p.name}">LEVEL ${p.lv} · ${p.kr} (${p.name}) — ${won(p.price)}원</option>`).join("");

/* ══════════════════════════════════════════════
   관리 과정
   ══════════════════════════════════════════════ */
const JOURNEY = [
  ["도착 · 문진","오늘 컨디션과 최근 피부 변화를 여쭙습니다. 복용 중인 약이나 시술 이력도 이때 확인합니다.","5분"],
  ["피부 측정","유수분, 각질 상태, 붉은기를 확인해 오늘의 레벨을 판단합니다.","10분"],
  ["1:1 상담 · 단계 결정","측정 결과를 함께 보며 오늘 어떤 단계로 갈지 정합니다. 원하지 않으시면 낮은 단계로 조정합니다.","10분"],
  ["클렌징","메이크업과 잔여물을 정리하고 피부를 준비시킵니다.","5분"],
  ["맞춤 필링","정해진 단계에 맞춰 진행합니다. 따가움이 있으면 바로 말씀해 주세요. 중간에 조절합니다.","25분"],
  ["진정 마무리","달아오른 피부를 가라앉히고 보습으로 마감합니다. 홈케어 안내도 이때 드립니다.","15분"]
];
$("jgrid").innerHTML = JOURNEY.map((j,i)=>`
  <div class="jrow">
    <div class="jn">${i+1}</div>
    <div class="jb"><div class="jt">${j[0]}</div><div class="jd">${j[1]}</div></div>
    <div class="jm">${j[2]}</div>
  </div>`).join("");

/* ══════════════════════════════════════════════
   원장 경력 · 다섯 가지 약속
   ══════════════════════════════════════════════ */
const CAREER = CONFIG.career;
$("career").innerHTML = CAREER.map(c=>`
  <li><span class="ty">${c[0]}</span><span class="td">${c[1]}</span></li>`).join("");

const PRINCIPLES = [
  ["一","측정 없이 관리하지 않습니다",
   "오늘 피부가 어떤 상태인지 확인하기 전에는 어떤 단계도 시작하지 않습니다. <b>측정과 상담은 비용을 받지 않습니다.</b>"],
  ["二","필요 없는 단계를 권하지 않습니다",
   "상태가 좋으시면 낮은 단계로 안내드립니다. <b>비싼 코스를 권해야 할 이유가 없습니다.</b> 다음에 또 오시는 편이 저희에게도 낫습니다."],
  ["三","관리보다 진료가 먼저인 경우를 말씀드립니다",
   "염증이 심하거나 질환이 의심되면 <b>관리를 미루고 병원을 권해 드립니다.</b> 저희는 의료기관이 아니고, 그 선을 넘지 않습니다."],
  ["四","가격을 모두 공개합니다",
   "홈페이지에 적힌 것이 전부입니다. <b>‘상담 후 결정’이라는 가격은 없습니다.</b> 회원권 손익분기도 계산해서 보여드립니다."],
  ["五","담당자가 바뀌어도 기준은 같습니다",
   "측정 → 단계 → 프로그램이 문서로 정해져 있습니다. <b>누가 맡아도 같은 판단이 나오도록</b> 만든 체계입니다."]
];
$("principles").innerHTML = PRINCIPLES.map(p=>`
  <div class="pr">
    <div class="pi">${p[0]}</div>
    <div><div class="pt">${p[1]}</div><div class="pd">${p[2]}</div></div>
  </div>`).join("");

/* ══════════════════════════════════════════════
   전체 요금표
   ══════════════════════════════════════════════ */
const FEE = [];
FEE.push({sec:"PROGRAM · 관리 프로그램"});
PROGRAMS.forEach(p=>FEE.push({
  a:`LEVEL ${p.lv} · ${p.kr}`, b:`${p.name} · ${p.min}분`, c:p.price, d:p.ten, first:true
}));
FEE.push({sec:"ADD-ON · 선택 추가"});
FEE.push({a:"미니 돔 사우나", b:"단품", c:35000, d:null});
FEE.push({a:"미니 돔 사우나", b:"정회원", c:25000, d:null});
FEE.push({a:"미니 돔 사우나", b:"연회원 · LEVEL 3", c:0, d:null});
FEE.push({sec:"MEMBERSHIP · 회원권"});
FEE.push({a:"정회원", b:"10회권 구매 시 자동 등록", c:0, d:null});
FEE.push({a:"연회원", b:"1년 · 전 단계 상시 25% 할인", c:300000, d:null});
FEE.push({sec:"FREE · 비용을 받지 않는 것"});
FEE.push({a:"피부 측정", b:"방문 시 매회", c:0, d:null});
FEE.push({a:"1:1 상담", b:"단계 결정 · 홈케어 안내", c:0, d:null});

$("feeBody").innerHTML = FEE.map(f=>{
  if(f.sec) return `<tr class="sec"><td colspan="5">${f.sec}</td></tr>`;
  const price = f.c === 0 ? `<span class="g">무료</span>` : won(f.c);
  /* 오픈 프로모션: 첫 방문 30% 할인 실결제액 */
  const first = f.first ? `<b style="color:var(--coral,#B04527)">${won(Math.round(f.c * 0.7))}</b>` : "—";
  return `<tr>
    <td>${f.a}</td><td style="color:var(--ink-2)">${f.b}</td>
    <td class="n">${price}</td>
    <td class="n">${first}</td>
    <td class="n g">${f.d ? won(f.d) : "—"}</td></tr>`;
}).join("");

/* ══════════════════════════════════════════════
   관리 전후 가이드
   ══════════════════════════════════════════════ */
const GUIDE = [
  {t:"오시기 전", items:[
    ["○","<b>관리 3일 전부터</b> 집에서 하는 각질 제거와 스크럽을 쉬어 주세요."],
    ["○","<b>강한 자외선 노출</b>이 있었다면 미리 말씀해 주세요. 단계를 낮춰 잡습니다."],
    ["○","복용 중인 약이나 최근 받은 시술이 있으면 문진 때 알려 주세요."],
    ["○","화장은 하고 오셔도 됩니다. 클렌징부터 시작합니다."],
    ["×","레이저·박피 시술을 받으셨다면 <b>최소 2주</b> 지난 뒤에 오세요.","no"],
    ["×","피부에 상처나 화농성 염증이 있으면 <b>먼저 병원에 가셔야 합니다.</b>","no"]
  ]},
  {t:"관리 당일", items:[
    ["○","따가움이나 열감이 있으면 <b>참지 마시고 바로</b> 말씀해 주세요. 중간에 조절합니다."],
    ["○","돌아가실 때 자외선 차단제를 꼭 바르세요. 저희가 챙겨 드립니다."],
    ["○","물은 평소보다 조금 더 드시는 편이 좋습니다."],
    ["×","당일 <b>사우나·찜질방·격한 운동</b>은 피해 주세요.","no"],
    ["×","진한 메이크업은 하루만 쉬어 주세요.","no"],
    ["×","음주는 당일 피하시는 편이 좋습니다.","no"]
  ]},
  {t:"다녀가신 후 3일", items:[
    ["○","<b>보습을 평소의 두 배로</b> 해주세요. 이 시기가 가장 중요합니다."],
    ["○","미세한 각질이 올라올 수 있습니다. <b>자연스럽게 떨어지도록</b> 두세요."],
    ["○","자외선 차단은 흐린 날에도 하셔야 합니다."],
    ["×","각질을 <b>뜯거나 밀지 마세요.</b> 자국이 남을 수 있습니다.","no"],
    ["×","스크럽·필링 제품, 레티놀, 고농도 비타민C는 잠시 멈춰 주세요.","no"]
  ]},
  {t:"일주일 후", items:[
    ["○","대부분 이 시점에 안정됩니다. 평소 루틴으로 돌아가셔도 됩니다."],
    ["○","다음 관리 시점을 잡으세요. <b>단계마다 권장 주기가 다릅니다.</b>"],
    ["○","변화가 어땠는지 알려 주시면 다음 회차 단계에 반영합니다."],
    ["×","붉은기나 따가움이 <b>일주일 넘게</b> 지속되면 관리를 미루고 병원 진료를 받으세요.","no"]
  ]}
];
$("gtabs").innerHTML = GUIDE.map((g,i)=>
  `<button type="button" class="${i===0?"on":""}" onclick="setGuide(${i})">${g.t}</button>`).join("");
$("gpanels").innerHTML = GUIDE.map((g,i)=>`
  <div class="gpanel ${i===0?"on":""}" id="gp${i}">
    <ul class="glist">${g.items.map(it=>
      `<li class="${it[2]||""}"><span class="gi">${it[0]}</span><span>${it[1]}</span></li>`).join("")}</ul>
  </div>`).join("");
function setGuide(i){
  document.querySelectorAll("#gtabs button").forEach((b,j)=>b.classList.toggle("on", j===i));
  document.querySelectorAll(".gpanel").forEach((p,j)=>p.classList.toggle("on", j===i));
}

/* ══════════════════════════════════════════════
   모바일 드로어
   ══════════════════════════════════════════════ */
const burger = $("burger"), drawer = $("drawer");
function toggleDrawer(open){
  const on = open ?? !drawer.classList.contains("on");
  drawer.classList.toggle("on", on);
  burger.classList.toggle("x", on);
  burger.setAttribute("aria-expanded", String(on));
  burger.setAttribute("aria-label", on ? "메뉴 닫기" : "메뉴 열기");
  document.body.style.overflow = on ? "hidden" : "";
}
burger.addEventListener("click", ()=>toggleDrawer());
drawer.querySelectorAll("a").forEach(a=>a.addEventListener("click", ()=>toggleDrawer(false)));
document.addEventListener("keydown", e=>{ if(e.key === "Escape" && drawer.classList.contains("on")) toggleDrawer(false); });

/* ══════════════════════════════════════════════
   FAQ
   ══════════════════════════════════════════════ */
const FAQ = [
  ["필링을 받으면 각질이 많이 일어나나요?",
   "단계에 따라 다릅니다. LEVEL 1은 거의 없고, LEVEL 2~3은 2~3일간 미세한 각질이 올라올 수 있습니다. <b>뜯지 마시고 보습으로 관리</b>하시면 자연스럽게 정리됩니다."],
  ["얼마나 자주 받는 게 좋을까요?",
   "보통 <b>2~4주 간격</b>을 권해 드립니다. 단계마다 권장 주기가 다르고, 피부 회복 속도에 따라 조정합니다. 프로그램 상세에서 단계별 주기를 확인하실 수 있습니다."],
  ["처음인데 어떤 단계를 골라야 할지 모르겠어요.",
   "고르지 않으셔도 됩니다. <b>첫 방문이시면 LEVEL 1부터</b> 시작하는 것을 원칙으로 하고 있습니다. 피부가 어떻게 반응하는지 보고 다음 회차에서 올립니다."],
  ["관리 당일 화장해도 되나요?",
   "오실 때 하고 오셔도 괜찮습니다. 클렌징부터 시작합니다. 다만 <b>돌아가실 때는 가볍게</b> 하시는 편이 좋고, 자외선 차단제는 꼭 발라 주세요."],
  ["민감성 피부인데 받을 수 있을까요?",
   "가능합니다. 측정과 상담에서 민감도를 먼저 확인하고 <b>가장 낮은 강도로</b> 잡습니다. 관리 중에도 따가움이 있으면 바로 말씀해 주세요. 중간에 조절합니다."],
  ["임신 중이거나 수유 중에도 받을 수 있나요?",
   "임신·수유 중이시면 <b>담당 의사와 먼저 상담</b>하신 뒤 방문해 주세요. 일부 관리는 권해드리지 않으며, 상태에 따라 예약을 미뤄 드릴 수 있습니다."],
  ["여드름이 심한데 관리로 좋아지나요?",
   "본 프로그램은 <b>피부 관리 서비스이며 치료가 아닙니다.</b> 화농성 염증이 있는 상태라면 관리보다 진료가 먼저입니다. 상담 때 상태를 보고 솔직하게 말씀드립니다."],
  ["남성도 받을 수 있나요?",
   "물론입니다. 면도 후 자극이나 각질 문제로 오시는 남성 고객이 늘고 있습니다. <b>관리 당일 면도는 피해</b> 주시는 편이 좋습니다."],
  ["10회권 유효기간이 있나요?",
   "구매일로부터 <b>12개월</b>입니다. 기간 내 사용을 권해 드리며, 부득이한 사정이 있으시면 미리 말씀해 주세요."],
  ["예약 변경이나 취소는 어떻게 하나요?",
   "방문 <b>24시간 전</b>까지 연락 주시면 자유롭게 변경하실 수 있습니다. 당일 취소가 반복되면 예약이 제한될 수 있습니다."],
  ["주차할 수 있나요?",
   "건물 주차장을 이용하실 수 있습니다. 확정 후 안내 드리겠습니다."]
];
$("faqList").innerHTML = FAQ.map(f=>`
  <details><summary>${f[0]}</summary><div class="a">${f[1]}</div></details>`).join("");

/* ══════════════════════════════════════════════
   피부 레벨 측정
   ══════════════════════════════════════════════ */
const QUESTIONS = [
  {q:"오늘 피부에서 가장 신경 쓰이는 부분은 무엇인가요?", key:"concern", opts:[
    {t:"각질이 일어나고 결이 거칠어요", v:"clear"},
    {t:"안색이 칙칙하고 어두워요", v:"glow"},
    {t:"붉은기나 트러블이 올라와요", v:"acne"},
    {t:"특별한 문제는 없고 관리를 시작하고 싶어요", v:"reset"}
  ]},
  {q:"필링이나 각질 관리를 받아보신 적 있나요?", key:"exp", opts:[
    {t:"이번이 처음이에요", v:0},
    {t:"몇 번 받아봤어요", v:1},
    {t:"정기적으로 받고 있어요", v:2}
  ]},
  {q:"피부가 자극에 쉽게 반응하는 편인가요?", key:"sens", opts:[
    {t:"쉽게 붉어지고 따가워요", v:2, s:"민감한 편"},
    {t:"보통이에요", v:1},
    {t:"웬만해선 괜찮아요", v:0, s:"튼튼한 편"}
  ]},
  {q:"요즘 피부 컨디션은 어떠신가요?", key:"cond", opts:[
    {t:"좋은 편이에요", v:0},
    {t:"그저 그래요", v:1},
    {t:"많이 지쳐 있어요", v:2}
  ]},
  {q:"곧 중요한 일정이 있으신가요?", key:"event", opts:[
    {t:"2주 안에 있어요", v:2, s:"결혼식 · 행사 · 촬영 등"},
    {t:"한 달쯤 뒤에 있어요", v:1},
    {t:"특별한 일정은 없어요", v:0}
  ]},
  {q:"어느 정도 주기로 관리받고 싶으세요?", key:"freq", opts:[
    {t:"2주에 한 번은 오고 싶어요", v:2},
    {t:"한 달에 한 번 정도", v:1},
    {t:"우선 한 번 받아보고 정할게요", v:0}
  ]}
];
let step = 0;
const answers = {};

function renderQ(){
  $("qbar").style.width = (step / QUESTIONS.length * 100) + "%";
  if(step >= QUESTIONS.length){ renderResult(); return; }
  const q = QUESTIONS[step];
  $("qbox").innerHTML = `
    <div class="qno">${step+1} / ${QUESTIONS.length}</div>
    <h3 class="qtext serif">${q.q}</h3>
    <div class="opts">
      ${q.opts.map((o,i)=>`<button type="button" onclick="pick(${i})">${o.t}${o.s?`<small>${o.s}</small>`:""}</button>`).join("")}
    </div>
    ${step > 0 ? `<div class="qnav"><button onclick="back()">이전 질문</button></div>` : ""}`;
  lightLadder(null);
}
function pick(i){
  answers[QUESTIONS[step].key] = QUESTIONS[step].opts[i].v;
  step++; renderQ();
}
function back(){ step = Math.max(0, step-1); renderQ(); }
function restart(){
  step = 0; for(const k in answers) delete answers[k];
  renderQ(); $("measure").scrollIntoView({block:"start"});
}

function decide(){
  const a = answers;
  const reasons = [];
  const CONCERN = {
    clear:{full:"각질과 거친 결", short:"각질 정돈"},
    glow: {full:"칙칙해진 톤",    short:"톤 개선"},
    acne: {full:"붉은기와 트러블", short:"진정"}
  };
  const c = CONCERN[a.concern];

  /* 안전 우선 — 처음이거나 민감하면 무조건 LEVEL 1에서 시작합니다.
     일정이 급해도 첫 방문에 강한 단계를 권하지 않습니다. */
  const gentle = (a.exp === 0 || a.sens === 2);
  let lv;

  if(gentle){
    lv = 1;
    if(a.exp === 0)  reasons.push("필링이 처음이시라 <b>가장 부드러운 단계</b>부터 시작하는 편이 안전합니다.");
    if(a.sens === 2) reasons.push("자극에 민감한 편이라고 하셔서 <b>저자극 구성</b>을 먼저 권해 드립니다.");
    if(c) reasons.push(`말씀하신 <b>${c.full}</b>은 첫 회에 무리하지 않고 잡아 나갑니다.`);
    if(a.event === 2) reasons.push("일정이 가깝지만, 처음에는 <b>단계를 올리지 않는 편</b>이 안전합니다. 경과를 보고 다음 방문에서 올리는 것을 권해 드립니다.");
  }
  else if(a.event === 2){
    lv = 3;
    reasons.push("2주 안에 중요한 일정이 있으시니 <b>회복 케어까지 한 번에</b> 이어지는 코스를 권합니다.");
    if(c) reasons.push(`필링은 <b>${c.short}</b> 방향으로 잡고, 옥시젠 회복과 미니 돔까지 함께 진행합니다.`);
  }
  else if(a.exp === 2 && a.cond === 2){
    lv = 3;
    reasons.push("정기적으로 받아오셨고 컨디션이 지쳐 있어서, <b>집중 관리</b>가 필요한 시점입니다.");
    if(c) reasons.push(`필링은 <b>${c.short}</b> 방향으로 잡습니다.`);
  }
  else {
    lv = 2;
    if(c) reasons.push(`가장 신경 쓰인다고 하신 <b>${c.full}</b>에 맞춘 단계입니다.`);
    else  reasons.push("특별히 불편한 곳이 없다고 하셔서, <b>결을 정돈하는 기본 관리</b>로 잡았습니다.");
  }

  const prog =
    lv === 1 ? PROGRAMS.find(p=>p.id === "reset") :
    lv === 3 ? PROGRAMS.find(p=>p.id === "signature") :
               PROGRAMS.find(p=>p.id === (a.concern === "reset" ? "clear" : a.concern));

  if(a.freq === 2)      reasons.push("2주 간격을 원하시면 <b>10회권</b>이, 월 1회 이상이면 <b>연회원권</b>이 유리합니다.");
  else if(a.freq === 1) reasons.push("월 1회 주기시라면 <b>연회원권</b>이 회비 이상으로 돌아옵니다.");

  return {prog, reasons};
}

function renderResult(){
  const {prog, reasons} = decide();
  const idx = PROGRAMS.indexOf(prog);
  $("qbar").style.width = "100%";
  $("qbox").innerHTML = `
    <div class="result">
      <div class="rlv">추천 단계 · LEVEL ${prog.lv}</div>
      <div class="rname serif">${prog.kr}</div>
      <div class="rkr">${prog.name}</div>
      <div class="rwhy">${reasons.map(r=>`· ${r}`).join("<br>")}</div>
      <div class="rmeta">
        <div><div class="k">1회</div><div class="v">${won(prog.price)}원</div></div>
        <div><div class="k">10회권</div><div class="v">${won(prog.ten)}원</div></div>
        <div><div class="k">소요</div><div class="v">${prog.min}분</div></div>
      </div>
      <div class="rbtns">
        <button class="btn ghost" onclick="restart()">다시 측정</button>
        <button class="btn ghost" onclick="openProgram(${idx})">이 프로그램 상세</button>
        <a class="btn" style="text-decoration:none" href="reserve.html?prog=${encodeURIComponent(prog.name)}">예약 문의</a>
      </div>
      <div class="rnote">이 결과는 답해주신 내용을 바탕으로 한 <b>제안</b>입니다.<br>
        실제 단계는 방문하셔서 피부를 측정한 뒤 상담을 통해 최종 결정합니다.</div>
    </div>`;
  lightLadder(prog.lv);
}
function lightLadder(lv){
  document.querySelectorAll("#ladder .rung").forEach(r=>{
    r.classList.toggle("lit", lv !== null && Number(r.dataset.lv) === lv);
  });
}
function applyToBooking(name){
  const sel = $("bProg");
  Array.from(sel.options).forEach(o=>{ if(o.value === name) sel.value = name; });
  updatePreview();
}
renderQ();

/* ══════════════════════════════════════════════
   회원권 시뮬레이터
   ══════════════════════════════════════════════ */
const SIM_LEVELS = [
  {lv:1, name:"LEVEL 1", price:250000},
  {lv:2, name:"LEVEL 2", price:300000},
  {lv:3, name:"LEVEL 3", price:380000}
];
let simLv = 1;   /* 기본 LEVEL 2 (index 1) */
$("simLv").innerHTML = SIM_LEVELS.map((s,i)=>
  `<button type="button" class="${i===simLv?"on":""}" onclick="setSimLv(${i})">${s.name}</button>`).join("");
function setSimLv(i){
  simLv = i;
  document.querySelectorAll("#simLv button").forEach((b,j)=>b.classList.toggle("on", j===i));
  runSim();
}
$("simRange").addEventListener("input", runSim);

function runSim(){
  const n = Number($("simRange").value);
  const p = SIM_LEVELS[simLv].price;
  $("simN").textContent = n + "회";

  const plans = [
    {k:"정가 결제",   total: p * n},
    {k:"10회권",     total: Math.round(p * 0.85) * n},
    {k:"연회원권",   total: 300000 + Math.round(p * 0.75) * n}
  ];
  const max = Math.max(...plans.map(x=>x.total));
  const min = Math.min(...plans.map(x=>x.total));
  const best = plans.find(x=>x.total === min);

  $("simBars").innerHTML = plans.map(x=>`
    <div class="simbar ${x.total===min?"best":""}">
      <div class="sk">${x.k}</div>
      <div class="strack">
        <div class="sfill" style="width:${Math.max(12, x.total/max*100)}%"></div>
        <div class="sv">${won(x.total)}원</div>
      </div>
    </div>`).join("");

  const save = max - min;
  const tie = plans.filter(x=>x.total === min).length > 1;
  $("simOut").innerHTML = tie
    ? `<b>딱 손익분기 지점입니다</b>연 ${n}회면 10회권과 연회원권이 같아집니다. 더 오실 것 같으면 연회원권이 유리합니다.`
    : `<b>${best.k}이 가장 유리합니다</b>정가로 결제하실 때보다 <b style="display:inline">${won(save)}원</b> 아끼실 수 있습니다.`;
}
runSim();

/* ══════════════════════════════════════════════
   예약 문의
   ══════════════════════════════════════════════ */
let bTime = "", bFirst = "";
function chipGroup(id, setter){
  document.querySelectorAll("#" + id + " button").forEach(b=>{
    b.addEventListener("click", ()=>{
      const cur = setter();
      const v = (cur === b.dataset.t) ? "" : b.dataset.t;
      setter(v);
      document.querySelectorAll("#" + id + " button").forEach(x=>x.classList.toggle("on", x.dataset.t === v));
      updatePreview();
    });
  });
}
chipGroup("bTime",  v => v === undefined ? bTime  : (bTime = v));
chipGroup("bFirst", v => v === undefined ? bFirst : (bFirst = v));
["bName","bTel","bProg","bDate","bMemo"].forEach(id=>{
  $(id).addEventListener("input", updatePreview);
  $(id).addEventListener("change", updatePreview);
});

function bookingText(){
  const g = id => $(id).value.trim();
  let s = `[${CONFIG.site.brand} · ${CONFIG.site.area}] 예약 문의\n\n`;
  s += `성함 · ${g("bName") || "—"}\n`;
  s += `연락처 · ${g("bTel") || "—"}\n`;
  s += `프로그램 · ${g("bProg") || "상담 후 결정"}\n`;
  const date = g("bDate");
  if(date){
    const d = new Date(date + "T00:00:00");
    s += `희망 날짜 · ${d.getMonth()+1}월 ${d.getDate()}일 (${"일월화수목금토"[d.getDay()]})\n`;
  }
  if(bTime)  s += `희망 시간 · ${bTime}\n`;
  if(bFirst) s += `방문 경험 · ${bFirst}\n`;
  const memo = g("bMemo");
  if(memo) s += `\n남기신 말씀\n${memo}\n`;
  return s;
}
function updatePreview(){ $("bPrev").textContent = bookingText(); }
updatePreview();

function validBooking(){
  if(!$("bName").value.trim()){ toast("성함을 입력해 주세요"); $("bName").focus(); return false; }
  if(!$("bTel").value.trim()){  toast("연락처를 입력해 주세요"); $("bTel").focus(); return false; }
  return true;
}
function shareBooking(){
  if(!validBooking()) return;
  const text = bookingText();
  if(navigator.share) navigator.share({title:"MUKYUL 예약 문의", text}).catch(()=>{});
  else copyText(text, "내용을 복사했어요 · 카카오톡에 붙여넣어 주세요");
}
function copyBooking(){ if(validBooking()) copyText(bookingText(), "예약 문의 내용을 복사했어요"); }

function copyText(text, msg){
  const done = () => toast(msg);
  if(navigator.clipboard && window.isSecureContext){ navigator.clipboard.writeText(text).then(done, fb); }
  else fb();
  function fb(){
    const ta = document.createElement("textarea");
    ta.value = text;
    ta.style.cssText = "position:fixed;top:0;left:0;width:1px;height:1px;opacity:0";
    document.body.appendChild(ta);
    if(/iPad|iPhone|iPod/.test(navigator.userAgent)){
      ta.contentEditable = "true"; ta.readOnly = false;
      const r = document.createRange(); r.selectNodeContents(ta);
      const s = window.getSelection(); s.removeAllRanges(); s.addRange(r);
      ta.setSelectionRange(0, 999999);
    } else ta.select();
    try{ document.execCommand("copy") ? done() : toast("복사가 안 돼요 · 길게 눌러 직접 복사해 주세요"); }
    catch(e){ toast("복사가 안 돼요 · 길게 눌러 직접 복사해 주세요"); }
    document.body.removeChild(ta);
  }
}
let tt;
function toast(msg){
  const el = $("toast");
  el.textContent = msg; el.classList.add("on");
  clearTimeout(tt); tt = setTimeout(()=>el.classList.remove("on"), 2400);
}

/* ══════════════════════════════════════════════
   스크롤 · 내비 · 히어로 배경
   ══════════════════════════════════════════════ */
const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

if("IntersectionObserver" in window){
  const io = new IntersectionObserver(es=>{
    es.forEach(e=>{ if(e.isIntersecting){ e.target.classList.add("in"); io.unobserve(e.target); } });
  }, {threshold:.12, rootMargin:"0px 0px -8% 0px"});
  document.querySelectorAll(".reveal").forEach(el=>io.observe(el));
} else {
  document.querySelectorAll(".reveal").forEach(el=>el.classList.add("in"));
}

const SECT = ["measure","program","journey","brand","member","faq"];
const links = {};
document.querySelectorAll("nav.top a.lnk").forEach(a=>{ links[a.getAttribute("href").slice(1)] = a; });
if("IntersectionObserver" in window){
  const io2 = new IntersectionObserver(es=>{
    es.forEach(e=>{
      const a = links[e.target.id];
      if(a && e.isIntersecting){
        Object.values(links).forEach(x=>x.classList.remove("act"));
        a.classList.add("act");
      }
    });
  }, {rootMargin:"-45% 0px -50% 0px"});
  /* $() 는 없는 요소에 껍데기를 돌려주므로, 관찰에는 실제 요소만 넘겨야 합니다.
     껍데기를 넘기면 observe() 가 예외를 던져 이후 코드가 전부 멈춥니다. */
  SECT.forEach(id=>{ const el = document.getElementById(id); if(el) io2.observe(el); });
}
/* ══════════════════════════════════════════════
   하단 빠른 문의 — 히어로를 지나면 올라옵니다
   ══════════════════════════════════════════════ */
let quickClosed = false;
function hideQuick(){ quickClosed = true; $("quick").classList.remove("up"); }
function quickSend(){
  const name = $("qName").value.trim(), tel = $("qTel").value.trim(), memo = $("qMemo").value.trim();
  if(!name){ toast("성함을 입력해 주세요"); $("qName").focus(); return; }
  if(!tel){  toast("연락처를 입력해 주세요"); $("qTel").focus(); return; }
  if(!$("qAgree").checked){ toast("개인정보 수집에 동의해 주세요"); return; }
  /* 아래 예약 양식으로 옮겨 담고 정식 문의로 이어 줍니다 */
  $("bName").value = name;
  $("bTel").value  = tel;
  if(memo) $("bMemo").value = memo;
  updatePreview();
  document.getElementById("bookform").scrollIntoView({block:"start"});
  toast("내용을 옮겨 담았어요 · 아래에서 보내주세요");
}

window.addEventListener("scroll", ()=>{
  const y = window.scrollY;
  $("nav").classList.toggle("stuck", y > 6);
  if(!quickClosed) $("quick").classList.toggle("up", y > 420);
}, {passive:true});

/* 히어로 배경 — 거친 표면이 고르게 정돈되는 과정 (리서페이싱의 은유) */
(function grain(){
  const c = $("grain"), x = c.getContext("2d");
  if(!x) return;
  let W, H, pts = [], t = 0, raf;
  const GAP = 26;
  function build(){
    const r = window.devicePixelRatio || 1;
    W = c.parentElement.offsetWidth; H = c.parentElement.offsetHeight;
    c.width = W * r; c.height = H * r; c.style.width = W + "px"; c.style.height = H + "px";
    x.setTransform(r,0,0,r,0,0);
    pts = [];
    for(let gy = GAP/2; gy < H; gy += GAP){
      for(let gx = GAP/2; gx < W; gx += GAP){
        pts.push({x:gx, y:gy, jx:(Math.random()-.5)*GAP*.85, jy:(Math.random()-.5)*GAP*.85,
                  r:.6 + Math.random()*1.5});
      }
    }
  }
  function draw(){
    x.clearRect(0,0,W,H);
    const e = reduce ? 1 : Math.min(1, t/150);
    const ease = 1 - Math.pow(1-e, 3);
    pts.forEach(p=>{
      const px = p.x + p.jx*(1-ease), py = p.y + p.jy*(1-ease);
      const fade = Math.max(0, 1 - py/H*1.25);
      x.beginPath();
      x.arc(px, py, p.r*(1-ease*.42), 0, 6.284);
      x.fillStyle = `rgba(172,138,76,${(.055 + (1-ease)*.075) * fade})`;
      x.fill();
    });
    if(!reduce && t < 150){ t++; raf = requestAnimationFrame(draw); }
  }
  build(); draw();
  let rt;
  window.addEventListener("resize", ()=>{
    clearTimeout(rt);
    rt = setTimeout(()=>{ cancelAnimationFrame(raf); build(); t = reduce?150:150; draw(); }, 180);
  });
})();
applyQueryProgram();
updatePreview();

/* ══════════════════════════════════════════════
   의견 남기기 — 8문항
   ══════════════════════════════════════════════ */
const FB_Q = [
  { k:"first", q:"첫 화면을 보고 <b>여기가 무엇을 하는 곳인지</b> 바로 아셨나요?", type:"pick",
    opts:["바로 알았어요", "조금 헷갈렸어요", "전혀 모르겠어요"] },
  { k:"level", q:"<b>피부 레벨 측정</b>을 해보셨나요? 결과가 그럴듯했나요?", type:"pick",
    opts:["해봤고 그럴듯했어요", "해봤는데 애매했어요", "안 해봤어요 · 있는 줄 몰랐어요"] },
  { k:"price", q:"가격을 보고 어떤 느낌이셨나요?", type:"pick",
    opts:["비싸요", "적당해요", "싼 편이에요", "판단이 안 서요"] },
  { k:"clear", q:"프로그램 <b>다섯 가지의 차이</b>가 구분되셨나요?", type:"pick",
    opts:["잘 구분됐어요", "비슷해 보였어요", "안 읽어봤어요"] },
  { k:"member", q:"<b>회원권 계산기</b>를 보고 어떤 게 유리한지 아셨나요?", type:"pick",
    opts:["바로 알았어요", "계산은 봤는데 잘 모르겠어요", "못 봤어요"] },
  { k:"trust", q:"이 가게를 <b>믿을 만하다</b>고 느끼셨나요?", type:"pick",
    opts:["믿음이 갔어요", "보통이에요", "잘 모르겠어요"] },
  { k:"visit", q:"압구정 근처라면 <b>한 번 가보고 싶으신가요?</b>", type:"pick",
    opts:["가보고 싶어요", "고민될 것 같아요", "생각 없어요"] },
  { k:"free", q:"고쳤으면 하는 점, 이상했던 점을 편하게 적어주세요", type:"text",
    ph:"불편했던 점 · 이해 안 된 부분 · 빠진 것 같은 정보 · 무엇이든" }
];
const fbAns = {};
let fbStep = 0;

function fbRender(){
  const box = document.getElementById("fbBox");
  if(!box) return;
  const bar = document.getElementById("fbBar");
  if(bar) bar.style.width = (fbStep / FB_Q.length * 100) + "%";

  if(fbStep >= FB_Q.length){ fbResult(); return; }
  const q = FB_Q[fbStep];

  if(q.type === "text"){
    box.innerHTML =
      '<div class="qno">' + (fbStep+1) + ' / ' + FB_Q.length + '</div>' +
      '<h3 class="qtext serif">' + q.q + '</h3>' +
      '<textarea id="fbText" placeholder="' + q.ph + '">' + (fbAns[q.k] || "") + '</textarea>' +
      '<button class="btn" style="margin-top:1rem" onclick="fbPickText()">다 적었어요</button>' +
      '<div class="qnav"><button onclick="fbBack()">이전 질문</button></div>';
    return;
  }
  box.innerHTML =
    '<div class="qno">' + (fbStep+1) + ' / ' + FB_Q.length + '</div>' +
    '<h3 class="qtext serif">' + q.q + '</h3>' +
    '<div class="opts">' +
      q.opts.map(function(o, i){ return '<button type="button" onclick="fbPick(' + i + ')">' + o + '</button>'; }).join("") +
    '</div>' +
    (fbStep > 0 ? '<div class="qnav"><button onclick="fbBack()">이전 질문</button></div>' : "");
}
function fbPick(i){ const q = FB_Q[fbStep]; fbAns[q.k] = q.opts[i]; fbStep++; fbRender(); }
function fbPickText(){
  const el = document.getElementById("fbText");
  fbAns[FB_Q[fbStep].k] = el ? el.value.trim() : "";
  fbStep++; fbRender();
}
function fbBack(){ fbStep = Math.max(0, fbStep - 1); fbRender(); }
function fbRestart(){
  fbStep = 0;
  Object.keys(fbAns).forEach(function(k){ delete fbAns[k]; });
  fbRender();
  const s = document.getElementById("feedback");
  if(s) s.scrollIntoView({block:"start"});
}

function fbText(){
  let s = "[MUKYUL SKIN LAB 샘플 홈페이지 의견]\n";
  s += new Date().toLocaleDateString("ko-KR") + "\n\n";
  FB_Q.forEach(function(q, i){
    const a = fbAns[q.k];
    if(!a) return;
    const label = q.q.replace(/<[^>]+>/g, "");
    s += (i+1) + ". " + label + "\n   → " + a + "\n\n";
  });
  s += "— 홈페이지에서 자동으로 정리했습니다";
  return s;
}

function fbResult(){
  const box = document.getElementById("fbBox");
  if(!box) return;
  const bar = document.getElementById("fbBar");
  if(bar) bar.style.width = "100%";
  const answered = FB_Q.filter(function(q){ return fbAns[q.k]; }).length;
  box.innerHTML =
    '<div class="result">' +
      '<div class="rlv">THANK YOU</div>' +
      '<div class="rname serif" style="font-size:clamp(1.5rem,4.6vw,2.1rem)">고맙습니다</div>' +
      '<div class="rkr">' + answered + '개 문항에 답해주셨어요</div>' +
      '<div class="report-pre" style="text-align:left;margin-bottom:1.4rem">' +
        fbText().replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;") +
      '</div>' +
      '<p class="rnote" style="margin-top:0;margin-bottom:1.2rem">' +
        '아래 버튼을 누르면 내용이 복사되거나 공유창이 열립니다.<br>' +
        '<b>카카오톡으로 보내주시면</b> 그대로 반영하겠습니다.</p>' +
      '<div class="rbtns">' +
        '<button class="btn ghost" onclick="fbRestart()">다시 답하기</button>' +
        '<button class="btn ghost" onclick="copyText(fbText(),\'의견을 복사했어요\')">내용 복사</button>' +
        '<button class="btn" onclick="fbShare()">카카오톡으로 보내기</button>' +
      '</div>' +
    '</div>';
}
function fbShare(){
  const t = fbText();
  if(navigator.share) navigator.share({ title:"MUKYUL 홈페이지 의견", text:t }).catch(function(){});
  else copyText(t, "의견을 복사했어요 · 카카오톡에 붙여넣어 주세요");
}
if(document.getElementById("fbBox")) fbRender();
