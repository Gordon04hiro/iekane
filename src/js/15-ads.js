/* ---------- 広告枠（AdSense と アフィリエイト） ----------
   ・AdSenseの枠は content/site.yml の adslots に番号を入れた枠だけ表示（空なら何も出ない）
   ・アフィリエイトは content/affiliates.yml にコードを入れたものだけ表示（PR表示つき）
   ・入力のたびに描き直す場所には置かない（広告が何度も読み込まれないように） */
function adUnit(name){
  const id=SITE_CFG.adsense,slot=(SITE_CFG.adslots||{})[name];
  if(!id||!slot) return '';
  return `<div class="ad" data-ad="${esc(name)}"><span class="ad-lab">スポンサーリンク</span><ins class="adsbygoogle" style="display:block" data-ad-client="${esc(id)}" data-ad-slot="${esc(slot)}" data-ad-format="auto" data-full-width-responsive="true"></ins></div>`;
}
function affBox(key){
  const a=AFF_ADS[key]; if(!a) return '';
  return `<aside class="pr-box" data-aff="${esc(key)}"><span class="pr-label">PR</span><b>${esc(a.h)}</b>${a.d?`<p>${esc(a.d)}</p>`:''}<div class="pr-code">${a.code}</div></aside>`;
}
/* ツールごとに出すアフィリエイト（affiliates.yml の名前） */
const TOOL_AFF={
 koujo:['住宅ローン比較'], souzokubun:['一括査定'],
 lifeplan:['証券口座','住宅ローン比較'], loan:['住宅ローン比較'], vs:['住宅ローン比較'], rent2buy:['住宅ローン比較'], prepay:['住宅ローン比較'],
 sell:['一括査定'], akiya:['空き家買取','一括査定'], souzoku:['一括査定'], souzoku2:['空き家買取','一括査定'], souzokuzei:['一括査定']
};
/* ページの下の広告（ツールのページだけ。#view の外なので、入力で描き直されない） */
function adTail(r){
  const box=document.getElementById('adtail'); if(!box) return;
  const affs=(TOOL_AFF[r]||[]).map(affBox).filter(Boolean);
  const unit=TOOL_AFF[r]?adUnit('ツールの下'):'';
  box.innerHTML=(affs.length?`<p class="pr-note">当サイトはアフィリエイト広告を利用しています。「PR」と表示したリンクから申し込みがあると、当サイトが報酬を受け取ることがあります。</p>${affs.join('')}`:'')+unit;
  box.hidden=!box.innerHTML;
}
/* 記事の本文に、見出し2つごとに広告を入れる */
function withMidAds(html){
  const u=adUnit('記事の中'); if(!u) return html;
  let k=0; return html.replace(/<h2/g,m=>{k++;return k>1&&k%2===1?u+m:m});
}
/* 新しく置かれた広告枠を読み込む */
function fillAds(){
  if(!SITE_CFG.adsense) return;
  document.querySelectorAll('ins.adsbygoogle:not([data-pushed])').forEach(el=>{el.setAttribute('data-pushed','1');try{(window.adsbygoogle=window.adsbygoogle||[]).push({})}catch(e){}});
}
