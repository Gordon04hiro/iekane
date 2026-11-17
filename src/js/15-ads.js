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
/* 自社の広告（site.yml の 自社広告）。where はどのページから来たか（utm_content） */
function houseAd(where){
  const h=SITE_CFG.houseAd;if(!h||!h['出す']||!h['リンク'])return '';
  const B=window.BASE||'',suf=h['保険']?'-hoken':'',L=String(h['リンク']);
  const url=L+(L.includes('?')?'&':'?')+'utm_source=sainomado&utm_medium=banner&utm_campaign=kj_banner&utm_content='+encodeURIComponent(where);
  return `<aside class="house-ad"><span class="pr-label">広告</span><a href="${esc(url)}" target="_blank" rel="noopener sponsored" data-house="${esc(where)}"><picture><source media="(max-width:600px)" srcset="${B}assets/ads/kj-rect${suf}.webp" width="600" height="500"><img src="${B}assets/ads/kj-wide${suf}.webp" width="1200" height="400" alt="${esc(h['名前']||'')}　住まいと資産のご相談（ホームページへ）" loading="lazy"></picture></a></aside>`;
}
const houseOn=(k,v)=>{const h=SITE_CFG.houseAd;return !!(h&&h['出す']&&[].concat(h[k]||[]).includes(v))};
document.addEventListener('click',e=>{const a=e.target.closest('[data-house]');if(a)track('kj_banner_click',{place:a.dataset.house})});
/* ツールごとに出すアフィリエイト（affiliates.yml の名前） */
const TOOL_AFF={
 chuko:['住宅ローン比較'], koujo:['住宅ローン比較','ふるさと納税'], furusato:['ふるさと納税'], souzokubun:['一括査定'],
 lifeplan:['証券口座','住宅ローン比較'], loan:['住宅ローン比較'], vs:['住宅ローン比較'], rent2buy:['住宅ローン比較'], prepay:['住宅ローン比較'],
 sell:['一括査定'], akiya:['空き家買取','一括査定'], souzoku:['一括査定'], souzoku2:['空き家買取','一括査定'], souzokuzei:['一括査定']
};
/* ページの下の広告（ツールのページだけ。#view の外なので、入力で描き直されない） */
function adTail(r){
  const box=document.getElementById('adtail'); if(!box) return;
  const affs=(TOOL_AFF[r]||[]).map(affBox).filter(Boolean);
  const unit=TOOL_AFF[r]?adUnit('ツールの下'):'';
  box.innerHTML=(houseOn('ツール',r)?houseAd('tool_'+r):'')+(affs.length?`<p class="pr-note">当サイトはアフィリエイト広告を利用しています。「PR」と表示したリンクから申し込みがあると、当サイトが報酬を受け取ることがあります。</p>${affs.join('')}`:'')+unit;
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
