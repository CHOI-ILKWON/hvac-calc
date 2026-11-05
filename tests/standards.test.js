// 설계기준서(AC-001·003·004·006)와 앱 상수·계산식의 일치를 확인하는 회귀 테스트.
// 실행: node tests/standards.test.js   (외부 패키지 없음)
// 기준서가 바뀌면 아래 기대값을 기준서와 같이 고친다. 앱과 기준서가 따로 가지 않게 하는 장치다.
const fs=require('fs'), path=require('path');
const src=fs.readFileSync(path.join(__dirname,'..','index.html'),'utf8');
const grab=(re,name)=>{const m=src.match(re); if(!m) throw new Error('코드에서 찾지 못함: '+name); return m[0];};
const g={};
new Function('g',[
  grab(/function pws\(t\)[^\n]*/,'pws'),
  grab(/function omegaWB\(tdb,twb\)\{[\s\S]*?\n[^\n]*\}/,'omegaWB'),
  grab(/function omegaRH\([^\n]*/,'omegaRH'),
  grab(/const WEATHER_DATA = \{[\s\S]*?\n\};/,'WEATHER_DATA'),
  grab(/const INSUL_ZONE = \{[\s\S]*?\n\};/,'INSUL_ZONE'),
  grab(/const UREF = \{[\s\S]*?\n\};/,'UREF'),
  grab(/const UFLOOR = \{[\s\S]*?\n\};/,'UFLOOR'),
  grab(/const RT = \{[\s\S]*?\n\};/,'RT'),
  grab(/const DIR_HF = \{[^\n]*/,'DIR_HF'),
  grab(/const DIR_HF_ROOF = [^\n]*/,'DIR_HF_ROOF'),
  "Object.assign(g,{pws,omegaWB,omegaRH,WEATHER_DATA,INSUL_ZONE,UREF,UFLOOR,RT,DIR_HF,DIR_HF_ROOF});"
].join('\n'))(g);

let pass=0, fail=0; const ok=(c,msg)=>{ if(c)pass++; else {fail++; console.log('  ✗ '+msg);} };
const near=(a,b,t)=>Math.abs(a-b)<=t;

// ── AC-001 2장 확정값 (2026-09-30) ──────────────────────────
const AC001={ // 지역: [여름DB, 여름WB, 여름RH, 여름x, 겨울DB, 겨울WB, 겨울RH, 겨울x]
 '서울':[31.2,25.5,63.6,0.01827,-11.3,-12.3,63,0.00090],'인천':[30.1,25.0,66.4,0.01790,-10.4,-11.6,58,0.00089],
 '수원':[31.2,25.5,63.6,0.01827,-12.4,-13.2,70,0.00090],'춘천':[31.6,25.2,60.0,0.01760,-14.7,-15.2,77,0.00080],
 '강릉':[31.6,25.1,59.4,0.01743,-7.9,-9.9,42,0.00081],'대전':[32.3,25.5,58.3,0.01780,-10.3,-11.1,71,0.00110],
 '청주':[32.5,25.8,59.0,0.01823,-12.1,-12.7,76,0.00101],'전주':[32.4,25.8,59.5,0.01827,-8.7,-9.6,72,0.00129],
 '서산':[31.1,25.8,65.9,0.01882,-9.6,-10.3,78,0.00129],'광주':[31.8,26.0,63.5,0.01887,-6.6,-7.7,70,0.00151],
 '대구':[33.3,25.8,55.4,0.01789,-7.6,-9.0,61,0.00120],'부산':[30.7,26.2,70.4,0.01968,-5.3,-7.5,46,0.00111],
 '진주':[31.6,26.3,66.2,0.01947,-8.4,-9.2,76,0.00140],'울산':[32.2,26.8,66.0,0.02010,-7.0,-8.1,70,0.00146],
 '포항':[32.5,26.0,60.1,0.01857,-6.4,-8.7,41,0.00090],'목포':[31.1,26.3,68.8,0.01969,-4.7,-5.7,75,0.00190],
 '제주':[30.9,26.3,69.9,0.01977,0.1,-1.5,70,0.00266]};
console.log('AC-001 지역 외기조건');
Object.entries(AC001).forEach(([k,e])=>{const w=g.WEATHER_DATA[k]; ok(!!w,k+' 없음'); if(!w)return;
  const got=[w.s_db,w.s_wb,w.s_rh,w.s_x,w.w_db,w.w_wb,w.w_rh,w.w_x];
  e.forEach((v,i)=>ok(near(got[i],v,1e-9),`${k} ${i}번째 값 ${got[i]} ≠ 기준서 ${v}`));
  ok(near(g.omegaWB(w.s_db,w.s_wb),w.s_x,0.000006),`${k} 습구→수분비 계산 ${g.omegaWB(w.s_db,w.s_wb).toFixed(5)} ≠ ${w.s_x}`);
});

// ── AC-003·004 실 유형 실내조건 ─────────────────────────────
console.log('AC-003·004 실 유형');
const AC003={office:[26,50,21,null],control:[24,50,24,50],locker:[26,60,22,null],shower:[null,null,24,null],
 kitchen:[26,50,21,null],toilet:[null,null,20,null],elec:[30,null,null,null],mech:[null,null,5,null],
 genset:[null,null,null,null],storage:[null,null,null,null]};
Object.entries(AC003).forEach(([k,e])=>{const t=g.RT[k]; ok(!!t,k+' 없음'); if(!t)return;
  [t.cdb,t.crh,t.hdb,t.hrh].forEach((v,i)=>ok(v===e[i],`${k} ${['냉방DB','냉방RH','난방DB','난방RH'][i]} ${v} ≠ 기준서 ${e[i]}`));});
const humid=Object.entries(g.RT).filter(([k,t])=>t.hrh!=null).map(([k])=>k);
ok(humid.length===1&&humid[0]==='control',`난방 RH(가습)는 중앙제어실류만: 현재 ${humid}`);
const x2450=g.omegaRH(24,50);
ok(near(x2450*1000,9.3,0.05),`24℃·50% 수분비 ${(x2450*1000).toFixed(2)} ≠ 9.3 g/kgDA`);
ok(near(360*(x2450-0.00090),3.0,0.05),`AC-004 가습량 예제 ${(360*(x2450-0.0009)).toFixed(2)} ≠ 약 3.0 kg/h`);

// ── AC-006 단열 지역구분과 별표1 fallback ───────────────────
console.log('AC-006 외피 U값');
const ZONE={'서울':'중부2','인천':'중부2','수원':'중부2','춘천':'중부1','강릉':'중부2','대전':'중부2','청주':'중부2',
 '전주':'중부2','서산':'중부2','광주':'남부','대구':'남부','부산':'남부','진주':'남부','울산':'남부','포항':'남부','목포':'남부','제주':'제주도'};
Object.entries(ZONE).forEach(([k,z])=>ok(g.INSUL_ZONE[k]===z,`${k} 지역구분 ${g.INSUL_ZONE[k]} ≠ ${z}`));
const U={'중부1':[0.170,0.150,1.300,0.240,0.170],'중부2':[0.240,0.150,1.500,0.290,0.200],
 '남부':[0.320,0.180,1.800,0.350,0.250],'제주도':[0.410,0.250,2.200,0.470,0.330]};
Object.entries(U).forEach(([z,e])=>{const u=g.UREF[z],f=g.UFLOOR[z];
  [u.wall,u.roof,u.win,f.ground,f.outdoor].forEach((v,i)=>ok(near(v,e[i],1e-9),`${z} ${['외벽','지붕','창','접지바닥','외기바닥'][i]} ${v} ≠ ${e[i]}`));});

// ── AC-005 난방 방위계수 (표 2.36 채택, 2026-10-05) ───────────
console.log('AC-005 방위계수');
[['N',1.20],['E',1.10],['S',1.00],['W',1.10]].forEach(([d,v])=>ok(near(g.DIR_HF[d],v,1e-9),`방위계수 ${d} ${g.DIR_HF[d]} ≠ ${v}`));
ok(near(g.DIR_HF_ROOF,1.20,1e-9),`지붕 방위계수 ${g.DIR_HF_ROOF} ≠ 1.20`);
// AC-005 4.4.2 예제: 침기 135·외기 250 ㎥/h, ΔT 32.3K, 계수 0.336
ok(Math.round(0.336*135*32.3)===1465&&Math.round(0.336*250*32.3)===2713,'AC-005 4.4.2 침기·외기 열손실 예제');
ok(233+485+1465+2713===4896&&4896-1630===3266,'AC-005 4.4.2 합계 4,896 W / 비교값 3,266 W');

// ── AC-032 저수조 동시사용률·기구 (2026-10-05판 2.1·2.2, 주방싱크·세탁기 사용자 지정 2026-10-19) ──
console.log('AC-032 저수조');
const wt={};new Function('g',[grab(/const WT_FX=\[[\s\S]*?\]\];/,'WT_FX'),grab(/const WT_SIM=[^\n]*/,'WT_SIM'),'Object.assign(g,{WT_FX,WT_SIM});'].join('\n'))(wt);
const SIM032=[[2,100],[3,80],[4,75],[5,70],[10,53],[15,48],[20,44],[30,40],[50,36],[100,30]];
ok(JSON.stringify(wt.WT_SIM)===JSON.stringify(SIM032),`저수조 동시사용률 ${JSON.stringify(wt.WT_SIM)} ≠ AC-032 2.2`);
[['대변기(세정밸브)',15,6],['소변기(세정밸브)',6,15],['세면기',10,12],['샤워기',16,3],['주방싱크',15,6],['세탁기',15,1]].forEach(([n,l,u])=>{
  const r=wt.WT_FX.find(x=>x[1]===n);ok(r&&r[2]===l&&r[3]===u,`${n} 1회 ${r&&r[2]} L·${r&&r[3]} 회/h ≠ ${l}·${u}`);});
new Function('g',[grab(/const WT_SIM=[^\n]*/,'WT_SIM'),grab(/function wtSimRate\(n\)[^\n]*/,'wtSimRate'),'g.f=wtSimRate;'].join('\n'))(wt);
[[1,100],[2,100],[3,80],[9,53],[10,53],[17,44],[19,44],[21,40],[36,36],[100,30],[150,30]].forEach(([n,v])=>ok(wt.f(n)===v,`기구 ${n}개 동시사용률 ${wt.f(n)} ≠ ${v} (다음 큰 행)`));
// AC-033 표 3.5 행 선택 (위로 근접, 공란 건너뜀) — 5.4 예제 68 → 80행 235, 43 → 50행 193
const bpx={};new Function('g',[grab(/const BP_T35=\[[\s\S]*?\]\];/,'BP_T35'),grab(/function bpFlow\(w,valve\)[^\n]*/,'bpFlow'),'g.f=bpFlow;g.T=BP_T35;'].join('\n'))(bpx);
[[68,true,80,235],[72,true,80,235],[43,true,50,193],[45,true,50,193],[275,false,300,322],[4,true,5,83],[3,false,3,11]].forEach(([w,v,row,q])=>{const r=bpx.f(w,v);ok(r&&r.row===row&&r.q===q,`WSFU ${w} ${v?'밸브':'탱크'} → ${r&&r.row}행 ${r&&r.q} ≠ ${row}행 ${q}`);});
ok(bpx.T.length===55&&bpx.T.find(r=>r[0]===358)===undefined,'표 3.5 행 수');
// 표 3.4 (b) 상업용 — 1회 세정량으로 행 선택 (사용자 제공 원표 356쪽)
const bu={};new Function('g',[grab(/function bpUnit\(k,lpf\)\{[\s\S]*?\n\}/,'bpUnit'),'g.f=bpUnit;'].join('\n'))(bu);
[['f2',15,8.0],['f2',6,5.0],['f3',6,5.0],['f3',3.8,4.0],['f1',10,1.0],['f4',16,2.0],['f6',15,1.0],['f7',15,null]].forEach(([k,l,v])=>ok(bu.f(k,l)[0]===v,`표 3.4(b) ${k} ${l} L → ${bu.f(k,l)[0]} ≠ ${v}`));
// 회사 엑셀 예제: 대변기 16·소변기 6·세면기 4·샤워 10 = 36개, 2,940 L/h
ok([[15,6,16],[6,15,6],[10,12,4],[16,3,10]].reduce((s,[l,u,c])=>s+l*u*c,0)===2940,'회사 엑셀 예제 2,940 L/h');
ok(new Set(wt.WT_FX.map(x=>x[0])).size===wt.WT_FX.length&&wt.WT_FX.some(x=>x[0]==='f5'),'기구 키 중복 없음·기타(f5) 유지');

// ── 2026-10-23 최종 검토 확정값 ─────────────────────────────
console.log('2026-10-23 검토 확정값');
ok(/const SC_REF = 0\.87;/.test(src),'일사 SC 기준 0.87 (SC=SHGC÷0.87)');
ok(/sg\[d\]=wn\.w\*wn\.h\*\(wn\.shgc\/SC_REF\)/.test(src),'일사부하에 SC 적용');
ok(/const IW_U=2\.71;/.test(src),'내벽 기본 U 2.71 (콘크리트 200·양면 미장)');
ok(near(1/(0.11+0.11+0.2/1.6+0.036/1.5),2.71,0.005),'내벽 U 계산식 = 2.71');
ok(/lw:6, eqKW:0/.test(src)&&g.RT.office.lw===6,'새 실 조명 기본값 = 사무실 6 W/㎡');
ok((src.match(/shgc:0\.6,/g)||[]).length===4,'창 SHGC 기본값 0.6 (4방위)');
ok(!/iw_u/.test(src),'화장실 내벽 별도 U(2.38) 폐지');
ok(/function fFacC\(r\)\{ const m=fMode\(r\); return m==='outdoor'\?1:\(m==='soil'\?0:0\.5\); \}/.test(src),'바닥 냉방계수: 땅 0 · 비공조실 위 0.5 · 필로티 1');
ok(g.RT.office.lb==='사무실류','실 유형 명칭: 사무실류');

// ── 2026-11-02 전기온수기 가열능력 (학회 설계기준 표 4.2-1 주 1) ──────
console.log('2026-11-02 전기온수기 가열능력');
ok(!/heatHrs/.test(src),'가열시간으로 나누는 식 폐지');
{const line=grab(/const autoKw=Qh>0[^\n]*/,'autoKw');
 const kw=new Function('Qh','dTw',line+'\nreturn autoKw;');
 ok(kw(45,45)===2.4,'세면기 5개 예제: 45 L/h × 45℃ × 1.163 = 2.36 → 2.4 kW');
 ok(kw(0,45)===0&&kw(45,0)===0,'급탕량·온도차 0 이면 0 kW');}

// ── 2026-11-04 급탕 동시사용률 — 학회 설계기준 표 4.5 (2003 ASHRAE) ──────
console.log('2026-11-04 급탕 동시사용률 표 4.5');
{const hw={};new Function('g',grab(/const HW_USE=\[[\s\S]*?\]\];/,'HW_USE')+'\ng.T=HW_USE;')(hw);
 const T45={house:[30,0.70],apt:[30,1.25],office:[30,2.00],hotel:[25,0.80],hosp:[25,0.60],factory:[40,1.00],school:[40,1.00],ymca:[40,1.00],gym:[40,1.00]};
 ok(hw.T.length===9,'표 4.5 건물 용도 9종');
 Object.entries(T45).forEach(([k,[p,h]])=>{const r=hw.T.find(x=>x[0]===k);ok(r&&r[2]===p&&r[3]===h,`표 4.5 ${k}: ${r&&r[2]}%·${r&&r[3]} ≠ ${p}%·${h}`);});}
ok(!/const SIM=\[\[3,100\]/.test(src),'실별 전기온수기 기구 수 곡선 폐지');
ok(/storeFactor=defH\('storeFactor',useRowR\[3\]\)/.test(src),'실별 저탕용량 계수 = 용도별 표 값');

// ── 2026-11-04 표 4.5 기구별 급탕량·보일러 가열능력 ──────
console.log('2026-11-04 표 4.5 기구별 급탕량');
{const fx={};new Function('g',grab(/const HW_USE=\[[\s\S]*?\]\];/,'HW_USE')+'\n'+grab(/const FX45=\[[\s\S]*?\]\]\];/,'FX45')+'\ng.U=HW_USE;g.F=FX45;')(fx);
 const col=k=>fx.U.findIndex(x=>x[0]===k), v=(f,k)=>{const r=fx.F.find(x=>x[0]===f);return r&&r[2][col(k)];};
 ok(fx.F.length===11&&fx.F.every(r=>r[2].length===9),'표 4.5 기구 11종 × 용도 9종');
 [['wb','factory',5.5],['wb','school',57],['sh','factory',850],['sh','hotel',284],['sh','office',114],['ks','hotel',114],['mop','apt',76],['ba','ymca',106],['hub','hosp',2270],['hydro','hosp',1520],['tub','gym',114],['cafe','factory',0],['pwb','gym',7.6]]
   .forEach(([f,k,e])=>ok(v(f,k)===e,`표 4.5 ${f}/${k}: ${v(f,k)} ≠ ${e}`));
 ok(JSON.stringify(v('dw','hotel'))==='[190,570]'&&JSON.stringify(v('dw','factory'))==='[75,380]','식기세척기 범위값');}
ok(!/가열능력은 계산하지 않는다/.test(src),'보일러: 가열능력 미계산 판단 폐지');
ok(/const reqKW=\(Qh>0&&Th>Tc\)\?Math\.ceil\(Qh\*\(Th-Tc\)\*1\.163\/100\)\/10:0;/.test(src),'보일러 가열능력 = Qh × (Th−Tc) × 1.163 (표 4.5 주 1)');
ok(/Qh\*mix\*pkMin\/60/.test(src),'피크 검산: 60℃ 기준 Qh 에 혼합계수');

// ── 2026-11-05 기준서 개정 반영 (AC-022 · AC-028 · AC-018) ──────
console.log('2026-11-05 기준서 개정 반영');
ok(/const HW_TC=\(\)=>\{const v=\(STATE\.project\|\|\{\}\)\.hwTc;return\(v!==undefined&&v!==''\)\?\(parseFloat\(v\)\|\|0\):5;\};/.test(src),'AC-022 Rule 6: 급수온도 프로젝트 공통 기본 5 ℃');
ok(!/tCold',15/.test(src)&&/tCold=HW_TC\(\)/.test(src)&&/Tc=HW_TC\(\)/.test(src),'실별·보일러 모두 공통 급수온도 (실별 15 ℃ 폐지)');
ok(/const HW_EFF=0\.75;/.test(src),'AC-022 Rule 1: 유효율 0.75');
ok(/const reqStoreCap=V\/HW_EFF;/.test(src),'실별 표준탱크: 공칭 × 0.75 ≥ V');
ok(/STD_TANK\.find\(v=>v\*HW_EFF>=stReq\)/.test(src),'보일러 권장 규격: 공칭 × 0.75 ≥ V');
ok(/const okB=stVol>0&&stEffV>=stReq&&okKW;/.test(src),'보일러 판정: 유효 저탕량');
ok(/gShBase\+=cnt\*gv\('shFlow',11\.4\)\*15;/.test(src)&&!/shLpf/.test(src),'AC-022 Rule 3: 샤워 1회 = 헤드 유량 × 15 분 (40 L 폐지)');
ok(/const circLph=\(retLen>0&&retDT>0\)\?retLen\*retWpm\/\(1\.163\*retDT\):0;/.test(src)&&!/circDiv/.test(src),'AC-022 Rule 5: 순환수량 = 길이 × 30 W/m ÷ (1.163 × 5 K) (Qh ÷ 8 폐지)');
ok(!/관내 용적 3 lit/.test(src),'환탕 생략 3 L 기준 폐지 (HW-001 30 m · 15 m)');
{const circ=(L,w,dt)=>L*w/(1.163*dt); ok(Math.round(circ(60,30,5))===310,'순환배관 60 m → 310 L/h');}
ok(/diffPa=d\('diffPa',17\)/.test(src)&&/diffPa=defV\('diffPa',26\)/.test(src)&&!/diffPa',30/.test(src),'AC-028 Rule 2-1: 기구 손실 = 유효풍속 동압 × 3 (ERV 17 · 인라인 26, 종전 30 폐지)');
ok(!/500 kW 약 27 ㎡/.test(src),'AC-018: 발전기실 루버 27 ㎡ 표기 폐지 (KDS 4.4)');
ok(!/AC-02[268] (2[268]\.|4-)/.test(src),'AC-022·026·028 옛 절 번호 제거');

console.log(`\n${pass} 통과 / ${fail} 실패`);
process.exit(fail?1:0);
