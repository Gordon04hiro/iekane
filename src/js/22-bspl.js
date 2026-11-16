/* ---------- 家計の決算書（BS・PL） ---------- */
let BSR=null; // {r,S,key}
const mix=(c,p)=>`color-mix(in srgb, ${c} ${p}%, var(--surface))`;
function bsAt(r,idx){return idx<0?r.bs0:r[idx].bs}
function bsQuick(r,S){
  const q=[['今',-1]];
  const add=(lab,age)=>{const i=r.findIndex(x=>x.a===age);if(i>=0&&!q.some(x=>x[1]===i))q.push([lab,i])};
  add('退職時（'+Math.round(n(S.workEnd))+'歳）',Math.round(n(S.workEnd)));add('65歳',65);add('80歳',80);add('95歳',95);
  return q;
}
function bsDiagram(b){
  const L=[['預貯金',b.cashP,ACCOL.cash],['NISA',b.nisa,ACCOL.nisa],['課税口座',b.taxa,ACCOL.tax],['iDeCo',b.ideco,ACCOL.ideco],['小規模企業共済',b.kyo,ACCOL.kyosai],['自宅',b.hv,'var(--muted)'],['投資用不動産',b.pv,'var(--planC)']].filter(x=>x[1]>0.5);
  const Rt=[['住宅ローン',b.hl,'var(--bad)'],['不動産ローン',b.pl,'var(--bad)'],['資金の不足',b.short,'var(--bad)']].filter(x=>x[1]>0.5);
  if(b.nw>=0) Rt.push(['純資産',b.nw,'var(--good)']); else L.push(['債務超過',-b.nw,'var(--bad)']);
  const tot=Math.max(1,L.reduce((s,x)=>s+x[1],0),Rt.reduce((s,x)=>s+x[1],0));
  const col=arr=>arr.map(([l,v,c])=>{const h=v/tot*100;return `<div class="blk" style="flex:${h.toFixed(3)} 0 0;background:${mix(c,h<6?45:28)};border-color:${c}" title="${l} ${fmt(v)}万円">${h>=7?`<span>${l}</span><b>${fmt(v)}</b>`:''}</div>`}).join('');
  return `<div class="bsd"><div class="bsh"><span>資産</span><span>負債・純資産</span></div><div class="bsc"><div class="bscol">${col(L)}</div><div class="bscol">${col(Rt)}</div></div></div>`;
}
function bsTable(b){
  const row=(l,v,cls='')=>v>0.5||cls?`<tr class="${cls}"><th>${l}</th><td class="${v<-0.5?'neg':''}">${fmt(v)}</td></tr>`:'';
  return `<div class="tacc"><table class="cf"><tbody><tr class="sec"><th>資産の部</th><td></td></tr>
   ${row('預貯金',b.cashP)}${row('NISA',b.nisa)}${row('課税口座の投資',b.taxa)}${row('iDeCo',b.ideco)}${row('小規模企業共済',b.kyo)}${row('金融資産 計',b.fin,'tot')}${row('自宅',b.hv)}${row('投資用不動産',b.pv)}${row('資産 合計',b.at,'bal')}</tbody></table>
  <table class="cf"><tbody><tr class="sec"><th>負債・純資産の部</th><td></td></tr>
   ${row('住宅ローン',b.hl)}${row('不動産ローン',b.pl)}${row('資金の不足（借入が必要な額）',b.short)}${row('負債 合計',b.dt,'tot')}${row('純資産',b.nw,'tot')}${row('負債・純資産 合計',b.dt+b.nw,'bal')}</tbody></table></div>`;
}
function plTable(p){
  const row=(l,v,cls='')=>Math.abs(v)>0.5||cls?`<tr class="${cls}"><th>${l}</th><td class="${v<-0.5?'neg':''}">${fmt(v)}</td></tr>`:'';
  return `<table class="cf pl"><tbody><tr class="sec"><th>収入</th><td></td></tr>
   ${row('給与（手取り）',p.salary)}${row('年金',p.pension)}${row('児童手当',p.allow)}${row('不動産収入（経費差引後）',p.prop)}${row('退職金・一時的な収入',p.one)}${row('保険などの受取',p.ins)}${row('運用益（利息・値上がり）',p.ret)}${p.gain>0?row('不動産の売却益',p.gain):''}${row('収入 合計',p.rev,'tot')}
   <tr class="sec"><th>費用</th><td></td></tr>
   ${row('生活費',p.live)}${row('家賃',p.rent)}${row('自宅の固定資産税・修繕',p.hcost)}${row('住宅ローンの利息',p.hint)}${row('自宅の価値の目減り',p.hdep)}${row('住宅購入の諸費用',p.buycost)}${row('教育費',p.edu)}${row('保険料',p.insp)}${row('車',p.car)}${row('一時的な支出',p.ev)}${row('不動産ローンの利息',p.pint)}${row('投資用不動産の価値の目減り',p.pdep)}${row('取り崩し時の税金',p.wtax)}${p.gain<0?row('不動産の売却損',-p.gain):''}${row('費用 合計',p.exp,'tot')}
   ${row('当期の収支（＝純資産の増減）',p.net,'bal')}</tbody></table>`;
}
function bsKPI(b,p,S){
  const eq=b.at>0?b.nw/b.at*100:0, yrs=n(S.live)>0?b.fin/(n(S.live)*12):0, ltv=b.hv>0?b.hl/b.hv*100:0, margin=p&&p.rev>0?p.net/p.rev*100:0;
  const k=(l,v,u,h,cls='')=>`<div class="kpi ${cls}"><span>${l}</span><b>${v}<small>${u}</small></b>${h?`<em>${h}</em>`:''}</div>`;
  return `<div class="kpis">${k('純資産',fmt(b.nw),'万円','資産−負債',b.nw<0?'bad':'')}${k('自己資本比率',eq.toFixed(0),'%','純資産÷資産',eq<0?'bad':eq<30?'warn':'')}${k('金融資産',fmt(b.fin),'万円','生活費の'+yrs.toFixed(1)+'年分',yrs<2?'warn':'')}${b.hv>0?k('自宅のローン比率',ltv.toFixed(0),'%','住宅ローン÷自宅の価値',ltv>100?'warn':''):''}${p?k('その年の収支',fmt(p.net),'万円','収入に対して'+(margin<0?'▲':'')+Math.abs(margin).toFixed(0)+'%',p.net<0?'bad':''):''}</div>`;
}
function nwChart(r,id){
  const W=680,H=230,L=58,R=14,T=14,B=30,nn=r.length;
  const S1=r.map(x=>x.bs.at),S2=r.map(x=>-x.bs.dt),S3=r.map(x=>x.bs.nw);
  const lo=Math.min(0,...S2,...S3),hi=Math.max(...S1,...S3);
  const tk=niceTicks(lo,hi,5),y0=tk[0],y1=tk[tk.length-1];
  const X=i=>L+(nn<=1?0:i*(W-L-R)/(nn-1)),Y=v=>T+(y1-v)*(H-T-B)/((y1-y0)||1);
  let g='';tk.forEach(v=>{g+=`<line x1="${L}" x2="${W-R}" y1="${Y(v)}" y2="${Y(v)}" stroke="var(--line)" stroke-width="${v===0?1.6:1}"${v===0?'':' stroke-dasharray="2 3"'}/><text x="${L-8}" y="${Y(v)+4}" text-anchor="end">${v<0?'▲':''}${Math.abs(v).toLocaleString('ja-JP')}</text>`});
  r.forEach((x,i)=>{if(x.a%10===0||i===0)g+=`<text x="${X(i)}" y="${H-10}" text-anchor="middle">${x.a}歳</text>`});
  const pl=(arr,c,d,w)=>`<polyline points="${arr.map((v,i)=>X(i).toFixed(1)+','+Y(v).toFixed(1)).join(' ')}" fill="none" stroke="${c}" stroke-width="${w}"${d?` stroke-dasharray="${d}"`:''}/>`;
  g+=`<polygon points="${X(0)},${Y(0)} ${S2.map((v,i)=>X(i).toFixed(1)+','+Y(v).toFixed(1)).join(' ')} ${X(nn-1)},${Y(0)}" fill="var(--bad)" fill-opacity=".12"/>`;
  g+=pl(S1,'var(--muted)','5 4',1.8)+pl(S2,'var(--bad)','',1.6)+pl(S3,'var(--good)','',2.6);
  g+=`<text x="${L-8}" y="${T-2}" text-anchor="end" style="font-size:10px">万円</text>`;
  return `<div class="legend" style="margin-bottom:6px"><span><span class="dot" style="background:var(--good)"></span>純資産</span><span><span class="dot" style="background:var(--muted)"></span>資産（点線）</span><span><span class="dot" style="background:var(--bad)"></span>負債（下向き）</span></div><svg class="chart" id="${id}" viewBox="0 0 ${W} ${H}" role="img" aria-label="純資産の推移">${g}</svg>`;
}
function renderBS(){
  const box=document.getElementById('bsbox'); if(!box||!BSR) return;
  const {r,S,key}=BSR; if(U.bsi==null||U.bsi>=r.length) U.bsi=-1;
  box.innerHTML=`<div class="bshead"><h3>家計の決算書（パターン${key}）</h3><p class="unit">会社の決算書と同じ考え方で、家計の「財産の状態（BS）」と「1年間のもうけ（PL）」をまとめたものです。ローンの元本返済や積立は、お金が資産から資産へ移るだけなので費用に入れていません。</p></div>
   <div class="bsctl"><div class="seg" id="bsq">${bsQuick(r,S).map(([l,i])=>`<button data-act="bsq" data-i="${i}" aria-pressed="${U.bsi===i}">${l}</button>`).join('')}</div>
    <label class="bsrange"><span class="unit">年齢を選ぶ</span><input type="range" id="bsage" min="-1" max="${r.length-1}" value="${U.bsi}" data-bsr="1"></label></div>
   <div id="bsinner"></div>
   <div class="chartcard" style="margin-top:14px"><div class="legend" style="margin-bottom:4px"><b style="color:var(--ink);font-size:14px">純資産の推移</b></div>${nwChart(r,'nw1')}<div class="unit">純資産は、すべての資産から借入を引いた「家計の正味の財産」です。自宅や投資用不動産は評価額で入れています。</div></div>`;
  fillBS();
}
function fillBS(){
  const el=document.getElementById('bsinner'); if(!el||!BSR) return;
  const {r,S}=BSR;
  const b=bsAt(r,U.bsi), row=U.bsi<0?r[0]:r[U.bsi], p=row.pl;
  const lab=U.bsi<0?`今（${r[0].y}年初め）`:`${row.a}歳（${row.y}年末）`;
  el.innerHTML=`<div class="bslab">${lab}の状態</div>${bsKPI(b,U.bsi<0?null:p,S)}
   <div class="bsgrid"><div><h4>バランスシート（BS）</h4>${bsDiagram(b)}${bsTable(b)}</div>
    <div><h4>損益計算書（PL）<span class="unit">　${row.a}歳${U.bsi<0?'（今年）':''}の1年間</span></h4>${plTable(p)}</div></div>`;
  document.querySelectorAll('#bsq button').forEach(x=>x.setAttribute('aria-pressed',String(+x.dataset.i===U.bsi)));
  const rg=document.getElementById('bsage'); if(rg&&+rg.value!==U.bsi) rg.value=U.bsi;
}
document.addEventListener('click',e=>{const b=e.target.closest('[data-act="bsq"]');if(b){U.bsi=+b.dataset.i;fillBS()}});
document.addEventListener('input',e=>{const t=e.target;if(t.dataset.bsr){U.bsi=+t.value;fillBS()}});

