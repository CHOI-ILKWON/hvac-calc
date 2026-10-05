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
  "Object.assign(g,{pws,omegaWB,omegaRH,WEATHER_DATA,INSUL_ZONE,UREF,UFLOOR,RT});"
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

console.log(`\n${pass} 통과 / ${fail} 실패`);
process.exit(fail?1:0);
