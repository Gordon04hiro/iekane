/* ---------- 仲介手数料の計算（売買の媒介報酬の上限。数値は content/rules.yml の chukai） ---------- */
const CKR=CFG.chukai;
function chukaiCalc(V){
  const p=Math.max(0,n(V.price));let prev=0,base=0;const rows=[];
  for(const [to,rate] of CKR.tiers){const part=Math.max(0,Math.min(p,to)-prev);if(part>0){rows.push({from:prev,to:Math.min(p,to),rate,fee:part*rate/100});base+=part*rate/100}prev=to;if(p<=to)break}
  const tax=base*CKR.tax/100, total=base+tax;
  const low=p>0&&p<=CKR.lowPrice, lowTotal=CKR.lowCap*(1+CKR.tax/100);
  const quick=p>400?`（${p.toLocaleString('ja-JP')}万円×3%＋6万円）×1.1`:'';
  return {p,base,tax,total,rows,low,lowTotal,quick};
}
const yenFmt=v=>Math.round(v*10000).toLocaleString('ja-JP');
const CHUKAIDEF={id:'chukai',title:'仲介手数料の計算',example:'物件価格3,000万円',
  lead:'家を売るとき・買うときに不動産会社に払う仲介手数料の、法律で決められた上限額を計算します。売主・買主どちらの方にも使えます。',
  base:()=>({price:3000}),
  groups:[
   {g:'物件',f:[
    {id:'price',l:'物件の価格（売買価格）',u:'万円',h:'土地と建物の合計。建物に消費税がかかる場合は、その消費税を除いた額で計算します'}]}
  ],
  calc:V=>chukaiCalc(V),
  result(V,R){
    const tr=R.rows.map(r=>`<tr><th>${r.from.toLocaleString('ja-JP')}〜${r.to.toLocaleString('ja-JP')}万円の部分</th><td>${r.rate}%</td><td>${yenFmt(r.fee)}円</td></tr>`).join('');
    return `<h2>計算結果</h2><p class="unit">入力するたびに自動で更新されます。</p>
    <div class="panels"><section class="panel"><div class="ph"><span class="nm">仲介手数料の上限（1回の取引・片方の依頼者から）</span></div>
     <div class="kv">${kvRow('上限額（消費税込み）',yenFmt(R.total)+'<small>円</small>')}${kvRow('うち手数料（税抜き）',yenFmt(R.base)+'<small>円</small>')}${kvRow('うち消費税（'+CKR.tax+'%）',yenFmt(R.tax)+'<small>円</small>')}</div></section>
     ${R.low?`<section class="panel"><div class="ph"><span class="nm">800万円以下の物件の特例を使う場合</span></div><div class="kv">${kvRow('上限額（消費税込み）',yenFmt(R.lowTotal)+'<small>円</small>')}</div></section>`:''}</div>
    <section class="advice"><h3>計算のしかた</h3>
     <table class="cf fit"><thead><tr><th>価格の区分</th><th>料率</th><th>手数料（税抜き）</th></tr></thead><tbody>${tr}</tbody></table>
     ${R.quick?`<p>400万円を超える物件は、速算式 <b>${R.quick}</b> でも同じ額になります。</p>`:''}
     <ul>
      <li>これは<b>上限</b>です。この額より安い手数料で引き受ける会社もあります。</li>
      <li>売主と買主の両方から依頼を受けた不動産会社は、それぞれから上限まで受け取ることができます。</li>
      ${R.low?`<li>価格が${CKR.lowPrice}万円以下の物件は、現地の調査などに手間がかかることから、特例として<b>上限が${yenFmt(R.lowTotal)}円（税込み）</b>まで認められています。この特例を使うには、媒介契約のときに不動産会社と金額を合意しておく必要があります。</li>`:''}
      <li>仲介手数料は、売買契約のときに半分、引渡しのときに残りを払う形が多いです。</li>
     </ul></section>${ctaHTML()}
    <div class="taxnote">国土交通省の報酬告示にもとづく、売買の仲介手数料の<b>上限額</b>の計算です。賃貸の仲介手数料や、代理の場合の報酬は計算していません。実際の手数料は、媒介契約書でご確認ください。</div>`;
  },
  dock:(V,R)=>['仲介手数料の上限',yenFmt(R.total)+' 円'],
  related:['sell','loan','akiya']
};
Object.assign(GDEF,{chukai:CHUKAIDEF});
